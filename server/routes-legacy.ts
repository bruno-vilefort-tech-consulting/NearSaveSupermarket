import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql, and, or } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertOrderSchema, insertStaffUserSchema, insertCustomerSchema, insertPushSubscriptionSchema, insertMarketingSubscriptionSchema, type StaffUser, staffUsers, orders, orderItems, products } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail, generateStaffPasswordResetEmail } from "./sendgrid";
import { createPixPayment, getPaymentStatus, createCardPayment, createPixRefund, checkRefundStatus, cancelPixPayment, type CardPaymentData, type PixPaymentData } from "./mercadopago";
import { sendPushNotification, sendOrderStatusNotification, sendEcoPointsNotification, getVapidPublicKey } from "./push-service";
import { setupModularRoutes } from "./routes/index";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🚀 Registering essential legacy routes...');
  
  // Initialize payment intent cache
  if (!global.paymentIntentCache) {
    global.paymentIntentCache = new Map();
  }
  
  // Add JSON middleware for all API routes
  app.use('/api', express.json());
  
  // Auth middleware
  await setupAuth(app);
  
  // Setup modular routes (Quick Wins architecture improvement)
  setupModularRoutes(app);
  console.log('✅ Modular routes integrated successfully');

  // Essential file serving routes
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
  
  app.use("/uploads", express.static(uploadDir));

  // Essential payment routes (PIX, Stripe, etc.)
  // [Keep only critical payment processing routes that can't be modularized]

  // Essential monitoring and health check routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  console.log('✅ Essential legacy routes registered');
  
  return createServer(app);
}