import {
  products,
  staffUsers,
  type Product,
  type InsertProduct,
  type ProductWithCreator,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

export class ProductStorage {
  async getProducts(filters?: { 
    category?: string; 
    isActive?: boolean; 
    createdByStaff?: number; 
  }): Promise<ProductWithCreator[]> {
    let query = db
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
        creatorName: staffUsers.companyName,
        creatorEmail: staffUsers.email,
      })
      .from(products)
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .orderBy(desc(products.createdAt));

    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive ? 1 : 0));
    }

    if (filters?.createdByStaff) {
      conditions.push(eq(products.createdByStaff, filters.createdByStaff));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getProduct(id: number): Promise<ProductWithCreator | undefined> {
    const [product] = await db
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
        creatorName: staffUsers.companyName,
        creatorEmail: staffUsers.email,
      })
      .from(products)
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(eq(products.id, id))
      .limit(1);

    return product;
  }

  async createProduct(productData: InsertProduct & { createdBy?: string; createdByStaff?: number }): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
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
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Staff-specific product operations
  async getProductsByStaff(staffId: number): Promise<ProductWithCreator[]> {
    return this.getProducts({ createdByStaff: staffId });
  }

  async createProductForStaff(productData: InsertProduct & { createdByStaff: number }): Promise<Product> {
    return this.createProduct(productData);
  }

  // Product statistics
  async getProductStats(staffId?: number): Promise<{
    activeProducts: number;
    totalProducts: number;
    categories: Array<{ category: string; count: number }>;
  }> {
    let activeQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, 1));

    let totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    let categoriesQuery = db
      .select({
        category: products.category,
        count: sql<number>`count(*)`
      })
      .from(products)
      .groupBy(products.category);

    if (staffId) {
      activeQuery = activeQuery.where(eq(products.createdByStaff, staffId));
      totalQuery = totalQuery.where(eq(products.createdByStaff, staffId));
      categoriesQuery = categoriesQuery.where(eq(products.createdByStaff, staffId));
    }

    const [activeResult] = await activeQuery;
    const [totalResult] = await totalQuery;
    const categoriesResult = await categoriesQuery;

    return {
      activeProducts: activeResult.count,
      totalProducts: totalResult.count,
      categories: categoriesResult,
    };
  }

  // Get products near expiration
  async getProductsNearExpiration(days: number = 7, staffId?: number): Promise<ProductWithCreator[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    let query = db
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
        creatorName: staffUsers.companyName,
        creatorEmail: staffUsers.email,
      })
      .from(products)
      .leftJoin(staffUsers, eq(products.createdByStaff, staffUsers.id))
      .where(
        and(
          eq(products.isActive, 1),
          sql`${products.expirationDate} <= ${expirationDate.toISOString().split('T')[0]}`
        )
      )
      .orderBy(products.expirationDate);

    if (staffId) {
      query = query.where(eq(products.createdByStaff, staffId));
    }

    return await query;
  }

  // Update product quantity
  async updateProductQuantity(id: number, quantity: number): Promise<Product | undefined> {
    return this.updateProduct(id, { quantity });
  }

  // Toggle product active status
  async toggleProductActiveStatus(id: number): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) {
      return undefined;
    }

    const newActiveStatus = product.isActive === 1 ? 0 : 1;
    return this.updateProduct(id, { isActive: newActiveStatus });
  }
}