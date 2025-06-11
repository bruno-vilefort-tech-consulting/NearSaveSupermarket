import { db } from "../db";
import { orders, orderItems, products, staffUsers, eq, desc, and, sql } from "@shared/schema";
import { type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type OrderWithItems } from "@shared/schema";
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
    let conditions = [eq(orders.createdByStaff, staffId)];
    
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