const CACHE_NAME = 'legendbible-v2';
const BASE = './';

// キャッシュするファイル
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'data/quotes.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'icons/icon-180.png',
  BASE + 'icons/icon-152.png',
  BASE + 'icons/icon-120.png',
  BASE + 'icons/favicon-48.png',
  BASE + 'icons/favicon-32.png',
  BASE + 'icons/favicon-16.png',
];

// インストール時：必須ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('SW precache error (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ：Network First（オンライン優先）、失敗時にキャッシュ
self.addEventListener('fetch', event => {
  // chrome-extension や POST などはスキップ
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 正常レスポンスをキャッシュに保存
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request).then(cached => {
          return cached || caches.match(BASE + 'index.html');
        });
      })
  );
});
