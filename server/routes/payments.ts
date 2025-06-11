import type { Express } from "express";
import express from "express";
import { storage } from "../storage";
import { createPixPayment, getPaymentStatus, createCardPayment, createPixRefund, checkRefundStatus, cancelPixPayment, type CardPaymentData, type PixPaymentData } from "../mercadopago";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

// Declaração global para armazenar pedidos temporários
declare global {
  var tempOrders: Map<string, any> | undefined;
  var paymentIntentCache: Map<string, { clientSecret: string; paymentIntentId: string; timestamp: number }> | undefined;
}

export function registerPaymentRoutes(app: Express) {
  // Initialize payment intent cache
  if (!global.paymentIntentCache) {
    global.paymentIntentCache = new Map();
  }

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

  // Stripe Payment Routes - Cache baseado em hash do carrinho
  app.post("/api/payments/stripe/create-payment-intent", async (req, res) => {
    try {
      const { amount, customerEmail, cartHash } = req.body;
      
      console.log(`💳 [STRIPE] Criando PaymentIntent: amount=${amount}, cartHash=${cartHash}`);
      
      if (!amount) {
        return res.status(400).json({ message: "Amount é obrigatório" });
      }

      // Usar cartHash como chave única para cache
      const cacheKey = cartHash || `temp-${Date.now()}`;
      
      // Verificar cache primeiro para evitar duplicações
      const cachedPayment = global.paymentIntentCache?.get(cacheKey);
      const now = Date.now();
      
      if (cachedPayment && (now - cachedPayment.timestamp) < 300000) { // 5 minutos de cache
        console.log(`🔄 [STRIPE CACHE] Reutilizando PaymentIntent: ${cachedPayment.paymentIntentId}`);
        return res.json({
          clientSecret: cachedPayment.clientSecret,
          paymentIntentId: cachedPayment.paymentIntentId,
          adjustedAmount: amount.toString(),
          originalAmount: amount.toString(),
          reused: true,
          status: 'requires_payment_method'
        });
      }

      // Validar valor mínimo do Stripe para BRL
      const minAmount = 0.50;
      const adjustedAmount = Math.max(parseFloat(amount), minAmount);
      
      console.log(`💳 [STRIPE] Criando novo PaymentIntent - Valor: R$ ${adjustedAmount}`);

      // Criar novo PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(adjustedAmount * 100), // Converter para centavos
        currency: "brl",
        metadata: {
          customerEmail: customerEmail || "",
          cartHash: cartHash || "",
          originalAmount: String(amount || 0),
          adjustedAmount: String(adjustedAmount || 0),
          created_at: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        }
      });

      console.log(`✅ [STRIPE] PaymentIntent criado: ${paymentIntent.id}`);
      
      // Salvar no cache para prevenir duplicações
      if (global.paymentIntentCache && paymentIntent.client_secret) {
        global.paymentIntentCache.set(cacheKey, {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          timestamp: now
        });
        console.log(`💾 [STRIPE CACHE] PaymentIntent salvo em cache: ${cacheKey}`);
      }
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        adjustedAmount: String(adjustedAmount || 0),
        originalAmount: String(amount || 0),
        reused: false,
        status: paymentIntent.status
      });

    } catch (error: any) {
      console.error("❌ [STRIPE] Erro ao criar PaymentIntent:", error);
      res.status(500).json({ 
        message: "Erro ao criar intenção de pagamento", 
        error: error.message 
      });
    }
  });

  // Stripe Payment Confirmation - Creates order after successful payment
  app.post("/api/payments/stripe/confirm-and-create-order", async (req, res) => {
    try {
      const { paymentIntentId, customerData, orderData } = req.body;
      
      console.log(`💳 [STRIPE CONFIRM] Confirmando pagamento: ${paymentIntentId}`);
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "PaymentIntent ID é obrigatório" });
      }

      // Verificar status do pagamento no Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      console.log(`🔍 [STRIPE CONFIRM] Status do pagamento: ${paymentIntent.status}`);
      
      if (paymentIntent.status !== 'succeeded') {
        console.log(`❌ [STRIPE CONFIRM] Pagamento não confirmado: ${paymentIntent.status}`);
        return res.status(400).json({ 
          message: "Pagamento não foi confirmado",
          status: paymentIntent.status 
        });
      }

      console.log(`✅ [STRIPE CONFIRM] Pagamento confirmado! Criando pedido...`);

      // Criar pedido com dados fornecidos
      const orderToCreate = {
        customerName: customerData.customerName,
        customerEmail: customerData.customerEmail,
        customerPhone: customerData.customerPhone,
        status: "payment_confirmed", // Já confirmado
        fulfillmentMethod: orderData.fulfillmentMethod || "pickup",
        deliveryAddress: orderData.deliveryAddress || null,
        totalAmount: orderData.totalAmount,
        externalReference: paymentIntentId // Associar PaymentIntent ao pedido
      };

      const orderItems = orderData.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime
      }));

      const order = await storage.createOrder(orderToCreate, orderItems);
      console.log(`✅ [STRIPE CONFIRM] Pedido criado: ${order.id}`);

      res.json({
        order,
        paymentIntentId,
        message: "Pedido criado com sucesso após confirmação do pagamento"
      });

    } catch (error: any) {
      console.error("❌ [STRIPE CONFIRM] Erro:", error);
      res.status(500).json({
        message: "Erro ao confirmar pagamento e criar pedido",
        error: error.message
      });
    }
  });

  // Stripe Webhook
  app.post("/api/payments/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET não configurado');
        return res.status(400).json({ error: 'Webhook secret not configured' });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      console.log('🔔 Stripe webhook received:', event.type);

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('💰 PaymentIntent was successful:', paymentIntent.id);
          // Aqui podemos adicionar lógica para processar pagamentos bem-sucedidos
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log('❌ PaymentIntent failed:', failedPayment.id);
          // Aqui podemos adicionar lógica para lidar com falhas de pagamento
          break;
        default:
          console.log(`🔔 Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('❌ Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
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
}