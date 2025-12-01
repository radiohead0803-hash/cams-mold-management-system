const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { CheckItemMaster, CheckGuideMaterial } = require('../models/newIndex');
const logger = require('../utils/logger');

// 본사 관리자 및 금형개발 담당자만 접근 가능
router.use(authenticate, authorize(['system_admin', 'mold_developer']));

/**
 * GET /api/v1/hq/check-items
 * 점검항목 마스터 목록 조회
 */
router.get('/check-items', async (req, res) => {
  try {
    const { category, is_active } = req.query;

    const where = {};
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const items = await CheckItemMaster.findAll({
      where,
      include: [
        {
          association: 'guideMaterials',
          attributes: ['id', 'material_type', 'file_url', 'description']
        }
      ],
      order: [['order_index', 'ASC'], ['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        items
      }
    });

  } catch (error) {
    logger.error('Check items list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '점검항목 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/check-items
 * 점검항목 마스터 추가
 */
router.post('/check-items', async (req, res) => {
  try {
    const { category, item_name, description, order_index } = req.body;

    if (!category || !item_name) {
      return res.status(400).json({
        success: false,
        error: {
          message: '카테고리와 항목명은 필수입니다.'
        }
      });
    }

    const item = await CheckItemMaster.create({
      category,
      item_name,
      description: description || null,
      order_index: order_index || 0,
      is_active: true
    });

    logger.info(`Check item created: ${item_name} by user ${req.user.id}`);

    return res.status(201).json({
      success: true,
      data: {
        item
      }
    });

  } catch (error) {
    logger.error('Check item create error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '점검항목 추가 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PUT /api/v1/hq/check-items/:id
 * 점검항목 마스터 수정
 */
router.put('/check-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, item_name, description, order_index } = req.body;

    const item = await CheckItemMaster.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '점검항목을 찾을 수 없습니다.'
        }
      });
    }

    if (category) item.category = category;
    if (item_name) item.item_name = item_name;
    if (description !== undefined) item.description = description;
    if (order_index !== undefined) item.order_index = order_index;

    await item.save();

    logger.info(`Check item updated: ${item.item_name} by user ${req.user.id}`);

    return res.json({
      success: true,
      data: {
        item
      }
    });

  } catch (error) {
    logger.error('Check item update error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '점검항목 수정 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PATCH /api/v1/hq/check-items/:id/disable
 * 점검항목 마스터 비활성화
 */
router.patch('/check-items/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await CheckItemMaster.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '점검항목을 찾을 수 없습니다.'
        }
      });
    }

    item.is_active = false;
    await item.save();

    logger.info(`Check item disabled: ${item.item_name} by user ${req.user.id}`);

    return res.json({
      success: true,
      data: {
        item
      }
    });

  } catch (error) {
    logger.error('Check item disable error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '점검항목 비활성화 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/check-items/:id/guide
 * 점검항목 가이드 자료 추가
 */
router.post('/check-items/:id/guide', async (req, res) => {
  try {
    const { id } = req.params;
    const { material_type, file_url, description } = req.body;

    const item = await CheckItemMaster.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '점검항목을 찾을 수 없습니다.'
        }
      });
    }

    const guide = await CheckGuideMaterial.create({
      check_item_id: id,
      material_type: material_type || 'image',
      file_url,
      description: description || null
    });

    return res.status(201).json({
      success: true,
      data: {
        guide
      }
    });

  } catch (error) {
    logger.error('Check guide create error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '가이드 자료 추가 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
