const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 제작전 체크리스트 항목 조회 (마스터)
 * GET /api/v1/pre-production-checklist/items
 */
const getChecklistItems = async (req, res) => {
  try {
    const { category_code } = req.query;
    
    let whereClause = 'WHERE is_active = true';
    const replacements = {};
    
    if (category_code) {
      whereClause += ' AND category_code = :category_code';
      replacements.category_code = category_code;
    }
    
    const [items] = await sequelize.query(`
      SELECT * FROM pre_production_checklist_items
      ${whereClause}
      ORDER BY sort_order ASC
    `, { replacements });
    
    // 카테고리별 그룹화
    const groupedItems = items.reduce((acc, item) => {
      const key = item.category_code;
      if (!acc[key]) {
        acc[key] = {
          category_code: item.category_code,
          category_name: item.category_name,
          items: []
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        total_items: items.length,
        categories: Object.values(groupedItems),
        items
      }
    });
    
  } catch (error) {
    logger.error('Get checklist items error:', error);
    // 테이블이 없어도 빈 배열 반환
    res.json({
      success: true,
      data: { total_items: 0, categories: [], items: [] }
    });
  }
};

/**
 * 제작전 체크리스트 생성
 * POST /api/v1/pre-production-checklist
 */
const createChecklist = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      mold_specification_id,
      car_model,
      part_number,
      part_name,
      production_plant,
      maker_name,
      injection_machine_tonnage,
      clamping_force,
      eo_cut_date,
      trial_order_date,
      drawing_review_date,
      part_images
    } = req.body;
    
    const userId = req.user?.id;
    const makerId = req.user?.company_id || userId;
    
    // 체크리스트 번호 생성
    const checklistNumber = `PPC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    
    // 체크리스트 생성
    const [result] = await sequelize.query(`
      INSERT INTO pre_production_checklists (
        checklist_number, mold_specification_id, maker_id,
        car_model, part_number, part_name, production_plant, maker_name,
        injection_machine_tonnage, clamping_force, eo_cut_date, trial_order_date,
        drawing_review_date, part_images, status, created_by,
        created_at, updated_at
      ) VALUES (
        :checklist_number, :mold_specification_id, :maker_id,
        :car_model, :part_number, :part_name, :production_plant, :maker_name,
        :injection_machine_tonnage, :clamping_force, :eo_cut_date, :trial_order_date,
        :drawing_review_date, :part_images::jsonb, 'draft', :created_by,
        NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        checklist_number: checklistNumber,
        mold_specification_id: mold_specification_id || null,
        maker_id: makerId,
        car_model: car_model || null,
        part_number: part_number || null,
        part_name: part_name || null,
        production_plant: production_plant || null,
        maker_name: maker_name || null,
        injection_machine_tonnage: injection_machine_tonnage || null,
        clamping_force: clamping_force || null,
        eo_cut_date: eo_cut_date || null,
        trial_order_date: trial_order_date || null,
        drawing_review_date: drawing_review_date || null,
        part_images: JSON.stringify(part_images || []),
        created_by: userId
      },
      transaction
    });
    
    const checklistId = result[0].id;
    
    // 모든 항목에 대한 결과 레코드 생성
    const [items] = await sequelize.query(`
      SELECT id, default_spec FROM pre_production_checklist_items WHERE is_active = true ORDER BY sort_order
    `, { transaction });
    
    for (const item of items) {
      await sequelize.query(`
        INSERT INTO pre_production_checklist_results (
          checklist_id, item_id, is_applicable, spec_value, is_checked,
          created_at, updated_at
        ) VALUES (
          :checklist_id, :item_id, true, :spec_value, false, NOW(), NOW()
        )
      `, {
        replacements: {
          checklist_id: checklistId,
          item_id: item.id,
          spec_value: item.default_spec || null
        },
        transaction
      });
    }
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      data: {
        id: checklistId,
        checklist_number: checklistNumber,
        status: 'draft'
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Create checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create checklist' }
    });
  }
};

