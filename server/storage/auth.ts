import { db } from "../db";
import { passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
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
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, 0),
        gt(passwordResetTokens.expiresAt, new Date())
      ));
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(id: number): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({
        used: 1,
        updatedAt: new Date()
      })
      .where(eq(passwordResetTokens.id, id));
  }

  async validatePasswordResetToken(token: string, email: string): Promise<PasswordResetToken | null> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.email, email),
        eq(passwordResetTokens.used, 0),
        gt(passwordResetTokens.expiresAt, new Date())
      ));

    return resetToken || null;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({
        used: 1,
        updatedAt: new Date()
      })
      .where(and(
        eq(passwordResetTokens.used, 0),
        gt(new Date(), passwordResetTokens.expiresAt)
      ));
  }

  async getTokensByEmail(email: string): Promise<PasswordResetToken[]> {
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.email, email));
    return tokens;
  }
}