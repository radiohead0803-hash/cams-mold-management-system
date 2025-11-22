const { Alert, Mold } = require('../models');
const logger = require('../utils/logger');

const getAlerts = async (req, res) => {
  try {
    const { mold_id, alert_type, priority, is_read, limit = 50, offset = 0 } = req.query;
    const user_id = req.user.id;
    
    const where = {};
    if (mold_id) where.mold_id = mold_id;
    if (alert_type) where.alert_type = alert_type;
    if (priority) where.priority = priority;
    if (is_read !== undefined) where.is_read = is_read === 'true';

    const alerts = await Alert.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_number', 'mold_name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        total: alerts.count,
        items: alerts.rows
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get alerts' }
    });
  }
};

const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await Alert.findByPk(id, {
      include: [
        {
          model: Mold,
          as: 'mold'
        }
      ]
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Get alert by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get alert' }
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

    const alert = await Alert.create({
      mold_id,
      alert_type,
      priority: priority || 'medium',
      title,
      message,
      target_users: target_users || []
    });

    res.status(201).json({
      success: true,
      data: alert
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
    
    const alert = await Alert.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { message: 'Alert not found' }
      });
    }

    await alert.update({
      is_read: true,
      read_at: new Date()
    });

    res.json({
      success: true,
      data: alert
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
