import { db } from "../db";
import { ecoActions, type EcoAction, type InsertEcoAction } from "@shared/schema";
import { eq, desc, sum, count, and, gte, sql } from "drizzle-orm";
import { IEcoActionsStorage } from "./types";

export class EcoActionsStorage implements IEcoActionsStorage {
  async createEcoAction(actionData: InsertEcoAction): Promise<EcoAction> {
    const [action] = await db
      .insert(ecoActions)
      .values(actionData)
      .returning();
    return action;
  }

  async getEcoActionsByUser(userEmail: string): Promise<EcoAction[]> {
    const actions = await db
      .select()
      .from(ecoActions)
      .where(eq(ecoActions.userEmail, userEmail))
      .orderBy(desc(ecoActions.createdAt));
    return actions;
  }

  async getTotalEcoPointsByUser(userEmail: string): Promise<number> {
    const result = await db
      .select({ total: sum(ecoActions.ecoPoints) })
      .from(ecoActions)
      .where(eq(ecoActions.userEmail, userEmail));
    
    return parseInt(result[0]?.total || '0');
  }

  async getEcoActionsStats(): Promise<any> {
    const totalActions = await db
      .select({ count: count() })
      .from(ecoActions);

    const totalPoints = await db
      .select({ total: sum(ecoActions.ecoPoints) })
      .from(ecoActions);

    const recentActions = await db
      .select()
      .from(ecoActions)
      .orderBy(desc(ecoActions.createdAt))
      .limit(10);

    return {
      totalActions: totalActions[0]?.count || 0,
      totalPoints: parseInt(totalPoints[0]?.total || '0'),
      recentActions
    };
  }

  async getEcoLeaderboard(limit: number = 10): Promise<any[]> {
    const leaderboard = await db
      .select({
        userEmail: ecoActions.userEmail,
        totalPoints: sum(ecoActions.ecoPoints),
        actionCount: count(ecoActions.id)
      })
      .from(ecoActions)
      .groupBy(ecoActions.userEmail)
      .orderBy(desc(sum(ecoActions.ecoPoints)))
      .limit(limit);

    return leaderboard.map(entry => ({
      userEmail: entry.userEmail,
      totalPoints: parseInt(entry.totalPoints || '0'),
      actionCount: entry.actionCount
    }));
  }

  async getEcoActionsByPeriod(startDate: Date, endDate: Date): Promise<EcoAction[]> {
    const actions = await db
      .select()
      .from(ecoActions)
      .where(and(
        gte(ecoActions.createdAt, startDate),
        gte(endDate, ecoActions.createdAt)
      ))
      .orderBy(desc(ecoActions.createdAt));
    
    return actions;
  }
}