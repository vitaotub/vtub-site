// service-worker.js para PWA com OneSignal integrado
// Importa o script do OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Configuração básica de cache para funcionamento offline (opcional, mas recomendado)
const CACHE_NAME = 'vitaotub-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/feed.html',
  '/bio.html',
  '/style.css',
  '/bio-style.css',
  '/javascript.js',
  '/favicon.png'
];

// Instalação do Service Worker e cache dos arquivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Responde às requisições buscando no cache primeiro (estratégia Cache First)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Retorna do cache
        }
        return fetch(event.request); // Busca na rede
      }
    )
  );
});