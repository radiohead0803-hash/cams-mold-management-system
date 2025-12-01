const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ProductionQuantity, Mold } = require('../models/newIndex');
const logger = require('../utils/logger');

// 생산처만 접근 가능
router.use(authenticate, authorize(['plant']));

/**
 * POST /api/v1/plant/production
 * 생산 수량 입력 및 타수 업데이트
 * Body: { moldId, productionDate, quantity, notes }
 */
router.post('/production', async (req, res) => {
  try {
    const userId = req.user.id;
    const { moldId, productionDate, quantity, notes } = req.body;

    // 입력 검증
    if (!moldId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '금형 ID와 유효한 생산 수량이 필요합니다.'
        }
      });
    }

    // 금형 존재 확인
    const mold = await Mold.findByPk(moldId);
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          message: '금형을 찾을 수 없습니다.'
        }
      });
    }

    // 생산 수량 기록 생성
    const record = await ProductionQuantity.create({
      mold_id: moldId,
      production_date: productionDate || new Date(),
      quantity: parseInt(quantity),
      notes: notes || null,
      created_at: new Date()
    });

    // 금형 누적 타수 업데이트
    const previousShots = mold.current_shots || 0;
    mold.current_shots = previousShots + parseInt(quantity);
    await mold.save();

    logger.info(`Production recorded: Mold ${mold.mold_code}, Quantity ${quantity}, Total shots ${mold.current_shots}`);

    return res.status(201).json({
      success: true,
      data: {
        record: {
          id: record.id,
          mold_id: moldId,
          production_date: record.production_date,
          quantity: record.quantity,
          created_at: record.created_at
        },
        mold: {
          id: mold.id,
          mold_code: mold.mold_code,
          previous_shots: previousShots,
          current_shots: mold.current_shots,
          target_shots: mold.target_shots,
          progress_percentage: mold.target_shots > 0 
            ? ((mold.current_shots / mold.target_shots) * 100).toFixed(2)
            : 0
        }
      }
    });

  } catch (error) {
    logger.error('Production record error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '생산 수량 기록 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/plant/production/history
 * 생산 이력 조회
 * Query: moldId, startDate, endDate
 */
router.get('/production/history', async (req, res) => {
  try {
    const { moldId, startDate, endDate } = req.query;

    const where = {};
    if (moldId) where.mold_id = moldId;
    if (startDate || endDate) {
      where.production_date = {};
      if (startDate) where.production_date[require('sequelize').Op.gte] = new Date(startDate);
      if (endDate) where.production_date[require('sequelize').Op.lte] = new Date(endDate);
    }

    const records = await ProductionQuantity.findAll({
      where,
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        }
      ],
      order: [['production_date', 'DESC']],
      limit: 100
    });

    return res.json({
      success: true,
      data: {
        records
      }
    });

  } catch (error) {
    logger.error('Production history error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '생산 이력 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
