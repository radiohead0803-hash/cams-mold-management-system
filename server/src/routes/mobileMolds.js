const express = require('express');
const router = express.Router();
const mobileMoldController = require('../controllers/mobileMoldController');
const { authenticate } = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * 모바일 QR 스캔 후 위치 전송
 * POST /api/v1/mobile/molds/:moldId/location
 */
router.post(
  '/molds/:moldId/location',
  mobileMoldController.updateMoldLocation
);

/**
 * 금형 위치 로그 조회
 * GET /api/v1/mobile/molds/:moldId/location-logs
 */
router.get(
  '/molds/:moldId/location-logs',
  mobileMoldController.getMoldLocationLogs
);

module.exports = router;
