import { UserStorage } from "./users";
import { StaffStorage } from "./staff";
import { CustomerStorage } from "./customers";
import { ProductStorage } from "./products";
import { OrderStorage } from "./orders";
import { AdminStorage } from "./admin";
import { StatisticsStorage } from "./statistics";
import { EcoActionsStorage } from "./eco-actions";
import { AuthStorage } from "./auth";
import { NotificationsStorage } from "./notifications";
import { PaymentsStorage } from "./payments";
import { MarketingStorage } from "./marketing";
import { 
  IUserStorage, 
  IStaffStorage, 
  ICustomerStorage, 
  IProductStorage, 
  IOrderStorage, 
  IAdminStorage, 
  IStatisticsStorage, 
  IEcoActionsStorage, 
  IAuthStorage, 
  INotificationsStorage, 
  IPaymentsStorage, 
  IMarketingStorage 
} from "./types";

// Main storage interface that combines all modules
export interface IStorage extends 
  IUserStorage,
  IStaffStorage,
  ICustomerStorage,
  IProductStorage,
  IOrderStorage,
  IAdminStorage,
  IStatisticsStorage,
  IEcoActionsStorage,
  IAuthStorage,
  INotificationsStorage,
  IPaymentsStorage,
  IMarketingStorage {}

// Combined storage implementation
export class DatabaseStorage implements IStorage {
  private userStorage = new UserStorage();
  private staffStorage = new StaffStorage();
  private customerStorage = new CustomerStorage();
  private productStorage = new ProductStorage();
  private orderStorage = new OrderStorage();
  private adminStorage = new AdminStorage();
  private statisticsStorage = new StatisticsStorage();
  private ecoActionsStorage = new EcoActionsStorage();
  private authStorage = new AuthStorage();
  private notificationsStorage = new NotificationsStorage();
  private paymentsStorage = new PaymentsStorage();
  private marketingStorage = new MarketingStorage();

  // User operations
  async getUser(id: string) { return this.userStorage.getUser(id); }
  async getUserByIdentifier(identifier: string) { return this.userStorage.getUserByIdentifier(identifier); }
  async upsertUser(user: any) { return this.userStorage.upsertUser(user); }

