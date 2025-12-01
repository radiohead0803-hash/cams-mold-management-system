const { Notification, User } = require('../models');

/**
 * 알림 생성 헬퍼 함수
 * @param {Object} params - 알림 파라미터
 * @param {number} params.userId - 알림 받을 사용자 ID
 * @param {string} params.type - 알림 타입 (location_moved, location_back, ng_detected, repair_status, inspection_due)
 * @param {string} params.title - 알림 제목
 * @param {string} params.message - 알림 메시지
 * @param {number} [params.moldId] - 관련 금형 ID
 * @param {string} [params.priority] - 우선순위 (low, normal, high, urgent)
 * @param {string} [params.actionUrl] - 액션 URL
 * @returns {Promise<Notification>}
 */
async function createNotification({ 
  userId, 
  type, 
  title, 
  message, 
  moldId, 
  priority = 'normal',
  actionUrl 
}) {
  if (!userId) {
    console.warn('[notificationService] userId is required');
    return null;
  }

  try {
    const notification = await Notification.create({
      user_id: userId,
      notification_type: type,
      title,
      message,
      priority,
      related_type: moldId ? 'mold' : null,
      related_id: moldId || null,
      action_url: actionUrl || (moldId ? `/molds/${moldId}` : null),
      is_read: false,
      created_at: new Date()
    });

    console.log(`[notificationService] Created notification ${notification.id} for user ${userId}: ${type}`);
    
    return notification;
  } catch (error) {
    console.error('[notificationService] Failed to create notification:', error);
    return null;
  }
}

/**
 * 여러 사용자에게 동일한 알림 전송
 * @param {number[]} userIds - 사용자 ID 배열
 * @param {Object} notificationData - 알림 데이터
 * @returns {Promise<Notification[]>}
 */
async function createBulkNotifications(userIds, notificationData) {
  if (!userIds || userIds.length === 0) {
    console.warn('[notificationService] No userIds provided');
    return [];
  }

  const promises = userIds.map(userId =>
    createNotification({ ...notificationData, userId })
  );

  const results = await Promise.allSettled(promises);
  
  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

/**
 * 특정 역할의 모든 사용자에게 알림 전송
 * @param {string} role - 사용자 역할 (system_admin, mold_developer, plant_manager, etc)
 * @param {Object} notificationData - 알림 데이터
 * @returns {Promise<Notification[]>}
 */
async function notifyUsersByRole(role, notificationData) {
  try {
    const users = await User.findAll({
      where: { role },
      attributes: ['id']
    });

    const userIds = users.map(u => u.id);
    
    if (userIds.length === 0) {
      console.warn(`[notificationService] No users found with role: ${role}`);
      return [];
    }

    return await createBulkNotifications(userIds, notificationData);
  } catch (error) {
    console.error('[notificationService] Failed to notify users by role:', error);
    return [];
  }
}

/**
 * 시스템 관리자에게 알림 전송
 * @param {Object} notificationData - 알림 데이터
 * @returns {Promise<Notification[]>}
 */
async function notifyAdmins(notificationData) {
  return notifyUsersByRole('system_admin', notificationData);
}

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyUsersByRole,
  notifyAdmins
};
