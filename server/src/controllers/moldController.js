const { Mold, DailyCheckItem, InspectionPhoto } = require('../models/newIndex');
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

/**
 * GPS 위치 관련 메서드
 */

// 전체 금형 위치 조회 (필터링 지원)
const getMoldLocations = async (req, res) => {
  try {
    const { status, plantId, companyId } = req.query;
    const { Op } = require('sequelize');
    
    const where = {
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null }
    };
    
    if (status) {
      where.status = status;
    }
    
    if (plantId) {
      where.current_location_company_id = plantId;
    }
    
    if (companyId) {
      where.current_location_company_id = companyId;
    }
    
    const molds = await Mold.findAll({
      where,
      attributes: [
        'id',
        'mold_number',
        'mold_name',
        'status',
        'latitude',
        'longitude',
        'is_out_of_area',
        'current_location',
        'current_location_company_id',
        'updated_at'
      ],
      order: [['updated_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: molds.map(mold => ({
        moldId: mold.id,
        moldCode: mold.mold_number,
        moldName: mold.mold_name,
        status: mold.status,
        latitude: parseFloat(mold.latitude),
        longitude: parseFloat(mold.longitude),
        isOutOfArea: mold.is_out_of_area,
        locationName: mold.current_location,
        locationCompanyId: mold.current_location_company_id,
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
    
    const mold = await Mold.findByPk(id, {
      attributes: [
        'id',
        'mold_number',
        'mold_name',
        'latitude',
        'longitude',
        'is_out_of_area',
        'current_location',
        'current_location_company_id',
        'updated_at'
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
      data: {
        moldId: mold.id,
        moldCode: mold.mold_number,
        moldName: mold.mold_name,
        latitude: mold.latitude ? parseFloat(mold.latitude) : null,
        longitude: mold.longitude ? parseFloat(mold.longitude) : null,
        isOutOfArea: mold.is_out_of_area,
        locationName: mold.current_location,
        locationCompanyId: mold.current_location_company_id,
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
    const { latitude, longitude, location_name, company_id } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }
    
    const mold = await Mold.findByPk(id);
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }
    
    // 위치 업데이트
    await mold.update({
      latitude,
      longitude,
      current_location: location_name || mold.current_location,
      current_location_company_id: company_id || mold.current_location_company_id,
      is_out_of_area: false, // 위치 업데이트 시 일단 정상으로 설정
      updated_at: new Date()
    });
    
    // TODO: 위치 이탈 검증 로직 추가
    // - 등록된 공장/창고 범위 내에 있는지 확인
    // - 범위 밖이면 is_out_of_area = true 설정 및 알림 생성
    
    res.json({
      success: true,
      data: {
        moldId: mold.id,
        moldCode: mold.mold_number,
        latitude: parseFloat(mold.latitude),
        longitude: parseFloat(mold.longitude),
        locationName: mold.current_location,
        updatedAt: mold.updated_at
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
