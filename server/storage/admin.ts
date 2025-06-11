import { db } from "../db";
import { adminUsers, type AdminUser, type InsertAdminUser } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { IAdminStorage } from "./types";

export class AdminStorage implements IAdminStorage {
  async createAdminUser(adminData: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const [admin] = await db
      .insert(adminUsers)
      .values({
        ...adminData,
        password: hashedPassword
      })
      .returning();
    
    return admin;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    
    return admin;
  }

  async validateAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
    const admin = await this.getAdminUserByEmail(email);
    
    if (!admin) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return null;
    }

    return admin;
  }

  async updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const updateData: any = { ...updates };
    
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    const [admin] = await db
      .update(adminUsers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, id))
      .returning();
    
    return admin;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    const admins = await db
      .select()
      .from(adminUsers);
    
    return admins;
  }
}