  // Staff operations
  async getStaffUserByEmail(email: string) { return this.staffStorage.getStaffUserByEmail(email); }
  async getStaffUserByCnpj(cnpj: string) { return this.staffStorage.getStaffUserByCnpj(cnpj); }
  async createStaffUser(staffUser: any) { return this.staffStorage.createStaffUser(staffUser); }
  async validateStaffUser(email: string, password: string) { return this.staffStorage.validateStaffUser(email, password); }
  async updateStaffLocation(id: number, latitude: number, longitude: number) { return this.staffStorage.updateStaffLocation(id, latitude, longitude); }
  async getPendingStaffUsers() { return this.staffStorage.getPendingStaffUsers(); }
  async approveStaffUser(staffId: number, adminId: number) { return this.staffStorage.approveStaffUser(staffId, adminId); }
  async rejectStaffUser(staffId: number, adminId: number, reason: string) { return this.staffStorage.rejectStaffUser(staffId, adminId, reason); }
  async updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean) { return this.staffStorage.updateStaffSponsorshipStatus(staffId, isSponsored); }
  async getAllStaffUsers() { return this.staffStorage.getAllStaffUsers(); }
  async updateStaffData(staffId: number, updateData: any) { return this.staffStorage.updateStaffData(staffId, updateData); }
  async updateStaffProfile(staffId: number, profileData: any) { return this.staffStorage.updateStaffProfile(staffId, profileData); }

  // Customer operations
  async getCustomerByEmail(email: string) { return this.customerStorage.getCustomerByEmail(email); }
  async getCustomerByCpf(cpf: string) { return this.customerStorage.getCustomerByCpf(cpf); }
  async createCustomer(customer: any) { return this.customerStorage.createCustomer(customer); }
  async validateCustomer(email: string, password: string) { return this.customerStorage.validateCustomer(email, password); }
  async getSupermarketsWithProducts() { return this.customerStorage.getSupermarketsWithProducts(); }
  async getSupermarketsWithLocations() { return this.customerStorage.getSupermarketsWithLocations(); }

  // Product operations
  async getProducts(filters?: any) { return this.productStorage.getProducts(filters); }
  async getProduct(id: number) { return this.productStorage.getProduct(id); }
  async createProduct(product: any) { return this.productStorage.createProduct(product); }
  async updateProduct(id: number, product: any) { return this.productStorage.updateProduct(id, product); }
  async deleteProduct(id: number) { return this.productStorage.deleteProduct(id); }
  async getProductsByStaff(staffId: number) { return this.productStorage.getProductsByStaff(staffId); }
  async createProductForStaff(product: any) { return this.productStorage.createProductForStaff(product); }
  async getProductsBySupermarket(staffId: number) { return this.productStorage.getProductsBySupermarket(staffId); }

  // Order operations
  async getOrders(filters?: any) { return this.orderStorage.getOrders(filters); }
  async getOrdersByStaff(staffId: number, filters?: any) { return this.orderStorage.getOrdersByStaff(staffId, filters); }
  async getOrder(id: number) { return this.orderStorage.getOrder(id); }
  async getOrdersByPhone(phone: string) { return this.orderStorage.getOrdersByPhone(phone); }
  async getOrdersByEmail(email: string) { return this.orderStorage.getOrdersByEmail(email); }
  async getOrderByExternalReference(externalReference: string) { return this.orderStorage.getOrderByExternalReference(externalReference); }
  async createOrder(order: any, items: any[]) { return this.orderStorage.createOrder(order, items); }
  async createOrderAwaitingPayment(order: any, items: any[], pixData: any) { return this.orderStorage.createOrderAwaitingPayment(order, items, pixData); }
  async updateOrderPaymentStatus(id: number, status: any) { return this.orderStorage.updateOrderPaymentStatus(id, status); }
  async updateOrderStatus(id: number, status: string, changedBy?: string) { return this.orderStorage.updateOrderStatus(id, status, changedBy); }
  async updateOrderItemConfirmationStatus(itemId: number, status: any) { return this.orderStorage.updateOrderItemConfirmationStatus(itemId, status); }
  async updateOrderExternalReference(orderId: number, externalReference: string) { return this.orderStorage.updateOrderExternalReference(orderId, externalReference); }
  async checkExpiredPixOrders() { return this.orderStorage.checkExpiredPixOrders(); }

  // Admin operations
  async getAdminUserByEmail(email: string) { return this.adminStorage.getAdminUserByEmail(email); }
  async createAdminUser(adminUser: any) { return this.adminStorage.createAdminUser(adminUser); }
  async validateAdminUser(email: string, password: string) { return this.adminStorage.validateAdminUser(email, password); }

  // Statistics operations
  async getStats() { return this.statisticsStorage.getStats(); }
  async getStatsForStaff(staffId: number) { return this.statisticsStorage.getStatsForStaff(staffId); }
  async getMonthlyCompletedOrders(staffId: number) { return this.statisticsStorage.getMonthlyCompletedOrders(staffId); }
  async getPendingPaymentsForStaff(staffId: number) { return this.statisticsStorage.getPendingPaymentsForStaff(staffId); }
  async getFinancialStatement() { return this.statisticsStorage.getFinancialStatement(); }

  // Eco actions operations
  async createEcoAction(action: any) { return this.ecoActionsStorage.createEcoAction(action); }
  async getEcoActionsByEmail(email: string) { return this.ecoActionsStorage.getEcoActionsByEmail(email); }
  async updateUserEcoPoints(email: string, pointsToAdd: number) { return this.ecoActionsStorage.updateUserEcoPoints(email, pointsToAdd); }

  // Authentication operations
  async createPasswordResetToken(tokenData: any) { return this.authStorage.createPasswordResetToken(tokenData); }
  async getPasswordResetToken(token: string) { return this.authStorage.getPasswordResetToken(token); }
  async markTokenAsUsed(token: string) { return this.authStorage.markTokenAsUsed(token); }
  async cleanupExpiredTokens() { return this.authStorage.cleanupExpiredTokens(); }
  async updateCustomerPassword(email: string, newPassword: string) { return this.authStorage.updateCustomerPassword(email, newPassword); }
  async createStaffPasswordResetToken(tokenData: any) { return this.authStorage.createStaffPasswordResetToken(tokenData); }
  async getStaffPasswordResetToken(token: string) { return this.authStorage.getStaffPasswordResetToken(token); }
  async markStaffTokenAsUsed(token: string) { return this.authStorage.markStaffTokenAsUsed(token); }
  async updateStaffPassword(email: string, newPassword: string) { return this.authStorage.updateStaffPassword(email, newPassword); }

  // Notifications operations
  async createPushSubscription(subscription: any) { return this.notificationsStorage.createPushSubscription(subscription); }
  async getPushSubscriptionsByEmail(email: string) { return this.notificationsStorage.getPushSubscriptionsByEmail(email); }
  async removePushSubscription(id: number) { return this.notificationsStorage.removePushSubscription(id); }

  // Payments operations
  async updateOrderRefund(orderId: number, refundData: any) { return this.paymentsStorage.updateOrderRefund(orderId, refundData); }
  async updateSupermarketPaymentStatus(staffId: number, status: string, notes?: string) { return this.paymentsStorage.updateSupermarketPaymentStatus(staffId, status, notes); }
  async getSupermarketPaymentSummary(staffId?: number) { return this.paymentsStorage.getSupermarketPaymentSummary(staffId); }

  // Marketing operations
  async createMarketingSubscription(subscription: any) { return this.marketingStorage.createMarketingSubscription(subscription); }
  async getMarketingSubscriptionByStaffId(staffId: number) { return this.marketingStorage.getMarketingSubscriptionByStaffId(staffId); }
  async getActiveMarketingSubscriptionByStaffId(staffId: number) { return this.marketingStorage.getActiveMarketingSubscriptionByStaffId(staffId); }
  async updateMarketingSubscriptionStatus(id: number, status: string) { return this.marketingStorage.updateMarketingSubscriptionStatus(id, status); }
  async cancelMarketingSubscription(staffId: number) { return this.marketingStorage.cancelMarketingSubscription(staffId); }
}

// Export singleton instance
export const storage = new DatabaseStorage();

// Export all interfaces and types for external use
export * from "./types";
export { UserStorage } from "./users";
export { StaffStorage } from "./staff";
export { CustomerStorage } from "./customers";
export { ProductStorage } from "./products";
export { OrderStorage } from "./orders";
export { AdminStorage } from "./admin";
export { StatisticsStorage } from "./statistics";
export { EcoActionsStorage } from "./eco-actions";
export { AuthStorage } from "./auth";
export { NotificationsStorage } from "./notifications";
export { PaymentsStorage } from "./payments";
export { MarketingStorage } from "./marketing";