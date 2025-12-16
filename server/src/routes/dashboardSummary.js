/**
 * 대시보드 요약 API
 * 역할별로 KPI + Action List + Trends를 1~2개 API로 제공
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');
const { Op } = require('sequelize');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * 생산처 대시보드 요약
 * GET /api/v1/dashboard-summary/plant
 */
router.get('/plant', authorize(['plant']), async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company_id;
    const today = new Date().toISOString().split('T')[0];

    // 1. KPI Summary
    const [kpiResult] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM daily_checks WHERE DATE(check_date) = :today AND company_id = :companyId) as today_daily_checks,
        (SELECT COUNT(*) FROM daily_checks WHERE DATE(check_date) = :today AND company_id = :companyId AND status = 'completed') as completed_daily_checks,
        (SELECT COUNT(*) FROM periodic_inspections WHERE company_id = :companyId AND status = 'pending') as pending_periodic,
        (SELECT COUNT(*) FROM repair_requests WHERE requester_company_id = :companyId AND status IN ('pending', 'in_progress')) as active_repairs,
        (SELECT COUNT(*) FROM alerts WHERE company_id = :companyId AND is_read = false) as unread_alerts,
        (SELECT COUNT(*) FROM mold_specifications ms 
         JOIN plant_molds pm ON ms.id = pm.mold_spec_id 
         WHERE pm.plant_id = :companyId AND ms.current_shots >= ms.target_shots * 0.9) as shots_warning
    `, {
      replacements: { today, companyId },
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Action List (오늘 해야 할 일)
    const [pendingInspections] = await sequelize.query(`
      SELECT ms.id, ms.mold_number, ms.part_name, 'daily' as type, '일상점검' as type_label
      FROM mold_specifications ms
      JOIN plant_molds pm ON ms.id = pm.mold_spec_id
      WHERE pm.plant_id = :companyId
        AND ms.id NOT IN (
          SELECT mold_id FROM daily_checks 
          WHERE DATE(check_date) = :today AND status = 'completed'
        )
      LIMIT 10
    `, {
      replacements: { today, companyId },
      type: sequelize.QueryTypes.SELECT
    });

    const [urgentAlerts] = await sequelize.query(`
      SELECT id, title, message, alert_type, severity, created_at
      FROM alerts
      WHERE company_id = :companyId AND is_read = false
      ORDER BY 
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        created_at DESC
      LIMIT 5
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    // 3. Trends (최근 7일)
    const [weeklyTrends] = await sequelize.query(`
      SELECT 
        DATE(check_date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM daily_checks
      WHERE company_id = :companyId
        AND check_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(check_date)
      ORDER BY date
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        kpi: {
          today_daily_checks: parseInt(kpiResult?.today_daily_checks || 0),
          completed_daily_checks: parseInt(kpiResult?.completed_daily_checks || 0),
          pending_periodic: parseInt(kpiResult?.pending_periodic || 0),
          active_repairs: parseInt(kpiResult?.active_repairs || 0),
          unread_alerts: parseInt(kpiResult?.unread_alerts || 0),
          shots_warning: parseInt(kpiResult?.shots_warning || 0)
        },
        actions: {
          pending_inspections: pendingInspections || [],
          urgent_alerts: urgentAlerts || []
        },
        trends: {
          daily_inspections: weeklyTrends || []
        }
      }
    });
  } catch (error) {
    console.error('Plant dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get plant dashboard summary' }
    });
  }
});

/**
 * 제작처 대시보드 요약
 * GET /api/v1/dashboard-summary/maker
 */
router.get('/maker', authorize(['maker']), async (req, res) => {
  try {
    const companyId = req.user.company_id;

    // 1. KPI Summary
    const [kpiResult] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM mold_specifications WHERE maker_id = :companyId AND status = 'in_production') as in_production,
        (SELECT COUNT(*) FROM repair_requests WHERE assigned_maker_id = :companyId AND status = 'pending') as pending_repairs,
        (SELECT COUNT(*) FROM repair_requests WHERE assigned_maker_id = :companyId AND status = 'in_progress') as in_progress_repairs,
        (SELECT COUNT(*) FROM repair_requests WHERE assigned_maker_id = :companyId AND status = 'completed' AND confirmed_at IS NULL) as awaiting_confirmation,
        (SELECT COUNT(*) FROM alerts WHERE company_id = :companyId AND is_read = false) as unread_alerts
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Action List
    const [pendingRepairs] = await sequelize.query(`
      SELECT rr.id, rr.title, rr.description, rr.priority, rr.status, rr.created_at,
             ms.mold_number, ms.part_name
      FROM repair_requests rr
      JOIN mold_specifications ms ON rr.mold_id = ms.id
      WHERE rr.assigned_maker_id = :companyId
        AND rr.status IN ('pending', 'in_progress')
      ORDER BY 
        CASE rr.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
        rr.created_at
      LIMIT 10
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    // 3. Trends (최근 30일 수리 현황)
    const [repairTrends] = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM repair_requests
      WHERE assigned_maker_id = :companyId
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, {
      replacements: { companyId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        kpi: {
          in_production: parseInt(kpiResult?.in_production || 0),
          pending_repairs: parseInt(kpiResult?.pending_repairs || 0),
          in_progress_repairs: parseInt(kpiResult?.in_progress_repairs || 0),
          awaiting_confirmation: parseInt(kpiResult?.awaiting_confirmation || 0),
          unread_alerts: parseInt(kpiResult?.unread_alerts || 0)
        },
        actions: {
          pending_repairs: pendingRepairs || []
        },
        trends: {
          repairs: repairTrends || []
        }
      }
    });
  } catch (error) {
    console.error('Maker dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get maker dashboard summary' }
    });
  }
});

