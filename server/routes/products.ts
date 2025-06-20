import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { insertProductSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function setupProductRoutes(app: Express) {
  // Serve uploaded files with fallback for missing images
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.log(`Image not found: ${filePath}`);
      res.status(404).json({ error: "Image not found", filename });
    }
  });

  // Check for missing product images
  app.get("/api/admin/missing-images", async (req, res) => {
    try {
      const products = await storage.getProducts();
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
      
      res.json({
        totalProducts: products.length,
        missingImagesCount: missingImages.length,
        missingImages: missingImages
      });
    } catch (error) {
      console.error("Error checking missing images:", error);
      res.status(500).json({ message: "Failed to check missing images" });
    }
  });

  // Get products (with filters)
  app.get("/api/products", async (req, res) => {
    try {
      const { category, isActive, staffId } = req.query;
      const filters: any = {};
      
      if (category && typeof category === "string") {
        filters.category = category;
      }
      
      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }

      if (staffId && typeof staffId === "string") {
        filters.createdByStaff = parseInt(staffId);
      }

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get products for customer (public access)
  app.get("/api/customer/products", async (req, res) => {
    try {
      const { supermarketId, category } = req.query;
      const filters: any = { isActive: true };
      
      if (supermarketId && typeof supermarketId === "string") {
        filters.createdByStaff = parseInt(supermarketId);
      }
      
      if (category && typeof category === "string") {
        filters.category = category;
      }

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching customer products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create product (staff only)
  app.post("/api/products", upload.single("image"), async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const result = insertProductSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: result.error.errors 
        });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const product = await storage.createProduct({
        ...result.data,
        imageUrl,
        createdByStaff: Number(staffId)
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product (staff only)
  app.patch("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      // Check if product exists and belongs to staff
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (existingProduct.createdByStaff !== Number(staffId)) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const updateData: any = { ...req.body };
      
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await storage.updateProduct(productId, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product (staff only)
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      // Check if product exists and belongs to staff
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (existingProduct.createdByStaff !== Number(staffId)) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Toggle product active status
  app.patch("/api/products/:id/toggle-active", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (existingProduct.createdByStaff !== Number(staffId)) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const newActiveStatus = existingProduct.isActive === 1 ? 0 : 1;
      await storage.updateProduct(productId, { isActive: newActiveStatus });
      
      res.json({ 
        message: `Product ${newActiveStatus === 1 ? 'activated' : 'deactivated'} successfully`,
        isActive: newActiveStatus === 1
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      res.status(500).json({ message: "Failed to toggle product status" });
    }
  });
}