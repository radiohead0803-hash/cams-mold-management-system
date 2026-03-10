const { EquipmentMaster, CompanyEquipment, Company, User, sequelize } = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// ============================================================
// 장비 마스터 (기초정보) CRUD
// ============================================================

/**
 * 장비 마스터 목록 조회
 */
const getEquipmentMasters = async (req, res) => {
  try {
    const { equipment_type, manufacturer, search, page = 1, limit = 100 } = req.query;
    const where = { is_active: true };

    if (equipment_type) where.equipment_type = equipment_type;
    if (manufacturer) where.manufacturer = manufacturer;
    if (search) {
      where[Op.or] = [
        { manufacturer: { [Op.iLike]: `%${search}%` } },
        { model_name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await EquipmentMaster.findAndCountAll({
      where,
      order: [['manufacturer', 'ASC'], ['tonnage', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Get equipment masters error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 조회 실패' } });
  }
};

/**
 * 장비 마스터 단건 조회
 */
const getEquipmentMasterById = async (req, res) => {
  try {
    const master = await EquipmentMaster.findByPk(req.params.id);
    if (!master) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });
    res.json({ success: true, data: master });
  } catch (error) {
    logger.error('Get equipment master by id error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 조회 실패' } });
  }
};

/**
 * 장비 마스터 등록
 */
const createEquipmentMaster = async (req, res) => {
  try {
    const { equipment_type, manufacturer, model_name, tonnage, spec_info, description } = req.body;
    if (!manufacturer) return res.status(400).json({ success: false, error: { message: '제조사는 필수입니다' } });

    const master = await EquipmentMaster.create({
      equipment_type: equipment_type || 'injection_machine',
      manufacturer,
      model_name,
      tonnage: tonnage ? parseInt(tonnage) : null,
      spec_info: spec_info || {},
      description,
      created_by: req.user?.id
    });

    res.status(201).json({ success: true, data: master, message: '장비 마스터 등록 완료' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, error: { message: '동일한 장비가 이미 등록되어 있습니다' } });
    }
    logger.error('Create equipment master error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 등록 실패' } });
  }
};

/**
 * 장비 마스터 수정
 */
const updateEquipmentMaster = async (req, res) => {
  try {
    const master = await EquipmentMaster.findByPk(req.params.id);
    if (!master) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });

    const { manufacturer, model_name, tonnage, spec_info, description, is_active } = req.body;
    await master.update({
      ...(manufacturer !== undefined && { manufacturer }),
      ...(model_name !== undefined && { model_name }),
      ...(tonnage !== undefined && { tonnage: tonnage ? parseInt(tonnage) : null }),
      ...(spec_info !== undefined && { spec_info }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
      updated_at: new Date()
    });

    res.json({ success: true, data: master, message: '장비 마스터 수정 완료' });
  } catch (error) {
    logger.error('Update equipment master error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 수정 실패' } });
  }
};

/**
 * 장비 마스터 삭제 (비활성화)
 */
const deleteEquipmentMaster = async (req, res) => {
  try {
    const master = await EquipmentMaster.findByPk(req.params.id);
    if (!master) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });
    await master.update({ is_active: false, updated_at: new Date() });
    res.json({ success: true, message: '장비 마스터 비활성화 완료' });
  } catch (error) {
    logger.error('Delete equipment master error:', error);
    res.status(500).json({ success: false, error: { message: '장비 마스터 삭제 실패' } });
  }
};

/**
 * 제조사 목록 (드롭다운용)
 */
const getManufacturers = async (req, res) => {
  try {
    const { equipment_type } = req.query;
    const where = { is_active: true };
    if (equipment_type) where.equipment_type = equipment_type;

    const [rows] = await sequelize.query(`
      SELECT DISTINCT manufacturer FROM equipment_master
      WHERE is_active = true ${equipment_type ? `AND equipment_type = '${equipment_type}'` : ''}
      ORDER BY manufacturer
    `);

    res.json({ success: true, data: rows.map(r => r.manufacturer) });
  } catch (error) {
    logger.error('Get manufacturers error:', error);
    res.status(500).json({ success: false, error: { message: '제조사 목록 조회 실패' } });
  }
};

// ============================================================
// 업체별 보유장비 CRUD
// ============================================================

/**
 * 업체별 보유장비 목록 조회
 */
const getCompanyEquipments = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { equipment_type, status } = req.query;
    const where = { company_id, is_active: true };

    if (equipment_type) where.equipment_type = equipment_type;
    if (status) where.status = status;

    const equipments = await CompanyEquipment.findAll({
      where,
      include: [
        { model: EquipmentMaster, as: 'master', attributes: ['id', 'manufacturer', 'model_name', 'tonnage', 'description'] }
      ],
      order: [['tonnage', 'ASC'], ['manufacturer', 'ASC']]
    });

    res.json({ success: true, data: equipments });
  } catch (error) {
    logger.error('Get company equipments error:', error);
    res.status(500).json({ success: false, error: { message: '보유장비 조회 실패' } });
  }
};

