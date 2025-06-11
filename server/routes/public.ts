import type { Express } from "express";
import { storage } from "../storage";

export function registerPublicRoutes(app: Express) {
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

  // Public endpoint to get specific order by ID
  app.get("/api/public/order/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Include PIX data in response for payment screen
      const response = {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        pixPaymentId: order.pixPaymentId,
        pixCopyPaste: order.pixCopyPaste,
        pixExpirationDate: order.pixExpirationDate,
        items: order.orderItems?.map(item => ({
          productName: item.product?.name || 'Produto',
          quantity: item.quantity,
          priceAtTime: item.priceAtTime
        })) || []
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
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

  // Public order creation endpoint
  app.post("/api/public/orders", async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, totalAmount, items, paymentMethod, fulfillmentMethod, deliveryAddress, userEmail } = req.body;
      
      if (!customerName || !customerEmail || !totalAmount || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const orderStatus = paymentMethod === "pix" ? "awaiting_payment" : "pending";

      const orderData = {
        customerName,
        customerEmail: userEmail || customerEmail,
        customerPhone,
        status: orderStatus,
        fulfillmentMethod: fulfillmentMethod || "pickup",
        deliveryAddress: deliveryAddress || null,
        totalAmount
      };

      const orderItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      }));

      // For PIX payments, create PIX payment and order with PIX data
      if (paymentMethod === "pix") {
        console.log('🎯 Creating PIX payment for order...');
        
        const { createPixPayment } = await import("../mercadopago");
        
        const pixData = {
          amount: parseFloat(totalAmount),
          description: `Pedido SaveUp - ${customerName}`,
          orderId: `TEMP_${Date.now()}`,
          customerEmail: userEmail || customerEmail,
          customerName,
          customerPhone
        };

        const pixPayment = await createPixPayment(pixData);
        
        const pixExpirationDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
        
        const order = await storage.createOrderAwaitingPayment(orderData, orderItems, {
          pixPaymentId: pixPayment.id,
          pixCopyPaste: pixPayment.pixCopyPaste,
          pixExpirationDate
        });
        
        console.log(`📦 PIX Order ${order.id} created with payment ID: ${pixPayment.id}`);
        
        res.json({
          ...order,
          pixData: {
            id: pixPayment.id,
            pixCopyPaste: pixPayment.pixCopyPaste,
            expirationDate: pixExpirationDate.toISOString()
          }
        });
      } else {
        const order = await storage.createOrder(orderData, orderItems);
        
        console.log(`📦 Order ${order.id} created with status: ${orderStatus} for payment method: ${paymentMethod || 'default'}`);
        
        res.json(order);
      }
    } catch (error) {
      console.error("Error creating public order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
}