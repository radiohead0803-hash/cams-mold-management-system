const express = require('express');
const router = express.Router();
const { Inspection, InspectionItem, Mold, User } = require('../models/newIndex');
const { Op } = require('sequelize');

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

module.exports = router;
