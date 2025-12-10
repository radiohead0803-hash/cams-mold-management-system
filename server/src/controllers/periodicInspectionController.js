const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 타수별 정기점검 항목 조회
 * GET /api/v1/periodic-inspection/items?shots=50000
 */
const getInspectionItems = async (req, res) => {
  try {
    const { shots = 20000 } = req.query;
    const targetShots = parseInt(shots);
    
    // 해당 타수에 해당하는 점검 항목 조회
    const [items] = await sequelize.query(`
      SELECT 
        id, category, item_name, item_code, description,
        inspection_method, acceptance_criteria, shot_thresholds,
        is_required, sort_order
      FROM periodic_inspection_items
      WHERE is_active = true
        AND shot_thresholds @> :shots::jsonb
      ORDER BY sort_order ASC
    `, {
      replacements: { shots: JSON.stringify(targetShots) }
    });
    
    // 카테고리별로 그룹화
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    
    // 타수별 점검 명칭
    const inspectionNames = {
      20000: '1차 정기점검 (2만 SHOT)',
      50000: '2차 정기점검 (5만 SHOT)',
      80000: '3차 정기점검 (8만 SHOT)',
      100000: '4차 정기점검 (10만 SHOT)',
      120000: '5차 정기점검 (12만 SHOT)',
      150000: '6차 정기점검 (15만 SHOT)'
    };
    
    res.json({
      success: true,
      data: {
        target_shots: targetShots,
        inspection_name: inspectionNames[targetShots] || `정기점검 (${targetShots.toLocaleString()} SHOT)`,
        total_items: items.length,
        categories: Object.keys(groupedItems),
        items_by_category: groupedItems,
        items: items
      }
    });
    
  } catch (error) {
    logger.error('Get inspection items error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get inspection items' }
    });
  }
};

/**
 * 모든 정기점검 항목 조회
 * GET /api/v1/periodic-inspection/items/all
 */
const getAllInspectionItems = async (req, res) => {
  try {
    const [items] = await sequelize.query(`
      SELECT 
        id, category, item_name, item_code, description,
        inspection_method, acceptance_criteria, shot_thresholds,
        is_required, sort_order
      FROM periodic_inspection_items
      WHERE is_active = true
      ORDER BY category, sort_order ASC
    `);
    
    // 카테고리별로 그룹화
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        total_items: items.length,
        categories: Object.keys(groupedItems),
        items_by_category: groupedItems
      }
    });
    
  } catch (error) {
    logger.error('Get all inspection items error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get all inspection items' }
    });
  }
};

/**
 * 타수별 점검 항목 수 요약
 * GET /api/v1/periodic-inspection/summary
 */
const getInspectionSummary = async (req, res) => {
  try {
    const shotThresholds = [20000, 50000, 80000, 100000, 120000, 150000];
    const summary = [];
    
    for (const shots of shotThresholds) {
      const [result] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM periodic_inspection_items
        WHERE is_active = true
          AND shot_thresholds @> :shots::jsonb
      `, {
        replacements: { shots: JSON.stringify(shots) }
      });
      
      summary.push({
        shots,
        shots_label: `${(shots / 1000).toFixed(0)}K`,
        item_count: parseInt(result[0].count)
      });
    }
    
    res.json({
      success: true,
      data: {
        summary,
        thresholds: shotThresholds
      }
    });
    
  } catch (error) {
    logger.error('Get inspection summary error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get inspection summary' }
    });
  }
};

/**
 * 체크리스트 템플릿 버전 목록 조회
 * GET /api/v1/checklist-templates/versions
 */
const getTemplateVersions = async (req, res) => {
  try {
    const { template_id, status } = req.query;
    
    let whereClause = '';
    const replacements = {};
    
    if (template_id) {
      whereClause += ' AND template_id = :template_id';
      replacements.template_id = template_id;
    }
    if (status) {
      whereClause += ' AND status = :status';
      replacements.status = status;
    }
    
    const [versions] = await sequelize.query(`
      SELECT 
        v.*,
        u1.name as created_by_name,
        u2.name as approved_by_name,
        u3.name as deployed_by_name
      FROM checklist_template_versions v
      LEFT JOIN users u1 ON v.created_by = u1.id
      LEFT JOIN users u2 ON v.approved_by = u2.id
      LEFT JOIN users u3 ON v.deployed_by = u3.id
      WHERE 1=1 ${whereClause}
      ORDER BY v.template_id, v.version_number DESC
    `, { replacements });
    
    res.json({
      success: true,
      data: { versions }
    });
    
  } catch (error) {
    logger.error('Get template versions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get template versions' }
    });
  }
};

/**
 * 체크리스트 템플릿 버전 생성
 * POST /api/v1/checklist-templates/versions
 */
const createTemplateVersion = async (req, res) => {
  try {
    const { template_id, version_name, items, notes } = req.body;
    const userId = req.user?.id;
    
    // 현재 최신 버전 번호 조회
    const [latestVersion] = await sequelize.query(`
      SELECT MAX(version_number) as max_version
      FROM checklist_template_versions
      WHERE template_id = :template_id
    `, {
      replacements: { template_id }
    });
    
    const newVersionNumber = (latestVersion[0].max_version || 0) + 1;
    
    // 새 버전 생성
    const [result] = await sequelize.query(`
      INSERT INTO checklist_template_versions (
        template_id, version_number, version_name, status, items,
        created_by, notes, created_at, updated_at
      ) VALUES (
        :template_id, :version_number, :version_name, 'draft', :items::jsonb,
        :created_by, :notes, NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        template_id,
        version_number: newVersionNumber,
        version_name: version_name || `v${newVersionNumber}`,
        items: JSON.stringify(items || []),
        created_by: userId,
        notes
      }
    });
    
    res.json({
      success: true,
      data: {
        id: result[0].id,
        template_id,
        version_number: newVersionNumber,
        status: 'draft'
      }
    });
    
  } catch (error) {
    logger.error('Create template version error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create template version' }
    });
  }
};

