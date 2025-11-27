const { CarModel, Material, MoldType, Tonnage } = require('../models');
const logger = require('../utils/logger');

// ===== 차종 관리 =====
const getCarModels = async (req, res) => {
  try {
    const { is_active } = req.query;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const carModels = await CarModel.findAll({
      where,
      order: [['sort_order', 'ASC'], ['model_name', 'ASC']]
    });

    res.json({
      success: true,
      data: carModels
    });
  } catch (error) {
    logger.error('Get car models error:', error);
    res.status(500).json({
      success: false,
      error: { message: '차종 목록 조회 실패' }
    });
  }
};

const createCarModel = async (req, res) => {
  try {
    const { model_name, model_code, manufacturer, sort_order } = req.body;

    const carModel = await CarModel.create({
      model_name,
      model_code,
      manufacturer,
      sort_order: sort_order || 0
    });

    logger.info(`Car model created: ${carModel.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: carModel
    });
  } catch (error) {
    logger.error('Create car model error:', error);
    res.status(500).json({
      success: false,
      error: { message: '차종 등록 실패', details: error.message }
    });
  }
};

const updateCarModel = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const carModel = await CarModel.findByPk(id);
    if (!carModel) {
      return res.status(404).json({
        success: false,
        error: { message: '차종을 찾을 수 없습니다' }
      });
    }

    await carModel.update(updateData);

    logger.info(`Car model updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: carModel
    });
  } catch (error) {
    logger.error('Update car model error:', error);
    res.status(500).json({
      success: false,
      error: { message: '차종 수정 실패' }
    });
  }
};

const deleteCarModel = async (req, res) => {
  try {
    const { id } = req.params;

    const carModel = await CarModel.findByPk(id);
    if (!carModel) {
      return res.status(404).json({
        success: false,
        error: { message: '차종을 찾을 수 없습니다' }
      });
    }

    // 소프트 삭제 (is_active = false)
    await carModel.update({ is_active: false });

    logger.info(`Car model deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: '차종이 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete car model error:', error);
    res.status(500).json({
      success: false,
      error: { message: '차종 삭제 실패' }
    });
  }
};

// ===== 재질 관리 =====
const getMaterials = async (req, res) => {
  try {
    const { is_active } = req.query;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const materials = await Material.findAll({
      where,
      order: [['sort_order', 'ASC'], ['material_name', 'ASC']]
    });

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    logger.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      error: { message: '재질 목록 조회 실패' }
    });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { material_name, material_code, category, hardness, description, sort_order } = req.body;

    const material = await Material.create({
      material_name,
      material_code,
      category,
      hardness,
      description,
      sort_order: sort_order || 0
    });

    logger.info(`Material created: ${material.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    logger.error('Create material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '재질 등록 실패', details: error.message }
    });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: '재질을 찾을 수 없습니다' }
      });
    }

    await material.update(updateData);

    logger.info(`Material updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    logger.error('Update material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '재질 수정 실패' }
    });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findByPk(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: { message: '재질을 찾을 수 없습니다' }
      });
    }

    await material.update({ is_active: false });

    logger.info(`Material deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: '재질이 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '재질 삭제 실패' }
    });
  }
};

// ===== 금형타입 관리 =====
const getMoldTypes = async (req, res) => {
  try {
    const { is_active } = req.query;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const moldTypes = await MoldType.findAll({
      where,
      order: [['sort_order', 'ASC'], ['type_name', 'ASC']]
    });

    res.json({
      success: true,
      data: moldTypes
    });
  } catch (error) {
    logger.error('Get mold types error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형타입 목록 조회 실패' }
    });
  }
};

const createMoldType = async (req, res) => {
  try {
    const { type_name, type_code, description, sort_order } = req.body;

    const moldType = await MoldType.create({
      type_name,
      type_code,
      description,
      sort_order: sort_order || 0
    });

    logger.info(`Mold type created: ${moldType.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: moldType
    });
  } catch (error) {
    logger.error('Create mold type error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형타입 등록 실패', details: error.message }
    });
  }
};

const updateMoldType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const moldType = await MoldType.findByPk(id);
    if (!moldType) {
      return res.status(404).json({
        success: false,
        error: { message: '금형타입을 찾을 수 없습니다' }
      });
    }

    await moldType.update(updateData);

    logger.info(`Mold type updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: moldType
    });
  } catch (error) {
    logger.error('Update mold type error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형타입 수정 실패' }
    });
  }
};

const deleteMoldType = async (req, res) => {
  try {
    const { id } = req.params;

    const moldType = await MoldType.findByPk(id);
    if (!moldType) {
      return res.status(404).json({
        success: false,
        error: { message: '금형타입을 찾을 수 없습니다' }
      });
    }

    await moldType.update({ is_active: false });

    logger.info(`Mold type deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: '금형타입이 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete mold type error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형타입 삭제 실패' }
    });
  }
};

// ===== 톤수 관리 =====
const getTonnages = async (req, res) => {
  try {
    const { is_active } = req.query;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const tonnages = await Tonnage.findAll({
      where,
      order: [['sort_order', 'ASC'], ['tonnage_value', 'ASC']]
    });

    res.json({
      success: true,
      data: tonnages
    });
  } catch (error) {
    logger.error('Get tonnages error:', error);
    res.status(500).json({
      success: false,
      error: { message: '톤수 목록 조회 실패' }
    });
  }
};

const createTonnage = async (req, res) => {
  try {
    const { tonnage_value, description, sort_order } = req.body;

    const tonnage = await Tonnage.create({
      tonnage_value,
      description,
      sort_order: sort_order || 0
    });

    logger.info(`Tonnage created: ${tonnage.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: tonnage
    });
  } catch (error) {
    logger.error('Create tonnage error:', error);
    res.status(500).json({
      success: false,
      error: { message: '톤수 등록 실패', details: error.message }
    });
  }
};

const updateTonnage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tonnage = await Tonnage.findByPk(id);
    if (!tonnage) {
      return res.status(404).json({
        success: false,
        error: { message: '톤수를 찾을 수 없습니다' }
      });
    }

    await tonnage.update(updateData);

    logger.info(`Tonnage updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: tonnage
    });
  } catch (error) {
    logger.error('Update tonnage error:', error);
    res.status(500).json({
      success: false,
      error: { message: '톤수 수정 실패' }
    });
  }
};

const deleteTonnage = async (req, res) => {
  try {
    const { id } = req.params;

    const tonnage = await Tonnage.findByPk(id);
    if (!tonnage) {
      return res.status(404).json({
        success: false,
        error: { message: '톤수를 찾을 수 없습니다' }
      });
    }

    await tonnage.update({ is_active: false });

    logger.info(`Tonnage deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: '톤수가 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete tonnage error:', error);
    res.status(500).json({
      success: false,
      error: { message: '톤수 삭제 실패' }
    });
  }
};

module.exports = {
  // 차종
  getCarModels,
  createCarModel,
  updateCarModel,
  deleteCarModel,
  // 재질
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  // 금형타입
  getMoldTypes,
  createMoldType,
  updateMoldType,
  deleteMoldType,
  // 톤수
  getTonnages,
  createTonnage,
  updateTonnage,
  deleteTonnage
};
