import type { Express } from "express";
import { storage } from "../storage";
import { createPixRefund, cancelPixPayment } from "../mercadopago";
import { sendPushNotification } from "../push-service";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export function registerOrderRoutes(app: Express) {
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
                pixRefundId: refund.id,
                refundAmount: (alreadyRefunded + remainingAmount).toString(),
                refundStatus: refund.status,
                refundDate: new Date(),
                refundReason: reason || "Cancelamento solicitado pelo cliente"
              });

              console.log('✅ [CUSTOMER CANCEL] Informações de estorno Stripe salvas');
            } else {
              console.log('ℹ️ [CUSTOMER CANCEL] Payment Intent não encontrado ou não processado');
            }
          }
        } catch (stripeError: any) {
          console.warn('⚠️ [CUSTOMER CANCEL] Erro no estorno Stripe, mas continuando cancelamento:', stripeError.message);
        }
      }

      // Atualizar status do pedido para cancelled-customer
      console.log(`🔄 [CUSTOMER CANCEL] Atualizando status do pedido ${orderId} para 'cancelled-customer'`);
      const updatedOrder = await storage.updateOrderStatus(parseInt(orderId), 'cancelled-customer');
      
      if (!updatedOrder) {
        throw new Error('Falha ao atualizar status do pedido');
      }

      console.log(`✅ [CUSTOMER CANCEL] Pedido ${orderId} cancelado pelo cliente com sucesso`);

      res.json({ 
        message: refundProcessed ? 
          "Pedido cancelado com sucesso e estorno processado automaticamente" :
          "Pedido cancelado com sucesso",
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

  // Cancelar pedido por staff (com estorno PIX automático)
  app.post("/api/staff/orders/:orderId/cancel", async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    try {
      console.log(`🔄 [STAFF CANCEL] Iniciando cancelamento do pedido ${orderId} pelo staff`);
      
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

      // Se o pedido tem PIX payment ID associado, processar estorno do valor remanescente
      if (order.pixPaymentId) {
        try {
          console.log(`🔍 [STAFF CANCEL] Verificando pagamento PIX para pedido ${orderId}, PIX: ${order.pixPaymentId}`);
          
          // Calcular valor restante para estorno (total pago - já estornado)
          const totalAmount = parseFloat(order.totalAmount);
          const alreadyRefunded = order.refundAmount ? parseFloat(order.refundAmount) : 0;
          const remainingAmount = totalAmount - alreadyRefunded;
          
          console.log(`💰 [STAFF CANCEL] Valor total: R$ ${totalAmount.toFixed(2)}, já estornado: R$ ${alreadyRefunded.toFixed(2)}, restante: R$ ${remainingAmount.toFixed(2)}`);
          
          if (remainingAmount <= 0) {
            console.log('ℹ️ [STAFF CANCEL] Não há valor restante para estornar');
            refundProcessed = true;
          } else {
            console.log(`🔄 [STAFF CANCEL] Processando estorno PIX do valor remanescente para pedido ${orderId}`);
            
            const refundResponse = await createPixRefund({
              paymentId: order.pixPaymentId,
              amount: remainingAmount,
              reason: reason || "Cancelamento solicitado pelo estabelecimento"
            });

            console.log(`🔍 [STAFF CANCEL] Resposta do estorno PIX:`, refundResponse);

            if (refundResponse.success) {
              console.log(`✅ [STAFF CANCEL] Estorno PIX criado com sucesso para pedido ${orderId}`);
              
              // Atualizar pedido com dados do estorno (somando ao valor já estornado)
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

  // Get all orders (authenticated)
  app.get("/api/orders", async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      const orders = await storage.getOrders({
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get specific order by ID (duplicate endpoint for different access patterns)
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

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
}