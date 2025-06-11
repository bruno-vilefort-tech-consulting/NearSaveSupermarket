import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { insertCustomerSchema, insertStaffUserSchema } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail, generateStaffPasswordResetEmail } from "../sendgrid";
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = Router();

// Customer Authentication Routes
router.post("/customer/register", async (req, res) => {
  try {
    const { cpf, fullName, phone, email, password } = req.body;
    
    if (!cpf || !fullName || !phone || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customerData = insertCustomerSchema.parse({
      cpf, fullName, phone, email, password: hashedPassword
    });

    const customer = await storage.createCustomer(customerData);
    res.status(201).json({ message: "Customer registered successfully", customerId: customer.id });
  } catch (error: any) {
    console.error("Customer registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

router.post("/customer/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const customer = await storage.getCustomerByEmail(email);
    if (!customer) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, customer.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ 
      message: "Login successful", 
      customer: { 
        id: customer.id, 
        email: customer.email, 
        fullName: customer.fullName,
        ecoPoints: customer.ecoPoints 
      }
    });
  } catch (error: any) {
    console.error("Customer login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Staff Authentication Routes
router.post("/staff/register", async (req, res) => {
  try {
    const { email, password, cnpj, phone, address, companyName, latitude, longitude } = req.body;
    
    if (!email || !password || !cnpj || !phone || !address || !companyName) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const staffData = insertStaffUserSchema.parse({
      email, password: hashedPassword, cnpj, phone, address, companyName,
      latitude: latitude ? latitude.toString() : undefined,
      longitude: longitude ? longitude.toString() : undefined
    });

    const staff = await storage.createStaffUser(staffData);
    res.status(201).json({ message: "Staff registration submitted for approval", staffId: staff.id });
  } catch (error: any) {
    console.error("Staff registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

router.post("/staff/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const staff = await storage.getStaffUserByEmail(email);
    if (!staff) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, staff.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (staff.approvalStatus !== 'approved') {
      return res.status(403).json({ error: "Account pending approval" });
    }

    res.json({ 
      message: "Login successful", 
      staff: { 
        id: staff.id, 
        email: staff.email, 
        companyName: staff.companyName,
        approvalStatus: staff.approvalStatus 
      }
    });
  } catch (error: any) {
    console.error("Staff login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Password Reset Routes
router.post("/customer/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const customer = await storage.getCustomerByEmail(email);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await storage.createPasswordResetToken({
      email,
      token: resetToken,
      expiresAt: expiresAt.toISOString()
    });

    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const emailContent = generatePasswordResetEmail(resetLink, customer.fullName);

    await sendEmail({
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@saveup.com',
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    res.json({ message: "Password reset email sent" });
  } catch (error: any) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;