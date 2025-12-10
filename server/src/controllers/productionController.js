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
 * 정기점검 기준:
 * - 타수 기준: 2만 → 5만 → 8만 → 10만 → 12만 → 15만 (이후 3만 단위)
 * - 일자 기준: 3개월 단위
 * - 타수 또는 개월수 중 먼저 도달하는 기준으로 알람 발생
 */
async function checkShotsThreshold(mold, currentShots, transaction) {
  try {
    const targetShots = mold.target_shots;
    const shotsIncrement = mold.shots_increment || 0;
    const prevShots = currentShots - shotsIncrement;
    
    // 정기점검 타수 임계값 (2만, 5만, 8만, 10만, 12만, 15만...)
    const inspectionThresholds = [
      { shots: 20000, type: '1차 정기점검', priority: 'medium', order: 1 },
      { shots: 50000, type: '2차 정기점검', priority: 'medium', order: 2 },
      { shots: 80000, type: '3차 정기점검', priority: 'high', order: 3 },
      { shots: 100000, type: '4차 정기점검', priority: 'high', order: 4 },
      { shots: 120000, type: '5차 정기점검', priority: 'high', order: 5 },
      { shots: 150000, type: '6차 정기점검', priority: 'critical', order: 6 },
      // 15만 이후는 3만 단위로 계속 (18만, 21만, 24만...)
      { shots: 180000, type: '7차 정기점검', priority: 'critical', order: 7 },
      { shots: 210000, type: '8차 정기점검', priority: 'critical', order: 8 },
      { shots: 240000, type: '9차 정기점검', priority: 'critical', order: 9 },
      { shots: 270000, type: '10차 정기점검', priority: 'critical', order: 10 },
      { shots: 300000, type: '11차 정기점검', priority: 'critical', order: 11 }
    ];
    
    // 점검 임계값 도달 체크
    for (const threshold of inspectionThresholds) {
      // 이번 생산으로 임계값을 넘었는지 확인
      if (prevShots < threshold.shots && currentShots >= threshold.shots) {
        await createInspectionAlert(mold, threshold, currentShots, 'shots', transaction);
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
        const prevProgress = (prevShots / targetShots) * 100;
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
 * 일자 기준 정기점검 체크 (3개월 단위)
 * 서버 시작 시 또는 스케줄러에서 호출
 */
async function checkDateBasedInspection(moldId = null) {
  try {
    // 금형 조회 조건
    const whereClause = moldId ? `AND m.id = ${moldId}` : '';
    
    // 마지막 정기점검 이후 3개월이 지난 금형 조회
    const [moldsNeedingInspection] = await sequelize.query(`
      SELECT 
        m.id, 
        m.mold_code, 
        m.mold_name,
        m.current_shots,
        m.last_inspection_date,
        COALESCE(m.last_inspection_date, m.created_at) as base_date,
        EXTRACT(DAY FROM NOW() - COALESCE(m.last_inspection_date, m.created_at)) as days_since_inspection
      FROM molds m
      WHERE m.status NOT IN ('scrapped', 'inactive')
        AND (
          m.last_inspection_date IS NULL 
          OR m.last_inspection_date < NOW() - INTERVAL '3 months'
        )
        ${whereClause}
    `);
    
    for (const mold of moldsNeedingInspection) {
      const daysSince = Math.floor(mold.days_since_inspection || 0);
      const monthsSince = Math.floor(daysSince / 30);
      
      // 3개월 단위로 점검 차수 계산
      const inspectionOrder = Math.floor(monthsSince / 3);
      
      if (inspectionOrder >= 1) {
        // 이미 해당 기간에 대한 알람이 있는지 확인
        const [existingAlert] = await sequelize.query(`
          SELECT id FROM alerts 
          WHERE mold_id = :mold_id 
            AND alert_type = 'inspection_due_date'
            AND created_at > NOW() - INTERVAL '3 months'
            AND status = 'active'
        `, {
          replacements: { mold_id: mold.id }
        });
        
        if (existingAlert.length === 0) {
          // 일자 기준 정기점검 알람 생성
          await sequelize.query(`
            INSERT INTO alerts (
              mold_id, alert_type, title, message, priority, status,
              trigger_type, trigger_value, created_at, updated_at
            ) VALUES (
              :mold_id, 'inspection_due_date', :title, :message, :priority, 'active',
              'date', :months, NOW(), NOW()
            )
          `, {
            replacements: {
              mold_id: mold.id,
              title: `정기점검 필요 (${monthsSince}개월 경과)`,
              message: `금형 ${mold.mold_code}의 마지막 점검 후 ${monthsSince}개월이 경과하여 정기점검이 필요합니다. (3개월 주기)`,
              priority: monthsSince >= 6 ? 'critical' : monthsSince >= 4 ? 'high' : 'medium',
              months: monthsSince
            }
          });
          logger.info(`Date-based inspection alert created: Mold ${mold.mold_code} - ${monthsSince} months since last inspection`);
        }
      }
    }
    
    return moldsNeedingInspection.length;
  } catch (error) {
    logger.error('Check date-based inspection error:', error);
    return 0;
  }
}

/**
 * 복합 정기점검 체크 (타수 OR 일자 중 먼저 도달)
 */
async function checkCombinedInspectionDue(mold, currentShots, transaction) {
  try {
    // 타수 기준 다음 점검 임계값 계산
    const shotsThresholds = [20000, 50000, 80000, 100000, 120000, 150000];
    // 15만 이후 3만 단위 추가
    for (let s = 180000; s <= 500000; s += 30000) {
      shotsThresholds.push(s);
    }
    
    const nextShotsThreshold = shotsThresholds.find(t => t > currentShots) || shotsThresholds[shotsThresholds.length - 1];
    const shotsUntilNext = nextShotsThreshold - currentShots;
    
    // 일자 기준 다음 점검까지 남은 일수
    const lastInspectionDate = mold.last_inspection_date || mold.created_at;
    const nextInspectionDate = new Date(lastInspectionDate);
    nextInspectionDate.setMonth(nextInspectionDate.getMonth() + 3);
    const daysUntilNext = Math.ceil((nextInspectionDate - new Date()) / (1000 * 60 * 60 * 24));
    
    // 어느 기준이 먼저 도달하는지 판단
    const triggerType = daysUntilNext <= 0 ? 'date' : (shotsUntilNext <= 0 ? 'shots' : null);
    
    if (triggerType) {
      const alertMessage = triggerType === 'date' 
        ? `3개월 주기 도래 (타수: ${currentShots.toLocaleString()})`
        : `타수 ${nextShotsThreshold.toLocaleString()} 도달 (${daysUntilNext}일 전 점검 예정이었음)`;
      
      return {
        needsInspection: true,
        triggerType,
        message: alertMessage,
        nextShotsThreshold,
        daysUntilNext,
        shotsUntilNext
      };
    }
    
    return {
      needsInspection: false,
      nextShotsThreshold,
      daysUntilNext,
      shotsUntilNext
    };
  } catch (error) {
    logger.error('Check combined inspection due error:', error);
    return { needsInspection: false };
  }
}

/**
 * 정기점검 알람 생성
 * @param {Object} mold - 금형 정보
 * @param {Object} threshold - 임계값 정보
 * @param {number} currentShots - 현재 타수
 * @param {string} triggerType - 트리거 유형 ('shots' 또는 'date')
 * @param {Object} transaction - DB 트랜잭션
 */
async function createInspectionAlert(mold, threshold, currentShots, triggerType = 'shots', transaction) {
  try {
    const triggerLabel = triggerType === 'shots' ? '타수 기준' : '일자 기준 (3개월)';
    
    await sequelize.query(`
      INSERT INTO alerts (
        mold_id, alert_type, title, message, priority, status,
        trigger_type, trigger_value, created_at, updated_at
      ) VALUES (
        :mold_id, 'inspection_due', :title, :message, :priority, 'active',
        :trigger_type, :trigger_value, NOW(), NOW()
      )
    `, {
      replacements: {
        mold_id: mold.id,
        title: `${threshold.type} 필요 [${triggerLabel}]`,
        message: `금형 ${mold.mold_code || mold.id}의 타수가 ${currentShots.toLocaleString()}회에 도달하여 ${threshold.type}이 필요합니다. (${triggerLabel})`,
        priority: threshold.priority,
        trigger_type: triggerType,
        trigger_value: triggerType === 'shots' ? threshold.shots : null
      },
      transaction
    });
    logger.info(`Inspection alert created: Mold ${mold.mold_code} - ${threshold.type} at ${currentShots} shots [${triggerType}]`);
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

/**
 * 정기점검 스케줄 정보 조회
 * GET /api/v1/production/inspection-schedule/:mold_id
 */
const getInspectionSchedule = async (req, res) => {
  try {
    const { mold_id } = req.params;
    
    const mold = await Mold.findByPk(mold_id);
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }
    
    const currentShots = mold.current_shots || 0;
    
    // 타수 기준 다음 점검 임계값 계산
    const shotsThresholds = [20000, 50000, 80000, 100000, 120000, 150000];
    for (let s = 180000; s <= 500000; s += 30000) {
      shotsThresholds.push(s);
    }
    
    // 현재 타수 기준 완료된 점검 차수
    const completedInspections = shotsThresholds.filter(t => currentShots >= t).length;
    const nextShotsThreshold = shotsThresholds.find(t => t > currentShots) || shotsThresholds[shotsThresholds.length - 1];
    const shotsUntilNext = Math.max(0, nextShotsThreshold - currentShots);
    
    // 일자 기준 다음 점검까지 남은 일수
    const lastInspectionDate = mold.last_inspection_date || mold.created_at;
    const nextInspectionDate = new Date(lastInspectionDate);
    nextInspectionDate.setMonth(nextInspectionDate.getMonth() + 3);
    const daysUntilNext = Math.ceil((nextInspectionDate - new Date()) / (1000 * 60 * 60 * 24));
    
    // 어느 기준이 먼저 도달하는지 판단
    let nextTrigger = 'none';
    if (daysUntilNext <= 0 && shotsUntilNext <= 0) {
      nextTrigger = 'both';
    } else if (daysUntilNext <= 0) {
      nextTrigger = 'date';
    } else if (shotsUntilNext <= 0) {
      nextTrigger = 'shots';
    }
    
    res.json({
      success: true,
      data: {
        mold_id: mold.id,
        mold_code: mold.mold_code,
        current_shots: currentShots,
        inspection_schedule: {
          // 타수 기준
          shots_based: {
            thresholds: shotsThresholds,
            completed_count: completedInspections,
            next_threshold: nextShotsThreshold,
            shots_until_next: shotsUntilNext,
            next_inspection_order: completedInspections + 1
          },
          // 일자 기준 (3개월)
          date_based: {
            interval_months: 3,
            last_inspection_date: lastInspectionDate,
            next_inspection_date: nextInspectionDate,
            days_until_next: daysUntilNext
          },
          // 복합 판단
          next_trigger: nextTrigger,
          needs_inspection: nextTrigger !== 'none',
          priority: nextTrigger === 'both' ? 'critical' : (nextTrigger !== 'none' ? 'high' : 'normal')
        }
      }
    });
    
  } catch (error) {
    logger.error('Get inspection schedule error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get inspection schedule' }
    });
  }
};

/**
 * 일자 기준 정기점검 알람 생성 (스케줄러용 API)
 * POST /api/v1/production/check-date-inspections
 */
const runDateBasedInspectionCheck = async (req, res) => {
  try {
    const count = await checkDateBasedInspection();
    res.json({
      success: true,
      data: {
        molds_checked: count,
        message: `${count}개 금형에 대한 일자 기준 점검 알람이 확인되었습니다.`
      }
    });
  } catch (error) {
    logger.error('Run date-based inspection check error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to run date-based inspection check' }
    });
  }
};

module.exports = {
  recordProduction,
  getProductionHistory,
  getDailyStatistics,
  getInspectionSchedule,
  runDateBasedInspectionCheck,
  checkDateBasedInspection
};
