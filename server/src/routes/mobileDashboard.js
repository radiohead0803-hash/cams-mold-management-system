/**
 * Mobile Dashboard API
 * PC 대시보드와 동일한 수준의 데이터를 역할별로 제공
 *
 * GET /api/v1/mobile/dashboard/:role   - 역할별 종합 대시보드
 * GET /api/v1/mobile/dashboard/molds   - 금형 목록 (페이지네이션 + 검색)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// ─── helpers ────────────────────────────────────────────────────────────────

/** 안전하게 단일 행 SELECT 실행. 실패 시 fallback 반환 */
async function safeQueryOne(sql, opts = {}) {
  try {
    const [rows] = await sequelize.query(sql, opts);
    return rows[0] || {};
  } catch (err) {
    console.error('[mobileDashboard] query error:', err.message);
    return {};
  }
}

/** 안전하게 여러 행 SELECT 실행. 실패 시 빈 배열 반환 */
async function safeQueryAll(sql, opts = {}) {
  try {
    const [rows] = await sequelize.query(sql, opts);
    return rows || [];
  } catch (err) {
    console.error('[mobileDashboard] query error:', err.message);
    return [];
  }
}

/** 결과의 count 값을 정수로 변환 */
function int(val) {
  return parseInt(val, 10) || 0;
}

// ─── GET /dashboard/molds (must be before :role to avoid param capture) ─────

