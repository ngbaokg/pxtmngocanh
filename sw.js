// Service Worker - giúp app mở được kể cả khi mất mạng tạm thời.
// Chỉ cache GIAO DIỆN (HTML/CSS/JS/icon), KHÔNG cache dữ liệu khách hàng
// (dữ liệu khách hàng đã tự lưu riêng qua IndexedDB, không liên quan tới file này).

const CACHE_NAME = 'ngoc-anh-pmu-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Cài đặt: tải trước các file cốt lõi vào bộ nhớ đệm
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Kích hoạt: dọn cache phiên bản cũ nếu có
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Chiến lược: ưu tiên MẠNG trước (để luôn lấy bản mới nhất khi có mạng),
// nếu mất mạng thì mới dùng bản đã lưu trong cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Có mạng: lấy bản mới, đồng thời cập nhật lại cache cho lần sau
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => {
        // Mất mạng: trả về bản đã lưu trong cache (nếu có)
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Nếu là điều hướng trang (mở app) mà không có cache, trả về trang chính đã cache
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
