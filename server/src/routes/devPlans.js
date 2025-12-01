const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { MoldDevelopmentPlan, MoldProcessStep, Mold, User, Notification } = require('../models/newIndex');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// 본사 관리자 및 금형개발 담당자만 접근 가능
router.use(authenticate, authorize(['system_admin', 'mold_developer']));

/**
 * GET /api/v1/dev/plans
 * 개발 계획 목록 조회
 */
router.get('/plans', async (req, res) => {
  try {
    const { moldId, status } = req.query;

    const where = {};
    if (moldId) where.mold_id = moldId;
    if (status) where.status = status;

    const plans = await MoldDevelopmentPlan.findAll({
      where,
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        },
        {
          association: 'steps',
          order: [['order_index', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        plans
      }
    });

  } catch (error) {
    logger.error('Dev plans list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '개발 계획 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/dev/plans/:id
 * 개발 계획 상세 조회
 */
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await MoldDevelopmentPlan.findByPk(id, {
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'car_model']
        },
        {
          association: 'steps',
          order: [['order_index', 'ASC']]
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: {
          message: '개발 계획을 찾을 수 없습니다.'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        plan
      }
    });

  } catch (error) {
    logger.error('Dev plan detail error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '개발 계획 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/dev/plans
 * 개발 계획 생성
 */
router.post('/plans', async (req, res) => {
  try {
    const userId = req.user.id;
    const { moldId, planName, startDate, endDate } = req.body;

    if (!moldId || !planName) {
      return res.status(400).json({
        success: false,
        error: {
          message: '금형 ID와 계획명은 필수입니다.'
        }
      });
    }

    const mold = await Mold.findByPk(moldId);
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          message: '금형을 찾을 수 없습니다.'
        }
      });
    }

    const plan = await MoldDevelopmentPlan.create({
      mold_id: moldId,
      plan_name: planName,
      start_date: startDate || new Date(),
      end_date: endDate || null,
      status: 'planned'
    });

    logger.info(`Dev plan created: ${planName} for mold ${mold.mold_code} by user ${userId}`);

    // 관련자에게 알림
    try {
      const users = await User.findAll({
        where: {
          user_type: {
            [Op.in]: ['system_admin', 'mold_developer', 'maker']
          },
          is_active: true
        }
      });

      for (const user of users) {
        await Notification.create({
          user_id: user.id,
          notification_type: 'dev_plan_created',
          title: `개발 계획 생성 - ${mold.mold_code}`,
          message: `금형 ${mold.mold_code}에 대한 개발 계획 "${planName}"이 생성되었습니다.`,
          priority: 'normal',
          related_type: 'mold',
          related_id: moldId,
          action_url: `/hq/molds/${moldId}?tab=development`,
          is_read: false
        });
      }
    } catch (notifError) {
      logger.error('Dev plan notification error:', notifError);
    }

    return res.status(201).json({
      success: true,
      data: {
        plan
      }
    });

  } catch (error) {
    logger.error('Dev plan create error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '개발 계획 생성 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/dev/plans/:id/steps
 * 개발 단계 추가
 */
router.post('/plans/:id/steps', async (req, res) => {
  try {
    const { id } = req.params;
    const { stepName, orderIndex, startDate, endDate } = req.body;

    if (!stepName) {
      return res.status(400).json({
        success: false,
        error: {
          message: '단계명은 필수입니다.'
        }
      });
    }

    const plan = await MoldDevelopmentPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: {
          message: '개발 계획을 찾을 수 없습니다.'
        }
      });
    }

    const step = await MoldProcessStep.create({
      plan_id: id,
      step_name: stepName,
      order_index: orderIndex || 0,
      status: 'not_started',
      start_date: startDate || null,
      end_date: endDate || null
    });

    logger.info(`Dev step added: ${stepName} to plan ${id}`);

    return res.status(201).json({
      success: true,
      data: {
        step
      }
    });

  } catch (error) {
    logger.error('Dev step create error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '개발 단계 추가 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PATCH /api/v1/dev/steps/:id/status
 * 개발 단계 상태 변경
 */
router.patch('/steps/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['not_started', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '유효한 상태값이 필요합니다. (not_started, in_progress, done)'
        }
      });
    }

    const step = await MoldProcessStep.findByPk(id);
    if (!step) {
      return res.status(404).json({
        success: false,
        error: {
          message: '개발 단계를 찾을 수 없습니다.'
        }
      });
    }

    step.status = status;
    
    // 상태에 따라 날짜 자동 설정
    if (status === 'in_progress' && !step.start_date) {
      step.start_date = new Date();
    }
    if (status === 'done' && !step.end_date) {
      step.end_date = new Date();
    }
    
    await step.save();

    // 모든 단계가 완료되면 계획 상태도 완료로 변경
    const allSteps = await MoldProcessStep.findAll({
      where: { plan_id: step.plan_id }
    });

    if (allSteps.length > 0 && allSteps.every(s => s.status === 'done')) {
      const plan = await MoldDevelopmentPlan.findByPk(step.plan_id);
      if (plan && plan.status !== 'completed') {
        plan.status = 'completed';
        await plan.save();

        logger.info(`Dev plan ${plan.id} completed - all steps done`);

        // 계획 완료 알림
        try {
          const mold = await Mold.findByPk(plan.mold_id);
          const users = await User.findAll({
            where: {
              user_type: {
                [Op.in]: ['system_admin', 'mold_developer']
              },
              is_active: true
            }
          });

          for (const user of users) {
            await Notification.create({
              user_id: user.id,
              notification_type: 'dev_plan_completed',
              title: `개발 계획 완료 - ${mold.mold_code}`,
              message: `금형 ${mold.mold_code}의 개발 계획 "${plan.plan_name}"이 완료되었습니다.`,
              priority: 'normal',
              related_type: 'mold',
              related_id: plan.mold_id,
              action_url: `/hq/molds/${plan.mold_id}?tab=development`,
              is_read: false
            });
          }
        } catch (notifError) {
          logger.error('Dev plan completion notification error:', notifError);
        }
      }
    }

    logger.info(`Dev step status updated: ${step.step_name} -> ${status}`);

    return res.json({
      success: true,
      data: {
        step
      }
    });

  } catch (error) {
    logger.error('Dev step status update error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '개발 단계 상태 변경 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
