import { db } from "../db";
import { staffUsers, type StaffUser, type InsertStaffUser } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { IStaffStorage } from "./types";

export class StaffStorage implements IStaffStorage {
  async getStaffUserByEmail(email: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.email, email));
    return staffUser;
  }

  async createStaffUser(staffUserData: InsertStaffUser): Promise<StaffUser> {
    const [staffUser] = await db
      .insert(staffUsers)
      .values(staffUserData)
      .returning();
    return staffUser;
  }

  async validateStaffUser(email: string, password: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(and(
        eq(staffUsers.email, email),
        eq(staffUsers.password, password),
        eq(staffUsers.isActive, 1)
      ));
    return staffUser;
  }

  async getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.cnpj, cnpj));
    return staffUser;
  }

  async updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, id));
  }

  async getPendingStaffUsers(): Promise<StaffUser[]> {
    return await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.isActive, 0));
  }

  async approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined> {
    const [updatedStaff] = await db
      .update(staffUsers)
      .set({
        isActive: 1,
        approvedBy: adminId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    return updatedStaff;
  }

  async rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined> {
    const [updatedStaff] = await db
      .update(staffUsers)
      .set({
        isActive: -1,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    return updatedStaff;
  }

  async updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        isSponsored: isSponsored ? 1 : 0,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId));
  }

  async getAllStaffUsers(): Promise<StaffUser[]> {
    return await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.isActive, 1));
  }

  async updateStaffData(staffId: number, updateData: Partial<StaffUser>): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId));
  }

  async updateStaffProfile(staffId: number, profileData: {
    companyName?: string;
    email?: string;
    phone?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(staffUsers.id, staffId));
  }
}