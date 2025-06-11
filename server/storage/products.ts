import { db } from "../db";
import { products, staffUsers, type Product, type InsertProduct, type ProductWithCreator } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { IProductStorage } from "./types";

export class ProductStorage implements IProductStorage {
  async getProducts(filters?: { category?: string; isActive?: boolean }): Promise<ProductWithCreator[]> {
    let conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive ? 1 : 0));
    }

    const query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        originalPrice: products.originalPrice,
        discountPrice: products.discountPrice,
        quantity: products.quantity,
        expirationDate: products.expirationDate,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdBy: products.createdBy,
        createdByStaff: products.createdByStaff,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt));

    const results = await query;
    
    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      originalPrice: result.originalPrice,
      discountPrice: result.discountPrice,
      quantity: result.quantity,
      expirationDate: result.expirationDate,
      imageUrl: result.imageUrl,
      isActive: result.isActive,
      createdBy: result.createdBy,
      createdByStaff: result.createdByStaff,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  async getProduct(id: number): Promise<ProductWithCreator | undefined> {
    const [result] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        originalPrice: products.originalPrice,
        discountPrice: products.discountPrice,
        quantity: products.quantity,
        expirationDate: products.expirationDate,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdBy: products.createdBy,
        createdByStaff: products.createdByStaff,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        createdByUser: staffUsers,
      })
      .from(products)
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      originalPrice: result.originalPrice,
      discountPrice: result.discountPrice,
      quantity: result.quantity,
      expirationDate: result.expirationDate,
      imageUrl: result.imageUrl,
      isActive: result.isActive,
      createdBy: result.createdBy,
      createdByStaff: result.createdByStaff,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async createProduct(productData: InsertProduct & { createdBy: string }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return result.rowCount > 0;
  }

  async getProductsByStaff(staffId: number): Promise<ProductWithCreator[]> {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        originalPrice: products.originalPrice,
        discountPrice: products.discountPrice,
        quantity: products.quantity,
        expirationDate: products.expirationDate,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdBy: products.createdBy,
        createdByStaff: products.createdByStaff,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        createdByUser: staffUsers,
      })
      .from(products)
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(products.createdByStaff, staffId))
      .orderBy(desc(products.createdAt));

    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      originalPrice: result.originalPrice,
      discountPrice: result.discountPrice,
      quantity: result.quantity,
      expirationDate: result.expirationDate,
      imageUrl: result.imageUrl,
      isActive: result.isActive,
      createdBy: result.createdBy,
      createdByStaff: result.createdByStaff,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }

  async createProductForStaff(productData: InsertProduct & { createdByStaff: number }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async getProductsBySupermarket(staffId: number): Promise<ProductWithCreator[]> {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        originalPrice: products.originalPrice,
        discountPrice: products.discountPrice,
        quantity: products.quantity,
        expirationDate: products.expirationDate,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdBy: products.createdBy,
        createdByStaff: products.createdByStaff,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        createdByUser: staffUsers,
      })
      .from(products)
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(
        and(
          eq(products.createdByStaff, staffId),
          eq(products.isActive, 1)
        )
      )
      .orderBy(desc(products.createdAt));

    return results.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      originalPrice: result.originalPrice,
      discountPrice: result.discountPrice,
      quantity: result.quantity,
      expirationDate: result.expirationDate,
      imageUrl: result.imageUrl,
      isActive: result.isActive,
      createdBy: result.createdBy,
      createdByStaff: result.createdByStaff,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }
}