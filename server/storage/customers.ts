import { db } from "../db";
import { customers, staffUsers, products, type Customer, type InsertCustomer } from "@shared/schema";
import { eq, and, sql, count, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ICustomerStorage } from "./types";

export class CustomerStorage implements ICustomerStorage {
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.cpf, cpf));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async validateCustomer(email: string, password: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    if (!customer || customer.isActive !== 1 || !customer.password) return undefined;

    try {
      const isValid = await bcrypt.compare(password, customer.password);
      return isValid ? customer : undefined;
    } catch (error) {
      console.error("Error validating customer password:", error);
      return undefined;
    }
  }

  async getSupermarketsWithProducts(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    productCount: number;
  }>> {
    const result = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.companyName,
        address: staffUsers.address,
        productCount: count(products.id),
      })
      .from(staffUsers)
      .leftJoin(products, eq(products.createdByStaff, staffUsers.id))
      .where(
        and(
          eq(staffUsers.isActive, 1),
          eq(products.isActive, 1)
        )
      )
      .groupBy(staffUsers.id, staffUsers.companyName, staffUsers.address)
      .having(sql`count(${products.id}) > 0`);

    return result.map(row => ({
      id: row.id,
      name: row.name || 'Supermercado',
      address: row.address || 'Endereço não informado',
      productCount: row.productCount,
    }));
  }

  async getSupermarketsWithLocations(): Promise<Array<{
    id: number;
    name: string;
    address: string;
    latitude: string | null;
    longitude: string | null;
    productCount: number;
    hasPromotions: boolean;
  }>> {
    const result = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.companyName,
        address: staffUsers.address,
        latitude: staffUsers.latitude,
        longitude: staffUsers.longitude,
        productCount: count(products.id),
      })
      .from(staffUsers)
      .leftJoin(products, eq(products.createdByStaff, staffUsers.id))
      .where(eq(staffUsers.isActive, 1))
      .groupBy(
        staffUsers.id,
        staffUsers.companyName,
        staffUsers.address,
        staffUsers.latitude,
        staffUsers.longitude
      );

    return result.map(row => ({
      id: row.id,
      name: row.name || 'Supermercado',
      address: row.address || 'Endereço não informado',
      latitude: row.latitude,
      longitude: row.longitude,
      productCount: row.productCount,
      hasPromotions: row.productCount > 0,
    }));
  }
}