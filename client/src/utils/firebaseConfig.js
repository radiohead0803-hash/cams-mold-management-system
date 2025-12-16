/**
 * Firebase 설정 및 Cloud Messaging 초기화
 * 
 * 사용 전 Firebase 콘솔에서 프로젝트 생성 후 설정값 입력 필요:
 * 1. https://console.firebase.google.com 접속
 * 2. 프로젝트 생성 또는 선택
 * 3. 프로젝트 설정 > 일반 > 웹 앱 추가
 * 4. Firebase SDK 설정값 복사
 */

// Firebase 설정 (환경변수에서 로드)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Firebase 초기화 여부 확인
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId
  );
};

// Firebase 앱 인스턴스
let firebaseApp = null;
let messaging = null;

/**
 * Firebase 초기화
 */
export const initializeFirebase = async () => {
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] 설정이 완료되지 않았습니다. 환경변수를 확인하세요.');
    return null;
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    
    // 이미 초기화된 앱이 있으면 재사용
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    
    console.log('[Firebase] 초기화 완료');
    return firebaseApp;
  } catch (error) {
    console.error('[Firebase] 초기화 실패:', error);
    return null;
  }
};

/**
 * Firebase Cloud Messaging 초기화
 */
export const initializeMessaging = async () => {
  if (!firebaseApp) {
    await initializeFirebase();
  }
  
  if (!firebaseApp) {
    return null;
  }

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    
    // 브라우저 지원 확인
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] 이 브라우저에서는 푸시 알림이 지원되지 않습니다.');
      return null;
    }
    
    messaging = getMessaging(firebaseApp);
    console.log('[FCM] 메시징 초기화 완료');
    return messaging;
  } catch (error) {
    console.error('[FCM] 메시징 초기화 실패:', error);
    return null;
  }
};

/**
 * FCM 토큰 가져오기
 * @param {string} vapidKey - VAPID 공개 키 (Firebase 콘솔에서 생성)
 */
export const getFCMToken = async (vapidKey) => {
  if (!messaging) {
    await initializeMessaging();
  }
  
  if (!messaging) {
    return null;
  }

  try {
    const { getToken } = await import('firebase/messaging');
    
    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] 알림 권한이 거부되었습니다.');
      return null;
    }
    
    // FCM 토큰 가져오기
    const token = await getToken(messaging, { 
      vapidKey: vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY 
    });
    
    if (token) {
      console.log('[FCM] 토큰 획득 성공');
      return token;
    } else {
      console.warn('[FCM] 토큰을 가져올 수 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] 토큰 획득 실패:', error);
    return null;
  }
};

/**
 * 포그라운드 메시지 리스너 설정
 * @param {Function} callback - 메시지 수신 시 호출될 콜백
 */
export const onForegroundMessage = async (callback) => {
  if (!messaging) {
    await initializeMessaging();
  }
  
  if (!messaging) {
    return null;
  }

  try {
    const { onMessage } = await import('firebase/messaging');
    
    return onMessage(messaging, (payload) => {
      console.log('[FCM] 포그라운드 메시지 수신:', payload);
      
      // 알림 표시
      if (payload.notification) {
        const { title, body, icon } = payload.notification;
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: payload.data
          });
        }
      }
      
      // 콜백 호출
      if (callback) {
        callback(payload);
      }
    });
  } catch (error) {
    console.error('[FCM] 메시지 리스너 설정 실패:', error);
    return null;
  }
};

/**
 * FCM 토큰을 서버에 등록
 * @param {string} token - FCM 토큰
 * @param {string} userId - 사용자 ID
 */
export const registerTokenToServer = async (token, userId) => {
  try {
    const response = await fetch('/api/v1/notifications/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        fcm_token: token,
        user_id: userId,
        device_type: 'web',
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      })
    });
    
    if (response.ok) {
      console.log('[FCM] 토큰 서버 등록 완료');
      return true;
    } else {
      console.error('[FCM] 토큰 서버 등록 실패:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('[FCM] 토큰 서버 등록 오류:', error);
    return false;
  }
};

export default {
  isFirebaseConfigured,
  initializeFirebase,
  initializeMessaging,
  getFCMToken,
  onForegroundMessage,
  registerTokenToServer
};
