const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { StandardDocumentTemplate, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// 인증 필수
router.use(authenticate);

/**
 * GET /api/v1/standard-document-templates
 * 표준문서 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const { template_type, status, is_active, q } = req.query;

    const where = {};
    if (template_type) where.template_type = template_type;
    if (status) where.status = status;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (q) {
      where[Op.or] = [
        { template_name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { template_code: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const templates = await StandardDocumentTemplate.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Standard document templates list error:', error);
    res.status(500).json({ success: false, error: { message: '표준문서 목록 조회 실패' } });
  }
});

/**
 * GET /api/v1/standard-document-templates/:id
 * 표준문서 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Standard document template detail error:', error);
    res.status(500).json({ success: false, error: { message: '표준문서 조회 실패' } });
  }
});

/**
 * POST /api/v1/standard-document-templates
 * 표준문서 생성
 */
router.post('/', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const { template_name, template_type, description, development_stage } = req.body;

    if (!template_name || !template_type) {
      return res.status(400).json({ success: false, error: { message: '문서명과 유형은 필수입니다' } });
    }

    // 자동 코드 생성
    const count = await StandardDocumentTemplate.count({ where: { template_type } });
    const template_code = `${template_type.toUpperCase()}_${String(count + 1).padStart(3, '0')}`;

    const template = await StandardDocumentTemplate.create({
      template_code,
      template_name,
      template_type,
      description: description || null,
      development_stage: development_stage || 'all',
      status: 'draft',
      created_by: req.user.id,
      created_by_name: req.user.name || req.user.username
    });

    logger.info(`Standard document created: ${template_name} by user ${req.user.id}`);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error('Standard document create error:', error);
    res.status(500).json({ success: false, error: { message: '표준문서 생성 실패' } });
  }
});

/**
 * PATCH /api/v1/standard-document-templates/:id
 * 표준문서 수정
 */
router.patch('/:id', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    const allowedFields = [
      'template_name', 'template_type', 'description', 'version',
      'development_stage', 'deployed_to', 'item_count', 'category_count',
      'template_data', 'items', 'stages', 'revision_history', 'is_active'
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await template.update(updates);
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Standard document update error:', error);
    res.status(500).json({ success: false, error: { message: '표준문서 수정 실패' } });
  }
});

/**
 * POST /api/v1/standard-document-templates/:id/approve
 * 표준문서 승인
 */
router.post('/:id/approve', authorize(['system_admin']), async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    await template.update({
      status: 'approved',
      approved_by: req.user.id,
      approved_by_name: req.user.name || req.user.username,
      approved_at: new Date()
    });

    res.json({ success: true, data: template, message: '승인되었습니다' });
  } catch (error) {
    logger.error('Standard document approve error:', error);
    res.status(500).json({ success: false, error: { message: '승인 실패' } });
  }
});

/**
 * POST /api/v1/standard-document-templates/:id/deploy
 * 표준문서 배포
 */
router.post('/:id/deploy', authorize(['system_admin']), async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    await template.update({
      status: 'deployed',
      deployed_by: req.user.id,
      deployed_by_name: req.user.name || req.user.username,
      deployed_at: new Date(),
      deployed_to: req.body.deployed_to || ['제작처', '생산처']
    });

    res.json({ success: true, data: template, message: '배포되었습니다' });
  } catch (error) {
    logger.error('Standard document deploy error:', error);
    res.status(500).json({ success: false, error: { message: '배포 실패' } });
  }
});

/**
 * POST /api/v1/standard-document-templates/:id/duplicate
 * 표준문서 복제
 */
router.post('/:id/duplicate', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const original = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    const count = await StandardDocumentTemplate.count({ where: { template_type: original.template_type } });
    const template_code = `${original.template_type.toUpperCase()}_${String(count + 1).padStart(3, '0')}`;

    const newTemplate = await StandardDocumentTemplate.create({
      template_code,
      template_name: req.body.new_name || `${original.template_name} (복사본)`,
      template_type: original.template_type,
      description: original.description,
      development_stage: original.development_stage,
      template_data: original.template_data,
      items: original.items,
      stages: original.stages,
      item_count: original.item_count,
      category_count: original.category_count,
      status: 'draft',
      created_by: req.user.id,
      created_by_name: req.user.name || req.user.username
    });

    res.status(201).json({ success: true, data: newTemplate, message: '복제되었습니다' });
  } catch (error) {
    logger.error('Standard document duplicate error:', error);
    res.status(500).json({ success: false, error: { message: '복제 실패' } });
  }
});

