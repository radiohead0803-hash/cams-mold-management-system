const { MoldDevelopmentPlan, MoldProcessStep, MoldSpecification, User } = require('../models/newIndex');
const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 금형개발계획 생성 (12단계 자동 생성)
 */
const createDevelopmentPlan = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      mold_specification_id,
      raw_material,
      manufacturer,
      trial_order_date,
      material_upper_type,
      material_lower_type,
      part_weight
    } = req.body;
    const userId = req.user.id;

    // 1. 금형제작사양 조회
    const specification = await MoldSpecification.findByPk(mold_specification_id, { transaction });
    if (!specification) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold specification not found' }
      });
    }

    // 2. 금형개발계획 생성 (자동 입력 항목 포함)
    const developmentPlan = await MoldDevelopmentPlan.create({
      mold_specification_id,
      // 자동 입력
      car_model: specification.car_model,
      part_number: specification.part_number,
      part_name: specification.part_name,
      schedule_code: calculateScheduleCode(trial_order_date),
      export_rate: calculateExportRate(specification),
      // 수동 입력
      raw_material,
      manufacturer,
      trial_order_date,
      material_upper_type,
      material_lower_type,
      part_weight,
      created_by: userId,
      status: 'planning'
    }, { transaction });

    // 3. 12단계 공정 자동 생성
    const processSteps = MoldProcessStep.PROCESS_STEPS.map((step, index) => ({
      development_plan_id: developmentPlan.id,
      step_number: step.step_number,
      step_name: step.step_name,
      status: 'pending',
      status_display: '진행예정'
    }));

    await MoldProcessStep.bulkCreate(processSteps, { transaction });

    await transaction.commit();

    // 4. 생성된 데이터 조회
    const result = await MoldDevelopmentPlan.findByPk(developmentPlan.id, {
      include: [
        {
          association: 'processSteps',
          order: [['step_number', 'ASC']]
        },
        {
          association: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model']
        }
      ]
    });

    res.json({
      success: true,
      data: { developmentPlan: result }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Create development plan error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create development plan' }
    });
  }
};

/**
 * 공정 단계 업데이트
 */
const updateProcessStep = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { step_id } = req.params;
    const {
      status,
      start_date,
      planned_completion_date,
      actual_completion_date,
      notes,
      assignee
    } = req.body;

    const step = await MoldProcessStep.findByPk(step_id, {
      include: [{ association: 'developmentPlan' }],
      transaction
    });

    if (!step) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Process step not found' }
      });
    }

    // 1. 단계 업데이트
    await step.update({
      status,
      start_date,
      planned_completion_date,
      actual_completion_date,
      notes,
      assignee,
      updated_at: new Date()
    }, { transaction });

    // 2. 상태 표시 및 남은 일수 계산
    step.updateStatusDisplay();
    step.calculateDaysRemaining();
    await step.save({ transaction });

    // 3. 개발계획 진행률 업데이트
    const developmentPlan = step.developmentPlan;
    await developmentPlan.updateProgress();

    await transaction.commit();

    // 4. 업데이트된 데이터 조회
    const result = await MoldDevelopmentPlan.findByPk(developmentPlan.id, {
      include: [{
        association: 'processSteps',
        order: [['step_number', 'ASC']]
      }]
    });

    res.json({
      success: true,
      data: {
        step,
        developmentPlan: result
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Update process step error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update process step' }
    });
  }
};

/**
 * 개발계획 조회
 */
const getDevelopmentPlan = async (req, res) => {
  try {
    const { plan_id } = req.params;

    const plan = await MoldDevelopmentPlan.findByPk(plan_id, {
      include: [
        {
          association: 'processSteps',
          order: [['step_number', 'ASC']]
        },
        {
          association: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model', 'cavity_count']
        },
        {
          association: 'creator',
          attributes: ['id', 'name', 'user_type']
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: { message: 'Development plan not found' }
      });
    }

    res.json({
      success: true,
      data: { developmentPlan: plan }
    });

  } catch (error) {
    logger.error('Get development plan error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get development plan' }
    });
  }
};

/**
 * 개발계획 목록 조회
 */
const getDevelopmentPlans = async (req, res) => {
  try {
    const { status, manufacturer, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (manufacturer) where.manufacturer = manufacturer;

    const plans = await MoldDevelopmentPlan.findAndCountAll({
      where,
      include: [
        {
          association: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        plans: plans.rows,
        total: plans.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Get development plans error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get development plans' }
    });
  }
};

/**
 * 진행률 통계
 */
const getProgressStatistics = async (req, res) => {
  try {
    const statistics = await MoldDevelopmentPlan.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('overall_progress')), 'avg_progress']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    logger.error('Get progress statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get statistics' }
    });
  }
};

/**
 * 제작일정 코드 계산 (D+144 형식)
 */
function calculateScheduleCode(trialOrderDate) {
  if (!trialOrderDate) return null;

  const today = new Date();
  const trial = new Date(trialOrderDate);
  const diffTime = trial - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? `D+${diffDays}` : `D${diffDays}`;
}

/**
 * 수출률 계산 (6/1000 형식)
 */
function calculateExportRate(specification) {
  // 실제 로직은 비즈니스 요구사항에 따라 구현
  // 예시: cavity_count 기반 계산
  const cavityCount = specification.cavity_count || 1;
  return `${cavityCount}/1000`;
}

module.exports = {
  createDevelopmentPlan,
  updateProcessStep,
  getDevelopmentPlan,
  getDevelopmentPlans,
  getProgressStatistics
};
