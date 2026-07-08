// Service Worker — Eleições MS 2010-2024
// Estratégia: cache-first (offline-first real). Incremente CACHE_VERSION
// sempre que publicar uma nova versão dos dados/app para forçar atualização.

const CACHE_VERSION = 'eleicoes-ms-v13';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/icon-180.png'
];

// html2canvas (CDN externo, usado só na exportação de imagem) é cacheado
// à parte, sem bloquear a instalação: cache.addAll() é atômico e uma falha
// de CORS/rede nesse recurso cross-origin não pode derrubar o offline-first
// do resto do app.
const ASSET_HTML2CANVAS = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

// Instala e pré-cacheia todos os assets essenciais
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS).then(() =>
        cache.add(ASSET_HTML2CANVAS).catch(() => {
          // sem internet na primeira instalação ou CDN indisponível:
          // exportação de imagem fica indisponível offline, resto do app segue normal
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
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Permite que o cliente force a troca imediata do worker em espera
// (usado pelo banner "Nova versão disponível" no index.html)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache-first: serve do cache imediatamente; só vai à rede se não tiver nada salvo
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // salva no cache uma cópia da resposta para uso offline futuro
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // sem rede e sem cache: fallback para a página principal
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
