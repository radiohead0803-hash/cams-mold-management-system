/**
 * Firebase Cloud Messaging Service Worker
 * 백그라운드 푸시 알림 처리
 */

// Firebase SDK 버전 (최신 버전으로 업데이트 필요)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정 (환경에 맞게 수정 필요)
// 실제 배포 시 Firebase 콘솔에서 발급받은 값으로 교체
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// 메시징 인스턴스
const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || 'CAMS 알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'cams-notification',
    data: payload.data,
    actions: getNotificationActions(payload.data?.type),
    requireInteraction: payload.data?.priority === 'high',
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 유형별 액션 버튼
function getNotificationActions(type) {
  switch (type) {
    case 'inspection':
      return [
        { action: 'view', title: '점검하기', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: '나중에', icon: '/icons/icon-72x72.png' }
      ];
    case 'repair':
      return [
        { action: 'view', title: '확인하기', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: '닫기', icon: '/icons/icon-72x72.png' }
      ];
    case 'transfer':
      return [
        { action: 'approve', title: '승인', icon: '/icons/icon-72x72.png' },
        { action: 'view', title: '상세보기', icon: '/icons/icon-72x72.png' }
      ];
    default:
      return [
        { action: 'view', title: '확인', icon: '/icons/icon-72x72.png' }
      ];
  }
}

// 알림 클릭 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] 알림 클릭:', event.action);
  
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/mobile/home';

  // 액션에 따른 URL 결정
  if (event.action === 'view' || !event.action) {
    switch (data.type) {
      case 'inspection':
        targetUrl = data.moldId 
          ? `/mobile/mold/${data.moldId}/daily-check`
          : '/mobile/alerts';
        break;
      case 'repair':
        targetUrl = data.repairId 
          ? `/mobile/mold/${data.moldId}/repair-list`
          : '/mobile/alerts';
        break;
      case 'transfer':
        targetUrl = data.transferId 
          ? `/mobile/transfer/${data.transferId}`
          : '/mobile/alerts';
        break;
      case 'maintenance':
        targetUrl = '/mobile/maintenance';
        break;
      case 'shot_warning':
        targetUrl = data.moldId 
          ? `/mobile/mold/${data.moldId}`
          : '/mobile/alerts';
        break;
      default:
        targetUrl = '/mobile/alerts';
    }
  } else if (event.action === 'approve' && data.type === 'transfer') {
    targetUrl = `/mobile/transfer/${data.transferId}?action=approve`;
  }

  // 앱 열기 또는 포커스
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// 알림 닫기 핸들러
self.addEventListener('notificationclose', (event) => {
  console.log('[FCM SW] 알림 닫힘:', event.notification.tag);
});

console.log('[FCM SW] Firebase Messaging Service Worker 로드됨');
