// service-worker.js para PWA com OneSignal integrado
// Importa o script do OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Versão do cache (incremente para 'v2', 'v3', etc. quando quiser forçar a atualização dos arquivos)
const CACHE_NAME = 'vitaotub-cache-v0';
const urlsToCache = [
  '/',
  '/index.html',
  '/feed.html',
  '/bio.html',
  '/style.css',
  '/bio-style.css',
  '/javascript.js',
  '/logo-app.png'
];

// Instalação do Service Worker e cache dos arquivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  // Força o novo service worker a assumir o controle imediatamente
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Responde às requisições buscando no cache primeiro, com fallback para a rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Retorna do cache
        }
        return fetch(event.request); // Busca na rede
      })
  );
});