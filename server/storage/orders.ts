import { db } from "../db";
import { orders, orderItems, products, staffUsers } from "@shared/schema";
import { type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type OrderWithItems } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { IOrderStorage } from "./types";

export class OrderStorage implements IOrderStorage {
  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();

    const createdItems = await db
      .insert(orderItems)
      .values(items.map(item => ({ ...item, orderId: order.id })))
      .returning();

    const orderWithItems = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.id, order.id));

    return {
      ...order,
      orderItems: createdItems.map(item => ({
        ...item,
        product: orderWithItems.find(owi => owi.order_items?.id === item.id)?.products || {} as any
      }))
    } as OrderWithItems;
  }

  async getOrdersByCustomer(customerEmail: string, options?: { status?: string }): Promise<OrderWithItems[]> {
    let conditions = [eq(orders.customerEmail, customerEmail)];
    
    if (options?.status) {
      conditions.push(eq(orders.status, options.status));
    }

    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    const ordersMap = new Map<number, OrderWithItems>();
    
    results.forEach(result => {
      const order = result.orders;
      const item = result.order_items;
      const product = result.products;

      if (!ordersMap.has(order.id)) {
        ordersMap.set(order.id, {
          ...order,
          orderItems: []
        } as OrderWithItems);
      }

      if (item && product) {
        ordersMap.get(order.id)!.orderItems.push({
          ...item,
          product
        } as any);
      }
    });

    return Array.from(ordersMap.values());
  }

  async getOrdersByStaff(staffId: number, options?: { status?: string }): Promise<OrderWithItems[]> {
    try {
      // Find orders that contain products created by this staff
      let orderConditions = [];
      
      if (options?.status) {
        orderConditions.push(eq(orders.status, options.status));
      }

      const results = await db
        .select({
          order: orders,
          orderItem: orderItems,
          product: products
        })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(and(
          eq(products.createdByStaff, staffId),
          ...(orderConditions.length > 0 ? orderConditions : [])
        ))
        .orderBy(desc(orders.createdAt));

      const ordersMap = new Map<number, OrderWithItems>();
      
      results.forEach(result => {
        const order = result.order;
        const item = result.orderItem;
        const product = result.product;

        if (!ordersMap.has(order.id)) {
          ordersMap.set(order.id, {
            ...order,
            orderItems: []
          } as OrderWithItems);
        }

        if (item && product) {
          ordersMap.get(order.id)!.orderItems.push({
            ...item,
            product
          } as any);
        }
      });

      return Array.from(ordersMap.values());
    } catch (error) {
      console.error('Error fetching orders by staff:', error);
      return [];
    }
  }

  async getOrderById(id: number): Promise<OrderWithItems | undefined> {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.id, id));

    if (results.length === 0) return undefined;

    const order = results[0].orders;
    const items = results
      .filter(r => r.order_items && r.products)
      .map(r => ({
        ...r.order_items!,
        product: r.products!
      }));

    return {
      ...order,
      orderItems: items
    } as OrderWithItems;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderPaymentInfo(id: number, paymentData: {
    pixPaymentId?: string;
    pixCopyPaste?: string;
    pixExpirationDate?: Date;
    paymentMethod?: string;
    paymentStatus?: string;
  }): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        ...paymentData,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderRefund(id: number, refundData: {
    refundId: string;
    refundAmount: number;
    refundStatus: string;
    refundReason?: string;
  }): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        refundId: refundData.refundId,
        refundAmount: refundData.refundAmount.toString(),
        refundStatus: refundData.refundStatus,
        refundReason: refundData.refundReason,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getOrders(filters?: { status?: string }): Promise<OrderWithItems[]> {
    return this.getAllOrders(filters);
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    return this.getOrderById(id);
  }

  async getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.customerPhone, phone))
      .orderBy(desc(orders.createdAt));

    const ordersMap = new Map<number, OrderWithItems>();
    
    results.forEach(result => {
      const order = result.orders;
      const item = result.order_items;
      const product = result.products;

      if (!ordersMap.has(order.id)) {
        ordersMap.set(order.id, {
          ...order,
          orderItems: []
        } as OrderWithItems);
      }

      if (item && product) {
        ordersMap.get(order.id)!.orderItems.push({
          ...item,
          product
        } as any);
      }
    });

    return Array.from(ordersMap.values());
  }

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    return this.getOrdersByCustomer(email);
  }

  async getOrderByExternalReference(externalReference: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.externalReference, externalReference));
    return order;
  }

  async createOrderAwaitingPayment(orderData: InsertOrder, items: InsertOrderItem[], pixData: {
    pixPaymentId: string;
    pixCopyPaste: string;
    pixExpirationDate: Date;
  }): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...orderData,
        pixPaymentId: pixData.pixPaymentId,
        pixCopyPaste: pixData.pixCopyPaste,
        pixExpirationDate: pixData.pixExpirationDate,
        status: 'awaiting_payment'
      })
      .returning();

    await db
      .insert(orderItems)
      .values(items.map(item => ({ ...item, orderId: order.id })));

    return order;
  }

  async updateOrderPaymentStatus(id: number, status: 'payment_confirmed' | 'payment_failed'): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ 
        paymentStatus: status,
        status: status === 'payment_confirmed' ? 'pending' : 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderItemConfirmationStatus(itemId: number, status: 'confirmed' | 'removed' | 'pending'): Promise<void> {
    await db
      .update(orderItems)
      .set({ confirmationStatus: status })
      .where(eq(orderItems.id, itemId));
  }

  async updateOrderExternalReference(orderId: number, externalReference: string): Promise<void> {
    await db
      .update(orders)
      .set({ externalReference })
      .where(eq(orders.id, orderId));
  }

  async checkExpiredPixOrders(): Promise<void> {
    await db
      .update(orders)
      .set({ status: 'expired' })
      .where(
        and(
          eq(orders.status, 'awaiting_payment'),
          sql`pix_expiration_date < NOW()`
        )
      );
  }

  async getAllOrders(options?: { status?: string; page?: number; limit?: number }): Promise<OrderWithItems[]> {
    let conditions = [];
    
    if (options?.status) {
      conditions.push(eq(orders.status, options.status));
    }

    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(options?.limit || 50)
      .offset(((options?.page || 1) - 1) * (options?.limit || 50));

    const ordersMap = new Map<number, OrderWithItems>();
    
    results.forEach(result => {
      const order = result.orders;
      const item = result.order_items;
      const product = result.products;

      if (!ordersMap.has(order.id)) {
        ordersMap.set(order.id, {
          ...order,
          orderItems: []
        } as OrderWithItems);
      }

      if (item && product) {
        ordersMap.get(order.id)!.orderItems.push({
          ...item,
          product
        } as any);
      }
    });

    return Array.from(ordersMap.values());
  }
}