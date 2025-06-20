import {
  users,
  staffUsers,
  customers,
  adminUsers,
  type User,
  type UpsertUser,
  type StaffUser,
  type InsertStaffUser,
  type Customer,
  type InsertCustomer,
  type AdminUser,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export class UserStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Staff user operations
  async getStaffUserByEmail(email: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.email, email))
      .limit(1);
    return staffUser;
  }

  async getStaffById(id: number): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.id, id))
      .limit(1);
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
    const staffUser = await this.getStaffUserByEmail(email);
    if (!staffUser) {
      return undefined;
    }

    const isValid = await bcrypt.compare(password, staffUser.password);
    if (!isValid) {
      return undefined;
    }

    return staffUser;
  }

  async getStaffUserByCnpj(cnpj: string): Promise<StaffUser | undefined> {
    const [staffUser] = await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.cnpj, cnpj))
      .limit(1);
    return staffUser;
  }

  async updateStaffLocation(id: number, latitude: number, longitude: number): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, id));
  }

  async updateStaffProfile(staffId: number, updateData: Partial<InsertStaffUser>): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, staffId));
  }

  async updateStaffStatus(staffId: number, status: string): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, staffId));
  }

  async updateStaffPassword(email: string, hashedPassword: string): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.email, email));
  }

  async updateStaffSponsorshipStatus(staffId: number, isSponsored: boolean): Promise<void> {
    await db
      .update(staffUsers)
      .set({
        isSponsored,
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, staffId));
  }

  // Staff approval operations
  async getPendingStaffUsers(): Promise<StaffUser[]> {
    return await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.status, "pending"));
  }

  async getStaffUsers(filters?: { status?: string }): Promise<StaffUser[]> {
    let query = db.select().from(staffUsers);
    
    if (filters?.status) {
      query = query.where(eq(staffUsers.status, filters.status));
    }
    
    return await query;
  }

  async getApprovedSupermarkets(): Promise<StaffUser[]> {
    return await db
      .select()
      .from(staffUsers)
      .where(eq(staffUsers.status, "approved"));
  }

  async approveStaffUser(staffId: number, adminId: number): Promise<StaffUser | undefined> {
    const [updatedStaff] = await db
      .update(staffUsers)
      .set({
        status: "approved",
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    return updatedStaff;
  }

  async rejectStaffUser(staffId: number, adminId: number, reason: string): Promise<StaffUser | undefined> {
    const [updatedStaff] = await db
      .update(staffUsers)
      .set({
        status: "rejected",
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(staffUsers.id, staffId))
      .returning();
    return updatedStaff;
  }

  // Customer operations
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
    return customer;
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.cpf, cpf)).limit(1);
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async validateCustomer(email: string, password: string): Promise<Customer | undefined> {
    const customer = await this.getCustomerByEmail(email);
    if (!customer) {
      return undefined;
    }

    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      return undefined;
    }

    return customer;
  }

  async updateCustomerPassword(email: string, hashedPassword: string): Promise<void> {
    await db
      .update(customers)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(customers.email, email));
  }

  // Admin user operations
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    return adminUser;
  }

  async createAdminUser(adminUserData: InsertAdminUser): Promise<AdminUser> {
    const [adminUser] = await db.insert(adminUsers).values(adminUserData).returning();
    return adminUser;
  }

  async validateAdminUser(email: string, password: string): Promise<AdminUser | undefined> {
    const adminUser = await this.getAdminUserByEmail(email);
    if (!adminUser) {
      return undefined;
    }

    const isValid = await bcrypt.compare(password, adminUser.password);
    if (!isValid) {
      return undefined;
    }

    return adminUser;
  }
}