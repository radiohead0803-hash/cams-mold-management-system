const express = require('express');
const router = express.Router();
const injectionConditionController = require('../controllers/injectionConditionController');
const { authenticate } = require('../middleware/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 사출조건 등록 (제작처/생산처)
router.post('/', injectionConditionController.createInjectionCondition);

// 사출조건 조회
router.get('/', injectionConditionController.getInjectionCondition);

// 사출조건 이력 조회
router.get('/history', injectionConditionController.getInjectionHistory);

// 사출조건 통계 조회
router.get('/stats', injectionConditionController.getInjectionStats);

// 승인 대기 목록 조회 (개발담당자용)
router.get('/pending', injectionConditionController.getPendingApprovals);

// 사출조건 수정
router.put('/:id', injectionConditionController.updateInjectionCondition);

// 사출조건 승인/반려 (개발담당자)
router.post('/:id/approve', injectionConditionController.approveInjectionCondition);

module.exports = router;
