const CACHE_VERSION = 'acp-v11';
const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'css/app.css',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'js/main.js',
  'js/ui.js',
  'js/data.js',
  'js/pwa.js',
  'js/router.js',
  'js/storage.js',
  'js/progress.js',
  'js/exam.js',
  'js/scoring.js',
  'js/crypto.js',
  'js/interview.js',
  'js/keystore.js',
  'js/iv-session.js',
  'js/views/domain-row.js',
  'js/views/home.js',
  'js/views/learn.js',
  'js/views/practice.js',
  'js/views/question.js',
  'js/views/exam.js',
  'js/views/result.js',
  'js/views/wrong.js',
  'js/views/settings.js',
  'js/views/bank-switch.js',
  'js/views/iv-unlock.js',
  'js/views/iv-home.js',
  'js/views/iv-domain-row.js',
  'js/rich.js',
  'js/views/iv-learn.js',
  'js/views/iv-mock.js',
];
const DOMAINS = ['app-dev', 'prompt', 'rag', 'finetune', 'agent-mm', 'production'];
const DATA = ['data/domains.json'].concat(
  DOMAINS.map((d) => `data/cards/${d}.json`),
  DOMAINS.map((d) => `data/questions/${d}.json`),
);
// 运行期才有的可选文件：解密密文不预置，构建后才存在，且新版本发布时不应因它缺失而装机失败
const OPTIONAL = ['data/interview.enc'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(
    SHELL.concat(DATA).map((u) => new Request(u, { cache: 'reload' })),
  ).then(() => Promise.all(
    OPTIONAL.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => undefined)),
  ))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, response.clone());
  }
  return response;
}

function staleWhileRevalidate(event) {
  const network = fetch(event.request, { cache: 'no-cache' }).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      await cache.put(event.request, response.clone());
    }
    return response;
  });
  event.waitUntil(network.catch(() => undefined));
  return caches.match(event.request).then((cached) => cached || network);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(url.pathname.indexOf('/data/') !== -1 ? staleWhileRevalidate(event) : cacheFirst(event.request));
});
