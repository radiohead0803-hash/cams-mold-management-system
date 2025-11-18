const { Mold, Plant, Partner, Manufacturer, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 금형 목록 조회 (검색, 필터링, 페이징)
 */
const getMolds = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      mold_type,
      partner_id,
      plant_id,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // 검색 조건 구성
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { mold_code: { [Op.iLike]: `%${search}%` } },
        { mold_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (mold_type) {
      where.mold_type = mold_type;
    }

    if (partner_id) {
      where.partner_id = partner_id;
    }

    if (plant_id) {
      where.current_location_id = plant_id;
    }

    // 역할별 필터링
    if (req.user.role === 'partner_admin' || req.user.role === 'worker') {
      where.partner_id = req.user.partner_id;
    }

    // 페이징 계산
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 조회
    const { count, rows } = await Mold.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order]],
      include: [
        {
          model: Plant,
          as: 'currentLocation',
          attributes: ['id', 'plant_code', 'plant_name', 'location']
        },
        {
          model: Partner,
          as: 'partner',
          attributes: ['id', 'partner_code', 'partner_name']
        },
        {
          model: Manufacturer,
          as: 'manufacturer',
          attributes: ['id', 'manufacturer_code', 'manufacturer_name', 'country']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        molds: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 상세 조회
 */
const getMold = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mold = await Mold.findOne({
      where: { id, is_active: true },
      include: [
        {
          model: Plant,
          as: 'currentLocation',
          attributes: ['id', 'plant_code', 'plant_name', 'location', 'contact_person', 'phone']
        },
        {
          model: Partner,
          as: 'partner',
          attributes: ['id', 'partner_code', 'partner_name', 'representative', 'phone', 'email']
        },
        {
          model: Manufacturer,
          as: 'manufacturer',
          attributes: ['id', 'manufacturer_code', 'manufacturer_name', 'country', 'contact_person', 'phone']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'name', 'email']
        }
      ]
    });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOLD_NOT_FOUND',
          message: 'Mold not found'
        }
      });
    }

    // 권한 확인
    if ((req.user.role === 'partner_admin' || req.user.role === 'worker') && 
        mold.partner_id !== req.user.partner_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this mold'
        }
      });
    }

    res.json({
      success: true,
      data: mold
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 생성
 */
const createMold = async (req, res, next) => {
  try {
    const {
      mold_code,
      mold_name,
      mold_type,
      status,
      current_location_id,
      partner_id,
      manufacturer_id,
      manufacturing_date,
      weight,
      dimensions,
      cavity_count,
      material,
      notes
    } = req.body;

    // 필수 필드 검증
    if (!mold_code || !mold_name || !mold_type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Mold code, name, and type are required'
        }
      });
    }

    // 중복 코드 확인
    const existing = await Mold.findOne({ where: { mold_code } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_MOLD_CODE',
          message: 'Mold code already exists'
        }
      });
    }

    // 금형 생성
    const mold = await Mold.create({
      mold_code,
      mold_name,
      mold_type,
      status: status || 'in_storage',
      current_location_id,
      partner_id,
      manufacturer_id,
      manufacturing_date,
      weight,
      dimensions,
      cavity_count,
      material,
      notes,
      created_by: req.user.id,
      is_active: true
    });

    // 생성된 금형 조회 (관계 포함)
    const createdMold = await Mold.findByPk(mold.id, {
      include: [
        { model: Plant, as: 'currentLocation' },
        { model: Partner, as: 'partner' },
        { model: Manufacturer, as: 'manufacturer' },
        { model: User, as: 'creator' }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdMold
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 수정
 */
const updateMold = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const mold = await Mold.findOne({ where: { id, is_active: true } });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOLD_NOT_FOUND',
          message: 'Mold not found'
        }
      });
    }

    // 권한 확인
    if ((req.user.role === 'partner_admin' || req.user.role === 'worker') && 
        mold.partner_id !== req.user.partner_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this mold'
        }
      });
    }

    // 금형 코드 중복 확인
    if (updateData.mold_code && updateData.mold_code !== mold.mold_code) {
      const existing = await Mold.findOne({ where: { mold_code: updateData.mold_code } });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_MOLD_CODE',
            message: 'Mold code already exists'
          }
        });
      }
    }

    // 업데이트
    await mold.update(updateData);

    // 업데이트된 금형 조회
    const updatedMold = await Mold.findByPk(id, {
      include: [
        { model: Plant, as: 'currentLocation' },
        { model: Partner, as: 'partner' },
        { model: Manufacturer, as: 'manufacturer' },
        { model: User, as: 'creator' }
      ]
    });

    res.json({
      success: true,
      data: updatedMold
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 삭제 (소프트 삭제)
 */
const deleteMold = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mold = await Mold.findOne({ where: { id, is_active: true } });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOLD_NOT_FOUND',
          message: 'Mold not found'
        }
      });
    }

    // 권한 확인 (본사 관리자만 삭제 가능)
    if (req.user.role !== 'hq_admin' && req.user.role !== 'hq_manager') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only HQ administrators can delete molds'
        }
      });
    }

    // 소프트 삭제
    await mold.update({ is_active: false });

    res.json({
      success: true,
      message: 'Mold deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 상태 변경
 */
const updateMoldStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required'
        }
      });
    }

    const mold = await Mold.findOne({ where: { id, is_active: true } });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOLD_NOT_FOUND',
          message: 'Mold not found'
        }
      });
    }

    // 상태 업데이트
    await mold.update({ 
      status,
      notes: notes || mold.notes
    });

    const updatedMold = await Mold.findByPk(id, {
      include: [
        { model: Plant, as: 'currentLocation' },
        { model: Partner, as: 'partner' }
      ]
    });

    res.json({
      success: true,
      data: updatedMold
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 위치 변경
 */
const updateMoldLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plant_id, notes } = req.body;

    if (!plant_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Plant ID is required'
        }
      });
    }

    const mold = await Mold.findOne({ where: { id, is_active: true } });

    if (!mold) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOLD_NOT_FOUND',
          message: 'Mold not found'
        }
      });
    }

    // 위치 업데이트
    await mold.update({ 
      current_location_id: plant_id,
      notes: notes || mold.notes
    });

    const updatedMold = await Mold.findByPk(id, {
      include: [
        { model: Plant, as: 'currentLocation' },
        { model: Partner, as: 'partner' }
      ]
    });

    res.json({
      success: true,
      data: updatedMold
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 금형 통계
 */
const getMoldStats = async (req, res, next) => {
  try {
    const where = { is_active: true };

    // 역할별 필터링
    if (req.user.role === 'partner_admin' || req.user.role === 'worker') {
      where.partner_id = req.user.partner_id;
    }

    // 전체 금형 수
    const total = await Mold.count({ where });

    // 상태별 통계
    const byStatus = await Mold.findAll({
      where,
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 타입별 통계
    const byType = await Mold.findAll({
      where,
      attributes: [
        'mold_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['mold_type'],
      raw: true
    });

    // 위치별 통계
    const byLocation = await Mold.findAll({
      where,
      attributes: [
        'current_location_id',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      include: [{
        model: Plant,
        as: 'currentLocation',
        attributes: ['plant_name']
      }],
      group: ['current_location_id', 'currentLocation.id', 'currentLocation.plant_name'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total,
        by_status: byStatus,
        by_type: byType,
        by_location: byLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMolds,
  getMold,
  createMold,
  updateMold,
  deleteMold,
  updateMoldStatus,
  updateMoldLocation,
  getMoldStats
};
