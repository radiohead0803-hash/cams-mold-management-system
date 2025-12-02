const express = require('express');
const router = express.Router();
const {
  listRepairRequests,
  getRepairRequestDetail,
  updateRepairRequestStatus,
  getRepairSummary
} = require('../controllers/repairRequestController');

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
 * 수리요청 상태 변경
 * PATCH /api/v1/repair-requests/:id/status
 */
router.patch('/repair-requests/:id/status', updateRepairRequestStatus);

module.exports = router;
