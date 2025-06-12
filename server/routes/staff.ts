import type { Express } from "express";
import { storage } from "../storage";
import { insertStaffUserSchema, insertProductSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { upload } from "./uploads";
import { sendPushNotification } from "../push-service";

export function registerStaffRoutes(app: Express) {
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
      
      // Check if email already exists
      const existingStaff = await storage.getStaffUserByEmail(staffData.email);
      if (existingStaff) {
        return res.status(400).json({ message: "Email já está cadastrado" });
      }

      // Check if CNPJ already exists
      const existingCnpj = await storage.getStaffUserByCnpj(staffData.cnpj);
      if (existingCnpj) {
        return res.status(400).json({ message: "CNPJ já está cadastrado" });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(staffData.password, saltRounds);
      
      // Create staff user with location data and pending status
      const newStaffUser = await storage.createStaffUser({
        ...staffData,
        password: hashedPassword,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        approvalStatus: 'pending' // All new registrations start as pending
      });
      
      // Set sponsorship status if requested during registration
      if (isSponsored) {
        await storage.updateStaffSponsorshipStatus(newStaffUser.id, true);
      }
      
      // Return user without password
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
      console.log(`📊 [STATS] Staff ${staffId} - Receita Total: R$ ${stats.totalRevenue}`);
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
      // Get staff ID from query parameter or session
      const staffId = req.query.staffId || req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }
      
      const products = await storage.getProductsByStaff(parseInt(staffId as string));
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

      // Validar e formatar a data de expiração
      if (!req.body.expirationDate || req.body.expirationDate.trim() === '') {
        return res.status(400).json({ message: "Data de validade é obrigatória" });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        originalPrice: req.body.originalPrice.toString(),
        discountPrice: req.body.discountPrice.toString(),
        quantity: parseInt(req.body.quantity),
        expirationDate: req.body.expirationDate, // Garantir que a data não seja vazia
        isActive: 1, // Set as active by default for new products
      });

      let imageUrl = req.body.imageUrl || null;
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

  // Update staff product
  app.put('/api/staff/products/:id', upload.single('image'), async (req, res) => {
    try {
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Parse update data
      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.originalPrice) updateData.originalPrice = req.body.originalPrice.toString();
      if (req.body.discountPrice) updateData.discountPrice = req.body.discountPrice.toString();
      if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
      if (req.body.expirationDate) updateData.expirationDate = req.body.expirationDate;
      if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;

      // Handle new image upload
      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
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
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete staff product
  app.delete('/api/staff/products/:id', async (req, res) => {
    try {
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
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Staff endpoint to get pending payments
  app.get("/api/staff/pending-payments", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] as string;
      
      if (!staffId) {
        return res.status(400).json({ message: "ID do staff é obrigatório" });
      }

      const pendingPayments = await storage.getPendingPaymentsForStaff(parseInt(staffId));
      res.json(pendingPayments);
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos pendentes:', error);
      res.status(500).json({ message: "Erro ao buscar pagamentos pendentes" });
    }
  });

  // Staff endpoint to get current user data
  app.get("/api/staff/me", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const staffUser = await storage.getStaffUserByEmail(email);
      if (!staffUser) {
        return res.status(404).json({ message: "Usuário staff não encontrado" });
      }

      // Return user without password
      const { password: _, ...staffUserResponse } = staffUser;
      res.json(staffUserResponse);
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      res.status(500).json({ message: "Erro ao buscar dados do usuário" });
    }
  });

  // Staff endpoint to update profile
  app.put("/api/staff/profile", async (req, res) => {
    try {
      const email = req.query.email as string;
      const { companyName, phone, address, cnpj } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const staffUser = await storage.getStaffUserByEmail(email);
      if (!staffUser) {
        return res.status(404).json({ message: "Usuário staff não encontrado" });
      }

      const updatedUser = await storage.updateStaffProfile(staffUser.id, {
        companyName,
        phone, 
        address,
        cnpj
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Staff endpoint to change password
  app.put("/api/staff/change-password", async (req, res) => {
    try {
      const email = req.query.email as string;
      const { currentPassword, newPassword } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      const staffUser = await storage.getStaffUserByEmail(email);
      if (!staffUser) {
        return res.status(404).json({ message: "Usuário staff não encontrado" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, staffUser.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }

      // Update password
      await storage.updateStaffPassword(email, newPassword);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // Staff endpoint to get orders for their products
  app.get("/api/staff/orders", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] as string;
      const { status, page = 1, limit = 20 } = req.query;
      
      if (!staffId) {
        return res.status(400).json({ message: "Staff ID é obrigatório" });
      }

      const orders = await storage.getOrdersForStaff(parseInt(staffId), {
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching staff orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Staff endpoint to get specific order details
  app.get("/api/staff/orders/:id", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] as string;
      const orderId = parseInt(req.params.id);
      
      if (!staffId) {
        return res.status(400).json({ message: "Staff ID é obrigatório" });
      }

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      const order = await storage.getOrderForStaff(parseInt(staffId), orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching staff order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Staff endpoint to confirm order item
  app.post("/api/staff/orders/:id/confirm", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] as string;
      const orderId = parseInt(req.params.id);
      const { productId, notes } = req.body;
      
      if (!staffId) {
        return res.status(400).json({ message: "Staff ID é obrigatório" });
      }

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      const result = await storage.confirmOrderItem(parseInt(staffId), orderId, productId, notes);
      
      if (!result) {
        return res.status(404).json({ message: "Item do pedido não encontrado" });
      }

      // Send push notification if all items confirmed
      const order = await storage.getOrder(orderId);
      if (order && order.customerEmail) {
        const allItemsConfirmed = await storage.checkAllItemsConfirmed(orderId);
        if (allItemsConfirmed) {
          await sendPushNotification(order.customerEmail, {
            title: 'Pedido Confirmado',
            body: 'Todos os itens do seu pedido foram confirmados pelo estabelecimento.',
            url: '/customer/orders'
          });
        }
      }

      res.json({ message: "Item confirmado com sucesso", result });
    } catch (error) {
      console.error("Error confirming order item:", error);
      res.status(500).json({ message: "Failed to confirm order item" });
    }
  });
}