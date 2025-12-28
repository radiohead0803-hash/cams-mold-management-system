const { 
  DailyCheckItem, 
  DailyCheckItemStatus, 
  ChecklistMasterTemplate,
  ChecklistTemplateItem,
  InspectionPhoto,
  Mold,
  User,
  Alert
} = require('../models/newIndex');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * 일상점검 시작
 * POST /api/v1/checklists/daily/start
 */
const startDailyChecklist = async (req, res) => {
  try {
    const { mold_id, shot_count, location, check_type = 'daily' } = req.body;
    const user_id = req.user.id;

    // 필수 필드 검증
    if (!mold_id || !shot_count) {
      return res.status(400).json({
        success: false,
        error: { message: 'mold_id and shot_count are required' }
      });
    }

    // GPS 위치 검증
    if (location && (!location.lat || !location.lng)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid GPS location format' }
      });
    }

    // 금형 존재 확인
    const mold = await Mold.findByPk(mold_id);
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 체크리스트 템플릿 조회
    const template = await ChecklistMasterTemplate.findOne({
      where: { template_type: check_type, is_active: true },
      include: [{
        model: ChecklistTemplateItem,
        as: 'items',
        order: [['item_order', 'ASC']]
      }]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist template not found' }
      });
    }

    // 체크리스트 생성
    const checklist = await DailyCheckItem.create({
      mold_id,
      checklist_id: uuidv4(),
      check_type,
      shot_count,
      gps_location: location,
      status: 'in_progress',
      extras: {
        template_id: template.id,
        template_version: template.version
      }
    });

    // Shot milestone 체크 및 알림 생성
    const milestones = [20000, 50000, 80000, 100000, 800000];
    if (milestones.includes(shot_count)) {
      await Alert.create({
        mold_id,
        alert_type: 'shot_milestone',
        priority: 'high',
        title: `Shot Milestone Reached: ${shot_count.toLocaleString()}`,
        message: `Mold ${mold.mold_number} has reached ${shot_count.toLocaleString()} shots. Periodic inspection may be required.`,
        target_users: [user_id]
      });
    }

    res.status(201).json({
      success: true,
      data: {
        checklist_id: checklist.checklist_id,
        id: checklist.id,
        mold_id: checklist.mold_id,
        shot_count: checklist.shot_count,
        status: checklist.status,
        template: {
          id: template.id,
          name: template.template_name,
          version: template.version
        },
        items: template.items.map(item => ({
          item_id: item.id,
          category: item.category,
          item_name: item.item_name,
          is_required: item.is_required,
          requires_photo: item.requires_photo,
          guide_text: item.guide_text,
          guide_image_url: item.guide_image_url,
          default_options: item.default_options
        }))
      }
    });
  } catch (error) {
    logger.error('Start daily checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to start checklist' }
    });
  }
};

/**
 * 일상점검 업데이트
 * PATCH /api/v1/checklists/daily/:id
 */
const updateDailyChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_status, confirmed_by, confirmed_at, notes, status } = req.body;

    const checklist = await DailyCheckItem.findByPk(id);
    
    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }

    // 항목별 상태 업데이트
    if (item_status && Array.isArray(item_status)) {
      for (const item of item_status) {
        await DailyCheckItemStatus.upsert({
          daily_check_id: id,
          item_id: item.item_id,
          status: item.status,
          notes: item.notes,
          cleaning_agent: item.cleaning_agent,
          photo_refs: item.photo_refs || []
        });

        // NG 상태인 경우 이슈 생성 (선택적)
        if (item.status === 'ng' && item.create_issue) {
          // MoldIssue 생성 로직 추가 가능
        }
      }
    }

    // 체크리스트 업데이트
    const updateData = {};
    if (notes) updateData.notes = notes;
    if (status) updateData.status = status;
    if (confirmed_by) updateData.confirmed_by = confirmed_by;
    if (confirmed_at) updateData.confirmed_at = confirmed_at;

    await checklist.update(updateData);

    res.json({
      success: true,
      data: {
        id: checklist.id,
        status: checklist.status,
        updated_at: new Date()
      }
    });
  } catch (error) {
    logger.error('Update daily checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update checklist' }
    });
  }
};

/**
 * 일상점검 조회
 * GET /api/v1/checklists/daily/:id
 */
const getDailyChecklist = async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await DailyCheckItem.findByPk(id, {
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_number', 'mold_name', 'product_name']
        },
        {
          model: User,
          as: 'confirmer',
          attributes: ['id', 'name', 'role']
        },
        {
          model: DailyCheckItemStatus,
          as: 'itemStatuses'
        },
        {
          model: InspectionPhoto,
          as: 'photos'
        }
      ]
    });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }

    res.json({
      success: true,
      data: checklist
    });
  } catch (error) {
    logger.error('Get daily checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklist' }
    });
  }
};

/**
 * 체크리스트 히스토리 조회
 * GET /api/v1/checklists/history?mold_id=123
 */
const getChecklistHistory = async (req, res) => {
  try {
    const { mold_id, check_type, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (check_type) where.check_type = check_type;

    const checklists = await DailyCheckItem.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_number', 'mold_name']
        },
        {
          model: User,
          as: 'confirmer',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        total: checklists.count,
        items: checklists.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get checklist history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklist history' }
    });
  }
};

/**
 * 사진 업로드
 * POST /api/v1/checklists/photos
 */
const uploadPhotos = async (req, res) => {
  try {
    const { mold_id, checklist_id, item_status_id, shot_count, metadata } = req.body;
    const user_id = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' }
      });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const photo = await InspectionPhoto.create({
        mold_id: mold_id || null,
        checklist_id: checklist_id || null,
        item_status_id: item_status_id || null,
        file_url: `/uploads/${file.filename}`,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: user_id,
        shot_count: shot_count || null,
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      uploadedPhotos.push({
        id: photo.id,
        file_url: photo.file_url,
        file_type: photo.file_type,
        uploaded_at: photo.uploaded_at
      });
    }

    res.status(201).json({
      success: true,
      data: {
        photos: uploadedPhotos
      }
    });
  } catch (error) {
    logger.error('Upload photos error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload photos' }
    });
  }
};

/**
 * 이관 요청 생성 (placeholder)
 */
const createTransferRequest = async (req, res) => {
  try {
    // Transfer 로직은 transferController에서 처리
    res.status(501).json({
      success: false,
      error: { message: 'Transfer request should use /api/v1/transfers endpoint' }
    });
  } catch (error) {
    logger.error('Create transfer request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create transfer request' }
    });
  }
};

/**
 * 이관 확인 (placeholder)
 */
const confirmTransfer = async (req, res) => {
  try {
    res.status(501).json({
      success: false,
      error: { message: 'Transfer confirmation should use /api/v1/transfers endpoint' }
    });
  } catch (error) {
    logger.error('Confirm transfer error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to confirm transfer' }
    });
  }
};

module.exports = {
  startDailyChecklist,
  updateDailyChecklist,
  getDailyChecklist,
  getChecklistHistory,
  uploadPhotos,
  createTransferRequest,
  confirmTransfer
};
