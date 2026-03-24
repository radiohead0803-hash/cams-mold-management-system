const express = require('express');
const router = express.Router();
const { sequelize } = require('../models/newIndex');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * 금형 원가/감가상각 관리 라우트
 */

// ─── 대시보드 요약 (총 TCO, 평균 개당 금형비 등) ───
// GET /api/v1/mold-costs/summary/dashboard
router.get('/summary/dashboard', authenticate, async (req, res) => {
  try {
    const [summary] = await sequelize.query(`
      SELECT
        COUNT(mc.id) AS total_molds,
        COALESCE(SUM(mc.acquisition_cost), 0) AS total_acquisition_cost,
        COALESCE(SUM(mc.accumulated_repair_cost), 0) AS total_repair_cost,
        COALESCE(SUM(mc.acquisition_cost + mc.accumulated_repair_cost), 0) AS total_tco,
        COALESCE(AVG(mc.cost_per_unit), 0) AS avg_cost_per_unit,
        COALESCE(AVG(mc.current_book_value), 0) AS avg_book_value,
        COALESCE(SUM(mc.total_production_qty), 0) AS total_production_qty
      FROM mold_costs mc
    `);

    // 감가상각 방법별 분포
    const [depreciationDist] = await sequelize.query(`
      SELECT
        depreciation_method,
        COUNT(*) AS count
      FROM mold_costs
      GROUP BY depreciation_method
      ORDER BY count DESC
    `);

    // 최근 비용 이력 (최근 10건)
    const [recentHistory] = await sequelize.query(`
      SELECT
        ch.id,
        ch.mold_id,
        m.mold_code,
        ch.cost_type,
        ch.amount,
        ch.description,
        ch.occurred_at,
        u.name AS created_by_name
      FROM mold_cost_history ch
      LEFT JOIN molds m ON ch.mold_id = m.id
      LEFT JOIN users u ON ch.created_by = u.id
      ORDER BY ch.occurred_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {},
        depreciationDistribution: depreciationDist,
        recentCostHistory: recentHistory
      }
    });
  } catch (error) {
    logger.error('Get mold cost dashboard error:', error);
    res.json({
      success: true,
      data: {
        summary: {},
        depreciationDistribution: [],
        recentCostHistory: []
      }
    });
  }
});

// ─── 전체 금형 원가 목록 ───
// GET /api/v1/mold-costs
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };

    let whereClause = 'WHERE 1=1';
    if (search) {
      whereClause += ' AND (m.mold_code ILIKE :search OR ms.part_name ILIKE :search OR ms.part_number ILIKE :search)';
      replacements.search = `%${search}%`;
    }

    const [items] = await sequelize.query(`
      SELECT
        mc.*,
        m.mold_code,
        m.current_shots,
        m.target_shots,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        cu.name AS created_by_name,
        uu.name AS updated_by_name
      FROM mold_costs mc
      LEFT JOIN molds m ON mc.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN users cu ON mc.created_by = cu.id
      LEFT JOIN users uu ON mc.updated_by = uu.id
      ${whereClause}
      ORDER BY mc.updated_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements });

    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) AS count
      FROM mold_costs mc
      LEFT JOIN molds m ON mc.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      ${whereClause}
    `, { replacements });

    res.json({
      success: true,
      data: {
        items,
        total: parseInt(countResult[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get mold costs list error:', error);
    res.json({
      success: true,
      data: { items: [], total: 0, limit: 50, offset: 0 }
    });
  }
});

// ─── 특정 금형 원가 상세 (감가상각 계산 포함) ───
// GET /api/v1/mold-costs/:moldId
router.get('/:moldId', authenticate, async (req, res) => {
  try {
    const { moldId } = req.params;

    const [rows] = await sequelize.query(`
      SELECT
        mc.*,
        m.mold_code,
        m.current_shots,
        m.target_shots,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        ms.mold_type,
        ms.tonnage,
        ms.material,
        cu.name AS created_by_name,
        uu.name AS updated_by_name
      FROM mold_costs mc
      LEFT JOIN molds m ON mc.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN users cu ON mc.created_by = cu.id
      LEFT JOIN users uu ON mc.updated_by = uu.id
      WHERE mc.mold_id = :moldId
    `, { replacements: { moldId: parseInt(moldId) } });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 금형의 원가 정보가 없습니다.'
      });
    }

    const costData = rows[0];

    // ── 감가상각 계산 ──
    let depreciation = null;
    const acquisitionCost = parseFloat(costData.acquisition_cost) || 0;
    const salvageValue = parseFloat(costData.salvage_value) || 0;
    const depreciableAmount = acquisitionCost - salvageValue;

    if (costData.depreciation_method === 'straight_line') {
      // 정액법: (취득원가 - 잔존가치) / 내용연수
      const usefulLifeYears = parseInt(costData.useful_life_years) || 3;
      const annualDepreciation = depreciableAmount / usefulLifeYears;
      const createdAt = new Date(costData.created_at);
      const now = new Date();
      const yearsElapsed = (now - createdAt) / (1000 * 60 * 60 * 24 * 365.25);
      const accumulatedDepreciation = Math.min(annualDepreciation * yearsElapsed, depreciableAmount);
      const currentBookValue = Math.max(acquisitionCost - accumulatedDepreciation, salvageValue);

      depreciation = {
        method: 'straight_line',
        method_name: '정액법',
        useful_life_years: usefulLifeYears,
        annual_depreciation: Math.round(annualDepreciation * 100) / 100,
        years_elapsed: Math.round(yearsElapsed * 100) / 100,
        accumulated_depreciation: Math.round(accumulatedDepreciation * 100) / 100,
        current_book_value: Math.round(currentBookValue * 100) / 100
      };
    } else if (costData.depreciation_method === 'units_of_production') {
      // 생산량비례법: (취득원가 - 잔존가치) * (현재타수 / 보증타수)
      const currentShots = parseInt(costData.current_shots) || parseInt(costData.total_production_qty) || 0;
      const usefulLifeShots = parseInt(costData.useful_life_shots) || parseInt(costData.target_shots) || 1;
      const usageRatio = Math.min(currentShots / usefulLifeShots, 1);
      const accumulatedDepreciation = depreciableAmount * usageRatio;
      const currentBookValue = Math.max(acquisitionCost - accumulatedDepreciation, salvageValue);

      depreciation = {
        method: 'units_of_production',
        method_name: '생산량비례법',
        useful_life_shots: usefulLifeShots,
        current_shots: currentShots,
        usage_ratio: Math.round(usageRatio * 10000) / 10000,
        accumulated_depreciation: Math.round(accumulatedDepreciation * 100) / 100,
        current_book_value: Math.round(currentBookValue * 100) / 100
      };
    }

    // ── 비용 이력 조회 ──
    const [costHistory] = await sequelize.query(`
      SELECT
        ch.*,
        u.name AS created_by_name
      FROM mold_cost_history ch
      LEFT JOIN users u ON ch.created_by = u.id
      WHERE ch.mold_id = :moldId
      ORDER BY ch.occurred_at DESC
    `, { replacements: { moldId: parseInt(moldId) } });

    res.json({
      success: true,
      data: {
        ...costData,
        depreciation,
        costHistory
      }
    });
  } catch (error) {
    logger.error('Get mold cost detail error:', error);
    res.status(500).json({
      success: false,
      message: '원가 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// ─── 원가 정보 등록/업데이트 (UPSERT) ───
// POST /api/v1/mold-costs
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      mold_id,
      acquisition_cost,
      accumulated_repair_cost,
      depreciation_method,
      useful_life_years,
      useful_life_shots,
      salvage_value,
      current_book_value,
      total_production_qty,
      cost_per_unit,
      notes
    } = req.body;

    if (!mold_id) {
      return res.status(400).json({
        success: false,
        message: 'mold_id는 필수 항목입니다.'
      });
    }

    const userId = req.user?.id || null;

    const [result] = await sequelize.query(`
      INSERT INTO mold_costs (
        mold_id, acquisition_cost, accumulated_repair_cost,
        depreciation_method, useful_life_years, useful_life_shots,
        salvage_value, current_book_value, total_production_qty,
        cost_per_unit, notes, created_by, updated_by,
        created_at, updated_at
      ) VALUES (
        :mold_id, :acquisition_cost, :accumulated_repair_cost,
        :depreciation_method, :useful_life_years, :useful_life_shots,
        :salvage_value, :current_book_value, :total_production_qty,
        :cost_per_unit, :notes, :user_id, :user_id,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (mold_id) DO UPDATE SET
        acquisition_cost = EXCLUDED.acquisition_cost,
        accumulated_repair_cost = EXCLUDED.accumulated_repair_cost,
        depreciation_method = EXCLUDED.depreciation_method,
        useful_life_years = EXCLUDED.useful_life_years,
        useful_life_shots = EXCLUDED.useful_life_shots,
        salvage_value = EXCLUDED.salvage_value,
        current_book_value = EXCLUDED.current_book_value,
        total_production_qty = EXCLUDED.total_production_qty,
        cost_per_unit = EXCLUDED.cost_per_unit,
        notes = EXCLUDED.notes,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, {
      replacements: {
        mold_id: parseInt(mold_id),
        acquisition_cost: acquisition_cost || 0,
        accumulated_repair_cost: accumulated_repair_cost || 0,
        depreciation_method: depreciation_method || 'straight_line',
        useful_life_years: useful_life_years || 3,
        useful_life_shots: useful_life_shots || null,
        salvage_value: salvage_value || 0,
        current_book_value: current_book_value || 0,
        total_production_qty: total_production_qty || 0,
        cost_per_unit: cost_per_unit || 0,
        notes: notes || null,
        user_id: userId
      }
    });

    res.json({
      success: true,
      message: '원가 정보가 저장되었습니다.',
      data: result[0]
    });
  } catch (error) {
    logger.error('Upsert mold cost error:', error);
    res.status(500).json({
      success: false,
      message: '원가 정보 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// ─── 비용 이력 추가 (수리비, 부품비 등) ───
// POST /api/v1/mold-costs/:moldId/cost-history
router.post('/:moldId/cost-history', authenticate, async (req, res) => {
  try {
    const { moldId } = req.params;
    const { cost_type, amount, description, occurred_at } = req.body;

    if (!cost_type || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'cost_type과 amount는 필수 항목입니다.'
      });
    }

    const userId = req.user?.id || null;
    const moldIdInt = parseInt(moldId);

    // mold_cost_id 조회 (있으면 연결)
    const [costRows] = await sequelize.query(
      'SELECT id FROM mold_costs WHERE mold_id = :moldId',
      { replacements: { moldId: moldIdInt } }
    );
    const moldCostId = costRows.length > 0 ? costRows[0].id : null;

    // 비용 이력 추가
    const [result] = await sequelize.query(`
      INSERT INTO mold_cost_history (
        mold_cost_id, mold_id, cost_type, amount,
        description, occurred_at, created_by, created_at
      ) VALUES (
        :mold_cost_id, :mold_id, :cost_type, :amount,
        :description, :occurred_at, :created_by, CURRENT_TIMESTAMP
      )
      RETURNING *
    `, {
      replacements: {
        mold_cost_id: moldCostId,
        mold_id: moldIdInt,
        cost_type,
        amount: parseFloat(amount),
        description: description || null,
        occurred_at: occurred_at || new Date().toISOString(),
        created_by: userId
      }
    });

    // 누적 수리비 자동 업데이트 (mold_costs 테이블에 반영)
    if (moldCostId) {
      await sequelize.query(`
        UPDATE mold_costs
        SET accumulated_repair_cost = (
          SELECT COALESCE(SUM(amount), 0)
          FROM mold_cost_history
          WHERE mold_id = :moldId
        ),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = :userId
        WHERE mold_id = :moldId
      `, {
        replacements: { moldId: moldIdInt, userId }
      });
    }

    res.json({
      success: true,
      message: '비용 이력이 추가되었습니다.',
      data: result[0]
    });
  } catch (error) {
    logger.error('Add cost history error:', error);
    res.status(500).json({
      success: false,
      message: '비용 이력 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
