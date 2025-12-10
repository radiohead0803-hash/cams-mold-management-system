const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/statistics/molds - 금형 통계
router.get('/molds', authenticate, statisticsController.getMoldStatistics);

// GET /api/v1/statistics/inspections - 점검 통계
router.get('/inspections', authenticate, statisticsController.getInspectionStatistics);

// GET /api/v1/statistics/repairs - 수리 통계
router.get('/repairs', authenticate, statisticsController.getRepairStatistics);

// GET /api/v1/statistics/checklists - 체크리스트 통계
router.get('/checklists', authenticate, statisticsController.getChecklistStatistics);

// GET /api/v1/statistics/dashboard - 대시보드 통계
router.get('/dashboard', authenticate, statisticsController.getDashboardStatistics);

module.exports = router;
