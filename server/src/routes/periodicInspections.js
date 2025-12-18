const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Inspection, InspectionItem, Mold, User, InspectionPhoto } = require('../models/newIndex');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// 사진 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/inspection-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  }
});

/**
 * @route   GET /api/periodic-inspections
 * @desc    정기점검 목록 조회
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { mold_id, inspection_type, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (inspection_type) where.inspection_type = inspection_type;
    if (status) where.status = status;
    if (start_date && end_date) {
      where.inspection_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const inspections = await Inspection.findAndCountAll({
      where,
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'car_model']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role_group']
        },
        {
          model: InspectionItem,
          as: 'items'
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['inspection_date', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: inspections.rows,
      pagination: {
        total: inspections.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('정기점검 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '정기점검 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/periodic-inspections/:id
 * @desc    정기점검 상세 조회
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id, {
      include: [
        {
          model: Mold,
          as: 'mold'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'role_group']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role_group']
        },
        {
          model: InspectionItem,
          as: 'items',
          order: [['display_order', 'ASC']]
        }
      ]
    });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: '정기점검을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: inspection
    });
  } catch (error) {
    console.error('정기점검 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '정기점검 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/periodic-inspections
 * @desc    정기점검 생성
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      mold_id,
      user_id,
      inspection_type,
      inspection_date,
      current_shots,
      gps_latitude,
      gps_longitude,
      cleaning_method,
      cleaning_ratio,
      items
    } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const inspection = await Inspection.create({
        mold_id,
        user_id,
        inspection_type,
        inspection_date,
        current_shots,
        gps_latitude,
        gps_longitude,
        cleaning_method,
        cleaning_ratio,
        status: 'in_progress'
      }, { transaction: t });

      if (items && items.length > 0) {
        const inspectionItems = items.map(item => ({
          inspection_id: inspection.id,
          ...item
        }));
        await InspectionItem.bulkCreate(inspectionItems, { transaction: t });
      }

      return inspection;
    });

    res.status(201).json({
      success: true,
      message: '정기점검이 생성되었습니다.',
      data: result
    });
  } catch (error) {
    console.error('정기점검 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '정기점검 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/periodic-inspections/:id
 * @desc    정기점검 수정
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: '정기점검을 찾을 수 없습니다.'
      });
    }

    const {
      status,
      overall_status,
      notes,
      completed_at,
      approved_by,
      approved_at,
      items
    } = req.body;

    await sequelize.transaction(async (t) => {
      await inspection.update({
        status,
        overall_status,
        notes,
        completed_at,
        approved_by,
        approved_at
      }, { transaction: t });

      if (items && items.length > 0) {
        for (const item of items) {
          if (item.id) {
            await InspectionItem.update(item, {
              where: { id: item.id },
              transaction: t
            });
          }
        }
      }
    });

    res.json({
      success: true,
      message: '정기점검이 수정되었습니다.',
      data: inspection
    });
  } catch (error) {
    console.error('정기점검 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '정기점검 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/periodic-inspections/mold/:moldId/next
 * @desc    금형의 다음 정기점검 정보 조회
 * @access  Private
 */
router.get('/mold/:moldId/next', async (req, res) => {
  try {
    const mold = await Mold.findByPk(req.params.moldId);
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    const currentShots = mold.current_shots || 0;
    let recommendedType = null;

    if (currentShots >= 100000) {
      recommendedType = '100k';
    } else if (currentShots >= 80000) {
      recommendedType = '80k';
    } else if (currentShots >= 50000) {
      recommendedType = '50k';
    } else if (currentShots >= 20000) {
      recommendedType = '20k';
    }

    // 마지막 점검 조회
    const lastInspection = await Inspection.findOne({
      where: { mold_id: req.params.moldId },
      order: [['inspection_date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        current_shots: currentShots,
        recommended_type: recommendedType,
        last_inspection: lastInspection,
        thresholds: {
          '20k': 20000,
          '50k': 50000,
          '80k': 80000,
          '100k': 100000
        }
      }
    });
  } catch (error) {
    console.error('다음 정기점검 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '다음 정기점검 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/periodic-inspections/:id/photos
 * @desc    정기점검 사진 업로드
 * @access  Private
 */
router.post('/:id/photos', upload.array('photos', 10), async (req, res) => {
  try {
    const inspectionId = req.params.id;
    const { category, description, mold_id, inspection_type } = req.body;
    const userId = req.body.user_id || req.user?.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '업로드할 사진이 없습니다.'
      });
    }

    const inspection = await Inspection.findByPk(inspectionId);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: '정기점검을 찾을 수 없습니다.'
      });
    }

    const photos = [];
    for (const file of req.files) {
      const photo = await InspectionPhoto.create({
        inspection_id: inspectionId,
        mold_id: mold_id || inspection.mold_id,
        inspection_type: inspection_type || inspection.inspection_type,
        category: category || '점검사진',
        description: description || '',
        file_url: `/uploads/inspection-photos/${file.filename}`,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: userId,
        uploaded_at: new Date()
      });
      photos.push(photo);
    }

    res.status(201).json({
      success: true,
      message: `${photos.length}개의 사진이 업로드되었습니다.`,
      data: photos
    });
  } catch (error) {
    console.error('정기점검 사진 업로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '사진 업로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/periodic-inspections/:id/photos
 * @desc    정기점검 사진 목록 조회
 * @access  Private
 */
router.get('/:id/photos', async (req, res) => {
  try {
    const inspectionId = req.params.id;
    const { category } = req.query;

    const where = { inspection_id: inspectionId };
    if (category) where.category = category;

    const photos = await InspectionPhoto.findAll({
      where,
      order: [['uploaded_at', 'DESC']]
    });

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('정기점검 사진 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사진 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/periodic-inspections/:id/photos/:photoId
 * @desc    정기점검 사진 삭제
 * @access  Private
 */
router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await InspectionPhoto.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '사진을 찾을 수 없습니다.'
      });
    }

    // 파일 삭제
    const filePath = path.join(__dirname, '../..', photo.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await photo.destroy();

    res.json({
      success: true,
      message: '사진이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('정기점검 사진 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사진 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/periodic-inspections/checklist-items/:inspectionType
 * @desc    점검 유형별 체크리스트 항목 조회 (세척 항목 포함)
 * @access  Private
 */
router.get('/checklist-items/:inspectionType', async (req, res) => {
  try {
    const { inspectionType } = req.params;
    
    // 점검 유형에 따른 sort_order 범위 결정
    let maxSortOrder;
    switch (inspectionType) {
      case '20000':
      case '20k':
        maxSortOrder = 35; // 20K 항목 + 세척 항목
        break;
      case '50000':
      case '50k':
        maxSortOrder = 55; // 50K 항목 + 세척 항목
        break;
      case '80000':
      case '80k':
        maxSortOrder = 60; // 80K 항목
        break;
      case '100000':
      case '100k':
        maxSortOrder = 999; // 전체 항목
        break;
      default:
        maxSortOrder = 17; // 일상점검 항목
    }

    const items = await sequelize.query(`
      SELECT * FROM checklist_items_master 
      WHERE sort_order <= :maxSortOrder
      ORDER BY sort_order ASC
    `, {
      replacements: { maxSortOrder },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: items,
      inspection_type: inspectionType,
      total: items.length
    });
  } catch (error) {
    console.error('체크리스트 항목 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '체크리스트 항목 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
