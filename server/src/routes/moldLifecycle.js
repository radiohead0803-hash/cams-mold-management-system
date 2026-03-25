const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * 금형 수명주기 관리 API
 *
 * GET /api/v1/mold-lifecycle/summary — 금형 수명주기 요약 통계
 */

// 인증 필수
router.use(authenticate);

/**
 * GET /summary
 * 금형 수명주기 요약 통계 조회
 * - 전체 수량, 상태별 수량 (active/repair/transfer/idle/scrapped)
 * Query params: company_id (optional filter)
 */
router.get('/summary', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { company_id } = req.query;

    let whereClause = '';
    const binds = [];

    if (company_id) {
      binds.push(parseInt(company_id));
      whereClause = `WHERE maker_id = $${binds.length} OR plant_id = $${binds.length}`;
    }

    // 상태별 집계
    const [statusCounts] = await sequelize.query(
      `SELECT
        COALESCE(status, 'unknown') AS status,
        COUNT(*) AS count
      FROM molds
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC`,
      { bind: binds }
    );

    // 전체 수량
    const [totalRow] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM molds ${whereClause}`,
      { bind: binds }
    );

    // 요약 객체 구성
    const summary = {
      total: parseInt(totalRow[0]?.total || 0),
      active: 0,
      repair: 0,
      transfer: 0,
      idle: 0,
      scrapped: 0
    };

    for (const row of statusCounts) {
      const key = row.status?.toLowerCase();
      if (key in summary) {
        summary[key] = parseInt(row.count);
      }
    }

    // 개발(development) 상태도 포함 — status가 별도 값이 아닌 경우
    // mold_development_plans 테이블에서 진행중인 개발 금형 수 조회
    const [devRow] = await sequelize.query(
      `SELECT COUNT(DISTINCT mold_id) AS count
       FROM mold_development_plans
       WHERE status IN ('planning', 'in_progress')`,
      { bind: [] }
    ).catch(() => [[{ count: 0 }]]);

    summary.development = parseInt(devRow[0]?.count || 0);
    // production = active 상태 금형 수
    summary.production = summary.active;

    // 최근 금형 목록 (최근 변경된 20개)
    const moldBinds = [...binds];
    const limitIdx = moldBinds.length + 1;
    moldBinds.push(20);

    const [molds] = await sequelize.query(
      `SELECT
        id,
        mold_number,
        mold_name,
        status,
        current_shots,
        location,
        updated_at,
        created_at
      FROM molds
      ${whereClause}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT $${limitIdx}`,
      { bind: moldBinds }
    );

    res.json({
      success: true,
      data: {
        summary,
        statusCounts,
        molds
      }
    });
  } catch (error) {
    console.error('금형 수명주기 요약 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 수명주기 요약 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