/**
 * 금형개발 담당 대시보드 요약
 * GET /api/v1/dashboard-summary/developer
 */
router.get('/developer', authorize(['mold_developer', 'system_admin']), async (req, res) => {
  try {
    // 1. KPI Summary
    const [kpiResult] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM mold_specifications WHERE status = 'active') as total_molds,
        (SELECT COUNT(*) FROM periodic_inspections WHERE status = 'pending_approval') as pending_approvals,
        (SELECT COUNT(*) FROM repair_requests WHERE status = 'liability_discussion') as liability_discussions,
        (SELECT COUNT(*) FROM transfers WHERE status = 'pending') as pending_transfers,
        (SELECT COUNT(*) FROM scrapping_requests WHERE status = 'pending_first_approval' OR status = 'pending_final_approval') as pending_scrapping,
        (SELECT COUNT(*) FROM mold_specifications WHERE current_shots >= target_shots * 0.9) as shots_warning,
        (SELECT COUNT(*) FROM alerts WHERE is_read = false) as total_unread_alerts
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Action List (승인 대기)
    const [pendingApprovals] = await sequelize.query(`
      (SELECT 'periodic_inspection' as type, '정기점검 승인' as type_label, 
              pi.id, ms.mold_number, ms.part_name, pi.created_at
       FROM periodic_inspections pi
       JOIN mold_specifications ms ON pi.mold_id = ms.id
       WHERE pi.status = 'pending_approval'
       ORDER BY pi.created_at
       LIMIT 5)
      UNION ALL
      (SELECT 'transfer' as type, '이관 승인' as type_label,
              t.id, ms.mold_number, ms.part_name, t.created_at
       FROM transfers t
       JOIN mold_specifications ms ON t.mold_id = ms.id
       WHERE t.status = 'pending'
       ORDER BY t.created_at
       LIMIT 5)
      UNION ALL
      (SELECT 'scrapping' as type, '폐기 승인' as type_label,
              sr.id, ms.mold_number, ms.part_name, sr.created_at
       FROM scrapping_requests sr
       JOIN mold_specifications ms ON sr.mold_id = ms.id
       WHERE sr.status IN ('pending_first_approval', 'pending_final_approval')
       ORDER BY sr.created_at
       LIMIT 5)
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 3. 리스크 금형 리스트
    const [riskMolds] = await sequelize.query(`
      SELECT ms.id, ms.mold_number, ms.part_name, ms.current_shots, ms.target_shots,
             ROUND(ms.current_shots::numeric / NULLIF(ms.target_shots, 0) * 100, 1) as shots_percentage,
             CASE 
               WHEN ms.current_shots >= ms.target_shots THEN 'critical'
               WHEN ms.current_shots >= ms.target_shots * 0.9 THEN 'warning'
               ELSE 'normal'
             END as risk_level
      FROM mold_specifications ms
      WHERE ms.status = 'active'
        AND ms.current_shots >= ms.target_shots * 0.8
      ORDER BY shots_percentage DESC
      LIMIT 10
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 4. Trends (최근 30일)
    const [inspectionTrends] = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM periodic_inspections
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        kpi: {
          total_molds: parseInt(kpiResult?.total_molds || 0),
          pending_approvals: parseInt(kpiResult?.pending_approvals || 0),
          liability_discussions: parseInt(kpiResult?.liability_discussions || 0),
          pending_transfers: parseInt(kpiResult?.pending_transfers || 0),
          pending_scrapping: parseInt(kpiResult?.pending_scrapping || 0),
          shots_warning: parseInt(kpiResult?.shots_warning || 0),
          total_unread_alerts: parseInt(kpiResult?.total_unread_alerts || 0)
        },
        actions: {
          pending_approvals: pendingApprovals || [],
          risk_molds: riskMolds || []
        },
        trends: {
          inspections: inspectionTrends || []
        }
      }
    });
  } catch (error) {
    console.error('Developer dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get developer dashboard summary' }
    });
  }
});

