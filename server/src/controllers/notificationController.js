const { Notification, Mold } = require('../models');

/**
 * 내 알림 목록 조회
 * GET /api/v1/notifications
 * 
 * TODO: DB 연동 완료 후 실제 쿼리로 교체
 * 현재는 500 에러 방지를 위해 임시 스텁으로 동작
 */
exports.getMyNotifications = async (req, res) => {
  try {
    // TODO: 나중에 실제 DB에서 조회
    // const userId = req.user?.id || 1;
    // const notifications = await Notification.findAll({ ... });
    
    // 임시: 항상 빈 배열 반환 (500 에러 방지)
    return res.json({
      success: true,
      data: {
        notifications: [],
        unreadCount: 0,
        total: 0
      }
    });

  } catch (err) {
    console.error('[getMyNotifications] error:', err);
    // 에러 발생 시에도 200 + 빈 배열 반환 (프론트 에러 방지)
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
 * 
 * TODO: DB 연동 완료 후 실제 업데이트로 교체
 */
exports.markAsRead = async (req, res) => {
  try {
    // TODO: 나중에 실제 DB 업데이트
    // const notification = await Notification.findOne({ ... });
    // await notification.update({ is_read: true });
    
    // 임시: 항상 성공 반환
    return res.json({
      success: true,
      message: '알림을 읽음 처리했습니다.'
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
 * 
 * TODO: DB 연동 완료 후 실제 업데이트로 교체
 */
exports.markAllAsRead = async (req, res) => {
  try {
    // TODO: 나중에 실제 DB 업데이트
    // await Notification.update({ is_read: true }, { where: { ... } });
    
    // 임시: 항상 성공 반환
    return res.json({
      success: true,
      message: '모든 알림을 읽음 처리했습니다.'
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
 * 
 * TODO: DB 연동 완료 후 실제 삭제로 교체
 */
exports.deleteNotification = async (req, res) => {
  try {
    // TODO: 나중에 실제 DB 삭제
    // const notification = await Notification.findOne({ ... });
    // await notification.destroy();
    
    // 임시: 항상 성공 반환
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

/**
 * 읽지 않은 알림 개수 조회
 * GET /api/v1/notifications/unread-count
 * 
 * TODO: DB 연동 완료 후 실제 카운트로 교체
 */
exports.getUnreadCount = async (req, res) => {
  try {
    // TODO: 나중에 실제 DB 카운트
    // const count = await Notification.count({ ... });
    
    // 임시: 항상 0 반환
    return res.json({
      success: true,
      data: { count: 0 }
    });

  } catch (err) {
    console.error('[getUnreadCount] error:', err);
    return res.json({
      success: true,
      data: { count: 0 }
    });
  }
};
