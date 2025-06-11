import { Express } from "express";
import productRoutes from "./productRoutes";
import orderRoutes from "./orderRoutes";
import authRoutes from "./authRoutes";

export function setupModularRoutes(app: Express): void {
  // Authentication routes
  app.use("/api/auth", authRoutes);
  
  // Product management routes
  app.use("/api/products", productRoutes);
  
  // Order management routes
  app.use("/api/orders", orderRoutes);
  
  console.log("✅ Modular routes configured successfully");
}