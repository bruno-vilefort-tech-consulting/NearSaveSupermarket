// Re-export the modular storage system for backward compatibility
export { storage, IStorage, DatabaseStorage } from "./storage/index";

// Export all storage modules for direct access if needed
export {
  UserStorage,
  StaffStorage,
  CustomerStorage,
  ProductStorage,
  OrderStorage,
  AdminStorage,
  StatisticsStorage,
  EcoActionsStorage,
  AuthStorage,
  NotificationsStorage,
  PaymentsStorage,
  MarketingStorage
} from "./storage/index";

// Export all storage interfaces and types
export * from "./storage/types";