import { db } from "../db";
import { passwordResetTokens, customers, staffUsers, type PasswordResetToken, type InsertPasswordResetToken } from "@shared/schema";
import { eq, lt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { IAuthStorage } from "./types";

export class AuthStorage implements IAuthStorage {
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  async updateCustomerPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(customers)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(customers.email, email));
  }

  async createStaffPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getStaffPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markStaffTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateStaffPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(staffUsers)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.email, email));
  }
}