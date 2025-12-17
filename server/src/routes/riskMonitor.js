/**
 * 운영 리스크 모니터링 라우터
 */
const express = require('express');
const router = express.Router();
const riskMonitorController = require('../controllers/riskMonitorController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 리스크 현황 요약 조회
 * GET /api/v1/risk-monitor/summary
 */
router.get('/summary', authenticate, riskMonitorController.getRiskSummary);

/**
 * 점검 미완료 목록 조회
 * GET /api/v1/risk-monitor/inspection-overdue
 */
router.get('/inspection-overdue', authenticate, riskMonitorController.getInspectionOverdue);

/**
 * GPS 미수신 금형 목록 조회
 * GET /api/v1/risk-monitor/gps-offline
 */
router.get('/gps-offline', authenticate, riskMonitorController.getGpsOffline);

/**
 * 타수 미입력 금형 목록 조회
 * GET /api/v1/risk-monitor/shot-missing
 */
router.get('/shot-missing', authenticate, riskMonitorController.getShotMissing);

/**
 * 승인 지연 목록 조회
 * GET /api/v1/risk-monitor/approval-delayed
 */
router.get('/approval-delayed', authenticate, riskMonitorController.getApprovalDelayed);

module.exports = router;
