import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertOrderSchema, insertStaffUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Staff registration route
  app.post('/api/staff/register', async (req, res) => {
    try {
      const staffData = insertStaffUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingStaff = await storage.getStaffUserByEmail(staffData.email);
      if (existingStaff) {
        return res.status(400).json({ message: "Email já está cadastrado" });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(staffData.password, saltRounds);
      
      // Create staff user
      const newStaffUser = await storage.createStaffUser({
        ...staffData,
        password: hashedPassword
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
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Staff products routes
  app.get('/api/staff/products', async (req, res) => {
    try {
      const products = await storage.getProducts({ isActive: true });
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/staff/products', upload.single('image'), async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        originalPrice: parseFloat(req.body.originalPrice),
        discountPrice: parseFloat(req.body.discountPrice),
        quantity: parseInt(req.body.quantity),
      });

      // Use a default staff ID since we're not implementing full staff auth tokens
      const createdBy = "staff-1"; // Placeholder for staff user
      
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const product = await storage.createProduct({
        ...productData,
        imageUrl,
        createdBy,
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

  // Public order creation for customers
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

  app.put("/api/products/:id", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
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

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
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
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Order routes
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

      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
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



  const httpServer = createServer(app);
  return httpServer;
}
