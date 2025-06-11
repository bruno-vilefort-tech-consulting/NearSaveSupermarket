import { db } from "../db";
import { ecoActions, users, type EcoAction, type InsertEcoAction } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { IEcoActionsStorage } from "./types";

export class EcoActionsStorage implements IEcoActionsStorage {
  async createEcoAction(actionData: InsertEcoAction): Promise<EcoAction> {
    const [action] = await db
      .insert(ecoActions)
      .values(actionData)
      .returning();
    return action;
  }

  async getEcoActionsByEmail(email: string): Promise<EcoAction[]> {
    const actions = await db
      .select()
      .from(ecoActions)
      .where(eq(ecoActions.userEmail, email))
      .orderBy(desc(ecoActions.createdAt));
    return actions;
  }

  async updateUserEcoPoints(email: string, pointsToAdd: number): Promise<void> {
    await db
      .update(users)
      .set({
        ecoPoints: sql`COALESCE(${users.ecoPoints}, 0) + ${pointsToAdd}`,
        totalEcoActions: sql`COALESCE(${users.totalEcoActions}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.email, email));
  }
}