import { db } from "../db";
import { pushSubscriptions, type PushSubscription, type InsertPushSubscription } from "@shared/schema";
import { eq } from "drizzle-orm";
import { INotificationsStorage } from "./types";

export class NotificationsStorage implements INotificationsStorage {
  async createPushSubscription(subscriptionData: InsertPushSubscription): Promise<PushSubscription> {
    const [subscription] = await db
      .insert(pushSubscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async getPushSubscriptionsByEmail(email: string): Promise<PushSubscription[]> {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userEmail, email));
    return subscriptions;
  }

  async removePushSubscription(id: number): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.id, id));
  }
}