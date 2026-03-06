const express = require('express');
const router = express.Router();
const scrappingController = require('../controllers/scrappingController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 금형 폐기 관리 라우트
 */

// 폐기 통계 조회
router.get('/statistics', authenticate, scrappingController.getStatistics);

// 폐기 요청 목록 조회
router.get('/', authenticate, scrappingController.getScrappingRequests);

// 폐기 요청 상세 조회
router.get('/:id', authenticate, scrappingController.getScrappingRequestById);

// 폐기 요청 생성
router.post('/', authenticate, authorize(['plant', 'mold_developer', 'system_admin']), scrappingController.createScrappingRequest);

// 1차 승인 (금형개발 담당)
router.post('/:id/first-approve', authenticate, authorize(['mold_developer', 'system_admin']), scrappingController.firstApprove);

// 2차 승인 (시스템 관리자)
router.post('/:id/second-approve', authenticate, authorize(['system_admin']), scrappingController.secondApprove);

// 폐기 요청 반려
router.post('/:id/reject', authenticate, authorize(['mold_developer', 'system_admin']), scrappingController.rejectRequest);

// 폐기 처리 완료
router.post('/:id/complete', authenticate, authorize(['mold_developer', 'system_admin']), scrappingController.completeScrapping);

module.exports = router;
