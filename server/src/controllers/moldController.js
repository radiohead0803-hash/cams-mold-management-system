const { Mold, DailyCheckItem, InspectionPhoto } = require('../models');
const logger = require('../utils/logger');

const getMolds = async (req, res) => {
  try {
    const { status, current_location, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (current_location) where.current_location = current_location;

    const molds = await Mold.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['mold_number', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        total: molds.count,
        items: molds.rows
      }
    });
  } catch (error) {
    logger.error('Get molds error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get molds' }
    });
  }
};

const getMoldById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mold = await Mold.findByPk(id, {
      include: [
        {
          model: DailyCheckItem,
          as: 'dailyChecks',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    res.json({
      success: true,
      data: mold
    });
  } catch (error) {
    logger.error('Get mold by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get mold' }
    });
  }
};

const getMoldByQR = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const mold = await Mold.findOne({ where: { qr_code: qrCode } });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    res.json({
      success: true,
      data: mold
    });
  } catch (error) {
    logger.error('Get mold by QR error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get mold' }
    });
  }
};

const createMold = async (req, res) => {
  try {
    const mold = await Mold.create(req.body);

    res.status(201).json({
      success: true,
      data: mold
    });
  } catch (error) {
    logger.error('Create mold error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create mold' }
    });
  }
};

const updateMold = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mold = await Mold.findByPk(id);
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    await mold.update(req.body);

    res.json({
      success: true,
      data: mold
    });
  } catch (error) {
    logger.error('Update mold error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update mold' }
    });
  }
};

const getMoldHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await DailyCheckItem.findAll({
      where: { mold_id: id },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Get mold history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get mold history' }
    });
  }
};

module.exports = {
  getMolds,
  getMoldById,
  getMoldByQR,
  createMold,
  updateMold,
  getMoldHistory
};
