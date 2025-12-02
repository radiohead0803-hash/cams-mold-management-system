const { Notification, Mold } = require('../models');

/**
 * 내 알림 목록 조회
 * GET /api/v1/notifications
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || 1; // 개발 중에는 기본값 1 사용
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    // 임시: Notification 모델이 없거나 에러 발생 시 빈 배열 반환
    let notifications = [];
    let unreadCount = 0;

    try {
      const where = { user_id: userId };
      
      if (unreadOnly === 'true') {
        where.is_read = false;
      }

      notifications = await Notification.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: Mold,
            as: 'mold',
            attributes: ['id', 'mold_code', 'mold_name'],
            required: false
          }
        ]
      });

      // 읽지 않은 알림 개수
      unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false }
      });
    } catch (dbError) {
      console.warn('[getMyNotifications] DB error, returning empty array:', dbError.message);
      // DB 에러 시 빈 배열 반환 (에러 없이 계속 진행)
    }

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });

  } catch (err) {
    console.error('[getMyNotifications] error:', err);
    // 최종 에러 시에도 빈 배열 반환
    return res.json({
      success: true,
      data: {
        notifications: [],
        unreadCount: 0,
        total: 0
      }
    });
  }
};

/**
 * 알림 읽음 처리
 * PATCH /api/v1/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.'
      });
    }

    await notification.update({
      is_read: true,
      read_at: new Date()
    });

    return res.json({
      success: true,
      data: notification
    });

  } catch (err) {
    console.error('[markAsRead] error:', err);
    return res.status(500).json({
      success: false,
      message: '알림 업데이트에 실패했습니다.'
    });
  }
};

/**
 * 모든 알림 읽음 처리
 * PATCH /api/v1/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );

    return res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다.'
    });

  } catch (err) {
    console.error('[markAllAsRead] error:', err);
    return res.status(500).json({
      success: false,
      message: '알림 업데이트에 실패했습니다.'
    });
  }
};

/**
 * 알림 삭제
 * DELETE /api/v1/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.'
      });
    }

    await notification.destroy();

    return res.json({
      success: true,
      message: '알림이 삭제되었습니다.'
    });

  } catch (err) {
    console.error('[deleteNotification] error:', err);
    return res.status(500).json({
      success: false,
      message: '알림 삭제에 실패했습니다.'
    });
  }
};

/**
 * 읽지 않은 알림 개수 조회
 * GET /api/v1/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    let count = 0;

    try {
      count = await Notification.count({
        where: { user_id: userId, is_read: false }
      });
    } catch (dbError) {
      console.warn('[getUnreadCount] DB error, returning 0:', dbError.message);
      // DB 에러 시 0 반환
    }

    return res.json({
      success: true,
      data: { count }
    });

  } catch (err) {
    console.error('[getUnreadCount] error:', err);
    // 최종 에러 시에도 0 반환
    return res.json({
      success: true,
      data: { count: 0 }
    });
  }
};
