const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { authenticate } = require('../middleware/auth');

/**
 * 생산수량 관리 라우트
 */

// 생산수량 입력 (타수 자동 누적)
router.post('/record', authenticate, productionController.recordProduction);

// 생산수량 이력 조회
router.get('/history/:mold_id', authenticate, productionController.getProductionHistory);

// 일별 생산 통계
router.get('/statistics/daily', authenticate, productionController.getDailyStatistics);

module.exports = router;
