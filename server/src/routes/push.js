const express = require('express');
const router = express.Router();
const pushService = require('../services/pushNotificationService');
const webPushService = require('../services/webPushService');
const { sequelize } = require('../models/newIndex');
const { authenticate, authorize } = require('../middleware/auth');

// ════════════════════════════════════════════════
// VAPID / Web-Push endpoints (no Firebase needed)
// ════════════════════════════════════════════════

/**
 * @route   GET /api/v1/push/vapid-public-key
 * @desc    Return the VAPID public key so the client can call pushManager.subscribe()
 * @access  Public (no auth — needed before login on PWA install)
 */
router.get('/vapid-public-key', (req, res) => {
  const key = webPushService.getVapidPublicKey();
  if (!key) {
    return res.status(500).json({ success: false, message: 'VAPID keys not configured' });
  }
  res.json({ success: true, data: { publicKey: key } });
});

/**
 * @route   POST /api/v1/push/subscribe
 * @desc    Save a Web-Push subscription (upsert by endpoint)
 * @access  Private
 * @body    { subscription: { endpoint, keys: { p256dh, auth } } }
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys ||
        !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'subscription 객체(endpoint, keys.p256dh, keys.auth)가 필요합니다.'
      });
    }

    // Upsert by endpoint
    await sequelize.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, is_active, created_at, updated_at)
      VALUES (:userId, :endpoint, :p256dh, :auth, true, NOW(), NOW())
      ON CONFLICT (endpoint)
      DO UPDATE SET user_id = :userId, p256dh = :p256dh, auth = :auth, is_active = true, updated_at = NOW()
    `, {
      replacements: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    res.json({ success: true, message: '푸시 구독이 등록되었습니다.' });
  } catch (error) {
    console.error('[push/subscribe] error:', error);
    res.status(500).json({
      success: false,
      message: '푸시 구독 등록 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/push/unsubscribe
 * @desc    Remove / deactivate a Web-Push subscription
 * @access  Private
 * @body    { endpoint }
 */
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint는 필수입니다.' });
    }

    await sequelize.query(`
      UPDATE push_subscriptions SET is_active = false, updated_at = NOW()
      WHERE endpoint = :endpoint AND user_id = :userId
    `, {
      replacements: { endpoint, userId: req.user.id }
    });

    res.json({ success: true, message: '푸시 구독이 해제되었습니다.' });
  } catch (error) {
    console.error('[push/unsubscribe] error:', error);
    res.status(500).json({
      success: false,
      message: '푸시 구독 해제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════
// Legacy Firebase (FCM) endpoints — kept as-is
// ════════════════════════════════════════════════

// All Firebase routes require auth
router.use('/register', authenticate);
router.use('/unregister', authenticate);
router.use('/send', authenticate);
router.use('/config', authenticate);

/**
 * @route   POST /api/v1/push/register
 * @desc    디바이스 토큰 등록 (Firebase)
 * @access  Private
 */
router.post('/register', async (req, res) => {
  try {
    const { userId, token, deviceType, deviceInfo } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'userId와 token은 필수입니다.'
      });
    }

    // 기존 토큰 업데이트 또는 새로 등록
    await sequelize.query(`
      INSERT INTO user_device_tokens (user_id, fcm_token, device_type, device_info, is_active, created_at, updated_at)
      VALUES (:userId, :token, :deviceType, :deviceInfo, true, NOW(), NOW())
      ON CONFLICT (user_id, fcm_token)
      DO UPDATE SET is_active = true, updated_at = NOW()
    `, {
      replacements: {
        userId,
        token,
        deviceType: deviceType || 'unknown',
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null
      }
    });

    // 사용자 유형에 따라 토픽 구독
    const [users] = await sequelize.query(`
      SELECT user_type FROM users WHERE id = :userId
    `, { replacements: { userId } });

    if (users.length > 0) {
      const userType = users[0].user_type;
      await pushService.subscribeToTopic([token], `${userType}_users`);
      await pushService.subscribeToTopic([token], 'all_users');
    }

    res.json({
      success: true,
      message: '디바이스 토큰이 등록되었습니다.'
    });

  } catch (error) {
    console.error('토큰 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '토큰 등록 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/push/unregister
 * @desc    디바이스 토큰 해제 (Firebase)
 * @access  Private
 */
router.post('/unregister', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'token은 필수입니다.'
      });
    }

    await sequelize.query(`
      UPDATE user_device_tokens
      SET is_active = false, updated_at = NOW()
      WHERE fcm_token = :token
    `, { replacements: { token } });

    res.json({
      success: true,
      message: '디바이스 토큰이 해제되었습니다.'
    });

  } catch (error) {
    console.error('토큰 해제 오류:', error);
    res.status(500).json({
      success: false,
      message: '토큰 해제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/push/send
 * @desc    푸시 알림 발송 (관리자용, Firebase)
 * @access  Private (Admin only)
 */
router.post('/send', authorize(['system_admin']), async (req, res) => {
  try {
    const { userIds, topic, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title과 body는 필수입니다.'
      });
    }

    let result;

    if (topic) {
      result = await pushService.sendToTopic(topic, { title, body }, data || {});
    } else if (userIds && userIds.length > 0) {
      const [tokens] = await sequelize.query(`
        SELECT fcm_token FROM user_device_tokens
        WHERE user_id = ANY(:userIds) AND is_active = true
      `, { replacements: { userIds } });

      if (tokens.length === 0) {
        return res.json({
          success: false,
          message: '활성화된 디바이스 토큰이 없습니다.'
        });
      }

      result = await pushService.sendToMultipleDevices(
        tokens.map(t => t.fcm_token),
        { title, body },
        data || {}
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'userIds 또는 topic 중 하나는 필수입니다.'
      });
    }

    res.json({
      success: result.success,
      message: result.success ? '푸시 알림이 발송되었습니다.' : '푸시 알림 발송에 실패했습니다.',
      data: result
    });

  } catch (error) {
    console.error('푸시 발송 오류:', error);
    res.status(500).json({
      success: false,
      message: '푸시 알림 발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/push/config
 * @desc    푸시 설정 상태 확인
 * @access  Private
 */
router.get('/config', async (req, res) => {
  try {
    const isFirebaseConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const vapidKey = webPushService.getVapidPublicKey();

    res.json({
      success: true,
      data: {
        firebase: {
          configured: isFirebaseConfigured,
          message: isFirebaseConfigured
            ? 'Firebase가 설정되어 있습니다.'
            : 'FIREBASE_SERVICE_ACCOUNT 환경변수를 설정해주세요.'
        },
        vapid: {
          configured: !!vapidKey,
          publicKey: vapidKey
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '설정 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
