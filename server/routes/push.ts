import type { Express } from "express";
import { storage } from "../storage";
import { insertPushSubscriptionSchema } from "@shared/schema";
import { sendPushNotification, sendEcoPointsNotification, getVapidPublicKey } from "../push-service";

export function setupPushRoutes(app: Express) {
  // Get VAPID public key
  app.get("/api/push/vapid-key", (req, res) => {
    try {
      const publicKey = getVapidPublicKey();
      res.json({ publicKey });
    } catch (error) {
      console.error("Error getting VAPID key:", error);
      res.status(500).json({ message: "Failed to get VAPID key" });
    }
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const result = insertPushSubscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid subscription data", 
          errors: result.error.errors 
        });
      }

      const subscription = await storage.createPushSubscription(result.data);
      res.status(201).json({ 
        message: "Subscription created successfully",
        subscriptionId: subscription.id 
      });
    } catch (error) {
      console.error("Error creating push subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Unsubscribe from push notifications
  app.delete("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint is required" });
      }

      await storage.deletePushSubscription(endpoint);
      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      console.error("Error deleting push subscription:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Send test notification
  app.post("/api/push/test", async (req, res) => {
    try {
      const { userEmail, title, body } = req.body;
      
      if (!userEmail || !title || !body) {
        return res.status(400).json({ message: "User email, title, and body are required" });
      }

      await sendPushNotification(userEmail, {
        title,
        body,
        icon: "/icons/icon-192x192.svg"
      });

      res.json({ message: "Test notification sent successfully" });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Send eco points notification
  app.post("/api/push/eco-points", async (req, res) => {
    try {
      const { userEmail, points, action } = req.body;
      
      if (!userEmail || !points || !action) {
        return res.status(400).json({ message: "User email, points, and action are required" });
      }

      await sendEcoPointsNotification(userEmail, points, action);
      res.json({ message: "Eco points notification sent successfully" });
    } catch (error) {
      console.error("Error sending eco points notification:", error);
      res.status(500).json({ message: "Failed to send eco points notification" });
    }
  });

  // Get push subscriptions for a user
  app.get("/api/push/subscriptions/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const subscriptions = await storage.getPushSubscriptions(userEmail);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching push subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
}