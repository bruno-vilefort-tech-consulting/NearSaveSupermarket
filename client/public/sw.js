// Service Worker para notificações push
const CACHE_NAME = 'supermarket-app-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Push event - recebe notificações do servidor
self.addEventListener('push', (event) => {
  console.log('Notificação push recebida:', event);

  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/generated-icon.png',
      badge: '/generated-icon.png',
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Detalhes'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ],
      requireInteraction: true,
      tag: 'supermarket-notification'
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Verifica se já existe uma aba aberta com a aplicação
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(url);
        }
      }

      // Se não existe aba aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync para funcionalidade offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync executado');
  }
});

// Fetch event para cache de recursos
self.addEventListener('fetch', (event) => {
  // Apenas intercepta requests GET para recursos estáticos
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora requests para APIs
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna do cache se disponível, senão busca da rede
      return response || fetch(event.request).then((fetchResponse) => {
        // Adiciona ao cache apenas recursos importantes
        if (fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback para quando estiver offline
      if (event.request.destination === 'document') {
        return caches.match('/');
      }
    })
  );
});