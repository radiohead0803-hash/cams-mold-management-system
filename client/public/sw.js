/**
 * Service Worker for CAMS PWA
 * - 오프라인 캐싱
 * - 푸시 알림 수신
 */

const CACHE_NAME = 'cams-v1';
const STATIC_ASSETS = [
  '/',
  '/mobile/home',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트 (네트워크 우선, 실패 시 캐시)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // chrome-extension 및 기타 비표준 스킴은 무시 (캐시 불가)
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // GET 이외의 메서드는 캐시 불가 (POST, PUT, DELETE 등)
  if (event.request.method !== 'GET') {
    return;
  }
  
  // API 요청은 캐시하지 않음
  if (url.pathname.includes('/api/')) {
    return;
  }

  // SPA 네비게이션 요청 처리 (HTML 요청)
  // navigate 요청이면 index.html 반환 (SPA 라우팅 지원)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 오프라인 시 캐시된 index.html 반환
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // 정적 자산 요청 (JS, CSS, 이미지 등)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 시 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'CAMS 알림', body: '새로운 알림이 있습니다.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/mobile/alerts',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' }
    ],
    tag: data.tag || 'cams-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data?.url || '/mobile/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  // 오프라인 큐 동기화는 메인 앱에서 처리
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
  });
}
