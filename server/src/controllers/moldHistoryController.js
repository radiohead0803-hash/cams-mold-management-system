const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 금형별 통합 변경이력 조회
 * GET /api/v1/mold-history/:moldId
 * 
 * mold_history 테이블 + 기존 6개 history 테이블을 통합 조회
 */
const getMoldHistory = async (req, res) => {
  try {
    const { moldId } = req.params;
    const { type, limit = 50 } = req.query;
    
    let typeFilter = '';
    if (type && type !== 'all') {
      typeFilter = `AND history_type = :type`;
    }
    
    // 1. mold_history 테이블 (통합 이력)
    const [mainHistory] = await sequelize.query(`
      SELECT 
        id, mold_id, history_type as type, title, description,
        changes, user_name, created_at, source_table, source_id
      FROM mold_history
      WHERE mold_id = :moldId ${typeFilter}
      ORDER BY created_at DESC
      LIMIT :limit
    `, { replacements: { moldId, type: type || '', limit: parseInt(limit) } });

    // 2. 기존 history 테이블에서 보충 데이터 수집
    const supplementary = [];

    // stage_change_history → status_change
    try {
      const [stageChanges] = await sequelize.query(`
        SELECT 
          sch.id, sch.mold_id, 'status_change' as type,
          '진행단계 변경' as title,
          sch.reason as description,
          json_build_array(json_build_object('field', '진행단계', 'old_value', sch.previous_stage, 'new_value', sch.new_stage))::jsonb as changes,
          u.name as user_name,
          sch.changed_at as created_at,
          'stage_change_history' as source_table,
          sch.id as source_id
        FROM stage_change_history sch
        LEFT JOIN users u ON sch.changed_by = u.id
        WHERE sch.mold_id = :moldId
        ORDER BY sch.changed_at DESC
        LIMIT 20
      `, { replacements: { moldId } });
      supplementary.push(...stageChanges);
    } catch (e) { /* table might not exist */ }

    // repair_workflow_history → repair
    try {
      const [repairHistory] = await sequelize.query(`
        SELECT 
          rwh.id, rr.mold_id, 'repair' as type,
          CONCAT('수리 ', rwh.step_name, ' - ', rwh.action) as title,
          rwh.comment as description,
          '[]'::jsonb as changes,
          rwh.user_name,
          rwh.created_at,
          'repair_workflow_history' as source_table,
          rwh.id as source_id
        FROM repair_workflow_history rwh
        LEFT JOIN repair_requests rr ON rwh.repair_request_id = rr.id
        WHERE rr.mold_id = :moldId
        ORDER BY rwh.created_at DESC
        LIMIT 20
      `, { replacements: { moldId } });
      supplementary.push(...repairHistory);
    } catch (e) { /* table might not exist */ }

    // material_history → specification
    try {
      const [materialChanges] = await sequelize.query(`
        SELECT 
          mh.id, mh.mold_id, 'specification' as type,
          '원재료 변경' as title,
          mh.change_reason as description,
          COALESCE(
            json_build_array(
              json_build_object('field', '원재료', 'old_value', mh.previous_data->>'material_spec', 'new_value', mh.material_spec)
            )::jsonb,
            '[]'::jsonb
          ) as changes,
          mh.registered_by_name as user_name,
          mh.created_at,
          'material_history' as source_table,
          mh.id as source_id
        FROM material_history mh
        WHERE mh.mold_id = :moldId
        ORDER BY mh.created_at DESC
        LIMIT 20
      `, { replacements: { moldId } });
      supplementary.push(...materialChanges);
    } catch (e) { /* table might not exist */ }

    // weight_history → specification
    try {
      const [weightChanges] = await sequelize.query(`
        SELECT 
          wh.id, wh.mold_id, 'specification' as type,
          CONCAT(wh.weight_type, ' 중량 변경') as title,
          wh.change_reason as description,
          json_build_array(
            json_build_object('field', CONCAT(wh.weight_type, ' 중량'), 'old_value', CONCAT(wh.previous_value, wh.previous_unit), 'new_value', CONCAT(wh.weight_value, wh.weight_unit))
          )::jsonb as changes,
          wh.registered_by_name as user_name,
          wh.created_at,
          'weight_history' as source_table,
          wh.id as source_id
        FROM weight_history wh
        WHERE wh.mold_id = :moldId
        ORDER BY wh.created_at DESC
        LIMIT 20
      `, { replacements: { moldId } });
      supplementary.push(...weightChanges);
    } catch (e) { /* table might not exist */ }

    // mold_cost_history → specification
    try {
      const [costChanges] = await sequelize.query(`
        SELECT 
          mch.id, mch.mold_id, 'specification' as type,
          CONCAT(mch.cost_type, ' 비용 발생') as title,
          mch.description,
          json_build_array(
            json_build_object('field', mch.cost_type, 'old_value', '', 'new_value', CONCAT(mch.amount, '원'))
          )::jsonb as changes,
          u.name as user_name,
          mch.created_at,
          'mold_cost_history' as source_table,
          mch.id as source_id
        FROM mold_cost_history mch
        LEFT JOIN users u ON mch.created_by = u.id
        WHERE mch.mold_id = :moldId
        ORDER BY mch.created_at DESC
        LIMIT 20
      `, { replacements: { moldId } });
      supplementary.push(...costChanges);
    } catch (e) { /* table might not exist */ }

    // 3. 통합 + 정렬 + 중복 제거
    const allHistory = [...mainHistory, ...supplementary];
    
    // source_table+source_id 기준 중복 제거
    const seen = new Set();
    const unique = allHistory.filter(item => {
      if (item.source_table && item.source_id) {
        const key = `${item.source_table}_${item.source_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    });

    // type 필터 적용
    const filtered = (type && type !== 'all')
      ? unique.filter(h => h.type === type)
      : unique;

    // 날짜순 정렬
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // limit 적용
    const result = filtered.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        mold_id: parseInt(moldId),
        history: result,
        total: filtered.length
      }
    });
    
  } catch (error) {
    logger.error('Get mold history error:', error);
    res.json({
      success: true,
      data: { mold_id: parseInt(req.params.moldId), history: [], total: 0 }
    });
  }
};

/**
 * 금형 이력 추가 (시스템 또는 수동)
 * POST /api/v1/mold-history
 */
const createMoldHistory = async (req, res) => {
  try {
    const { mold_id, history_type, title, description, changes, source_table, source_id } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name;

    const [result] = await sequelize.query(`
      INSERT INTO mold_history (mold_id, history_type, title, description, changes, user_id, user_name, source_table, source_id, created_at)
      VALUES (:mold_id, :history_type, :title, :description, :changes::jsonb, :user_id, :user_name, :source_table, :source_id, NOW())
      RETURNING id
    `, {
      replacements: {
        mold_id,
        history_type,
        title,
        description: description || null,
        changes: JSON.stringify(changes || []),
        user_id: userId || null,
        user_name: userName || null,
        source_table: source_table || null,
        source_id: source_id || null
      }
    });

    res.status(201).json({
      success: true,
      data: { id: result[0].id }
    });
  } catch (error) {
    logger.error('Create mold history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create mold history' }
    });
  }
};

module.exports = {
  getMoldHistory,
  createMoldHistory
};