/**
 * 시스템 관리자 대시보드 요약
 * GET /api/v1/dashboard-summary/admin
 */
router.get('/admin', authorize(['system_admin']), async (req, res) => {
  try {
    // 1. KPI Summary (전체 시스템)
    const [kpiResult] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM mold_specifications) as total_molds,
        (SELECT COUNT(*) FROM mold_specifications WHERE status = 'active') as active_molds,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM companies WHERE is_active = true) as active_companies,
        (SELECT COUNT(*) FROM daily_checks WHERE DATE(check_date) = CURRENT_DATE) as today_daily_checks,
        (SELECT COUNT(*) FROM repair_requests WHERE status IN ('pending', 'in_progress')) as active_repairs,
        (SELECT COUNT(*) FROM alerts WHERE is_read = false) as total_unread_alerts,
        (SELECT COUNT(*) FROM transfers WHERE status = 'pending') as pending_transfers
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 2. 회사별 현황
    const [companyStats] = await sequelize.query(`
      SELECT 
        c.id, c.name, c.company_type,
        (SELECT COUNT(*) FROM users WHERE company_id = c.id AND is_active = true) as user_count,
        (SELECT COUNT(*) FROM mold_specifications WHERE maker_id = c.id OR id IN (SELECT mold_spec_id FROM plant_molds WHERE plant_id = c.id)) as mold_count
      FROM companies c
      WHERE c.is_active = true
      ORDER BY c.company_type, c.name
      LIMIT 20
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 3. 시스템 활동 로그 (최근)
    const [recentActivity] = await sequelize.query(`
      (SELECT 'daily_check' as type, '일상점검' as type_label, dc.id, dc.created_at, 
              ms.mold_number, u.name as user_name
       FROM daily_checks dc
       JOIN mold_specifications ms ON dc.mold_id = ms.id
       LEFT JOIN users u ON dc.inspector_id = u.id
       ORDER BY dc.created_at DESC
       LIMIT 5)
      UNION ALL
      (SELECT 'repair_request' as type, '수리요청' as type_label, rr.id, rr.created_at,
              ms.mold_number, u.name as user_name
       FROM repair_requests rr
       JOIN mold_specifications ms ON rr.mold_id = ms.id
       LEFT JOIN users u ON rr.requester_id = u.id
       ORDER BY rr.created_at DESC
       LIMIT 5)
      ORDER BY created_at DESC
      LIMIT 10
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        kpi: {
          total_molds: parseInt(kpiResult?.total_molds || 0),
          active_molds: parseInt(kpiResult?.active_molds || 0),
          active_users: parseInt(kpiResult?.active_users || 0),
          active_companies: parseInt(kpiResult?.active_companies || 0),
          today_daily_checks: parseInt(kpiResult?.today_daily_checks || 0),
          active_repairs: parseInt(kpiResult?.active_repairs || 0),
          total_unread_alerts: parseInt(kpiResult?.total_unread_alerts || 0),
          pending_transfers: parseInt(kpiResult?.pending_transfers || 0)
        },
        company_stats: companyStats || [],
        recent_activity: recentActivity || []
      }
    });
  } catch (error) {
    console.error('Admin dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get admin dashboard summary' }
    });
  }
});

module.exports = router;
