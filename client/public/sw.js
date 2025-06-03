// Service Worker para notificações push
const CACHE_NAME = 'eco-supermarket-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Listener para notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let options = {
    body: 'Você tem uma nova notificação',
    icon: '/generated-icon.png',
    badge: '/generated-icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/generated-icon.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/generated-icon.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.title = data.title || 'Eco Supermercado';
    options.body = data.body || options.body;
    options.icon = data.icon || options.icon;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'Eco Supermercado', options)
  );
});

// Listener para cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir a aplicação
    event.waitUntil(
      self.clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Apenas fechar a notificação
    return;
  } else {
    // Clique na notificação (não nos botões)
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Listener para push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription mudou');
  
  event.waitUntil(
    fetch('/api/push/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldSubscription: event.oldSubscription,
        newSubscription: event.newSubscription
      })
    })
  );
});