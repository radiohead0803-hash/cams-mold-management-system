const { ChecklistTemplateHistory } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 템플릿 히스토리 기록
 * @param {Object} options
 * @param {number} options.templateId - 템플릿 ID
 * @param {string} options.action - 액션 (create, update, deploy, deactivate)
 * @param {string} options.changes - 변경 내용
 * @param {string} options.changedBy - 변경자
 */
async function writeTemplateHistory({ templateId, action, changes, changedBy }) {
  try {
    await ChecklistTemplateHistory.create({
      template_id: templateId,
      action,
      changes,
      changed_by: changedBy
    });

    logger.info(`Template history recorded: template ${templateId}, action ${action}`);
  } catch (error) {
    logger.error('Write template history error:', error);
    throw error;
  }
}

/**
 * 템플릿 히스토리 조회
 * @param {number} templateId - 템플릿 ID
 * @returns {Promise<Array>} 히스토리 목록
 */
async function getTemplateHistory(templateId) {
  try {
    const history = await ChecklistTemplateHistory.findAll({
      where: { template_id: templateId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    return history;
  } catch (error) {
    logger.error('Get template history error:', error);
    throw error;
  }
}

module.exports = {
  writeTemplateHistory,
  getTemplateHistory
};
