import {
  orders,
  orderItems,
  products,
  staffUsers,
  customers,
  ecoActions,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export class AnalyticsStorage {
  // Basic statistics
  async getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const [activeProducts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, 1));

    const [pendingOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const [revenue] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)` })
      .from(orders)
      .where(eq(orders.status, "completed"));

    return {
      activeProducts: activeProducts.count,
      pendingOrders: pendingOrders.count,
      totalRevenue: Number(revenue.total),
    };
  }

  // Statistics for specific staff
  async getStatsForStaff(staffId: number): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const [activeProducts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, 1),
          eq(products.createdByStaff, staffId)
        )
      );

    // Get pending orders that contain products from this staff
    const [pendingOrders] = await db
      .select({ count: sql<number>`count(distinct ${orders.id})` })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.status, "pending"),
          eq(products.createdByStaff, staffId)
        )
      );

    // Calculate revenue from completed orders containing this staff's products
    const [revenue] = await db
      .select({ 
        total: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.priceAtTime}::numeric), 0)` 
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.status, "completed"),
          eq(products.createdByStaff, staffId),
          eq(orderItems.confirmationStatus, "confirmed")
        )
      );

    return {
      activeProducts: activeProducts.count,
      pendingOrders: pendingOrders.count,
      totalRevenue: Number(revenue.total),
    };
  }

  // Monthly completed orders summary
  async getMonthlyCompletedOrders(staffId: number): Promise<Array<{
    month: string;
    orders: Array<{
      id: number;
      customerName: string;
      total: string;
      completedAt: Date;
    }>;
  }>> {
    const completedOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.status, "completed"),
          eq(products.createdByStaff, staffId)
        )
      )
      .groupBy(orders.id, orders.customerName, orders.totalAmount, orders.updatedAt)
      .orderBy(desc(orders.updatedAt));

    // Group by month
    const monthlyData = new Map<string, Array<{
      id: number;
      customerName: string;
      total: string;
      completedAt: Date;
    }>>();

    for (const order of completedOrders) {
      const month = order.updatedAt!.toISOString().slice(0, 7); // YYYY-MM format
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, []);
      }
      
      monthlyData.get(month)!.push({
        id: order.id,
        customerName: order.customerName,
        total: order.totalAmount,
        completedAt: order.updatedAt!,
      });
    }

    return Array.from(monthlyData.entries()).map(([month, orders]) => ({
      month,
      orders,
    }));
  }

  // Financial statement operations
  async getFinancialStatement(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: number;
  }): Promise<Array<{
    orderId: number;
    customerName: string;
    customerEmail: string | null;
    supermarketId: number;
    supermarketName: string;
    orderTotal: string;
    commercialRate: string;
    rateAmount: string;
    amountToReceive: string;
    orderDate: Date | null;
    paymentTerms: number;
    paymentDate: Date;
    status: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
    }>;
  }>> {
    let query = db
      .select({
        orderId: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        status: orders.status,
        createdAt: orders.createdAt,
        supermarketId: staffUsers.id,
        supermarketName: staffUsers.companyName,
        commercialRate: staffUsers.commercialRate,
        paymentTerms: staffUsers.paymentTerms,
        orderTotal: orders.totalAmount,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(orders.status, "completed"))
      .groupBy(
        orders.id,
        orders.customerName,
        orders.customerEmail,
        orders.status,
        orders.createdAt,
        orders.totalAmount,
        staffUsers.id,
        staffUsers.companyName,
        staffUsers.commercialRate,
        staffUsers.paymentTerms
      )
      .orderBy(desc(orders.createdAt));

    const conditions = [eq(orders.status, "completed")];

    if (filters?.startDate) {
      conditions.push(gte(orders.createdAt, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(orders.createdAt, filters.endDate));
    }

    if (filters?.staffId) {
      conditions.push(eq(products.createdByStaff, filters.staffId));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    const ordersData = await query;

    // Process each order to calculate amounts and get items
    const result = [];
    for (const orderData of ordersData) {
      const items = await db
        .select({
          productName: products.name,
          quantity: orderItems.quantity,
          unitPrice: orderItems.priceAtTime,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(orderItems.orderId, orderData.orderId),
            eq(products.createdByStaff, orderData.supermarketId)
          )
        );

      const itemsWithTotal = items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity * parseFloat(item.unitPrice)).toFixed(2),
      }));

      const orderTotal = parseFloat(orderData.orderTotal);
      const commercialRate = parseFloat(orderData.commercialRate || "0");
      const rateAmount = (orderTotal * commercialRate / 100);
      const amountToReceive = orderTotal - rateAmount;

      const paymentDate = new Date(orderData.createdAt!);
      paymentDate.setDate(paymentDate.getDate() + (orderData.paymentTerms || 30));

      result.push({
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        supermarketId: orderData.supermarketId,
        supermarketName: orderData.supermarketName,
        orderTotal: orderData.orderTotal,
        commercialRate: orderData.commercialRate || "0",
        rateAmount: rateAmount.toFixed(2),
        amountToReceive: amountToReceive.toFixed(2),
        orderDate: orderData.createdAt,
        paymentTerms: orderData.paymentTerms || 30,
        paymentDate: paymentDate,
        status: orderData.status,
        items: itemsWithTotal,
      });
    }

    return result;
  }

  // Admin dashboard statistics
  async getAdminDashboardStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeStaff: number;
    pendingStaff: number;
    totalCustomers: number;
    recentOrders: Array<{
      id: number;
      customerName: string;
      totalAmount: string;
      status: string;
      createdAt: Date | null;
    }>;
  }> {
    const [totalOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    const [totalRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)` })
      .from(orders)
      .where(eq(orders.status, "completed"));

    const [activeStaff] = await db
      .select({ count: sql<number>`count(*)` })
      .from(staffUsers)
      .where(eq(staffUsers.status, "approved"));

    const [pendingStaff] = await db
      .select({ count: sql<number>`count(*)` })
      .from(staffUsers)
      .where(eq(staffUsers.status, "pending"));

    const [totalCustomers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers);

    const recentOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return {
      totalOrders: totalOrders.count,
      totalRevenue: Number(totalRevenue.total),
      activeStaff: activeStaff.count,
      pendingStaff: pendingStaff.count,
      totalCustomers: totalCustomers.count,
      recentOrders,
    };
  }

  // Platform analytics
  async getPlatformAnalytics(startDate: Date): Promise<{
    ordersOverTime: Array<{ date: string; count: number; revenue: number }>;
    topCategories: Array<{ category: string; sales: number }>;
    topSupermarkets: Array<{ name: string; orders: number; revenue: number }>;
    customerGrowth: Array<{ date: string; newCustomers: number }>;
  }> {
    // Orders over time
    const ordersOverTime = await db
      .select({
        date: sql<string>`date(${orders.createdAt})`,
        count: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, startDate))
      .groupBy(sql`date(${orders.createdAt})`)
      .orderBy(sql`date(${orders.createdAt})`);

    // Top categories
    const topCategories = await db
      .select({
        category: products.category,
        sales: sql<number>`sum(${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(gte(orders.createdAt, startDate))
      .groupBy(products.category)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(10);

    // Top supermarkets
    const topSupermarkets = await db
      .select({
        name: staffUsers.companyName,
        orders: sql<number>`count(distinct ${orders.id})`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(gte(orders.createdAt, startDate))
      .groupBy(staffUsers.id, staffUsers.companyName)
      .orderBy(desc(sql`count(distinct ${orders.id})`))
      .limit(10);

    // Customer growth
    const customerGrowth = await db
      .select({
        date: sql<string>`date(${customers.createdAt})`,
        newCustomers: sql<number>`count(*)`,
      })
      .from(customers)
      .where(gte(customers.createdAt, startDate))
      .groupBy(sql`date(${customers.createdAt})`)
      .orderBy(sql`date(${customers.createdAt})`);

    return {
      ordersOverTime,
      topCategories,
      topSupermarkets,
      customerGrowth,
    };
  }

  // Staff financial data
  async getStaffFinancialData(filters: {
    staffId: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
    pendingPayments: number;
  }> {
    let baseConditions = [
      eq(products.createdByStaff, filters.staffId),
      eq(orders.status, "completed"),
      eq(orderItems.confirmationStatus, "confirmed")
    ];

    if (filters.startDate) {
      baseConditions.push(gte(orders.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      baseConditions.push(lte(orders.createdAt, filters.endDate));
    }

    // Total revenue and orders
    const [totals] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.priceAtTime}::numeric), 0)`,
        totalOrders: sql<number>`count(distinct ${orders.id})`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...baseConditions));

    const averageOrderValue = totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;

    // Revenue by month
    const revenueByMonth = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        revenue: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.priceAtTime}::numeric), 0)`,
        orders: sql<number>`count(distinct ${orders.id})`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...baseConditions))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    // Pending payments (orders completed but not paid to supermarket)
    const [pendingPayments] = await db
      .select({
        amount: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.priceAtTime}::numeric), 0)`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(products.createdByStaff, filters.staffId),
          eq(orders.status, "completed"),
          eq(orderItems.confirmationStatus, "confirmed"),
          eq(orders.supermarketPaymentStatus, "pending")
        )
      );

    return {
      totalRevenue: Number(totals.totalRevenue),
      totalOrders: totals.totalOrders,
      averageOrderValue: Number(averageOrderValue),
      revenueByMonth,
      pendingPayments: Number(pendingPayments.amount),
    };
  }

  // Supermarket payments for admin
  async getSupermarketPayments(filters?: {
    status?: string;
    staffId?: number;
  }): Promise<Array<{
    orderId: number;
    supermarketName: string;
    orderTotal: string;
    paymentStatus: string;
    paymentAmount: string | null;
    paymentDate: Date | null;
    notes: string | null;
  }>> {
    let query = db
      .select({
        orderId: orders.id,
        supermarketName: staffUsers.companyName,
        orderTotal: orders.totalAmount,
        paymentStatus: orders.supermarketPaymentStatus,
        paymentAmount: orders.supermarketPaymentAmount,
        paymentDate: orders.supermarketPaymentDate,
        notes: orders.supermarketPaymentNotes,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(orders.status, "completed"))
      .groupBy(
        orders.id,
        staffUsers.companyName,
        orders.totalAmount,
        orders.supermarketPaymentStatus,
        orders.supermarketPaymentAmount,
        orders.supermarketPaymentDate,
        orders.supermarketPaymentNotes
      )
      .orderBy(desc(orders.createdAt));

    const conditions = [eq(orders.status, "completed")];

    if (filters?.status) {
      conditions.push(eq(orders.supermarketPaymentStatus, filters.status));
    }

    if (filters?.staffId) {
      conditions.push(eq(products.createdByStaff, filters.staffId));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }

    return await query;
  }
}