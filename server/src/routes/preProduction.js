const express = require('express');
const router = express.Router();
const preProductionController = require('../controllers/preProductionController');
const { authenticate } = require('../middleware/auth');

/**
 * 제작전 체크리스트 관리 라우트
 */

// 체크리스트 생성
router.post('/checklists', authenticate, preProductionController.createChecklist);

// 체크리스트 조회
router.get('/checklists/:checklist_id', authenticate, preProductionController.getChecklist);

// 체크리스트 목록
router.get('/checklists', authenticate, preProductionController.getChecklists);

// 체크리스트 항목 업데이트
router.patch('/checklists/:checklist_id/items', authenticate, preProductionController.updateChecklistItems);

// 체크리스트 제출
router.post('/checklists/:checklist_id/submit', authenticate, preProductionController.submitChecklist);

// 체크리스트 승인/반려
router.post('/checklists/:checklist_id/review', authenticate, preProductionController.reviewChecklist);

// 체크리스트 통계
router.get('/statistics', authenticate, preProductionController.getChecklistStatistics);

module.exports = router;
