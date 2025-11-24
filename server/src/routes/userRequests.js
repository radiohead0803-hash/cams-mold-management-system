const express = require('express');
const router = express.Router();
const userRequestController = require('../controllers/userRequestController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 사용자 계정 요청 라우트
 * 
 * GET    /api/v1/user-requests          - 요청 목록 조회
 * POST   /api/v1/user-requests          - 요청 생성
 * POST   /api/v1/user-requests/:id/approve - 요청 승인
 * POST   /api/v1/user-requests/:id/reject  - 요청 거부
 * DELETE /api/v1/user-requests/:id      - 요청 삭제
 */

// 요청 목록 조회 (시스템 관리자, 금형개발 담당)
router.get('/', 
  authenticate, 
  authorize(['system_admin', 'mold_developer']), 
  userRequestController.getUserRequests
);

// 요청 생성 (금형개발 담당)
router.post('/', 
  authenticate, 
  authorize(['mold_developer']), 
  userRequestController.createUserRequest
);

// 요청 승인 (시스템 관리자만)
router.post('/:id/approve', 
  authenticate, 
  authorize(['system_admin']), 
  userRequestController.approveUserRequest
);

// 요청 거부 (시스템 관리자만)
router.post('/:id/reject', 
  authenticate, 
  authorize(['system_admin']), 
  userRequestController.rejectUserRequest
);

// 요청 삭제 (본인 또는 시스템 관리자)
router.delete('/:id', 
  authenticate, 
  userRequestController.deleteUserRequest
);

module.exports = router;
