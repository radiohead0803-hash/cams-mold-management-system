const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { 
  ChecklistMasterTemplate, 
  ChecklistTemplateItem, 
  ChecklistTemplateDeployment,
  ChecklistTemplateHistory 
} = require('../models/newIndex');
const logger = require('../utils/logger');
const { writeTemplateHistory, getTemplateHistory } = require('../services/templateHistory');

// 본사 관리자 및 금형개발 담당자만 접근 가능
router.use(authenticate, authorize(['system_admin', 'mold_developer']));

/**
 * GET /api/v1/hq/checklist-templates
 * 체크리스트 템플릿 목록 조회
 */
router.get('/checklist-templates', async (req, res) => {
  try {
    const { template_type, is_active } = req.query;

    const where = {};
    if (template_type) where.template_type = template_type;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const templates = await ChecklistMasterTemplate.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        templates
      }
    });

  } catch (error) {
    logger.error('Templates list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/checklist-templates/:id
 * 체크리스트 템플릿 상세 조회
 */
router.get('/checklist-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await ChecklistMasterTemplate.findByPk(id, {
      include: [
        {
          association: 'items',
          order: [['order_index', 'ASC']]
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: '템플릿을 찾을 수 없습니다.'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        template
      }
    });

  } catch (error) {
    logger.error('Template detail error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/checklist-templates
 * 체크리스트 템플릿 생성
 */
router.post('/checklist-templates', async (req, res) => {
  try {
    const { template_name, template_type, description } = req.body;

    if (!template_name || !template_type) {
      return res.status(400).json({
        success: false,
        error: {
          message: '템플릿명과 타입은 필수입니다.'
        }
      });
    }

    const template = await ChecklistMasterTemplate.create({
      template_name,
      template_type,
      description: description || null,
      is_active: true
    });

    // 히스토리 기록
    await writeTemplateHistory({
      templateId: template.id,
      action: 'created',
      changes: JSON.stringify({ template_name, template_type, description }),
      changedBy: req.user.name || req.user.username
    });

    logger.info(`Template created: ${template_name} by user ${req.user.id}`);

    return res.status(201).json({
      success: true,
      data: {
        template
      }
    });

  } catch (error) {
    logger.error('Template create error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 생성 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PUT /api/v1/hq/checklist-templates/:id
 * 체크리스트 템플릿 수정
 */
router.put('/checklist-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { template_name, template_type, description, is_active } = req.body;

    const template = await ChecklistMasterTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: '템플릿을 찾을 수 없습니다.'
        }
      });
    }

    const oldValues = {
      template_name: template.template_name,
      template_type: template.template_type,
      description: template.description,
      is_active: template.is_active
    };

    if (template_name) template.template_name = template_name;
    if (template_type) template.template_type = template_type;
    if (description !== undefined) template.description = description;
    if (is_active !== undefined) template.is_active = is_active;

    await template.save();

    // 히스토리 기록
    await writeTemplateHistory({
      templateId: template.id,
      action: 'updated',
      changes: JSON.stringify({ old: oldValues, new: { template_name, template_type, description, is_active } }),
      changedBy: req.user.name || req.user.username
    });

    logger.info(`Template updated: ${template.template_name} by user ${req.user.id}`);

    return res.json({
      success: true,
      data: {
        template
      }
    });

  } catch (error) {
    logger.error('Template update error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 수정 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/checklist-templates/:id/items
 * 템플릿 항목 목록 조회
 */
router.get('/checklist-templates/:id/items', async (req, res) => {
  try {
    const { id } = req.params;

    const items = await ChecklistTemplateItem.findAll({
      where: { template_id: id },
      order: [['order_index', 'ASC']]
    });

    return res.json({
      success: true,
      data: {
        items
      }
    });

  } catch (error) {
    logger.error('Template items list error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 항목 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/checklist-templates/:id/items
 * 템플릿 항목 추가
 */
router.post('/checklist-templates/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, order_index, is_required } = req.body;

    if (!item_name) {
      return res.status(400).json({
        success: false,
        error: {
          message: '항목명은 필수입니다.'
        }
      });
    }

    const item = await ChecklistTemplateItem.create({
      template_id: id,
      item_name,
      order_index: order_index || 0,
      is_required: is_required !== undefined ? is_required : true
    });

    logger.info(`Template item added: ${item_name} to template ${id}`);

    return res.status(201).json({
      success: true,
      data: {
        item
      }
    });

  } catch (error) {
    logger.error('Template item create error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 항목 추가 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PUT /api/v1/hq/checklist-template-items/:itemId
 * 템플릿 항목 수정
 */
router.put('/checklist-template-items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { item_name, order_index, is_required } = req.body;

    const item = await ChecklistTemplateItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '템플릿 항목을 찾을 수 없습니다.'
        }
      });
    }

    if (item_name) item.item_name = item_name;
    if (order_index !== undefined) item.order_index = order_index;
    if (is_required !== undefined) item.is_required = is_required;

    await item.save();

    return res.json({
      success: true,
      data: {
        item
      }
    });

  } catch (error) {
    logger.error('Template item update error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 항목 수정 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * DELETE /api/v1/hq/checklist-template-items/:itemId
 * 템플릿 항목 삭제
 */
router.delete('/checklist-template-items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await ChecklistTemplateItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          message: '템플릿 항목을 찾을 수 없습니다.'
        }
      });
    }

    await item.destroy();

    return res.json({
      success: true,
      message: '템플릿 항목이 삭제되었습니다.'
    });

  } catch (error) {
    logger.error('Template item delete error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 항목 삭제 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/checklist-templates/:id/deploy
 * 템플릿 배포
 */
router.post('/checklist-templates/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_type, target_id, scope } = req.body;

    const template = await ChecklistMasterTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: {
          message: '템플릿을 찾을 수 없습니다.'
        }
      });
    }

    const deployment = await ChecklistTemplateDeployment.create({
      template_id: id,
      deployed_date: new Date(),
      deployed_by: req.user.name || req.user.username,
      target_type: target_type || null,
      target_id: target_id || null,
      scope: scope ? JSON.stringify(scope) : null
    });

    logger.info(`Template deployed: ${template.template_name} by user ${req.user.id}`);

    return res.status(201).json({
      success: true,
      data: {
        deployment
      }
    });

  } catch (error) {
    logger.error('Template deploy error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '템플릿 배포 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/checklist-templates/:id/approve
 * 템플릿 승인
 */
router.post('/checklist-templates/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const template = await ChecklistMasterTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: { message: '템플릿을 찾을 수 없습니다.' }
      });
    }

    // 승인 처리
    template.is_active = true;
    await template.save();

    // 히스토리 기록
    await writeTemplateHistory({
      templateId: template.id,
      action: 'approved',
      changes: JSON.stringify({ comment, approved_by: req.user.name }),
      changedBy: req.user.name || req.user.username
    });

    logger.info(`Template approved: ${template.template_name} by user ${req.user.id}`);

    return res.json({
      success: true,
      data: { template, message: '템플릿이 승인되었습니다.' }
    });

  } catch (error) {
    logger.error('Template approve error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '템플릿 승인 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * POST /api/v1/hq/checklist-templates/:id/reject
 * 템플릿 반려
 */
router.post('/checklist-templates/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const template = await ChecklistMasterTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: { message: '템플릿을 찾을 수 없습니다.' }
      });
    }

    // 히스토리 기록
    await writeTemplateHistory({
      templateId: template.id,
      action: 'rejected',
      changes: JSON.stringify({ reason, rejected_by: req.user.name }),
      changedBy: req.user.name || req.user.username
    });

    logger.info(`Template rejected: ${template.template_name} by user ${req.user.id}`);

    return res.json({
      success: true,
      data: { template, message: '템플릿이 반려되었습니다.' }
    });

  } catch (error) {
    logger.error('Template reject error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '템플릿 반려 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * POST /api/v1/hq/checklist-templates/:id/duplicate
 * 템플릿 복제
 */
router.post('/checklist-templates/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_name } = req.body;

    const original = await ChecklistMasterTemplate.findByPk(id, {
      include: [{ association: 'items' }]
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        error: { message: '템플릿을 찾을 수 없습니다.' }
      });
    }

    // 새 템플릿 생성
    const newTemplate = await ChecklistMasterTemplate.create({
      template_name: new_name || `${original.template_name} (복사본)`,
      template_type: original.template_type,
      description: original.description,
      is_active: false
    });

    // 항목 복제
    if (original.items && original.items.length > 0) {
      for (const item of original.items) {
        await ChecklistTemplateItem.create({
          template_id: newTemplate.id,
          item_name: item.item_name,
          order_index: item.order_index,
          is_required: item.is_required
        });
      }
    }

    // 히스토리 기록
    await writeTemplateHistory({
      templateId: newTemplate.id,
      action: 'duplicated',
      changes: JSON.stringify({ original_id: id, original_name: original.template_name }),
      changedBy: req.user.name || req.user.username
    });

    logger.info(`Template duplicated: ${original.template_name} -> ${newTemplate.template_name} by user ${req.user.id}`);

    return res.status(201).json({
      success: true,
      data: { template: newTemplate, message: '템플릿이 복제되었습니다.' }
    });

  } catch (error) {
    logger.error('Template duplicate error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '템플릿 복제 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * GET /api/v1/hq/checklist-templates/:id/history
 * 템플릿 변경 이력 조회
 */
router.get('/checklist-templates/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await getTemplateHistory(id);

    return res.json({
      success: true,
      data: { history }
    });

  } catch (error) {
    logger.error('Template history error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '템플릿 이력 조회 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * GET /api/v1/hq/checklist-templates/:id/versions
 * 템플릿 버전 목록 조회
 */
router.get('/checklist-templates/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await getTemplateHistory(id);
    
    // 버전 변경 이력만 필터링
    const versions = history.filter(h => 
      h.action === 'created' || h.action === 'updated' || h.action === 'deployed'
    );

    return res.json({
      success: true,
      data: { versions }
    });

  } catch (error) {
    logger.error('Template versions error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '템플릿 버전 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