/**
 * POST /api/v1/standard-document-templates/:id/revise
 * 표준문서 개정 (새 버전 생성 + 승인요청)
 */
router.post('/:id/revise', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    const { new_version, revision_reason, items, description } = req.body;
    if (!new_version) {
      return res.status(400).json({ success: false, error: { message: '새 버전 번호는 필수입니다' } });
    }

    // 현재 상태를 이력 JSONB에 스냅샷 저장
    const currentHistory = template.revision_history || [];
    currentHistory.push({
      version: template.version || '1.0',
      status: template.status,
      items_snapshot: template.items,
      item_count: template.item_count,
      category_count: template.category_count,
      description: template.description,
      revised_by: req.user.id,
      revised_by_name: req.user.name || req.user.username,
      revised_at: new Date().toISOString(),
      revision_reason: revision_reason || '개정'
    });

    // 새 버전으로 업데이트 + 승인 대기 상태
    const updates = {
      version: new_version,
      status: 'pending',
      revision_history: currentHistory,
      approved_by: null,
      approved_by_name: null,
      approved_at: null,
      deployed_by: null,
      deployed_by_name: null,
      deployed_at: null
    };
    if (items !== undefined) updates.items = items;
    if (description !== undefined) updates.description = description;
    if (items) {
      const struct = Array.isArray(items) && items[0]?.items ? 'nested' : 'flat';
      updates.item_count = struct === 'nested'
        ? items.reduce((s, c) => s + (c.items?.length || 0), 0)
        : items.length;
      updates.category_count = struct === 'nested' ? items.length : 1;
    }

    await template.update(updates);
    logger.info(`Standard document revised: ${template.template_name} to v${new_version} by user ${req.user.id}`);
    res.json({ success: true, data: template, message: `v${new_version}으로 개정되었습니다. 승인을 요청합니다.` });
  } catch (error) {
    logger.error('Standard document revise error:', error);
    res.status(500).json({ success: false, error: { message: '개정 실패' } });
  }
});

/**
 * POST /api/v1/standard-document-templates/:id/reject
 * 표준문서 반려
 */
router.post('/:id/reject', authorize(['system_admin']), async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    await template.update({
      status: 'rejected',
      approved_by: req.user.id,
      approved_by_name: req.user.name || req.user.username,
      approved_at: new Date()
    });

    res.json({ success: true, data: template, message: '반려되었습니다' });
  } catch (error) {
    logger.error('Standard document reject error:', error);
    res.status(500).json({ success: false, error: { message: '반려 실패' } });
  }
});

/**
 * GET /api/v1/standard-document-templates/:id/history
 * 표준문서 개정 이력 조회
 */
router.get('/:id/history', async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id, {
      attributes: ['id', 'template_name', 'version', 'status', 'revision_history',
        'created_by_name', 'created_at', 'approved_by_name', 'approved_at',
        'deployed_by_name', 'deployed_at']
    });
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    const history = (template.revision_history || []).map((h, i) => ({
      ...h,
      revision_number: i + 1
    }));

    // 현재 버전도 추가
    history.push({
      revision_number: history.length + 1,
      version: template.version,
      status: template.status,
      item_count: null,
      revised_by_name: null,
      revised_at: null,
      revision_reason: '현재 버전',
      is_current: true
    });

    res.json({ success: true, data: { template_name: template.template_name, history } });
  } catch (error) {
    logger.error('Standard document history error:', error);
    res.status(500).json({ success: false, error: { message: '이력 조회 실패' } });
  }
});

/**
 * DELETE /api/v1/standard-document-templates/:id
 * 표준문서 삭제
 */
router.delete('/:id', authorize(['system_admin']), async (req, res) => {
  try {
    const template = await StandardDocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: { message: '표준문서를 찾을 수 없습니다' } });
    }

    if (template.status === 'deployed') {
      return res.status(400).json({ success: false, error: { message: '배포된 문서는 삭제할 수 없습니다' } });
    }

    await template.destroy();
    res.json({ success: true, message: '삭제되었습니다' });
  } catch (error) {
    logger.error('Standard document delete error:', error);
    res.status(500).json({ success: false, error: { message: '삭제 실패' } });
  }
});

module.exports = router;
