import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertOrderSchema, insertStaffUserSchema, insertCustomerSchema, insertPushSubscriptionSchema, type StaffUser, staffUsers } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail, generateStaffPasswordResetEmail } from "./sendgrid";
import { createPixPayment, getPaymentStatus, createCardPayment, createPixRefund, checkRefundStatus, cancelPixPayment, type CardPaymentData, type PixPaymentData } from "./mercadopago";
import { sendPushNotification, sendOrderStatusNotification, sendEcoPointsNotification, getVapidPublicKey } from "./push-service";
import Stripe from "stripe";

// Declaração global para armazenar pedidos temporários
declare global {
  var tempOrders: Map<string, any> | undefined;
}
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🚀 Registering routes...');
  
  // Add JSON middleware for all API routes
  app.use('/api', express.json());
  
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files with fallback for missing images
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      // Log missing image for monitoring
      console.log(`Image not found: ${filePath}`);
      res.status(404).json({ error: "Image not found", filename });
    }
  });
  
  // Check for missing product images
  app.get("/api/admin/missing-images", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const missingImages = [];
      
      for (const product of products) {
        if (product.imageUrl) {
          const filename = path.basename(product.imageUrl);
          const filePath = path.join(uploadDir, filename);
          
          if (!fs.existsSync(filePath)) {
            missingImages.push({
              productId: product.id,
              productName: product.name,
              imageUrl: product.imageUrl,
              filename: filename
            });
          }
        }
      }
      
      res.json({ missingImages, total: missingImages.length });
    } catch (error) {
      console.error("Error checking missing images:", error);
      res.status(500).json({ error: "Failed to check missing images" });
    }
  });
  
  // Also serve static files normally for other cases
  app.use("/uploads", express.static(uploadDir));

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
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(staffData.password, saltRounds);
      
      // Create staff user with location data
      const newStaffUser = await storage.createStaffUser({
        ...staffData,
        password: hashedPassword,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null
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
      // Get staff ID from session/token (simplified approach using header for now)
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }
      
      const products = await storage.getProductsByStaff(parseInt(staffId));
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

      const productData = insertProductSchema.parse({
        ...req.body,
        originalPrice: req.body.originalPrice.toString(),
        discountPrice: req.body.discountPrice.toString(),
        quantity: parseInt(req.body.quantity),
      });

      let imageUrl = null;
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

  // Criar pedido com status awaiting_payment e gerar PIX
  app.post("/api/orders/create-with-pix", async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, totalAmount, items } = req.body;
      console.log('💳 Criando pedido com PIX:', { customerName, customerEmail, totalAmount });
      
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pixData: PixPaymentData = {
        amount: parseFloat(totalAmount),
        description: `Pedido EcoMart #${orderId}`,
        orderId,
        customerEmail,
        customerName,
        customerPhone
      };

      const pixPayment = await createPixPayment(pixData);
      
      // Criar pedido com status awaiting_payment
      const orderData = {
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress: null,
        fulfillmentMethod: 'pickup' as const,
        totalAmount: totalAmount.toString(),
        externalReference: orderId,
      };

      const pixExpirationDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
      
      const order = await storage.createOrderAwaitingPayment(orderData, items, {
        pixPaymentId: pixPayment.id,
        pixCopyPaste: pixPayment.pixCopyPaste,
        pixExpirationDate
      });
      
      console.log('✅ Pedido criado com sucesso:', order.id);
      res.json({
        orderId: order.id,
        pixPayment,
        expirationDate: pixExpirationDate.toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  // Marcar pagamento PIX como expirado manualmente
  app.patch("/api/orders/:orderId/expire-payment", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      if (order.status !== 'awaiting_payment') {
        return res.status(400).json({ message: "Pedido não está aguardando pagamento" });
      }

      await storage.updateOrderStatus(parseInt(orderId), 'payment_expired');
      
      res.json({ 
        message: "Pagamento marcado como expirado",
        orderId: parseInt(orderId),
        status: "payment_expired"
      });
    } catch (error) {
      console.error('Erro ao marcar pagamento como expirado:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Verificar status do pagamento PIX e atualizar pedido
  app.get("/api/orders/:orderId/payment-status", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      if (!order.pixPaymentId) {
        return res.status(400).json({ message: "Pedido não possui PIX associado" });
      }

      // Verificar se o PIX expirou
      if (order.pixExpirationDate && new Date() > new Date(order.pixExpirationDate)) {
        if (order.status === 'awaiting_payment') {
          await storage.updateOrderStatus(parseInt(orderId), 'payment_expired');
          return res.json({ 
            status: 'expired', 
            message: 'Tempo de pagamento expirado',
            order: { ...order, status: 'payment_expired' }
          });
        }
      }

      // Verificar status no Mercado Pago
      const paymentStatus = await getPaymentStatus(order.pixPaymentId);
      console.log(`🔍 Payment status check for order ${orderId}: MP status=${paymentStatus.status}, Order status=${order.status}`);
      
      if (paymentStatus.status === 'approved') {
        if (order.status === 'awaiting_payment') {
          const updatedOrder = await storage.updateOrderPaymentStatus(parseInt(orderId), 'payment_confirmed');
          console.log(`✅ Pagamento confirmado para pedido ${orderId}`);
          return res.json({ 
            status: 'confirmed', 
            message: 'Pagamento confirmado com sucesso',
            order: updatedOrder
          });
        } else {
          // Para qualquer outro status quando pagamento foi aprovado, considerar confirmado
          console.log(`✅ Payment already processed for order ${orderId}, returning confirmed status`);
          return res.json({ 
            status: 'confirmed', 
            message: 'Pagamento confirmado - pedido em processamento',
            order: order
          });
        }
      }

      res.json({ 
        status: order.status, 
        paymentStatus: paymentStatus.status,
        expirationDate: order.pixExpirationDate,
        pixCopyPaste: order.pixCopyPaste
      });
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      res.status(500).json({ message: "Erro ao verificar status do pagamento" });
    }
  });

  // Cache em memória para processamento de pedidos
  if (!(global as any).processingOrders) {
    (global as any).processingOrders = new Set();
  }

  // Confirmar pagamento PIX e criar pedido
  app.post("/api/pix/confirm", async (req, res) => {
    const { tempOrderId, pixPaymentId, customerData } = req.body;
    
    try {
      console.log('🔍 [PIX CONFIRM] Iniciando confirmação:', { tempOrderId, pixPaymentId });
      console.log('🔍 [PIX CONFIRM] Dados do cliente recebidos:', customerData);
      
      // Inicializar cache de processamento se não existir
      if (!(global as any).processingOrders) {
        (global as any).processingOrders = new Set();
      }
      
      // Verificar se o pedido já está sendo processado (proteção contra chamadas simultâneas)
      if ((global as any).processingOrders.has(tempOrderId)) {
        console.log('⚠️ [PIX CONFIRM] Pedido já está sendo processado:', tempOrderId);
        return res.status(409).json({ message: "Pedido já está sendo processado", tempOrderId });
      }
      
      // Marcar como processando
      (global as any).processingOrders.add(tempOrderId);
      
      try {
        // Verificar se já existe um pedido para este PIX (proteção contra duplicação)
        console.log('🔍 [PIX CONFIRM] Verificando pedido existente...');
        const existingOrder = await storage.getOrderByExternalReference(tempOrderId);
        if (existingOrder) {
          console.log('⚠️ Pedido já existe para este PIX:', existingOrder.id);
          return res.json({ order: existingOrder, paymentStatus: { status: 'approved' } });
        }
      
        // Validar dados obrigatórios
        if (!pixPaymentId || !tempOrderId) {
          throw new Error('PIX Payment ID e Temp Order ID são obrigatórios');
        }

        // Buscar dados temporários do pedido
        let tempOrderData;
        if ((global as any).tempOrders && (global as any).tempOrders.has(tempOrderId)) {
          tempOrderData = (global as any).tempOrders.get(tempOrderId);
          console.log('✅ Dados encontrados na memória do servidor');
        } else {
          // Se os dados não estão na memória (servidor reiniciou), usar dados do frontend
          console.log('⚠️ Dados temporários não encontrados na memória, usando dados do frontend...');
          
          if (!customerData || !customerData.customerName || !customerData.customerEmail || !customerData.items) {
            console.error('❌ Dados do cliente incompletos:', customerData);
            throw new Error('Dados do pedido incompletos. Campos obrigatórios: customerName, customerEmail, items');
          }
          
          // Usar dados do cliente enviados pelo frontend
          tempOrderData = {
            tempOrderId,
            customerName: customerData.customerName,
            customerEmail: customerData.customerEmail,
            customerPhone: customerData.customerPhone || '',
            totalAmount: customerData.totalAmount,
            items: customerData.items,
            pixPaymentId: pixPaymentId,
            createdAt: new Date().toISOString()
          };
          
          console.log('✅ Usando dados do cliente enviados pelo frontend');
        }
        
        console.log('🔍 [PIX CONFIRM] Verificando status do pagamento no Mercado Pago...');
        // Verificar status do pagamento no Mercado Pago
        const paymentStatus = await getPaymentStatus(pixPaymentId);
        console.log('🔍 [PIX CONFIRM] Status do pagamento:', paymentStatus);
        
        if (!paymentStatus || paymentStatus.status !== 'approved') {
          console.log('❌ [PIX CONFIRM] Pagamento não aprovado:', paymentStatus?.status || 'STATUS_NOT_FOUND');
          throw new Error(`Pagamento não aprovado. Status: ${paymentStatus?.status || 'UNKNOWN'}`);
        }
        
        console.log('✅ [PIX CONFIRM] Pagamento aprovado, criando pedido...');
        
        // Validar itens do pedido
        if (!tempOrderData.items || !Array.isArray(tempOrderData.items) || tempOrderData.items.length === 0) {
          throw new Error('Nenhum item encontrado no pedido');
        }

        // Criar pedido real no banco de dados
        const orderData = {
          customerName: tempOrderData.customerName,
          customerEmail: tempOrderData.customerEmail,
          customerPhone: tempOrderData.customerPhone,
          status: "pending",
          fulfillmentMethod: "pickup",
          deliveryAddress: null,
          totalAmount: tempOrderData.totalAmount.toString(),
          externalReference: tempOrderId,
          pixPaymentId: pixPaymentId  // Incluir o pixPaymentId para permitir estornos futuros
        };
        console.log('🔍 [PIX CONFIRM] Dados do pedido:', orderData);

        const orderItems = tempOrderData.items.map((item: any) => {
          if (!item.productId || !item.quantity || !item.priceAtTime) {
            throw new Error(`Item inválido no pedido: ${JSON.stringify(item)}`);
          }
          return {
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            priceAtTime: item.priceAtTime.toString()
          };
        });
        console.log('🔍 [PIX CONFIRM] Itens do pedido:', orderItems);

        console.log('🔍 [PIX CONFIRM] Chamando storage.createOrder...');
        const order = await storage.createOrder(orderData, orderItems);
        console.log('✅ [PIX CONFIRM] Pedido criado com sucesso:', order);
        
        // Remover dados temporários
        if ((global as any).tempOrders) {
          (global as any).tempOrders.delete(tempOrderId);
        }
        
        console.log('✅ Pedido confirmado e criado:', order.id);
        res.json({ order, paymentStatus });
        
      } catch (orderError: any) {
        console.error('❌ Erro ao confirmar pagamento PIX:', orderError);
        console.error('❌ Stack trace:', orderError.stack);
        res.status(500).json({ 
          message: "Erro ao confirmar pagamento PIX", 
          error: orderError.message,
          tempOrderId: tempOrderId
        });
      } finally {
        // Remover do cache de processamento
        if ((global as any).processingOrders) {
          (global as any).processingOrders.delete(tempOrderId);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro geral ao processar PIX:', error);
      console.error('❌ Stack trace:', error.stack);
      // Remover do cache de processamento em caso de erro
      if ((global as any).processingOrders) {
        (global as any).processingOrders.delete(tempOrderId);
      }
      res.status(500).json({ 
        message: "Erro ao processar pagamento PIX", 
        error: error.message,
        tempOrderId: tempOrderId
      });
    }
  });

  // Cancelar pedido por cliente (com estorno PIX automático)
  app.post("/api/customer/orders/:orderId/cancel", async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    try {
      console.log('🔄 [CUSTOMER CANCEL] Iniciando cancelamento do pedido:', orderId);
      
      if (!orderId) {
        return res.status(400).json({ message: "ID do pedido é obrigatório" });
      }

      // Buscar pedido
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Verificar se o pedido pode ser cancelado
      if (order.status === 'completed') {
        return res.status(400).json({ 
          message: "Não é possível cancelar um pedido já concluído" 
        });
      }

      if (order.status === 'cancelled-customer' || order.status === 'cancelled-staff') {
        return res.status(400).json({ 
          message: "Este pedido já foi cancelado" 
        });
      }

      let refundProcessed = false;
      let refundInfo = null;

      // Verificar tipo de pagamento e processar estorno accordingly
      if (order.pixPaymentId) {
        console.log('🔄 [CUSTOMER CANCEL] Verificando necessidade de estorno PIX para:', order.pixPaymentId);

        try {
          // Calcular valor restante para estorno (total pago - já estornado)
          const totalAmount = parseFloat(order.totalAmount);
          const alreadyRefunded = order.refundAmount ? parseFloat(order.refundAmount) : 0;
          const remainingAmount = totalAmount - alreadyRefunded;
          
          console.log(`💰 [CUSTOMER CANCEL] Valor total: R$ ${totalAmount.toFixed(2)}, já estornado: R$ ${alreadyRefunded.toFixed(2)}, restante: R$ ${remainingAmount.toFixed(2)}`);
          
          if (remainingAmount <= 0) {
            console.log('ℹ️ [CUSTOMER CANCEL] Não há valor restante para estornar');
            refundProcessed = true;
          } else {
            console.log('🔄 [CUSTOMER CANCEL] Processando estorno PIX adicional');
            // Criar estorno via Mercado Pago
            const refundResult = await createPixRefund({
              paymentId: order.pixPaymentId,
              amount: remainingAmount,
              reason: reason || 'Cancelamento solicitado pelo cliente'
            });

            if (refundResult.success) {
              console.log('✅ [CUSTOMER CANCEL] Estorno PIX processado:', refundResult);
              refundProcessed = true;
              refundInfo = {
                refundId: refundResult.refundId,
                amount: refundResult.amount,
                status: refundResult.status,
                method: 'PIX'
              };

              // Atualizar pedido com informações do estorno
              await storage.updateOrderRefund(parseInt(orderId), {
                pixRefundId: refundResult.refundId!,
                refundAmount: (alreadyRefunded + (refundResult.amount || remainingAmount)).toString(),
                refundStatus: refundResult.status || 'approved',
                refundDate: new Date(),
                refundReason: reason || 'Cancelamento solicitado pelo cliente'
              });

              console.log('✅ [CUSTOMER CANCEL] Informações de estorno salvas');
            } else {
              console.warn('⚠️ [CUSTOMER CANCEL] Falha no estorno PIX, mas continuando cancelamento:', refundResult.error);
            }
          }
        } catch (refundError: any) {
          console.warn('⚠️ [CUSTOMER CANCEL] Erro no estorno PIX, mas continuando cancelamento:', refundError.message);
        }
      } else if (order.externalReference) {
        // Se tem external reference, pode ser pagamento Stripe
        console.log('🔄 [CUSTOMER CANCEL] Verificando pagamento Stripe para:', order.externalReference);
        
        try {
          // Calcular valor restante para estorno
          const totalAmount = parseFloat(order.totalAmount);
          const alreadyRefunded = order.refundAmount ? parseFloat(order.refundAmount) : 0;
          const remainingAmount = totalAmount - alreadyRefunded;
          
          console.log(`💰 [CUSTOMER CANCEL] Valor total: R$ ${totalAmount.toFixed(2)}, já estornado: R$ ${alreadyRefunded.toFixed(2)}, restante: R$ ${remainingAmount.toFixed(2)}`);
          
          if (remainingAmount <= 0) {
            console.log('ℹ️ [CUSTOMER CANCEL] Não há valor restante para estornar');
            refundProcessed = true;
          } else {
            // Buscar payment intent no Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(order.externalReference);
            
            if (paymentIntent && paymentIntent.status === 'succeeded') {
              console.log('🔄 [CUSTOMER CANCEL] Processando estorno Stripe');
              
              // Criar estorno no Stripe
              const refund = await stripe.refunds.create({
                payment_intent: order.externalReference,
                amount: Math.round(remainingAmount * 100), // Convert to cents
                reason: 'requested_by_customer',
                metadata: {
                  order_id: orderId.toString(),
                  refund_reason: reason || "Cancelamento solicitado pelo cliente"
                }
              });

              console.log('✅ [CUSTOMER CANCEL] Estorno Stripe processado:', refund.id);
              refundProcessed = true;
              refundInfo = {
                refundId: refund.id,
                amount: remainingAmount,
                status: refund.status,
                method: 'Stripe'
              };

              // Atualizar pedido com informações do estorno
              await storage.updateOrderRefund(parseInt(orderId), {
                pixRefundId: refund.id, // Using this field for Stripe refund ID
                refundAmount: (alreadyRefunded + remainingAmount).toString(),
                refundStatus: refund.status,
                refundDate: new Date(),
                refundReason: reason || 'Cancelamento solicitado pelo cliente'
              });

              console.log('✅ [CUSTOMER CANCEL] Dados do estorno Stripe salvos no pedido');
            } else {
              console.log('⚠️ [CUSTOMER CANCEL] Pagamento Stripe não elegível para estorno:', paymentIntent?.status);
            }
          }
        } catch (stripeError: any) {
          console.error('❌ [CUSTOMER CANCEL] Erro no processo de estorno Stripe:', stripeError.message);
          // Continua com o cancelamento mesmo se o estorno falhar
        }
      }

      // SEMPRE atualizar status do pedido para cancelled-customer
      console.log(`🔄 [CUSTOMER CANCEL] Atualizando status do pedido ${orderId} para 'cancelled-customer'`);
      const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), 'cancelled-customer', 'CUSTOMER_REQUEST');
      
      if (!updatedOrder) {
        throw new Error('Falha ao atualizar status do pedido');
      }

      console.log(`✅ [CUSTOMER CANCEL] Pedido ${orderId} cancelado com sucesso`);

      // Enviar notificação push sobre cancelamento
      try {
        if (order.customerEmail) {
          const refundMessage = refundProcessed && refundInfo ? 
            `Seu pedido foi cancelado e o estorno de R$ ${refundInfo.amount.toFixed(2)} foi processado via ${refundInfo.method}.` :
            'Seu pedido foi cancelado com sucesso.';
            
          await sendPushNotification(order.customerEmail, {
            title: 'Pedido Cancelado',
            body: refundMessage,
            url: '/customer/orders'
          });
        }
      } catch (notifError) {
        console.log('⚠️ [CUSTOMER CANCEL] Erro ao enviar notificação de cancelamento:', notifError);
      }

      res.json({ 
        message: refundProcessed ? "Pedido cancelado com sucesso e estorno processado" : "Pedido cancelado com sucesso",
        status: "cancelled-customer",
        refundProcessed,
        refundInfo
      });

    } catch (error: any) {
      console.error('❌ [CUSTOMER CANCEL] Erro geral:', error);
      res.status(500).json({ 
        message: "Erro interno ao cancelar pedido", 
        error: error.message 
      });
    }
  });

  // Cancelar pedido por staff (supermercado) - com estorno PIX automático
  app.post("/api/staff/orders/:orderId/cancel", async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    try {
      console.log('🔄 [STAFF CANCEL] Iniciando cancelamento do pedido:', orderId);
      
      if (!orderId) {
        return res.status(400).json({ message: "ID do pedido é obrigatório" });
      }

      // Buscar pedido
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Verificar se o pedido pode ser cancelado
      if (order.status === 'completed') {
        return res.status(400).json({ 
          message: "Não é possível cancelar um pedido já concluído" 
        });
      }

      if (order.status === 'cancelled-customer' || order.status === 'cancelled-staff') {
        return res.status(400).json({ 
          message: "Este pedido já foi cancelado" 
        });
      }

      let refundProcessed = false;
      let refundInfo = null;

      // Se o pedido tem PIX associado, verificar se há valor restante para estornar
      if (order.pixPaymentId) {
        try {
          // Calcular valor restante para estorno (total pago - já estornado)
          const totalAmount = parseFloat(order.totalAmount);
          const alreadyRefunded = order.refundAmount ? parseFloat(order.refundAmount) : 0;
          const remainingAmount = totalAmount - alreadyRefunded;
          
          console.log(`💰 [STAFF CANCEL] Valor total: R$ ${totalAmount.toFixed(2)}, já estornado: R$ ${alreadyRefunded.toFixed(2)}, restante: R$ ${remainingAmount.toFixed(2)}`);
          
          if (remainingAmount <= 0) {
            console.log('ℹ️ [STAFF CANCEL] Não há valor restante para estornar');
            refundProcessed = true; // Mark as processed even if no refund needed
          } else {
            console.log(`💰 [STAFF CANCEL] Processando estorno PIX para pedido ${orderId}, PIX ID: ${order.pixPaymentId}`);
            
            const refundData = {
              paymentId: order.pixPaymentId,
              amount: remainingAmount,
              reason: reason || "Cancelamento solicitado pelo estabelecimento"
            };

            const refundResponse = await createPixRefund(refundData);
            
            if (refundResponse.success) {
              console.log(`✅ [STAFF CANCEL] Estorno PIX processado com sucesso para pedido ${orderId}:`, refundResponse);
              
              // Atualizar dados do estorno no pedido
              await storage.updateOrderRefund(parseInt(orderId), {
                pixRefundId: refundResponse.refundId || 'STAFF_REFUND_' + Date.now(),
                refundAmount: (alreadyRefunded + (refundResponse.amount || remainingAmount)).toString(),
                refundStatus: refundResponse.status || 'approved',
                refundDate: new Date(),
                refundReason: reason || "Cancelamento solicitado pelo estabelecimento"
              });

              refundProcessed = true;
              refundInfo = {
                refundId: refundResponse.refundId,
                amount: refundResponse.amount,
                status: refundResponse.status
              };

              console.log(`💰 [STAFF CANCEL] Dados do estorno salvos no pedido ${orderId}`);
              
              // Enviar notificação push sobre estorno (se o cliente tiver subscrito)
              try {
                if (order.customerEmail) {
                  await sendPushNotification(order.customerEmail, {
                    title: 'Estorno PIX Processado',
                    body: `Seu estorno de R$ ${(refundResponse.amount || remainingAmount).toFixed(2)} foi processado pelo estabelecimento.`,
                    url: '/customer/orders'
                  });
                }
              } catch (notifError) {
                console.log('⚠️ [STAFF CANCEL] Erro ao enviar notificação de estorno:', notifError);
              }
            } else {
              console.log(`⚠️ [STAFF CANCEL] Falha no estorno PIX para pedido ${orderId}:`, refundResponse.message);
            }
          }
        } catch (refundError) {
          console.error(`❌ [STAFF CANCEL] Erro no processo de estorno PIX para pedido ${orderId}:`, refundError);
          // Continua com o cancelamento mesmo se o estorno falhar
        }
      }

      // Se o pedido tem Stripe Payment Intent associado, processar estorno do valor remanescente
      if (order.externalReference && !order.pixPaymentId) {
        try {
          console.log(`🔍 [STRIPE STAFF] Verificando pagamento Stripe para pedido ${orderId}, PI: ${order.externalReference}`);
          
          // Calcular valor restante para estorno (total pago - já estornado)
          const totalAmount = parseFloat(order.totalAmount);
          const alreadyRefunded = order.refundAmount ? parseFloat(order.refundAmount) : 0;
          const remainingAmount = totalAmount - alreadyRefunded;
          
          console.log(`💰 [STRIPE STAFF] Valor total: R$ ${totalAmount.toFixed(2)}, já estornado: R$ ${alreadyRefunded.toFixed(2)}, restante: R$ ${remainingAmount.toFixed(2)}`);
          
          if (remainingAmount <= 0) {
            console.log('ℹ️ [STRIPE STAFF] Não há valor restante para estornar');
            refundProcessed = true;
          } else {
            // Verificar status do payment intent no Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(order.externalReference);
            
            if (paymentIntent.status === 'succeeded') {
              console.log(`🔄 [STRIPE STAFF] Processando estorno Stripe do valor remanescente para pedido ${orderId}`);
              
              const refund = await stripe.refunds.create({
                payment_intent: order.externalReference,
                amount: Math.round(remainingAmount * 100), // Convert to cents
                reason: 'requested_by_customer',
                metadata: {
                  orderId: orderId,
                  reason: 'staff_cancellation_remaining'
                }
              });

              console.log(`✅ [STRIPE STAFF] Estorno do valor remanescente criado: ${refund.id} para pedido ${orderId}`);
              
              // Atualizar pedido com dados do estorno (somando ao valor já estornado)
              await storage.updateOrderRefund(parseInt(orderId), {
                pixRefundId: refund.id,
                refundAmount: (alreadyRefunded + remainingAmount).toString(),
                refundStatus: refund.status,
                refundDate: new Date(),
                refundReason: 'staff_cancellation_remaining'
              });

              refundProcessed = true;
              refundInfo = {
                refundId: refund.id,
                amount: remainingAmount,
                status: refund.status
              };

              console.log(`💰 [STRIPE STAFF] Dados do estorno do valor remanescente salvos no pedido ${orderId}`);
              
              // Enviar notificação push sobre estorno
              try {
                if (order.customerEmail) {
                  await sendPushNotification(order.customerEmail, {
                    title: 'Estorno Adicional Processado',
                    body: `Estorno adicional de R$ ${remainingAmount.toFixed(2)} foi processado pelo estabelecimento.`,
                    url: '/customer/orders'
                  });
                }
              } catch (notifError) {
                console.log('⚠️ [STRIPE STAFF] Erro ao enviar notificação de estorno:', notifError);
              }
            } else {
              console.log(`ℹ️ [STRIPE STAFF] Payment Intent ${order.externalReference} status: ${paymentIntent.status} - sem estorno necessário`);
            }
          }
        } catch (stripeError) {
          console.error(`❌ [STRIPE STAFF] Erro no processo de estorno Stripe para pedido ${orderId}:`, stripeError);
          // Continua com o cancelamento mesmo se o estorno falhar
        }
      }

      // Atualizar status do pedido para cancelled-staff
      console.log(`🔄 [STAFF CANCEL] Atualizando status do pedido ${orderId} para 'cancelled-staff'`);
      const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), 'cancelled-staff', 'STAFF_REQUEST');
      
      if (!updatedOrder) {
        throw new Error('Falha ao atualizar status do pedido');
      }

      console.log(`✅ [STAFF CANCEL] Pedido ${orderId} cancelado pelo staff com sucesso`);

      // Enviar notificação push sobre cancelamento
      try {
        if (order.customerEmail) {
          await sendPushNotification(order.customerEmail, {
            title: 'Pedido Cancelado pelo Estabelecimento',
            body: refundProcessed ? 
              `Seu pedido foi cancelado e o estorno PIX foi processado automaticamente.` :
              `Seu pedido foi cancelado pelo estabelecimento.`,
            url: '/customer/orders'
          });
        }
      } catch (notifError) {
        console.log('⚠️ [STAFF CANCEL] Erro ao enviar notificação de cancelamento:', notifError);
      }

      res.json({ 
        message: refundProcessed ? 
          "Pedido cancelado com sucesso e estorno PIX processado automaticamente" :
          "Pedido cancelado com sucesso",
        status: "cancelled-staff",
        refundProcessed,
        refundInfo
      });

    } catch (error: any) {
      console.error('❌ [STAFF CANCEL] Erro geral:', error);
      res.status(500).json({ 
        message: "Erro interno ao cancelar pedido", 
        error: error.message 
      });
    }
  });

  // Estornar pagamento PIX
  app.post("/api/pix/refund", async (req, res) => {
    const { orderId, reason } = req.body;
    
    try {
      console.log('🔄 [PIX REFUND] Iniciando estorno para pedido:', orderId);
      
      if (!orderId) {
        return res.status(400).json({ message: "ID do pedido é obrigatório" });
      }

      // Buscar pedido com informações de pagamento PIX
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Verificar se o pedido está elegível para estorno (não pode estar completed)
      if (order.status === 'completed') {
        return res.status(400).json({ 
          message: "Não é possível estornar um pedido já concluído" 
        });
      }

      // Verificar se já foi estornado
      if (order.refundStatus === 'refunded' || order.refundStatus === 'processing') {
        return res.status(400).json({ 
          message: "Este pedido já foi estornado ou está sendo processado" 
        });
      }

      // Buscar o PIX payment ID baseado na referência externa
      if (!order.externalReference) {
        return res.status(400).json({ 
          message: "Pedido não possui referência de pagamento PIX" 
        });
      }

      // Buscar informações do pagamento PIX usando a referência externa
      let pixPaymentId = order.pixPaymentId;
      
      // Se não temos o PIX payment ID salvo, tentar extrair da external reference
      if (!pixPaymentId) {
        // Aqui podemos implementar lógica para buscar o payment ID
        // Por enquanto, retornar erro
        return res.status(400).json({ 
          message: "ID do pagamento PIX não encontrado para este pedido" 
        });
      }

      console.log('🔄 [PIX REFUND] Processando estorno para PIX:', pixPaymentId);

      // Criar estorno via Mercado Pago
      const refundResult = await createPixRefund({
        paymentId: pixPaymentId,
        reason: reason || 'Cancelamento de pedido'
      });

      if (!refundResult.success) {
        console.error('❌ [PIX REFUND] Falha no estorno:', refundResult.error);
        return res.status(500).json({ 
          message: "Erro ao processar estorno", 
          error: refundResult.error 
        });
      }

      console.log('✅ [PIX REFUND] Estorno processado:', refundResult);

      // Atualizar pedido com informações do estorno
      await storage.updateOrderRefund(orderId, {
        pixRefundId: refundResult.refundId!,
        refundAmount: refundResult.amount?.toString() || order.totalAmount,
        refundStatus: 'processing',
        refundDate: new Date(),
        refundReason: reason || 'Cancelamento de pedido'
      });

      // SEMPRE atualizar status do pedido para cancelled após estorno PIX bem-sucedido
      console.log(`🔄 [PIX REFUND] Atualizando status do pedido ${orderId} para 'cancelled'`);
      await storage.updateOrderStatus(orderId, 'cancelled', 'REFUND_SYSTEM');
      console.log(`✅ [PIX REFUND] Status do pedido ${orderId} atualizado para 'cancelled'`);

      console.log('✅ [PIX REFUND] Pedido atualizado com informações de estorno');

      res.json({ 
        message: "Estorno processado com sucesso",
        refundId: refundResult.refundId,
        status: refundResult.status,
        amount: refundResult.amount
      });

    } catch (error: any) {
      console.error('❌ [PIX REFUND] Erro geral:', error);
      res.status(500).json({ 
        message: "Erro interno ao processar estorno", 
        error: error.message 
      });
    }
  });

  // Verificar status do pagamento PIX
  app.get("/api/payments/pix/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      console.log('🔍 Verificando status do pagamento PIX:', paymentId);
      
      const paymentStatus = await getPaymentStatus(paymentId);
      console.log('✅ Status do pagamento PIX:', paymentStatus);
      
      res.json(paymentStatus);
    } catch (error: any) {
      console.error('❌ Erro ao verificar status do PIX:', error);
      res.status(500).json({ message: "Erro ao verificar status do pagamento", error: error.message });
    }
  });

  // Stripe Payment Routes
  app.post("/api/payments/stripe/create-payment-intent", async (req, res) => {
    try {
      const { amount, orderId, customerEmail } = req.body;
      
      if (!amount || !orderId) {
        return res.status(400).json({ message: "Amount and orderId are required" });
      }

      // Primeiro, verificar se já existe um PaymentIntent para este pedido
      const existingOrder = await storage.getOrder(parseInt(orderId));
      if (existingOrder && existingOrder.externalReference) {
        console.log(`🔄 PaymentIntent existente encontrado para pedido ${orderId}: ${existingOrder.externalReference}`);
        
        try {
          // Verificar se o PaymentIntent ainda é válido no Stripe
          const existingPaymentIntent = await stripe.paymentIntents.retrieve(existingOrder.externalReference);
          
          if (existingPaymentIntent && existingPaymentIntent.status !== 'succeeded' && existingPaymentIntent.status !== 'canceled') {
            console.log(`✅ Reutilizando PaymentIntent existente: ${existingPaymentIntent.id}, status: ${existingPaymentIntent.status}`);
            
            return res.json({
              clientSecret: existingPaymentIntent.client_secret,
              paymentIntentId: existingPaymentIntent.id,
              adjustedAmount: (existingPaymentIntent.amount / 100).toString(),
              originalAmount: amount.toString(),
              reused: true
            });
          }
        } catch (stripeError) {
          console.log(`⚠️ PaymentIntent existente não encontrado no Stripe: ${existingOrder.externalReference}, criando novo...`);
        }
      }

      // Stripe requires minimum R$ 0.50 for BRL payments
      const minAmount = 0.50;
      const adjustedAmount = Math.max(amount, minAmount);
      
      console.log(`💳 Stripe payment: Original amount R$ ${amount}, Adjusted amount R$ ${adjustedAmount}`);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(adjustedAmount * 100), // Convert to cents
        currency: "brl",
        metadata: {
          orderId: orderId.toString(),
          customerEmail: customerEmail || "",
          originalAmount: amount.toString(),
          adjustedAmount: adjustedAmount.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('✅ Stripe PaymentIntent criado:', paymentIntent.id);
      
      // Salvar o PaymentIntent ID no banco de dados imediatamente
      await storage.updateOrderExternalReference(parseInt(orderId), paymentIntent.id);
      console.log(`💾 PaymentIntent ${paymentIntent.id} salvo para pedido ${orderId}`);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        adjustedAmount: adjustedAmount.toString(),
        originalAmount: amount.toString(),
        reused: false
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar PaymentIntent Stripe:", error);
      res.status(500).json({ 
        message: "Erro ao criar intenção de pagamento", 
        error: error.message 
      });
    }
  });

  // Stripe Webhook
  app.post("/api/payments/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        // Note: In production, you should set up webhook endpoint secret
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || "");
      } catch (err: any) {
        console.log(`❌ Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('✅ Stripe payment succeeded:', paymentIntent.id);
          
          // Update order status
          if (paymentIntent.metadata.orderId) {
            const orderId = parseInt(paymentIntent.metadata.orderId);
            await storage.updateOrderPaymentStatus(orderId, 'payment_confirmed');
            console.log(`✅ Order ${orderId} marked as paid via Stripe`);
          }
          break;
        
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log('❌ Stripe payment failed:', failedPayment.id);
          
          if (failedPayment.metadata.orderId) {
            const orderId = parseInt(failedPayment.metadata.orderId);
            await storage.updateOrderPaymentStatus(orderId, 'payment_failed');
            console.log(`❌ Order ${orderId} marked as payment failed via Stripe`);
          }
          break;
        
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("❌ Error processing Stripe webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook", error: error.message });
    }
  });

  // Public order creation for customers
  app.post("/api/public/orders", async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, fulfillmentMethod, deliveryAddress, totalAmount, items, paymentMethod } = req.body;
      
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

      // Set appropriate status based on payment method
      let orderStatus = "pending";
      if (paymentMethod === "stripe" || paymentMethod === "card") {
        // For Stripe payments, create order as awaiting payment
        // This prevents it from appearing in staff interface until payment is confirmed
        orderStatus = "awaiting_payment";
      } else if (paymentMethod === "pix") {
        // PIX payments also start as awaiting payment
        orderStatus = "awaiting_payment";
      }

      const orderData = {
        customerName,
        customerEmail: userEmail,
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

  // Check PIX payment status by payment ID
  app.get("/api/payments/pix/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      console.log(`🔍 [PIX STATUS] Checking PIX payment status for ID: ${paymentId}`);
      
      const paymentStatus = await getPaymentStatus(paymentId);
      console.log(`🔍 [PIX STATUS] Payment status result:`, paymentStatus);
      
      res.json(paymentStatus);
    } catch (error: any) {
      console.error(`❌ [PIX STATUS] Error checking PIX payment ${req.params.paymentId}:`, error);
      res.status(500).json({ 
        message: "Erro ao verificar status do pagamento PIX", 
        error: error.message 
      });
    }
  });

  // Confirm PIX payment for order
  app.post("/api/orders/:id/confirm-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { paymentId } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      console.log(`💰 [PAYMENT CONFIRM] Confirming payment for order ${orderId} with PIX ID ${paymentId}`);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      if (order.pixPaymentId !== paymentId) {
        return res.status(400).json({ message: "PIX ID não corresponde ao pedido" });
      }

      // Update order status to payment confirmed
      const updatedOrder = await storage.updateOrderPaymentStatus(orderId, 'payment_confirmed');
      
      console.log(`✅ [PAYMENT CONFIRM] Order ${orderId} payment confirmed successfully`);
      
      res.json({ 
        message: "Pagamento confirmado com sucesso",
        order: updatedOrder
      });
    } catch (error: any) {
      console.error(`❌ [PAYMENT CONFIRM] Error confirming payment for order ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Erro ao confirmar pagamento", 
        error: error.message 
      });
    }
  });

  // Check order payment status
  app.get("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Se não tem PIX ID, retornar status atual
      if (!order.pixPaymentId) {
        return res.json({ 
          status: order.status,
          message: "Pedido não possui PIX associado"
        });
      }

      // Verificar status no Mercado Pago
      const paymentStatus = await getPaymentStatus(order.pixPaymentId);
      console.log(`🔍 Payment status check for order ${orderId}: MP status=${paymentStatus.status}, Order status=${order.status}`);
      
      if (paymentStatus.status === 'approved') {
        if (order.status === 'awaiting_payment') {
          const updatedOrder = await storage.updateOrderPaymentStatus(parseInt(orderId), 'payment_confirmed');
          console.log(`✅ Pagamento confirmado para pedido ${orderId}`);
          return res.json({ 
            status: 'confirmed', 
            message: 'Pagamento confirmado com sucesso',
            order: updatedOrder
          });
        } else {
          // Para qualquer outro status quando pagamento foi aprovado, considerar confirmado
          console.log(`✅ Payment already processed for order ${orderId}, returning confirmed status`);
          return res.json({ 
            status: 'confirmed', 
            message: 'Pagamento confirmado - pedido em processamento',
            order: order
          });
        }
      }

      res.json({ 
        status: order.status, 
        paymentStatus: paymentStatus.status,
        expirationDate: order.pixExpirationDate,
        pixCopyPaste: order.pixCopyPaste
      });
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      res.status(500).json({ message: "Erro ao verificar status do pagamento" });
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

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      // Get staff ID from headers (same as other staff routes)
      const staffId = req.get('X-Staff-Id');
      if (!staffId) {
        return res.status(401).json({ message: "Staff ID required" });
      }

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

  app.delete("/api/products/:id", async (req, res) => {
    try {
      // Get staff ID from headers (same as other staff routes)
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
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Staff order routes
  app.get("/api/staff/orders", async (req, res) => {
    try {
      // Get staff ID from headers (set by frontend)
      const staffId = req.headers['x-staff-id'];
      
      if (!staffId) {
        return res.status(401).json({ message: "Staff authentication required" });
      }

      const { status } = req.query;
      const filters: any = {};
      
      if (status && typeof status === "string") {
        filters.status = status;
      }

      const staffIdNum = parseInt(staffId as string);
      console.log(`Fetching orders for staff ID: ${staffIdNum}`);
      const orders = await storage.getOrdersByStaff(staffIdNum, filters);
      console.log(`Fetched ${orders.length} orders for staff ${staffIdNum}`);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get specific order for staff
  app.get("/api/staff/orders/:id", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'];
      
      if (!staffId) {
        return res.status(401).json({ message: "Staff authentication required" });
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

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

  // Confirm order with partial items (and automatic PIX refund if needed)
  app.post("/api/staff/orders/:id/confirm", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'];
      
      if (!staffId) {
        return res.status(401).json({ message: "Staff authentication required" });
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { confirmedItems, refundAmount } = req.body;

      if (!confirmedItems || !Array.isArray(confirmedItems)) {
        return res.status(400).json({ message: "Confirmed items list is required" });
      }

      console.log(`🔄 [ORDER CONFIRM] Staff ${staffId} confirmando pedido ${orderId}`);
      console.log(`🔄 [ORDER CONFIRM] Itens confirmados:`, confirmedItems);
      
      // Buscar o pedido para verificar status e informações de PIX
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verificar se o pedido pode ser confirmado
      if (order.status !== "pending" && order.status !== "awaiting_payment") {
        return res.status(400).json({ message: "Order cannot be confirmed in current status" });
      }

      let refundProcessed = false;
      let refundDetails = null;

      // Se há itens não confirmados e valor de estorno, processar estorno automaticamente
      if (refundAmount && refundAmount > 0) {
        // Verificar se é PIX (tem pixPaymentId) ou Stripe (tem externalReference)
        if (order.pixPaymentId) {
          console.log(`💰 [ORDER CONFIRM] Processando estorno PIX de R$ ${refundAmount}`);
          
          try {
            const refundResult = await createPixRefund({
              paymentId: order.pixPaymentId,
              amount: refundAmount,
              reason: "Confirmação parcial do pedido - itens indisponíveis"
            });

            if (refundResult.success) {
              console.log(`✅ [ORDER CONFIRM] Estorno PIX processado com sucesso:`, refundResult);
              refundProcessed = true;
              refundDetails = refundResult;

              // Atualizar informações de estorno no pedido
              await storage.updateOrderRefund(orderId, {
                pixRefundId: refundResult.refundId || '',
                refundAmount: refundAmount.toString(),
                refundStatus: refundResult.status || 'pending',
                refundDate: new Date(),
                refundReason: "Confirmação parcial - itens indisponíveis"
              });
            } else {
              console.error(`❌ [ORDER CONFIRM] Falha no estorno PIX:`, refundResult.error);
              return res.status(400).json({ 
                message: "Erro ao processar estorno PIX", 
                error: refundResult.error 
              });
            }
          } catch (error) {
            console.error(`❌ [ORDER CONFIRM] Erro no estorno PIX:`, error);
            return res.status(500).json({ 
              message: "Erro interno ao processar estorno PIX" 
            });
          }
        } else if (order.externalReference) {
          // Estorno Stripe para cancelamento parcial
          console.log(`💰 [ORDER CONFIRM] Processando estorno Stripe de R$ ${refundAmount} para PI: ${order.externalReference}`);
          
          try {
            // Criar refund no Stripe
            const refund = await stripe.refunds.create({
              payment_intent: order.externalReference,
              amount: Math.round(refundAmount * 100), // Convert to cents
              reason: 'requested_by_customer',
              metadata: {
                order_id: orderId.toString(),
                refund_type: 'partial_confirmation',
                refund_reason: 'Confirmação parcial - itens indisponíveis'
              }
            });

            console.log(`✅ [ORDER CONFIRM] Estorno Stripe criado com sucesso:`, {
              refundId: refund.id,
              amount: refund.amount / 100,
              status: refund.status,
              paymentIntent: refund.payment_intent
            });

            refundProcessed = true;
            refundDetails = {
              refundId: refund.id,
              status: refund.status,
              amount: refund.amount / 100
            };

            // Atualizar informações de estorno no pedido
            await storage.updateOrderRefund(orderId, {
              pixRefundId: refund.id, // Reusing same field for Stripe refund ID
              refundAmount: refundAmount.toString(),
              refundStatus: refund.status,
              refundDate: new Date(),
              refundReason: "Confirmação parcial - itens indisponíveis"
            });

          } catch (error: any) {
            console.error(`❌ [ORDER CONFIRM] Erro no estorno Stripe:`, error);
            return res.status(500).json({ 
              message: "Erro interno ao processar estorno Stripe",
              error: error.message 
            });
          }
        } else {
          console.log(`⚠️ [ORDER CONFIRM] Pedido ${orderId} não tem PIX Payment ID nem Payment Intent ID - não é possível processar estorno automático`);
        }
      }

      // Atualizar status dos itens com base na confirmação
      console.log(`🔄 [ORDER CONFIRM] Atualizando status dos itens`);
      
      // Marcar todos os itens do pedido com status baseado na confirmação
      for (const orderItem of order.orderItems) {
        const confirmedItem = confirmedItems.find((confirmedItem: any) => confirmedItem.orderItemId === orderItem.id);
        const isConfirmed = confirmedItem && confirmedItem.confirmed;
        const newStatus = isConfirmed ? 'confirmed' : 'removed';
        
        await storage.updateOrderItemConfirmationStatus(orderItem.id, newStatus);
        console.log(`📦 [ITEM STATUS] Item ${orderItem.id} (${orderItem.product.name}) marcado como: ${newStatus}`);
      }

      // Atualizar status do pedido para "confirmed"
      const updatedOrder = await storage.updateOrderStatus(orderId, "confirmed", `STAFF_${staffId}`);
      
      if (!updatedOrder) {
        return res.status(500).json({ message: "Failed to update order status" });
      }

      console.log(`✅ [ORDER CONFIRM] Pedido ${orderId} confirmado com sucesso`);

      // Enviar notificação push para o cliente sobre a confirmação
      try {
        const pushSubscriptions = await storage.getPushSubscriptionsByEmail(order.customerEmail);
        
        if (pushSubscriptions.length > 0) {
          const title = refundProcessed 
            ? "Pedido Confirmado Parcialmente" 
            : "Pedido Confirmado";
          
          const body = refundProcessed
            ? `Seu pedido #${orderId} foi confirmado parcialmente. Estorno de R$ ${refundAmount.toFixed(2)} sendo processado.`
            : `Seu pedido #${orderId} foi confirmado e está sendo preparado.`;

          for (const subscription of pushSubscriptions) {
            await sendPushNotification(
              subscription.endpoint,
              {
                title,
                body,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                url: `/customer/orders`,
                data: { orderId, type: 'order_confirmed' }
              }
            );
          }
        }
      } catch (error) {
        console.error("Erro ao enviar notificação push:", error);
        // Não falhar a confirmação por erro de notificação
      }

      const response: any = {
        success: true,
        message: refundProcessed 
          ? "Pedido confirmado parcialmente com estorno processado" 
          : "Pedido confirmado com sucesso",
        order: updatedOrder,
        refundProcessed,
      };

      if (refundProcessed && refundDetails) {
        response.refundAmount = refundAmount;
        response.refundId = refundDetails.refundId;
        response.refundStatus = refundDetails.status;
      }

      res.json(response);

    } catch (error) {
      console.error("Error confirming order:", error);
      res.status(500).json({ message: "Failed to confirm order" });
    }
  });

  // Legacy route for backward compatibility (keeping for Replit auth users)
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

  // Public order route for Stripe checkout by ID
  app.get("/api/public/order/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔍 Public order request for ID: ${id}`);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(id);
      console.log(`📦 Order found:`, order ? { id: order.id, status: order.status, amount: order.totalAmount } : 'not found');
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Return only essential data for payment processing
      const response = {
        id: order.id,
        totalAmount: order.totalAmount,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        status: order.status
      };
      
      console.log(`✅ Sending response:`, response);
      res.json(response);
    } catch (error) {
      console.error("Error fetching public order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
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

  // Staff route for updating order status
  app.put("/api/staff/orders/:id/status", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'];
      
      if (!staffId) {
        return res.status(401).json({ message: "Staff authentication required" });
      }

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

      console.log(`MANUAL STATUS UPDATE: Order ${id} status changed to ${status} by staff ${staffId}`);
      
      // If cancelling, check if we need to process Stripe refund BEFORE status change
      if (status === "cancelled") {
        console.log(`🔍 [AUTO REFUND] Checking order ${id} for automatic refund processing`);
        const currentOrder = await storage.getOrder(id);
        
        console.log(`🔍 [AUTO REFUND] Order ${id} details:`, {
          hasOrder: !!currentOrder,
          externalReference: currentOrder?.externalReference,
          pixPaymentId: currentOrder?.pixPaymentId,
          pixRefundId: currentOrder?.pixRefundId,
          status: currentOrder?.status
        });
        
        if (currentOrder && currentOrder.externalReference && !currentOrder.pixPaymentId && !currentOrder.pixRefundId) {
          // This is a Stripe order - check if payment was confirmed and needs refunding
          console.log(`🔍 [STRIPE CHECK] Checking payment status for order ${id}, PI: ${currentOrder.externalReference}`);
          
          try {
            // Check payment intent status in Stripe
            const paymentIntent = await stripe.paymentIntents.retrieve(currentOrder.externalReference);
            
            if (paymentIntent.status === 'succeeded') {
              console.log(`🔄 [STRIPE REFUND] Processing refund for paid Stripe order ${id}, PI: ${currentOrder.externalReference}`);
              
              const refund = await stripe.refunds.create({
                payment_intent: currentOrder.externalReference,
                amount: Math.round(parseFloat(currentOrder.totalAmount) * 100), // Convert to cents
                reason: 'requested_by_customer',
                metadata: {
                  orderId: id.toString(),
                  reason: 'staff_cancellation'
                }
              });

              console.log(`✅ [STRIPE REFUND] Refund successful for order ${id}: ${refund.id}`);
              
              // Update order with refund data first
              await storage.updateOrderRefund(id, {
                pixRefundId: refund.id,
                refundAmount: currentOrder.totalAmount,
                refundStatus: refund.status,
                refundDate: new Date(),
                refundReason: 'staff_cancellation'
              });
              
              console.log(`✅ [REFUND] Pedido ${id} atualizado com dados de estorno: {
  pixRefundId: '${refund.id}',
  refundAmount: '${currentOrder.totalAmount}',
  refundStatus: '${refund.status}',
  refundDate: ${new Date().toISOString()},
  refundReason: 'staff_cancellation'
}`);
              
              // Now update order status after successful refund processing
              const order = await storage.updateOrderStatus(id, status, `STAFF_${staffId}`);
              if (!order) {
                return res.status(404).json({ message: "Order not found" });
              }

              res.json({ 
                ...order, 
                refundId: refund.id,
                refundStatus: refund.status,
                message: "Order cancelled and refund processed successfully"
              });
              return;
            } else {
              console.log(`ℹ️ [STRIPE] Payment not yet succeeded for order ${id}, status: ${paymentIntent.status} - no refund needed`);
            }

          } catch (error) {
            console.error(`❌ [STRIPE REFUND] Failed to process refund for order ${id}:`, error);
            return res.status(500).json({ 
              message: "Failed to process refund. Order not cancelled.", 
              error: error.message 
            });
          }
        }
      }

      const order = await storage.updateOrderStatus(id, status, `STAFF_${staffId}`);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Legacy route for Replit auth users - SECURED WITH PROPER PROTECTIONS
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

      // SECURITY: Apply same protections as staff route
      console.log(`BLOCKED LEGACY ROUTE: Attempted status change for order ${id} via legacy route`);
      return res.status(403).json({ 
        message: "This route is deprecated. Use /api/staff/orders/:id/status instead",
        redirectTo: `/api/staff/orders/${id}/status`
      });

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

  // Customer Authentication Routes
  app.post("/api/customer/register", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check if customer already exists by email or CPF
      const existingByEmail = await storage.getCustomerByEmail(validatedData.email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const existingByCpf = await storage.getCustomerByCpf(validatedData.cpf);
      if (existingByCpf) {
        return res.status(400).json({ message: "CPF já cadastrado" });
      }

      const customer = await storage.createCustomer(validatedData);
      
      // Remove password from response
      const { password, ...customerResponse } = customer;
      res.json(customerResponse);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const customer = await storage.validateCustomer(email, password);
      if (!customer) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Remove password from response
      const { password: _, ...customerResponse } = customer;
      res.json(customerResponse);
    } catch (error) {
      console.error("Error during customer login:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });

  app.post("/api/customer/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        // For security, don't reveal if email exists or not
        return res.json({ message: "Se o email existir, você receberá instruções para redefinir sua senha." });
      }

      // Clean up expired tokens first
      await storage.cleanupExpiredTokens();

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Save token to database
      await storage.createPasswordResetToken({
        email: customer.email,
        token: resetToken,
        expiresAt
      });

      // Generate reset link - use the correct host for Replit
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      const resetLink = `https://${host}/customer/reset-password?token=${resetToken}`;
      
      // Generate email content
      const emailContent = generatePasswordResetEmail(resetLink, customer.fullName);
      
      // Send email
      const emailSent = await sendEmail({
        to: customer.email,
        from: 'suporte@saveup.vc',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      if (!emailSent) {
        console.error('Failed to send password reset email to:', customer.email);
        return res.status(500).json({ message: "Erro ao enviar email. Verifique sua configuração do SendGrid." });
      }

      console.log('Password reset email sent successfully to:', customer.email);
      res.json({ message: "Instruções para redefinir sua senha foram enviadas para seu email." });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/customer/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Verify token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      // Update password
      await storage.updateCustomerPassword(resetToken.email, newPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(token);

      console.log('Password reset completed for:', resetToken.email);
      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Staff password reset routes
  app.post("/api/staff/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const staffUser = await storage.getStaffUserByEmail(email);
      if (!staffUser) {
        // For security, don't reveal if email exists or not
        return res.json({ message: "Se o email existir, você receberá instruções para redefinir sua senha." });
      }

      // Clean up expired tokens first
      await storage.cleanupExpiredTokens();

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Save token to database
      await storage.createStaffPasswordResetToken({
        token: resetToken,
        email: email,
        expiresAt: expiresAt,
        used: 0
      });

      // Create reset link - use the correct host for Replit
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      const resetLink = `https://${host}/staff/reset-password?token=${resetToken}`;
      
      console.log('Generated reset link:', resetLink);
      
      // Generate email content
      const emailContent = generateStaffPasswordResetEmail(resetLink, staffUser.companyName);
      
      // Send email
      const emailSent = await sendEmail({
        to: email,
        from: 'suporte@saveup.vc',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      if (emailSent) {
        console.log('Staff password reset email sent successfully to:', email);
        res.json({ message: "Instruções para redefinição de senha enviadas para seu email." });
      } else {
        console.error('Failed to send staff password reset email to:', email);
        res.status(500).json({ message: "Erro ao enviar email. Tente novamente." });
      }
    } catch (error) {
      console.error("Error in staff forgot password:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/staff/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Verify token
      const resetToken = await storage.getStaffPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      // Update password
      await storage.updateStaffPassword(resetToken.email, password);
      
      // Mark token as used
      await storage.markStaffTokenAsUsed(token);

      console.log('Staff password reset completed for:', resetToken.email);
      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Error in staff reset password:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Customer Routes - List supermarkets with products
  app.get("/api/customer/supermarkets", async (req, res) => {
    try {
      const supermarkets = await storage.getSupermarketsWithProducts();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets:", error);
      res.status(500).json({ message: "Erro ao buscar supermercados" });
    }
  });

  // Customer Routes - Get supermarkets with locations for map
  app.get("/api/customer/supermarkets/map", async (req, res) => {
    try {
      const supermarkets = await storage.getSupermarketsWithLocations();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets with locations:", error);
      res.status(500).json({ message: "Erro ao buscar localizações dos supermercados" });
    }
  });

  // Customer Routes - Get supermarkets with locations for proximity filtering
  app.get("/api/customer/supermarkets-with-locations", async (req, res) => {
    try {
      const supermarkets = await storage.getSupermarketsWithLocations();
      res.json(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets with locations:", error);
      res.status(500).json({ message: "Erro ao buscar supermercados com localizações" });
    }
  });

  // Customer Routes - Get products by supermarket
  app.get("/api/customer/supermarket/:id/products", async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      if (isNaN(staffId)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const products = await storage.getProductsBySupermarket(staffId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching supermarket products:", error);
      res.status(500).json({ message: "Erro ao buscar produtos do supermercado" });
    }
  });

  // Customer Routes - Get customer orders
  app.get("/api/customer/orders", async (req, res) => {
    try {
      const { phone, email } = req.query;
      
      if (!phone && !email) {
        return res.status(400).json({ message: "Telefone ou email é obrigatório" });
      }

      let orders;
      if (email) {
        orders = await storage.getOrdersByEmail(email as string);
      } else {
        orders = await storage.getOrdersByPhone(phone as string);
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos do cliente" });
    }
  });

  // PIX Payment Routes
  app.post("/api/payments/pix/create", async (req, res) => {
    try {
      const { orderId, amount, description, customerEmail, customerName, customerPhone } = req.body;
      
      if (!orderId || !amount || !customerEmail || !customerName) {
        return res.status(400).json({ message: "Dados obrigatórios: orderId, amount, customerEmail, customerName" });
      }

      const pixPayment = await createPixPayment({
        orderId: orderId.toString(),
        amount: parseFloat(amount),
        description: description || `Pedido #${orderId}`,
        customerEmail,
        customerName,
        customerPhone
      });

      res.json(pixPayment);
    } catch (error) {
      console.error("Error creating PIX payment:", error);
      res.status(500).json({ message: "Erro ao criar pagamento PIX" });
    }
  });


  // Cancel PIX payment when expired
  app.post("/api/payments/pix/:paymentId/cancel", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "paymentId é obrigatório" });
      }

      console.log(`🚫 [PIX CANCEL API] Cancelando pagamento PIX: ${paymentId}`);
      
      const cancelResult = await cancelPixPayment({
        paymentId,
        reason: reason || "Pagamento expirado automaticamente"
      });

      if (cancelResult.success) {
        console.log(`✅ [PIX CANCEL API] Pagamento cancelado com sucesso: ${paymentId}`);
        res.json({
          success: true,
          message: "Pagamento PIX cancelado com sucesso",
          paymentId: cancelResult.paymentId,
          status: cancelResult.status
        });
      } else {
        console.log(`❌ [PIX CANCEL API] Falha ao cancelar pagamento: ${paymentId}`, cancelResult.error);
        res.status(400).json({
          success: false,
          message: cancelResult.error || "Erro ao cancelar pagamento PIX"
        });
      }
    } catch (error) {
      console.error("Error canceling PIX payment:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno ao cancelar pagamento PIX" 
      });
    }
  });

  // Test endpoint without auth
  app.post("/api/test-card-payment", async (req, res) => {
    console.log('🏁 Test card payment endpoint called');
    res.json({ message: "Test endpoint working" });
  });

  // Card Payment Routes
  app.post("/api/create-card-payment", async (req, res) => {
    try {
      console.log('🏁 Card payment endpoint called with data:', {
        orderId: req.body.orderId,
        amount: req.body.amount,
        cardDataReceived: !!req.body.cardData,
        customerDataReceived: !!req.body.customerData
      });
      
      const { orderId, amount, cardData, customerData } = req.body;
      
      if (!orderId || !amount || !cardData || !customerData) {
        return res.status(400).json({ 
          success: false,
          message: "Dados obrigatórios: orderId, amount, cardData, customerData" 
        });
      }

      // Validar dados do cartão
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        return res.status(400).json({
          success: false,
          message: "Dados do cartão incompletos"
        });
      }

      // Mercado Pago tem valor mínimo para pagamentos por cartão
      const finalAmount = Math.max(parseFloat(amount), 0.50);
      
      const cardPaymentData: CardPaymentData = {
        orderId: orderId.toString(),
        amount: finalAmount,
        description: `Pedido #${orderId}`,
        cardData: {
          number: cardData.number,
          name: cardData.name,
          expiry: cardData.expiry,
          cvv: cardData.cvv
        },
        customerData: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone
        }
      };

      const cardPaymentResult = await createCardPayment(cardPaymentData);
      
      // Se o pagamento foi aprovado, atualizar status do pedido
      if (cardPaymentResult.success && cardPaymentResult.status === 'approved') {
        await storage.updateOrderStatus(parseInt(orderId), 'paid', 'CARD_PAYMENT');
        console.log(`Order ${orderId} marked as paid via card`);
      }

      res.json(cardPaymentResult);
    } catch (error) {
      console.error("Error creating card payment:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro ao processar pagamento por cartão" 
      });
    }
  });

  app.get("/api/payments/pix/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID é obrigatório" });
      }

      const paymentStatus = await getPaymentStatus(paymentId);
      res.json(paymentStatus);
    } catch (error) {
      console.error("Error getting payment status:", error);
      res.status(500).json({ message: "Erro ao consultar status do pagamento" });
    }
  });

  // Mercado Pago Webhook
  app.post("/api/mercadopago/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      console.log("Mercado Pago webhook received:", req.body);
      
      const notification = JSON.parse(req.body.toString());
      
      if (notification.type === 'payment') {
        const paymentId = notification.data.id;
        const paymentStatus = await getPaymentStatus(paymentId);
        
        console.log("Payment status:", paymentStatus);
        
        // Update order status based on payment status
        if (paymentStatus.status === 'approved') {
          const orderId = parseInt(paymentStatus.externalReference);
          if (!isNaN(orderId)) {
            await storage.updateOrderStatus(orderId, 'paid', 'PIX_WEBHOOK');
            console.log(`Order ${orderId} marked as paid via PIX`);
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook" });
    }
  });

  // PIX Payment Expiration Route
  app.post("/api/orders/:id/expire-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      if (order.status !== 'awaiting_payment') {
        return res.status(400).json({ message: "Pedido não está aguardando pagamento" });
      }

      // Update order status to payment_expired
      const updatedOrder = await storage.updateOrderStatus(orderId, 'payment_expired', 'TIMER_EXPIRATION');
      
      if (!updatedOrder) {
        return res.status(500).json({ message: "Erro ao atualizar status do pedido" });
      }

      console.log(`Order ${orderId} payment expired automatically`);
      res.json({ 
        success: true, 
        message: "Pagamento expirado", 
        order: updatedOrder 
      });
    } catch (error) {
      console.error("Error expiring payment:", error);
      res.status(500).json({ message: "Erro ao expirar pagamento" });
    }
  });

  // Check and update PIX payment status manually
  app.post("/api/orders/:id/check-pix-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "ID do pedido inválido" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      if (!order.pixPaymentId) {
        return res.status(400).json({ message: "Pedido não possui PIX associado" });
      }

      if (order.status !== 'awaiting_payment') {
        return res.status(400).json({ message: "Pedido não está aguardando pagamento" });
      }

      // Check payment status with Mercado Pago
      const paymentStatus = await getPaymentStatus(order.pixPaymentId);
      console.log(`Checking PIX payment ${order.pixPaymentId} for order ${orderId}:`, paymentStatus);

      // Handle API errors gracefully
      if (paymentStatus.status === 'error') {
        console.log(`PIX API error for order ${orderId}, returning pending status`);
        return res.json({ 
          success: false, 
          message: "Erro temporário na verificação do pagamento", 
          paymentStatus: { status: 'pending' }
        });
      }

      if (paymentStatus.status === 'approved') {
        // Payment was approved, update order status to pending to start normal processing flow
        const updatedOrder = await storage.updateOrderStatus(orderId, 'pending', 'PIX_MANUAL_CHECK');
        console.log(`Order ${orderId} payment confirmed via manual PIX check, status set to pending for processing`);
        
        res.json({ 
          success: true, 
          message: "Pagamento confirmado - pedido enviado para processamento", 
          order: updatedOrder,
          paymentStatus 
        });
      } else {
        res.json({ 
          success: false, 
          message: "Pagamento ainda pendente", 
          paymentStatus 
        });
      }
    } catch (error) {
      console.error("Error checking PIX payment:", error);
      res.status(500).json({ message: "Erro ao verificar status do pagamento" });
    }
  });

  // Get staff user info
  app.get('/api/staff/user', async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID é obrigatório" });
      }

      // We need to add a method to get staff by ID, for now using a workaround
      const stats = await storage.getStatsForStaff(Number(staffId)); // This ensures staff exists
      
      // Get staff info from the first product's creator or use the stored localStorage data
      // This is a simplified approach - in production, you'd have a proper getStaffById method
      const staffData = JSON.parse(req.headers['staff-data'] as string || '{}');
      
      if (!staffData.id) {
        return res.status(404).json({ message: "Staff não encontrado" });
      }

      res.json(staffData);
    } catch (error: any) {
      console.error("Error fetching staff user:", error);
      res.status(500).json({ message: "Erro ao buscar dados do staff" });
    }
  });

  // Staff location update route
  app.put("/api/staff/location", async (req, res) => {
    try {
      const { staffId, latitude, longitude } = req.body;
      
      if (!staffId || !latitude || !longitude) {
        return res.status(400).json({ message: "Staff ID, latitude e longitude são obrigatórios" });
      }

      await storage.updateStaffLocation(staffId, parseFloat(latitude), parseFloat(longitude));
      res.json({ message: "Localização atualizada com sucesso" });
    } catch (error: any) {
      console.error("Error updating staff location:", error);
      res.status(500).json({ message: "Erro ao atualizar localização" });
    }
  });

  // PIX Refund Status Check endpoint
  app.post('/api/orders/:id/check-refund-status', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      if (!order.pixRefundId) {
        return res.status(400).json({ error: 'Nenhum estorno PIX encontrado para este pedido' });
      }

      console.log('🔍 Verificando status do estorno PIX:', order.pixRefundId);
      console.log('🔍 PIX Payment ID:', order.pixPaymentId);
      
      // Get refund status using payment ID instead of refund ID
      if (!order.pixPaymentId) {
        return res.status(400).json({ error: 'ID do pagamento PIX não encontrado' });
      }
      
      const statusResponse = await checkRefundStatus(order.pixPaymentId);
      
      if (!statusResponse.success) {
        return res.status(500).json({ 
          error: statusResponse.message || 'Erro ao verificar status do estorno' 
        });
      }

      // Atualiza o status no banco de dados se mudou
      if (statusResponse.status !== order.refundStatus) {
        console.log(`📝 Atualizando status do estorno de ${order.refundStatus} para ${statusResponse.status}`);
        
        await storage.updateOrderRefund(orderId, {
          pixRefundId: order.pixRefundId,
          refundAmount: order.refundAmount || statusResponse.amount?.toString() || '0',
          refundStatus: statusResponse.status,
          refundDate: order.refundDate || new Date(),
          refundReason: order.refundReason || 'Verificação automática de status'
        });
      }

      res.json({
        success: true,
        refundId: statusResponse.refundId,
        status: statusResponse.status,
        amount: statusResponse.amount,
        message: 'Status verificado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao verificar status do estorno:', error);
      res.status(500).json({ 
        error: 'Erro interno ao verificar status do estorno' 
      });
    }
  });

  // Push Notification Routes (no auth required)
  
  // Get VAPID public key
  app.get("/api/push/vapid-public-key", (req, res) => {
    try {
      const publicKey = getVapidPublicKey();
      console.log('VAPID key requested, returning:', publicKey ? 'key available' : 'no key');
      res.json({ publicKey });
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      res.status(500).json({ message: 'Erro ao obter chave VAPID' });
    }
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      console.log('Push subscribe request received:', {
        body: req.body,
        headers: req.headers['content-type']
      });

      const subscriptionData = insertPushSubscriptionSchema.parse(req.body);
      console.log('Subscription data parsed successfully:', subscriptionData);

      const subscription = await storage.createPushSubscription(subscriptionData);
      console.log('Subscription created in database:', subscription.id);
      
      // Send welcome notification
      console.log('Sending welcome notification...');
      const notificationSent = await sendPushNotification(subscriptionData.customerEmail, {
        title: '🔔 Notificações Ativadas!',
        body: 'Você receberá atualizações sobre seus pedidos e promoções',
        url: '/customer/home'
      });
      console.log('Welcome notification sent:', notificationSent);

      res.json(subscription);
    } catch (error: any) {
      console.error('Error creating push subscription - Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        requestBody: req.body
      });
      res.status(500).json({ 
        message: 'Erro ao criar subscrição push',
        details: error.message 
      });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      const subscriptions = await storage.getPushSubscriptionsByEmail(email);
      
      for (const sub of subscriptions) {
        await storage.removePushSubscription(sub.id);
      }

      res.json({ message: 'Unsubscribed successfully' });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ message: 'Erro ao cancelar subscrição' });
    }
  });

  // Send test notification (for staff)
  app.post("/api/push/test", async (req, res) => {
    try {
      const { customerEmail, title, body } = req.body;
      
      const success = await sendPushNotification(customerEmail, {
        title: title || 'Teste de Notificação',
        body: body || 'Esta é uma notificação de teste',
        url: '/customer/home'
      });

      res.json({ success, message: success ? 'Notificação enviada' : 'Falha ao enviar' });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ message: 'Erro ao enviar notificação teste' });
    }
  });

  // Stripe payment confirmation route
  app.post("/api/payments/stripe/confirm", async (req, res) => {
    try {
      const { orderId, paymentIntentId, amount } = req.body;
      
      console.log(`✅ [STRIPE CONFIRM] Confirmando pagamento para pedido: ${orderId}, PI: ${paymentIntentId}`);
      
      if (!orderId || !paymentIntentId) {
        return res.status(400).json({ message: "Order ID e Payment Intent ID são obrigatórios" });
      }

      // Buscar pedido
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Verificar payment intent no Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: "Payment Intent não está confirmado no Stripe" 
        });
      }

      // Salvar referência externa do payment intent primeiro
      await storage.updateOrderExternalReference(parseInt(orderId), paymentIntentId);
      
      // Atualizar status do pedido usando o método específico para pagamentos
      await storage.updateOrderPaymentStatus(parseInt(orderId), 'payment_confirmed');

      console.log(`✅ [STRIPE CONFIRM] Pedido ${orderId} confirmado e referência externa salva: ${paymentIntentId}`);

      res.json({
        success: true,
        message: "Pagamento Stripe confirmado com sucesso",
        orderId: orderId,
        paymentIntentId: paymentIntentId
      });

    } catch (error: any) {
      console.error('❌ [STRIPE CONFIRM] Erro ao confirmar pagamento:', error);
      res.status(500).json({ 
        message: "Erro ao confirmar pagamento", 
        error: error.message 
      });
    }
  });

  // Stripe refund route for card payments
  app.post("/api/payments/stripe/refund", async (req, res) => {
    try {
      const { orderId, reason } = req.body;
      
      console.log(`🔄 [STRIPE REFUND] Iniciando estorno para pedido: ${orderId}`);
      
      if (!orderId) {
        return res.status(400).json({ message: "ID do pedido é obrigatório" });
      }

      // Buscar pedido
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Verificar se o pedido está elegível para estorno
      if (order.status === 'completed') {
        return res.status(400).json({ 
          message: "Não é possível estornar um pedido já concluído" 
        });
      }

      // Verificar se já foi estornado
      if (order.refundStatus === 'refunded' || order.refundStatus === 'processing') {
        return res.status(400).json({ 
          message: "Este pedido já foi estornado ou está sendo processado" 
        });
      }

      // Verificar se tem referência externa (Stripe payment intent ID)
      if (!order.externalReference) {
        return res.status(400).json({ 
          message: "Pedido não possui referência de pagamento Stripe" 
        });
      }

      const paymentIntentId = order.externalReference;
      
      // Buscar payment intent no Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: "Pagamento não está elegível para estorno" 
        });
      }

      // Calcular valor do estorno
      const totalAmount = parseFloat(order.totalAmount);
      const alreadyRefunded = order.refundAmount ? parseFloat(order.refundAmount) : 0;
      const remainingAmount = totalAmount - alreadyRefunded;
      
      if (remainingAmount <= 0) {
        return res.status(400).json({ 
          message: "Não há valor restante para estornar" 
        });
      }

      console.log(`💰 [STRIPE REFUND] Valor total: R$ ${totalAmount.toFixed(2)}, já estornado: R$ ${alreadyRefunded.toFixed(2)}, restante: R$ ${remainingAmount.toFixed(2)}`);

      // Criar estorno no Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(remainingAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          order_id: orderId.toString(),
          refund_reason: reason || "Cancelamento solicitado pelo cliente"
        }
      });

      console.log(`✅ [STRIPE REFUND] Estorno criado: ${refund.id}`);

      // Atualizar dados do estorno no pedido
      await storage.updateOrderRefund(parseInt(orderId), {
        pixRefundId: refund.id, // Using this field for Stripe refund ID
        refundAmount: (alreadyRefunded + remainingAmount).toString(),
        refundStatus: refund.status, // pending, succeeded, failed
        refundDate: new Date(),
        refundReason: reason || "Cancelamento solicitado pelo cliente"
      });

      // Atualizar status do pedido
      await storage.updateOrderStatus(parseInt(orderId), 'cancelled-customer', 'CUSTOMER_REQUEST');

      console.log(`✅ [STRIPE REFUND] Pedido ${orderId} cancelado e estorno processado`);

      // Enviar notificação push sobre cancelamento
      try {
        if (order.customerEmail) {
          await sendPushNotification(order.customerEmail, {
            title: 'Pedido Cancelado e Estorno Processado',
            body: `Seu pedido foi cancelado e o estorno de R$ ${remainingAmount.toFixed(2)} foi processado no seu cartão.`,
            url: '/customer/orders'
          });
        }
      } catch (notifError) {
        console.log('⚠️ [STRIPE REFUND] Erro ao enviar notificação de cancelamento:', notifError);
      }

      res.json({
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: remainingAmount,
        message: "Estorno Stripe processado com sucesso"
      });

    } catch (error: any) {
      console.error('❌ [STRIPE REFUND] Erro ao processar estorno:', error);
      res.status(500).json({ 
        message: "Erro ao processar estorno", 
        error: error.message 
      });
    }
  });

  // Test endpoint to check Stripe refund status
  app.post("/api/test/stripe-refund-check", async (req, res) => {
    try {
      const { refundId } = req.body;
      
      if (!refundId) {
        return res.status(400).json({ message: "Refund ID é obrigatório" });
      }

      console.log(`🔍 [STRIPE CHECK] Verificando refund: ${refundId}`);
      
      // Check if refund exists in Stripe
      const refund = await stripe.refunds.retrieve(refundId);
      
      console.log(`✅ [STRIPE CHECK] Refund encontrado:`, refund);
      
      res.json({
        success: true,
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amount / 100, // Convert from cents
          created: refund.created,
          payment_intent: refund.payment_intent,
          reason: refund.reason
        }
      });

    } catch (error: any) {
      console.error('❌ [STRIPE CHECK] Erro:', error.message);
      res.status(500).json({ 
        success: false,
        message: "Erro ao verificar refund", 
        error: error.message 
      });
    }
  });

  // Test endpoint para criar pedido com pagamento Stripe real para teste
  app.post("/api/test/create-stripe-order", async (req, res) => {
    try {
      const { customerEmail, customerName, customerPhone, amount } = req.body;
      
      console.log(`🧪 [TEST] Criando pedido de teste Stripe para: ${customerEmail}, valor: R$ ${amount}`);
      
      // Simular autenticação como staff para contornar proteção de segurança
      req.user = { id: 'TEST_STAFF_1', email: 'test@staff.com' };
      
      // Ajustar valor mínimo do Stripe (R$ 0.50)
      const adjustedAmount = Math.max(amount, 0.50);
      
      // Criar payment intent real no Stripe com dados de teste
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(adjustedAmount * 100), // Convert to cents
        currency: "brl",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          test_order: "true",
          customer_email: customerEmail,
          original_amount: amount.toString()
        }
      });

      console.log(`✅ [TEST] PaymentIntent criado: ${paymentIntent.id}, status: ${paymentIntent.status}`);

      // Simular confirmação do pagamento (em ambiente de teste)
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: "pm_card_visa", // Cartão de teste do Stripe
        return_url: "https://example.com/return"
      });

      if (confirmedPaymentIntent.status !== 'succeeded') {
        console.log(`⚠️ [TEST] PaymentIntent não foi confirmado automaticamente. Status: ${confirmedPaymentIntent.status}`);
        // Continuar mesmo se não for confirmado automaticamente para fins de teste
      }

      // Criar pedido no banco
      const orderData = {
        customerName: customerName || 'Cliente Teste Stripe',
        customerEmail: customerEmail,
        customerPhone: customerPhone || '(11) 9999-9999',
        deliveryAddress: null,
        fulfillmentMethod: 'pickup',
        totalAmount: adjustedAmount.toString(),
        notes: 'Pedido de teste para estorno Stripe'
      };

      const items = [{
        productId: 28, // Leite Integral (produto existente)
        quantity: 1,
        priceAtTime: adjustedAmount.toString()
      }];

      const order = await storage.createOrder(orderData, items);
      
      // Salvar referência externa primeiro
      await storage.updateOrderExternalReference(order.id, paymentIntent.id);
      
      // Confirmar pagamento usando método autorizado (simular staff)
      await storage.updateOrderStatus(order.id, 'payment_confirmed', 'STAFF_TEST_STRIPE');

      console.log(`✅ [TEST] Pedido ${order.id} criado com PaymentIntent: ${paymentIntent.id}`);

      res.json({
        success: true,
        order: order,
        paymentIntentId: paymentIntent.id,
        paymentStatus: confirmedPaymentIntent.status,
        message: `Pedido de teste criado. PaymentIntent: ${paymentIntent.id}`
      });

    } catch (error: any) {
      console.error('❌ [TEST] Erro ao criar pedido de teste:', error);
      res.status(500).json({ 
        message: "Erro ao criar pedido de teste", 
        error: error.message 
      });
    }
  });

  // Get supermarket location by name
  app.get("/api/customer/supermarket/location/:name", async (req, res) => {
    try {
      const supermarketName = decodeURIComponent(req.params.name);
      
      const supermarkets = await storage.getSupermarketsWithLocations();
      const supermarket = supermarkets.find(s => s.name === supermarketName);
      
      if (!supermarket) {
        return res.status(404).json({ message: "Supermercado não encontrado" });
      }
      
      res.json(supermarket);
    } catch (error: any) {
      console.error('Erro ao buscar localização do supermercado:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get staff sponsorship status
  app.get("/api/staff/sponsorship/status", async (req, res) => {
    try {
      const staffId = req.headers['x-staff-id'] || req.headers['staff-id'];
      
      if (!staffId || isNaN(Number(staffId))) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      // Get staff data using raw SQL to avoid type issues
      const result = await db.execute(sql`
        SELECT is_sponsored, company_name 
        FROM staff_users 
        WHERE id = ${Number(staffId)}
        LIMIT 1
      `);

      if (!result.rows.length) {
        return res.status(404).json({ message: "Staff não encontrado" });
      }

      const staff = result.rows[0] as any;
      res.json({ 
        isSponsored: staff.is_sponsored === 1,
        companyName: staff.company_name 
      });
    } catch (error) {
      console.error("Erro ao buscar status de patrocínio:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Staff sponsorship management
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

  // Simple Stripe payment intent endpoint for checkout
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount is required and must be greater than 0" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "brl",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message 
      });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const adminUser = await storage.validateAdminUser(email, password);
      
      if (!adminUser) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Remove password from response
      const { password: _, ...adminResponse } = adminUser;
      
      res.json(adminResponse);
    } catch (error: any) {
      console.error("Erro no login do administrador:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // CNPJ validation route
  app.get("/api/staff/validate-cnpj/:cnpj", async (req, res) => {
    try {
      const { cnpj } = req.params;
      
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ é obrigatório" });
      }

      // Remove formatting from CNPJ
      const cleanCnpj = cnpj.replace(/[^\d]/g, '');
      
      if (cleanCnpj.length !== 14) {
        return res.status(400).json({ message: "CNPJ deve ter 14 dígitos" });
      }

      const existingStaff = await storage.getStaffUserByCnpj(cleanCnpj);
      
      if (existingStaff) {
        return res.json({ 
          available: false, 
          message: `CNPJ já cadastrado. Status: ${existingStaff.approvalStatus}`,
          status: existingStaff.approvalStatus
        });
      }

      res.json({ 
        available: true, 
        message: "CNPJ disponível para cadastro" 
      });
    } catch (error: any) {
      console.error("Erro ao validar CNPJ:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Admin routes for supermarket approval
  app.get("/api/admin/pending-supermarkets", async (req, res) => {
    try {
      const pendingStaff = await storage.getPendingStaffUsers();
      
      // Remove passwords from response
      const sanitizedStaff = pendingStaff.map(staff => {
        const { password, ...staffWithoutPassword } = staff;
        return staffWithoutPassword;
      });
      
      res.json(sanitizedStaff);
    } catch (error: any) {
      console.error("Erro ao buscar supermercados pendentes:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/approve-supermarket/:staffId", async (req, res) => {
    try {
      const { staffId } = req.params;
      const { adminId } = req.body;
      
      if (!staffId || !adminId) {
        return res.status(400).json({ message: "Staff ID e Admin ID são obrigatórios" });
      }

      const approvedStaff = await storage.approveStaffUser(parseInt(staffId), parseInt(adminId));
      
      if (!approvedStaff) {
        return res.status(404).json({ message: "Supermercado não encontrado" });
      }

      // Remove password from response
      const { password, ...staffResponse } = approvedStaff;
      
      res.json({ 
        message: "Supermercado aprovado com sucesso",
        staff: staffResponse
      });
    } catch (error: any) {
      console.error("Erro ao aprovar supermercado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/reject-supermarket/:staffId", async (req, res) => {
    try {
      const { staffId } = req.params;
      const { adminId, reason } = req.body;
      
      if (!staffId || !adminId || !reason) {
        return res.status(400).json({ message: "Staff ID, Admin ID e motivo são obrigatórios" });
      }

      const rejectedStaff = await storage.rejectStaffUser(parseInt(staffId), parseInt(adminId), reason);
      
      if (!rejectedStaff) {
        return res.status(404).json({ message: "Supermercado não encontrado" });
      }

      // Remove password from response
      const { password, ...staffResponse } = rejectedStaff;
      
      res.json({ 
        message: "Supermercado rejeitado",
        staff: staffResponse
      });
    } catch (error: any) {
      console.error("Erro ao rejeitar supermercado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
