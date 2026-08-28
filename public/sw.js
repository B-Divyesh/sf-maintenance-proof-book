const VERSION = 'mpb-__BUILD_VERSION__';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/assets/evidence-exploded.webp', '/assets/evidence-exploded.jpg'];
const BUILD_ASSETS = [/* INJECT_BUILD_ASSETS */];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const requests = [...new Set([...PRECACHE, ...BUILD_ASSETS])].map((url) => new Request(url, { cache: 'reload' }));
    await cache.addAll(requests);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const request = event.request;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(RUNTIME).then((cache) => cache.put('/', copy));
      return response;
    }).catch(async () => (await caches.match('/', { ignoreVary: true })) || (await caches.match('/offline.html', { ignoreVary: true }))));
    return;
  }
  event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(RUNTIME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
