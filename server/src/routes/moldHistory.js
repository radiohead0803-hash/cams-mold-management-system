const express = require('express');
const router = express.Router();
const moldHistoryController = require('../controllers/moldHistoryController');
const { authenticate } = require('../middleware/auth');

/**
 * 금형 통합 변경이력 라우트
 */

// 금형별 통합 이력 조회
router.get('/:moldId', authenticate, moldHistoryController.getMoldHistory);

// 금형 이력 추가
router.post('/', authenticate, moldHistoryController.createMoldHistory);

module.exports = router;
