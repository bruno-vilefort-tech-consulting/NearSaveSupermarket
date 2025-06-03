import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertOrderSchema, insertStaffUserSchema, insertCustomerSchema, insertPushSubscriptionSchema } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail, generateStaffPasswordResetEmail } from "./sendgrid";
import { createPixPayment, getPaymentStatus, createCardPayment, type CardPaymentData, type PixPaymentData } from "./mercadopago";
import { sendPushNotification, sendOrderStatusNotification, sendEcoPointsNotification, getVapidPublicKey } from "./push-service";

// Declaração global para armazenar pedidos temporários
declare global {
  var tempOrders: Map<string, any> | undefined;
}
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

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🚀 Registering routes...');
  
  // Add JSON middleware for all API routes
  app.use('/api', express.json());
  
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Staff registration route
  app.post('/api/staff/register', async (req, res) => {
    try {
      const { latitude, longitude, ...otherData } = req.body;
      const staffData = insertStaffUserSchema.parse(otherData);
      
      // Check if email already exists
      const existingStaff = await storage.getStaffUserByEmail(staffData.email);
      if (existingStaff) {
        return res.status(400).json({ message: "Email já está cadastrado" });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(staffData.password, saltRounds);
      
      // Create staff user with location data
      const newStaffUser = await storage.createStaffUser({
        ...staffData,
        password: hashedPassword,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null
      });
      
      // Return user without password
      const { password, ...staffUserResponse } = newStaffUser;
      res.status(201).json(staffUserResponse);
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
      
      // Return user without password
      const { password: _, ...staffUserResponse } = staffUser;
      res.json(staffUserResponse);
    } catch (error: any) {
      console.error("Error logging in staff user:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });

  // Staff routes - no authentication required since we check localStorage on frontend
  app.get('/api/staff/stats', async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }
      
      const stats = await storage.getStatsForStaff(Number(staffId));
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching staff stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get monthly completed orders summary for staff
  app.get('/api/staff/monthly-orders', async (req, res) => {
    try {
      const staffId = parseInt(req.headers['x-staff-id'] as string);
      if (!staffId) {
        return res.status(400).json({ message: 'Staff ID is required' });
      }

      const monthlyOrders = await storage.getMonthlyCompletedOrders(staffId);
      res.json(monthlyOrders);
    } catch (error: any) {
      console.error('Error fetching monthly orders:', error);
      res.status(500).json({ message: 'Failed to fetch monthly orders' });
    }
  });

  // Staff products routes
  app.get('/api/staff/products', async (req, res) => {
    try {
      // Get staff ID from session/token (simplified approach using header for now)
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }
      
      const products = await storage.getProductsByStaff(parseInt(staffId));
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/staff/products', upload.single('image'), async (req, res) => {
    try {
      // Get staff ID from session/token
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        originalPrice: req.body.originalPrice.toString(),
        discountPrice: req.body.discountPrice.toString(),
        quantity: parseInt(req.body.quantity),
      });

      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const product = await storage.createProductForStaff({
        ...productData,
        imageUrl,
        createdByStaff: parseInt(staffId),
      });

      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public product routes for customers
  app.get("/api/public/products", async (req, res) => {
    try {
      const category = req.query.category as string;
      const filters = category ? { category, isActive: true } : { isActive: true };
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching public products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Gerar PIX sem criar pedido
  app.post("/api/pix/generate", async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, totalAmount, items } = req.body;
      console.log('📝 Gerando PIX sem criar pedido:', { customerName, customerEmail, totalAmount });
      
      // Gerar ID temporário único para o PIX
      const tempOrderId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pixData: PixPaymentData = {
        amount: parseFloat(totalAmount),
        description: `Pedido ${tempOrderId}`,
        orderId: tempOrderId,
        customerEmail,
        customerName,
        customerPhone
      };

      const pixPayment = await createPixPayment(pixData);
      
      // Salvar dados temporários do pedido para criação posterior
      const tempOrderData = {
        tempOrderId,
        customerName,
        customerEmail,
        customerPhone,
        totalAmount,
        items,
        pixPaymentId: pixPayment.id,
        createdAt: new Date().toISOString()
      };
      
      // Em um sistema real, isso seria salvo em cache/Redis
      // Por enquanto vamos usar uma variável global temporária
      if (!global.tempOrders) {
        global.tempOrders = new Map();
      }
      global.tempOrders.set(tempOrderId, tempOrderData);
      
      console.log('✅ PIX gerado com sucesso:', pixPayment.id);
      res.json({
        tempOrderId,
        pixPayment,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
      });
    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);
      res.status(500).json({ message: "Erro ao gerar PIX" });
    }
  });

  // Confirmar pagamento PIX e criar pedido
  app.post("/api/pix/confirm", async (req, res) => {
    try {
      const { tempOrderId, pixPaymentId, customerData } = req.body;
      console.log('🔍 Confirmando pagamento PIX:', { tempOrderId, pixPaymentId });
      
      // Verificar se já existe um pedido para este PIX (proteção contra duplicação)
      const existingOrder = await storage.getOrderByExternalReference(tempOrderId);
      if (existingOrder) {
        console.log('⚠️ Pedido já existe para este PIX:', existingOrder.id);
        return res.json({ order: existingOrder, paymentStatus: { status: 'approved' } });
      }
      
      // Buscar dados temporários do pedido
      let tempOrderData;
      if ((global as any).tempOrders && (global as any).tempOrders.has(tempOrderId)) {
        tempOrderData = (global as any).tempOrders.get(tempOrderId);
        console.log('✅ Dados encontrados na memória do servidor');
      } else {
        // Se os dados não estão na memória (servidor reiniciou), usar dados do frontend
        console.log('⚠️ Dados temporários não encontrados na memória, usando dados do frontend...');
        
        if (!customerData) {
          return res.status(400).json({ message: "Dados do pedido não encontrados e nenhum dado foi enviado pelo frontend" });
        }
        
        // Verificar se o pagamento existe no Mercado Pago
        const paymentInfo = await getPaymentStatus(pixPaymentId);
        if (!paymentInfo) {
          return res.status(404).json({ message: "Pagamento PIX não encontrado" });
        }
        
        // Usar dados do cliente enviados pelo frontend
        tempOrderData = {
          tempOrderId,
          customerName: customerData.customerName,
          customerEmail: customerData.customerEmail,
          customerPhone: customerData.customerPhone,
          totalAmount: customerData.totalAmount,
          items: customerData.items,
          pixPaymentId: pixPaymentId,
          createdAt: new Date().toISOString()
        };
        
        console.log('✅ Usando dados do cliente enviados pelo frontend');
      }
      
      // Verificar status do pagamento no Mercado Pago
      const paymentStatus = await getPaymentStatus(pixPaymentId);
      
      if (paymentStatus.status !== 'approved') {
        return res.status(400).json({ 
          message: "Pagamento não foi aprovado", 
          status: paymentStatus.status 
        });
      }
      
      // Criar pedido real no banco de dados
      const orderData = {
        customerName: tempOrderData.customerName,
        customerEmail: tempOrderData.customerEmail,
        customerPhone: tempOrderData.customerPhone,
        status: "pending",
        fulfillmentMethod: "pickup",
        deliveryAddress: null,
        totalAmount: tempOrderData.totalAmount,
        externalReference: tempOrderId // Adicionar referência externa para evitar duplicação
      };

      const orderItems = tempOrderData.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      }));

      const order = await storage.createOrder(orderData, orderItems);
      
      // Remover dados temporários
      if ((global as any).tempOrders) {
        (global as any).tempOrders.delete(tempOrderId);
      }
      
      console.log('✅ Pedido confirmado e criado:', order.id);
      res.json({ order, paymentStatus });
    } catch (error: any) {
      console.error('❌ Erro ao confirmar pagamento PIX:', error);
      res.status(500).json({ message: "Erro ao confirmar pagamento PIX", error: error.message });
    }
  });

  // Verificar status do pagamento PIX
  app.get("/api/payments/pix/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      console.log('🔍 Verificando status do pagamento PIX:', paymentId);
      
      const paymentStatus = await getPaymentStatus(paymentId);
      console.log('✅ Status do pagamento PIX:', paymentStatus);
      
      res.json(paymentStatus);
    } catch (error: any) {
      console.error('❌ Erro ao verificar status do PIX:', error);
      res.status(500).json({ message: "Erro ao verificar status do pagamento", error: error.message });
    }
  });

  // Public order creation for customers (mantido para compatibilidade)
  app.post("/api/public/orders", async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, fulfillmentMethod, deliveryAddress, totalAmount, items } = req.body;
      
      if (!customerName || !customerPhone || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user is authenticated and get their email
      let userEmail = customerEmail || null;
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const user = await storage.getUser(req.user.claims.sub);
        if (user && user.email) {
          userEmail = user.email;
        }
      }

      const orderData = {
        customerName,
        customerEmail: userEmail,
        customerPhone,
        status: "pending",
        fulfillmentMethod: fulfillmentMethod || "pickup",
        deliveryAddress: deliveryAddress || null,
        totalAmount
      };

      const orderItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      }));

      const order = await storage.createOrder(orderData, orderItems);
      res.json(order);
    } catch (error) {
      console.error("Error creating public order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Public endpoint to get customer orders by phone
  app.get("/api/public/orders/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const orders = await storage.getOrdersByPhone(phone);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Public endpoint to get eco actions by email or phone
  app.get("/api/public/eco-actions/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      if (!identifier) {
        return res.status(400).json({ message: "Email or phone is required" });
      }

      const ecoActions = await storage.getEcoActionsByEmail(identifier);
      res.json(ecoActions);
    } catch (error) {
      console.error("Error fetching eco actions:", error);
      res.status(500).json({ message: "Failed to fetch eco actions" });
    }
  });

  // Public endpoint to get user eco points
  app.get("/api/public/user-eco-points/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      if (!identifier) {
        return res.status(400).json({ message: "Email or phone is required" });
      }

      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return res.json({ ecoPoints: 0, totalEcoActions: 0 });
      }

      res.json({ 
        ecoPoints: user.ecoPoints || 0, 
        totalEcoActions: user.totalEcoActions || 0 
      });
    } catch (error) {
      console.error("Error fetching user eco points:", error);
      res.status(500).json({ message: "Failed to fetch user eco points" });
    }
  });

  // Authenticated endpoint to get current user's orders
  app.get("/api/my-orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Buscar pedidos pelos dados do usuário (email ou telefone se disponível)
      let orders = [];
      if (user.email) {
        orders = await storage.getOrdersByEmail(user.email);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

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
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid product data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      // Get staff ID from headers (same as other staff routes)
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Parse form data for updates
      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.originalPrice) updateData.originalPrice = req.body.originalPrice;
      if (req.body.discountPrice) updateData.discountPrice = req.body.discountPrice;
      if (req.body.quantity) updateData.quantity = parseInt(req.body.quantity);
      if (req.body.expirationDate) updateData.expirationDate = req.body.expirationDate;

      const productData = insertProductSchema.partial().parse(updateData);
      
      // Handle image upload
      if (req.file) {
        const filename = `${Date.now()}-${req.file.originalname}`;
        const filepath = path.join(uploadDir, filename);
        fs.renameSync(req.file.path, filepath);
        productData.imageUrl = `/uploads/${filename}`;
      }

      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid product data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      // Get staff ID from headers (same as other staff routes)
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Staff order routes
  app.get("/api/staff/orders", async (req, res) => {
    try {
      // Get staff ID from headers (set by frontend)
      const staffId = req.headers['x-staff-id'];
      
      if (!staffId) {
        return res.status(401).json({ message: "Staff authentication required" });
      }

      const { status } = req.query;
      const filters: any = {};
      
      if (status && typeof status === "string") {
        filters.status = status;
      }

      const staffIdNum = parseInt(staffId as string);
      console.log(`Fetching orders for staff ID: ${staffIdNum}`);
      const orders = await storage.getOrdersByStaff(staffIdNum, filters);
      console.log(`Fetched ${orders.length} orders for staff ${staffIdNum}`);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Legacy route for backward compatibility (keeping for Replit auth users)
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};
      
      if (status && typeof status === "string") {
        filters.status = status;
      }

      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      
      // Validate order data
      const orderData = insertOrderSchema.parse(order);
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must have at least one item" });
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += parseFloat(item.priceAtTime) * item.quantity;
      }

      const newOrder = await storage.createOrder(
        { ...orderData, totalAmount: totalAmount.toString() },
        items
      );

      res.status(201).json(newOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid order data",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Staff route for updating order status
  app.put("/api/staff/orders/:id/status", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'];
      
      if (!staffId) {
        return res.status(401).json({ message: "Staff authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ["pending", "confirmed", "preparing", "ready", "shipped", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status",
          validStatuses 
        });
      }

      console.log(`MANUAL STATUS UPDATE: Order ${id} status changed to ${status} by staff ${staffId}`);
      const order = await storage.updateOrderStatus(id, status, `STAFF_${staffId}`);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Legacy route for Replit auth users - SECURED WITH PROPER PROTECTIONS
  app.put("/api/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ["pending", "confirmed", "preparing", "ready", "shipped", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status",
          validStatuses 
        });
      }

      // SECURITY: Apply same protections as staff route
      console.log(`BLOCKED LEGACY ROUTE: Attempted status change for order ${id} via legacy route`);
      return res.status(403).json({ 
        message: "This route is deprecated. Use /api/staff/orders/:id/status instead",
        redirectTo: `/api/staff/orders/${id}/status`
      });

    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Statistics route
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Customer Authentication Routes
  app.post("/api/customer/register", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check if customer already exists by email or CPF
      const existingByEmail = await storage.getCustomerByEmail(validatedData.email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const existingByCpf = await storage.getCustomerByCpf(validatedData.cpf);
      if (existingByCpf) {
        return res.status(400).json({ message: "CPF já cadastrado" });
      }

      const customer = await storage.createCustomer(validatedData);
      
      // Remove password from response
      const { password, ...customerResponse } = customer;
      res.json(customerResponse);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const customer = await storage.validateCustomer(email, password);
      if (!customer) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Remove password from response
      const { password: _, ...customerResponse } = customer;
      res.json(customerResponse);
    } catch (error) {
      console.error("Error during customer login:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });

  app.post("/api/customer/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        // For security, don't reveal if email exists or not
        return res.json({ message: "Se o email existir, você receberá instruções para redefinir sua senha." });
      }

      // Clean up expired tokens first
      await storage.cleanupExpiredTokens();

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Save token to database
      await storage.createPasswordResetToken({
        email: customer.email,
        token: resetToken,
        expiresAt
      });

      // Generate reset link - use the correct host for Replit
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      const resetLink = `https://${host}/customer/reset-password?token=${resetToken}`;
      
      // Generate email content
      const emailContent = generatePasswordResetEmail(resetLink, customer.fullName);
      
      // Send email
      const emailSent = await sendEmail({
        to: customer.email,
        from: 'suporte@ecomart.vc',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      if (!emailSent) {
        console.error('Failed to send password reset email to:', customer.email);
        return res.status(500).json({ message: "Erro ao enviar email. Verifique sua configuração do SendGrid." });
      }

      console.log('Password reset email sent successfully to:', customer.email);
      res.json({ message: "Instruções para redefinir sua senha foram enviadas para seu email." });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/customer/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Verify token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      // Update password
      await storage.updateCustomerPassword(resetToken.email, newPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(token);

      console.log('Password reset completed for:', resetToken.email);
      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Staff password reset routes
  app.post("/api/staff/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const staffUser = await storage.getStaffUserByEmail(email);
      if (!staffUser) {
        // For security, don't reveal if email exists or not
        return res.json({ message: "Se o email existir, você receberá instruções para redefinir sua senha." });
      }

      // Clean up expired tokens first
      await storage.cleanupExpiredTokens();

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Save token to database
      await storage.createStaffPasswordResetToken({
        token: resetToken,
        email: email,
        expiresAt: expiresAt,
        used: 0
      });

      // Create reset link - use the correct host for Replit
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      const resetLink = `https://${host}/staff/reset-password?token=${resetToken}`;
      
      console.log('Generated reset link:', resetLink);
      
      // Generate email content
      const emailContent = generateStaffPasswordResetEmail(resetLink, staffUser.companyName);
      
      // Send email
      const emailSent = await sendEmail({
        to: email,
        from: 'suporte@ecomart.vc',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      if (emailSent) {
        console.log('Staff password reset email sent successfully to:', email);
        res.json({ message: "Instruções para redefinição de senha enviadas para seu email." });
      } else {
        console.error('Failed to send staff password reset email to:', email);
        res.status(500).json({ message: "Erro ao enviar email. Tente novamente." });
      }
    } catch (error) {
      console.error("Error in staff forgot password:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/staff/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Verify token
      const resetToken = await storage.getStaffPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      // Update password
      await storage.updateStaffPassword(resetToken.email, password);
      
      // Mark token as used
      await storage.markStaffTokenAsUsed(token);

      console.log('Staff password reset completed for:', resetToken.email);
      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Error in staff reset password:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Customer Routes - List supermarkets with products
  app.get("/api/customer/supermarkets", async (req, res) => {
    try {
      const supermarkets = await storage.getSupermarketsWithProducts();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets:", error);
      res.status(500).json({ message: "Erro ao buscar supermercados" });
    }
  });

  // Customer Routes - Get supermarkets with locations for map
  app.get("/api/customer/supermarkets/map", async (req, res) => {
    try {
      const supermarkets = await storage.getSupermarketsWithLocations();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets with locations:", error);
      res.status(500).json({ message: "Erro ao buscar localizações dos supermercados" });
    }
  });

  // Customer Routes - Get supermarkets with locations for proximity filtering
  app.get("/api/customer/supermarkets-with-locations", async (req, res) => {
    try {
      const supermarkets = await storage.getSupermarketsWithLocations();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets with locations:", error);
      res.status(500).json({ message: "Erro ao buscar supermercados com localizações" });
    }
  });

  // Customer Routes - Get products by supermarket
  app.get("/api/customer/supermarket/:id/products", async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      if (isNaN(staffId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const products = await storage.getProductsBySupermarket(staffId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching supermarket products:", error);
      res.status(500).json({ message: "Erro ao buscar produtos do supermercado" });
    }
  });

  // Customer Routes - Get customer orders
  app.get("/api/customer/orders", async (req, res) => {
    try {
      const { phone, email } = req.query;
      
      if (!phone && !email) {
        return res.status(400).json({ message: "Telefone ou email é obrigatório" });
      }

      let orders;
      if (email) {
        orders = await storage.getOrdersByEmail(email as string);
      } else {
        orders = await storage.getOrdersByPhone(phone as string);
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos do cliente" });
    }
  });

  // PIX Payment Routes
  app.post("/api/payments/pix/create", async (req, res) => {
    try {
      const { orderId, amount, description, customerEmail, customerName, customerPhone } = req.body;
      
      if (!orderId || !amount || !customerEmail || !customerName) {
        return res.status(400).json({ message: "Dados obrigatórios: orderId, amount, customerEmail, customerName" });
      }

      const pixPayment = await createPixPayment({
        orderId: orderId.toString(),
        amount: parseFloat(amount),
        description: description || `Pedido #${orderId}`,
        customerEmail,
        customerName,
        customerPhone
      });

      res.json(pixPayment);
    } catch (error) {
      console.error("Error creating PIX payment:", error);
      res.status(500).json({ message: "Erro ao criar pagamento PIX" });
    }
  });

  // Test endpoint without auth
  app.post("/api/test-card-payment", async (req, res) => {
    console.log('🏁 Test card payment endpoint called');
    res.json({ message: "Test endpoint working" });
  });

  // Card Payment Routes
  app.post("/api/create-card-payment", async (req, res) => {
    try {
      console.log('🏁 Card payment endpoint called with data:', {
        orderId: req.body.orderId,
        amount: req.body.amount,
        cardDataReceived: !!req.body.cardData,
        customerDataReceived: !!req.body.customerData
      });
      
      const { orderId, amount, cardData, customerData } = req.body;
      
      if (!orderId || !amount || !cardData || !customerData) {
        return res.status(400).json({ 
          success: false,
          message: "Dados obrigatórios: orderId, amount, cardData, customerData" 
        });
      }

      // Validar dados do cartão
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        return res.status(400).json({
          success: false,
          message: "Dados do cartão incompletos"
        });
      }

      // Mercado Pago tem valor mínimo para pagamentos por cartão
      const finalAmount = Math.max(parseFloat(amount), 0.50);
      
      const cardPaymentData: CardPaymentData = {
        orderId: orderId.toString(),
        amount: finalAmount,
        description: `Pedido #${orderId}`,
        cardData: {
          number: cardData.number,
          name: cardData.name,
          expiry: cardData.expiry,
          cvv: cardData.cvv
        },
        customerData: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone
        }
      };

      const cardPaymentResult = await createCardPayment(cardPaymentData);
      
      // Se o pagamento foi aprovado, atualizar status do pedido
      if (cardPaymentResult.success && cardPaymentResult.status === 'approved') {
        await storage.updateOrderStatus(parseInt(orderId), 'paid', 'CARD_PAYMENT');
        console.log(`Order ${orderId} marked as paid via card`);
      }

      res.json(cardPaymentResult);
    } catch (error) {
      console.error("Error creating card payment:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao processar pagamento por cartão" 
      });
    }
  });

  app.get("/api/payments/pix/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID é obrigatório" });
      }

      const paymentStatus = await getPaymentStatus(paymentId);
      res.json(paymentStatus);
    } catch (error) {
      console.error("Error getting payment status:", error);
      res.status(500).json({ message: "Erro ao consultar status do pagamento" });
    }
  });

  // Mercado Pago Webhook
  app.post("/api/mercadopago/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      console.log("Mercado Pago webhook received:", req.body);
      
      const notification = JSON.parse(req.body.toString());
      
      if (notification.type === 'payment') {
        const paymentId = notification.data.id;
        const paymentStatus = await getPaymentStatus(paymentId);
        
        console.log("Payment status:", paymentStatus);
        
        // Update order status based on payment status
        if (paymentStatus.status === 'approved') {
          const orderId = parseInt(paymentStatus.externalReference);
          if (!isNaN(orderId)) {
            await storage.updateOrderStatus(orderId, 'paid', 'PIX_WEBHOOK');
            console.log(`Order ${orderId} marked as paid via PIX`);
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook" });
    }
  });

  // Get staff user info
  app.get('/api/staff/user', async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID é obrigatório" });
      }

      // We need to add a method to get staff by ID, for now using a workaround
      const stats = await storage.getStatsForStaff(Number(staffId)); // This ensures staff exists
      
      // Get staff info from the first product's creator or use the stored localStorage data
      // This is a simplified approach - in production, you'd have a proper getStaffById method
      const staffData = JSON.parse(req.headers['staff-data'] as string || '{}');
      
      if (!staffData.id) {
        return res.status(404).json({ message: "Staff não encontrado" });
      }

      res.json(staffData);
    } catch (error: any) {
      console.error("Error fetching staff user:", error);
      res.status(500).json({ message: "Erro ao buscar dados do staff" });
    }
  });

  // Staff location update route
  app.put("/api/staff/location", async (req, res) => {
    try {
      const { staffId, latitude, longitude } = req.body;
      
      if (!staffId || !latitude || !longitude) {
        return res.status(400).json({ message: "Staff ID, latitude e longitude são obrigatórios" });
      }

      await storage.updateStaffLocation(staffId, parseFloat(latitude), parseFloat(longitude));
      res.json({ message: "Localização atualizada com sucesso" });
    } catch (error: any) {
      console.error("Error updating staff location:", error);
      res.status(500).json({ message: "Erro ao atualizar localização" });
    }
  });

  // Push Notification Routes (no auth required)
  
  // Get VAPID public key
  app.get("/api/push/vapid-public-key", (req, res) => {
    try {
      const publicKey = getVapidPublicKey();
      console.log('VAPID key requested, returning:', publicKey ? 'key available' : 'no key');
      res.json({ publicKey });
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      res.status(500).json({ message: 'Erro ao obter chave VAPID' });
    }
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      console.log('Push subscribe request received:', {
        body: req.body,
        headers: req.headers['content-type']
      });

      const subscriptionData = insertPushSubscriptionSchema.parse(req.body);
      console.log('Subscription data parsed successfully:', subscriptionData);

      const subscription = await storage.createPushSubscription(subscriptionData);
      console.log('Subscription created in database:', subscription.id);
      
      // Send welcome notification
      console.log('Sending welcome notification...');
      const notificationSent = await sendPushNotification(subscriptionData.customerEmail, {
        title: '🔔 Notificações Ativadas!',
        body: 'Você receberá atualizações sobre seus pedidos e promoções',
        url: '/customer/home'
      });
      console.log('Welcome notification sent:', notificationSent);

      res.json(subscription);
    } catch (error: any) {
      console.error('Error creating push subscription - Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        requestBody: req.body
      });
      res.status(500).json({ 
        message: 'Erro ao criar subscrição push',
        details: error.message 
      });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      const subscriptions = await storage.getPushSubscriptionsByEmail(email);
      
      for (const sub of subscriptions) {
        await storage.removePushSubscription(sub.id);
      }

      res.json({ message: 'Unsubscribed successfully' });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ message: 'Erro ao cancelar subscrição' });
    }
  });

  // Send test notification (for staff)
  app.post("/api/push/test", async (req, res) => {
    try {
      const { customerEmail, title, body } = req.body;
      
      const success = await sendPushNotification(customerEmail, {
        title: title || 'Teste de Notificação',
        body: body || 'Esta é uma notificação de teste',
        url: '/customer/home'
      });

      res.json({ success, message: success ? 'Notificação enviada' : 'Falha ao enviar' });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ message: 'Erro ao enviar notificação teste' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
