import type { Express } from "express";
import { storage } from "../storage";
import { insertMarketingSubscriptionSchema } from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export function setupStaffRoutes(app: Express) {
  // Get staff dashboard stats
  app.get("/api/staff/dashboard-stats", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const stats = await storage.getStatsForStaff(Number(staffId));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching staff dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Get staff profile
  app.get("/api/staff/profile", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const staff = await storage.getStaffById(Number(staffId));
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }

      // Remove password from response
      const { password, ...staffData } = staff;
      res.json(staffData);
    } catch (error) {
      console.error("Error fetching staff profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update staff profile
  app.patch("/api/staff/profile", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const updateData = req.body;
      // Don't allow updating sensitive fields
      delete updateData.password;
      delete updateData.status;
      delete updateData.id;

      await storage.updateStaffProfile(Number(staffId), updateData);
      
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating staff profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get all supermarkets for customer
  app.get("/api/customer/supermarkets", async (req, res) => {
    try {
      const supermarkets = await storage.getApprovedSupermarkets();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets:", error);
      res.status(500).json({ message: "Failed to fetch supermarkets" });
    }
  });

  // Get marketing subscription plans
  app.get("/api/staff/marketing/plans", async (req, res) => {
    try {
      // Define available marketing plans
      const plans = [
        {
          id: 'basic',
          name: 'Plano Básico',
          price: 29.90,
          features: [
            'Destaque em pesquisas',
            'Badge de "Produto em Destaque"',
            'Estatísticas básicas'
          ],
          stripePriceId: process.env.STRIPE_BASIC_PRICE_ID
        },
        {
          id: 'premium',
          name: 'Plano Premium',
          price: 59.90,
          features: [
            'Todos os recursos do Básico',
            'Posicionamento prioritário',
            'Banner promocional',
            'Estatísticas avançadas',
            'Suporte prioritário'
          ],
          stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID
        }
      ];

      res.json(plans);
    } catch (error) {
      console.error("Error fetching marketing plans:", error);
      res.status(500).json({ message: "Failed to fetch marketing plans" });
    }
  });

  // Subscribe to marketing plan
  app.post("/api/staff/marketing/subscribe", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const result = insertMarketingSubscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid subscription data", 
          errors: result.error.errors 
        });
      }

      const { planId, stripePriceId } = result.data;

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        metadata: {
          staffId: staffId.toString(),
          planId: planId
        },
        success_url: `${req.protocol}://${req.get('host')}/supermercado/marketing/confirmacao/${planId}`,
        cancel_url: `${req.protocol}://${req.get('host')}/supermercado/marketing`,
      });

      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } catch (error) {
      console.error("Error creating marketing subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Get active marketing subscription
  app.get("/api/staff/marketing/subscription", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const subscription = await storage.getMarketingSubscription(Number(staffId));
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching marketing subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Cancel marketing subscription
  app.delete("/api/staff/marketing/subscription", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const subscription = await storage.getMarketingSubscription(Number(staffId));
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Cancel Stripe subscription
      if (subscription.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      // Update local subscription status
      await storage.cancelMarketingSubscription(Number(staffId));

      res.json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling marketing subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Update sponsorship status
  app.patch("/api/staff/sponsorship/update", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const { isSponsored } = req.body;
      
      if (typeof isSponsored !== "boolean") {
        return res.status(400).json({ message: "Status de patrocínio deve ser verdadeiro ou falso" });
      }

      await storage.updateStaffSponsorshipStatus(Number(staffId), isSponsored);
      
      res.json({ 
        message: `Patrocínio ${isSponsored ? 'ativado' : 'desativado'} com sucesso`,
        isSponsored 
      });
    } catch (error) {
      console.error("Erro ao atualizar status de patrocínio:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get financial data for staff
  app.get("/api/staff/financial", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const { startDate, endDate } = req.query;
      
      const filters: any = { staffId: Number(staffId) };
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const financialData = await storage.getStaffFinancialData(filters);
      res.json(financialData);
    } catch (error) {
      console.error("Error fetching staff financial data:", error);
      res.status(500).json({ message: "Failed to fetch financial data" });
    }
  });
}