/**
 * 체크리스트 템플릿 배포
 * POST /api/v1/checklist-templates/versions/:id/deploy
 */
const deployTemplateVersion = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // 버전 조회
    const [version] = await sequelize.query(`
      SELECT * FROM checklist_template_versions WHERE id = :id
    `, {
      replacements: { id },
      transaction
    });
    
    if (!version || version.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Version not found' }
      });
    }
    
    // 기존 배포된 버전 비활성화
    await sequelize.query(`
      UPDATE checklist_template_versions
      SET status = 'archived', updated_at = NOW()
      WHERE template_id = :template_id AND status = 'deployed'
    `, {
      replacements: { template_id: version[0].template_id },
      transaction
    });
    
    // 새 버전 배포
    await sequelize.query(`
      UPDATE checklist_template_versions
      SET status = 'deployed', deployed_at = NOW(), deployed_by = :deployed_by, updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, deployed_by: userId },
      transaction
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        status: 'deployed',
        deployed_at: new Date()
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Deploy template version error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to deploy template version' }
    });
  }
};

/**
 * 체크리스트 템플릿 롤백
 * POST /api/v1/checklist-templates/versions/:id/rollback
 */
const rollbackTemplateVersion = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // 롤백 대상 버전 조회
    const [targetVersion] = await sequelize.query(`
      SELECT * FROM checklist_template_versions WHERE id = :id
    `, {
      replacements: { id },
      transaction
    });
    
    if (!targetVersion || targetVersion.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Version not found' }
      });
    }
    
    // 현재 배포된 버전 조회
    const [currentDeployed] = await sequelize.query(`
      SELECT id FROM checklist_template_versions
      WHERE template_id = :template_id AND status = 'deployed'
    `, {
      replacements: { template_id: targetVersion[0].template_id },
      transaction
    });
    
    // 현재 배포된 버전 비활성화
    if (currentDeployed && currentDeployed.length > 0) {
      await sequelize.query(`
        UPDATE checklist_template_versions
        SET status = 'archived', updated_at = NOW()
        WHERE id = :id
      `, {
        replacements: { id: currentDeployed[0].id },
        transaction
      });
    }
    
    // 롤백 버전 재배포
    await sequelize.query(`
      UPDATE checklist_template_versions
      SET status = 'deployed', deployed_at = NOW(), deployed_by = :deployed_by, 
          rollback_from = :rollback_from, updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { 
        id, 
        deployed_by: userId,
        rollback_from: currentDeployed?.[0]?.id || null
      },
      transaction
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        status: 'deployed',
        rollback_from: currentDeployed?.[0]?.id || null
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Rollback template version error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to rollback template version' }
    });
  }
};

module.exports = {
  getInspectionItems,
  getAllInspectionItems,
  getInspectionSummary,
  getTemplateVersions,
  createTemplateVersion,
  deployTemplateVersion,
  rollbackTemplateVersion
};
