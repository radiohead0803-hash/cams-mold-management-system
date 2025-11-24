const { Company, User, Mold, MoldSpecification, sequelize } = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 회사 목록 조회 (제작처/생산처 통합)
 */
const getCompanies = async (req, res) => {
  try {
    const { 
      company_type, 
      is_active, 
      contract_status,
      search,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    const where = {};
    
    // 회사 유형 필터 (maker, plant)
    if (company_type) {
      where.company_type = company_type;
    }
    
    // 활성 상태 필터
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    
    // 계약 상태 필터
    if (contract_status) {
      where.contract_status = contract_status;
    }
    
    // 검색 (회사명, 회사코드)
    if (search) {
      where[Op.or] = [
        { company_name: { [Op.iLike]: `%${search}%` } },
        { company_code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const companies = await Company.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username', 'name', 'email', 'user_type', 'is_active']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: companies.count,
        items: companies.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 목록 조회 실패' }
    });
  }
};

/**
 * 회사 상세 조회
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username', 'name', 'email', 'phone', 'user_type', 'is_active']
        },
        {
          model: Mold,
          as: 'makerMolds',
          attributes: ['id', 'mold_code', 'mold_name', 'status'],
          where: { is_active: true },
          required: false
        },
        {
          model: Mold,
          as: 'plantMolds',
          attributes: ['id', 'mold_code', 'mold_name', 'status'],
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Get company by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 조회 실패' }
    });
  }
};

/**
 * 자동 업체 코드 생성
 */
const generateCompanyCode = async (company_type) => {
  const prefix = company_type === 'maker' ? 'MKR' : 'PLT';
  
  // 해당 타입의 마지막 코드 조회
  const lastCompany = await Company.findOne({
    where: { 
      company_type,
      company_code: { [Op.like]: `${prefix}-%` }
    },
    order: [['company_code', 'DESC']]
  });

  let nextNumber = 1;
  if (lastCompany) {
    // 마지막 코드에서 숫자 부분 추출 (예: MKR-003 → 3)
    const match = lastCompany.company_code.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }

  // 3자리 숫자로 포맷 (예: 1 → 001)
  const formattedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}-${formattedNumber}`;
};

/**
 * 회사 등록 (제작처/생산처)
 */
const createCompany = async (req, res) => {
  try {
    let {
      company_code,
      company_name,
      company_type,
      business_number,
      representative,
      phone,
      fax,
      email,
      address,
      address_detail,
      postal_code,
      latitude,
      longitude,
      manager_name,
      manager_phone,
      manager_email,
      contract_start_date,
      contract_end_date,
      production_capacity,
      equipment_list,
      certifications,
      specialties,
      production_lines,
      injection_machines,
      daily_capacity,
      notes
    } = req.body;

    // 필수 필드 검증
    if (!company_name || !company_type) {
      return res.status(400).json({
        success: false,
        error: { message: '회사명, 회사 유형은 필수입니다' }
      });
    }

    // 회사 유형 검증
    if (!['maker', 'plant'].includes(company_type)) {
      return res.status(400).json({
        success: false,
        error: { message: '회사 유형은 maker 또는 plant여야 합니다' }
      });
    }

    // 업체 코드 자동 생성 (제공되지 않은 경우)
    if (!company_code) {
      company_code = await generateCompanyCode(company_type);
      logger.info(`Auto-generated company code: ${company_code}`);
    }

    // 중복 확인
    const existingCompany = await Company.findOne({ 
      where: { 
        [Op.or]: [
          { company_code },
          { company_name }
        ]
      } 
    });
    
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: { message: '이미 등록된 회사 코드 또는 회사명입니다' }
      });
    }

    const company = await Company.create({
      company_code,
      company_name,
      company_type,
      business_number,
      representative,
      phone,
      fax,
      email,
      address,
      address_detail,
      postal_code,
      latitude,
      longitude,
      manager_name,
      manager_phone,
      manager_email,
      contract_start_date,
      contract_end_date,
      contract_status: 'active',
      production_capacity,
      equipment_list,
      certifications,
      specialties,
      production_lines,
      injection_machines,
      daily_capacity,
      notes,
      is_active: true,
      registered_by: req.user?.id
    });

    logger.info(`Company created: ${company.company_code} (${company.company_name})`);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Create company error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 등록 실패' }
    });
  }
};

/**
 * 회사 정보 수정
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    // company_code와 company_type은 수정 불가
    delete updateData.company_code;
    delete updateData.company_type;
    delete updateData.id;
    delete updateData.created_at;

    updateData.updated_at = new Date();

    await company.update(updateData);

    logger.info(`Company updated: ${company.company_code} (${company.company_name})`);

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 정보 수정 실패' }
    });
  }
};

/**
 * 회사 비활성화 (소프트 삭제)
 */
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    // 활성 금형이 있는지 확인
    const activeMoldsCount = await Mold.count({
      where: {
        [Op.or]: [
          { maker_company_id: id },
          { plant_company_id: id }
        ],
        status: { [Op.in]: ['active', 'in_production'] }
      }
    });

    if (activeMoldsCount > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: '활성 금형이 있어 비활성화할 수 없습니다',
          active_molds: activeMoldsCount
        }
      });
    }

    // 소프트 삭제
    await company.update({ 
      is_active: false,
      updated_at: new Date()
    });

    logger.info(`Company deactivated: ${company.company_code} (${company.company_name})`);

    res.json({
      success: true,
      data: { message: '회사가 비활성화되었습니다' }
    });
  } catch (error) {
    logger.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 비활성화 실패' }
    });
  }
};

/**
 * 회사 통계 조회
 */
const getCompanyStats = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    let stats = {};

    if (company.company_type === 'maker') {
      // 제작처 통계
      const makerMolds = await Mold.findAll({
        where: { maker_company_id: id },
        attributes: ['status']
      });

      const makerSpecs = await MoldSpecification.findAll({
        where: { maker_company_id: id },
        attributes: ['status']
      });

      stats = {
        total_molds: makerMolds.length,
        active_molds: makerMolds.filter(m => m.status === 'active').length,
        repair_molds: makerMolds.filter(m => m.status === 'repair').length,
        total_specifications: makerSpecs.length,
        in_production: makerSpecs.filter(s => s.status === 'in_production').length,
        completed: makerSpecs.filter(s => s.status === 'completed').length
      };
    } else if (company.company_type === 'plant') {
      // 생산처 통계
      const plantMolds = await Mold.findAll({
        where: { plant_company_id: id },
        attributes: ['status']
      });

      stats = {
        total_molds: plantMolds.length,
        active_molds: plantMolds.filter(m => m.status === 'active').length,
        in_production: plantMolds.filter(m => m.status === 'in_production').length,
        maintenance: plantMolds.filter(m => m.status === 'maintenance').length,
        idle: plantMolds.filter(m => m.status === 'idle').length
      };
    }

    res.json({
      success: true,
      data: {
        company_info: {
          id: company.id,
          company_code: company.company_code,
          company_name: company.company_name,
          company_type: company.company_type
        },
        stats
      }
    });
  } catch (error) {
    logger.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 통계 조회 실패' }
    });
  }
};

/**
 * 전체 업체 통계 조회 (대시보드용)
 */
const getAllCompaniesStats = async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_companies,
        COUNT(CASE WHEN company_type = 'maker' THEN 1 END) as total_makers,
        COUNT(CASE WHEN company_type = 'plant' THEN 1 END) as total_plants,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_companies,
        COUNT(CASE WHEN company_type = 'maker' AND is_active = true THEN 1 END) as active_makers,
        COUNT(CASE WHEN company_type = 'plant' AND is_active = true THEN 1 END) as active_plants,
        ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 2) as avg_rating,
        ROUND(AVG(CASE WHEN company_type = 'maker' AND rating IS NOT NULL THEN rating END), 2) as avg_maker_rating,
        ROUND(AVG(CASE WHEN company_type = 'plant' AND rating IS NOT NULL THEN rating END), 2) as avg_plant_rating,
        SUM(total_molds) as total_molds_managed,
        SUM(active_molds) as total_active_molds
      FROM companies;
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    logger.error('Get all companies stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: '전체 업체 통계 조회 실패' }
    });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  getAllCompaniesStats
};
