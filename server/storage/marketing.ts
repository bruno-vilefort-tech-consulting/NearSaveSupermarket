import { db } from "../db";
import { marketingSubscriptions, type MarketingSubscription, type InsertMarketingSubscription } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { IMarketingStorage } from "./types";

export class MarketingStorage implements IMarketingStorage {
  async createMarketingSubscription(subscriptionData: InsertMarketingSubscription): Promise<MarketingSubscription> {
    const [subscription] = await db
      .insert(marketingSubscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async getMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(marketingSubscriptions)
      .where(eq(marketingSubscriptions.staffId, staffId));
    return subscription;
  }

  async getActiveMarketingSubscriptionByStaffId(staffId: number): Promise<MarketingSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(marketingSubscriptions)
      .where(and(
        eq(marketingSubscriptions.staffId, staffId),
        eq(marketingSubscriptions.status, 'active')
      ));
    return subscription;
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
    return subscription;
  }

  async cancelMarketingSubscription(staffId: number): Promise<boolean> {
    const result = await db
      .update(marketingSubscriptions)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(marketingSubscriptions.staffId, staffId));
    return (result.rowCount || 0) > 0;
  }
}