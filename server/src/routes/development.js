const express = require('express');
const router = express.Router();
const developmentController = require('../controllers/developmentController');
const { authenticate } = require('../middleware/auth');

/**
 * 금형개발계획 관리 라우트
 */

// 개발계획 생성 (12단계 자동 생성)
router.post('/plans', authenticate, developmentController.createDevelopmentPlan);

// 개발계획 조회
router.get('/plans/:plan_id', authenticate, developmentController.getDevelopmentPlan);

// 개발계획 목록
router.get('/plans', authenticate, developmentController.getDevelopmentPlans);

// 공정 단계 업데이트
router.patch('/steps/:step_id', authenticate, developmentController.updateProcessStep);

// 진행률 통계
router.get('/statistics/progress', authenticate, developmentController.getProgressStatistics);

module.exports = router;
