// Service Worker — Secrétaire de Réunion CO-JAK
const CACHE = 'secretaire-v2';
const ASSETS = ['./secretary_reunion.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Réseau direct pour APIs et CDNs
  if (['api.openai.com','api.groq.com'].includes(url.hostname) ||
      url.hostname.includes('huggingface') ||
      url.hostname.includes('jsdelivr') ||
      url.hostname.includes('cdnjs')) {
    e.respondWith(fetch(e.request)); return;
  }
  // Google Fonts : réseau + cache
  if (url.hostname.includes('fonts.google') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(caches.open(CACHE).then(cache =>
      cache.match(e.request).then(hit =>
        hit || fetch(e.request).then(r => { cache.put(e.request, r.clone()); return r; })
      )
    )); return;
  }
  // Locaux : cache-first
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