router.get('/dashboard/molds', async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;
    const userType = req.user?.user_type;

    const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();

    // 동적 WHERE 조건 구성
    const conditions = [];
    const binds = [];
    let bindIdx = 1;

    // 역할별 범위 제한
    if (userType === 'maker') {
      conditions.push(`ms.maker_id = $${bindIdx++}`);
      binds.push(companyId);
    } else if (userType === 'plant') {
      conditions.push(`ms.id IN (SELECT mold_spec_id FROM plant_molds WHERE plant_id = $${bindIdx++})`);
      binds.push(companyId);
    }
    // system_admin / mold_developer -> 전체

    if (status) {
      conditions.push(`ms.status = $${bindIdx++}`);
      binds.push(status);
    }

    if (search) {
      conditions.push(`(ms.mold_number ILIKE $${bindIdx} OR ms.part_name ILIKE $${bindIdx} OR ms.car_model ILIKE $${bindIdx})`);
      binds.push(`%${search}%`);
      bindIdx++;
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // 카운트
    const countRow = await safeQueryOne(
      `SELECT COUNT(*) AS total FROM mold_specifications ms ${whereClause}`,
      { bind: binds }
    );
    const total = int(countRow.total);

    // 데이터
    const molds = await safeQueryAll(`
      SELECT ms.id, ms.mold_number, ms.part_name, ms.car_model,
             ms.status, ms.current_shots, ms.target_shots,
             ms.progress, ms.target_delivery_date,
             ms.updated_at,
             c.name AS maker_name
      FROM mold_specifications ms
      LEFT JOIN companies c ON ms.maker_id = c.id
      ${whereClause}
      ORDER BY ms.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, { bind: binds });

    return res.json({
      success: true,
      data: {
        molds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Mobile Dashboard Molds] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '금형 목록 조회 중 오류가 발생했습니다.' }
    });
  }
});

// ─── GET /dashboard/:role ───────────────────────────────────────────────────

router.get('/dashboard/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user?.id;
    const companyId = req.user?.company_id;

    let data;

    switch (role) {
      case 'system_admin':
      case 'mold_developer':
      case 'developer':
        data = await getAdminDeveloperDashboard();
        break;

      case 'maker':
        data = await getMakerDashboard(companyId);
        break;

      case 'plant':
      case 'production':
        data = await getPlantDashboard(companyId);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 역할입니다.'
        });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[Mobile Dashboard] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '대시보드 데이터 조회 중 오류가 발생했습니다.' }
    });
  }
});

// ─── system_admin / mold_developer ─────────────────────────────────────────

async function getAdminDeveloperDashboard() {
  // --- KPI (단일 쿼리) ---
  const kpiRow = await safeQueryOne(`
    SELECT
      (SELECT COUNT(*) FROM mold_specifications)                                                   AS total_molds,
      (SELECT COUNT(*) FROM mold_specifications WHERE status = 'active')                           AS active_molds,
      (SELECT COUNT(*) FROM repair_requests WHERE status NOT IN ('completed','cancelled'))         AS open_repairs,
      (SELECT COUNT(*) FROM qr_sessions WHERE created_at >= CURRENT_DATE)                          AS today_scans,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE current_shots >= target_shots AND target_shots > 0)                                 AS over_shot_count,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE next_inspection_date <= CURRENT_DATE + INTERVAL '7 days'
           AND next_inspection_date IS NOT NULL)                                                    AS inspection_due_count,
      (SELECT COUNT(*) FROM mold_specifications WHERE status = 'ng')                               AS ng_molds,
      (SELECT COUNT(*) FROM users WHERE is_active = true)                                          AS total_users
  `);

  const kpi = {
    totalMolds:         int(kpiRow.total_molds),
    activeMolds:        int(kpiRow.active_molds),
    openRepairs:        int(kpiRow.open_repairs),
    todayScans:         int(kpiRow.today_scans),
    overShotCount:      int(kpiRow.over_shot_count),
    inspectionDueCount: int(kpiRow.inspection_due_count),
    ngMolds:            int(kpiRow.ng_molds),
    totalUsers:         int(kpiRow.total_users)
  };

  // --- Management Status: repairs ---
  const repairRows = await safeQueryAll(`
    SELECT status, COUNT(*)::int AS cnt
    FROM repair_requests
    GROUP BY status
  `);
  const repairMap = {};
  for (const r of repairRows) repairMap[r.status] = int(r.cnt);

  const repairs = {
    total:      Object.values(repairMap).reduce((a, b) => a + b, 0),
    pending:    int(repairMap.pending),
    inProgress: int(repairMap.in_progress),
    completed:  int(repairMap.completed)
  };

  // --- Management Status: transfers ---
  const transferRows = await safeQueryAll(`
    SELECT status, COUNT(*)::int AS cnt
    FROM transfers
    GROUP BY status
  `);
  const transferMap = {};
  for (const r of transferRows) transferMap[r.status] = int(r.cnt);

  const transfers = {
    total:      Object.values(transferMap).reduce((a, b) => a + b, 0),
    pending:    int(transferMap.pending),
    inProgress: int(transferMap.in_progress),
    completed:  int(transferMap.completed)
  };

  // --- Management Status: scrapping ---
  const scrappingRows = await safeQueryAll(`
    SELECT status, COUNT(*)::int AS cnt
    FROM scrapping_requests
    GROUP BY status
  `);
  const scrappingMap = {};
  for (const r of scrappingRows) scrappingMap[r.status] = int(r.cnt);

  const scrapping = {
    total:     Object.values(scrappingMap).reduce((a, b) => a + b, 0),
    pending:   int(scrappingMap.pending_first_approval) + int(scrappingMap.pending_final_approval),
    approved:  int(scrappingMap.approved),
    completed: int(scrappingMap.completed)
  };

  // --- Recent activities ---
  const recentActivities = await safeQueryAll(`
    SELECT qs.id, qs.session_token, qs.scan_type, qs.created_at,
           u.name AS user_name,
           ms.mold_number, ms.part_name
    FROM qr_sessions qs
    LEFT JOIN users u ON qs.user_id = u.id
    LEFT JOIN mold_specifications ms ON qs.mold_id = ms.id
    ORDER BY qs.created_at DESC
    LIMIT 10
  `);

  // --- Approvals ---
  const approvalRow = await safeQueryOne(`
    SELECT
      (SELECT COUNT(*) FROM mold_specifications
         WHERE status IN ('design_review','design_approval'))                                     AS design_approval,
      (SELECT COUNT(*) FROM periodic_inspections
         WHERE status = 'pending_approval')                                                       AS trial_approval,
      (SELECT COUNT(*) FROM repair_requests
         WHERE status = 'liability_discussion')                                                   AS repair_liability
  `);

  const approvals = {
    designApproval:  int(approvalRow.design_approval),
    trialApproval:   int(approvalRow.trial_approval),
    repairLiability: int(approvalRow.repair_liability)
  };

  // --- Companies ---
  const companyRow = await safeQueryOne(`
    SELECT
      (SELECT COUNT(*) FROM companies WHERE company_type = 'maker')                               AS total_makers,
      (SELECT COUNT(*) FROM companies WHERE company_type = 'plant')                               AS total_plants,
      (SELECT COUNT(*) FROM companies WHERE company_type = 'maker' AND is_active = true)          AS active_makers
  `);

  const companies = {
    totalMakers:  int(companyRow.total_makers),
    totalPlants:  int(companyRow.total_plants),
    activeMakers: int(companyRow.active_makers)
  };

  return {
    kpi,
    managementStatus: { repairs, transfers, scrapping },
    recentActivities,
    approvals,
    companies
  };
}

// ─── maker ──────────────────────────────────────────────────────────────────

async function getMakerDashboard(companyId) {
  // --- KPI ---
  const kpiRow = await safeQueryOne(`
    SELECT
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status NOT IN ('completed','cancelled','scrapped'))               AS in_progress,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status = 'design')                                               AS design,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status = 'machining')                                            AS machining,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status = 'assembly')                                             AS assembly,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status = 'trial_waiting')                                        AS trial_waiting,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status = 'completed')                                            AS completed,
      (SELECT COUNT(*) FROM mold_specifications
         WHERE maker_id = $1 AND status = 'completed'
           AND updated_at >= CURRENT_DATE - INTERVAL '7 days')                                    AS week_completed
  `, { bind: [companyId] });

  const kpi = {
    inProgress:    int(kpiRow.in_progress),
    design:        int(kpiRow.design),
    machining:     int(kpiRow.machining),
    assembly:      int(kpiRow.assembly),
    trialWaiting:  int(kpiRow.trial_waiting),
    completed:     int(kpiRow.completed),
    weekCompleted: int(kpiRow.week_completed)
  };

  // --- Assigned molds (top 10 with progress) ---
  const assignedMolds = await safeQueryAll(`
    SELECT ms.id, ms.mold_number, ms.part_name, ms.car_model,
           ms.status, ms.progress, ms.target_delivery_date,
           ms.current_shots, ms.target_shots,
           ms.created_at, ms.updated_at
    FROM mold_specifications ms
    WHERE ms.maker_id = $1
      AND ms.status NOT IN ('completed','cancelled','scrapped')
    ORDER BY
      CASE ms.status
        WHEN 'trial_waiting' THEN 1
        WHEN 'assembly' THEN 2
        WHEN 'machining' THEN 3
        WHEN 'design' THEN 4
        ELSE 5
      END,
      ms.target_delivery_date ASC NULLS LAST
    LIMIT 10
  `, { bind: [companyId] });

  // --- Recent activities ---
  const recentActivities = await safeQueryAll(`
    (
      SELECT 'repair' AS type, rr.id, rr.title, rr.status, rr.priority,
             rr.created_at, ms.mold_number, ms.part_name
      FROM repair_requests rr
      JOIN mold_specifications ms ON rr.mold_id = ms.id
      WHERE rr.assigned_maker_id = $1
      ORDER BY rr.created_at DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 'specification' AS type, ms.id, ms.part_name AS title, ms.status, NULL AS priority,
             ms.updated_at AS created_at, ms.mold_number, ms.part_name
      FROM mold_specifications ms
      WHERE ms.maker_id = $1
      ORDER BY ms.updated_at DESC
      LIMIT 5
    )
    ORDER BY created_at DESC
    LIMIT 10
  `, { bind: [companyId] });

  return { kpi, assignedMolds, recentActivities };
}

// ─── plant ──────────────────────────────────────────────────────────────────

async function getPlantDashboard(companyId) {
  // --- KPI ---
  const kpiRow = await safeQueryOne(`
    SELECT
      (SELECT COUNT(*) FROM mold_specifications ms
         JOIN plant_molds pm ON ms.id = pm.mold_spec_id
         WHERE pm.plant_id = $1)                                                                   AS total_molds,
      (SELECT COUNT(*) FROM mold_specifications ms
         JOIN plant_molds pm ON ms.id = pm.mold_spec_id
         WHERE pm.plant_id = $1 AND ms.status = 'active')                                         AS active_molds,
      (SELECT COUNT(*) FROM daily_checks
         WHERE company_id = $1 AND DATE(check_date) = CURRENT_DATE)                               AS today_checks,
      (SELECT COUNT(*) FROM repair_requests
         WHERE requester_company_id = $1 AND status NOT IN ('completed','cancelled'))              AS pending_repairs,
      (SELECT COALESCE(SUM(quantity),0) FROM production_quantities
         WHERE mold_id IN (SELECT mold_spec_id FROM plant_molds WHERE plant_id = $1)
           AND production_date >= CURRENT_DATE)                                                    AS today_production,
      (SELECT COALESCE(SUM(quantity),0) FROM production_quantities
         WHERE mold_id IN (SELECT mold_spec_id FROM plant_molds WHERE plant_id = $1)
           AND production_date >= DATE_TRUNC('month', CURRENT_DATE))                               AS monthly_production,
      (SELECT COUNT(*) FROM qr_sessions
         WHERE company_id = $1 AND created_at >= CURRENT_DATE)                                     AS today_scans,
      (SELECT COUNT(*) FROM mold_specifications ms
         JOIN plant_molds pm ON ms.id = pm.mold_spec_id
         WHERE pm.plant_id = $1 AND ms.status = 'ng')                                             AS ng_molds
  `, { bind: [companyId] });

  const kpi = {
    totalMolds:       int(kpiRow.total_molds),
    activeMolds:      int(kpiRow.active_molds),
    todayChecks:      int(kpiRow.today_checks),
    pendingRepairs:   int(kpiRow.pending_repairs),
    todayProduction:  int(kpiRow.today_production),
    monthlyProduction:int(kpiRow.monthly_production),
    todayScans:       int(kpiRow.today_scans),
    ngMolds:          int(kpiRow.ng_molds)
  };

  // --- Inspection status ---
  const inspRow = await safeQueryOne(`
    SELECT
      (SELECT COUNT(*) FROM daily_checks
         WHERE company_id = $1 AND DATE(check_date) = CURRENT_DATE AND status = 'completed')      AS completed,
      (SELECT COUNT(*) FROM daily_checks
         WHERE company_id = $1 AND DATE(check_date) = CURRENT_DATE AND status = 'pending')        AS pending,
      (SELECT COUNT(*) FROM periodic_inspections
         WHERE company_id = $1 AND status = 'overdue')                                             AS overdue
  `, { bind: [companyId] });

  const inspectionStatus = {
    completed: int(inspRow.completed),
    pending:   int(inspRow.pending),
    overdue:   int(inspRow.overdue)
  };

  // --- Recent activities ---
  const recentActivities = await safeQueryAll(`
    (
      SELECT 'daily_check' AS type, dc.id, dc.status, dc.check_date AS created_at,
             ms.mold_number, ms.part_name, u.name AS user_name
      FROM daily_checks dc
      LEFT JOIN mold_specifications ms ON dc.mold_id = ms.id
      LEFT JOIN users u ON dc.inspector_id = u.id
      WHERE dc.company_id = $1
      ORDER BY dc.created_at DESC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 'repair' AS type, rr.id, rr.status, rr.created_at,
             ms.mold_number, ms.part_name, u.name AS user_name
      FROM repair_requests rr
      LEFT JOIN mold_specifications ms ON rr.mold_id = ms.id
      LEFT JOIN users u ON rr.requester_id = u.id
      WHERE rr.requester_company_id = $1
      ORDER BY rr.created_at DESC
      LIMIT 5
    )
    ORDER BY created_at DESC
    LIMIT 10
  `, { bind: [companyId] });

  return { kpi, inspectionStatus, recentActivities };
}

module.exports = router;
