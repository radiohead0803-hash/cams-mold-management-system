const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

const getAlerts = async (req, res) => {
  try {
    const { mold_id, alert_type, priority, is_read, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (mold_id) {
      whereClause += ' AND a.mold_id = :mold_id';
      replacements.mold_id = mold_id;
    }
    if (alert_type) {
      whereClause += ' AND a.alert_type = :alert_type';
      replacements.alert_type = alert_type;
    }
    if (priority) {
      whereClause += ' AND a.priority = :priority';
      replacements.priority = priority;
    }
    if (is_read !== undefined) {
      whereClause += ' AND a.is_read = :is_read';
      replacements.is_read = is_read === 'true';
    }

    const [alerts] = await sequelize.query(`
      SELECT a.*, ms.mold_code, ms.part_name as mold_name
      FROM alerts a
      LEFT JOIN mold_specifications ms ON a.mold_id = ms.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements });

    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM alerts a ${whereClause}
    `, { replacements });

    res.json({
      success: true,
      data: {
        total: parseInt(countResult[0]?.count || 0),
        items: alerts || []
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    // 테이블이 없어도 빈 배열 반환
    res.json({
      success: true,
      data: { total: 0, items: [] }
    });
  }
};

const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [alerts] = await sequelize.query(`
      SELECT a.*, ms.mold_code, ms.part_name as mold_name
      FROM alerts a
      LEFT JOIN mold_specifications ms ON a.mold_id = ms.id
      WHERE a.id = :id
    `, { replacements: { id } });

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    res.json({
      success: true,
      data: alerts[0]
    });
  } catch (error) {
    logger.error('Get alert by ID error:', error);
    res.status(404).json({
      success: false,
      error: { message: 'Alert not found' }
    });
  }
};

const triggerAlert = async (req, res) => {
  try {
    const { mold_id, alert_type, priority, title, message, target_users } = req.body;

    if (!alert_type || !title) {
      return res.status(400).json({
        success: false,
        error: { message: 'alert_type and title are required' }
      });
    }

    const [result] = await sequelize.query(`
      INSERT INTO alerts (mold_id, alert_type, priority, title, message, target_users, created_at, updated_at)
      VALUES (:mold_id, :alert_type, :priority, :title, :message, :target_users, NOW(), NOW())
      RETURNING *
    `, {
      replacements: {
        mold_id: mold_id || null,
        alert_type,
        priority: priority || 'medium',
        title,
        message: message || null,
        target_users: JSON.stringify(target_users || [])
      }
    });

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Trigger alert error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to trigger alert' }
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await sequelize.query(`
      UPDATE alerts SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE id = :id
      RETURNING *
    `, { replacements: { id } });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark alert as read' }
    });
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  triggerAlert,
  markAsRead
};
