import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function usePushNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper functions
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const checkBrowserSupport = (): string | null => {
    if (!('serviceWorker' in navigator)) {
      return 'Service Workers não são suportados neste navegador';
    }
    if (!('PushManager' in window)) {
      return 'Push Manager não é suportado neste navegador';
    }
    if (!('Notification' in window)) {
      return 'Notificações não são suportadas neste navegador';
    }
    return null;
  };

  const subscribeToPushNotifications = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check browser support
      const supportError = checkBrowserSupport();
      if (supportError) {
        throw new Error(supportError);
      }

      // Step 1: Check and request permission
      let permission = Notification.permission;
      console.log('Current notification permission:', permission);
      
      if (permission === 'default') {
        // Show explanation before requesting permission
        const userConfirmed = confirm(
          'Para receber notificações sobre seus pedidos e promoções, ' +
          'precisamos da sua permissão. Deseja ativar as notificações?'
        );
        
        if (!userConfirmed) {
          throw new Error('Usuário cancelou a ativação das notificações');
        }
        
        permission = await Notification.requestPermission();
        console.log('Permission after request:', permission);
      }
      
      if (permission === 'denied') {
        throw new Error('Notificações bloqueadas. Para ativar: 1) Clique no ícone ao lado da URL 2) Mude Notificações para "Permitir" 3) Recarregue a página');
      }
      
      if (permission !== 'granted') {
        throw new Error('Permissão de notificação é necessária');
      }

      // Step 2: Get VAPID key
      console.log('Getting VAPID public key...');
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      const publicKey = (response as any).publicKey;
      
      if (!publicKey) {
        throw new Error('Servidor não forneceu a chave VAPID');
      }
      console.log('VAPID key received');

      // Step 3: Register service worker
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service worker ready');

      // Step 4: Subscribe to push notifications
      console.log('Creating push subscription...');
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      if (!subscription) {
        throw new Error('Falha ao criar subscrição push');
      }

      // Step 5: Get subscription keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        throw new Error('Falha ao obter chaves de subscrição');
      }

      // Step 6: Save to backend
      const subscriptionData = {
        email,
        endpoint: subscription.endpoint,
        p256dhKey: arrayBufferToBase64(p256dhKey),
        authKey: arrayBufferToBase64(authKey),
      };

      console.log('Saving subscription to backend...');
      await apiRequest('POST', '/api/push/subscribe', subscriptionData);
      
      // Step 7: Show success notification
      new Notification('🔔 Notificações Ativadas!', {
        body: 'Você receberá atualizações sobre seus pedidos e promoções.',
        icon: '/icon-192x192.png'
      });

      setIsEnabled(true);
      console.log('Push notifications successfully enabled');
      return true;

    } catch (error: any) {
      console.error('Push notification error:', error);
      
      // Provide specific error messages
      let userMessage = 'Erro ao ativar notificações';
      
      if (error.message.includes('denied') || error.message.includes('bloqueadas')) {
        userMessage = 'Notificações foram bloqueadas. Verifique as configurações do navegador.';
      } else if (error.message.includes('não são suportadas') || error.message.includes('não é suportado')) {
        userMessage = 'Seu navegador não suporta notificações push.';
      } else if (error.message.includes('cancelou')) {
        userMessage = 'Ativação cancelada pelo usuário.';
      } else if (error.message.includes('VAPID') || error.message.includes('Servidor')) {
        userMessage = 'Erro de configuração do servidor. Tente novamente.';
      }
      
      throw new Error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPushNotifications = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Unsubscribe from backend
      await apiRequest('POST', '/api/push/unsubscribe', { email });
      
      // Unsubscribe from browser
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }
      
      setIsEnabled(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error('Erro ao desativar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEnabled,
    isLoading,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    checkBrowserSupport
  };
}