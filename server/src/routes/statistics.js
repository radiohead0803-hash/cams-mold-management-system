const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticate } = require('../middleware/auth');
const { cacheMiddleware, CACHE_CONFIG } = require('../middleware/cache');

// GET /api/v1/statistics/molds - 금형 통계
router.get('/molds', authenticate, cacheMiddleware(CACHE_CONFIG.STATISTICS_TTL), statisticsController.getMoldStatistics);

// GET /api/v1/statistics/inspections - 점검 통계
router.get('/inspections', authenticate, cacheMiddleware(CACHE_CONFIG.STATISTICS_TTL), statisticsController.getInspectionStatistics);

// GET /api/v1/statistics/repairs - 수리 통계
router.get('/repairs', authenticate, cacheMiddleware(CACHE_CONFIG.STATISTICS_TTL), statisticsController.getRepairStatistics);

// GET /api/v1/statistics/checklists - 체크리스트 통계
router.get('/checklists', authenticate, cacheMiddleware(CACHE_CONFIG.STATISTICS_TTL), statisticsController.getChecklistStatistics);

// GET /api/v1/statistics/dashboard - 대시보드 통계
router.get('/dashboard', authenticate, cacheMiddleware(CACHE_CONFIG.STATISTICS_TTL), statisticsController.getDashboardStatistics);

module.exports = router;
