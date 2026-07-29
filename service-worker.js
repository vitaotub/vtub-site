/**
 * ============================================================
 * VITÃOTUB - SERVICE WORKER
 * Descrição: Cache de arquivos estáticos para funcionamento
 * offline do site principal e do feed (PWA)
 * Integração com OneSignal para push notifications
 * Auto-update: detecta novas versões e notifica o app
 * Versão: 1.8
 * ============================================================
 */

// Importa o Service Worker do OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ==================== CONFIGURAÇÃO DO CACHE ====================
const CACHE_NAME = 'vitaotub-cache-v0.1';

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
  
  // Feed (PWA)
  '/feed/feed.html',
  '/feed/feed-style.css',
  '/feed/feed-javascript.js',
  
  // Manifest e ícones
  '/manifest.json',
  '/logo-app.png',
  
  // Páginas de política
  '/politica-de-privacidade.html',
  '/termos-de-uso.html'
];

// ==================== INSTALAÇÃO ====================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando arquivos...');
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('Service Worker: Alguns arquivos não puderam ser cacheados:', error);
        });
      })
      .then(() => {
        console.log('Service Worker: Instalação concluída. Forçando ativação...');
        return self.skipWaiting();
      })
  );
});

// ==================== ATIVAÇÃO (LIMPEZA DE CACHES ANTIGOS) ====================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ativação concluída. Assumindo controle...');
      return self.clients.claim();
    })
  );
});

// ==================== MENSAGENS DO APP (SKIP WAITING) ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('Service Worker: Recebido comando skipWaiting. Assumindo controle imediatamente...');
    self.skipWaiting();
  }
});

// ==================== INTERCEPTAÇÃO DE REQUISIÇÕES ====================
self.addEventListener('fetch', event => {
  // Ignora requisições para APIs externas (deixa passar direto para a rede)
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('google-analytics.com') ||
      event.request.url.includes('rss2json.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com') ||
      event.request.url.includes('google.com') ||
      event.request.url.includes('fontshare.com') ||
      event.request.url.includes('cloudflare.com') ||
      event.request.url.includes('onesignal.com') ||
      event.request.url.includes('cdn.onesignal.com')) {
    return; // Não intercepta - deixa o navegador buscar direto
  }
  
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
            // Se offline e não está em cache
            if (event.request.mode === 'navigate') {
              return caches.match('/feed/feed.html');
            }
            // Para outros recursos, retorna erro silencioso
            return new Response('Recurso não disponível offline', { status: 503 });
          });
      })
  );
});

// ==================== NOTIFICAÇÃO DE ATUALIZAÇÃO ====================
self.addEventListener('controllerchange', () => {
  console.log('Service Worker: Controller alterado - nova versão assumiu o controle.');
});