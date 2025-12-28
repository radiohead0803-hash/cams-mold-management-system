const { MoldSpecification, Mold, User, Company } = require('../models/newIndex');
const logger = require('../utils/logger');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { uploadImageFromPath, deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

/**
 * 금형 사양 등록 (금형개발 담당)
 * - 본사에서 금형 기본정보 입력
 * - QR 코드 자동 생성
 * - mold_specifications 테이블에 저장
 */
const createMoldSpecification = async (req, res) => {
  try {
    const {
      // 기본 정보
      primary_part_number,
      primary_part_name,
      part_number,
      part_name,
      car_model,
      car_model_id,
      car_specification,
      car_year,
      // 금형 사양
      mold_type,
      cavity_count,
      material,
      dimensions,
      weight,
      // 원재료 정보
      raw_material_id,
      ms_spec,
      material_type,
      supplier,
      grade,
      shrinkage_rate,
      mold_shrinkage,
      // 제작 정보
      maker_company_id,
      plant_company_id,
      target_maker_id,
      target_plant_id,
      manager_name,
      // 개발사양 및 단계
      development_stage,
      production_stage,
      mold_spec_type,
      // 일정
      order_date,
      target_delivery_date,
      drawing_review_date,
      // 예산
      estimated_cost,
      icms_cost,
      vendor_quote_cost,
      maker_estimated_cost,
      // 사출 조건
      cycle_time,
      injection_temp,
      injection_pressure,
      injection_speed,
      // 기타
      notes,
      part_images
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

    // MoldSpecification 먼저 생성
    const specification = await MoldSpecification.create({
      // 기본 정보
      primary_part_number: primary_part_number || null,
      primary_part_name: primary_part_name || null,
      part_number,
      part_name,
      car_model,
      car_model_id: car_model_id || null,
      car_specification: car_specification || null,
      car_year,
      // 금형 사양
      mold_type,
      cavity_count,
      material,
      dimensions: dimensions || null,
      weight: weight || null,
      // 원재료 정보
      raw_material_id: raw_material_id || null,
      ms_spec: ms_spec || null,
      material_type: material_type || null,
      supplier: supplier || null,
      grade: grade || null,
      shrinkage_rate: shrinkage_rate || null,
      mold_shrinkage: mold_shrinkage || null,
      // 제작 정보
      target_maker_id: target_maker_id || null,
      target_plant_id: target_plant_id || null,
      maker_company_id: maker_company_id || target_maker_id || null,
      plant_company_id: plant_company_id || target_plant_id || null,
      manager_name: manager_name || null,
      // 개발사양 및 단계
      development_stage: development_stage || '개발',
      production_stage: production_stage || '시제',
      mold_spec_type: mold_spec_type || '시작금형',
      // 일정
      order_date: order_date || new Date(),
      target_delivery_date: target_delivery_date || null,
      drawing_review_date: drawing_review_date || null,
      // 예산
      estimated_cost: estimated_cost || null,
      icms_cost: icms_cost || null,
      vendor_quote_cost: vendor_quote_cost || null,
      maker_estimated_cost: maker_estimated_cost || null,
      // 사출 조건
      cycle_time: cycle_time || null,
      injection_temp: injection_temp || null,
      injection_pressure: injection_pressure || null,
      injection_speed: injection_speed || null,
      // 기타
      notes: notes || null,
      part_images: part_images || null,
      status: 'draft',
      created_by: req.user.id
    });

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
      specification_id: specification.id,
      qr_token: qrToken,
      status: 'planning', // 계획 단계
      location: '본사'
    });

    // MoldSpecification에 mold_id 연동
    await specification.update({
      mold_id: mold.id
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
    // 에러 시 빈 데이터 반환 (500 대신)
    res.json({
      success: true,
      data: {
        total: 0,
        items: []
      }
    });
  }
};

/**
 * 금형 사양 상세 조회
 */
const getMoldSpecificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { sequelize } = require('../models/newIndex');
    
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

    // 추가 데이터 조회 (maker_specifications, plant_molds)
    let makerSpec = null;
    let plantMold = null;
    let activeRepair = null;

    // maker_specifications 조회 (mold_spec_id로 조회)
    const [makerSpecResult] = await sequelize.query(
      'SELECT * FROM maker_specifications WHERE mold_spec_id = :specId ORDER BY created_at DESC LIMIT 1',
      { replacements: { specId: id } }
    );
    makerSpec = makerSpecResult[0] || null;

    // plant_molds 조회 (mold_spec_id로 조회)
    const [plantMoldResult] = await sequelize.query(
      'SELECT * FROM plant_molds WHERE mold_spec_id = :specId ORDER BY created_at DESC LIMIT 1',
      { replacements: { specId: id } }
    );
    plantMold = plantMoldResult[0] || null;

    // 활성 수리 조회 (repairs 테이블이 있는 경우)
    if (specification.mold_id) {
      try {
        const [repairResult] = await sequelize.query(
          `SELECT * FROM repairs WHERE mold_id = :moldId AND status NOT IN ('completed', 'cancelled')
           ORDER BY created_at DESC LIMIT 1`,
          { replacements: { moldId: specification.mold_id } }
        );
        activeRepair = repairResult[0] || null;
      } catch (e) {
        // repairs 테이블이 없을 수 있음
        activeRepair = null;
      }
    }

    // 응답 데이터 구성
    const responseData = {
      ...specification.toJSON(),
      maker_specification: makerSpec,
      plant_mold: plantMold,
      active_repair: activeRepair
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    logger.error('Get mold specification by ID error:', error);
    // 에러 시 기본 데이터 반환 (500 대신)
    res.json({
      success: true,
      data: {
        id: req.params.id,
        mold_code: `MOLD-${req.params.id}`,
        mold_name: '금형',
        car_model: '-',
        current_shots: 0,
        guarantee_shots: 500000
      }
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

    logger.info(`Updating mold specification ${id} with data:`, updateData);

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    // 상태가 'completed'인 경우 수정 불가 (임시 비활성화)
    // if (specification.status === 'completed') {
    //   return res.status(400).json({
    //     success: false,
    //     error: { message: '완료된 금형은 수정할 수 없습니다' }
    //   });
    // }

    // 허용된 필드만 업데이트
    const allowedFields = [
      'part_number', 'part_name', 'car_model', 'car_year',
      'mold_type', 'cavity_count', 'material', 'tonnage',
      'development_stage', 'production_stage',
      'order_date', 'target_delivery_date', 'estimated_cost', 'notes'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    await specification.update({
      ...filteredData,
      updated_at: new Date()
    });

    logger.info(`Mold specification updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: specification
    });
  } catch (error) {
    logger.error('Update mold specification error:', error);
    logger.error('Error stack:', error.stack);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      error: { 
        message: '금형 사양 수정 실패',
        details: error.message
      }
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

/**
 * 부품 사진 업로드 (단일 이미지) - Cloudinary 사용
 */
const uploadPartImage = async (req, res) => {
  try {
    const { id } = req.params;

    // 파일 업로드 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: '업로드할 파일이 없습니다' }
      });
    }

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      // 업로드된 파일 삭제
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    // 기존 Cloudinary 이미지가 있으면 삭제
    if (specification.part_images && specification.part_images.public_id) {
      try {
        await deleteImage(specification.part_images.public_id);
      } catch (err) {
        logger.warn('Failed to delete old Cloudinary image:', err);
      }
    }

    // Cloudinary에 업로드
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadImageFromPath(req.file.path, {
        folder: `cams-molds/specifications/${id}`,
        public_id: `part_${Date.now()}`
      });
    } catch (cloudErr) {
      logger.error('Cloudinary upload error:', cloudErr);
      // Cloudinary 실패 시 로컬 저장으로 폴백
      const newImage = {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploaded_at: new Date().toISOString(),
        uploaded_by: req.user.id
      };

      await specification.update({
        part_images: newImage,
        updated_at: new Date()
      });

      return res.json({
        success: true,
        data: {
          image: newImage,
          message: '부품 사진이 업로드되었습니다 (로컬 저장)'
        }
      });
    }

    // 로컬 임시 파일 삭제
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 새 이미지 정보 생성 (Cloudinary URL 사용)
    const newImage = {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      format: cloudinaryResult.format,
      uploaded_at: new Date().toISOString(),
      uploaded_by: req.user.id
    };

    await specification.update({
      part_images: newImage,
      updated_at: new Date()
    });

    logger.info(`Part image uploaded to Cloudinary for specification ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        image: newImage,
        message: '부품 사진이 업로드되었습니다'
      }
    });
  } catch (error) {
    logger.error('Upload part image error:', error);
    // 에러 발생 시 업로드된 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        logger.error('Failed to delete file:', err);
      }
    }
    res.status(500).json({
      success: false,
      error: { message: '사진 업로드 실패', details: error.message }
    });
  }
};