/**
 * 내 업체 보유장비 목록 조회
 */
const getMyCompanyEquipments = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '소속 업체가 없습니다' } });

    const { equipment_type, status } = req.query;
    const where = { company_id: companyId, is_active: true };
    if (equipment_type) where.equipment_type = equipment_type;
    if (status) where.status = status;

    const equipments = await CompanyEquipment.findAll({
      where,
      include: [
        { model: EquipmentMaster, as: 'master', attributes: ['id', 'manufacturer', 'model_name', 'tonnage', 'description'] }
      ],
      order: [['tonnage', 'ASC'], ['manufacturer', 'ASC']]
    });

    res.json({ success: true, data: equipments });
  } catch (error) {
    logger.error('Get my company equipments error:', error);
    res.status(500).json({ success: false, error: { message: '보유장비 조회 실패' } });
  }
};

/**
 * 보유장비 등록 (기초정보 선택 또는 수동입력)
 */
const addCompanyEquipment = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });

    const {
      equipment_master_id, equipment_type, manufacturer, model_name,
      tonnage, serial_number, year_installed, status, daily_capacity,
      monthly_capacity, spec_info, notes
    } = req.body;

    // 마스터에서 선택한 경우 마스터 정보로 채움
    let finalData = {
      company_id: companyId,
      equipment_master_id: equipment_master_id || null,
      equipment_type: equipment_type || 'injection_machine',
      manufacturer,
      model_name,
      tonnage: tonnage ? parseInt(tonnage) : null,
      serial_number,
      year_installed: year_installed ? parseInt(year_installed) : null,
      status: status || 'active',
      daily_capacity: daily_capacity ? parseInt(daily_capacity) : null,
      monthly_capacity: monthly_capacity ? parseInt(monthly_capacity) : null,
      spec_info: spec_info || {},
      notes,
      created_by: req.user?.id
    };

    if (equipment_master_id) {
      const master = await EquipmentMaster.findByPk(equipment_master_id);
      if (master) {
        finalData.manufacturer = finalData.manufacturer || master.manufacturer;
        finalData.model_name = finalData.model_name || master.model_name;
        finalData.tonnage = finalData.tonnage || master.tonnage;
        finalData.equipment_type = master.equipment_type;
      }
    }

    if (!finalData.manufacturer) {
      return res.status(400).json({ success: false, error: { message: '제조사는 필수입니다' } });
    }

    const equipment = await CompanyEquipment.create(finalData);

    // 마스터에 없는 수동입력이면 마스터에도 자동 등록
    if (!equipment_master_id && finalData.manufacturer && finalData.tonnage) {
      try {
        await EquipmentMaster.findOrCreate({
          where: {
            equipment_type: finalData.equipment_type,
            manufacturer: finalData.manufacturer,
            tonnage: finalData.tonnage,
            is_active: true
          },
          defaults: {
            model_name: finalData.model_name,
            created_by: req.user?.id
          }
        });
      } catch (e) {
        // 마스터 자동등록 실패해도 무시
      }
    }

    res.status(201).json({ success: true, data: equipment, message: '장비 등록 완료' });
  } catch (error) {
    logger.error('Add company equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 등록 실패' } });
  }
};

/**
 * 보유장비 수정
 */
const updateCompanyEquipment = async (req, res) => {
  try {
    const equipment = await CompanyEquipment.findByPk(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });

    const updates = req.body;
    if (updates.tonnage) updates.tonnage = parseInt(updates.tonnage);
    if (updates.year_installed) updates.year_installed = parseInt(updates.year_installed);
    if (updates.daily_capacity) updates.daily_capacity = parseInt(updates.daily_capacity);
    if (updates.monthly_capacity) updates.monthly_capacity = parseInt(updates.monthly_capacity);
    updates.updated_at = new Date();

    await equipment.update(updates);
    res.json({ success: true, data: equipment, message: '장비 수정 완료' });
  } catch (error) {
    logger.error('Update company equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 수정 실패' } });
  }
};

/**
 * 보유장비 삭제 (비활성화)
 */
const deleteCompanyEquipment = async (req, res) => {
  try {
    const equipment = await CompanyEquipment.findByPk(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, error: { message: '장비를 찾을 수 없습니다' } });
    await equipment.update({ is_active: false, updated_at: new Date() });
    res.json({ success: true, message: '장비 삭제 완료' });
  } catch (error) {
    logger.error('Delete company equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 삭제 실패' } });
  }
};

/**
 * 보유장비 일괄 등록 (기초정보에서 선택 + 추가)
 */
