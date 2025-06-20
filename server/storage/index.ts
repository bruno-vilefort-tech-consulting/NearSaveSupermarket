import {
  type User,
  type UpsertUser,
  type StaffUser,
  type InsertStaffUser,
  type Customer,
  type InsertCustomer,
  type AdminUser,
  type InsertAdminUser,
  type Product,
  type InsertProduct,
  type ProductWithCreator,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type PushSubscription,
  type InsertPushSubscription,
  type MarketingSubscription,
  type InsertMarketingSubscription,
  type EcoAction,
  type InsertEcoAction,
} from "@shared/schema";

import { UserStorage } from "./users";
import { ProductStorage } from "./products";
import { OrderStorage } from "./orders";
import { AnalyticsStorage } from "./analytics";
import { MiscStorage } from "./misc";

// Composite storage class that implements the full interface
export class Storage implements IStorage {
  private userStorage = new UserStorage();
  private productStorage = new ProductStorage();
  private orderStorage = new OrderStorage();
  private analyticsStorage = new AnalyticsStorage();
  private miscStorage = new MiscStorage();

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    return this.userStorage.getUserByIdentifier(identifier);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return this.userStorage.upsertUser(user);
  }

  // Staff user operations
  async getStaffUserByEmail(email: string): Promise<StaffUser | undefined> {
    return this.userStorage.getStaffUserByEmail(email);
  }

  async getStaffById(id: number): Promise<StaffUser | undefined> {
    return this.userStorage.getStaffById(id);
  }

  async getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined> {
    return this.userStorage.getStaffUserByCnpj(cnpj);
  }

  async createStaffUser(staffUser: InsertStaffUser): Promise<StaffUser> {
    return this.userStorage.createStaffUser(staffUser);
  }

  async validateStaffUser(email: string, password: string): Promise<StaffUser | undefined> {
    return this.userStorage.validateStaffUser(email, password);
  }

  async updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void> {
    return this.userStorage.updateStaffLocation(id, latitude, longitude);
  }

  async updateStaffProfile(staffId: number, updateData: Partial<InsertStaffUser>): Promise<void> {
    return this.userStorage.updateStaffProfile(staffId, updateData);
  }

  async updateStaffStatus(staffId: number, status: string): Promise<void> {
    return this.userStorage.updateStaffStatus(staffId, status);
  }

  async updateStaffPassword(email: string, hashedPassword: string): Promise<void> {
    return this.userStorage.updateStaffPassword(email, hashedPassword);
  }

  async updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void> {
    return this.userStorage.updateStaffSponsorshipStatus(staffId, isSponsored);
  }

  // Staff approval operations
  async getPendingStaffUsers(): Promise<StaffUser[]> {
    return this.userStorage.getPendingStaffUsers();
  }

  async getStaffUsers(filters?: { status?: string }): Promise<StaffUser[]> {
    return this.userStorage.getStaffUsers(filters);
  }

  async getApprovedSupermarkets(): Promise<StaffUser[]> {
    return this.userStorage.getApprovedSupermarkets();
  }

  async approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined> {
    return this.userStorage.approveStaffUser(staffId, adminId);
  }

  async rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined> {
    return this.userStorage.rejectStaffUser(staffId, adminId, reason);
  }

  // Customer operations
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return this.userStorage.getCustomerByEmail(email);
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    return this.userStorage.getCustomerByCpf(cpf);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.userStorage.createCustomer(customer);
  }

  async validateCustomer(email: string, password: string): Promise<Customer | undefined> {
    return this.userStorage.validateCustomer(email, password);
  }

  async updateCustomerPassword(email: string, hashedPassword: string): Promise<void> {
    return this.userStorage.updateCustomerPassword(email, hashedPassword);
  }

  // Admin user operations
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    return this.userStorage.getAdminUserByEmail(email);
  }

  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    return this.userStorage.createAdminUser(adminUser);
  }

  async validateAdminUser(email: string, password: string): Promise<AdminUser | undefined> {
    return this.userStorage.validateAdminUser(email, password);
  }

  // Product operations
  async getProducts(filters?: { category?: string; isActive?: boolean; createdByStaff?: number }): Promise<ProductWithCreator[]> {
    return this.productStorage.getProducts(filters);
  }

  async getProduct(id: number): Promise<ProductWithCreator | undefined> {
    return this.productStorage.getProduct(id);
  }

  async createProduct(product: InsertProduct & { createdBy?: string; createdByStaff?: number }): Promise<Product> {
    return this.productStorage.createProduct(product);
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.productStorage.updateProduct(id, product);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.productStorage.deleteProduct(id);
  }

  async getProductsByStaff(staffId: number): Promise<ProductWithCreator[]> {
    return this.productStorage.getProductsByStaff(staffId);
  }

  async createProductForStaff(product: InsertProduct & { createdByStaff: number }): Promise<Product> {
    return this.productStorage.createProductForStaff(product);
  }

  // Order operations
  async getOrders(filters?: { status?: string }): Promise<OrderWithItems[]> {
    return this.orderStorage.getOrders(filters);
  }

  async getOrdersForStaff(staffId: number, filters?: { status?: string }): Promise<OrderWithItems[]> {
    return this.orderStorage.getOrdersForStaff(staffId, filters);
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    return this.orderStorage.getOrder(id);
  }

  async getOrdersByPhone(phone: string): Promise<OrderWithItems[]> {
    return this.orderStorage.getOrdersByPhone(phone);
  }

  async getOrdersByEmail(email: string): Promise<OrderWithItems[]> {
    return this.orderStorage.getOrdersByEmail(email);
  }

  async getOrderByExternalReference(externalReference: string): Promise<Order | undefined> {
    return this.orderStorage.getOrderByExternalReference(externalReference);
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return this.orderStorage.createOrder(order, items);
  }

  async createOrderAwaitingPayment(
    order: InsertOrder, 
    items: InsertOrderItem[], 
    pixData: {
      pixPaymentId: string;
      pixCopyPaste: string;
      pixExpirationDate: Date;
    }
  ): Promise<Order> {
    return this.orderStorage.createOrderAwaitingPayment(order, items, pixData);
  }

  async updateOrder(id: number, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    return this.orderStorage.updateOrder(id, updateData);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    return this.orderStorage.updateOrderStatus(id, status);
  }

  async updateOrderPaymentStatus(id: number, status: 'payment_confirmed' | 'payment_failed'): Promise<Order | undefined> {
    return this.orderStorage.updateOrderPaymentStatus(id, status);
  }

  async updateOrderRefund(id: number, refundData: {
    pixRefundId?: string;
    refundAmount?: string;
    refundStatus?: string;
    refundDate?: Date;
    refundReason?: string;
  }): Promise<Order | undefined> {
    return this.orderStorage.updateOrderRefund(id, refundData);
  }

  async getOrderItems(orderId: number): Promise<Array<OrderItem & { 
    productName: string; 
    productCategory: string; 
    productImageUrl: string | null;
    supermarketName: string | null;
  }>> {
    return this.orderStorage.getOrderItems(orderId);
  }

  async updateOrderItemConfirmation(itemId: number, confirmationStatus: string): Promise<void> {
    return this.orderStorage.updateOrderItemConfirmation(itemId, confirmationStatus);
  }

  async checkExpiredPixOrders(): Promise<void> {
    return this.orderStorage.checkExpiredPixOrders();
  }

  async getAllOrders(filters?: { status?: string }, pagination?: { limit?: number; offset?: number }): Promise<OrderWithItems[]> {
    return this.orderStorage.getAllOrders(filters, pagination);
  }

  // Analytics operations
  async getStats(): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    return this.analyticsStorage.getStats();
  }

  async getStatsForStaff(staffId: number): Promise<{
    activeProducts: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    return this.analyticsStorage.getStatsForStaff(staffId);
  }

  async getMonthlyCompletedOrders(staffId: number): Promise<Array<{
    month: string;
    orders: Array<{
      id: number;
      customerName: string;
      total: string;
      completedAt: Date;
    }>;
  }>> {
    return this.analyticsStorage.getMonthlyCompletedOrders(staffId);
  }

  async getFinancialStatement(filters?: {
    startDate?: Date;
    endDate?: Date;
    staffId?: number;
  }): Promise<Array<{
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
    return this.analyticsStorage.getFinancialStatement(filters);
  }

  async getAdminDashboardStats(): Promise<any> {
    return this.analyticsStorage.getAdminDashboardStats();
  }

  async getPlatformAnalytics(startDate: Date): Promise<any> {
    return this.analyticsStorage.getPlatformAnalytics(startDate);
  }

  async getStaffFinancialData(filters: {
    staffId: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    return this.analyticsStorage.getStaffFinancialData(filters);
  }

  async getSupermarketPayments(filters?: {
    status?: string;
    staffId?: number;
  }): Promise<any> {
    return this.analyticsStorage.getSupermarketPayments(filters);
  }

  // Miscellaneous operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    return this.miscStorage.createPasswordResetToken(tokenData);
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.miscStorage.getPasswordResetToken(token);
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    return this.miscStorage.markPasswordResetTokenAsUsed(token);
  }

  async createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription> {
    return this.miscStorage.createPushSubscription(subscriptionData);
  }

  async getPushSubscriptions(userEmail: string): Promise<PushSubscription[]> {
    return this.miscStorage.getPushSubscriptions(userEmail);
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    return this.miscStorage.deletePushSubscription(endpoint);
  }

  async createMarketingSubscription(subscriptionData: InsertMarketingSubscription): Promise<MarketingSubscription> {
    return this.miscStorage.createMarketingSubscription(subscriptionData);
  }

  async getMarketingSubscription(staffId: number): Promise<MarketingSubscription | undefined> {
    return this.miscStorage.getMarketingSubscription(staffId);
  }

  async cancelMarketingSubscription(staffId: number): Promise<void> {
    return this.miscStorage.cancelMarketingSubscription(staffId);
  }

  async createEcoAction(actionData: InsertEcoAction): Promise<EcoAction> {
    return this.miscStorage.createEcoAction(actionData);
  }

  async getEcoActionsByCustomer(customerEmail: string): Promise<EcoAction[]> {
    return this.miscStorage.getEcoActionsByCustomer(customerEmail);
  }

  async getTotalEcoPointsByCustomer(customerEmail: string): Promise<number> {
    return this.miscStorage.getTotalEcoPointsByCustomer(customerEmail);
  }

  async healthCheck(): Promise<any> {
    return this.miscStorage.healthCheck();
  }
}

