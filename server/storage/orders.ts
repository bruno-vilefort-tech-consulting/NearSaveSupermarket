import { db } from "../db";
import { orders, orderItems, products, staffUsers, type Order, type InsertOrder, type InsertOrderItem, type OrderWithItems } from "@shared/schema";
import { eq, desc, and, lte, sql } from "drizzle-orm";
import { IOrderStorage } from "./types";

export class OrderStorage implements IOrderStorage {
  async getOrders(filters?: { status?: string }): Promise<OrderWithItems[]> {
    let conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }

    const results = await db
      .select({
        id: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        externalReference: orders.externalReference,
        pixPaymentId: orders.pixPaymentId,
        pixCopyPaste: orders.pixCopyPaste,
        pixExpirationDate: orders.pixExpirationDate,
        pixRefundId: orders.pixRefundId,
        refundAmount: orders.refundAmount,
        refundStatus: orders.refundStatus,
        refundDate: orders.refundDate,
        refundReason: orders.refundReason,
        lastManualStatus: orders.lastManualStatus,
        lastManualUpdate: orders.lastManualUpdate,
        notes: orders.notes,
        supermarketId: orders.supermarketId,
        supermarketPaymentStatus: orders.supermarketPaymentStatus,
        supermarketPaymentNotes: orders.supermarketPaymentNotes,
        orderItems: sql`json_agg(json_build_object(
          'id', ${orderItems.id},
          'orderId', ${orderItems.orderId},
          'productId', ${orderItems.productId},
          'quantity', ${orderItems.quantity},
          'priceAtTime', ${orderItems.priceAtTime},
          'confirmationStatus', ${orderItems.confirmationStatus},
          'createdAt', ${orderItems.createdAt},
          'product', json_build_object(
            'id', ${products.id},
            'name', ${products.name},
            'description', ${products.description},
            'category', ${products.category},
            'originalPrice', ${products.originalPrice},
            'discountPrice', ${products.discountPrice},
            'quantity', ${products.quantity},
            'expirationDate', ${products.expirationDate},
            'imageUrl', ${products.imageUrl},
            'isActive', ${products.isActive},
            'createdBy', ${products.createdBy},
            'createdByStaff', ${products.createdByStaff},
            'createdAt', ${products.createdAt},
            'updatedAt', ${products.updatedAt}
          )
        ))`.as('orderItems')
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt));

    return results as OrderWithItems[];
  }

  async getOrdersByStaff(staffId: number, filters?: { status?: string }): Promise<OrderWithItems[]> {
    let conditions = [eq(orders.supermarketId, staffId)];
    
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }

    const results = await db
      .select({
        id: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        externalReference: orders.externalReference,
        pixPaymentId: orders.pixPaymentId,
        pixCopyPaste: orders.pixCopyPaste,
        pixExpirationDate: orders.pixExpirationDate,
        pixRefundId: orders.pixRefundId,
        refundAmount: orders.refundAmount,
        refundStatus: orders.refundStatus,
        refundDate: orders.refundDate,
        refundReason: orders.refundReason,
        lastManualStatus: orders.lastManualStatus,
        lastManualUpdate: orders.lastManualUpdate,
        notes: orders.notes,
        supermarketId: orders.supermarketId,
        supermarketPaymentStatus: orders.supermarketPaymentStatus,
        supermarketPaymentNotes: orders.supermarketPaymentNotes,
        orderItems: sql`json_agg(json_build_object(
          'id', ${orderItems.id},
          'orderId', ${orderItems.orderId},
          'productId', ${orderItems.productId},
          'quantity', ${orderItems.quantity},
          'priceAtTime', ${orderItems.priceAtTime},
          'confirmationStatus', ${orderItems.confirmationStatus},
          'createdAt', ${orderItems.createdAt},
          'product', json_build_object(
            'id', ${products.id},
            'name', ${products.name},
            'description', ${products.description},
            'category', ${products.category},
            'originalPrice', ${products.originalPrice},
            'discountPrice', ${products.discountPrice},
            'quantity', ${products.quantity},
            'expirationDate', ${products.expirationDate},
            'imageUrl', ${products.imageUrl},
            'isActive', ${products.isActive},
            'createdBy', ${products.createdBy},
            'createdByStaff', ${products.createdByStaff},
            'createdAt', ${products.createdAt},
            'updatedAt', ${products.updatedAt}
          )
        ))`.as('orderItems')
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(...conditions))
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt));

    return results as OrderWithItems[];
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [result] = await db
      .select({
        id: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        externalReference: orders.externalReference,
        pixPaymentId: orders.pixPaymentId,
        pixCopyPaste: orders.pixCopyPaste,
        pixExpirationDate: orders.pixExpirationDate,
        pixRefundId: orders.pixRefundId,
        refundAmount: orders.refundAmount,
        refundStatus: orders.refundStatus,
        refundDate: orders.refundDate,
        refundReason: orders.refundReason,
        lastManualStatus: orders.lastManualStatus,
        lastManualUpdate: orders.lastManualUpdate,
        notes: orders.notes,
        supermarketId: orders.supermarketId,
        supermarketPaymentStatus: orders.supermarketPaymentStatus,
        supermarketPaymentNotes: orders.supermarketPaymentNotes,
        orderItems: sql`json_agg(json_build_object(
          'id', ${orderItems.id},
          'orderId', ${orderItems.orderId},
          'productId', ${orderItems.productId},
          'quantity', ${orderItems.quantity},
          'priceAtTime', ${orderItems.priceAtTime},
          'confirmationStatus', ${orderItems.confirmationStatus},
          'createdAt', ${orderItems.createdAt},
          'product', json_build_object(
            'id', ${products.id},
            'name', ${products.name},
            'description', ${products.description},
            'category', ${products.category},
            'originalPrice', ${products.originalPrice},
            'discountPrice', ${products.discountPrice},
            'quantity', ${products.quantity},
            'expirationDate', ${products.expirationDate},
            'imageUrl', ${products.imageUrl},
            'isActive', ${products.isActive},
            'createdBy', ${products.createdBy},
            'createdByStaff', ${products.createdByStaff},
            'createdAt', ${products.createdAt},
            'updatedAt', ${products.updatedAt}
          )
        ))`.as('orderItems')
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.id, id))
      .groupBy(orders.id);

    return result as OrderWithItems | undefined;
  }

  async getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.customerPhone, phone))
      .orderBy(desc(orders.createdAt));

    return results as OrderWithItems[];
  }

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));

    return results as OrderWithItems[];
  }

  async getOrderByExternalReference(externalReference: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.externalReference, externalReference));
    return order;
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();

    await db
      .insert(orderItems)
      .values(items.map(item => ({ ...item, orderId: order.id })));

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
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
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
      .set({
        externalReference,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  async checkExpiredPixOrders(): Promise<void> {
    await db
      .update(orders)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.status, 'awaiting_payment'),
          lte(orders.pixExpirationDate, new Date())
        )
      );
  }
}