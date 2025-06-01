import {
  users,
  products,
  orders,
  orderItems,
  ecoActions,
  staffUsers,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type EcoAction,
  type InsertEcoAction,
  type StaffUser,
  type InsertStaffUser,
  type ProductWithCreator,
  type OrderWithItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Staff user operations
  getStaffUserByEmail(email: string): Promise<StaffUser | undefined>;
  createStaffUser(staffUser: InsertStaffUser): Promise<StaffUser>;
  validateStaffUser(email: string, password: string): Promise<StaffUser | undefined>;
  
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
  
  // Eco-friendly actions
  createEcoAction(action: InsertEcoAction): Promise<EcoAction>;
  getEcoActionsByEmail(email: string): Promise<EcoAction[]>;
  updateUserEcoPoints(email: string, pointsToAdd: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${identifier} OR ${users.id} = ${identifier}`)
      .limit(1);
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

    // Calculate and apply eco-friendly rewards
    await this.calculateEcoRewards(order, items);

    return order;
  }

  // Helper method to calculate eco-friendly rewards
  private async calculateEcoRewards(order: Order, items: InsertOrderItem[]): Promise<void> {
    // Use email if available, otherwise use phone as identifier
    const customerIdentifier = order.customerEmail || order.customerPhone;
    if (!customerIdentifier) return;

    let totalEcoPoints = 0;
    const ecoActions: InsertEcoAction[] = [];

    // Get product details to calculate rewards
    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (product) {
        // Calculate days until expiration
        const expirationDate = new Date(product.expirationDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Award points based on how close to expiry (more points for closer to expiry)
        let pointsPerItem = 0;
        let actionDescription = "";

        if (daysUntilExpiry <= 1) {
          pointsPerItem = 15; // High reward for products expiring within 1 day
          actionDescription = `Salvou ${item.quantity}x ${product.name} do desperdício (expira em 1 dia)`;
        } else if (daysUntilExpiry <= 3) {
          pointsPerItem = 10; // Medium reward for products expiring within 3 days
          actionDescription = `Comprou ${item.quantity}x ${product.name} próximo ao vencimento (${daysUntilExpiry} dias)`;
        } else if (daysUntilExpiry <= 7) {
          pointsPerItem = 5; // Small reward for products expiring within a week
          actionDescription = `Compra sustentável: ${item.quantity}x ${product.name} (${daysUntilExpiry} dias para vencer)`;
        }

        if (pointsPerItem > 0) {
          const totalPoints = pointsPerItem * item.quantity;
          totalEcoPoints += totalPoints;

          ecoActions.push({
            customerEmail: customerIdentifier!,
            actionType: 'purchase_near_expiry',
            pointsEarned: totalPoints,
            description: actionDescription,
            orderId: order.id,
          });
        }
      }
    }

    // Bonus for large orders (reducing packaging waste)
    if (items.length >= 5) {
      const bonusPoints = 20;
      totalEcoPoints += bonusPoints;
      ecoActions.push({
        customerEmail: customerIdentifier!,
        actionType: 'large_order_discount',
        pointsEarned: bonusPoints,
        description: `Bônus pedido grande: ${items.length} itens (menos embalagens)`,
        orderId: order.id,
      });
    }

    // Check if it's customer's first order
    const existingOrders = order.customerEmail 
      ? await this.getOrdersByEmail(order.customerEmail)
      : await this.getOrdersByPhone(order.customerPhone!);
    if (existingOrders.length === 1) { // This is their first order
      const firstTimeBonus = 25;
      totalEcoPoints += firstTimeBonus;
      ecoActions.push({
        customerEmail: customerIdentifier!,
        actionType: 'first_time_customer',
        pointsEarned: firstTimeBonus,
        description: 'Bônus primeira compra sustentável!',
        orderId: order.id,
      });
    }

    // Save eco actions and update user points
    if (totalEcoPoints > 0) {
      for (const action of ecoActions) {
        await this.createEcoAction(action);
      }
      await this.updateUserEcoPoints(customerIdentifier!, totalEcoPoints);
    }
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

  // Eco-friendly actions implementation
  async createEcoAction(actionData: InsertEcoAction): Promise<EcoAction> {
    const [action] = await db
      .insert(ecoActions)
      .values(actionData)
      .returning();
    return action;
  }

  async getEcoActionsByEmail(email: string): Promise<EcoAction[]> {
    return await db
      .select()
      .from(ecoActions)
      .where(eq(ecoActions.customerEmail, email))
      .orderBy(desc(ecoActions.createdAt));
  }

  async updateUserEcoPoints(identifier: string, pointsToAdd: number): Promise<void> {
    // Try to update existing user by email or id
    const updateResult = await db
      .update(users)
      .set({ 
        ecoPoints: sql`COALESCE(${users.ecoPoints}, 0) + ${pointsToAdd}`,
        totalEcoActions: sql`COALESCE(${users.totalEcoActions}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(sql`${users.email} = ${identifier} OR ${users.id} = ${identifier}`)
      .returning();

    // If no user was updated, create a basic user entry for points tracking
    if (updateResult.length === 0) {
      try {
        await db
          .insert(users)
          .values({
            id: identifier.includes('@') ? crypto.randomUUID() : identifier,
            email: identifier.includes('@') ? identifier : null,
            ecoPoints: pointsToAdd,
            totalEcoActions: 1,
          })
          .onConflictDoNothing();
      } catch (error) {
        // If insertion fails due to conflict, try update again
        await db
          .update(users)
          .set({ 
            ecoPoints: sql`COALESCE(${users.ecoPoints}, 0) + ${pointsToAdd}`,
            totalEcoActions: sql`COALESCE(${users.totalEcoActions}, 0) + 1`,
            updatedAt: new Date()
          })
          .where(sql`${users.email} = ${identifier} OR ${users.id} = ${identifier}`);
      }
    }
  }
}

export const storage = new DatabaseStorage();
