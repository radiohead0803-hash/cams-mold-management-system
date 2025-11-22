const express = require('express');
const router = express.Router();
const { DailyCheck, DailyCheckItem, Mold, User } = require('../models/newIndex');

/**
 * @route   GET /api/daily-checks
 * @desc    일상점검 목록 조회
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { mold_id, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (status) where.status = status;
    if (start_date && end_date) {
      where.check_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const checks = await DailyCheck.findAndCountAll({
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
          model: DailyCheckItem,
          as: 'items'
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['check_date', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: checks.rows,
      pagination: {
        total: checks.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('일상점검 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '일상점검 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/daily-checks/:id
 * @desc    일상점검 상세 조회
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const check = await DailyCheck.findByPk(req.params.id, {
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
          model: DailyCheckItem,
          as: 'items',
          order: [['display_order', 'ASC']]
        }
      ]
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: '일상점검을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: check
    });
  } catch (error) {
    console.error('일상점검 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '일상점검 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/daily-checks
 * @desc    일상점검 생성
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      mold_id,
      user_id,
      check_date,
      shift,
      current_shots,
      production_quantity,
      gps_latitude,
      gps_longitude,
      items
    } = req.body;

    // 트랜잭션 시작
    const result = await sequelize.transaction(async (t) => {
      // 일상점검 생성
      const check = await DailyCheck.create({
        mold_id,
        user_id,
        check_date,
        shift,
        current_shots,
        production_quantity,
        gps_latitude,
        gps_longitude,
        status: 'in_progress'
      }, { transaction: t });

      // 점검 항목 생성
      if (items && items.length > 0) {
        const checkItems = items.map(item => ({
          check_id: check.id,
          ...item
        }));
        await DailyCheckItem.bulkCreate(checkItems, { transaction: t });
      }

      return check;
    });

    res.status(201).json({
      success: true,
      message: '일상점검이 생성되었습니다.',
      data: result
    });
  } catch (error) {
    console.error('일상점검 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '일상점검 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/daily-checks/:id
 * @desc    일상점검 수정
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const check = await DailyCheck.findByPk(req.params.id);

    if (!check) {
      return res.status(404).json({
        success: false,
        message: '일상점검을 찾을 수 없습니다.'
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
      // 일상점검 업데이트
      await check.update({
        status,
        overall_status,
        notes,
        completed_at,
        approved_by,
        approved_at
      }, { transaction: t });

      // 점검 항목 업데이트
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.id) {
            await DailyCheckItem.update(item, {
              where: { id: item.id },
              transaction: t
            });
          }
        }
      }
    });

    res.json({
      success: true,
      message: '일상점검이 수정되었습니다.',
      data: check
    });
  } catch (error) {
    console.error('일상점검 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '일상점검 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/daily-checks/:id
 * @desc    일상점검 삭제
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const check = await DailyCheck.findByPk(req.params.id);

    if (!check) {
      return res.status(404).json({
        success: false,
        message: '일상점검을 찾을 수 없습니다.'
      });
    }

    await check.destroy();

    res.json({
      success: true,
      message: '일상점검이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('일상점검 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '일상점검 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
