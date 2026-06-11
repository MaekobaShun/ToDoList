const CACHE_NAME = 'todo-app-v2';
const urlsToCache = [
  '/',
  '/static/style.css',
  '/static/main.js',
  '/static/manifest.json',
  '/static/icon.svg',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // APIリクエストは常にネットワークから取得
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 静的ファイルはネットワーク優先、失敗時はキャッシュにフォールバック
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});