import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscription: PushSubscription | null;
}

export function usePushNotifications(customerEmail?: string) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    subscription: null,
  });

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSupported: true,
        isSubscribed: !!subscription,
        subscription,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Erro ao verificar suporte a push:', error);
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!customerEmail) {
      console.error('Email do cliente é necessário para subscrever');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Get VAPID public key
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      const publicKey = response.publicKey;

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Convert keys to base64
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        throw new Error('Falha ao obter chaves de subscrição');
      }

      // Send subscription to server
      await apiRequest('POST', '/api/push/subscribe', {
        customerEmail,
        endpoint: subscription.endpoint,
        p256dhKey: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))),
        authKey: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))),
      });

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Erro ao subscrever para notificações:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!customerEmail) {
      console.error('Email do cliente é necessário para cancelar subscrição');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Unsubscribe from server
      await apiRequest('POST', '/api/push/unsubscribe', {
        email: customerEmail,
      });

      // Unsubscribe from browser
      if (state.subscription) {
        await state.subscription.unsubscribe();
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Erro ao cancelar subscrição:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
    checkPushSupport,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}