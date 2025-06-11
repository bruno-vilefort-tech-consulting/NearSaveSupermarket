import type { Express } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "../storage";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({
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

export function registerUploadRoutes(app: Express) {
  // Serve uploaded files with fallback for missing images
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      // Log missing image for monitoring
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
      
      res.json({ missingImages, total: missingImages.length });
    } catch (error) {
      console.error("Error checking missing images:", error);
      res.status(500).json({ error: "Failed to check missing images" });
    }
  });
  
  // Also serve static files normally for other cases
  app.use("/uploads", express.static(uploadDir));
}