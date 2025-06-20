import type { Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { insertStaffUserSchema, insertCustomerSchema } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail, generateStaffPasswordResetEmail } from "../sendgrid";
import crypto from "crypto";

// Middleware alternativo para desenvolvimento quando o Replit Auth não está configurado
const developmentAuth = (req: any, res: any, next: any) => {
  // Em desenvolvimento, permite acesso se o Replit Auth não estiver configurado
  if (!process.env.REPLIT_DOMAINS || !process.env.REPL_ID) {
    console.log('⚠️  Development mode: skipping authentication');
    return next();
  }
  return isAuthenticated(req, res, next);
};

export async function setupAuthRoutes(app: Express) {
  // Setup Replit Auth
  await setupAuth(app);

  // Customer registration
  app.post("/api/customer/register", async (req, res) => {
    try {
      const result = insertCustomerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.errors 
        });
      }

      const { name, email, phone, password } = result.data;

      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ message: "Cliente já cadastrado com este email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer
      const customer = await storage.createCustomer({
        name,
        email,
        phone,
        password: hashedPassword
      });

      res.status(201).json({ 
        message: "Cliente cadastrado com sucesso",
        customerId: customer.id 
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Customer login
  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const isValidPassword = await bcrypt.compare(password, customer.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Return customer data (without password)
      const { password: _, ...customerData } = customer;
      res.json({ 
        message: "Login realizado com sucesso",
        customer: customerData 
      });
    } catch (error) {
      console.error("Error in customer login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Staff registration
  app.post("/api/staff/register", async (req, res) => {
    try {
      const result = insertStaffUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: result.error.errors 
        });
      }

      const staffData = result.data;

      // Check if staff already exists
      const existingStaff = await storage.getStaffByEmail(staffData.email);
      if (existingStaff) {
        return res.status(400).json({ message: "Já existe um supermercado cadastrado com este email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(staffData.password, 10);

      // Create staff user
      const staff = await storage.createStaffUser({
        ...staffData,
        password: hashedPassword
      });

      res.status(201).json({ 
        message: "Supermercado cadastrado com sucesso! Aguardando aprovação do administrador.",
        staffId: staff.id 
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Staff login
  app.post("/api/staff/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const staff = await storage.getStaffByEmail(email);
      if (!staff) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      if (staff.status !== "approved") {
        let message = "Sua conta está aguardando aprovação";
        if (staff.status === "rejected") {
          message = "Sua conta foi rejeitada. Entre em contato com o suporte.";
        }
        return res.status(403).json({ message });
      }

      const isValidPassword = await bcrypt.compare(password, staff.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Return staff data (without password)
      const { password: _, ...staffData } = staff;
      res.json({ 
        message: "Login realizado com sucesso",
        staff: staffData 
      });
    } catch (error) {
      console.error("Error in staff login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Password reset for customers
  app.post("/api/customer/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "Instruções para redefinir sua senha foram enviadas para seu email." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken({
        email,
        token: resetToken,
        expiresAt,
        used: 0
      });

      // Send reset email
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      const emailContent = generatePasswordResetEmail(resetLink, customer.name);

      await sendEmail({
        to: email,
        from: "suporte@ecomart.vc",
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      res.json({ message: "Instruções para redefinir sua senha foram enviadas para seu email." });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Password reset for staff
  app.post("/api/staff/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const staff = await storage.getStaffByEmail(email);
      if (!staff) {
        return res.json({ message: "Instruções para redefinir sua senha foram enviadas para seu email." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken({
        email,
        token: resetToken,
        expiresAt,
        used: 0
      });

      // Send reset email
      const resetLink = `${req.protocol}://${req.get('host')}/staff/reset-password?token=${resetToken}`;
      const emailContent = generateStaffPasswordResetEmail(resetLink, staff.companyName);

      await sendEmail({
        to: email,
        from: "suporte@ecomart.vc",
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      res.json({ message: "Instruções para redefinir sua senha foram enviadas para seu email." });
    } catch (error) {
      console.error("Error in staff forgot password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword, userType } = req.body;

      if (!token || !newPassword || !userType) {
        return res.status(400).json({ message: "Token, nova senha e tipo de usuário são obrigatórios" });
      }

      // Validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used === 1 || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password based on user type
      if (userType === 'customer') {
        await storage.updateCustomerPassword(resetToken.email, hashedPassword);
      } else if (userType === 'staff') {
        await storage.updateStaffPassword(resetToken.email, hashedPassword);
      } else {
        return res.status(400).json({ message: "Tipo de usuário inválido" });
      }

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get current user orders (authenticated)
  app.get("/api/my-orders", developmentAuth, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

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
}