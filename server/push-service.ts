import webpush from 'web-push';
import { storage } from './storage';

// Configuração do web-push com chaves VAPID
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BHg9Q1w6hkG0ggsSsbDEGr2Ux8ncAKjKW-fi16Qki-zAcjapQCBTfbdB77OeR9L8zT_3gV-HrwAMg2N60Pa8u20',
  privateKey: process.env.VAPID_PRIVATE_KEY || 's1neqTqX3BQnCvNVq-n6nGU_6oPwimK6o-9d3z50peM'
};

webpush.setVapidDetails(
  'mailto:eco-supermarket@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
}

export async function sendPushNotification(
  customerEmail: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    const subscriptions = await storage.getPushSubscriptionsByEmail(customerEmail);
    
    if (subscriptions.length === 0) {
      console.log(`Nenhuma subscrição encontrada para ${customerEmail}`);
      return false;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/generated-icon.png',
      badge: payload.badge || '/generated-icon.png',
      url: payload.url || '/',
      data: payload.data || {}
    });

    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey
          }
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        return true;
      } catch (error: any) {
        console.error(`Erro ao enviar push para ${customerEmail}:`, error);
        
        // Se a subscrição é inválida, remove ela
        if (error.statusCode === 410) {
          await storage.removePushSubscription(sub.id);
        }
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.some(result => result === true);
  } catch (error) {
    console.error('Erro no serviço de push:', error);
    return false;
  }
}

export async function sendOrderStatusNotification(
  customerEmail: string,
  orderId: number,
  status: string
): Promise<boolean> {
  const statusMessages = {
    'pending': '⏳ Seu pedido foi recebido e está sendo preparado',
    'prepared': '✅ Seu pedido está pronto para retirada',
    'shipped': '🚚 Seu pedido saiu para entrega',
    'picked_up': '📦 Pedido retirado com sucesso',
    'delivered': '🎉 Seu pedido foi entregue',
    'cancelled': '❌ Seu pedido foi cancelado'
  };

  const message = statusMessages[status as keyof typeof statusMessages] || 'Status do pedido atualizado';

  return await sendPushNotification(customerEmail, {
    title: `Pedido #${orderId}`,
    body: message,
    url: `/customer/orders`,
    data: { orderId, status }
  });
}

export async function sendPromoNotification(
  customerEmail: string,
  productName: string,
  discount: string
): Promise<boolean> {
  return await sendPushNotification(customerEmail, {
    title: '🏷️ Nova Promoção Disponível!',
    body: `${productName} com ${discount} de desconto`,
    url: `/customer/products`,
    data: { type: 'promotion', productName, discount }
  });
}

export async function sendEcoPointsNotification(
  customerEmail: string,
  pointsEarned: number,
  totalPoints: number
): Promise<boolean> {
  return await sendPushNotification(customerEmail, {
    title: '🌱 Pontos Eco Ganhos!',
    body: `Você ganhou ${pointsEarned} pontos eco! Total: ${totalPoints} pontos`,
    url: `/customer/eco-points`,
    data: { type: 'eco_points', pointsEarned, totalPoints }
  });
}

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}