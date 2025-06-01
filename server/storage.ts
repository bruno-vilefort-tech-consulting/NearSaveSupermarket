import {
  users,
  products,
  orders,
  orderItems,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ProductWithCreator,
  type OrderWithItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Product operations
  getProducts(filters?: { category?: string; isActive?: boolean }): Promise<ProductWithCreator[]>;
  getProduct(id: number): Promise<ProductWithCreator | undefined>;
  createProduct(product: InsertProduct & { createdBy: string }): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Order operations
  getOrders(filters?: { status?: string }): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getOrdersByPhone(phone: string): Promise<OrderWithItems[]>;
  getOrdersByEmail(email: string): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Statistics
  getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Product operations
  async getProducts(filters?: { category?: string; isActive?: boolean }): Promise<ProductWithCreator[]> {
    let conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive ? 1 : 0));
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        originalPrice: products.originalPrice,
        discountPrice: products.discountPrice,
        quantity: products.quantity,
        expirationDate: products.expirationDate,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdBy: products.createdBy,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        createdByUser: users,
      })
      .from(products)
      .innerJoin(users, eq(products.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt));

    const results = await query;
    
    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      originalPrice: result.originalPrice,
      discountPrice: result.discountPrice,
      quantity: result.quantity,
      expirationDate: result.expirationDate,
      imageUrl: result.imageUrl,
      isActive: result.isActive,
      createdBy: result.createdByUser,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  async getProduct(id: number): Promise<ProductWithCreator | undefined> {
    const [result] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        originalPrice: products.originalPrice,
        discountPrice: products.discountPrice,
        quantity: products.quantity,
        expirationDate: products.expirationDate,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        createdByUser: users,
      })
      .from(products)
      .innerJoin(users, eq(products.createdBy, users.id))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      originalPrice: result.originalPrice,
      discountPrice: result.discountPrice,
      quantity: result.quantity,
      expirationDate: result.expirationDate,
      imageUrl: result.imageUrl,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      createdBy: result.createdByUser,
    };
  }

  async createProduct(productData: InsertProduct & { createdBy: string }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Order operations
  async getOrders(filters?: { status?: string }): Promise<OrderWithItems[]> {
    const query = db
      .select()
      .from(orders)
      .where(filters?.status ? eq(orders.status, filters.status) : undefined)
      .orderBy(desc(orders.createdAt));

    const orderResults = await query;
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orderResults.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items,
        };
      })
    );

    return ordersWithItems;
  }

  async getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerPhone, phone))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items,
        };
      })
    );

    return ordersWithItems;
  }

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items,
        };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      orderItems: items,
    };
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();

    // Insert order items and update product quantities
    const orderItemsData = items.map(item => ({
      ...item,
      orderId: order.id,
    }));

    await db.insert(orderItems).values(orderItemsData);

    // Update product quantities (reduce stock)
    for (const item of items) {
      await db
        .update(products)
        .set({ 
          quantity: sql`${products.quantity} - ${item.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, item.productId));
    }

    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Statistics
  async getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const [activeProductsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, 1));

    const [pendingOrdersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)` 
      })
      .from(orders)
      .where(eq(orders.status, "shipped"));

    return {
      activeProducts: activeProductsResult.count,
      pendingOrders: pendingOrdersResult.count,
      totalRevenue: revenueResult.total,
    };
  }
}

export const storage = new DatabaseStorage();
