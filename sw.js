'use strict';
const CACHE_NAME = 'verbasprout-shell-v1';
const APP_ROOT = new URL('.', self.registration.scope);
const INDEX_URL = new URL('index.html', APP_ROOT).href;
const SHELL = [
  APP_ROOT.href,
  INDEX_URL,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('icon.svg', APP_ROOT).href,
  new URL('progress-store.js', APP_ROOT).href
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('verbasprout-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(INDEX_URL, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) ||
          (await caches.match(APP_ROOT.href)) ||
          (await caches.match(INDEX_URL)) ||
          new Response('VerbaSprout is offline. Open the app once while online to prepare it.', {
            status: 503,
            headers: { 'content-type': 'text/plain; charset=utf-8' }
          });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && url.pathname.startsWith(APP_ROOT.pathname)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response('Offline', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
