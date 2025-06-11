import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupModularRoutes } from "./routes/index";
import { sendEmail, generatePasswordResetEmail, generateStaffPasswordResetEmail } from "./sendgrid";
import { createPixPayment, getPaymentStatus, createCardPayment, createPixRefund, checkRefundStatus, cancelPixPayment, type CardPaymentData, type PixPaymentData } from "./mercadopago";
import { sendPushNotification, sendOrderStatusNotification, sendEcoPointsNotification, getVapidPublicKey } from "./push-service";
import { insertStaffUserSchema, insertCustomerSchema, insertPushSubscriptionSchema, insertMarketingSubscriptionSchema } from "@shared/schema";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Declaração global para armazenar pedidos temporários
declare global {
  var tempOrders: Map<string, any> | undefined;
  var paymentIntentCache: Map<string, { clientSecret: string; paymentIntentId: string; timestamp: number }> | undefined;
}

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
  console.log('🚀 Registering routes with modular architecture...');
  
  // Initialize payment intent cache
  if (!global.paymentIntentCache) {
    global.paymentIntentCache = new Map();
  }
  
  // Add JSON middleware for all API routes
  app.use('/api', express.json());
  
  // Auth middleware
  await setupAuth(app);
  
  // Setup modular routes (Clean architecture)
  setupModularRoutes(app);
  console.log('✅ Modular routes configured successfully');

  // File serving routes
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
  
  app.use("/uploads", express.static(uploadDir));

  // CNPJ validation route
  app.get('/api/staff/validate-cnpj/:cnpj', async (req, res) => {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj || cnpj.length !== 14) {
        return res.status(400).json({ message: "CNPJ inválido" });
      }

      const existingStaff = await storage.getStaffUserByCnpj(cnpj);
      
      if (existingStaff) {
        return res.json({
          available: false,
          status: existingStaff.approvalStatus,
          message: "CNPJ já cadastrado"
        });
      }
      
      res.json({
        available: true,
        message: "CNPJ disponível"
      });
    } catch (error: any) {
      console.error("Error validating CNPJ:", error);
      res.status(500).json({ message: "Erro ao validar CNPJ" });
    }
  });

  // Staff registration route
  app.post('/api/staff/register', async (req, res) => {
    try {
      const { latitude, longitude, isSponsored, ...otherData } = req.body;
      const staffData = insertStaffUserSchema.parse(otherData);
      
      const existingStaff = await storage.getStaffUserByEmail(staffData.email);
      if (existingStaff) {
        return res.status(400).json({ message: "Email já está cadastrado" });
      }

      const existingCnpj = await storage.getStaffUserByCnpj(staffData.cnpj);
      if (existingCnpj) {
        return res.status(400).json({ message: "CNPJ já está cadastrado" });
      }
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(staffData.password, saltRounds);
      
      const newStaffUser = await storage.createStaffUser({
        ...staffData,
        password: hashedPassword,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        approvalStatus: 'pending'
      });
      
      if (isSponsored) {
        await storage.updateStaffSponsorshipStatus(newStaffUser.id, true);
      }
      
      const { password, ...staffUserResponse } = newStaffUser;
      res.status(201).json({
        ...staffUserResponse,
        isSponsored: isSponsored || false
      });
    } catch (error: any) {
      console.error("Error creating staff user:", error);
      res.status(500).json({ message: "Erro ao criar conta do supermercado" });
    }
  });

  // Staff login route
  app.post('/api/staff/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const staffUser = await storage.getStaffUserByEmail(email);
      if (!staffUser) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      const isValidPassword = await bcrypt.compare(password, staffUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      if (!staffUser.isActive) {
        return res.status(401).json({ message: "Conta inativa. Entre em contato com o suporte." });
      }
      
      const { password: _, ...staffUserResponse } = staffUser;
      res.json(staffUserResponse);
    } catch (error: any) {
      console.error("Error logging in staff user:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  console.log('✅ Clean modular routes registered successfully');
  
  return createServer(app);
}