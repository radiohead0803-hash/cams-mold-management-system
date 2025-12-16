/**
 * 통계/리포트 API
 * - 점검 완료율
 * - 수리 TAT (Turn Around Time)
 * - NG Top (빈도별)
 * - 제작처 성과
 * - 이관 리드타임
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

/**
 * 점검 완료율 통계
 * GET /api/v1/statistics-report/inspection-rate
 */
router.get('/inspection-rate', async (req, res) => {
  try {
    const { period = 'weekly', companyId } = req.query;
    const days = period === 'monthly' ? 30 : 7;

    const [stats] = await sequelize.query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL ':days days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_stats AS (
        SELECT 
          DATE(dc.check_date) as check_date,
          COUNT(DISTINCT dc.mold_id) as checked_count,
          COUNT(DISTINCT CASE WHEN dc.status = 'completed' THEN dc.mold_id END) as completed_count
        FROM daily_checks dc
        WHERE dc.check_date >= CURRENT_DATE - INTERVAL ':days days'
          ${companyId ? 'AND dc.company_id = :companyId' : ''}
        GROUP BY DATE(dc.check_date)
      )
      SELECT 
        ds.date,
        COALESCE(dst.checked_count, 0) as checked,
        COALESCE(dst.completed_count, 0) as completed
      FROM date_series ds
      LEFT JOIN daily_stats dst ON ds.date = dst.check_date
      ORDER BY ds.date
    `, {
      replacements: { days, companyId: companyId || null },
      type: sequelize.QueryTypes.SELECT
    });

    // 전체 요약
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_checks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_checks,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as completion_rate
      FROM daily_checks
      WHERE check_date >= CURRENT_DATE - INTERVAL ':days days'
        ${companyId ? 'AND company_id = :companyId' : ''}
    `, {
      replacements: { days, companyId: companyId || null },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalChecks: parseInt(summary?.total_checks || 0),
          completedChecks: parseInt(summary?.completed_checks || 0),
          completionRate: parseFloat(summary?.completion_rate || 0)
        },
        trend: stats || []
      }
    });
  } catch (error) {
    console.error('[StatisticsReport] Inspection rate error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get inspection rate' } });
  }
});

/**
 * 수리 TAT 통계
 * GET /api/v1/statistics-report/repair-tat
 */
router.get('/repair-tat', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const days = period === 'weekly' ? 7 : 30;

    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status IN ('completed', 'confirmed') THEN 1 END) as completed_repairs,
        ROUND(AVG(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END)::numeric, 1) as avg_completion_days,
        ROUND(AVG(CASE WHEN confirmed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 86400 END)::numeric, 1) as avg_total_days,
        MIN(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END) as min_days,
        MAX(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END) as max_days
      FROM repair_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    // 우선순위별 TAT
    const [byPriority] = await sequelize.query(`
      SELECT 
        priority,
        COUNT(*) as count,
        ROUND(AVG(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END)::numeric, 1) as avg_days
      FROM repair_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY priority
      ORDER BY 
        CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalRepairs: parseInt(stats?.total_repairs || 0),
          completedRepairs: parseInt(stats?.completed_repairs || 0),
          avgCompletionDays: parseFloat(stats?.avg_completion_days || 0),
          avgTotalDays: parseFloat(stats?.avg_total_days || 0),
          minDays: parseFloat(stats?.min_days || 0),
          maxDays: parseFloat(stats?.max_days || 0)
        },
        byPriority: byPriority || []
      }
    });
  } catch (error) {
    console.error('[StatisticsReport] Repair TAT error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get repair TAT' } });
  }
});

/**
 * NG Top 통계 (빈도별)
 * GET /api/v1/statistics-report/ng-top
 */
router.get('/ng-top', async (req, res) => {
  try {
    const { period = 'monthly', limit = 10 } = req.query;
    const days = period === 'weekly' ? 7 : 30;

    // 금형별 NG 빈도
    const [byMold] = await sequelize.query(`
      SELECT 
        ms.id as mold_id,
        ms.mold_number,
        ms.part_name,
        COUNT(dci.id) as ng_count,
        COUNT(DISTINCT dc.id) as check_count
      FROM daily_check_items dci
      JOIN daily_checks dc ON dci.daily_check_id = dc.id
      JOIN mold_specifications ms ON dc.mold_id = ms.id
      WHERE dci.is_ng = true
        AND dc.check_date >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY ms.id, ms.mold_number, ms.part_name
      ORDER BY ng_count DESC
      LIMIT :limit
    `, {
      replacements: { days, limit },
      type: sequelize.QueryTypes.SELECT
    });

    // NG 유형별 통계
    const [byType] = await sequelize.query(`
      SELECT 
        COALESCE(dci.ng_description, '기타') as ng_type,
        COUNT(*) as count
      FROM daily_check_items dci
      JOIN daily_checks dc ON dci.daily_check_id = dc.id
      WHERE dci.is_ng = true
        AND dc.check_date >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY dci.ng_description
      ORDER BY count DESC
      LIMIT 10
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    // 전체 NG 요약
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT dc.id) as total_checks,
        COUNT(CASE WHEN dci.is_ng = true THEN 1 END) as total_ng,
        ROUND(COUNT(CASE WHEN dci.is_ng = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as ng_rate
      FROM daily_checks dc
      LEFT JOIN daily_check_items dci ON dc.id = dci.daily_check_id
      WHERE dc.check_date >= CURRENT_DATE - INTERVAL ':days days'
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalChecks: parseInt(summary?.total_checks || 0),
          totalNg: parseInt(summary?.total_ng || 0),
          ngRate: parseFloat(summary?.ng_rate || 0)
        },
        topMolds: byMold || [],
        byType: byType || []
      }
    });
  } catch (error) {
    console.error('[StatisticsReport] NG Top error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get NG top' } });
  }
});

