import {
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

// User operations interface
export interface IUserStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

// Staff operations interface
export interface IStaffStorage {
  getStaffUserByEmail(email: string): Promise<StaffUser | undefined>;
  getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined>;
  createStaffUser(staffUser: InsertStaffUser): Promise<StaffUser>;
  validateStaffUser(email: string, password: string): Promise<StaffUser | undefined>;
  updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void>;
  getPendingStaffUsers(): Promise<StaffUser[]>;
  approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined>;
  rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined>;
  updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void>;
  getAllStaffUsers(): Promise<StaffUser[]>;
  updateStaffData(staffId: number, updateData: Partial<StaffUser>): Promise<void>;
  updateStaffProfile(staffId: number, profileData: any): Promise<void>;
}

// Customer operations interface
export interface ICustomerStorage {
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  validateCustomer(email: string, password: string): Promise<Customer | undefined>;
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
}

// Admin operations interface
export interface IAdminStorage {
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  validateAdminUser(email: string, password: string): Promise<AdminUser | undefined>;
}

// Product operations interface
export interface IProductStorage {
  getProducts(filters?: { category?: string; isActive?: boolean }): Promise<ProductWithCreator[]>;
  getProduct(id: number): Promise<ProductWithCreator | undefined>;
  createProduct(product: InsertProduct & { createdBy: string }): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductsByStaff(staffId: number): Promise<ProductWithCreator[]>;
  createProductForStaff(product: InsertProduct & { createdByStaff: number }): Promise<Product>;
  getProductsBySupermarket(staffId: number): Promise<ProductWithCreator[]>;
}

// Order operations interface
export interface IOrderStorage {
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
  updateOrderItemConfirmationStatus(itemId: number, status: 'confirmed' | 'removed' | 'pending'): Promise<void>;
  updateOrderExternalReference(orderId: number, externalReference: string): Promise<void>;
  checkExpiredPixOrders(): Promise<void>;
}

// Statistics operations interface
export interface IStatisticsStorage {
  getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }>;
  getStatsForStaff(staffId: number): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }>;
  getMonthlyCompletedOrders(staffId: number): Promise<Array<{
    month: string;
    orders: Array<{
      id: number;
      date: string;
      amount: string;
    }>;
    totalAmount: string;
  }>>;
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

// Eco actions interface
export interface IEcoActionsStorage {
  createEcoAction(action: InsertEcoAction): Promise<EcoAction>;
  getEcoActionsByEmail(email: string): Promise<EcoAction[]>;
  updateUserEcoPoints(email: string, pointsToAdd: number): Promise<void>;
}

// Authentication operations interface
export interface IAuthStorage {
  createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  updateCustomerPassword(email: string, newPassword: string): Promise<void>;
  createStaffPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getStaffPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markStaffTokenAsUsed(token: string): Promise<void>;
  updateStaffPassword(email: string, newPassword: string): Promise<void>;
}

// Notifications interface
export interface INotificationsStorage {
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByEmail(email: string): Promise<PushSubscription[]>;
  removePushSubscription(id: number): Promise<void>;
}

// Payments interface
export interface IPaymentsStorage {
  updateOrderRefund(orderId: number, refundData: {
    pixRefundId: string;
    refundAmount: string;
    refundStatus: string;
    refundDate: Date;
    refundReason: string;
  }): Promise<void>;
  updateSupermarketPaymentStatus(staffId: number, status: string, notes?: string): Promise<void>;
  getSupermarketPaymentSummary(staffId?: number): Promise<any>;
}

// Marketing interface
export interface IMarketingStorage {
  createMarketingSubscription(subscription: InsertMarketingSubscription): Promise<MarketingSubscription>;
  getMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined>;
  getActiveMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined>;
  updateMarketingSubscriptionStatus(id: number, status: string): Promise<MarketingSubscription | undefined>;
  cancelMarketingSubscription(staffId: number): Promise<boolean>;
}