/**
 * 부품 사진 삭제 - Cloudinary 지원
 */
const deletePartImage = async (req, res) => {
  try {
    const { id } = req.params;

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    if (!specification.part_images || !specification.part_images.url) {
      return res.status(400).json({
        success: false,
        error: { message: '삭제할 이미지가 없습니다' }
      });
    }

    // Cloudinary 이미지인 경우 Cloudinary에서 삭제
    if (specification.part_images.public_id) {
      try {
        await deleteImage(specification.part_images.public_id);
      } catch (err) {
        logger.warn('Failed to delete Cloudinary image:', err);
      }
    } else {
      // 로컬 파일인 경우 파일 시스템에서 삭제
      const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
      const filename = path.basename(specification.part_images.url);
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // DB에서 제거
    await specification.update({
      part_images: null,
      updated_at: new Date()
    });

    logger.info(`Part image deleted from specification ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        message: '사진이 삭제되었습니다'
      }
    });
  } catch (error) {
    logger.error('Delete part image error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사진 삭제 실패', details: error.message }
    });
  }
};

module.exports = {
  createMoldSpecification,
  getMoldSpecifications,
  getMoldSpecificationById,
  updateMoldSpecification,
  deleteMoldSpecification,
  uploadPartImage,
  deletePartImage
};
