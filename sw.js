const prefix = 'judabinv-shell:' + self.registration.scope + ':';
// Incrementa esta versión al publicar cambios en el HTML o sus archivos de instalación.
const cacheName = prefix + '22';
const shell = new URL('./index.html', self.registration.scope).href;
const assets = [shell, './manifest.webmanifest', './judabinv-192.png?v=jdb1', './judabinv-512.png?v=jdb1'];

const sdk = 'https://www.gstatic.com/firebasejs/13.2.0/';
const modules = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(name => sdk + name);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll([...assets, ...modules].map(asset => new Request(new URL(asset, self.registration.scope), {cache: 'reload'})))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'activate-update') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const home = new URL('./', self.registration.scope).pathname;
  if (request.method !== 'GET' || (url.origin !== self.location.origin && !modules.includes(url.href))) return;
  const isHome = request.mode === 'navigate' &&
    (url.pathname === home || url.pathname === home + 'index.html');
  if (!isHome && !modules.includes(url.href) && !assets.some(asset => new URL(asset, self.registration.scope).href === url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(isHome ? shell : request) || await fetch(request);
  })());
});