/**
 * 제작전 체크리스트 상세 조회
 * GET /api/v1/pre-production-checklist/:id
 */
const getChecklistById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 체크리스트 기본 정보
    const [checklists] = await sequelize.query(`
      SELECT 
        c.*,
        u.name as created_by_name,
        ru.name as reviewed_by_name,
        au.name as approved_by_name
      FROM pre_production_checklists c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users ru ON c.reviewed_by = ru.id
      LEFT JOIN users au ON c.approved_by = au.id
      WHERE c.id = :id
    `, { replacements: { id } });
    
    if (checklists.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }
    
    const checklist = checklists[0];
    
    // 점검 결과 조회
    const [results] = await sequelize.query(`
      SELECT 
        r.*,
        i.category_code, i.category_name, i.item_no, i.item_name,
        i.item_description, i.input_type, i.input_options, i.default_spec,
        u.name as checked_by_name
      FROM pre_production_checklist_results r
      LEFT JOIN pre_production_checklist_items i ON r.item_id = i.id
      LEFT JOIN users u ON r.checked_by = u.id
      WHERE r.checklist_id = :id
      ORDER BY i.sort_order ASC
    `, { replacements: { id } });
    
    // 카테고리별 그룹화
    const groupedResults = results.reduce((acc, result) => {
      const key = result.category_code;
      if (!acc[key]) {
        acc[key] = {
          category_code: result.category_code,
          category_name: result.category_name,
          items: []
        };
      }
      acc[key].items.push(result);
      return acc;
    }, {});
    
    // 진행률 계산
    const checkedCount = results.filter(r => r.is_checked).length;
    const progressRate = Math.round((checkedCount / results.length) * 100);
    
    res.json({
      success: true,
      data: {
        ...checklist,
        checked_items: checkedCount,
        progress_rate: progressRate,
        categories: Object.values(groupedResults),
        results
      }
    });
    
  } catch (error) {
    logger.error('Get checklist by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklist' }
    });
  }
};

/**
 * 제작전 체크리스트 목록 조회
 * GET /api/v1/pre-production-checklist
 */
