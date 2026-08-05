/**
 * ============================================================
 * VITÃOTUB - SERVICE WORKER
 * Descrição: Cache de arquivos estáticos para funcionamento
 * offline do site principal e do feed (PWA)
 * Integração com OneSignal para push notifications
 * Auto-update: detecta novas versões e notifica o app
 * Versão: 3.0 - Removidos arquivos antigos e atualizado cache
 * ============================================================
 */

// ==================== CONFIGURAÇÃO DO CACHE ====================
const CACHE_NAME = 'vitaotub-cache-v3.0'; // ← ATUALIZADO

// Arquivos para cache inicial (instalação)
const urlsToCache = [
  // Site principal
  '/',
  '/index.html',
  '/style.css',
  '/javascript.js',
  
  // Página Bio
  '/bio.html',
  '/bio-style.css',
  
  // Página Meus Projetos
  '/meus-projetos.html',
  
  // Página Artigos & Dicas (NOVA)
  '/artigos-dicas.html',
  
  // Feed (PWA)
  '/feed/index.html',
  '/feed/artigos.html',
  
  // Manifest e ícones
  '/manifest.json',
  '/service-worker.js',
  '/logo-app.png',
  '/logo-app-popup.png',
  '/eu-frente-feed.png',
  
  // Páginas de política e erro
  '/politica-de-privacidade.html',
  '/termos-de-uso.html',
  '/404.html',
  
  // Sitemap e robots
  '/sitemap.xml',
  '/robots.txt',
  
  // Ícones PWA
  '/logo-192x192.png',
  '/logo-512x512.png',
  
  // Font Awesome (CDN) - cache para offline
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  
  // Google Fonts (CDN) - cache para offline
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap'
];

// ==================== INSTALAÇÃO ====================
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando arquivos...');
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('[Service Worker] Alguns arquivos não puderam ser cacheados:', error);
          // Continua mesmo com erro em alguns arquivos
        });
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída. Forçando ativação...');
        return self.skipWaiting();
      })
  );
});

// ==================== ATIVAÇÃO (LIMPEZA DE CACHES ANTIGOS) ====================
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Ativação concluída. Assumindo controle...');
      return self.clients.claim();
    })
  );
});

// ==================== MENSAGENS DO APP (SKIP WAITING) ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[Service Worker] Recebido comando skipWaiting. Assumindo controle imediatamente...');
    self.skipWaiting();
  }
  
  // Mensagem para atualização automática
  if (event.data && event.data.action === 'updateCache') {
    console.log('[Service Worker] Atualizando cache...');
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});

// ==================== INTERCEPTAÇÃO DE REQUISIÇÕES ====================
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // ===== ESTRATÉGIAS ESPECÍFICAS =====
  
  // 1. API do YouTube/RSS - Estratégia: Network First
  if (url.includes('youtube.com') || 
      url.includes('rss2json.com') ||
      url.includes('api.rss2json.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 2. Font Awesome e Google Fonts - Estratégia: Cache First
  if (url.includes('font-awesome') || 
      url.includes('fonts.googleapis.com') ||
      url.includes('fontshare.com') ||
      url.includes('.woff2') ||
      url.includes('.woff') ||
      url.includes('.ttf')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
    return;
  }
  
  // 3. OneSignal - Estratégia: Network Only (não cachear)
  if (url.includes('onesignal.com') || 
      url.includes('cdn.onesignal.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // 4. Google Analytics e Tracking - Estratégia: Network Only
  if (url.includes('google-analytics.com') ||
      url.includes('googletagmanager.com') ||
      url.includes('googleads.g.doubleclick.net')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // ===== ESTRATÉGIA PRINCIPAL: CACHE FIRST COM FALLBACK =====
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrou no cache, retorna
        if (response) {
          return response;
        }
        
        // Se não está em cache, busca na rede
        return fetch(event.request)
          .then(networkResponse => {
            // Atualiza o cache com a nova versão (cache em segundo plano)
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Se offline e não está em cache, retorna fallback
            if (event.request.mode === 'navigate') {
              // Para navegação, tenta retornar o feed ou a página inicial
              return caches.match('/feed/index.html')
                .then(fallbackResponse => {
                  return fallbackResponse || caches.match('/index.html');
                });
            }
            
            // Para imagens, retorna um placeholder silencioso
            if (event.request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#333"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="#666" text-anchor="middle" dy=".3em">Sem imagem</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            // Para outros recursos, retorna erro silencioso
            return new Response('Recurso não disponível offline', { 
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ==================== SINCRONIZAÇÃO EM SEGUNDO PLANO ====================
self.addEventListener('sync', event => {
  console.log('[Service Worker] Evento de sincronização:', event.tag);
  
  if (event.tag === 'sync-feed') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll([
          '/feed/index.html',
          '/feed/artigos.html',
          '/artigos-dicas.html'
        ]);
      })
    );
  }
});

// ==================== NOTIFICAÇÕES PUSH ====================
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificação push recebida:', event);
  
  let data = {
    title: 'VitãoTub',
    body: 'Novo conteúdo disponível!',
    icon: '/logo-192x192.png',
    badge: '/logo-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/feed/index.html'
    }
  };
  
  // Tenta extrair dados da notificação
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      // Se não for JSON, usa o texto como body
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo-192x192.png',
    badge: data.badge || '/logo-192x192.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || { url: '/feed/index.html' },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'VitãoTub', options)
  );
});

// ==================== CLIQUE NA NOTIFICAÇÃO ====================
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clique na notificação:', event);
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/feed/index.html';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Se já tem uma janela aberta, foca nela
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ==================== NOTIFICAÇÃO DE ATUALIZAÇÃO ====================
self.addEventListener('controllerchange', () => {
  console.log('[Service Worker] Controller alterado - nova versão assumiu o controle.');
});

// ==================== GERENCIAMENTO DE ERROS ====================
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Erro:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Promessa rejeitada não tratada:', event.reason);
});