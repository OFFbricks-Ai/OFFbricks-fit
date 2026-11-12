// Guarda a app para funcionar sem rede. Com rede, vai sempre buscar a versão mais recente.
const CACHE = 'registo-tanita-v1';
const FICHEIROS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const pedido = e.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  const guardar = (res) => {
    if (res && (res.ok || res.type === 'opaque')) {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(pedido, copia));
    }
    return res;
  };
  if (url.origin !== self.location.origin) {
    // Tipos de letra: usa a cópia guardada se existir.
    e.respondWith(caches.match(pedido).then((h) => h || fetch(pedido).then(guardar)));
    return;
  }
  e.respondWith(
    fetch(pedido).then(guardar).catch(() =>
      caches.match(pedido, { ignoreSearch: true }).then((h) => h || caches.match('index.html'))
    )
  );
});
