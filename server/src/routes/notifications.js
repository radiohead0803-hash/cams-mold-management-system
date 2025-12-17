const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

/**
 * 내 알림 목록 조회
 * GET /api/v1/notifications
 */
router.get(
  '/',
  authenticate,
  notificationController.getMyNotifications
);

/**
 * 읽지 않은 알림 개수 조회
 * GET /api/v1/notifications/unread-count
 */
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

/**
 * 모든 알림 읽음 처리
 * PATCH /api/v1/notifications/read-all
 */
router.patch(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

/**
 * 알림 읽음 처리
 * PATCH /api/v1/notifications/:id/read
 */
router.patch(
  '/:id/read',
  authenticate,
  notificationController.markAsRead
);

/**
 * 알림 삭제
 * DELETE /api/v1/notifications/:id
 */
router.delete(
  '/:id',
  authenticate,
  notificationController.deleteNotification
);

module.exports = router;
