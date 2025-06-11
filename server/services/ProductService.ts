import { BaseService } from "./BaseService";
import { insertProductSchema, products } from "@shared/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

type Product = typeof products.$inferSelect;
type InsertProduct = typeof products.$inferInsert;

export class ProductService extends BaseService {
  
  async getAllProducts(): Promise<Product[]> {
    try {
      return await this.storage.getProducts();
    } catch (error) {
      this.handleError(error, "ProductService.getAllProducts");
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      return await this.storage.getProduct(id);
    } catch (error) {
      this.handleError(error, "ProductService.getProductById");
    }
  }

  async createProduct(productData: Partial<InsertProduct>): Promise<Product> {
    try {
      // Ensure required fields are set with proper defaults
      const dataWithDefaults = {
        ...productData,
        createdBy: productData.createdBy || undefined,
        createdByStaff: productData.createdByStaff || undefined,
        isActive: productData.isActive ?? 1
      };
      
      const validatedData = insertProductSchema.parse(dataWithDefaults);
      return await this.storage.createProduct(validatedData);
    } catch (error) {
      this.handleError(error, "ProductService.createProduct");
    }
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const validatedData = insertProductSchema.partial().parse(productData);
      const updatedProduct = await this.storage.updateProduct(id, validatedData);
      return updatedProduct;
    } catch (error) {
      this.handleError(error, "ProductService.updateProduct");
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      await this.storage.deleteProduct(id);
    } catch (error) {
      this.handleError(error, "ProductService.deleteProduct");
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const allProducts = await this.storage.getProducts();
      return allProducts.filter(product => product.category === category);
    } catch (error) {
      this.handleError(error, "ProductService.getProductsByCategory");
    }
  }

  async getMissingImages(): Promise<any[]> {
    try {
      const uploadDir = path.join(process.cwd(), "uploads");
      const products = await this.storage.getProducts();
      const missingImages = [];
      
      for (const product of products) {
        if (product.imageUrl) {
          const filename = path.basename(product.imageUrl);
          const filePath = path.join(uploadDir, filename);
          
          if (!fs.existsSync(filePath)) {
            missingImages.push({
              productId: product.id,
              productName: product.name,
              imageUrl: product.imageUrl,
              filename: filename
            });
          }
        }
      }
      
      return missingImages;
    } catch (error) {
      this.handleError(error, "ProductService.getMissingImages");
    }
  }
}