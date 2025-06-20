import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";

// Import route modules
import { setupAuthRoutes } from "./auth";
import { setupProductRoutes } from "./products";
import { setupOrderRoutes } from "./orders";
import { setupPaymentRoutes } from "./payments";
import { setupAdminRoutes } from "./admin";
import { setupStaffRoutes } from "./staff";
import { setupPushRoutes } from "./push";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🚀 Registering routes...');
  
  // Add JSON middleware for all API routes
  app.use('/api', express.json());
  
  // Setup all route modules
  await setupAuthRoutes(app);
  setupProductRoutes(app);
  setupOrderRoutes(app);
  setupPaymentRoutes(app);
  setupAdminRoutes(app);
  setupStaffRoutes(app);
  setupPushRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  console.log('✅ All routes registered successfully');
  
  return createServer(app);
}