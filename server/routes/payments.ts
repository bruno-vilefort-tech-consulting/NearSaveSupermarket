import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { createPixPayment, getPaymentStatus, createCardPayment, createPixRefund, checkRefundStatus, cancelPixPayment, type CardPaymentData, type PixPaymentData } from "../mercadopago";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Global payment intent cache
declare global {
  var paymentIntentCache: Map<string, { clientSecret: string; paymentIntentId: string; timestamp: number }> | undefined;
}

export function setupPaymentRoutes(app: Express) {
  // Initialize payment intent cache
  if (!global.paymentIntentCache) {
    global.paymentIntentCache = new Map();
  }

  // Create Stripe payment intent
  app.post("/api/payments/stripe/create-intent", async (req, res) => {
    try {
      const { amount, orderId, currency = 'brl' } = req.body;

      if (!amount || !orderId) {
        return res.status(400).json({ message: "Amount and order ID are required" });
      }

      // Check if we have a cached payment intent for this order
      const cacheKey = `order_${orderId}`;
      const cached = global.paymentIntentCache!.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes cache
        return res.json({
          clientSecret: cached.clientSecret,
          paymentIntentId: cached.paymentIntentId
        });
      }

      // Create new payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        metadata: {
          orderId: orderId.toString()
        }
      });

      // Cache the payment intent
      global.paymentIntentCache!.set(cacheKey, {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        timestamp: Date.now()
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Stripe webhook handler
  app.post("/api/payments/stripe/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error("Missing Stripe webhook secret");
      return res.status(400).send("Webhook secret not configured");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;
          
          if (orderId) {
            await storage.updateOrderStatus(parseInt(orderId), 'payment_confirmed');
            console.log(`Payment confirmed for order ${orderId}`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          const failedOrderId = failedPayment.metadata.orderId;
          
          if (failedOrderId) {
            await storage.updateOrderStatus(parseInt(failedOrderId), 'payment_failed');
            console.log(`Payment failed for order ${failedOrderId}`);
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).send("Webhook processing failed");
    }

    res.json({ received: true });
  });

  // Create PIX payment
  app.post("/api/payments/pix/create", async (req, res) => {
    try {
      const { amount, description, orderId, customerEmail, customerName, customerPhone } = req.body;

      if (!amount || !orderId || !customerEmail || !customerName) {
        return res.status(400).json({ message: "Missing required payment data" });
      }

      const pixData: PixPaymentData = {
        amount,
        description: description || `Pedido #${orderId}`,
        orderId: orderId.toString(),
        customerEmail,
        customerName,
        customerPhone
      };

      const pixPayment = await createPixPayment(pixData);
      
      // Update order with PIX payment info
      await storage.updateOrder(orderId, {
        pixPaymentId: pixPayment.id,
        pixCopyPaste: pixPayment.pixCopyPaste,
        pixExpirationDate: new Date(pixPayment.expirationDate)
      });

      res.json(pixPayment);
    } catch (error) {
      console.error("Error creating PIX payment:", error);
      res.status(500).json({ message: "Failed to create PIX payment" });
    }
  });

  // Check PIX payment status
  app.get("/api/payments/pix/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const paymentStatus = await getPaymentStatus(paymentId);
      res.json(paymentStatus);
    } catch (error) {
      console.error("Error checking PIX payment status:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Create card payment
  app.post("/api/payments/card/create", async (req, res) => {
    try {
      const { amount, description, orderId, cardData, customerData } = req.body;

      if (!amount || !orderId || !cardData || !customerData) {
        return res.status(400).json({ message: "Missing required payment data" });
      }

      const cardPaymentData: CardPaymentData = {
        amount,
        description: description || `Pedido #${orderId}`,
        orderId: orderId.toString(),
        cardData,
        customerData
      };

      const cardPayment = await createCardPayment(cardPaymentData);
      res.json(cardPayment);
    } catch (error) {
      console.error("Error creating card payment:", error);
      res.status(500).json({ message: "Failed to create card payment" });
    }
  });

  // Refund PIX payment
  app.post("/api/payments/pix/refund", async (req, res) => {
    try {
      const { paymentId, amount, reason } = req.body;

      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }

      const refundData = {
        paymentId,
        amount,
        reason: reason || "Cancelamento solicitado pelo cliente"
      };

      const refund = await createPixRefund(refundData);
      res.json(refund);
    } catch (error) {
      console.error("Error creating PIX refund:", error);
      res.status(500).json({ message: "Failed to create refund" });
    }
  });

  // Check refund status
  app.get("/api/payments/refund/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const refundStatus = await checkRefundStatus(paymentId);
      res.json(refundStatus);
    } catch (error) {
      console.error("Error checking refund status:", error);
      res.status(500).json({ message: "Failed to check refund status" });
    }
  });

  // Cancel PIX payment
  app.post("/api/payments/pix/cancel", async (req, res) => {
    try {
      const { paymentId, reason } = req.body;

      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }

      const cancelData = {
        paymentId,
        reason: reason || "Cancelamento solicitado pelo cliente"
      };

      const cancelResult = await cancelPixPayment(cancelData);
      res.json(cancelResult);
    } catch (error) {
      console.error("Error cancelling PIX payment:", error);
      res.status(500).json({ message: "Failed to cancel payment" });
    }
  });

  // Create Stripe refund
  app.post("/api/payments/stripe/refund", async (req, res) => {
    try {
      const { paymentIntentId, amount, reason } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment Intent ID is required" });
      }

      const refundData: any = {
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer'
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundData);

      res.json({
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100, // Convert back to real currency
        message: "Refund processed successfully"
      });
    } catch (error) {
      console.error("Error creating Stripe refund:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create refund",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}