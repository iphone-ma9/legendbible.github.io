// LEGEND BIBLE - Service Worker
// キャッシュ名（更新時はバージョンを上げる）
const CACHE_NAME = 'legendbible-v1.0.9';

// オフライン時に表示するファイル（基本的なもののみ）
const PRECACHE_URLS = [
  '/legendbible.github.io/',
  '/legendbible.github.io/index.html',
  '/legendbible.github.io/manifest.json',
  '/legendbible.github.io/icons/icon-192.png',
  '/legendbible.github.io/icons/icon-512.png',
];

// インストール時：基本ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ時：キャッシュ優先、なければネットワーク
// quotes.jsonは常にネットワークから取得（名言データの更新を反映するため）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // quotes.jsonは常にネットワーク優先（キャッシュは使わない）
  if (url.pathname.includes('quotes.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // その他：キャッシュ優先
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // 成功したレスポンスをキャッシュに追加
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // オフライン時はindex.htmlを返す
      if (event.request.mode === 'navigate') {
        return caches.match('/legendbible.github.io/index.html');
      }
    })
  );
});
