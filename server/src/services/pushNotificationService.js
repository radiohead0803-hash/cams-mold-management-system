const admin = require('firebase-admin');

/**
 * 푸시 알림 서비스 (Firebase Cloud Messaging)
 * - 모바일 푸시 알림 발송
 * - 토픽 기반 알림
 * - 디바이스 토큰 관리
 */

let firebaseInitialized = false;

/**
 * Firebase Admin SDK 초기화
 */
const initializeFirebase = () => {
  if (firebaseInitialized) return true;

  try {
    // 환경변수에서 Firebase 설정 로드
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('[PushService] Firebase credentials not configured. Push notifications disabled.');
      return false;
    }

    // JSON 문자열인 경우 파싱
    const credentials = typeof serviceAccount === 'string' 
      ? JSON.parse(serviceAccount) 
      : serviceAccount;

    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });

    firebaseInitialized = true;
    console.log('[PushService] Firebase initialized successfully');
    return true;

  } catch (error) {
    console.error('[PushService] Firebase initialization error:', error.message);
    return false;
  }
};

/**
 * 단일 디바이스에 푸시 알림 발송
 * @param {string} token - FCM 디바이스 토큰
 * @param {Object} notification - 알림 내용
 * @param {Object} data - 추가 데이터
 */
const sendToDevice = async (token, notification, data = {}) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, reason: 'Firebase not configured' };
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'cams_alerts',
          priority: 'high',
          defaultSound: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('[PushService] Message sent:', response);
    
    return { success: true, messageId: response };

  } catch (error) {
    console.error('[PushService] Send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 여러 디바이스에 푸시 알림 발송
 * @param {string[]} tokens - FCM 디바이스 토큰 배열
 * @param {Object} notification - 알림 내용
 * @param {Object} data - 추가 데이터
 */
const sendToMultipleDevices = async (tokens, notification, data = {}) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, reason: 'Firebase not configured' };
    }

    if (!tokens || tokens.length === 0) {
      return { success: false, reason: 'No tokens provided' };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`[PushService] Multicast sent: ${response.successCount}/${tokens.length} successful`);
    
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };

  } catch (error) {
    console.error('[PushService] Multicast error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 토픽에 푸시 알림 발송
 * @param {string} topic - 토픽 이름 (예: 'all_users', 'plant_users')
 * @param {Object} notification - 알림 내용
 * @param {Object} data - 추가 데이터
 */
const sendToTopic = async (topic, notification, data = {}) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, reason: 'Firebase not configured' };
    }

    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };

    const response = await admin.messaging().send(message);
    console.log('[PushService] Topic message sent:', response);
    
    return { success: true, messageId: response };

  } catch (error) {
    console.error('[PushService] Topic send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자를 토픽에 구독
 * @param {string[]} tokens - FCM 디바이스 토큰 배열
 * @param {string} topic - 토픽 이름
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, reason: 'Firebase not configured' };
    }

    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`[PushService] Subscribed to topic ${topic}:`, response);
    
    return { success: true, ...response };

  } catch (error) {
    console.error('[PushService] Subscribe error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자를 토픽에서 구독 해제
 * @param {string[]} tokens - FCM 디바이스 토큰 배열
 * @param {string} topic - 토픽 이름
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    if (!initializeFirebase()) {
      return { success: false, reason: 'Firebase not configured' };
    }

    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`[PushService] Unsubscribed from topic ${topic}:`, response);
    
    return { success: true, ...response };

  } catch (error) {
    console.error('[PushService] Unsubscribe error:', error.message);
    return { success: false, error: error.message };
  }
};

// 알림 유형별 헬퍼 함수들

/**
 * 점검 예정 푸시 알림
 */
const sendInspectionDuePush = async (tokens, mold, daysUntil) => {
  return sendToMultipleDevices(tokens, {
    title: '🔔 점검 예정 알림',
    body: `${mold.mold_code} - 점검 예정일 D-${daysUntil}`
  }, {
    type: 'inspection_due',
    moldId: String(mold.id),
    moldCode: mold.mold_code
  });
};

/**
 * 승인 요청 푸시 알림
 */
const sendApprovalRequestPush = async (tokens, requestType, requesterName) => {
  const typeLabels = {
    'daily_check': '일상점검',
    'periodic_inspection': '정기점검',
    'scrapping': '금형 폐기',
    'transfer': '금형 이관',
    'repair': '수리 요청'
  };

  return sendToMultipleDevices(tokens, {
    title: '📋 승인 요청',
    body: `${requesterName}님이 ${typeLabels[requestType] || requestType} 승인을 요청했습니다.`
  }, {
    type: 'approval_request',
    requestType
  });
};

/**
 * 긴급 알림 푸시
 */
const sendUrgentAlertPush = async (tokens, alertType, message) => {
  return sendToMultipleDevices(tokens, {
    title: '⚠️ 긴급 알림',
    body: message
  }, {
    type: 'urgent_alert',
    alertType
  });
};

module.exports = {
  initializeFirebase,
  sendToDevice,
  sendToMultipleDevices,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendInspectionDuePush,
  sendApprovalRequestPush,
  sendUrgentAlertPush
};
