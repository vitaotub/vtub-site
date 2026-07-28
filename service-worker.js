/**
 * ============================================================
 * VITÃOTUB - SERVICE WORKER
 * Descrição: Cache de arquivos estáticos para funcionamento
 * offline do site principal e do feed (PWA)
 * Integração com OneSignal para push notifications
 * Versão: 1.7
 * ============================================================
 */

// Importa o Service Worker do OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ==================== CONFIGURAÇÃO DO CACHE ====================
const CACHE_NAME = 'vitaotub-cache-v1.7';

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
  );
  self.skipWaiting();
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
  );
  return self.clients.claim();
});

// ==================== INTERCEPTAÇÃO DE REQUISIÇÕES ====================
self.addEventListener('fetch', event => {
  // Ignora requisições para a API do YouTube e Google Analytics
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('google-analytics.com') ||
      event.request.url.includes('rss2json.com')) {
    return; // Deixa passar direto para a rede
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrou no cache, retorna
        if (response) {
          return response;
        }
        // Se não, busca na rede
        return fetch(event.request).catch(() => {
          // Se offline e não está em cache, retorna página inicial
          if (event.request.mode === 'navigate') {
            return caches.match('/feed/feed.html');
          }
        });
      })
  );
});