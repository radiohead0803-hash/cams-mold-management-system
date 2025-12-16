/**
 * 알람 자동 연계 API
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const alertAutoService = require('../services/alertAutoService');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * 모든 자동 알람 체크 실행 (관리자 전용)
 * POST /api/v1/alerts/auto/run-all
 */
router.post('/run-all', authorize(['system_admin']), async (req, res) => {
  try {
    const results = await alertAutoService.runAllAlertChecks();
    
    res.json({
      success: true,
      message: '알람 체크 완료',
      data: results
    });
  } catch (error) {
    console.error('[AlertAuto] Error running all checks:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to run alert checks' }
    });
  }
});

/**
 * 점검 지연 알람 체크
 * POST /api/v1/alerts/auto/inspection-overdue
 */
router.post('/inspection-overdue', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const count = await alertAutoService.checkInspectionOverdueAlerts();
    
    res.json({
      success: true,
      message: `점검 지연 알람 ${count}건 생성`,
      data: { created: count }
    });
  } catch (error) {
    console.error('[AlertAuto] Error checking inspection overdue:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check inspection overdue' }
    });
  }
});

/**
 * 타수 경고/초과 알람 체크
 * POST /api/v1/alerts/auto/shots-warning
 */
router.post('/shots-warning', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const count = await alertAutoService.checkShotsAlerts();
    
    res.json({
      success: true,
      message: `타수 알람 ${count}건 생성`,
      data: { created: count }
    });
  } catch (error) {
    console.error('[AlertAuto] Error checking shots:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check shots warning' }
    });
  }
});

/**
 * 알람 유형 목록 조회
 * GET /api/v1/alerts/auto/types
 */
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: alertAutoService.ALERT_TYPES,
      severities: alertAutoService.SEVERITY
    }
  });
});

module.exports = router;
