const { MoldDevelopmentPlan, MoldProcessStep, MoldSpecification, User } = require('../models/newIndex');
const { sequelize, Op } = require('../models/newIndex');
const logger = require('../utils/logger');

// 14단계 기본 공정 (개발 12단계 + 금형육성 + 양산이관)
const DEFAULT_PROCESS_STEPS = MoldProcessStep.PROCESS_STEPS;

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

    // 3. 14단계 공정 자동 생성 (개발 12단계 + 금형육성 + 양산이관)
    const processSteps = DEFAULT_PROCESS_STEPS.map((step) => ({
      development_plan_id: developmentPlan.id,
      step_number: step.step_number,
      step_name: step.step_name,
      category: step.category,
      default_days: step.default_days,
      sort_order: step.sort_order,
      is_custom: false,
      is_deleted: false,
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

/**
 * 추진계획 항목 추가 (사용자 정의 단계)
 */
const addProcessStep = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { plan_id } = req.params;
    const {
      step_name,
      category = 'development',
      default_days = 5,
      insert_after_step_number = null // 특정 단계 뒤에 삽입
    } = req.body;

    if (!step_name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '단계명은 필수입니다.' }
      });
    }

    // 개발계획 확인
    const plan = await MoldDevelopmentPlan.findByPk(plan_id, { transaction });
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '개발계획을 찾을 수 없습니다.' }
      });
    }

    // 현재 단계 목록 조회
    const existingSteps = await MoldProcessStep.findAll({
      where: { 
        development_plan_id: plan_id,
        is_deleted: false
      },
      order: [['sort_order', 'ASC']],
      transaction
    });

    // 새 단계 번호 및 정렬 순서 계산
    let newStepNumber = existingSteps.length + 1;
    let newSortOrder = existingSteps.length + 1;

    if (insert_after_step_number) {
      // 특정 단계 뒤에 삽입
      const targetStep = existingSteps.find(s => s.step_number === insert_after_step_number);
      if (targetStep) {
        newSortOrder = targetStep.sort_order + 1;
        // 이후 단계들의 sort_order 증가
        await MoldProcessStep.update(
          { sort_order: sequelize.literal('sort_order + 1') },
          {
            where: {
              development_plan_id: plan_id,
              sort_order: { [Op.gte]: newSortOrder },
              is_deleted: false
            },
            transaction
          }
        );
      }
    }

    // 새 단계 생성
    const newStep = await MoldProcessStep.create({
      development_plan_id: plan_id,
      step_number: newStepNumber,
      step_name,
      category,
      default_days,
      sort_order: newSortOrder,
      is_custom: true,
      is_deleted: false,
      status: 'pending',
      status_display: '진행예정'
    }, { transaction });

    // 개발계획 total_steps 업데이트
    await plan.update({
      total_steps: existingSteps.length + 1,
      updated_at: new Date()
    }, { transaction });

    await transaction.commit();

    // 업데이트된 전체 단계 목록 반환
    const updatedSteps = await MoldProcessStep.findAll({
      where: { 
        development_plan_id: plan_id,
        is_deleted: false
      },
      order: [['sort_order', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        newStep,
        allSteps: updatedSteps
      },
      message: '단계가 추가되었습니다.'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Add process step error:', error);
    res.status(500).json({
      success: false,
      error: { message: '단계 추가에 실패했습니다.' }
    });
  }
};

/**
 * 추진계획 항목 삭제 (soft delete)
 */
const deleteProcessStep = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { plan_id, step_id } = req.params;

    const step = await MoldProcessStep.findOne({
      where: {
        id: step_id,
        development_plan_id: plan_id
      },
      transaction
    });

    if (!step) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '단계를 찾을 수 없습니다.' }
      });
    }

    // 기본 단계는 삭제 불가 (사용자 정의 단계만 삭제 가능)
    if (!step.is_custom) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '기본 단계는 삭제할 수 없습니다. 사용자 정의 단계만 삭제 가능합니다.' }
      });
    }

    // Soft delete
    await step.update({
      is_deleted: true,
      updated_at: new Date()
    }, { transaction });

    // 개발계획 total_steps 업데이트
    const remainingSteps = await MoldProcessStep.count({
      where: {
        development_plan_id: plan_id,
        is_deleted: false
      },
      transaction
    });

    await MoldDevelopmentPlan.update(
      { total_steps: remainingSteps, updated_at: new Date() },
      { where: { id: plan_id }, transaction }
    );

    await transaction.commit();

    // 업데이트된 전체 단계 목록 반환
    const updatedSteps = await MoldProcessStep.findAll({
      where: { 
        development_plan_id: plan_id,
        is_deleted: false
      },
      order: [['sort_order', 'ASC']]
    });

    res.json({
      success: true,
      data: { allSteps: updatedSteps },
      message: '단계가 삭제되었습니다.'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Delete process step error:', error);
    res.status(500).json({
      success: false,
      error: { message: '단계 삭제에 실패했습니다.' }
    });
  }
};

