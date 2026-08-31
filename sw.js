const CACHE_NAME = 'creative-rapide-v2';
const APP_SHELL = ['./index.html', './manifest.json', './icon.svg'];
const CACHEABLE_ORIGINS = [self.location.origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => Promise.all(APP_SHELL.map(url => cache.add(url).catch(() => {}))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// app shell-ul local + fonturile Google sunt cache-uite (stale-while-revalidate); Supabase/alte CDN-uri merg direct în rețea
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (!CACHEABLE_ORIGINS.includes(url.origin)) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if (resp && resp.ok) caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
