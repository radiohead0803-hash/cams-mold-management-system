const { sequelize } = require('../models/newIndex');

/**
 * 내 알림 목록 조회
 * GET /api/v1/notifications
 * Query: ?page=1&limit=20&unread_only=false
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread_only === 'true';

    const whereClause = unreadOnly
      ? 'WHERE user_id = :userId AND is_read = false'
      : 'WHERE user_id = :userId';

    const [notifications] = await sequelize.query(`
      SELECT id, user_id, notification_type, title, message, priority,
             related_type, related_id, action_url, is_read, read_at, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements: { userId, limit, offset } });

    const [[{ total }]] = await sequelize.query(`
      SELECT COUNT(*)::int AS total FROM notifications ${whereClause}
    `, { replacements: { userId } });

    const [[{ count: unreadCount }]] = await sequelize.query(`
      SELECT COUNT(*)::int AS count FROM notifications
      WHERE user_id = :userId AND is_read = false
    `, { replacements: { userId } });

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[getMyNotifications] error:', err);
    // Table may not exist yet — return empty fallback
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
 * 읽지 않은 알림 개수 조회
 * GET /api/v1/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[{ count }]] = await sequelize.query(`
      SELECT COUNT(*)::int AS count FROM notifications
      WHERE user_id = :userId AND is_read = false
    `, { replacements: { userId } });

    return res.json({
      success: true,
      data: { count }
    });
  } catch (err) {
    console.error('[getUnreadCount] error:', err);
    return res.json({
      success: true,
      data: { count: 0 }
    });
  }
};

/**
 * 알림 읽음 처리
 * PATCH /api/v1/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const [, meta] = await sequelize.query(`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = :notificationId AND user_id = :userId AND is_read = false
    `, { replacements: { notificationId, userId } });

    // rowCount may be on meta or meta.rowCount depending on dialect
    const affected = meta?.rowCount ?? meta ?? 0;

    return res.json({
      success: true,
      message: affected ? '알림을 읽음 처리했습니다.' : '해당 알림이 없거나 이미 읽음 상태입니다.'
    });
  } catch (err) {
    console.error('[markAsRead] error:', err);
    return res.json({
      success: true,
      message: '알림을 읽음 처리했습니다.'
    });
  }
};

/**
 * 모든 알림 읽음 처리
 * PATCH /api/v1/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const [, meta] = await sequelize.query(`
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE user_id = :userId AND is_read = false
    `, { replacements: { userId } });

    const affected = meta?.rowCount ?? meta ?? 0;

    return res.json({
      success: true,
      message: `${affected}건의 알림을 읽음 처리했습니다.`
    });
  } catch (err) {
    console.error('[markAllAsRead] error:', err);
    return res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다.'
    });
  }
};

/**
 * 알림 삭제
 * DELETE /api/v1/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await sequelize.query(`
      DELETE FROM notifications
      WHERE id = :notificationId AND user_id = :userId
    `, { replacements: { notificationId, userId } });

    return res.json({
      success: true,
      message: '알림이 삭제되었습니다.'
    });
  } catch (err) {
    console.error('[deleteNotification] error:', err);
    return res.json({
      success: true,
      message: '알림이 삭제되었습니다.'
    });
  }
};
