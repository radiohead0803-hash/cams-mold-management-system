const express = require('express');
const router = express.Router();
const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/code-options?category=repair_status,repair_problem_type
router.get('/', async function(req, res) {
  try {
    const { category, include_inactive } = req.query;
    if (!category) {
      const [categories] = await sequelize.query(
        'SELECT category, COUNT(*) as count FROM system_code_options WHERE is_active = true GROUP BY category ORDER BY category'
      );
      return res.json({ success: true, data: categories });
    }
    const categories = category.split(',').map(c => c.trim());
    const activeFilter = include_inactive === 'true' ? '' : 'AND is_active = true';
    const [options] = await sequelize.query(
      'SELECT id, category, code, label, description, sort_order, is_active, metadata FROM system_code_options WHERE category IN (:categories) ' + activeFilter + ' ORDER BY category, sort_order, id',
      { replacements: { categories } }
    );
    const grouped = {};
    options.forEach(opt => {
      if (!grouped[opt.category]) grouped[opt.category] = [];
      grouped[opt.category].push(opt);
    });
    return res.json({ success: true, data: grouped });
  } catch (error) {
    logger.error('getCodeOptions error:', error);
    return res.status(500).json({ success: false, error: { message: '코드 옵션 조회 실패' } });
  }
});

// POST /api/v1/code-options (관리자 전용)
router.post('/', authenticate, async function(req, res) {
  try {
    const { category, code, label, description, sort_order, metadata } = req.body;
    if (!category || !code || !label) {
      return res.status(400).json({ success: false, error: { message: 'category, code, label은 필수입니다.' } });
    }
    const [result] = await sequelize.query(
      'INSERT INTO system_code_options (category, code, label, description, sort_order, metadata, created_at, updated_at) VALUES (:category, :code, :label, :description, :sort_order, :metadata::jsonb, NOW(), NOW()) ON CONFLICT (category, code) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, metadata = EXCLUDED.metadata, updated_at = NOW() RETURNING *',
      { replacements: { category, code, label, description: description || null, sort_order: sort_order || 0, metadata: JSON.stringify(metadata || {}) } }
    );
    return res.json({ success: true, data: result[0] });
  } catch (error) {
    logger.error('createCodeOption error:', error);
    return res.status(500).json({ success: false, error: { message: '코드 옵션 생성 실패' } });
  }
});

// PATCH /api/v1/code-options/:id (관리자 전용)
router.patch('/:id', authenticate, async function(req, res) {
  try {
    const { id } = req.params;
    const { label, description, sort_order, is_active, metadata } = req.body;
    const sets = [];
    const replacements = { id };
    if (label !== undefined) { sets.push('label = :label'); replacements.label = label; }
    if (description !== undefined) { sets.push('description = :description'); replacements.description = description; }
    if (sort_order !== undefined) { sets.push('sort_order = :sort_order'); replacements.sort_order = sort_order; }
    if (is_active !== undefined) { sets.push('is_active = :is_active'); replacements.is_active = is_active; }
    if (metadata !== undefined) { sets.push('metadata = :metadata::jsonb'); replacements.metadata = JSON.stringify(metadata); }
    if (sets.length === 0) {
      return res.status(400).json({ success: false, error: { message: '수정할 항목이 없습니다.' } });
    }
    sets.push('updated_at = NOW()');
    const [result] = await sequelize.query(
      'UPDATE system_code_options SET ' + sets.join(', ') + ' WHERE id = :id RETURNING *',
      { replacements }
    );
    if (!result.length) {
      return res.status(404).json({ success: false, error: { message: '코드 옵션을 찾을 수 없습니다.' } });
    }
    return res.json({ success: true, data: result[0] });
  } catch (error) {
    logger.error('updateCodeOption error:', error);
    return res.status(500).json({ success: false, error: { message: '코드 옵션 수정 실패' } });
  }
});

// DELETE /api/v1/code-options/:id (관리자 전용)
router.delete('/:id', authenticate, async function(req, res) {
  try {
    const { id } = req.params;
    const [result] = await sequelize.query(
      'DELETE FROM system_code_options WHERE id = :id RETURNING *',
      { replacements: { id } }
    );
    if (!result.length) {
      return res.status(404).json({ success: false, error: { message: '코드 옵션을 찾을 수 없습니다.' } });
    }
    return res.json({ success: true, data: result[0] });
  } catch (error) {
    logger.error('deleteCodeOption error:', error);
    return res.status(500).json({ success: false, error: { message: '코드 옵션 삭제 실패' } });
  }
});

module.exports = router;