// Interface definition for complete storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Staff operations
  getStaffUserByEmail(email: string): Promise<StaffUser | undefined>;
  getStaffById(id: number): Promise<StaffUser | undefined>;
  getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined>;
  createStaffUser(staffUser: InsertStaffUser): Promise<StaffUser>;
  validateStaffUser(email: string, password: string): Promise<StaffUser | undefined>;
  updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void>;
  updateStaffProfile(staffId: number, updateData: Partial<InsertStaffUser>): Promise<void>;
  updateStaffStatus(staffId: number, status: string): Promise<void>;
  updateStaffPassword(email: string, hashedPassword: string): Promise<void>;
  updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void>;
  getPendingStaffUsers(): Promise<StaffUser[]>;
  getStaffUsers(filters?: { status?: string }): Promise<StaffUser[]>;
  getApprovedSupermarkets(): Promise<StaffUser[]>;
  approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined>;
  rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined>;
  
  // Customer operations
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  validateCustomer(email: string, password: string): Promise<Customer | undefined>;
  updateCustomerPassword(email: string, hashedPassword: string): Promise<void>;
  
  // Admin operations
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  validateAdminUser(email: string, password: string): Promise<AdminUser | undefined>;
  
  // Product operations
  getProducts(filters?: { category?: string; isActive?: boolean; createdByStaff?: number }): Promise<ProductWithCreator[]>;
  getProduct(id: number): Promise<ProductWithCreator | undefined>;
  createProduct(product: InsertProduct & { createdBy?: string; createdByStaff?: number }): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductsByStaff(staffId: number): Promise<ProductWithCreator[]>;
  createProductForStaff(product: InsertProduct & { createdByStaff: number }): Promise<Product>;
  
  // Order operations
  getOrders(filters?: { status?: string }): Promise<OrderWithItems[]>;
  getOrdersForStaff(staffId: number, filters?: { status?: string }): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  getOrdersByPhone(phone: string): Promise<OrderWithItems[]>;
  getOrdersByEmail(email: string): Promise<OrderWithItems[]>;
  getOrderByExternalReference(externalReference: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  createOrderAwaitingPayment(order: InsertOrder, items: InsertOrderItem[], pixData: any): Promise<Order>;
  updateOrder(id: number, updateData: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: number, status: 'payment_confirmed' | 'payment_failed'): Promise<Order | undefined>;
  updateOrderRefund(id: number, refundData: any): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<any[]>;
  updateOrderItemConfirmation(itemId: number, confirmationStatus: string): Promise<void>;
  checkExpiredPixOrders(): Promise<void>;
  getAllOrders(filters?: { status?: string }, pagination?: { limit?: number; offset?: number }): Promise<OrderWithItems[]>;
  
  // Analytics operations
  getStats(): Promise<any>;
  getStatsForStaff(staffId: number): Promise<any>;
  getMonthlyCompletedOrders(staffId: number): Promise<any>;
  getFinancialStatement(filters?: any): Promise<any>;
  getAdminDashboardStats(): Promise<any>;
  getPlatformAnalytics(startDate: Date): Promise<any>;
  getStaffFinancialData(filters: any): Promise<any>;
  getSupermarketPayments(filters?: any): Promise<any>;
  
  // Miscellaneous operations
  createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptions(userEmail: string): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;
  createMarketingSubscription(subscriptionData: InsertMarketingSubscription): Promise<MarketingSubscription>;
  getMarketingSubscription(staffId: number): Promise<MarketingSubscription | undefined>;
  cancelMarketingSubscription(staffId: number): Promise<void>;
  createEcoAction(actionData: InsertEcoAction): Promise<EcoAction>;
  getEcoActionsByCustomer(customerEmail: string): Promise<EcoAction[]>;
  getTotalEcoPointsByCustomer(customerEmail: string): Promise<number>;
  healthCheck(): Promise<any>;
}

// Export singleton instance
export const storage = new Storage();