import type { Express } from "express";
import { storage } from "../storage";
import { insertProductSchema } from "@shared/schema";
import { isAuthenticated } from "../replitAuth";
import { upload } from "./uploads";
import path from "path";
import fs from "fs";

export function registerProductRoutes(app: Express) {
  // Staff product routes (authenticated)
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { category, isActive } = req.query;
      const filters: any = {};
      
      if (category && typeof category === "string") {
        filters.category = category;
      }
      
      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Debug: Log what we're receiving
      console.log("Form body:", req.body);
      console.log("File:", req.file);
      
      // Parse and validate product data from form submission
      const rawData = {
        name: req.body.name,
        description: req.body.description || undefined,
        category: req.body.category,
        originalPrice: req.body.originalPrice,
        discountPrice: req.body.discountPrice,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        expirationDate: req.body.expirationDate,
        isActive: 1,
      };
      
      console.log("Parsed data:", rawData);
      
      const productData = insertProductSchema.parse(rawData);
      
      // Handle image upload
      let imageUrl = null;
      if (req.file) {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const uploadDir = path.join(process.cwd(), "uploads");
        const filepath = path.join(uploadDir, filename);
        fs.renameSync(req.file.path, filepath);
        imageUrl = `/uploads/${filename}`;
      }

      const product = await storage.createProduct({
        ...productData,
        imageUrl,
        createdBy: userId,
      });

      res.status(201).json(product);
    } catch (error: unknown) {
      console.error("Error creating product:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to create product", error: errorMessage });
    }
  });

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Parse update data
      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.originalPrice) updateData.originalPrice = req.body.originalPrice;
      if (req.body.discountPrice) updateData.discountPrice = req.body.discountPrice;
      if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
      if (req.body.expirationDate) updateData.expirationDate = req.body.expirationDate;
      if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;

      // Handle new image upload
      if (req.file) {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const uploadDir = path.join(process.cwd(), "uploads");
        const filepath = path.join(uploadDir, filename);
        fs.renameSync(req.file.path, filepath);
        updateData.imageUrl = `/uploads/${filename}`;
      }

      // Ensure isActive is properly handled if provided
      if (req.body.isActive !== undefined) {
        updateData.isActive = parseInt(req.body.isActive) || 1;
      }

      const productData = insertProductSchema.partial().parse(updateData);
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error: unknown) {
      console.error("Error updating product:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update product", error: errorMessage });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error: unknown) {
      console.error("Error deleting product:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to delete product", error: errorMessage });
    }
  });

  // Endpoint de teste para verificar receita detalhada
  app.get("/api/test/stats/:staffId", async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      const stats = await storage.getStatsForStaff(staffId);
      
      // Buscar dados detalhados para debug
      const { db } = await import("../db");
      const { eq, and, or } = await import("drizzle-orm");
      const { orders, orderItems, products } = await import("@shared/schema");
      
      const validItemsQuery = await db
        .select({ 
          orderId: orders.id,
          priceAtTime: orderItems.priceAtTime,
          quantity: orderItems.quantity,
          confirmationStatus: orderItems.confirmationStatus
        })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(products.createdByStaff, staffId),
            eq(orders.status, "completed"),
            or(
              eq(orderItems.confirmationStatus, "pending"),
              eq(orderItems.confirmationStatus, "confirmed")
            )
          )
        );

      res.json({
        stats,
        debugInfo: {
          validItems: validItemsQuery,
          includedOrderIds: Array.from(new Set(validItemsQuery.map(item => item.orderId))),
          includesOrder281: validItemsQuery.some(item => item.orderId === 281)
        }
      });
    } catch (error) {
      console.error("Error in test stats:", error);
      res.status(500).json({ message: "Failed to fetch test stats" });
    }
  });
}