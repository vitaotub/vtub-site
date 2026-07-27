// service-worker.js para PWA com OneSignal integrado
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'vitaotub-cache-v0.5';
const urlsToCache = [
  '/',
  '/index.html',
  '/feed/feed.html',
  '/bio.html',
  '/style.css',
  '/bio-style.css',
  '/javascript.js',
  '/logo-app.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});