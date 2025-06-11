import {
  users,
  products,
  orders,
  orderItems,
  ecoActions,
  staffUsers,
  customers,
  passwordResetTokens,
  adminUsers,
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
  pushSubscriptions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, not, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Staff user operations
  getStaffUserByEmail(email: string): Promise<StaffUser | undefined>;
  getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined>;
  createStaffUser(staffUser: InsertStaffUser): Promise<StaffUser>;
  validateStaffUser(email: string, password: string): Promise<StaffUser | undefined>;
  updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void>;
  
  // Staff approval operations
  getPendingStaffUsers(): Promise<StaffUser[]>;
  approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined>;
  rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined>;
  
  // Customer operations
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  validateCustomer(email: string, password: string): Promise<Customer | undefined>;
  
  // Admin user operations
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  validateAdminUser(email: string, password: string): Promise<AdminUser | undefined>;
  
  // Product operations
  getProducts(filters?: { category?: string; isActive?: boolean }): Promise<ProductWithCreator[]>;
  getProduct(id: number): Promise<ProductWithCreator | undefined>;
  createProduct(product: InsertProduct & { createdBy: string }): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Staff-specific product operations
  getProductsByStaff(staffId: number): Promise<ProductWithCreator[]>;
  createProductForStaff(product: InsertProduct & { createdByStaff: number }): Promise<Product>;
  
  // Sponsorship operations
  updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void>;
  
  // Order operations
  getOrders(filters?: { status?: string }): Promise<OrderWithItems[]>;
  getOrdersByStaff(staffId: number, filters?: { status?: string }): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getOrdersByPhone(phone: string): Promise<OrderWithItems[]>;
  getOrdersByEmail(email: string): Promise<OrderWithItems[]>;
  getOrderByExternalReference(externalReference: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  createOrderAwaitingPayment(order: InsertOrder, items: InsertOrderItem[], pixData: {
    pixPaymentId: string;
    pixCopyPaste: string;
    pixExpirationDate: Date;
  }): Promise<Order>;
  updateOrderPaymentStatus(id: number, status: 'payment_confirmed' | 'payment_failed'): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Statistics
  getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }>;
  
  // Statistics for specific staff
  getStatsForStaff(staffId: number): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }>;
  
  // Monthly completed orders summary
  getMonthlyCompletedOrders(staffId: number): Promise<Array<{
    month: string;
    orders: Array<{
      id: number;
      date: string;
      amount: string;
    }>;
    totalAmount: string;
  }>>;
  
  // Pending payments for staff
  getPendingPaymentsForStaff(staffId: number): Promise<Array<{
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
  }>>;
  
  // Eco-friendly actions
  createEcoAction(action: InsertEcoAction): Promise<EcoAction>;
  getEcoActionsByEmail(email: string): Promise<EcoAction[]>;
  updateUserEcoPoints(email: string, pointsToAdd: number): Promise<void>;
  
  // Customer specific operations
  getSupermarketsWithProducts(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    productCount: number;
  }>>;
  getSupermarketsWithLocations(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
    productCount: number;
    hasPromotions: boolean;
  }>>;
  getProductsBySupermarket(staffId: number): Promise<ProductWithCreator[]>;
  
  // Password reset operations
  createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  updateCustomerPassword(email: string, newPassword: string): Promise<void>;
  
  // Staff password reset operations
  createStaffPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getStaffPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markStaffTokenAsUsed(token: string): Promise<void>;
  updateStaffPassword(email: string, newPassword: string): Promise<void>;
  
  // Push notification operations
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByEmail(email: string): Promise<PushSubscription[]>;
  removePushSubscription(id: number): Promise<void>;
  
  // PIX refund operations
  updateOrderRefund(orderId: number, refundData: {
    pixRefundId: string;
    refundAmount: string;
    refundStatus: string;
    refundDate: Date;
    refundReason: string;
  }): Promise<void>;
  
  // Order item confirmation operations
  updateOrderItemConfirmationStatus(itemId: number, status: 'confirmed' | 'removed' | 'pending'): Promise<void>;
  
  // Order external reference operations
  updateOrderExternalReference(orderId: number, externalReference: string): Promise<void>;
  
  // Marketing subscription operations
  createMarketingSubscription(subscription: InsertMarketingSubscription): Promise<MarketingSubscription>;
  getMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined>;
  getActiveMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined>;
  updateMarketingSubscriptionStatus(id: number, status: string): Promise<MarketingSubscription | undefined>;
  
  // Financial statement operations
  getFinancialStatement(): Promise<Array<{
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
  }>>;
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

  // Staff user operations
  async getStaffUserByEmail(email: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.email, email));
    return staffUser;
  }

  async createStaffUser(staffUserData: InsertStaffUser): Promise<StaffUser> {
    const [staffUser] = await db
      .insert(staffUsers)
      .values(staffUserData)
      .returning();
    return staffUser;
  }

  async validateStaffUser(email: string, password: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(and(
        eq(staffUsers.email, email),
        eq(staffUsers.password, password),
        eq(staffUsers.isActive, 1)
      ));
    return staffUser;
  }

  async getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.cnpj, cnpj));
    return staffUser;
  }

  async updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, id));
  }

  // Staff approval operations
  async getPendingStaffUsers(): Promise<StaffUser[]> {
    const pendingStaff = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.approvalStatus, 'pending'))
      .orderBy(desc(staffUsers.createdAt));
    return pendingStaff;
  }

  async approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .update(staffUsers)
      .set({
        approvalStatus: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    return staffUser;
  }

  async rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .update(staffUsers)
      .set({
        approvalStatus: 'rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    return staffUser;
  }

  // Customer operations
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.cpf, cpf));
    return customer || undefined;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const hashedPassword = await bcrypt.hash(customerData.password, 10);
    const [customer] = await db
      .insert(customers)
      .values({
        ...customerData,
        password: hashedPassword,
      })
      .returning();
    return customer;
  }

  async validateCustomer(email: string, password: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    if (!customer || customer.isActive !== 1) return undefined;

    const isValid = await bcrypt.compare(password, customer.password);
    return isValid ? customer : undefined;
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
        createdByStaff: products.createdByStaff,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
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
      createdBy: result.createdBy,
      createdByStaff: result.createdByStaff,
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

  // Staff-specific product operations
  async getProductsByStaff(staffId: number): Promise<ProductWithCreator[]> {
    try {
      const results = await db
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
          createdByStaff: products.createdByStaff,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          createdBy: {
            id: staffUsers.id,
            companyName: staffUsers.companyName,
            email: staffUsers.email,
          },
        })
        .from(products)
        .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
        .where(and(eq(products.isActive, 1), eq(products.createdByStaff, staffId)));

      return results.map(result => ({
        ...result,
        createdBy: result.createdBy || { id: 0, companyName: "Unknown", email: "unknown@email.com" }
      }));
    } catch (error) {
      console.error("Error fetching products by staff:", error);
      return [];
    }
  }

  async createProductForStaff(productData: InsertProduct & { createdByStaff: number }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
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

  async getOrdersByStaff(staffId: number, filters?: { status?: string }): Promise<OrderWithItems[]> {
    // First, get all orders that contain products created by this staff
    let whereConditions = [
      eq(products.createdByStaff, staffId),
      // Exclude orders with expired payments and awaiting payment from staff interface
      not(eq(orders.status, 'payment_expired')),
      not(eq(orders.status, 'awaiting_payment'))
    ];
    
    if (filters?.status) {
      whereConditions.push(eq(orders.status, filters.status));
    }
    const staffOrders = await db
      .selectDistinct({
        id: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        status: orders.status,
        fulfillmentMethod: orders.fulfillmentMethod,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        externalReference: orders.externalReference,
        pixPaymentId: orders.pixPaymentId,
        pixRefundId: orders.pixRefundId,
        refundAmount: orders.refundAmount,
        refundStatus: orders.refundStatus,
        refundDate: orders.refundDate,
        refundReason: orders.refundReason,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt));

    // Filter out payment_expired and awaiting_payment orders from the results
    const filteredOrders = staffOrders.filter(order => 
      order.status !== 'payment_expired' && order.status !== 'awaiting_payment'
    );

    // Auto-check PIX refund status for orders with processing refunds
    const ordersWithUpdatedRefunds = await Promise.all(
      filteredOrders.map(async (order) => {
        if (order.pixRefundId && order.refundStatus === 'processing' && order.pixPaymentId) {
          try {
            console.log(`🔄 Auto-checking refund status for order ${order.id}`);
            const { checkRefundStatus } = await import('./mercadopago.js');
            const statusResponse = await checkRefundStatus(order.pixPaymentId);
            
            if (statusResponse.success && statusResponse.status !== 'processing') {
              console.log(`📝 Auto-updating refund status from processing to ${statusResponse.status}`);
              await this.updateOrderRefund(order.id, {
                pixRefundId: statusResponse.refundId,
                refundAmount: statusResponse.amount?.toString() || order.refundAmount || '0',
                refundStatus: statusResponse.status,
                refundDate: new Date(),
                refundReason: order.refundReason || 'Verificação automática de status'
              });
              
              // Return updated order data
              return {
                ...order,
                refundStatus: statusResponse.status,
                refundAmount: statusResponse.amount?.toString() || order.refundAmount
              };
            }
          } catch (error) {
            console.log(`⚠️ Auto-check failed for order ${order.id}:`, error);
          }
        }
        return order;
      })
    );

    const ordersWithItems = await Promise.all(
      ordersWithUpdatedRefunds.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            confirmationStatus: orderItems.confirmationStatus,
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
            confirmationStatus: orderItems.confirmationStatus,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        // Get supermarket info from the first product's staff
        let supermarketName = '';
        if (items.length > 0 && items[0].product.createdByStaff) {
          const staff = await db
            .select({
              companyName: staffUsers.companyName,
            })
            .from(staffUsers)
            .where(eq(staffUsers.id, items[0].product.createdByStaff))
            .limit(1);
          
          if (staff.length > 0) {
            supermarketName = staff[0].companyName;
          }
        }

        return {
          ...order,
          supermarketName,
          orderItems: items,
        };
      })
    );

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

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    console.log(`🔍 MONITORING: Querying orders for email ${email}`);
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));
      
    console.log(`📊 MONITORING: Found ${customerOrders.length} orders for ${email}:`, 
      customerOrders.map(o => ({ id: o.id, status: o.status, updated: o.updatedAt })));

    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            priceAtTime: orderItems.priceAtTime,
            confirmationStatus: orderItems.confirmationStatus,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        // Get supermarket info from the first product's staff
        let supermarketName = '';
        if (items.length > 0 && items[0].product.createdByStaff) {
          const staff = await db
            .select({
              companyName: staffUsers.companyName,
            })
            .from(staffUsers)
            .where(eq(staffUsers.id, items[0].product.createdByStaff))
            .limit(1);
          
          if (staff.length > 0) {
            supermarketName = staff[0].companyName;
          }
        }

        return {
          ...order,
          supermarketName,
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

    // Iniciar monitoramento de proteção para este pedido
    console.log(`🛡️ STARTING PROTECTION: Order ${order.id} created, initiating protection system`);
    this.startOrderProtection(order.id);

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
        status: 'awaiting_payment',
        lastManualStatus: 'awaiting_payment', // Fix: Ensure protection system doesn't revert status
        lastManualUpdate: new Date(),
        pixPaymentId: pixData.pixPaymentId,
        pixCopyPaste: pixData.pixCopyPaste,
        pixExpirationDate: pixData.pixExpirationDate,
      })
      .returning();

    // Insert order items but don't update product quantities yet
    const orderItemsData = items.map(item => ({
      ...item,
      orderId: order.id,
    }));

    await db.insert(orderItems).values(orderItemsData);

    // Iniciar monitoramento de proteção para este pedido PIX também
    console.log(`💳 Order ${order.id} created with status awaiting_payment, initiating PIX protection system`);
    this.startOrderProtection(order.id);
    
    return order;
  }

  async updateOrderPaymentStatus(id: number, status: 'payment_confirmed' | 'payment_failed'): Promise<Order | undefined> {
    if (status === 'payment_confirmed') {
      // Directly update to pending status to avoid double updates
      const [updatedOrder] = await db
        .update(orders)
        .set({ 
          status: 'pending',
          lastManualStatus: 'pending',
          lastManualUpdate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) return undefined;

      // Process stock updates and rewards asynchronously to avoid blocking
      setImmediate(async () => {
        try {
          // Update product quantities (reduce stock)
          const orderItemsList = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, id));

          for (const item of orderItemsList) {
            await db
              .update(products)
              .set({ 
                quantity: sql`${products.quantity} - ${item.quantity}`,
                updatedAt: new Date()
              })
              .where(eq(products.id, item.productId));
          }

          // Calculate and apply eco-friendly rewards
          await this.calculateEcoRewards(updatedOrder, orderItemsList);
          
          console.log(`✅ Order ${id} payment confirmed, stock updated, status advanced to pending`);
        } catch (error) {
          console.error(`❌ Error processing order ${id} post-payment:`, error);
        }
      });

      return updatedOrder;
    } else if (status === 'payment_failed') {
      const [order] = await db
        .update(orders)
        .set({ 
          status,
          lastManualUpdate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();

      console.log(`❌ Order ${id} payment failed, stock not affected`);
      return order;
    }

    return undefined;
  }

  private protectionMap = new Map<number, NodeJS.Timeout>();

  async checkExpiredPixOrders(): Promise<void> {
    try {
      console.log('🔍 [STARTUP] Verificando pedidos PIX expirados...');
      
      const expiredOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.status, 'awaiting_payment'),
            isNotNull(orders.pixPaymentId),
            isNotNull(orders.pixExpirationDate),
            sql`${orders.pixExpirationDate} < NOW()`
          )
        );

      console.log(`🔍 [STARTUP] Encontrados ${expiredOrders.length} pedidos PIX expirados`);

      for (const order of expiredOrders) {
        if (order.pixPaymentId) {
          console.log(`⏰ [STARTUP] Processando pedido expirado ${order.id} com PIX ${order.pixPaymentId}`);
          
          try {
            // Importar dinamicamente para evitar dependência circular
            const { cancelPixPayment } = await import('./mercadopago');
            
            const cancelResult = await cancelPixPayment({
              paymentId: order.pixPaymentId,
              reason: 'Pagamento expirado - cancelamento na inicialização'
            });
            
            if (cancelResult.success) {
              console.log(`✅ [STARTUP] PIX ${order.pixPaymentId} cancelado no Mercado Pago`);
            } else {
              console.log(`⚠️ [STARTUP] Falha ao cancelar PIX ${order.pixPaymentId}: ${cancelResult.error}`);
            }
          } catch (error) {
            console.error(`❌ [STARTUP] Erro ao cancelar PIX para pedido ${order.id}:`, error);
          }

          // Atualizar status do pedido para payment_expired
          await db
            .update(orders)
            .set({ 
              status: 'payment_expired',
              lastManualStatus: 'payment_expired',
              lastManualUpdate: new Date(),
              updatedAt: new Date()
            })
            .where(eq(orders.id, order.id));
            
          console.log(`✅ [STARTUP] Pedido ${order.id} marcado como payment_expired`);
        }
      }

      console.log('✅ [STARTUP] Verificação de pedidos PIX expirados concluída');
    } catch (error) {
      console.error('❌ [STARTUP] Erro na verificação de pedidos PIX expirados:', error);
    }
  }

  private async startOrderProtection(orderId: number): Promise<void> {
    console.log(`🛡️ PROTECTION INITIATED: Starting protection for order ${orderId}`);
    
    // Verificar de forma mais agressiva com intervals menores
    const checkTimes = [5000, 10000, 15000, 20000, 30000, 45000, 60000]; // 5s, 10s, 15s, 20s, 30s, 45s, 1min
    
    checkTimes.forEach((delay, index) => {
      const timeoutId = setTimeout(async () => {
        try {
          console.log(`🔍 PROTECTION CHECK ${index + 1}: Checking order ${orderId} after ${delay}ms`);
          
          const [currentOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
          
          if (currentOrder) {
            console.log(`📊 PROTECTION DATA: Order ${orderId} - Status: ${currentOrder.status}, LastManual: ${currentOrder.lastManualStatus}`);
            
            // Verificar se o PIX expirou e cancelar no Mercado Pago
            if (currentOrder.status === 'awaiting_payment' && 
                currentOrder.pixExpirationDate && 
                currentOrder.pixPaymentId &&
                new Date() > new Date(currentOrder.pixExpirationDate)) {
              
              console.log(`⏰ PIX EXPIRED: Order ${orderId} PIX payment expired, attempting to cancel in Mercado Pago`);
              
              try {
                // Importar dinamicamente para evitar dependência circular
                const { cancelPixPayment } = await import('./mercadopago');
                
                const cancelResult = await cancelPixPayment({
                  paymentId: currentOrder.pixPaymentId,
                  reason: 'Pagamento expirado automaticamente'
                });
                
                if (cancelResult.success) {
                  console.log(`✅ PIX CANCELLED: PIX payment ${currentOrder.pixPaymentId} cancelled in Mercado Pago`);
                  
                  // Atualizar status do pedido para payment_expired
                  await db
                    .update(orders)
                    .set({ 
                      status: 'payment_expired',
                      lastManualStatus: 'payment_expired',
                      lastManualUpdate: new Date(),
                      updatedAt: new Date()
                    })
                    .where(eq(orders.id, orderId));
                    
                  console.log(`✅ ORDER EXPIRED: Order ${orderId} status updated to payment_expired`);
                } else {
                  console.log(`⚠️ PIX CANCEL FAILED: Could not cancel PIX ${currentOrder.pixPaymentId}: ${cancelResult.error}`);
                }
              } catch (error) {
                console.error(`❌ PIX CANCEL ERROR: Error cancelling PIX payment for order ${orderId}:`, error);
              }
            }
            
            if (currentOrder.lastManualStatus && currentOrder.status !== currentOrder.lastManualStatus) {
              // Skip protection for Stripe orders awaiting payment - this is expected behavior
              if (currentOrder.status === 'awaiting_payment' && currentOrder.externalReference && !currentOrder.pixPaymentId) {
                console.log(`💳 STRIPE ORDER: Order ${orderId} is Stripe payment awaiting confirmation - protection skipped`);
              } else {
                console.log(`🚨 PROTECTION ACTIVATED: Automatic status change detected for order ${orderId} from ${currentOrder.status} back to ${currentOrder.lastManualStatus}`);
                
                // Use the secure updateOrderStatus method with PROTECTION_SYSTEM identifier
                await this.updateOrderStatus(orderId, currentOrder.lastManualStatus, 'PROTECTION_SYSTEM');
                  
                console.log(`✅ PROTECTION SUCCESS: Order ${orderId} status reverted to ${currentOrder.lastManualStatus}`);
              }
            } else {
              console.log(`✓ PROTECTION OK: Order ${orderId} status unchanged`);
            }
          }
        } catch (error) {
          console.error(`❌ PROTECTION ERROR: Failed to protect order ${orderId}:`, error);
        }
        
        // Limpar o timeout do mapa após execução
        if (index === checkTimes.length - 1) {
          this.protectionMap.delete(orderId);
          console.log(`🛡️ PROTECTION ENDED: Protection cycle completed for order ${orderId}`);
        }
      }, delay);
      
      // Armazenar o timeout no mapa para possível limpeza
      this.protectionMap.set(orderId, timeoutId);
    });
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

  async updateOrderStatus(id: number, status: string, changedBy: string = 'UNKNOWN'): Promise<Order | undefined> {
    // ABSOLUTE SECURITY: Block ALL automatic updates except authorized ones
    console.log(`🔒 SECURITY CHECK: Order ${id} status change attempt to ${status} by ${changedBy}`);
    
    // Allow specific automatic operations
    const allowedAutomaticOperations = [
      'TIMER_EXPIRATION', // PIX payment expiration
      'PIX_WEBHOOK',      // Mercado Pago webhook confirmations
      'PIX_MANUAL_CHECK', // Manual PIX payment verification
      'CUSTOMER_REQUEST', // Customer cancellation requests
      'STAFF_REQUEST',    // Staff cancellation requests
      'PROTECTION_SYSTEM', // Order protection system
      'STRIPE_PAYMENT'    // Stripe payment confirmations
    ];
    
    // Only allow explicit staff updates or authorized automatic operations
    if (!changedBy.startsWith('STAFF_') && !allowedAutomaticOperations.includes(changedBy)) {
      console.log(`🛑 SECURITY BLOCK: Unauthorized status change blocked for order ${id}`);
      console.log(`🛑 Attempted by: ${changedBy}`);
      console.log(`🛑 Target status: ${status}`);
      throw new Error(`SECURITY: Order status changes are restricted to authorized staff only. Source: ${changedBy}`);
    }
    
    // Additional validation for automatic operations
    if (changedBy === 'TIMER_EXPIRATION') {
      if (status !== 'payment_expired') {
        throw new Error(`SECURITY: TIMER_EXPIRATION can only set status to payment_expired`);
      }
    }

    // First check current order status
    const [currentOrder] = await db.select().from(orders).where(eq(orders.id, id));
    if (!currentOrder) {
      throw new Error(`Order ${id} not found`);
    }

    // Prevent status changes on cancelled orders (except cancellation type refinement)
    const isCancellationTypeRefinement = 
      currentOrder.status === 'cancelled' && 
      (status === 'cancelled-customer' || status === 'cancelled-staff');
    
    const isAlreadyCancelled = 
      currentOrder.status === 'cancelled' || 
      currentOrder.status === 'cancelled-customer' || 
      currentOrder.status === 'cancelled-staff';
    
    if (isAlreadyCancelled && !isCancellationTypeRefinement) {
      console.log(`🛑 CANCELLED ORDER: Cannot update status of cancelled order ${id} from ${currentOrder.status} to ${status}`);
      throw new Error(`Cannot update status of cancelled order ${id}. Cancelled orders are final.`);
    }

    // Prevent status changes on completed orders (except to cancelled)
    if (currentOrder.status === 'completed' && status !== 'cancelled') {
      console.log(`🛑 COMPLETED ORDER: Cannot update status of completed order ${id} to ${status}`);
      throw new Error(`Cannot update status of completed order ${id}. Only cancellation is allowed for completed orders.`);
    }
    
    // Log authorized update
    console.log(`✅ AUTHORIZED: Staff ${changedBy} updating order ${id} from ${currentOrder.status} to ${status}`);
    
    try {
      // Preparar atualizações do pedido
      const updateData: any = { 
        status, 
        lastManualStatus: status,
        lastManualUpdate: new Date(),
        updatedAt: new Date() 
      };

      // Se o pedido está sendo completado, definir status de pagamento ao supermercado
      if (status === 'completed') {
        updateData.supermarketPaymentStatus = 'aguardando_pagamento';
        updateData.supermarketPaymentAmount = currentOrder.totalAmount;
        console.log(`💰 PAGAMENTO SUPERMERCADO: Pedido ${id} completado - definindo status pagamento para 'aguardando_pagamento'`);
      }

      // Fazer a atualização e salvar como último status manual
      const [order] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();
      
      console.log(`✅ SUCCESS: Order ${id} status updated to ${status} by ${changedBy}`);
      
      return order;
    } catch (error) {
      console.error(`❌ ERROR: Failed to update order ${id}:`, error);
      throw error;
    }
  }

  // Monthly completed orders summary
  async getMonthlyCompletedOrders(staffId: number): Promise<Array<{
    month: string;
    orders: Array<{
      id: number;
      date: string;
      amount: string;
    }>;
    totalAmount: string;
  }>> {
    const completedOrders = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.status, 'completed'),
          eq(products.createdByStaff, staffId)
        )
      )
      .groupBy(orders.id, orders.totalAmount, orders.createdAt)
      .orderBy(desc(orders.createdAt));

    // Group by month
    const monthlyData = new Map<string, Array<{
      id: number;
      date: string;
      amount: string;
    }>>();

    completedOrders.forEach(order => {
      if (order.createdAt) {
        const monthKey = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM
        const orderData = {
          id: order.id,
          date: new Date(order.createdAt).toLocaleDateString('pt-BR'),
          amount: order.totalAmount
        };

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, []);
        }
        monthlyData.get(monthKey)!.push(orderData);
      }
    });

    // Convert to array and calculate totals
    const result = Array.from(monthlyData.entries()).map(([month, orders]) => {
      const totalAmount = orders.reduce((sum, order) => {
        return sum + parseFloat(order.amount);
      }, 0);

      return {
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        }),
        orders: orders.sort((a, b) => b.id - a.id), // Most recent first
        totalAmount: totalAmount.toFixed(2)
      };
    });

    return result.sort((a, b) => b.month.localeCompare(a.month)); // Most recent month first
  }

  // Statistics for specific staff
  async getStatsForStaff(staffId: number): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
    activeCampaigns: number;
  }> {
    const [activeProductsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.isActive, 1), eq(products.createdByStaff, staffId)));

    // Count pending orders that contain products from this staff
    const pendingOrdersQuery = await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(products.createdByStaff, staffId),
          or(
            eq(orders.status, "pending"),
            eq(orders.status, "confirmed"),
            eq(orders.status, "preparing")
          )
        )
      )
      .groupBy(orders.id);

    const pendingOrdersCount = pendingOrdersQuery.length;

    // Calculate net revenue from completed orders containing this staff's products
    // Need to get the staff's commercial rate to calculate net amount
    const [staffInfo] = await db
      .select({ commercialRate: staffUsers.commercialRate })
      .from(staffUsers)
      .where(eq(staffUsers.id, staffId));

    const commercialRate = Number(staffInfo?.commercialRate || 5.00); // Default 5% if not found

    // Calculate revenue from non-removed order items (pending + confirmed)
    const validItemsQuery = await db
      .select({ 
        priceAtTime: orderItems.priceAtTime,
        quantity: orderItems.quantity,
        confirmationStatus: orderItems.confirmationStatus,
        orderId: orderItems.orderId
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(products.createdByStaff, staffId),
          eq(orders.status, "completed"),
          or(
            eq(orderItems.confirmationStatus, "pending"),
            eq(orderItems.confirmationStatus, "confirmed")
          ) // Include pending and confirmed items
        )
      );



    // Calculate total revenue from non-removed items
    const grossRevenue = validItemsQuery.reduce((sum, item) => {
      return sum + (Number(item.priceAtTime) * Number(item.quantity));
    }, 0);
    const commission = grossRevenue * (commercialRate / 100);
    const netRevenue = grossRevenue - commission;

    // Count active marketing campaigns for this staff
    const [activeCampaignsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketingSubscriptions)
      .where(
        and(
          eq(marketingSubscriptions.staffId, staffId),
          eq(marketingSubscriptions.status, "active")
        )
      );

    return {
      activeProducts: Number(activeProductsResult.count),
      pendingOrders: Number(pendingOrdersCount),
      totalRevenue: Number(netRevenue),
      activeCampaigns: Number(activeCampaignsResult.count),
    };
  }

  // Global statistics (for general use)
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
      .where(or(
        eq(orders.status, "pending"),
        eq(orders.status, "confirmed"),
        eq(orders.status, "preparing")
      ));

    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(eq(orders.status, "completed"));

    return {
      activeProducts: activeProductsResult.count,
      pendingOrders: pendingOrdersResult.count,
      totalRevenue: revenueResult.total || 0,
    };
  }

  // Get pending payments for staff
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
    // Get all completed orders for this staff that haven't been paid by SaveUp yet
    // In real scenario, this would check payment status from SaveUp side
    // For now, we'll show completed orders from the last 30 days as "pending payment"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ordersResult = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        completedAt: orders.updatedAt,
        status: orders.status,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(products.createdByStaff, staffId),
          eq(orders.status, "completed"),
          sql`${orders.updatedAt} >= ${thirtyDaysAgo.toISOString()}`
        )
      )
      .groupBy(orders.id, orders.customerName, orders.totalAmount, orders.updatedAt, orders.status);

    // Get staff's commercial rate and payment terms for calculations
    const [staffResult] = await db
      .select({ 
        commercialRate: staffUsers.commercialRate,
        paymentTerms: staffUsers.paymentTerms 
      })
      .from(staffUsers)
      .where(eq(staffUsers.id, staffId));
    
    const commercialRate = Number(staffResult?.commercialRate || 5.00);
    const paymentTerms = Number(staffResult?.paymentTerms || 30);

    const result = [];
    
    for (const order of ordersResult) {
      // Get order items for this order (only non-removed items)
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          priceAtTime: orderItems.priceAtTime,
          confirmationStatus: orderItems.confirmationStatus,
          productName: products.name,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(orderItems.orderId, order.id),
            or(
              eq(orderItems.confirmationStatus, "pending"),
              eq(orderItems.confirmationStatus, "confirmed")
            )
          )
        );



      // Calculate correct gross amount from valid items only
      const grossAmount = items.reduce((sum, item) => {
        return sum + (Number(item.priceAtTime) * Number(item.quantity));
      }, 0);
      
      const commission = grossAmount * (commercialRate / 100);
      const netAmount = grossAmount - commission;

      // Skip orders with no valid items or zero amount
      if (items.length === 0 || grossAmount <= 0) {
        continue;
      }

      // Calculate due date (paymentTerms days after completion)
      const completedDate = new Date(order.completedAt!);
      const dueDate = new Date(completedDate);
      dueDate.setDate(dueDate.getDate() + paymentTerms);

      result.push({
        id: order.id,
        customerName: order.customerName,
        totalAmount: grossAmount.toFixed(2), // Use calculated gross amount from valid items only
        completedAt: order.completedAt!.toISOString(),
        dueDate: dueDate.toISOString(),
        netAmount: netAmount.toFixed(2),
        status: order.status,
        orderItems: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            name: item.productName,
          },
        })),
      });
    }

    // Sort by due date (ascending - soonest first)
    result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    return result;
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
    // Try to update existing customer by email or phone
    const updateResult = await db
      .update(customers)
      .set({ 
        ecoPoints: sql`COALESCE(${customers.ecoPoints}, 0) + ${pointsToAdd}`,
        totalEcoActions: sql`COALESCE(${customers.totalEcoActions}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(sql`${customers.email} = ${identifier} OR ${customers.phone} = ${identifier}`)
      .returning();

    console.log(`Updated eco points for ${identifier}: +${pointsToAdd} points. Updated ${updateResult.length} customers.`);

    // If no customer was updated, log a warning
    if (updateResult.length === 0) {
      console.warn(`No customer found with email/phone: ${identifier} for eco points update`);
    }
  }

  // Customer specific operations
  async getSupermarketsWithProducts(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    productCount: number;
    hasPromotions: boolean;
    isSponsored: boolean;
  }>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          s.id,
          s.company_name as name,
          s.address,
          COUNT(CASE WHEN p.is_active = 1 THEN p.id END) as product_count,
          COUNT(CASE WHEN p.is_active = 1 AND p.discount_price IS NOT NULL AND p.discount_price < p.original_price THEN 1 END) > 0 as has_promotions,
          CASE 
            WHEN ms.id IS NOT NULL AND ms.expires_at > NOW() THEN 1 
            ELSE 0 
          END as is_sponsored
        FROM staff_users s
        LEFT JOIN products p ON s.id = p.created_by_staff
        LEFT JOIN marketing_subscriptions ms ON s.id = ms.staff_id AND ms.expires_at > NOW()
        WHERE s.company_name IS NOT NULL 
          AND s.is_active = 1
          AND s.approval_status = 'approved'
        GROUP BY s.id, s.company_name, s.address, ms.id, ms.expires_at
        HAVING COUNT(CASE WHEN p.is_active = 1 THEN p.id END) > 0
        ORDER BY 
          CASE WHEN ms.id IS NOT NULL AND ms.expires_at > NOW() THEN 0 ELSE 1 END,
          s.company_name ASC
      `);

      return result.rows.map((row: any) => ({
        id: parseInt(row.id),
        name: row.name || 'Supermercado',
        address: row.address || '',
        productCount: parseInt(row.product_count || '0'),
        hasPromotions: row.has_promotions || false,
        isSponsored: row.is_sponsored === 1
      }));
    } catch (error) {
      console.error('Error in getSupermarketsWithProducts:', error);
      return [];
    }
  }

  async getSupermarketsWithLocations(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
    productCount: number;
    hasPromotions: boolean;
    isSponsored: boolean;
  }>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          s.id,
          s.company_name as name,
          s.address,
          s.latitude::text as latitude,
          s.longitude::text as longitude,
          COUNT(CASE WHEN p.is_active = 1 THEN p.id END) as product_count,
          COUNT(CASE WHEN p.is_active = 1 AND p.discount_price IS NOT NULL AND p.discount_price < p.original_price THEN 1 END) > 0 as has_promotions,
          CASE 
            WHEN ms.id IS NOT NULL AND ms.expires_at > NOW() THEN 1 
            ELSE 0 
          END as is_sponsored
        FROM staff_users s
        LEFT JOIN products p ON s.id = p.created_by_staff
        LEFT JOIN marketing_subscriptions ms ON s.id = ms.staff_id AND ms.expires_at > NOW()
        WHERE s.company_name IS NOT NULL 
          AND s.latitude IS NOT NULL 
          AND s.longitude IS NOT NULL
          AND s.is_active = 1
          AND s.approval_status = 'approved'
        GROUP BY s.id, s.company_name, s.address, s.latitude, s.longitude, ms.id, ms.expires_at
        HAVING COUNT(CASE WHEN p.is_active = 1 THEN p.id END) > 0
        ORDER BY 
          CASE WHEN ms.id IS NOT NULL AND ms.expires_at > NOW() THEN 0 ELSE 1 END,
          s.company_name ASC
      `);

      return result.rows.map((row: any) => ({
        id: parseInt(row.id),
        name: row.name || 'Supermercado',
        address: row.address || '',
        latitude: row.latitude,
        longitude: row.longitude,
        productCount: parseInt(row.product_count || '0'),
        hasPromotions: row.has_promotions || false,
        isSponsored: row.is_sponsored === 1
      }));
    } catch (error) {
      console.error('Error in getSupermarketsWithLocations:', error);
      return [];
    }
  }

  async getProductsBySupermarket(staffId: number): Promise<ProductWithCreator[]> {
    const result = await db
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
        createdByStaff: products.createdByStaff,
        createdBy: {
          id: staffUsers.id,
          companyName: staffUsers.companyName,
          email: staffUsers.email,
          address: staffUsers.address,
        },
      })
      .from(products)
      .innerJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(and(
        eq(products.createdByStaff, staffId),
        eq(products.isActive, 1)
      ))
      .orderBy(desc(products.createdAt));

    return result.map(item => ({
      ...item,
      createdBy: {
        id: item.createdBy.id.toString(),
        email: item.createdBy.email,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        supermarketName: item.createdBy.companyName,
        supermarketAddress: item.createdBy.address,
        ecoPoints: null,
        totalEcoActions: null,
        createdAt: null,
        updatedAt: null,
      }
    }));
  }

  // Password reset operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, 0),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  async updateCustomerPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(customers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(customers.email, email));
  }

  // Staff password reset operations
  async createStaffPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    // Mark token type as 'staff' to differentiate from customer tokens
    const staffTokenData = {
      ...tokenData,
      userType: 'staff' as const
    };
    
    const [token] = await db
      .insert(passwordResetTokens)
      .values(staffTokenData)
      .returning();
    return token;
  }

  async getStaffPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, 0),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    
    // Verify that the email belongs to a staff user
    if (resetToken) {
      const staffUser = await db
        .select()
        .from(staffUsers)
        .where(eq(staffUsers.email, resetToken.email));
      
      if (staffUser.length > 0) {
        return resetToken;
      }
    }
    
    return undefined;
  }

  async markStaffTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateStaffPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(staffUsers)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.email, email));
  }

  // Push notification operations
  async createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription> {
    // Remove existing subscription for the same email if exists
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.customerEmail, subscriptionData.customerEmail));

    const [subscription] = await db
      .insert(pushSubscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async getPushSubscriptionsByEmail(email: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.customerEmail, email));
  }

  async removePushSubscription(id: number): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.id, id));
  }

  async updateOrderRefund(orderId: number, refundData: {
    pixRefundId: string;
    refundAmount: string;
    refundStatus: string;
    refundDate: Date;
    refundReason: string;
  }): Promise<void> {
    await db
      .update(orders)
      .set({
        pixRefundId: refundData.pixRefundId,
        refundAmount: refundData.refundAmount,
        refundStatus: refundData.refundStatus,
        refundDate: refundData.refundDate,
        refundReason: refundData.refundReason,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
    
    console.log(`✅ [REFUND] Pedido ${orderId} atualizado com dados de estorno:`, refundData);
  }

  async updateOrderItemConfirmationStatus(itemId: number, status: 'confirmed' | 'removed' | 'pending'): Promise<void> {
    await db
      .update(orderItems)
      .set({
        confirmationStatus: status
      })
      .where(eq(orderItems.id, itemId));
    
    console.log(`✅ [ITEM STATUS] Item ${itemId} atualizado para status: ${status}`);
  }

  async updateOrderExternalReference(orderId: number, externalReference: string): Promise<void> {
    console.log(`🔄 [EXTERNAL REF] Atualizando referência externa do pedido ${orderId}: ${externalReference}`);
    
    await db
      .update(orders)
      .set({
        externalReference: externalReference,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
    
    console.log(`✅ [EXTERNAL REF] Referência externa do pedido ${orderId} atualizada para: ${externalReference}`);
  }

  async updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        isSponsored: isSponsored ? 1 : 0,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId));
    
    console.log(`✅ [SPONSORSHIP] Staff ${staffId} patrocínio atualizado para: ${isSponsored ? 'ATIVO' : 'INATIVO'}`);
  }

  async getAllStaffUsers(): Promise<StaffUser[]> {
    return await db.select().from(staffUsers).orderBy(staffUsers.createdAt);
  }

  async updateStaffData(staffId: number, updateData: Partial<StaffUser>): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId));
    
    console.log(`✅ [STAFF UPDATE] Staff ${staffId} atualizado com dados:`, updateData);
  }

  async updateStaffProfile(staffId: number, profileData: {
    companyName?: string;
    phone?: string;
    address?: string;
    cnpj?: string;
  }): Promise<StaffUser> {
    const [updatedUser] = await db
      .update(staffUsers)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    
    console.log(`✅ [STAFF PROFILE] Staff ${staffId} perfil atualizado`);
    return updatedUser;
  }

  // Supermarket payment management
  async updateSupermarketPaymentStatus(
    orderId: number, 
    status: 'aguardando_pagamento' | 'pagamento_antecipado' | 'pagamento_realizado',
    amount?: number,
    notes?: string
  ): Promise<Order | undefined> {
    const updateData: any = {
      supermarketPaymentStatus: status,
      updatedAt: new Date()
    };

    if (amount !== undefined) {
      updateData.supermarketPaymentAmount = amount.toString();
    }

    if (status === 'pagamento_realizado') {
      updateData.supermarketPaymentDate = new Date();
    }

    if (notes) {
      updateData.supermarketPaymentNotes = notes;
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    console.log(`💰 PAGAMENTO SUPERMERCADO: Pedido ${orderId} status atualizado para ${status}`);
    return order;
  }

  async getSupermarketPaymentSummary(staffId?: number): Promise<any> {
    let whereConditions = [];
    
    if (staffId) {
      whereConditions = [
        eq(products.createdByStaff, staffId),
        not(eq(orders.status, 'payment_expired')),
        not(eq(orders.status, 'awaiting_payment'))
      ];
    } else {
      whereConditions = [
        not(eq(orders.status, 'payment_expired')),
        not(eq(orders.status, 'awaiting_payment'))
      ];
    }

    const paymentSummary = await db
      .select({
        supermarketPaymentStatus: orders.supermarketPaymentStatus,
        totalAmount: sql<number>`SUM(CAST(${orders.totalAmount} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(${orders.id})`
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...whereConditions))
      .groupBy(orders.supermarketPaymentStatus);

    return paymentSummary;
  }

  // Admin user operations
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return adminUser;
  }

  async createAdminUser(adminUserData: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(adminUserData.password, 10);
    const [adminUser] = await db
      .insert(adminUsers)
      .values({
        ...adminUserData,
        password: hashedPassword,
      })
      .returning();
    return adminUser;
  }

  async validateAdminUser(email: string, password: string): Promise<AdminUser | undefined> {
    const adminUser = await this.getAdminUserByEmail(email);
    if (!adminUser || !adminUser.isActive) {
      return undefined;
    }

    const isValid = await bcrypt.compare(password, adminUser.password);
    if (!isValid) {
      return undefined;
    }

    return adminUser;
  }

  // Financial statement operations
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
    const result = await db.execute(sql`
      SELECT 
        o.id as order_id,
        o.customer_name,
        o.customer_email,
        o.status,
        o.created_at,
        s.id as supermarket_id,
        s.company_name,
        s.commercial_rate,
        s.payment_terms,
        SUM(oi.quantity * oi.price_at_time::numeric) as calculated_total,
        json_agg(
          json_build_object(
            'productName', p.name,
            'quantity', oi.quantity,
            'unitPrice', oi.price_at_time,
            'totalPrice', (oi.quantity * oi.price_at_time::numeric)::text
          )
        ) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN staff_users s ON p.created_by_staff = s.id
      WHERE o.status IN ('completed', 'payment_confirmed', 'prepared', 'shipped', 'picked_up')
        AND s.approval_status = 'approved'
        AND oi.confirmation_status IN ('confirmed', 'pending')
      GROUP BY 
        o.id, o.customer_name, o.customer_email, o.status, o.created_at,
        s.id, s.company_name, s.commercial_rate, s.payment_terms
      ORDER BY o.created_at DESC
    `);

    return result.rows.map((row: any) => {
      const orderTotal = parseFloat(row.calculated_total);
      const commercialRate = parseFloat(row.commercial_rate);
      const rateAmount = (orderTotal * commercialRate) / 100;
      const amountToReceive = orderTotal - rateAmount;
      
      // Calculate payment date based on order date + payment terms
      const orderDate = new Date(row.created_at);
      const paymentDate = new Date(orderDate);
      paymentDate.setDate(paymentDate.getDate() + parseInt(row.payment_terms));

      return {
        orderId: parseInt(row.order_id),
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        supermarketId: parseInt(row.supermarket_id),
        supermarketName: row.company_name,
        orderTotal: row.calculated_total.toString(),
        commercialRate: row.commercial_rate,
        rateAmount: rateAmount.toFixed(2),
        amountToReceive: amountToReceive.toFixed(2),
        orderDate: row.created_at,
        paymentTerms: parseInt(row.payment_terms),
        paymentDate: paymentDate,
        status: row.status,
        items: row.items || []
      };
    });
  }

  // Marketing subscription operations
  async createMarketingSubscription(subscription: InsertMarketingSubscription): Promise<MarketingSubscription> {
    const [result] = await db
      .insert(marketingSubscriptions)
      .values(subscription)
      .returning();
    
    console.log(`📈 MARKETING: Plano ${subscription.planId} ativado para staff ${subscription.staffId}`);
    return result;
  }

  async getMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(marketingSubscriptions)
      .where(eq(marketingSubscriptions.staffId, staffId))
      .orderBy(desc(marketingSubscriptions.createdAt))
      .limit(1);

    return subscription || undefined;
  }

  async getActiveMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(marketingSubscriptions)
      .where(
        and(
          eq(marketingSubscriptions.staffId, staffId),
          eq(marketingSubscriptions.status, 'active'),
          sql`${marketingSubscriptions.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(marketingSubscriptions.createdAt))
      .limit(1);

    return subscription || undefined;
  }

  async updateMarketingSubscriptionStatus(id: number, status: string): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .update(marketingSubscriptions)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(marketingSubscriptions.id, id))
      .returning();

    console.log(`📈 MARKETING: Assinatura ${id} status atualizado para ${status}`);
    return subscription || undefined;
  }

  async cancelMarketingSubscription(staffId: number): Promise<boolean> {
    try {
      const result = await db
        .update(marketingSubscriptions)
        .set({ 
          status: 'cancelled',
          expiresAt: new Date(), // Set expiration to now to immediately deactivate
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(marketingSubscriptions.staffId, staffId),
            eq(marketingSubscriptions.status, 'active')
          )
        );

      console.log(`📈 MARKETING: Campanha cancelada para staff ${staffId}`);
      return true;
    } catch (error) {
      console.error(`❌ MARKETING: Erro ao cancelar campanha para staff ${staffId}:`, error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
