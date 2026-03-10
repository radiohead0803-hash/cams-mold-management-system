const { sequelize } = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// ============================================================
// 카테고리 API
// ============================================================

const getCategories = async (req, res) => {
  try {
    const { applicable_to } = req.query;
    let where = 'WHERE is_active = true';
    if (applicable_to && applicable_to !== 'all') {
      where += ` AND (applicable_to = '${applicable_to}' OR applicable_to = 'all')`;
    }
    const [rows] = await sequelize.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM general_equipment_master m WHERE m.category_id = c.id AND m.is_active = true) as master_count,
        (SELECT COUNT(*) FROM company_general_equipment ce WHERE ce.category_id = c.id AND ce.is_active = true) as usage_count
      FROM general_equipment_category c
      ${where}
      ORDER BY c.sort_order, c.category_name
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ success: false, error: { message: '카테고리 조회 실패' } });
  }
};

const createCategory = async (req, res) => {
  try {
    const { category_code, category_name, parent_id, applicable_to, sort_order, description } = req.body;
    if (!category_code || !category_name) return res.status(400).json({ success: false, error: { message: '코드와 이름은 필수입니다' } });
    const [result] = await sequelize.query(`
      INSERT INTO general_equipment_category (category_code, category_name, parent_id, applicable_to, sort_order, description)
      VALUES (:category_code, :category_name, :parent_id, :applicable_to, :sort_order, :description)
      RETURNING *
    `, { replacements: { category_code, category_name, parent_id: parent_id || null, applicable_to: applicable_to || 'all', sort_order: sort_order || 0, description: description || null } });
    res.status(201).json({ success: true, data: result[0], message: '카테고리 등록 완료' });
  } catch (error) {
    if (error.message?.includes('duplicate')) return res.status(409).json({ success: false, error: { message: '동일한 카테고리 코드가 이미 존재합니다' } });
    logger.error('Create category error:', error);
    res.status(500).json({ success: false, error: { message: '카테고리 등록 실패' } });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, applicable_to, sort_order, description, is_active } = req.body;
    const [result] = await sequelize.query(`
      UPDATE general_equipment_category 
      SET category_name = COALESCE(:category_name, category_name),
          applicable_to = COALESCE(:applicable_to, applicable_to),
          sort_order = COALESCE(:sort_order, sort_order),
          description = COALESCE(:description, description),
          is_active = COALESCE(:is_active, is_active)
      WHERE id = :id RETURNING *
    `, { replacements: { id, category_name: category_name || null, applicable_to: applicable_to || null, sort_order: sort_order ?? null, description: description ?? null, is_active: is_active ?? null } });
    if (!result.length) return res.status(404).json({ success: false, error: { message: '카테고리를 찾을 수 없습니다' } });
    res.json({ success: true, data: result[0], message: '카테고리 수정 완료' });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({ success: false, error: { message: '카테고리 수정 실패' } });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await sequelize.query(`UPDATE general_equipment_category SET is_active = false WHERE id = :id`, { replacements: { id: req.params.id } });
    res.json({ success: true, message: '카테고리 비활성화 완료' });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ success: false, error: { message: '카테고리 삭제 실패' } });
  }
};

// ============================================================
// 장비 마스터 API
// ============================================================

