const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  listRepairRequests,
  getRepairRequestDetail,
  createRepairRequest,
  updateRepairRequestStatus,
  approveRepairRequest,
  rejectRepairRequest,
  assignRepairRequest,
  updateRepairProgress,
  updateBlameParty,
  getRepairSummary
} = require('../controllers/repairRequestController');
const { authenticate } = require('../middleware/auth');

// Multer 설정 (파일 업로드)
const upload = multer({ 
  dest: 'uploads/repairs/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * 수리요청 요약 (대시보드용)
 * GET /api/v1/repair-requests/summary
 * ⚠️ 주의: /repair-requests/:id 보다 먼저 정의해야 함
 */
router.get('/repair-requests/summary', getRepairSummary);

/**
 * 수리요청 목록 조회
 * GET /api/v1/repair-requests?plantId=3&status=requested
 */
router.get('/repair-requests', listRepairRequests);

/**
 * 수리요청 상세 조회
 * GET /api/v1/repair-requests/:id
 */
router.get('/repair-requests/:id', getRepairRequestDetail);

/**
 * 수리요청 생성
 * POST /api/v1/repair-requests
 */
router.post('/repair-requests', authenticate, upload.array('photos', 5), createRepairRequest);

/**
 * 수리요청 승인
 * POST /api/v1/repair-requests/:id/approve
 */
router.post('/repair-requests/:id/approve', authenticate, approveRepairRequest);

/**
 * 수리요청 반려
 * POST /api/v1/repair-requests/:id/reject
 */
router.post('/repair-requests/:id/reject', authenticate, rejectRepairRequest);

/**
 * 수리요청 배정
 * POST /api/v1/repair-requests/:id/assign
 */
router.post('/repair-requests/:id/assign', authenticate, assignRepairRequest);

/**
 * 수리 진행 상태 업데이트
 * PATCH /api/v1/repair-requests/:id/progress
 */
router.patch('/repair-requests/:id/progress', authenticate, updateRepairProgress);

/**
 * 귀책 당사자 업데이트
 * PATCH /api/v1/repair-requests/:id/blame
 */
router.patch('/repair-requests/:id/blame', authenticate, updateBlameParty);

/**
 * 수리요청 상태 변경
 * PATCH /api/v1/repair-requests/:id/status
 */
router.patch('/repair-requests/:id/status', authenticate, updateRepairRequestStatus);

module.exports = router;