/**
 * 추진계획 항목 순서 변경
 */
const reorderProcessSteps = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { plan_id } = req.params;
    const { step_orders } = req.body; // [{ step_id: 1, sort_order: 1 }, ...]

    if (!step_orders || !Array.isArray(step_orders)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '순서 정보가 필요합니다.' }
      });
    }

    // 각 단계의 순서 업데이트
    for (const item of step_orders) {
      await MoldProcessStep.update(
        { sort_order: item.sort_order, updated_at: new Date() },
        {
          where: {
            id: item.step_id,
            development_plan_id: plan_id
          },
          transaction
        }
      );
    }

    await transaction.commit();

    // 업데이트된 전체 단계 목록 반환
    const updatedSteps = await MoldProcessStep.findAll({
      where: { 
        development_plan_id: plan_id,
        is_deleted: false
      },
      order: [['sort_order', 'ASC']]
    });

    res.json({
      success: true,
      data: { allSteps: updatedSteps },
      message: '순서가 변경되었습니다.'
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Reorder process steps error:', error);
    res.status(500).json({
      success: false,
      error: { message: '순서 변경에 실패했습니다.' }
    });
  }
};

/**
 * 기본 단계 마스터 목록 조회
 */
const getDefaultSteps = async (req, res) => {
  try {
    const { category } = req.query;

    let steps = DEFAULT_PROCESS_STEPS;
    if (category) {
      steps = steps.filter(s => s.category === category);
    }

    const categories = MoldProcessStep.CATEGORIES;

    res.json({
      success: true,
      data: {
        steps,
        categories,
        totalSteps: DEFAULT_PROCESS_STEPS.length
      }
    });

  } catch (error) {
    logger.error('Get default steps error:', error);
    res.status(500).json({
      success: false,
      error: { message: '기본 단계 조회에 실패했습니다.' }
    });
  }
};

/**
 * 금형별 개발계획 조회 (mold_specification_id 기준)
 */
const getDevelopmentPlanByMoldSpec = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;

    const plan = await MoldDevelopmentPlan.findOne({
      where: { mold_specification_id: mold_spec_id },
      include: [
        {
          association: 'processSteps',
          where: { is_deleted: false },
          required: false,
          order: [['sort_order', 'ASC']]
        },
        {
          association: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model', 'cavity_count']
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: { message: '개발계획을 찾을 수 없습니다.' }
      });
    }

    // 단계를 sort_order로 정렬
    if (plan.processSteps) {
      plan.processSteps.sort((a, b) => a.sort_order - b.sort_order);
    }

    res.json({
      success: true,
      data: { developmentPlan: plan }
    });

  } catch (error) {
    logger.error('Get development plan by mold spec error:', error);
    res.status(500).json({
      success: false,
      error: { message: '개발계획 조회에 실패했습니다.' }
    });
  }
};

module.exports = {
  createDevelopmentPlan,
  updateProcessStep,
  getDevelopmentPlan,
  getDevelopmentPlans,
  getProgressStatistics,
  addProcessStep,
  deleteProcessStep,
  reorderProcessSteps,
  getDefaultSteps,
  getDevelopmentPlanByMoldSpec
};