const bulkAddCompanyEquipment = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });

    const { equipments } = req.body;
    if (!Array.isArray(equipments) || equipments.length === 0) {
      return res.status(400).json({ success: false, error: { message: '장비 목록이 필요합니다' } });
    }

    const created = [];
    for (const eq of equipments) {
      const record = await CompanyEquipment.create({
        company_id: companyId,
        equipment_master_id: eq.equipment_master_id || null,
        equipment_type: eq.equipment_type || 'injection_machine',
        manufacturer: eq.manufacturer,
        model_name: eq.model_name,
        tonnage: eq.tonnage ? parseInt(eq.tonnage) : null,
        serial_number: eq.serial_number,
        year_installed: eq.year_installed ? parseInt(eq.year_installed) : null,
        status: eq.status || 'active',
        daily_capacity: eq.daily_capacity ? parseInt(eq.daily_capacity) : null,
        monthly_capacity: eq.monthly_capacity ? parseInt(eq.monthly_capacity) : null,
        notes: eq.notes,
        created_by: req.user?.id
      });
      created.push(record);
    }

    res.status(201).json({ success: true, data: created, message: `${created.length}개 장비 등록 완료` });
  } catch (error) {
    logger.error('Bulk add company equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 일괄등록 실패' } });
  }
};

// ============================================================
// 장비보유/캐파 분석 API
// ============================================================

/**
 * 전체 업체 장비보유 현황 통계
 */
const getEquipmentAnalytics = async (req, res) => {
  try {
    const { company_type } = req.query; // plant, maker, all

    let companyFilter = '';
    if (company_type && company_type !== 'all') {
      companyFilter = `AND c.company_type = '${company_type}'`;
    }

    // 1) 업체별 장비 보유 요약
    const [companyEquipmentSummary] = await sequelize.query(`
      SELECT 
        c.id as company_id, c.company_name, c.company_type,
        COUNT(ce.id) as total_equipment,
        COUNT(ce.id) FILTER (WHERE ce.equipment_type = 'injection_machine') as injection_machines,
        COALESCE(SUM(ce.daily_capacity), 0) as total_daily_capacity,
        COALESCE(SUM(ce.monthly_capacity), 0) as total_monthly_capacity,
        COALESCE(MIN(ce.tonnage), 0) as min_tonnage,
        COALESCE(MAX(ce.tonnage), 0) as max_tonnage,
        COALESCE(AVG(ce.tonnage)::INTEGER, 0) as avg_tonnage
      FROM companies c
      LEFT JOIN company_equipment ce ON ce.company_id = c.id AND ce.is_active = true
      WHERE c.is_active = true ${companyFilter}
      GROUP BY c.id, c.company_name, c.company_type
      ORDER BY total_equipment DESC
    `);

    // 2) 제조사별 분포
    const [manufacturerDist] = await sequelize.query(`
      SELECT 
        ce.manufacturer, COUNT(*) as count,
        COALESCE(AVG(ce.tonnage)::INTEGER, 0) as avg_tonnage,
        MIN(ce.tonnage) as min_tonnage, MAX(ce.tonnage) as max_tonnage
      FROM company_equipment ce
      JOIN companies c ON c.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true
      GROUP BY ce.manufacturer
      ORDER BY count DESC
    `);

    // 3) 톤수별 분포
    const [tonnageDist] = await sequelize.query(`
      SELECT 
        CASE
          WHEN ce.tonnage < 200 THEN '~200T'
          WHEN ce.tonnage < 500 THEN '200~500T'
          WHEN ce.tonnage < 1000 THEN '500~1000T'
          WHEN ce.tonnage < 1500 THEN '1000~1500T'
          ELSE '1500T~'
        END as tonnage_range,
        COUNT(*) as count
      FROM company_equipment ce
      JOIN companies c ON c.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true AND ce.tonnage IS NOT NULL
      GROUP BY tonnage_range
      ORDER BY MIN(ce.tonnage)
    `);

    // 4) 장비 상태별 분포
    const [statusDist] = await sequelize.query(`
      SELECT ce.status, COUNT(*) as count
      FROM company_equipment ce
      JOIN companies c ON c.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true
      GROUP BY ce.status
      ORDER BY count DESC
    `);

    // 5) 전체 요약
    const [totalSummary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT ce.company_id) as companies_with_equipment,
        COUNT(ce.id) as total_equipment,
        COALESCE(SUM(ce.daily_capacity), 0) as total_daily_capacity,
        COALESCE(SUM(ce.monthly_capacity), 0) as total_monthly_capacity
      FROM company_equipment ce
      JOIN companies c ON c.id = ce.company_id ${companyFilter}
      WHERE ce.is_active = true
    `);

    res.json({
      success: true,
      data: {
        summary: totalSummary[0] || {},
        companyEquipmentSummary,
        manufacturerDistribution: manufacturerDist,
        tonnageDistribution: tonnageDist,
        statusDistribution: statusDist
      }
    });
  } catch (error) {
    logger.error('Get equipment analytics error:', error);
    res.status(500).json({ success: false, error: { message: '장비 분석 조회 실패' } });
  }
};

module.exports = {
  getEquipmentMasters,
  getEquipmentMasterById,
  createEquipmentMaster,
  updateEquipmentMaster,
  deleteEquipmentMaster,
  getManufacturers,
  getCompanyEquipments,
  getMyCompanyEquipments,
  addCompanyEquipment,
  updateCompanyEquipment,
  deleteCompanyEquipment,
  bulkAddCompanyEquipment,
  getEquipmentAnalytics
};