const getGeneralMasters = async (req, res) => {
  try {
    const { category_id, search, limit = 200 } = req.query;
    let where = 'WHERE m.is_active = true';
    if (category_id) where += ` AND m.category_id = ${parseInt(category_id)}`;
    if (search) where += ` AND (m.equipment_name ILIKE '%${search}%' OR m.manufacturer ILIKE '%${search}%' OR m.model_name ILIKE '%${search}%' OR m.spec_summary ILIKE '%${search}%')`;
    const [rows] = await sequelize.query(`
      SELECT m.*, c.category_code, c.category_name, c.applicable_to
      FROM general_equipment_master m
      JOIN general_equipment_category c ON c.id = m.category_id
      ${where}
      ORDER BY c.sort_order, m.equipment_name
      LIMIT ${parseInt(limit)}
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Get general masters error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 조회 실패' } });
  }
};

const createGeneralMaster = async (req, res) => {
  try {
    const { category_id, equipment_name, manufacturer, model_name, spec_summary, spec_info, description } = req.body;
    if (!category_id || !equipment_name) return res.status(400).json({ success: false, error: { message: '카테고리와 장비명은 필수입니다' } });
    const [result] = await sequelize.query(`
      INSERT INTO general_equipment_master (category_id, equipment_name, manufacturer, model_name, spec_summary, spec_info, description, created_by)
      VALUES (:category_id, :equipment_name, :manufacturer, :model_name, :spec_summary, :spec_info, :description, :created_by)
      RETURNING *
    `, { replacements: { category_id, equipment_name, manufacturer: manufacturer || null, model_name: model_name || null, spec_summary: spec_summary || null, spec_info: JSON.stringify(spec_info || {}), description: description || null, created_by: req.user?.id || null } });
    res.status(201).json({ success: true, data: result[0], message: '장비 마스터 등록 완료' });
  } catch (error) {
    logger.error('Create general master error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 등록 실패' } });
  }
};

const updateGeneralMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment_name, manufacturer, model_name, spec_summary, description, is_active } = req.body;
    const [result] = await sequelize.query(`
      UPDATE general_equipment_master 
      SET equipment_name = COALESCE(:equipment_name, equipment_name),
          manufacturer = COALESCE(:manufacturer, manufacturer),
          model_name = COALESCE(:model_name, model_name),
          spec_summary = COALESCE(:spec_summary, spec_summary),
          description = COALESCE(:description, description),
          is_active = COALESCE(:is_active, is_active),
          updated_at = NOW()
      WHERE id = :id RETURNING *
    `, { replacements: { id, equipment_name: equipment_name || null, manufacturer: manufacturer || null, model_name: model_name || null, spec_summary: spec_summary || null, description: description || null, is_active: is_active ?? null } });
    if (!result.length) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });
    res.json({ success: true, data: result[0], message: '장비 마스터 수정 완료' });
  } catch (error) {
    logger.error('Update general master error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 수정 실패' } });
  }
};

const deleteGeneralMaster = async (req, res) => {
  try {
    await sequelize.query(`UPDATE general_equipment_master SET is_active = false, updated_at = NOW() WHERE id = :id`, { replacements: { id: req.params.id } });
    res.json({ success: true, message: '장비 마스터 비활성화 완료' });
  } catch (error) {
    logger.error('Delete general master error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 삭제 실패' } });
  }
};

// ============================================================
// 업체별 보유장비 API
// ============================================================

const getCompanyGeneralEquipments = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { category_id } = req.query;
    let where = `WHERE ce.company_id = ${companyId} AND ce.is_active = true`;
    if (category_id) where += ` AND ce.category_id = ${parseInt(category_id)}`;
    const [rows] = await sequelize.query(`
      SELECT ce.*, c.category_code, c.category_name, c.applicable_to,
        m.spec_summary as master_spec
      FROM company_general_equipment ce
      JOIN general_equipment_category c ON c.id = ce.category_id
      LEFT JOIN general_equipment_master m ON m.id = ce.equipment_master_id
      ${where}
      ORDER BY c.sort_order, ce.equipment_name
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Get company general equipments error:', error);
    res.status(500).json({ success: false, error: { message: '보유장비 조회 실패' } });
  }
};

const addCompanyGeneralEquipment = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { category_id, equipment_master_id, equipment_name, manufacturer, model_name, spec_summary, quantity, year_installed, status, condition_grade, daily_capacity, notes } = req.body;
    if (!category_id || !equipment_name) return res.status(400).json({ success: false, error: { message: '카테고리와 장비명은 필수입니다' } });

    const [result] = await sequelize.query(`
      INSERT INTO company_general_equipment (company_id, category_id, equipment_master_id, equipment_name, manufacturer, model_name, spec_summary, quantity, year_installed, status, condition_grade, daily_capacity, notes, created_by)
      VALUES (:company_id, :category_id, :equipment_master_id, :equipment_name, :manufacturer, :model_name, :spec_summary, :quantity, :year_installed, :status, :condition_grade, :daily_capacity, :notes, :created_by)
      RETURNING *
    `, { replacements: { company_id: companyId, category_id, equipment_master_id: equipment_master_id || null, equipment_name, manufacturer: manufacturer || null, model_name: model_name || null, spec_summary: spec_summary || null, quantity: quantity || 1, year_installed: year_installed || null, status: status || 'active', condition_grade: condition_grade || null, daily_capacity: daily_capacity || null, notes: notes || null, created_by: req.user?.id || null } });
    res.status(201).json({ success: true, data: result[0], message: '장비 등록 완료' });
  } catch (error) {
    logger.error('Add company general equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 등록 실패' } });
  }
};

const updateCompanyGeneralEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment_name, manufacturer, model_name, spec_summary, quantity, year_installed, status, condition_grade, daily_capacity, notes } = req.body;
    const [result] = await sequelize.query(`
      UPDATE company_general_equipment 
      SET equipment_name = COALESCE(:equipment_name, equipment_name),
          manufacturer = COALESCE(:manufacturer, manufacturer),
          model_name = COALESCE(:model_name, model_name),
          spec_summary = COALESCE(:spec_summary, spec_summary),
          quantity = COALESCE(:quantity, quantity),
          year_installed = COALESCE(:year_installed, year_installed),
          status = COALESCE(:status, status),
          condition_grade = COALESCE(:condition_grade, condition_grade),
          daily_capacity = COALESCE(:daily_capacity, daily_capacity),
          notes = COALESCE(:notes, notes),
          updated_at = NOW()
      WHERE id = :id RETURNING *
    `, { replacements: { id, equipment_name: equipment_name || null, manufacturer: manufacturer || null, model_name: model_name || null, spec_summary: spec_summary || null, quantity: quantity ?? null, year_installed: year_installed ?? null, status: status || null, condition_grade: condition_grade || null, daily_capacity: daily_capacity || null, notes: notes || null } });
    if (!result.length) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });
    res.json({ success: true, data: result[0], message: '장비 수정 완료' });
  } catch (error) {
    logger.error('Update company general equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 수정 실패' } });
  }
};

const deleteCompanyGeneralEquipment = async (req, res) => {
  try {
    await sequelize.query(`UPDATE company_general_equipment SET is_active = false, updated_at = NOW() WHERE id = :id`, { replacements: { id: req.params.id } });
    res.json({ success: true, message: '장비 삭제 완료' });
  } catch (error) {
    logger.error('Delete company general equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 삭제 실패' } });
  }
};

// ============================================================
// 분석 API
// ============================================================

const getGeneralEquipmentAnalytics = async (req, res) => {
  try {
    const { company_type } = req.query;
    let companyFilter = '';
    if (company_type && company_type !== 'all') companyFilter = `AND co.company_type = '${company_type}'`;

    // 1) 업체별 장비 보유 요약
    const [companySummary] = await sequelize.query(`
      SELECT co.id as company_id, co.company_name, co.company_type,
        COUNT(ce.id) as total_equipment,
        COUNT(DISTINCT ce.category_id) as category_count,
        SUM(ce.quantity) as total_quantity
      FROM companies co
      LEFT JOIN company_general_equipment ce ON ce.company_id = co.id AND ce.is_active = true
      WHERE co.is_active = true ${companyFilter}
      GROUP BY co.id, co.company_name, co.company_type
      HAVING COUNT(ce.id) > 0
      ORDER BY total_equipment DESC
    `);

    // 2) 카테고리별 분포
    const [categoryDist] = await sequelize.query(`
      SELECT cat.category_code, cat.category_name, cat.applicable_to,
        COUNT(ce.id) as equipment_count,
        SUM(ce.quantity) as total_quantity,
        COUNT(DISTINCT ce.company_id) as company_count
      FROM general_equipment_category cat
      LEFT JOIN company_general_equipment ce ON ce.category_id = cat.id AND ce.is_active = true
      LEFT JOIN companies co ON co.id = ce.company_id ${companyFilter}
      WHERE cat.is_active = true
      GROUP BY cat.id, cat.category_code, cat.category_name, cat.applicable_to
      ORDER BY cat.sort_order
    `);

    // 3) 제조사별 분포
    const [manufacturerDist] = await sequelize.query(`
      SELECT ce.manufacturer, COUNT(*) as count, SUM(ce.quantity) as total_quantity
      FROM company_general_equipment ce
      JOIN companies co ON co.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true AND ce.manufacturer IS NOT NULL AND ce.manufacturer != ''
      GROUP BY ce.manufacturer
      ORDER BY count DESC
      LIMIT 20
    `);

    // 4) 상태별 분포
    const [statusDist] = await sequelize.query(`
      SELECT ce.status, COUNT(*) as count
      FROM company_general_equipment ce
      JOIN companies co ON co.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true
      GROUP BY ce.status
    `);

    // 5) 전체 요약
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT ce.company_id) as companies_with_equipment,
        COUNT(ce.id) as total_records,
        SUM(ce.quantity) as total_quantity,
        COUNT(DISTINCT ce.category_id) as categories_used
      FROM company_general_equipment ce
      JOIN companies co ON co.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true
    `);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {},
        companySummary,
        categoryDistribution: categoryDist,
        manufacturerDistribution: manufacturerDist,
        statusDistribution: statusDist
      }
    });
  } catch (error) {
    logger.error('General equipment analytics error:', error);
    res.status(500).json({ success: false, error: { message: '장비 분석 조회 실패' } });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getGeneralMasters,
  createGeneralMaster,
  updateGeneralMaster,
  deleteGeneralMaster,
  getCompanyGeneralEquipments,
  addCompanyGeneralEquipment,
  updateCompanyGeneralEquipment,
  deleteCompanyGeneralEquipment,
  getGeneralEquipmentAnalytics
};
