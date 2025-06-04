import {
  users,
  products,
  orders,
  orderItems,
  ecoActions,
  staffUsers,
  customers,
  passwordResetTokens,
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
  type ProductWithCreator,
  type OrderWithItems,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type PushSubscription,
  type InsertPushSubscription,
  pushSubscriptions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, not } from "drizzle-orm";
import bcrypt from "bcrypt";

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
  updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void>;
  
  // Customer operations
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  validateCustomer(email: string, password: string): Promise<Customer | undefined>;
  
  // Product operations
  getProducts(filters?: { category?: string; isActive?: boolean }): Promise<ProductWithCreator[]>;
  getProduct(id: number): Promise<ProductWithCreator | undefined>;
  createProduct(product: InsertProduct & { createdBy: string }): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Staff-specific product operations
  getProductsByStaff(staffId: number): Promise<ProductWithCreator[]>;
  createProductForStaff(product: InsertProduct & { createdByStaff: number }): Promise<Product>;
  
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
              console.log(`🚨 PROTECTION ACTIVATED: Automatic status change detected for order ${orderId} from ${currentOrder.status} back to ${currentOrder.lastManualStatus}`);
              
              await db
                .update(orders)
                .set({ 
                  status: currentOrder.lastManualStatus,
                  updatedAt: currentOrder.lastManualUpdate || currentOrder.createdAt
                })
                .where(eq(orders.id, orderId));
                
              console.log(`✅ PROTECTION SUCCESS: Order ${orderId} status reverted to ${currentOrder.lastManualStatus}`);
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
      'STAFF_REQUEST'     // Staff cancellation requests
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
      // Fazer a atualização e salvar como último status manual
      const [order] = await db
        .update(orders)
        .set({ 
          status, 
          lastManualStatus: status,
          lastManualUpdate: new Date(),
          updatedAt: new Date() 
        })
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

    // Calculate revenue from completed orders containing this staff's products
    const [revenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(products.createdByStaff, staffId),
          eq(orders.status, "completed")
        )
      );

    return {
      activeProducts: activeProductsResult.count,
      pendingOrders: pendingOrdersCount,
      totalRevenue: revenueResult.total || 0,
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
  }>> {
    const result = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.companyName,
        address: staffUsers.address,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(staffUsers)
      .leftJoin(products, and(
        eq(products.createdByStaff, staffUsers.id),
        eq(products.isActive, 1)
      ))
      .where(eq(staffUsers.isActive, 1))
      .groupBy(staffUsers.id, staffUsers.companyName, staffUsers.address)
      .having(sql`count(${products.id}) > 0`);

    return result;
  }

  async getSupermarketsWithLocations(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
    productCount: number;
    hasPromotions: boolean;
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
          COUNT(CASE WHEN p.is_active = 1 AND p.discount_price IS NOT NULL AND p.discount_price < p.original_price THEN 1 END) > 0 as has_promotions
        FROM staff_users s
        LEFT JOIN products p ON s.id = p.created_by_staff
        WHERE s.company_name IS NOT NULL 
          AND s.latitude IS NOT NULL 
          AND s.longitude IS NOT NULL
          AND s.is_active = 1
        GROUP BY s.id, s.company_name, s.address, s.latitude, s.longitude
        ORDER BY s.company_name
      `);

      return result.rows.map((row: any) => ({
        id: parseInt(row.id),
        name: row.name || 'Supermercado',
        address: row.address || '',
        latitude: row.latitude,
        longitude: row.longitude,
        productCount: parseInt(row.product_count || '0'),
        hasPromotions: row.has_promotions || false
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
}

export const storage = new DatabaseStorage();
