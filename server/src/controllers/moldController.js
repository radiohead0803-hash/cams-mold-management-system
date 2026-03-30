const { Mold, DailyCheckItem, InspectionPhoto, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

const getMolds = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status) where.status = status;

    const molds = await Mold.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['mold_code', 'ASC']]
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

/**
 * GPS 위치 관련 메서드
 */

// 전체 금형 위치 조회 (필터링 지원)
const getMoldLocations = async (req, res) => {
  try {
    const { status } = req.query;
    // raw SQL로 실제 DB 컬럼 사용
    let sql = `SELECT m.id, m.mold_code, m.mold_name, m.status, m.location, m.location_status,
                      m.base_gps_lat AS latitude, m.last_gps_lat AS last_latitude,
                      m.updated_at
               FROM molds m WHERE m.base_gps_lat IS NOT NULL`;
    const binds = [];
    if (status) { binds.push(status); sql += ' AND m.status = $' + binds.length; }
    sql += ' ORDER BY m.updated_at DESC LIMIT 200';

    const [molds] = await sequelize.query(sql, { bind: binds });
    
    res.json({
      success: true,
      data: molds.map(mold => ({
        moldId: mold.id,
        moldCode: mold.mold_code,
        moldName: mold.mold_name,
        status: mold.status,
        latitude: mold.latitude ? parseFloat(mold.latitude) : null,
        longitude: mold.last_latitude ? parseFloat(mold.last_latitude) : null,
        locationStatus: mold.location_status,
        location: mold.location,
        updatedAt: mold.updated_at
      }))
    });
  } catch (error) {
    logger.error('Get mold locations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get mold locations' }
    });
  }
};

// 특정 금형 위치 조회
const getMoldLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await sequelize.query(`
      SELECT id, mold_code, mold_name, status, location, location_status,
             base_gps_lat, base_gps_lng, last_gps_lat, last_gps_lng, last_gps_time,
             updated_at
      FROM molds WHERE id = $1
    `, { bind: [id] });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    const mold = rows[0];
    res.json({
      success: true,
      data: {
        moldId: mold.id,
        moldCode: mold.mold_code,
        moldName: mold.mold_name,
        latitude: mold.last_gps_lat ? parseFloat(mold.last_gps_lat) : null,
        longitude: mold.last_gps_lng ? parseFloat(mold.last_gps_lng) : null,
        baseLat: mold.base_gps_lat ? parseFloat(mold.base_gps_lat) : null,
        baseLng: mold.base_gps_lng ? parseFloat(mold.base_gps_lng) : null,
        locationStatus: mold.location_status,
        location: mold.location,
        lastGpsTime: mold.last_gps_time,
        updatedAt: mold.updated_at
      }
    });
  } catch (error) {
    logger.error('Get mold location error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get mold location' }
    });
  }
};

// 금형 위치 업데이트
const updateMoldLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, location_name } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }

    // 금형 존재 확인
    const [rows] = await sequelize.query('SELECT id, mold_code FROM molds WHERE id = $1', { bind: [id] });
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 위치 업데이트 (실제 DB 컬럼 사용)
    await sequelize.query(`
      UPDATE molds SET last_gps_lat = $1, last_gps_lng = $2, last_gps_time = NOW(),
             location = COALESCE($3, location), updated_at = NOW()
      WHERE id = $4
    `, { bind: [latitude, longitude, location_name || null, id] });

    res.json({
      success: true,
      data: {
        moldId: parseInt(id),
        moldCode: rows[0].mold_code,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationName: location_name,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Update mold location error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update mold location' }
    });
  }
};

module.exports = {
  getMolds,
  getMoldById,
  getMoldByQR,
  createMold,
  updateMold,
  getMoldHistory,
  getMoldLocations,
  getMoldLocation,
  updateMoldLocation
};
