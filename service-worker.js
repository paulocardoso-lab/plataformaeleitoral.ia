// Service Worker — Eleições MS 2010-2024
// Navegações usam network-first para não prender HTML/dataset antigo.
// Assets estáticos usam cache-first e o manifest usa stale-while-revalidate.

const CACHE_VERSION = 'eleicoes-ms-v56';
const ASSETS = [
  '/index.html',
  '/runtime-config.js',
  '/security.js',
  '/version.json',
  '/manifest.json',
  '/icons/logopeia.png',
  '/icons/logopeia-topbar.png',
  '/icons/girassol-inteligencia.png',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/icon-180.png'
];

// html2canvas (CDN externo, usado só na exportação de imagem) é cacheado
// à parte, sem bloquear a instalação: cache.addAll() é atômico e uma falha
// de CORS/rede nesse recurso cross-origin não pode impedir o carregamento
// da estrutura pública do app. Autenticação e dataset continuam online.
const ASSET_HTML2CANVAS = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

// Instala e pré-cacheia todos os assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS).then(() =>
        cache.add(ASSET_HTML2CANVAS).catch(() => {
          // sem internet na primeira instalação ou CDN indisponível:
          // exportação de imagem fica indisponível; a estrutura pública segue disponível
        })
      );
    })
  );
});

// Ativa e limpa caches de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Permite que o cliente force a troca imediata do worker em espera
// (usado pelo banner "Nova versão disponível" no index.html)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    return (await caches.match('/index.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const network = fetch(request).then(async (response) => {
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put(request, response.clone());
    }
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

async function networkFirstResource(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || Response.error();
  }
}

// Somente recursos explicitamente conhecidos são persistidos.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (url.origin !== self.location.origin && event.request.url !== ASSET_HTML2CANVAS) return;

  if (url.pathname === '/runtime-config.js' || url.pathname === '/version.json') {
    event.respondWith(networkFirstResource(event.request));
    return;
  }

  if (url.pathname === '/manifest.json') {
    event.respondWith(staleWhileRevalidate(event.request, event));
    return;
  }

  const assetPath = url.origin === self.location.origin ? url.pathname : event.request.url;
  if (ASSETS.includes(assetPath) || assetPath.startsWith('/icons/')) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
