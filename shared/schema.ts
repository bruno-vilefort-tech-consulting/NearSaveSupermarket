import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  numeric,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  supermarketName: varchar("supermarket_name"),
  supermarketAddress: varchar("supermarket_address"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 11, scale: 8 }),
  ecoPoints: integer("eco_points").default(0),
  totalEcoActions: integer("total_eco_actions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff/Supermarket registration table
export const staffUsers = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  phone: varchar("phone").notNull(),
  address: text("address").notNull(),
  companyName: varchar("company_name").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 11, scale: 8 }),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer registration table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  cpf: varchar("cpf", { length: 14 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password").notNull(),
  ecoPoints: integer("eco_points").default(0),
  totalEcoActions: integer("total_eco_actions").default(0),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: integer("used").default(0).notNull(), // 0 = not used, 1 = used
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: numeric("discount_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  expirationDate: date("expiration_date").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: integer("is_active").default(1).notNull(), // 1 for active, 0 for inactive
  createdBy: varchar("created_by").references(() => users.id),
  createdByStaff: integer("created_by_staff").references(() => staffUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  deliveryAddress: text("delivery_address"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, prepared, shipped, picked_up
  fulfillmentMethod: varchar("fulfillment_method", { length: 50 }).notNull(), // pickup, delivery
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  lastManualStatus: varchar("last_manual_status", { length: 50 }).default("pending"),
  lastManualUpdate: timestamp("last_manual_update").defaultNow(),
  notes: text("notes"),
  externalReference: varchar("external_reference", { length: 100 }),
  pixPaymentId: varchar("pix_payment_id", { length: 100 }),
  pixRefundId: varchar("pix_refund_id", { length: 100 }),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }),
  refundStatus: varchar("refund_status", { length: 50 }),
  refundDate: timestamp("refund_date"),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: numeric("price_at_time", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Eco Actions table for tracking sustainable actions
export const ecoActions = pgTable("eco_actions", {
  id: serial("id").primaryKey(),
  customerEmail: varchar("customer_email").notNull(),
  actionType: varchar("action_type").notNull(), // 'purchase_near_expiry', 'large_order_discount', 'first_time_customer'
  pointsEarned: integer("points_earned").notNull(),
  description: varchar("description").notNull(),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ecoActionsRelations = relations(ecoActions, ({ one }) => ({
  order: one(orders, { fields: [ecoActions.orderId], references: [orders.id] }),
}));

// Push notification subscriptions table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  customerEmail: varchar("customer_email").notNull(),
  endpoint: varchar("endpoint").notNull(),
  p256dhKey: varchar("p256dh_key").notNull(),
  authKey: varchar("auth_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  customer: one(customers, {
    fields: [pushSubscriptions.customerEmail],
    references: [customers.email],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertEcoActionSchema = createInsertSchema(ecoActions).omit({
  id: true,
  createdAt: true,
});

export const insertStaffUserSchema = createInsertSchema(staffUsers).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  ecoPoints: true,
  totalEcoActions: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  used: true,
  createdAt: true,
});

export type InsertStaffUser = z.infer<typeof insertStaffUserSchema>;
export type StaffUser = typeof staffUsers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertEcoAction = z.infer<typeof insertEcoActionSchema>;
export type EcoAction = typeof ecoActions.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Extended types for API responses
export type ProductWithCreator = Omit<Product, 'createdBy'> & {
  createdBy: User;
};

export type OrderWithItems = Order & {
  orderItems: (OrderItem & {
    product: Product;
  })[];
};
