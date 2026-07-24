/* ФАБУЛА — service worker

   Bump VERSION on every deploy. Old caches are dropped on activate.

   Strategy matters here: HTML is fetched NETWORK-FIRST so a fresh deploy is
   picked up immediately (the previous cache-first version served stale pages
   forever, no matter how many times the site was redeployed). Everything else
   (fonts, art) is cache-first because those filenames are stable and heavy.
*/
const VERSION = 'fabula-v3';
const CACHE = VERSION;

const SHELL = [
  './',
  'index.html',
  'app.html',
  'manifest.json',
  'assets/fonts/fonts.css',
  'assets/hero_landing.jpg',
  'assets/cover_fantasy.jpg',
  'assets/cover_scifi.jpg',
  'assets/cover_history.jpg',
  'assets/cover_postapoc.jpg',
  'assets/hero_fantasy.jpg',
  'assets/avatar.jpg',
  'assets/keyframe_01.jpg',
  'assets/keyframe_02.jpg',
  'assets/keyframe_03.jpg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* let the page force an immediate takeover */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // video streams on Range requests; a cached 200 would break seeking
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return;

  const isPage = req.mode === 'navigate' || req.destination === 'document';

  if (isPage) {
    // network first: always show the freshest deploy, fall back to cache offline
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // static assets: cache first, then network (and remember it for offline)
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
