import { db } from "../db";
import { products, orders, orderItems, staffUsers } from "@shared/schema";
import { eq, count, sum, sql, and, gte, lt } from "drizzle-orm";
import { IStatisticsStorage } from "./types";

export class StatisticsStorage implements IStatisticsStorage {
  async getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const [activeProductsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isActive, 1));

    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    const [revenueResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    return {
      activeProducts: activeProductsResult.count,
      pendingOrders: pendingOrdersResult.count,
      totalRevenue: parseFloat(revenueResult.total || '0'),
    };
  }

  async getStatsForStaff(staffId: number): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const [activeProductsResult] = await db
      .select({ count: count() })
      .from(products)
      .where(and(
        eq(products.createdByStaff, staffId),
        eq(products.isActive, 1)
      ));

    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(and(
        eq(orders.supermarketId, staffId),
        eq(orders.status, 'pending')
      ));

    const [revenueResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(and(
        eq(orders.supermarketId, staffId),
        eq(orders.status, 'completed')
      ));

    return {
      activeProducts: activeProductsResult.count,
      pendingOrders: pendingOrdersResult.count,
      totalRevenue: parseFloat(revenueResult.total || '0'),
    };
  }

  async getMonthlyCompletedOrders(staffId: number): Promise<Array<{
    month: string;
    orders: Array<{
      id: number;
      date: string;
      amount: string;
    }>;
    totalAmount: string;
  }>> {
    const results = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
      })
      .from(orders)
      .where(and(
        eq(orders.supermarketId, staffId),
        eq(orders.status, 'completed'),
        gte(orders.createdAt, sql`NOW() - INTERVAL '12 months'`)
      ))
      .orderBy(orders.createdAt);

    const groupedByMonth = results.reduce((acc: any, order) => {
      const month = order.month;
      if (!acc[month]) {
        acc[month] = {
          month,
          orders: [],
          totalAmount: '0',
        };
      }
      
      acc[month].orders.push({
        id: order.id,
        date: order.createdAt?.toISOString().split('T')[0] || '',
        amount: order.totalAmount,
      });
      
      acc[month].totalAmount = (parseFloat(acc[month].totalAmount) + parseFloat(order.totalAmount)).toFixed(2);
      
      return acc;
    }, {});

    return Object.values(groupedByMonth);
  }

  async getPendingPaymentsForStaff(staffId: number): Promise<Array<{
    id: number;
    customerName: string;
    totalAmount: string;
    completedAt: string;
    dueDate: string;
    netAmount: string;
    status: string;
    orderItems: Array<{
      id: number;
      quantity: number;
      product: {
        name: string;
      };
    }>;
  }>> {
    const results = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        status: orders.status,
        orderItems: sql`json_agg(json_build_object(
          'id', ${orderItems.id},
          'quantity', ${orderItems.quantity},
          'product', json_build_object(
            'name', ${products.name}
          )
        ))`.as('orderItems')
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(
        eq(orders.supermarketId, staffId),
        eq(orders.status, 'completed'),
        eq(orders.supermarketPaymentStatus, 'pending')
      ))
      .groupBy(orders.id, orders.customerName, orders.totalAmount, orders.createdAt, orders.status)
      .orderBy(orders.createdAt);

    return results.map(result => ({
      id: result.id,
      customerName: result.customerName,
      totalAmount: result.totalAmount,
      completedAt: result.createdAt?.toISOString().split('T')[0] || '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      netAmount: (parseFloat(result.totalAmount) * 0.95).toFixed(2),
      status: result.status,
      orderItems: result.orderItems || [],
    }));
  }

  async getFinancialStatement(): Promise<Array<{
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
    const results = await db
      .select({
        orderId: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        supermarketId: orders.supermarketId,
        supermarketName: staffUsers.companyName,
        orderTotal: orders.totalAmount,
        orderDate: orders.createdAt,
        status: orders.status,
        paymentTerms: staffUsers.paymentTerms,
        items: sql`json_agg(json_build_object(
          'productName', ${products.name},
          'quantity', ${orderItems.quantity},
          'unitPrice', ${orderItems.priceAtTime},
          'totalPrice', (${orderItems.quantity} * ${orderItems.priceAtTime}::numeric)::text
        ))`.as('items')
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(staffUsers, eq(orders.supermarketId, staffUsers.id))
      .where(eq(orders.status, 'completed'))
      .groupBy(
        orders.id,
        orders.customerName,
        orders.customerEmail,
        orders.supermarketId,
        staffUsers.companyName,
        orders.totalAmount,
        orders.createdAt,
        orders.status,
        staffUsers.paymentTerms
      )
      .orderBy(orders.createdAt);

    return results.map(result => {
      const commercialRate = '5.00';
      const orderTotal = parseFloat(result.orderTotal);
      const rateAmount = (orderTotal * 0.05).toFixed(2);
      const amountToReceive = (orderTotal - parseFloat(rateAmount)).toFixed(2);
      const paymentTerms = result.paymentTerms || 30;
      const paymentDate = new Date(result.orderDate!.getTime() + paymentTerms * 24 * 60 * 60 * 1000);

      return {
        orderId: result.orderId,
        customerName: result.customerName,
        customerEmail: result.customerEmail,
        supermarketId: result.supermarketId!,
        supermarketName: result.supermarketName || 'Supermercado',
        orderTotal: result.orderTotal,
        commercialRate,
        rateAmount,
        amountToReceive,
        orderDate: result.orderDate,
        paymentTerms,
        paymentDate,
        status: result.status,
        items: result.items || [],
      };
    });
  }
}