const express = require('express');
const router = express.Router();
const { DailyCheck, DailyCheckItem, Mold, User, ProductionQuantity, MoldSpecification, sequelize } = require('../models/newIndex');
const { Op } = require('sequelize');

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
      // 금형 정보 조회 (캐비티 수, 현재 타수)
      const mold = await Mold.findByPk(mold_id, { transaction: t });
      if (!mold) {
        throw new Error('금형을 찾을 수 없습니다.');
      }

      // 타수 계산: 생산수량 / 캐비티 수
      const cavityCount = mold.cavity_count || 1;
      const shotsIncrement = Math.ceil(production_quantity / cavityCount);
      const previousShots = mold.current_shots || 0;
      const newCurrentShots = previousShots + shotsIncrement;

      // 일상점검 생성
      const check = await DailyCheck.create({
        mold_id,
        user_id,
        check_date,
        shift,
        current_shots: newCurrentShots,
        production_quantity,
        gps_latitude,
        gps_longitude,
        status: 'in_progress'
      }, { transaction: t });

      // 생산수량 기록 생성
      await ProductionQuantity.create({
        mold_id,
        daily_check_id: check.id,
        production_date: check_date,
        shift,
        quantity: production_quantity,
        shots_increment: shotsIncrement,
        cavity_count: cavityCount,
        previous_shots: previousShots,
        current_shots: newCurrentShots,
        recorded_by: user_id
      }, { transaction: t });

      // 금형 타수 업데이트
      await mold.update({
        current_shots: newCurrentShots,
        last_check_date: check_date
      }, { transaction: t });

      // 점검 항목 생성
      if (items && items.length > 0) {
        const checkItems = items.map(item => ({
          check_id: check.id,
          ...item
        }));
        await DailyCheckItem.bulkCreate(checkItems, { transaction: t });
      }

      // 점검 스케줄 업데이트 (다음 정기점검 계산)
      await updateInspectionSchedule(mold_id, newCurrentShots, t);

      return { check, shotsIncrement, previousShots, newCurrentShots };
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

/**
 * 점검 스케줄 업데이트 함수
 * - 타수 기반 다음 정기점검 계산
 * - 알람 생성 (90% 도달 시)
 */
async function updateInspectionSchedule(moldId, currentShots, transaction) {
  try {
    const { Alert, Mold } = require('../models/newIndex');
    
    // 금형 정보 조회
    const mold = await Mold.findByPk(moldId, { transaction });
    if (!mold) return;

    // 정기점검 주기 (타수 기준)
    const inspectionIntervals = [20000, 50000, 100000, 200000, 400000, 800000];
    
    // 다음 점검 타수 계산
    let nextInspectionShots = null;
    for (const interval of inspectionIntervals) {
      const nextTarget = Math.ceil(currentShots / interval) * interval;
      if (nextTarget > currentShots) {
        nextInspectionShots = nextTarget;
        break;
      }
    }

    // 금형에 다음 점검 타수 업데이트
    if (nextInspectionShots) {
      await mold.update({
        next_inspection_shots: nextInspectionShots
      }, { transaction });

      // 90% 도달 시 알람 생성
      const threshold = nextInspectionShots * 0.9;
      if (currentShots >= threshold) {
        // 기존 알람 확인 (중복 방지)
        const existingAlert = await Alert.findOne({
          where: {
            mold_id: moldId,
            alert_type: 'inspection_due_shots',
            status: 'pending'
          },
          transaction
        });

        if (!existingAlert) {
          await Alert.create({
            mold_id: moldId,
            alert_type: 'inspection_due_shots',
            priority: 'high',
            title: '정기점검 예정 (타수 기준)',
            message: `현재 타수 ${currentShots.toLocaleString()}회, 다음 점검 ${nextInspectionShots.toLocaleString()}회 (${Math.round(currentShots/nextInspectionShots*100)}% 도달)`,
            status: 'pending',
            created_at: new Date()
          }, { transaction });
        }
      }
    }
  } catch (error) {
    console.error('점검 스케줄 업데이트 오류:', error);
    // 오류가 발생해도 트랜잭션은 계속 진행
  }
}

module.exports = router;
