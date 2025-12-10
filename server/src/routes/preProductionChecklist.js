const express = require('express');
const router = express.Router();
const preProductionChecklistController = require('../controllers/preProductionChecklistController');
const { authenticate } = require('../middleware/auth');

/**
 * 제작전 체크리스트 라우트 (81개 항목, 9개 카테고리)
 */

// 카테고리별 요약 조회
router.get('/categories/summary', authenticate, preProductionChecklistController.getCategorySummary);

// 체크리스트 항목 조회 (마스터)
router.get('/items', authenticate, preProductionChecklistController.getChecklistItems);

// 체크리스트 목록 조회
router.get('/', authenticate, preProductionChecklistController.getChecklists);

// 체크리스트 상세 조회
router.get('/:id', authenticate, preProductionChecklistController.getChecklistById);

// 체크리스트 생성
router.post('/', authenticate, preProductionChecklistController.createChecklist);

// 체크리스트 항목 결과 업데이트
router.patch('/:id/results', authenticate, preProductionChecklistController.updateChecklistResults);

// 체크리스트 제출
router.post('/:id/submit', authenticate, preProductionChecklistController.submitChecklist);

// 체크리스트 승인
router.post('/:id/approve', authenticate, preProductionChecklistController.approveChecklist);

// 체크리스트 반려
router.post('/:id/reject', authenticate, preProductionChecklistController.rejectChecklist);

module.exports = router;
