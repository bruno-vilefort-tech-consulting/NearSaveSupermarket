import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { setupAuth } from "../replitAuth";
import { registerAuthRoutes } from "./auth";
import { registerStaffRoutes } from "./staff";
import { registerPublicRoutes } from "./public";
import { registerOrderRoutes } from "./orders";
import { registerPaymentRoutes } from "./payments";
import { registerProductRoutes } from "./products";
import { registerUploadRoutes } from "./uploads";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🚀 Registering routes...');
  
  // Add JSON middleware for all API routes
  app.use('/api', express.json());
  
  // Auth middleware
  await setupAuth(app);
  
  // Register all route modules
  registerUploadRoutes(app);
  registerAuthRoutes(app);
  registerStaffRoutes(app);
  registerPublicRoutes(app);
  registerOrderRoutes(app);
  registerPaymentRoutes(app);
  registerProductRoutes(app);

  const server = createServer(app);
  return server;
}