const getChecklists = async (req, res) => {
  try {
    const { status, maker_id, mold_specification_id, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (status) {
      whereClause += ' AND c.status = :status';
      replacements.status = status;
    }
    if (maker_id) {
      whereClause += ' AND c.maker_id = :maker_id';
      replacements.maker_id = maker_id;
    }
    if (mold_specification_id) {
      whereClause += ' AND c.mold_specification_id = :mold_specification_id';
      replacements.mold_specification_id = mold_specification_id;
    }
    
    const [checklists] = await sequelize.query(`
      SELECT 
        c.*,
        u.name as created_by_name,
        m.company_name as maker_company_name
      FROM pre_production_checklists c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users m ON c.maker_id = m.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements });
    
    // 총 개수
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM pre_production_checklists c ${whereClause}
    `, { replacements });
    
    res.json({
      success: true,
      data: {
        items: checklists,
        total: parseInt(countResult[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    logger.error('Get checklists error:', error);
    // 테이블이 없어도 빈 배열 반환
    res.json({
      success: true,
      data: { items: [], total: 0, limit: 50, offset: 0 }
    });
  }
};

/**
 * 제작전 체크리스트 항목 결과 업데이트
 * PATCH /api/v1/pre-production-checklist/:id/results
 */
const updateChecklistResults = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { results } = req.body;
    const userId = req.user?.id;
    
    for (const result of results) {
      await sequelize.query(`
        UPDATE pre_production_checklist_results
        SET 
          is_applicable = :is_applicable,
          spec_value = :spec_value,
          is_checked = :is_checked,
          result_value = :result_value,
          notes = :notes,
          attachments = :attachments::jsonb,
          checked_by = :checked_by,
          checked_at = CASE WHEN :is_checked THEN NOW() ELSE checked_at END,
          updated_at = NOW()
        WHERE checklist_id = :checklist_id AND item_id = :item_id
      `, {
        replacements: {
          checklist_id: id,
          item_id: result.item_id,
          is_applicable: result.is_applicable !== undefined ? result.is_applicable : true,
          spec_value: result.spec_value || null,
          is_checked: result.is_checked || false,
          result_value: result.result_value || null,
          notes: result.notes || null,
          attachments: JSON.stringify(result.attachments || []),
          checked_by: result.is_checked ? userId : null
        },
        transaction
      });
    }
    
    // 진행률 업데이트
    const [progressResult] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_checked THEN 1 ELSE 0 END) as checked
      FROM pre_production_checklist_results
      WHERE checklist_id = :id
    `, { replacements: { id }, transaction });
    
    const total = parseInt(progressResult[0].total);
    const checked = parseInt(progressResult[0].checked);
    const progressRate = Math.round((checked / total) * 100);
    
    await sequelize.query(`
      UPDATE pre_production_checklists
      SET checked_items = :checked, progress_rate = :progress_rate, updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, checked, progress_rate: progressRate },
      transaction
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: {
        checklist_id: parseInt(id),
        checked_items: checked,
        total_items: total,
        progress_rate: progressRate
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Update checklist results error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update checklist results' }
    });
  }
};

/**
 * 제작전 체크리스트 제출
 * POST /api/v1/pre-production-checklist/:id/submit
 */
const submitChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    
    await sequelize.query(`
      UPDATE pre_production_checklists
      SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
      WHERE id = :id AND status = 'draft'
    `, { replacements: { id } });
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'submitted' }
    });
    
  } catch (error) {
    logger.error('Submit checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit checklist' }
    });
  }
};

/**
 * 제작전 체크리스트 승인
 * POST /api/v1/pre-production-checklist/:id/approve
 */
const approveChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;
    
    await sequelize.query(`
      UPDATE pre_production_checklists
      SET status = 'approved', approved_by = :approved_by, approved_at = NOW(),
          review_notes = :notes, updated_at = NOW()
      WHERE id = :id AND status = 'submitted'
    `, { replacements: { id, approved_by: userId, notes: notes || null } });
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'approved' }
    });
    
  } catch (error) {
    logger.error('Approve checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve checklist' }
    });
  }
};

/**
 * 제작전 체크리스트 반려
 * POST /api/v1/pre-production-checklist/:id/reject
 */
const rejectChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    await sequelize.query(`
      UPDATE pre_production_checklists
      SET status = 'rejected', rejected_by = :rejected_by, rejected_at = NOW(),
          rejection_reason = :reason, updated_at = NOW()
      WHERE id = :id AND status = 'submitted'
    `, { replacements: { id, rejected_by: userId, reason: reason || null } });
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'rejected' }
    });
    
  } catch (error) {
    logger.error('Reject checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject checklist' }
    });
  }
};

/**
 * 카테고리별 요약 조회
 * GET /api/v1/pre-production-checklist/categories/summary
 */
const getCategorySummary = async (req, res) => {
  try {
    const [summary] = await sequelize.query(`
      SELECT 
        category_code,
        category_name,
        COUNT(*) as item_count
      FROM pre_production_checklist_items
      WHERE is_active = true
      GROUP BY category_code, category_name
      ORDER BY MIN(sort_order)
    `);
    
    res.json({
      success: true,
      data: {
        categories: summary,
        total_items: summary.reduce((sum, cat) => sum + parseInt(cat.item_count), 0)
      }
    });
    
  } catch (error) {
    logger.error('Get category summary error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get category summary' }
    });
  }
};

module.exports = {
  getChecklistItems,
  createChecklist,
  getChecklistById,
  getChecklists,
  updateChecklistResults,
  submitChecklist,
  approveChecklist,
  rejectChecklist,
  getCategorySummary
};
