const { MoldSpecification, Mold, User, Company } = require('../models/newIndex');
const logger = require('../utils/logger');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

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
      part_number,
      part_name,
      car_model,
      car_year,
      mold_type,
      cavity_count,
      material,
      tonnage,
      target_maker_id: null, // User ID가 필요하므로 null로 설정
      maker_company_id: maker_company_id || null,
      plant_company_id: plant_company_id || null,
      development_stage: development_stage || '개발',
      production_stage: production_stage || '시제',
      order_date: order_date || new Date(),
      target_delivery_date,
      estimated_cost,
      notes,
      part_images: part_images || null,
      status: 'draft', // 초안
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

/**
 * 부품 사진 업로드
 */
const uploadPartImages = async (req, res) => {
  try {
    const { id } = req.params;

    // 파일 업로드 확인
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '업로드할 파일이 없습니다' }
      });
    }

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      // 업로드된 파일 삭제
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    // 기존 이미지 배열 가져오기
    const existingImages = specification.part_images || [];

    // 새 이미지 정보 생성
    const newImages = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploaded_at: new Date().toISOString(),
      uploaded_by: req.user.id
    }));

    // 이미지 배열 업데이트
    const updatedImages = [...existingImages, ...newImages];

    await specification.update({
      part_images: updatedImages,
      updated_at: new Date()
    });

    logger.info(`Part images uploaded for specification ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        images: newImages,
        total: updatedImages.length,
        message: `${newImages.length}개의 사진이 업로드되었습니다`
      }
    });
  } catch (error) {
    logger.error('Upload part images error:', error);
    // 에러 발생 시 업로드된 파일 삭제
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          logger.error('Failed to delete file:', err);
        }
      });
    }
    res.status(500).json({
      success: false,
      error: { message: '사진 업로드 실패', details: error.message }
    });
  }
};

/**
 * 부품 사진 삭제
 */
const deletePartImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;

    const specification = await MoldSpecification.findByPk(id);

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    const images = specification.part_images || [];
    const index = parseInt(imageIndex);

    if (index < 0 || index >= images.length) {
      return res.status(400).json({
        success: false,
        error: { message: '잘못된 이미지 인덱스입니다' }
      });
    }

    // 파일 시스템에서 삭제
    const imageToDelete = images[index];
    const uploadDir = process.env.UPLOAD_PATH || 'uploads/';
    const filename = path.basename(imageToDelete.url);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 배열에서 제거
    images.splice(index, 1);

    await specification.update({
      part_images: images,
      updated_at: new Date()
    });

    logger.info(`Part image deleted from specification ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        remaining: images.length,
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
  uploadPartImages,
  deletePartImage
};
