import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { staffUsers } from "@shared/schema";

export function setupAdminRoutes(app: Express) {
  // Get all staff users for admin approval
  app.get("/api/admin/staff-users", async (req, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};
      
      if (status && typeof status === "string") {
        filters.status = status;
      }

      const staffUsers = await storage.getStaffUsers(filters);
      res.json(staffUsers);
    } catch (error) {
      console.error("Error fetching staff users:", error);
      res.status(500).json({ message: "Failed to fetch staff users" });
    }
  });

  // Approve/reject staff user
  app.patch("/api/admin/staff-users/:id/status", async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
      }

      await storage.updateStaffStatus(staffId, status);
      
      res.json({ 
        message: `Staff user ${status} successfully`,
        staffId,
        newStatus: status
      });
    } catch (error) {
      console.error("Error updating staff status:", error);
      res.status(500).json({ message: "Failed to update staff status" });
    }
  });

  // Get admin dashboard statistics
  app.get("/api/admin/dashboard-stats", async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Get all orders for admin view
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const { status, limit, offset } = req.query;
      const filters: any = {};
      
      if (status && typeof status === "string") {
        filters.status = status;
      }

      const orders = await storage.getAllOrders(filters, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get financial statement for admin
  app.get("/api/admin/financial-statement", async (req, res) => {
    try {
      const { startDate, endDate, staffId } = req.query;
      
      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (staffId) filters.staffId = parseInt(staffId as string);

      const financialData = await storage.getFinancialStatement(filters);
      res.json(financialData);
    } catch (error) {
      console.error("Error fetching financial statement:", error);
      res.status(500).json({ message: "Failed to fetch financial statement" });
    }
  });

  // Get supermarket payments for admin
  app.get("/api/admin/supermarket-payments", async (req, res) => {
    try {
      const { status, staffId } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (staffId) filters.staffId = parseInt(staffId as string);

      const payments = await storage.getSupermarketPayments(filters);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching supermarket payments:", error);
      res.status(500).json({ message: "Failed to fetch supermarket payments" });
    }
  });

  // Update supermarket payment status
  app.patch("/api/admin/supermarket-payments/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status, amount, notes } = req.body;

      const validStatuses = ['pending', 'awaiting_payment', 'advance_payment', 'payment_completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }

      const updateData: any = {
        supermarketPaymentStatus: status,
        supermarketPaymentDate: new Date()
      };

      if (amount) updateData.supermarketPaymentAmount = amount;
      if (notes) updateData.supermarketPaymentNotes = notes;

      await storage.updateOrder(orderId, updateData);

      res.json({ 
        message: "Supermarket payment status updated successfully",
        orderId,
        newStatus: status
      });
    } catch (error) {
      console.error("Error updating supermarket payment:", error);
      res.status(500).json({ message: "Failed to update supermarket payment" });
    }
  });

  // Get platform analytics
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const analytics = await storage.getPlatformAnalytics(startDate);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Test endpoint for detailed stats
  app.get("/api/test/stats/:staffId", async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      const stats = await storage.getStatsForStaff(staffId);
      
      res.json({
        stats,
        debugInfo: {
          message: "Stats calculated successfully",
          staffId: staffId
        }
      });
    } catch (error) {
      console.error("Error in test stats:", error);
      res.status(500).json({ message: "Failed to fetch test stats" });
    }
  });

  // Get system health status
  app.get("/api/admin/health", async (req, res) => {
    try {
      const health = {
        database: 'connected',
        server: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };

      res.json(health);
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({ message: "Failed to check system health" });
    }
  });
}