import { db } from "../db";
import { adminUsers, type AdminUser, type InsertAdminUser } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { IAdminStorage } from "./types";

export class AdminStorage implements IAdminStorage {
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    return adminUser;
  }

  async createAdminUser(adminUserData: InsertAdminUser): Promise<AdminUser> {
    const [adminUser] = await db
      .insert(adminUsers)
      .values(adminUserData)
      .returning();
    return adminUser;
  }

  async validateAdminUser(email: string, password: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(and(
        eq(adminUsers.email, email),
        eq(adminUsers.password, password),
        eq(adminUsers.isActive, 1)
      ));
    return adminUser;
  }
}