/**
 * 금형 이벤트 라우터
 */
const express = require('express');
const router = express.Router();
const moldEventController = require('../controllers/moldEventController');
const { authenticate } = require('../middleware/auth');

/**
 * 최근 이벤트 조회 (전체 금형)
 * GET /api/v1/mold-events/recent
 */
router.get('/recent', authenticate, moldEventController.getRecentEvents);

/**
 * 금형 이벤트 목록 조회 (타임라인)
 * GET /api/v1/mold-events/:moldId
 */
router.get('/:moldId', authenticate, moldEventController.getMoldEvents);

/**
 * 이벤트 유형별 통계
 * GET /api/v1/mold-events/:moldId/stats
 */
router.get('/:moldId/stats', authenticate, moldEventController.getMoldEventStats);

/**
 * 이벤트 기록
 * POST /api/v1/mold-events
 */
router.post('/', authenticate, moldEventController.createMoldEvent);

module.exports = router;
