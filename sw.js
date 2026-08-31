const CACHE_NAME = 'creative-rapide-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon.svg'];

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

// doar app shell-ul local e cache-uit (stale-while-revalidate); cererile către Supabase/CDN merg direct în rețea
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

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
