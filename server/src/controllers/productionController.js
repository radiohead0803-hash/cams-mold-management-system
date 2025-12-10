const { ProductionQuantity, Mold, DailyCheck, Inspection } = require('../models/newIndex');
const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 생산수량 입력 및 타수 자동 누적
 */
const recordProduction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { mold_id, quantity, production_date, shift, daily_check_id, notes } = req.body;
    const userId = req.user.id;

    // 1. 입력 검증
    if (!mold_id || !quantity || !production_date) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Mold ID, quantity, and production date are required' }
      });
    }

    if (quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Quantity must be greater than 0' }
      });
    }

    // 2. 금형 조회
    const mold = await Mold.findByPk(mold_id, { transaction });
    if (!mold) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 3. 타수 계산
    const cavityCount = mold.cavity || 1;
    const shotsIncrement = Math.floor(quantity / cavityCount);
    const previousShots = mold.current_shots || 0;
    const currentShots = previousShots + shotsIncrement;

    // 4. 생산수량 기록 생성
    const production = await ProductionQuantity.create({
      mold_id,
      daily_check_id,
      production_date,
      shift,
      quantity,
      shots_increment: shotsIncrement,
      cavity_count: cavityCount,
      previous_shots: previousShots,
      current_shots: currentShots,
      recorded_by: userId,
      notes
    }, { transaction });

    // 5. 금형 타수 업데이트
    await mold.update({
      current_shots: currentShots,
      updated_at: new Date()
    }, { transaction });

    // 6. 점검 스케줄 자동 업데이트
    await updateInspectionSchedule(mold, currentShots, transaction);

    // 7. 타수 임계값 체크 및 알람 생성
    await checkShotsThreshold(mold, currentShots, transaction);

    await transaction.commit();

    res.json({
      success: true,
      data: {
        production: {
          id: production.id,
          mold_id: production.mold_id,
          quantity: production.quantity,
          shots_increment: production.shots_increment,
          previous_shots: production.previous_shots,
          current_shots: production.current_shots,
          production_date: production.production_date
        },
        mold: {
          id: mold.id,
          mold_code: mold.mold_code,
          mold_name: mold.mold_name,
          current_shots: currentShots,
          target_shots: mold.target_shots,
          progress: mold.target_shots ? Math.round((currentShots / mold.target_shots) * 100) : 0
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Record production error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to record production' }
    });
  }
};

/**
 * 점검 스케줄 자동 업데이트
 */
async function updateInspectionSchedule(mold, currentShots, transaction) {
  try {
    // 정기점검 스케줄 확인
    const inspections = await Inspection.findAll({
      where: {
        mold_id: mold.id,
        status: 'scheduled'
      },
      transaction
    });

    for (const inspection of inspections) {
      // 타수 기반 점검 스케줄 체크
      if (inspection.trigger_shots && currentShots >= inspection.trigger_shots) {
        await inspection.update({
          status: 'due',
          updated_at: new Date()
        }, { transaction });
      }
    }
  } catch (error) {
    logger.error('Update inspection schedule error:', error);
  }
}

/**
 * 타수 임계값 체크 및 알람 생성
 */
async function checkShotsThreshold(mold, currentShots, transaction) {
  try {
    const targetShots = mold.target_shots;
    
    // 정기점검 타수 임계값 (100K, 500K, 1M)
    const inspectionThresholds = [
      { shots: 100000, type: '1차 정기점검', priority: 'medium' },
      { shots: 200000, type: '2차 정기점검', priority: 'medium' },
      { shots: 500000, type: '3차 정기점검', priority: 'high' },
      { shots: 800000, type: '4차 정기점검', priority: 'high' },
      { shots: 1000000, type: '5차 정기점검 (전면)', priority: 'critical' }
    ];
    
    // 점검 임계값 도달 체크
    for (const threshold of inspectionThresholds) {
      const prevMilestone = currentShots - (mold.shots_increment || 0);
      // 이번 생산으로 임계값을 넘었는지 확인
      if (prevMilestone < threshold.shots && currentShots >= threshold.shots) {
        await createInspectionAlert(mold, threshold, currentShots, transaction);
      }
    }
    
    // 목표 타수 대비 진행률 체크
    if (targetShots) {
      const progress = (currentShots / targetShots) * 100;
      const progressThresholds = [
        { percent: 80, message: '타수 80% 도달', priority: 'low' },
        { percent: 90, message: '타수 90% 도달', priority: 'medium' },
        { percent: 95, message: '타수 95% 도달 - 점검 필요', priority: 'high' },
        { percent: 100, message: '목표 타수 도달', priority: 'critical' }
      ];

      for (const threshold of progressThresholds) {
        const prevProgress = ((currentShots - (mold.shots_increment || 0)) / targetShots) * 100;
        if (prevProgress < threshold.percent && progress >= threshold.percent) {
          await createProgressAlert(mold, threshold, currentShots, targetShots, transaction);
        }
      }
    }
  } catch (error) {
    logger.error('Check shots threshold error:', error);
  }
}

