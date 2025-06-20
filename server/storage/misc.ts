import {
  passwordResetTokens,
  pushSubscriptions,
  marketingSubscriptions,
  ecoActions,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type PushSubscription,
  type InsertPushSubscription,
  type MarketingSubscription,
  type InsertMarketingSubscription,
  type EcoAction,
  type InsertEcoAction,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, lte } from "drizzle-orm";

export class MiscStorage {
  // Password reset token operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, now));
  }

  // Push subscription operations
  async createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription> {
    // Check if subscription already exists for this user
    const existing = await this.getPushSubscriptionByEndpoint(subscriptionData.endpoint);
    if (existing) {
      // Update existing subscription
      const [updated] = await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscriptionData.p256dh,
          auth: subscriptionData.auth,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.endpoint, subscriptionData.endpoint))
        .returning();
      return updated;
    }

    const [subscription] = await db.insert(pushSubscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async getPushSubscriptions(userEmail: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userEmail, userEmail));
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    return subscription;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  // Marketing subscription operations
  async createMarketingSubscription(subscriptionData: InsertMarketingSubscription): Promise<MarketingSubscription> {
    const [subscription] = await db.insert(marketingSubscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async getMarketingSubscription(staffId: number): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(marketingSubscriptions)
      .where(
        and(
          eq(marketingSubscriptions.staffId, staffId),
          eq(marketingSubscriptions.status, "active")
        )
      )
      .limit(1);
    return subscription;
  }

  async updateMarketingSubscription(
    staffId: number, 
    updateData: Partial<InsertMarketingSubscription>
  ): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .update(marketingSubscriptions)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(marketingSubscriptions.staffId, staffId))
      .returning();
    return subscription;
  }

  async cancelMarketingSubscription(staffId: number): Promise<void> {
    await db
      .update(marketingSubscriptions)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(marketingSubscriptions.staffId, staffId));
  }

  async getActiveMarketingSubscriptions(): Promise<MarketingSubscription[]> {
    return await db
      .select()
      .from(marketingSubscriptions)
      .where(eq(marketingSubscriptions.status, "active"));
  }

  // Eco actions operations
  async createEcoAction(actionData: InsertEcoAction): Promise<EcoAction> {
    const [action] = await db.insert(ecoActions).values(actionData).returning();
    return action;
  }

  async getEcoActionsByCustomer(customerEmail: string): Promise<EcoAction[]> {
    return await db
      .select()
      .from(ecoActions)
      .where(eq(ecoActions.customerEmail, customerEmail))
      .orderBy(ecoActions.createdAt);
  }

  async getEcoActionsByOrder(orderId: number): Promise<EcoAction[]> {
    return await db
      .select()
      .from(ecoActions)
      .where(eq(ecoActions.orderId, orderId));
  }

  async getTotalEcoPointsByCustomer(customerEmail: string): Promise<number> {
    const [result] = await db
      .select({
        total: db.$count(ecoActions, eq(ecoActions.customerEmail, customerEmail))
      })
      .from(ecoActions)
      .where(eq(ecoActions.customerEmail, customerEmail));

    return result?.total || 0;
  }

  // Utility operations
  async cleanupOldData(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up expired password reset tokens
    await this.cleanupExpiredTokens();

    // Clean up old push subscriptions that haven't been updated
    await db
      .delete(pushSubscriptions)
      .where(lte(pushSubscriptions.updatedAt, thirtyDaysAgo));

    console.log('🧹 Old data cleanup completed');
  }

  // Health check operations
  async healthCheck(): Promise<{
    database: string;
    timestamp: string;
    tablesCount: number;
  }> {
    try {
      // Simple query to check database connectivity
      const [result] = await db.select().from(passwordResetTokens).limit(1);
      
      return {
        database: 'connected',
        timestamp: new Date().toISOString(),
        tablesCount: 8, // Approximate number of main tables
      };
    } catch (error) {
      return {
        database: 'error',
        timestamp: new Date().toISOString(),
        tablesCount: 0,
      };
    }
  }
}