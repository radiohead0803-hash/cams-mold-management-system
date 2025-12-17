/**
 * 통합 승인함 라우터
 */
const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticate } = require('../middleware/auth');

/**
 * 승인 대기 목록 조회
 * GET /api/v1/approvals
 */
router.get('/', authenticate, approvalController.getApprovals);

/**
 * 승인 대기 개수 조회 (유형별)
 * GET /api/v1/approvals/counts
 */
router.get('/counts', authenticate, approvalController.getApprovalCounts);

/**
 * 승인 상세 조회
 * GET /api/v1/approvals/:id
 */
router.get('/:id', authenticate, approvalController.getApprovalById);

/**
 * 승인 요청 생성
 * POST /api/v1/approvals
 */
router.post('/', authenticate, approvalController.createApproval);

/**
 * 승인 처리
 * PATCH /api/v1/approvals/:id/approve
 */
router.patch('/:id/approve', authenticate, approvalController.approveRequest);

/**
 * 반려 처리
 * PATCH /api/v1/approvals/:id/reject
 */
router.patch('/:id/reject', authenticate, approvalController.rejectRequest);

/**
 * 승인 요청 취소
 * DELETE /api/v1/approvals/:id
 */
router.delete('/:id', authenticate, approvalController.cancelApproval);

module.exports = router;