/**
 * 정기점검 알람 생성
 */
async function createInspectionAlert(mold, threshold, currentShots, transaction) {
  try {
    await sequelize.query(`
      INSERT INTO alerts (
        mold_id, alert_type, title, message, priority, status,
        created_at, updated_at
      ) VALUES (
        :mold_id, 'inspection_due', :title, :message, :priority, 'active',
        NOW(), NOW()
      )
    `, {
      replacements: {
        mold_id: mold.id,
        title: `${threshold.type} 필요`,
        message: `금형 ${mold.mold_code || mold.id}의 타수가 ${currentShots.toLocaleString()}회에 도달하여 ${threshold.type}이 필요합니다.`,
        priority: threshold.priority
      },
      transaction
    });
    logger.info(`Inspection alert created: Mold ${mold.mold_code} - ${threshold.type} at ${currentShots} shots`);
  } catch (error) {
    logger.error('Create inspection alert error:', error);
  }
}

/**
 * 진행률 알람 생성
 */
async function createProgressAlert(mold, threshold, currentShots, targetShots, transaction) {
  try {
    await sequelize.query(`
      INSERT INTO alerts (
        mold_id, alert_type, title, message, priority, status,
        created_at, updated_at
      ) VALUES (
        :mold_id, 'shots_progress', :title, :message, :priority, 'active',
        NOW(), NOW()
      )
    `, {
      replacements: {
        mold_id: mold.id,
        title: threshold.message,
        message: `금형 ${mold.mold_code || mold.id}: ${threshold.message} (${currentShots.toLocaleString()}/${targetShots.toLocaleString()})`,
        priority: threshold.priority
      },
      transaction
    });
    logger.info(`Progress alert created: Mold ${mold.mold_code} - ${threshold.message}`);
  } catch (error) {
    logger.error('Create progress alert error:', error);
  }
}

/**
 * 생산수량 이력 조회
 */
const getProductionHistory = async (req, res) => {
  try {
    const { mold_id } = req.params;
    const { start_date, end_date, limit = 50 } = req.query;

    const where = { mold_id };
    if (start_date) {
      where.production_date = { [sequelize.Sequelize.Op.gte]: start_date };
    }
    if (end_date) {
      where.production_date = { ...where.production_date, [sequelize.Sequelize.Op.lte]: end_date };
    }

    const productions = await ProductionQuantity.findAll({
      where,
      include: [
        {
          association: 'recorder',
          attributes: ['id', 'name', 'user_type']
        }
      ],
      order: [['production_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    // 통계 계산
    const totalQuantity = productions.reduce((sum, p) => sum + p.quantity, 0);
    const totalShots = productions.reduce((sum, p) => sum + p.shots_increment, 0);

    res.json({
      success: true,
      data: {
        productions,
        statistics: {
          total_records: productions.length,
          total_quantity: totalQuantity,
          total_shots: totalShots,
          average_quantity: productions.length > 0 ? Math.round(totalQuantity / productions.length) : 0
        }
      }
    });

  } catch (error) {
    logger.error('Get production history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get production history' }
    });
  }
};

/**
 * 일별 생산 통계
 */
const getDailyStatistics = async (req, res) => {
  try {
    const { mold_id, start_date, end_date } = req.query;

    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (start_date) where.production_date = { [sequelize.Sequelize.Op.gte]: start_date };
    if (end_date) where.production_date = { ...where.production_date, [sequelize.Sequelize.Op.lte]: end_date };

    const statistics = await ProductionQuantity.findAll({
      where,
      attributes: [
        'production_date',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.col('shots_increment')), 'total_shots'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'record_count']
      ],
      group: ['production_date'],
      order: [['production_date', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    logger.error('Get daily statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get daily statistics' }
    });
  }
};

module.exports = {
  recordProduction,
  getProductionHistory,
  getDailyStatistics
};