/**
 * 제작처 성과 통계
 * GET /api/v1/statistics-report/maker-performance
 */
router.get('/maker-performance', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const days = period === 'weekly' ? 7 : 30;

    const [performance] = await sequelize.query(`
      SELECT 
        c.id as maker_id,
        c.name as maker_name,
        COUNT(DISTINCT rr.id) as total_repairs,
        COUNT(DISTINCT CASE WHEN rr.status IN ('completed', 'confirmed') THEN rr.id END) as completed_repairs,
        ROUND(AVG(CASE WHEN rr.completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (rr.completed_at - rr.created_at)) / 86400 END)::numeric, 1) as avg_repair_days,
        ROUND(AVG(rr.satisfaction_score)::numeric, 1) as avg_satisfaction,
        SUM(COALESCE(rr.repair_cost, 0)) as total_repair_cost,
        COUNT(DISTINCT ms.id) as managed_molds
      FROM companies c
      LEFT JOIN repair_requests rr ON rr.assigned_maker_id = c.id 
        AND rr.created_at >= CURRENT_DATE - INTERVAL ':days days'
      LEFT JOIN mold_specifications ms ON ms.maker_id = c.id
      WHERE c.company_type = 'maker' AND c.is_active = true
      GROUP BY c.id, c.name
      ORDER BY completed_repairs DESC, avg_repair_days ASC
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        period,
        makers: performance || []
      }
    });
  } catch (error) {
    console.error('[StatisticsReport] Maker performance error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get maker performance' } });
  }
});

/**
 * 이관 리드타임 통계
 * GET /api/v1/statistics-report/transfer-leadtime
 */
router.get('/transfer-leadtime', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const days = period === 'weekly' ? 7 : 30;

    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_transfers,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transfers,
        ROUND(AVG(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END)::numeric, 1) as avg_leadtime_days,
        MIN(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END) as min_days,
        MAX(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END) as max_days
      FROM transfers
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    // 이관 유형별 통계
    const [byType] = await sequelize.query(`
      SELECT 
        transfer_type,
        COUNT(*) as count,
        ROUND(AVG(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END)::numeric, 1) as avg_days
      FROM transfers
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY transfer_type
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalTransfers: parseInt(stats?.total_transfers || 0),
          completedTransfers: parseInt(stats?.completed_transfers || 0),
          avgLeadtimeDays: parseFloat(stats?.avg_leadtime_days || 0),
          minDays: parseFloat(stats?.min_days || 0),
          maxDays: parseFloat(stats?.max_days || 0)
        },
        byType: byType || []
      }
    });
  } catch (error) {
    console.error('[StatisticsReport] Transfer leadtime error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get transfer leadtime' } });
  }
});

/**
 * 종합 리포트 (주간/월간)
 * GET /api/v1/statistics-report/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const days = period === 'monthly' ? 30 : 7;

    // 점검 요약
    const [inspection] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as rate
      FROM daily_checks
      WHERE check_date >= CURRENT_DATE - INTERVAL ':days days'
    `, { replacements: { days }, type: sequelize.QueryTypes.SELECT });

    // 수리 요약
    const [repair] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('completed', 'confirmed') THEN 1 END) as completed,
        ROUND(AVG(CASE WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400 END)::numeric, 1) as avg_days
      FROM repair_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
    `, { replacements: { days }, type: sequelize.QueryTypes.SELECT });

    // NG 요약
    const [ng] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN dci.is_ng = true THEN 1 END) as total_ng,
        COUNT(DISTINCT CASE WHEN dci.is_ng = true THEN dc.mold_id END) as affected_molds
      FROM daily_checks dc
      LEFT JOIN daily_check_items dci ON dc.id = dci.daily_check_id
      WHERE dc.check_date >= CURRENT_DATE - INTERVAL ':days days'
    `, { replacements: { days }, type: sequelize.QueryTypes.SELECT });

    // 이관 요약
    const [transfer] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM transfers
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
    `, { replacements: { days }, type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        period,
        periodDays: days,
        inspection: {
          total: parseInt(inspection?.total || 0),
          completed: parseInt(inspection?.completed || 0),
          completionRate: parseFloat(inspection?.rate || 0)
        },
        repair: {
          total: parseInt(repair?.total || 0),
          completed: parseInt(repair?.completed || 0),
          avgDays: parseFloat(repair?.avg_days || 0)
        },
        ng: {
          totalNg: parseInt(ng?.total_ng || 0),
          affectedMolds: parseInt(ng?.affected_molds || 0)
        },
        transfer: {
          total: parseInt(transfer?.total || 0),
          completed: parseInt(transfer?.completed || 0)
        }
      }
    });
  } catch (error) {
    console.error('[StatisticsReport] Summary error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get summary' } });
  }
});

module.exports = router;
