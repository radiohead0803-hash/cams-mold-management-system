const { MoldSpecification, Mold, User, Company } = require('../models/newIndex');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * 금형 사양 등록 (금형개발 담당)
 * - 본사에서 금형 기본정보 입력
 * - QR 코드 자동 생성
 * - mold_specifications 테이블에 저장
 */
const createMoldSpecification = async (req, res) => {
  try {
    const {
      part_number,
      part_name,
      car_model,
      car_year,
      mold_type,
      cavity_count,
      material,
      tonnage,
      maker_company_id,
      plant_company_id,
      development_stage,
      production_stage,
      order_date,
      target_delivery_date,
      estimated_cost,
      notes
    } = req.body;

    // 필수 필드 검증
    if (!part_number || !part_name || !car_model) {
      return res.status(400).json({
        success: false,
        error: { message: '부품번호, 부품명, 차종은 필수입니다' }
      });
    }

    // 중복 확인
    const existing = await MoldSpecification.findOne({
      where: { part_number }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: '이미 등록된 부품번호입니다' }
      });
    }

    // QR 코드 생성
    const qrToken = `CAMS-${part_number}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 금형 코드 생성 (M-YYYY-XXX 형식)
    const year = new Date().getFullYear();
    const lastMold = await MoldSpecification.findOne({
      order: [['id', 'DESC']]
    });
    const sequence = lastMold ? (parseInt(lastMold.id) + 1) : 1;
    const moldCode = `M-${year}-${String(sequence).padStart(3, '0')}`;

    // Mold 테이블에 기본 정보 생성
    const mold = await Mold.create({
      mold_code: moldCode,
      mold_name: part_name,
      car_model,
      part_name,
      cavity: cavity_count,
      maker_company_id: maker_company_id || null,
      plant_company_id: plant_company_id || null,
      plant_id: null, // 초기에는 null
      maker_id: null, // 초기에는 null
      qr_token: qrToken,
      status: 'planning', // 계획 단계
      location: '본사',
      created_at: new Date(),
      updated_at: new Date()
    });

    // MoldSpecification 생성
    const specification = await MoldSpecification.create({
      part_number,
      part_name,
      car_model,
      car_year,
      mold_type,
      cavity_count,
      material,
      tonnage,
      target_maker_id: maker_company_id || null,
      maker_company_id: maker_company_id || null,
      plant_company_id: plant_company_id || null,
      development_stage: development_stage || '개발',
      production_stage: production_stage || '시제',
      order_date: order_date || new Date(),
      target_delivery_date,
      estimated_cost,
      notes,
      status: 'draft', // 초안
      mold_id: mold.id,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info(`Mold specification created: ${specification.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        specification,
        mold: {
          id: mold.id,
          mold_code: moldCode,
          qr_token: qrToken
        },
        message: 'QR 코드가 자동으로 생성되었습니다'
      }
    });
  } catch (error) {
    logger.error('Create mold specification error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 등록에 실패했습니다', details: error.message }
    });
  }
};

/**
 * 금형 사양 목록 조회
 */
const getMoldSpecifications = async (req, res) => {
  try {
    const { 
      status, 
      development_stage, 
      target_maker_id,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (development_stage) where.development_stage = development_stage;
    if (target_maker_id) where.target_maker_id = target_maker_id;

    const specifications = await MoldSpecification.findAndCountAll({
      where,
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'qr_token', 'status', 'location']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Company,
          as: 'makerCompany',
          attributes: ['id', 'company_name', 'company_code', 'company_type']
        },
        {
          model: Company,
          as: 'plantCompany',
          attributes: ['id', 'company_name', 'company_code', 'company_type']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: specifications.count,
        items: specifications.rows
      }
    });
  } catch (error) {
    logger.error('Get mold specifications error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 목록 조회 실패' }
    });
  }
};

/**
 * 금형 사양 상세 조회
 */
const getMoldSpecificationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const specification = await MoldSpecification.findByPk(id, {
      include: [
        {
          model: Mold,
          as: 'mold'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Company,
          as: 'makerCompany',
          attributes: ['id', 'company_name', 'company_code', 'company_type', 'manager_name', 'manager_phone']
        },
        {
          model: Company,
          as: 'plantCompany',
          attributes: ['id', 'company_name', 'company_code', 'company_type', 'manager_name', 'manager_phone']
        }
      ]
    });

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    res.json({
      success: true,
      data: specification
    });
  } catch (error) {
    logger.error('Get mold specification by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 조회 실패' }
    });
  }
};

/**
 * 금형 사양 수정
 */
const updateMoldSpecification = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    // 상태가 'completed'인 경우 수정 불가
    if (specification.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: '완료된 금형은 수정할 수 없습니다' }
      });
    }

    await specification.update({
      ...updateData,
      updated_at: new Date()
    });

    logger.info(`Mold specification updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: specification
    });
  } catch (error) {
    logger.error('Update mold specification error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 수정 실패' }
    });
  }
};

/**
 * 금형 사양 삭제 (소프트 삭제)
 */
const deleteMoldSpecification = async (req, res) => {
  try {
    const { id } = req.params;

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    // 상태를 'cancelled'로 변경
    await specification.update({
      status: 'cancelled',
      updated_at: new Date()
    });

    logger.info(`Mold specification deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: { message: '금형 사양이 삭제되었습니다' }
    });
  } catch (error) {
    logger.error('Delete mold specification error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 삭제 실패' }
    });
  }
};

module.exports = {
  createMoldSpecification,
  getMoldSpecifications,
  getMoldSpecificationById,
  updateMoldSpecification,
  deleteMoldSpecification
};
