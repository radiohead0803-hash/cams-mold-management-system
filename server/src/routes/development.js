const express = require('express');
const router = express.Router();
const developmentController = require('../controllers/developmentController');
const { authenticate } = require('../middleware/auth');

/**
 * 금형개발계획 관리 라우트
 * - 14단계 기본 공정 (개발 12단계 + 금형육성 + 양산이관)
 * - 사용자 정의 단계 추가/삭제 지원
 */

// 기본 단계 마스터 목록 조회
router.get('/default-steps', developmentController.getDefaultSteps);

// 개발계획 생성 (14단계 자동 생성)
router.post('/plans', authenticate, developmentController.createDevelopmentPlan);

// 개발계획 목록
router.get('/plans', authenticate, developmentController.getDevelopmentPlans);

// 개발계획 조회 (plan_id 기준)
router.get('/plans/:plan_id', authenticate, developmentController.getDevelopmentPlan);

// 금형별 개발계획 조회 (mold_specification_id 기준)
router.get('/mold-spec/:mold_spec_id', authenticate, developmentController.getDevelopmentPlanByMoldSpec);

// 공정 단계 업데이트
router.patch('/steps/:step_id', authenticate, developmentController.updateProcessStep);

// 추진계획 항목 추가 (사용자 정의 단계)
router.post('/plans/:plan_id/steps', authenticate, developmentController.addProcessStep);

// 추진계획 항목 삭제 (사용자 정의 단계만)
router.delete('/plans/:plan_id/steps/:step_id', authenticate, developmentController.deleteProcessStep);

// 추진계획 항목 순서 변경
router.put('/plans/:plan_id/steps/reorder', authenticate, developmentController.reorderProcessSteps);

// 진행률 통계
router.get('/statistics/progress', authenticate, developmentController.getProgressStatistics);

module.exports = router;
