/* ================================================================
   Z-STUNTING Service Worker v4
   Strategi:
   - HTML/JS/CSS: Network-first dengan cache fallback (auto update)
   - CDN (Leaflet, XLSX, dll): Cache-first (jarang berubah)
   - Supabase (API): Network-only (jangan cache data dinamis)
   - Ikon/gambar: Cache-first
   ================================================================ */

const CACHE = 'zstunting-v5';
const CACHE_STATIC = 'zstunting-static-v5';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

const CDN_HOSTS = ['unpkg.com','cdn.jsdelivr.net','cdnjs.cloudflare.com'];
const TILE_HOSTS = ['tile.openstreetmap.org','basemaps.cartocdn.com'];

/* INSTALL */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(SHELL).catch(err => console.warn('SW: ada file tidak tersedia', err)))
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE — hapus cache lama */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== CACHE_STATIC).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* FETCH */
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Supabase — selalu network */
  if(url.hostname.endsWith('supabase.co')) return;

  /* Tile peta — cache first, tanpa expire */
  if(TILE_HOSTS.some(h => url.hostname.endsWith(h))){
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const cp = res.clone();
        caches.open(CACHE_STATIC).then(c => c.put(req, cp));
        return res;
      }))
    );
    return;
  }

  /* CDN — cache first */
  if(CDN_HOSTS.some(h => url.hostname.endsWith(h))){
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if(res.ok){
          const cp = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(req, cp));
        }
        return res;
      }))
    );
    return;
  }

  /* HTML / JS / CSS lokal — network first, fallback ke cache */
  if(url.origin === location.origin || url.pathname.endsWith('.html')){
    e.respondWith(
      fetch(req).then(res => {
        if(res.ok){
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return res;
      }).catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }

  /* Default: network dulu, fallback cache */
  e.respondWith(
    fetch(req).then(res => {
      if(res.ok && url.origin === location.origin){
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});

/* MESSAGE — untuk trigger skipWaiting dari UI */
self.addEventListener('message', e => {
  if(e.data === 'SKIP_WAITING') self.skipWaiting();
});
