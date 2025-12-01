const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { 
  Mold,
  ChecklistMasterTemplate,
  ChecklistTemplateItem,
  ChecklistTemplateDeployment,
  DailyCheck,
  DailyCheckItem,
  Inspection,
  InspectionItem,
  PreProductionChecklist,
  Alert,
  User,
  Notification
} = require('../models/newIndex');
const logger = require('../utils/logger');

router.use(authenticate);

/**
 * GET /api/v1/checklists/forms
 * 체크리스트 폼 정의 조회 (템플릿 기반 자동 생성)
 * Query: moldId, type (daily, periodic, pre_production)
 */
router.get('/forms', async (req, res) => {
  try {
    const { moldId, type } = req.query;

    if (!moldId || !type) {
      return res.status(400).json({
        success: false,
        error: {
          message: '금형 ID와 타입은 필수입니다.'
        }
      });
    }

    // 1. 금형 정보 조회
    const mold = await Mold.findByPk(moldId);
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          message: '금형을 찾을 수 없습니다.'
        }
      });
    }

    // 2. 타입에 맞는 템플릿 타입 매핑
    const templateTypeMap = {
      daily: 'daily_mold_check',
      periodic: 'periodic_inspection',
      pre_production: 'pre_production'
    };

    const templateType = templateTypeMap[type];
    if (!templateType) {
      return res.status(400).json({
        success: false,
        error: {
          message: '유효하지 않은 체크리스트 타입입니다.'
        }
      });
    }

    // 3. 배포된 템플릿 찾기
    // 우선순위: 금형 특정 > 차종 특정 > 회사 특정 > 기본
    const deployments = await ChecklistTemplateDeployment.findAll({
      include: [
        {
          association: 'template',
          where: {
            template_type: templateType,
            is_active: true
          }
        }
      ],
      order: [['deployed_date', 'DESC']]
    });

    let selectedTemplate = null;

    // 금형 특정 템플릿 우선
    for (const deployment of deployments) {
      if (deployment.target_type === 'mold' && deployment.target_id === parseInt(moldId)) {
        selectedTemplate = deployment.template;
        break;
      }
    }

    // 차종 특정 템플릿
    if (!selectedTemplate && mold.car_model) {
      for (const deployment of deployments) {
        const scope = deployment.scope ? JSON.parse(deployment.scope) : {};
        if (scope.car_model === mold.car_model) {
          selectedTemplate = deployment.template;
          break;
        }
      }
    }

    // 회사 특정 템플릿
    if (!selectedTemplate && mold.company_id) {
      for (const deployment of deployments) {
        if (deployment.target_type === 'company' && deployment.target_id === mold.company_id) {
          selectedTemplate = deployment.template;
          break;
        }
      }
    }

    // 기본 템플릿 (배포 범위 없음)
    if (!selectedTemplate) {
      for (const deployment of deployments) {
        if (!deployment.target_type && !deployment.target_id) {
          selectedTemplate = deployment.template;
          break;
        }
      }
    }

    if (!selectedTemplate) {
      return res.status(404).json({
        success: false,
        error: {
          message: '해당 타입의 체크리스트 템플릿을 찾을 수 없습니다.'
        }
      });
    }

    // 4. 템플릿 항목 조회
    const templateItems = await ChecklistTemplateItem.findAll({
      where: { template_id: selectedTemplate.id },
      order: [['order_index', 'ASC']]
    });

    // 5. 폼 정의 JSON 생성
    const formItems = templateItems.map(item => ({
      id: item.id,
      label: item.item_name,
      required: item.is_required,
      type: 'select',
      options: ['ok', 'ng', 'na']
    }));

    return res.json({
      success: true,
      data: {
        template: {
          id: selectedTemplate.id,
          template_name: selectedTemplate.template_name,
          template_type: selectedTemplate.template_type
        },
        mold: {
          id: mold.id,
          mold_code: mold.mold_code,
          mold_name: mold.mold_name,
          car_model: mold.car_model
        },
        items: formItems
      }
    });

  } catch (error) {
    logger.error('Checklist form load error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '체크리스트 폼 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/checklists/daily
 * 일상점검 제출
 */
router.post('/daily', async (req, res) => {
  try {
    const userId = req.user.id;
    const { moldId, templateId, qrSessionId, items, notes } = req.body;

    if (!moldId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '금형 ID와 점검 항목은 필수입니다.'
        }
      });
    }

    // 1. daily_checks 생성
    const dailyCheck = await DailyCheck.create({
      mold_id: moldId,
      user_id: userId,
      check_date: new Date(),
      status: 'completed',
      notes: notes || null
    });

    // 2. daily_check_items 생성
    let hasNG = false;
    for (const item of items) {
      await DailyCheckItem.create({
        daily_check_id: dailyCheck.id,
        check_item_id: item.templateItemId,  // 템플릿 항목 ID
        result: item.result,
        notes: item.notes || null
      });

      if (item.result === 'ng') {
        hasNG = true;
      }
    }

    // 3. NG가 있으면 Alert 및 Notification 생성
    if (hasNG) {
      const mold = await Mold.findByPk(moldId);
      
      const alert = await Alert.create({
        alert_type: 'daily_check_ng',
        severity: 'high',
        message: `금형 ${mold.mold_code} 일상점검에서 NG 항목이 발견되었습니다.`,
        metadata: {
          mold_id: moldId,
          mold_code: mold.mold_code,
          daily_check_id: dailyCheck.id
        },
        is_resolved: false
      });

      // 관리자에게 알림
      const admins = await User.findAll({
        where: {
          user_type: {
            [Op.in]: ['system_admin', 'mold_developer']
          },
          is_active: true
        }
      });

      for (const admin of admins) {
        await Notification.create({
          user_id: admin.id,
          notification_type: 'daily_check_ng',
          title: `일상점검 NG - ${mold.mold_code}`,
          message: `금형 ${mold.mold_code} 일상점검에서 NG 항목이 발견되었습니다. 확인이 필요합니다.`,
          priority: 'high',
          related_type: 'mold',
          related_id: moldId,
          action_url: `/hq/molds/${moldId}?tab=daily-checks`,
          is_read: false
        });
      }

      logger.info(`Daily check NG alert created for mold ${mold.mold_code}`);
    }

    logger.info(`Daily check completed: mold ${moldId} by user ${userId}`);

    return res.status(201).json({
      success: true,
      data: {
        dailyCheck: {
          id: dailyCheck.id,
          mold_id: moldId,
          check_date: dailyCheck.check_date,
          status: dailyCheck.status,
          hasNG
        }
      }
    });

  } catch (error) {
    logger.error('Daily check submit error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '일상점검 제출 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/checklists/inspection
 * 정기검사 제출
 */
router.post('/inspection', async (req, res) => {
  try {
    const userId = req.user.id;
    const { moldId, templateId, items, notes } = req.body;

    if (!moldId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '금형 ID와 검사 항목은 필수입니다.'
        }
      });
    }

    // 1. inspections 생성 또는 업데이트
    let inspection = await Inspection.findOne({
      where: {
        mold_id: moldId,
        inspection_type: 'periodic',
        status: 'scheduled'
      }
    });

    if (!inspection) {
      inspection = await Inspection.create({
        mold_id: moldId,
        inspection_type: 'periodic',
        inspection_date: new Date(),
        status: 'completed',
        notes: notes || null
      });
    } else {
      inspection.status = 'completed';
      inspection.inspection_date = new Date();
      inspection.notes = notes || null;
      await inspection.save();
    }

    // 2. inspection_items 생성
    for (const item of items) {
      await InspectionItem.create({
        inspection_id: inspection.id,
        item_name: item.label || `항목 ${item.templateItemId}`,
        result: item.result,
        notes: item.notes || null
      });
    }

    // 3. 관련 Alert 해결 처리
    await Alert.update(
      { is_resolved: true, resolved_at: new Date() },
      {
        where: {
          alert_type: 'over_shot',
          is_resolved: false,
          'metadata.mold_id': moldId
        }
      }
    );

    logger.info(`Periodic inspection completed: mold ${moldId} by user ${userId}`);

    return res.status(201).json({
      success: true,
      data: {
        inspection: {
          id: inspection.id,
          mold_id: moldId,
          inspection_date: inspection.inspection_date,
          status: inspection.status
        }
      }
    });

  } catch (error) {
    logger.error('Inspection submit error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '정기검사 제출 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/checklists/pre-production
 * 양산 전 체크리스트 제출
 */
router.post('/pre-production', async (req, res) => {
  try {
    const userId = req.user.id;
    const { moldId, templateId, items, notes } = req.body;

    if (!moldId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: '금형 ID와 체크리스트 항목은 필수입니다.'
        }
      });
    }

    // 1. pre_production_checklists 생성
    const checklist = await PreProductionChecklist.create({
      mold_id: moldId,
      checklist_type: 'standard',
      status: 'completed',
      items: JSON.stringify(items)
    });

    logger.info(`Pre-production checklist completed: mold ${moldId} by user ${userId}`);

    return res.status(201).json({
      success: true,
      data: {
        checklist: {
          id: checklist.id,
          mold_id: moldId,
          status: checklist.status
        }
      }
    });

  } catch (error) {
    logger.error('Pre-production checklist submit error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '양산 전 체크리스트 제출 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
