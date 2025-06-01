import {
  users,
  products,
  orders,
  orderItems,
  ecoActions,
  staffUsers,
  customers,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
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
  
  // Customer specific operations
  getSupermarketsWithProducts(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    productCount: number;
  }>>;
  getProductsBySupermarket(staffId: number): Promise<ProductWithCreator[]>;
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
    console.log(`🔍 CRITICAL DEBUG: Starting getOrdersByStaff for staffId: ${staffId}`);
    
    // CRITICAL: Check if this query is somehow triggering status updates
    console.log(`🔍 CRITICAL DEBUG: About to query orders - checking for any side effects`);
    
    // First, get all orders that contain products created by this staff
    let whereConditions = [eq(products.createdByStaff, staffId)];
    
    if (filters?.status) {
      whereConditions.push(eq(orders.status, filters.status));
      console.log(`Filtering by status: ${filters.status}`);
    }

    console.log(`🔍 CRITICAL DEBUG: About to execute query - NO updates should happen here`);
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
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt));

    console.log(`Found ${staffOrders.length} orders for staff ${staffId}:`, staffOrders.map(o => ({ id: o.id, customer: o.customerName })));

    const ordersWithItems = await Promise.all(
      staffOrders.map(async (order) => {
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

  async updateOrderStatus(id: number, status: string, changedBy: string = 'UNKNOWN'): Promise<Order | undefined> {
    // SECURITY: Only allow manual updates by staff
    console.log(`🔍 SECURITY CHECK: Order ${id} status update attempt`);
    console.log(`🔍 Target status: ${status}`);
    console.log(`🔍 Changed by: ${changedBy}`);
    console.log(`🔍 Full call stack:`, new Error().stack);
    
    if (!changedBy.startsWith('STAFF_')) {
      console.log(`🚫 SECURITY BLOCK: Non-staff status change attempt for order ${id}`);
      throw new Error('Order status can only be updated manually by staff');
    }
    
    try {
      // Authorize the change at database level
      console.log(`🔐 AUTHORIZING: Setting database authorization for ${changedBy}`);
      await db.execute(sql`SET app.staff_authorized = 'true'`);
      await db.execute(sql`SET app.staff_id = ${changedBy}`);
      
      console.log(`🎯 EXECUTING: Database update for order ${id} to ${status}`);
      
      const [order] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      
      // Clear the authorization immediately
      await db.execute(sql`SET app.staff_authorized = NULL`);
      await db.execute(sql`SET app.staff_id = NULL`);
      
      console.log(`✅ SUCCESS: Order ${id} updated to ${status} by ${changedBy}`);
      
      return order;
    } catch (error) {
      // Ensure authorization is cleared even on error
      await db.execute(sql`SET app.staff_authorized = NULL`);
      await db.execute(sql`SET app.staff_id = NULL`);
      
      console.error(`❌ ERROR: Failed to update order ${id}:`, error);
      throw error;
    }
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
}

export const storage = new DatabaseStorage();
