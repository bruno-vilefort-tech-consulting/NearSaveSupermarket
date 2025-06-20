import {
  orders,
  orderItems,
  products,
  staffUsers,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, or, isNotNull } from "drizzle-orm";

export class OrderStorage {
  async getOrders(filters?: { status?: string }): Promise<OrderWithItems[]> {
    let query = db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        status: orders.status,
        fulfillmentMethod: orders.fulfillmentMethod,
        totalAmount: orders.totalAmount,
        lastManualStatus: orders.lastManualStatus,
        lastManualUpdate: orders.lastManualUpdate,
        notes: orders.notes,
        externalReference: orders.externalReference,
        pixPaymentId: orders.pixPaymentId,
        pixCopyPaste: orders.pixCopyPaste,
        pixExpirationDate: orders.pixExpirationDate,
        pixRefundId: orders.pixRefundId,
        refundAmount: orders.refundAmount,
        refundStatus: orders.refundStatus,
        refundDate: orders.refundDate,
        refundReason: orders.refundReason,
        supermarketPaymentStatus: orders.supermarketPaymentStatus,
        supermarketPaymentAmount: orders.supermarketPaymentAmount,
        supermarketPaymentDate: orders.supermarketPaymentDate,
        supermarketPaymentNotes: orders.supermarketPaymentNotes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt));

    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status));
    }

    const ordersResult = await query;

    // Get order items for each order
    const ordersWithItems: OrderWithItems[] = [];
    for (const order of ordersResult) {
      const items = await this.getOrderItems(order.id);
      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }

  async getOrdersForStaff(staffId: number, filters?: { status?: string }): Promise<OrderWithItems[]> {
    // Get orders that contain products from this staff
    let query = db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        status: orders.status,
        fulfillmentMethod: orders.fulfillmentMethod,
        totalAmount: orders.totalAmount,
        lastManualStatus: orders.lastManualStatus,
        lastManualUpdate: orders.lastManualUpdate,
        notes: orders.notes,
        externalReference: orders.externalReference,
        pixPaymentId: orders.pixPaymentId,
        pixCopyPaste: orders.pixCopyPaste,
        pixExpirationDate: orders.pixExpirationDate,
        pixRefundId: orders.pixRefundId,
        refundAmount: orders.refundAmount,
        refundStatus: orders.refundStatus,
        refundDate: orders.refundDate,
        refundReason: orders.refundReason,
        supermarketPaymentStatus: orders.supermarketPaymentStatus,
        supermarketPaymentAmount: orders.supermarketPaymentAmount,
        supermarketPaymentDate: orders.supermarketPaymentDate,
        supermarketPaymentNotes: orders.supermarketPaymentNotes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.createdByStaff, staffId))
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt));

    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status));
    }

    const ordersResult = await query;

    // Get order items for each order (only items from this staff)
    const ordersWithItems: OrderWithItems[] = [];
    for (const order of ordersResult) {
      const items = await this.getOrderItemsForStaff(order.id, staffId);
      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return undefined;
    }

    const items = await this.getOrderItems(id);

    return {
      ...order,
      items: items,
    };
  }

  async getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
    const ordersResult = await db
      .select()
      .from(orders)
      .where(eq(orders.customerPhone, phone))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems: OrderWithItems[] = [];
    for (const order of ordersResult) {
      const items = await this.getOrderItems(order.id);
      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    const ordersResult = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems: OrderWithItems[] = [];
    for (const order of ordersResult) {
      const items = await this.getOrderItems(order.id);
      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }

  async getOrderByExternalReference(externalReference: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.externalReference, externalReference))
      .limit(1);
    return order;
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values(orderData).returning();
      
      const orderItemsData = items.map(item => ({
        ...item,
        orderId: order.id,
      }));
      
      await tx.insert(orderItems).values(orderItemsData);
      
      return order;
    });
  }

  async createOrderAwaitingPayment(
    orderData: InsertOrder, 
    items: InsertOrderItem[], 
    pixData: {
      pixPaymentId: string;
      pixCopyPaste: string;
      pixExpirationDate: Date;
    }
  ): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        ...orderData,
        status: 'awaiting_payment',
        pixPaymentId: pixData.pixPaymentId,
        pixCopyPaste: pixData.pixCopyPaste,
        pixExpirationDate: pixData.pixExpirationDate,
      }).returning();
      
      const orderItemsData = items.map(item => ({
        ...item,
        orderId: order.id,
      }));
      
      await tx.insert(orderItems).values(orderItemsData);
      
      return order;
    });
  }

  async updateOrder(id: number, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  async updateOrderPaymentStatus(id: number, status: 'payment_confirmed' | 'payment_failed'): Promise<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  async updateOrderRefund(id: number, refundData: {
    pixRefundId?: string;
    refundAmount?: string;
    refundStatus?: string;
    refundDate?: Date;
    refundReason?: string;
  }): Promise<Order | undefined> {
    return this.updateOrder(id, refundData);
  }

  // Order Items operations
  async getOrderItems(orderId: number): Promise<Array<OrderItem & { 
    productName: string; 
    productCategory: string; 
    productImageUrl: string | null;
    supermarketName: string | null;
  }>> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        confirmationStatus: orderItems.confirmationStatus,
        createdAt: orderItems.createdAt,
        productName: products.name,
        productCategory: products.category,
        productImageUrl: products.imageUrl,
        supermarketName: staffUsers.companyName,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async getOrderItemsForStaff(orderId: number, staffId: number): Promise<Array<OrderItem & { 
    productName: string; 
    productCategory: string; 
    productImageUrl: string | null;
    supermarketName: string | null;
  }>> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        confirmationStatus: orderItems.confirmationStatus,
        createdAt: orderItems.createdAt,
        productName: products.name,
        productCategory: products.category,
        productImageUrl: products.imageUrl,
        supermarketName: staffUsers.companyName,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(
        and(
          eq(orderItems.orderId, orderId),
          eq(products.createdByStaff, staffId)
        )
      );
  }

  async updateOrderItemConfirmation(itemId: number, confirmationStatus: string): Promise<void> {
    await db
      .update(orderItems)
      .set({ confirmationStatus })
      .where(eq(orderItems.id, itemId));
  }

  // Check for expired PIX orders
  async checkExpiredPixOrders(): Promise<void> {
    console.log('🔍 [STARTUP] Verificando pedidos PIX expirados...');
    
    const now = new Date();
    const expiredOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'awaiting_payment'),
          isNotNull(orders.pixExpirationDate),
          sql`${orders.pixExpirationDate} < ${now}`
        )
      );

    console.log(`🔍 [STARTUP] Encontrados ${expiredOrders.length} pedidos PIX expirados`);

    for (const order of expiredOrders) {
      await this.updateOrderStatus(order.id, 'payment_expired');
      console.log(`⏰ [PIX EXPIRED] Pedido ${order.id} marcado como expirado`);
    }

    console.log('✅ [STARTUP] Verificação de pedidos PIX expirados concluída');
  }

  // Get all orders for admin
  async getAllOrders(filters?: { status?: string }, pagination?: { limit?: number; offset?: number }): Promise<OrderWithItems[]> {
    let query = db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    if (filters?.status) {
      query = query.where(eq(orders.status, filters.status));
    }

    if (pagination?.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination?.offset) {
      query = query.offset(pagination.offset);
    }

    const ordersResult = await query;

    const ordersWithItems: OrderWithItems[] = [];
    for (const order of ordersResult) {
      const items = await this.getOrderItems(order.id);
      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }
}