// Simplified storage implementation for backward compatibility
import { db } from "./db";
import {
  users,
  products,
  orders,
  orderItems,
  ecoActions,
  staffUsers,
  customers,
  adminUsers,
  passwordResetTokens,
  pushSubscriptions,
  marketingSubscriptions,
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
  type Customer,
  type InsertCustomer,
  type AdminUser,
  type InsertAdminUser,
  type ProductWithCreator,
  type OrderWithItems,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type PushSubscription,
  type InsertPushSubscription,
  type MarketingSubscription,
  type InsertMarketingSubscription,
} from "@shared/schema";
import { eq, desc, count, sum, and, or, sql, gt, gte, lt, lte, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

// Simple storage interface
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Staff user operations
  getStaffUserByEmail(email: string): Promise<StaffUser | undefined>;
  createStaffUser(staffData: InsertStaffUser): Promise<StaffUser>;
  updateStaffUser(id: number, updates: Partial<InsertStaffUser>): Promise<StaffUser | undefined>;
  getAllStaffUsers(): Promise<StaffUser[]>;
  
  // Customer operations
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customerData: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  validateCustomer(email: string, password: string): Promise<Customer | undefined>;
  
  // Product operations
  getProducts(filters?: any): Promise<ProductWithCreator[]>;
  getProductById(id: number): Promise<ProductWithCreator | undefined>;
  createProduct(productData: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  
  // Order operations
  createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  getOrdersByCustomer(customerEmail: string, options?: { status?: string }): Promise<OrderWithItems[]>;
  getOrdersByStaff(staffId: number, options?: { status?: string }): Promise<OrderWithItems[]>;
  getOrderById(id: number): Promise<OrderWithItems | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(options?: { status?: string }): Promise<OrderWithItems[]>;
  getOrdersByEmail(email: string): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  
  // Other operations
  createEcoAction(actionData: InsertEcoAction): Promise<EcoAction>;
  getEcoActionsByUser(userEmail: string): Promise<EcoAction[]>;
  createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  checkExpiredPixOrders(): Promise<void>;
}

// Implementation using the original storage logic with modular organization
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, identifier));
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set(user)
        .where(eq(users.id, user.id))
        .returning();
      return updatedUser;
    } else {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    }
  }

  // Staff operations
  async getStaffUserByEmail(email: string): Promise<StaffUser | undefined> {
    const [staff] = await db.select().from(staffUsers).where(eq(staffUsers.email, email));
    return staff;
  }

  async createStaffUser(staffData: InsertStaffUser): Promise<StaffUser> {
    const hashedPassword = await bcrypt.hash(staffData.password, 10);
    const [staff] = await db
      .insert(staffUsers)
      .values({ ...staffData, password: hashedPassword })
      .returning();
    return staff;
  }

  async updateStaffUser(id: number, updates: Partial<InsertStaffUser>): Promise<StaffUser | undefined> {
    const [staff] = await db
      .update(staffUsers)
      .set(updates)
      .where(eq(staffUsers.id, id))
      .returning();
    return staff;
  }

  async getAllStaffUsers(): Promise<StaffUser[]> {
    return await db.select().from(staffUsers);
  }

  // Customer operations
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const hashedPassword = await bcrypt.hash(customerData.password, 10);
    const [customer] = await db
      .insert(customers)
      .values({ ...customerData, password: hashedPassword })
      .returning();
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  // Product operations
  async getProducts(filters?: any): Promise<ProductWithCreator[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.createdBy, users.id))
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .orderBy(desc(products.createdAt));

    return results.map(result => ({
      ...result.products,
      createdBy: result.users || result.staff_users || null
    })) as ProductWithCreator[];
  }

  async getProductById(id: number): Promise<ProductWithCreator | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.createdBy, users.id))
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      ...result.products,
      createdBy: result.users || result.staff_users || null
    } as ProductWithCreator;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  // Order operations
  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [order] = await db.insert(orders).values(orderData).returning();
    
    const createdItems = await db
      .insert(orderItems)
      .values(items.map(item => ({ ...item, orderId: order.id })))
      .returning();

    return {
      ...order,
      orderItems: createdItems as any
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
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    return results.map(order => ({ ...order, orderItems: [] })) as OrderWithItems[];
  }

  async getOrdersByStaff(staffId: number, options?: { status?: string }): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    return results.map(order => ({ ...order, orderItems: [] })) as OrderWithItems[];
  }

  async getOrderById(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      orderItems: items.map(item => ({
        ...item.order_items!,
        product: item.products!
      }))
    } as OrderWithItems;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(options?: { status?: string }): Promise<OrderWithItems[]> {
    let conditions = [];
    if (options?.status) {
      conditions.push(eq(orders.status, options.status));
    }

    const results = await db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    return results.map(order => ({ ...order, orderItems: [] })) as OrderWithItems[];
  }

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));

    return results.map(order => ({ ...order, orderItems: [] })) as OrderWithItems[];
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    return this.getOrderById(id);
  }

  // Eco actions
  async createEcoAction(actionData: InsertEcoAction): Promise<EcoAction> {
    const [action] = await db.insert(ecoActions).values(actionData).returning();
    return action;
  }

  async getEcoActionsByUser(userEmail: string): Promise<EcoAction[]> {
    return await db
      .select()
      .from(ecoActions)
      .where(eq(ecoActions.customerEmail, userEmail))
      .orderBy(desc(ecoActions.createdAt));
  }

  // Auth tokens
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, 0),
        gt(passwordResetTokens.expiresAt, new Date())
      ));
    return resetToken;
  }

  async checkExpiredPixOrders(): Promise<void> {
    // Update expired PIX orders to "expired" status
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    try {
      await db
        .update(orders)
        .set({ 
          status: "expired"
        })
        .where(and(
          eq(orders.status, "awaiting_payment"),
          isNotNull(orders.pixPaymentId),
          lt(orders.createdAt, thirtyMinutesAgo)
        ));
    } catch (error) {
      console.error('Error updating expired PIX orders:', error);
    }
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();