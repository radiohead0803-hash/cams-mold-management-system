const express = require('express');
const router = express.Router();
const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * GET /api/v1/hq/dashboard/summary
 * 관리자 대시보드 요약 정보 (Raw SQL로 안전하게 처리)
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    // 안전한 카운트 함수
    const safeCount = async (tableName, whereClause = '') => {
      try {
        const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
        const [result] = await sequelize.query(query);
        return parseInt(result[0]?.count || 0);
      } catch (e) {
        logger.warn(`Table ${tableName} query failed:`, e.message);
        return 0;
      }
    };

    // 1) 전체 금형 수 (mold_specifications 테이블 사용)
    const totalMolds = await safeCount('mold_specifications');

    // 2) 양산 중 금형
    const activeMolds = await safeCount('mold_specifications', "WHERE status IN ('active', 'in_production', 'production')");

    // 3) NG 상태 금형
    const ngMolds = await safeCount('mold_specifications', "WHERE status IN ('ng', 'NG', 'defective')");

    // 4) 진행 중 수리요청
    const openRepairs = await safeCount('repair_requests', "WHERE status NOT IN ('completed', 'rejected')");

    // 5) 오늘 QR 스캔 건수
    const todayScans = await safeCount('qr_sessions', "WHERE created_at >= CURRENT_DATE");

    // 6) 오늘 Critical/Urgent 알림 수
    const criticalAlerts = await safeCount('notifications', "WHERE priority IN ('urgent', 'high', 'critical') AND created_at >= CURRENT_DATE");

    // 7) 타수 초과 금형
    const overShotCount = await safeCount('alerts', "WHERE alert_type = 'over_shot' AND is_resolved = false");

    // 8) 정기검사 필요 금형
    const inspectionDueCount = await safeCount('inspections', "WHERE inspection_type = 'periodic' AND status = 'scheduled' AND inspection_date <= CURRENT_DATE");

    // 9) GPS 위치 등록/이탈
    const gpsRegistered = totalMolds;
    const gpsAbnormal = await safeCount('alerts', "WHERE alert_type = 'gps_drift' AND is_resolved = false");

    // 10) 알림 레벨별 집계
    const majorAlerts = await safeCount('notifications', "WHERE priority = 'high' AND created_at >= CURRENT_DATE");
    const minorAlerts = await safeCount('notifications', "WHERE priority IN ('normal', 'low') AND created_at >= CURRENT_DATE");

    // 11) 시스템 상태
    const totalUsers = await safeCount('users', "WHERE is_active = true");

    const todayQRScans = todayScans; // 이미 계산됨

    return res.json({
      success: true,
      data: {
        totalMolds,
        activeMolds,
        ngMolds,
        openRepairs,
        todayScans,
        criticalAlerts,
        overShotCount,        // 타수 초과
        inspectionDueCount,   // 정기검사 필요
        gpsRegistered,        // GPS 등록
        gpsAbnormal,          // GPS 이탈
        majorAlerts,          // Major 알림
        minorAlerts,          // Minor 알림
        totalUsers,           // 활성 사용자
        todayQRScans          // 오늘 QR 스캔
      }
    });
  } catch (error) {
    console.error('HQ dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '대시보드 요약 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/dashboard/alerts
 * 최근 알림 리스트 (최대 10개)
 */
router.get('/dashboard/alerts', async (req, res) => {
  try {
    const [alerts] = await sequelize.query(`
      SELECT id, notification_type, title, message, priority, related_type, related_id, action_url, is_read, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: { alerts: alerts || [] }
    });
  } catch (error) {
    logger.error('HQ dashboard alerts error:', error);
    return res.json({
      success: true,
      data: { alerts: [] }
    });
  }
});

/**
 * GET /api/v1/hq/dashboard/recent-activities
 * 최근 활동 내역
 */
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    // 최근 QR 스캔 5건
    let recentScans = [];
    try {
      const [scans] = await sequelize.query(`
        SELECT qs.id, qs.created_at, u.id as user_id, u.name as user_name, u.username
        FROM qr_sessions qs
        LEFT JOIN users u ON qs.user_id = u.id
        ORDER BY qs.created_at DESC
        LIMIT 5
      `);
      recentScans = scans || [];
    } catch (e) {
      logger.warn('QR sessions query failed:', e.message);
    }

    // 최근 수리요청 5건
    let recentRepairs = [];
    try {
      const [repairs] = await sequelize.query(`
        SELECT id, request_number, issue_type, severity, status, created_at
        FROM repair_requests
        ORDER BY created_at DESC
        LIMIT 5
      `);
      recentRepairs = repairs || [];
    } catch (e) {
      logger.warn('Repair requests query failed:', e.message);
    }

    return res.json({
      success: true,
      data: { recentScans, recentRepairs }
    });
  } catch (error) {
    logger.error('HQ dashboard recent activities error:', error);
    return res.json({
      success: true,
      data: { recentScans: [], recentRepairs: [] }
    });
  }
});

/**
 * GET /api/v1/hq/repair-requests
 * HQ 수리요청 목록 조회
 */
router.get('/repair-requests', async (req, res) => {
  try {
    const { status, urgency } = req.query;
    let whereClause = 'WHERE 1=1';
    if (status) whereClause += ` AND rr.status = '${status}'`;
    if (urgency) whereClause += ` AND rr.severity = '${urgency}'`;

    const [repairs] = await sequelize.query(`
      SELECT rr.*, u.name as requester_name, u.username as requester_username
      FROM repair_requests rr
      LEFT JOIN users u ON rr.requester_id = u.id
      ${whereClause}
      ORDER BY rr.created_at DESC
      LIMIT 100
    `);

    return res.json({
      success: true,
      data: { repairs: repairs || [] }
    });
  } catch (error) {
    logger.error('HQ repair requests error:', error);
    return res.json({
      success: true,
      data: { repairs: [] }
    });
  }
});

/**
 * GET /api/v1/hq/repair-requests/:id
 * 수리요청 상세 조회
 */
router.get('/repair-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [repairs] = await sequelize.query(`
      SELECT rr.*, u.name as requester_name, u.username as requester_username
      FROM repair_requests rr
      LEFT JOIN users u ON rr.requester_id = u.id
      WHERE rr.id = :id
    `, { replacements: { id } });

    if (!repairs || repairs.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '수리요청을 찾을 수 없습니다.' }
      });
    }

    return res.json({
      success: true,
      data: { repair: repairs[0] }
    });
  } catch (error) {
    logger.error('HQ repair request detail error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '수리요청 상세 조회 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * GET /api/v1/hq/molds/inspection-due
 * 정기검사 필요 금형 목록
 */
router.get('/molds/inspection-due', async (req, res) => {
  try {
    const [inspections] = await sequelize.query(`
      SELECT i.*, ms.mold_code, ms.part_name as mold_name
      FROM inspections i
      LEFT JOIN mold_specifications ms ON i.mold_id = ms.id
      WHERE i.inspection_type = 'periodic' AND i.status = 'scheduled' AND i.inspection_date <= CURRENT_DATE
      ORDER BY i.inspection_date ASC
      LIMIT 100
    `);

    return res.json({
      success: true,
      data: { inspections: inspections || [] }
    });
  } catch (error) {
    logger.error('Inspection due list error:', error);
    return res.json({
      success: true,
      data: { inspections: [] }
    });
  }
});

/**
 * GET /api/v1/hq/molds/over-shot
 * 타수 초과 금형 목록
 */
router.get('/molds/over-shot', async (req, res) => {
  try {
    const [alerts] = await sequelize.query(`
      SELECT a.*, ms.mold_code, ms.part_name as mold_name
      FROM alerts a
      LEFT JOIN mold_specifications ms ON a.mold_id = ms.id
      WHERE a.alert_type = 'over_shot' AND a.is_resolved = false
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    return res.json({
      success: true,
      data: { alerts: alerts || [] }
    });
  } catch (error) {
    logger.error('Over shot list error:', error);
    return res.json({
      success: true,
      data: { alerts: [] }
    });
  }
});

module.exports = router;
