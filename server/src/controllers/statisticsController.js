const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 금형 통계 조회
 */
const getMoldStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // 전체 금형 수
    const [totalResult] = await sequelize.query(`
      SELECT COUNT(*) as total FROM molds WHERE deleted_at IS NULL
    `);

    // 상태별 금형 수
    const [statusResult] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM molds 
      WHERE deleted_at IS NULL
      GROUP BY status
    `);

    // 개발 단계별 금형 수
    const [stageResult] = await sequelize.query(`
      SELECT 
        COALESCE(ms.development_stage, '미지정') as stage,
        COUNT(*) as count
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE m.deleted_at IS NULL
      GROUP BY ms.development_stage
      ORDER BY count DESC
    `);

    // 차종별 금형 수
    const [carModelResult] = await sequelize.query(`
      SELECT 
        COALESCE(ms.car_model, '미지정') as name,
        COUNT(*) as count
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE m.deleted_at IS NULL
      GROUP BY ms.car_model
      ORDER BY count DESC
      LIMIT 10
    `);

    // 제작처별 금형 수
    const [makerResult] = await sequelize.query(`
      SELECT 
        COALESCE(c.name, '미지정') as name,
        COUNT(*) as count
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN companies c ON ms.target_maker_id = c.id
      WHERE m.deleted_at IS NULL
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10
    `);

    // 생산처별 금형 수
    const [plantResult] = await sequelize.query(`
      SELECT 
        COALESCE(c.name, '미지정') as name,
        COUNT(*) as count
      FROM molds m
      LEFT JOIN companies c ON m.current_plant_id = c.id
      WHERE m.deleted_at IS NULL
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 10
    `);

    // 월별 등록 금형 수
    const [monthlyResult] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as count
      FROM molds
      WHERE deleted_at IS NULL
        AND EXTRACT(YEAR FROM created_at) = :year
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, { replacements: { year: currentYear } });

    // 상태 매핑
    const statusMap = {};
    statusResult.forEach(s => { statusMap[s.status] = parseInt(s.count); });

    res.json({
      success: true,
      data: {
        total: parseInt(totalResult[0]?.total) || 0,
        active: statusMap['active'] || statusMap['양산'] || 0,
        development: statusMap['development'] || statusMap['개발'] || 0,
        manufacturing: statusMap['manufacturing'] || statusMap['제작'] || 0,
        scrapped: statusMap['scrapped'] || statusMap['폐기'] || 0,
        by_status: statusResult,
        by_stage: stageResult,
        by_car_model: carModelResult,
        by_maker: makerResult,
        by_plant: plantResult,
        by_month: monthlyResult
      }
    });

  } catch (error) {
    logger.error('Get mold statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * 점검 통계 조회
 */
const getInspectionStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // 일상점검 통계
    const [dailyResult] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM check_date) as month,
        COUNT(*) as count,
        SUM(CASE WHEN overall_status = 'OK' THEN 1 ELSE 0 END) as ok_count,
        SUM(CASE WHEN overall_status = 'NG' THEN 1 ELSE 0 END) as ng_count
      FROM daily_checks
      WHERE EXTRACT(YEAR FROM check_date) = :year
      GROUP BY EXTRACT(MONTH FROM check_date)
      ORDER BY month
    `, { replacements: { year: currentYear } });

    // 정기점검 통계
    const [periodicResult] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM inspection_date) as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM periodic_inspections
      WHERE EXTRACT(YEAR FROM inspection_date) = :year
      GROUP BY EXTRACT(MONTH FROM inspection_date)
      ORDER BY month
    `, { replacements: { year: currentYear } });

    // 점검 예정 금형 수
    const [dueResult] = await sequelize.query(`
      SELECT 
        COUNT(*) FILTER (WHERE next_inspection_date <= CURRENT_DATE + INTERVAL '7 days') as date_due,
        COUNT(*) FILTER (WHERE current_shots >= next_inspection_shots * 0.9) as shots_due
      FROM molds
      WHERE deleted_at IS NULL
        AND (next_inspection_date IS NOT NULL OR next_inspection_shots IS NOT NULL)
    `);

    res.json({
      success: true,
      data: {
        daily: {
          by_month: dailyResult,
          total: dailyResult.reduce((sum, m) => sum + parseInt(m.count), 0),
          ok_total: dailyResult.reduce((sum, m) => sum + parseInt(m.ok_count || 0), 0),
          ng_total: dailyResult.reduce((sum, m) => sum + parseInt(m.ng_count || 0), 0)
        },
        periodic: {
          by_month: periodicResult,
          total: periodicResult.reduce((sum, m) => sum + parseInt(m.count), 0)
        },
        due: {
          date_due: parseInt(dueResult[0]?.date_due) || 0,
          shots_due: parseInt(dueResult[0]?.shots_due) || 0
        }
      }
    });

  } catch (error) {
    logger.error('Get inspection statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * 수리 통계 조회
 */
const getRepairStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // 상태별 수리 현황
    const [statusResult] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM repairs
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY status
    `, { replacements: { year: currentYear } });

    // 월별 수리 현황
    const [monthlyResult] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as count,
        SUM(COALESCE(repair_cost, 0)) as total_cost
      FROM repairs
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, { replacements: { year: currentYear } });

    // 귀책별 현황
    const [liabilityResult] = await sequelize.query(`
      SELECT 
        COALESCE(liability_party, '미결정') as party,
        COUNT(*) as count
      FROM repairs
      WHERE EXTRACT(YEAR FROM created_at) = :year
        AND liability_party IS NOT NULL
      GROUP BY liability_party
    `, { replacements: { year: currentYear } });

    res.json({
      success: true,
      data: {
        by_status: statusResult,
        by_month: monthlyResult,
        by_liability: liabilityResult,
        total: statusResult.reduce((sum, s) => sum + parseInt(s.count), 0),
        total_cost: monthlyResult.reduce((sum, m) => sum + parseInt(m.total_cost || 0), 0)
      }
    });

  } catch (error) {
    logger.error('Get repair statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * 체크리스트 통계 조회
 */
const getChecklistStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // 제작전 체크리스트 상태별 현황
    const [statusResult] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM pre_production_checklists
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY status
    `, { replacements: { year: currentYear } });

    // 월별 현황
    const [monthlyResult] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM pre_production_checklists
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, { replacements: { year: currentYear } });

    // 상태 매핑
    const statusMap = {};
    statusResult.forEach(s => { statusMap[s.status] = parseInt(s.count); });
    const total = Object.values(statusMap).reduce((sum, v) => sum + v, 0);
    const approved = statusMap['approved'] || 0;

    res.json({
      success: true,
      data: {
        total,
        draft: statusMap['draft'] || 0,
        submitted: statusMap['submitted'] || 0,
        approved,
        rejected: statusMap['rejected'] || 0,
        completion_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
        by_status: statusResult,
        by_month: monthlyResult
      }
    });

  } catch (error) {
    logger.error('Get checklist statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * 전체 대시보드 통계 조회
 */
const getDashboardStatistics = async (req, res) => {
  try {
    // 금형 현황
    const [moldResult] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('active', '양산')) as active,
        COUNT(*) FILTER (WHERE status IN ('development', '개발')) as development
      FROM molds
      WHERE deleted_at IS NULL
    `);

    // 오늘 점검
    const [checkResult] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM daily_checks
      WHERE check_date = CURRENT_DATE
    `);

    // 진행 중 수리
    const [repairResult] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM repairs
      WHERE status IN ('requested', 'in_progress', 'pending')
    `);

    // 읽지 않은 알림
    const [alertResult] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM alerts
      WHERE is_read = false
    `);

    res.json({
      success: true,
      data: {
        molds: {
          total: parseInt(moldResult[0]?.total) || 0,
          active: parseInt(moldResult[0]?.active) || 0,
          development: parseInt(moldResult[0]?.development) || 0
        },
        today_checks: parseInt(checkResult[0]?.count) || 0,
        open_repairs: parseInt(repairResult[0]?.count) || 0,
        unread_alerts: parseInt(alertResult[0]?.count) || 0
      }
    });

  } catch (error) {
    logger.error('Get dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

module.exports = {
  getMoldStatistics,
  getInspectionStatistics,
  getRepairStatistics,
  getChecklistStatistics,
  getDashboardStatistics
};
