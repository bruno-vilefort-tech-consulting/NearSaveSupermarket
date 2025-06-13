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
      // Using raw SQL for more reliable results
      const statusFilter = options?.status ? `AND o.status = '${options.status}'` : '';
      
      const query = `
        SELECT DISTINCT o.*, oi.id as item_id, oi.product_id, oi.quantity, oi.price_at_time, 
               p.name as product_name, p.original_price, p.discount_price
        FROM orders o 
        JOIN order_items oi ON o.id = oi.order_id 
        JOIN products p ON oi.product_id = p.id 
        WHERE p.created_by_staff = $1 ${statusFilter}
        ORDER BY o.created_at DESC
      `;

      const result = await db.execute(sql`
        SELECT DISTINCT o.*, oi.id as item_id, oi.product_id, oi.quantity, oi.price_at_time, 
               p.name as product_name, p.original_price, p.discount_price
        FROM orders o 
        JOIN order_items oi ON o.id = oi.order_id 
        JOIN products p ON oi.product_id = p.id 
        WHERE p.created_by_staff = ${staffId} ${sql.raw(statusFilter)}
        ORDER BY o.created_at DESC
      `);
      
      const ordersMap = new Map<number, OrderWithItems>();
      
      result.forEach((row: any) => {
        if (!ordersMap.has(row.id)) {
          ordersMap.set(row.id, {
            id: row.id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone,
            status: row.status,
            fulfillmentMethod: row.fulfillment_method,
            totalAmount: row.total_amount,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deliveryAddress: row.delivery_address,
            lastManualStatus: row.last_manual_status,
            lastManualUpdate: row.last_manual_update,
            externalReference: row.external_reference,
            pixPaymentId: row.pix_payment_id,
            pixRefundId: row.pix_refund_id,
            refundAmount: row.refund_amount,
            refundStatus: row.refund_status,
            refundDate: row.refund_date,
            refundReason: row.refund_reason,
            pixCopyPaste: row.pix_copy_paste,
            pixExpirationDate: row.pix_expiration_date,
            supermarketPaymentStatus: row.supermarket_payment_status,
            supermarketPaymentAmount: row.supermarket_payment_amount,
            supermarketPaymentDate: row.supermarket_payment_date,
            supermarketPaymentNotes: row.supermarket_payment_notes,
            orderItems: []
          } as any);
        }

        if (row.item_id) {
          ordersMap.get(row.id)!.orderItems.push({
            id: row.item_id,
            orderId: row.id,
            productId: row.product_id,
            quantity: row.quantity,
            priceAtTime: row.price_at_time,
            product: {
              id: row.product_id,
              name: row.product_name,
              originalPrice: row.original_price,
              discountPrice: row.discount_price
            }
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

  async confirmOrderItem(staffId: number, orderId: number, productId: number, notes?: string): Promise<boolean> {
    try {
      // Update the order item confirmation status
      await db
        .update(orderItems)
        .set({ 
          confirmationStatus: 'confirmed'
        })
        .where(and(
          eq(orderItems.orderId, orderId),
          eq(orderItems.productId, productId)
        ));

      return true;
    } catch (error) {
      console.error('Error confirming order item:', error);
      return false;
    }
  }

  async checkAllItemsConfirmed(orderId: number): Promise<boolean> {
    try {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      return items.every(item => item.confirmationStatus === 'confirmed');
    } catch (error) {
      console.error('Error checking items confirmation:', error);
      return false;
    }
  }
}