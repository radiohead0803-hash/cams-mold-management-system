const express = require('express');
const router = express.Router();
const mobileMoldController = require('../controllers/mobileMoldController');
// const { authMiddleware } = require('../middleware/auth'); // 인증 미들웨어 (필요시 활성화)

/**
 * 모바일 QR 스캔 후 위치 전송
 * POST /api/v1/mobile/molds/:moldId/location
 */
router.post(
  '/molds/:moldId/location',
  // authMiddleware, // 인증 필요 시 활성화
  mobileMoldController.updateMoldLocation
);

/**
 * 금형 위치 로그 조회
 * GET /api/v1/mobile/molds/:moldId/location-logs
 */
router.get(
  '/molds/:moldId/location-logs',
  // authMiddleware, // 인증 필요 시 활성화
  mobileMoldController.getMoldLocationLogs
);

module.exports = router;
