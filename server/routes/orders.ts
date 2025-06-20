import type { Express } from "express";
import { storage } from "../storage";
import { insertOrderSchema } from "@shared/schema";
import { sendPushNotification, sendOrderStatusNotification } from "../push-service";

export function setupOrderRoutes(app: Express) {
  // Get orders for customer
  app.get("/api/customer/orders", async (req, res) => {
    try {
      const { customerEmail } = req.query;
      
      if (!customerEmail || typeof customerEmail !== "string") {
        return res.status(400).json({ message: "Customer email is required" });
      }

      const orders = await storage.getOrdersByEmail(customerEmail);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get orders for staff
  app.get("/api/staff/orders", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const orders = await storage.getOrdersForStaff(Number(staffId));
      res.json(orders);
    } catch (error) {
      console.error("Error fetching staff orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: result.error.errors 
        });
      }

      const order = await storage.createOrder(result.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status, staffId } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ['pending', 'payment_confirmed', 'prepared', 'shipped', 'picked_up', 'delivered', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Check if order exists
      const existingOrder = await storage.getOrder(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order status
      await storage.updateOrderStatus(orderId, status);

      // Send notification to customer if they have push subscription
      try {
        if (existingOrder.customerEmail) {
          await sendOrderStatusNotification(existingOrder.customerEmail, orderId, status);
        }
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the request if notification fails
      }

      res.json({ 
        message: "Order status updated successfully",
        orderId,
        newStatus: status
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Confirm order payment
  app.post("/api/orders/:id/confirm-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { paymentId } = req.body;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order status to payment confirmed
      await storage.updateOrderStatus(orderId, 'payment_confirmed');
      
      // Update payment ID if provided
      if (paymentId) {
        await storage.updateOrder(orderId, { pixPaymentId: paymentId });
      }

      res.json({ 
        message: "Payment confirmed successfully",
        orderId 
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Cancel order
  app.post("/api/orders/:id/cancel", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { reason } = req.body;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order can be cancelled
      const cancelableStatuses = ['pending', 'payment_confirmed', 'prepared'];
      if (!cancelableStatuses.includes(order.status)) {
        return res.status(400).json({ 
          message: "Order cannot be cancelled in current status" 
        });
      }

      // Update order status
      await storage.updateOrderStatus(orderId, 'cancelled');
      
      // Update cancellation reason if provided
      if (reason) {
        await storage.updateOrder(orderId, { notes: reason });
      }

      res.json({ 
        message: "Order cancelled successfully",
        orderId 
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Get order items
  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  // Update order item confirmation status
  app.patch("/api/orders/:orderId/items/:itemId/confirm", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const itemId = parseInt(req.params.itemId);
      const { confirmationStatus } = req.body;
      
      const validStatuses = ['pending', 'confirmed', 'removed'];
      if (!validStatuses.includes(confirmationStatus)) {
        return res.status(400).json({ message: "Invalid confirmation status" });
      }

      await storage.updateOrderItemConfirmation(itemId, confirmationStatus);
      
      res.json({ 
        message: "Order item confirmation updated successfully",
        itemId,
        confirmationStatus 
      });
    } catch (error) {
      console.error("Error updating order item confirmation:", error);
      res.status(500).json({ message: "Failed to update order item confirmation" });
    }
  });
}