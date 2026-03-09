const { CarModel, Material, MoldType, Tonnage, sequelize } = require('../models/newIndex');
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
    const { model_name, model_code, project_name, specification, model_year, manufacturer, sort_order } = req.body;

    const carModel = await CarModel.create({
      model_name,
      model_code,
      project_name,
      specification,
      model_year,
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

    let whereClause = '';
    if (is_active !== undefined) {
      whereClause = `WHERE is_active = ${is_active === 'true'}`;
    }

    const [materials] = await sequelize.query(`
      SELECT * FROM materials ${whereClause} ORDER BY sort_order ASC, material_name ASC
    `);

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    logger.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형재질 목록 조회 실패' }
    });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { material_name, material_code, category, hardness, description, usage_type, heat_treatment, machinability, weldability, polishability, corrosion_resistance, wear_resistance, sort_order } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO materials (material_name, material_code, category, hardness, description, usage_type, heat_treatment, machinability, weldability, polishability, corrosion_resistance, wear_resistance, sort_order, is_active, created_at, updated_at)
      VALUES (:material_name, :material_code, :category, :hardness, :description, :usage_type, :heat_treatment, :machinability, :weldability, :polishability, :corrosion_resistance, :wear_resistance, :sort_order, true, NOW(), NOW())
      RETURNING *
    `, {
      replacements: {
        material_name,
        material_code: material_code || null,
        category: category || null,
        hardness: hardness || null,
        description: description || null,
        usage_type: usage_type || null,
        heat_treatment: heat_treatment || null,
        machinability: machinability || null,
        weldability: weldability || null,
        polishability: polishability || null,
        corrosion_resistance: corrosion_resistance || null,
        wear_resistance: wear_resistance || null,
        sort_order: sort_order || 0
      }
    });

    logger.info(`Material created: ${result[0].id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: result[0]
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
    const updateFields = [];
    const replacements = { id };

    const allowedFields = ['material_name', 'material_code', 'category', 'hardness', 'description', 'usage_type', 'heat_treatment', 'machinability', 'weldability', 'polishability', 'corrosion_resistance', 'wear_resistance', 'sort_order', 'is_active'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = req.body[field];
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: { message: '수정할 데이터가 없습니다' } });
    }

    updateFields.push('updated_at = NOW()');

    const [result] = await sequelize.query(`
      UPDATE materials SET ${updateFields.join(', ')} WHERE id = :id RETURNING *
    `, { replacements });

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: { message: '금형재질을 찾을 수 없습니다' } });
    }

    logger.info(`Material updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Update material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형재질 수정 실패' }
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
    let whereClause = '';
    if (is_active !== undefined) {
      whereClause = `WHERE is_active = ${is_active === 'true'}`;
    }

    const [moldTypes] = await sequelize.query(`
      SELECT * FROM mold_types ${whereClause} ORDER BY sort_order ASC, type_name ASC
    `);

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
    const { type_name, type_code, description, category, sub_category, molding_method, typical_materials, sort_order } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO mold_types (type_name, type_code, description, category, sub_category, molding_method, typical_materials, sort_order, is_active, created_at, updated_at)
      VALUES (:type_name, :type_code, :description, :category, :sub_category, :molding_method, :typical_materials, :sort_order, true, NOW(), NOW())
      RETURNING *
    `, {
      replacements: {
        type_name,
        type_code: type_code || null,
        description: description || null,
        category: category || null,
        sub_category: sub_category || null,
        molding_method: molding_method || null,
        typical_materials: typical_materials || null,
        sort_order: sort_order || 0
      }
    });

    logger.info(`Mold type created: ${result[0].id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: result[0]
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
    const updateFields = [];
    const replacements = { id };

    const allowedFields = ['type_name', 'type_code', 'description', 'category', 'sub_category', 'molding_method', 'typical_materials', 'sort_order', 'is_active'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = req.body[field];
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: { message: '수정할 데이터가 없습니다' } });
    }

    updateFields.push('updated_at = NOW()');

    const [result] = await sequelize.query(`
      UPDATE mold_types SET ${updateFields.join(', ')} WHERE id = :id RETURNING *
    `, { replacements });

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: { message: '금형타입을 찾을 수 없습니다' } });
    }

    logger.info(`Mold type updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: result[0]
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

// ===== 톤수 관리 (사출기 사양) =====
const getTonnages = async (req, res) => {
  try {
    const { is_active } = req.query;
    let whereClause = '';
    if (is_active !== undefined) {
      whereClause = `WHERE is_active = ${is_active === 'true'}`;
    }

    const [tonnages] = await sequelize.query(`
      SELECT * FROM tonnages ${whereClause} ORDER BY sort_order ASC, tonnage_value ASC
    `);

    res.json({
      success: true,
      data: tonnages
    });
  } catch (error) {
    logger.error('Get tonnages error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사출기 사양 목록 조회 실패' }
    });
  }
};

const createTonnage = async (req, res) => {
  try {
    const {
      tonnage_value, manufacturer, model_name, clamping_stroke,
      daylight_opening, platen_size_h, platen_size_v,
      tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness,
      max_mold_width, max_mold_height,
      ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight,
      injection_pressure, injection_rate, plasticizing_capacity,
      nozzle_contact_force, machine_dimensions, machine_weight, motor_power,
      description, sort_order
    } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO tonnages (
        tonnage_value, manufacturer, model_name, clamping_force, clamping_stroke,
        daylight_opening, platen_size_h, platen_size_v,
        tiebar_spacing_h, tiebar_spacing_v, min_mold_thickness, max_mold_thickness,
        max_mold_width, max_mold_height,
        ejector_force, ejector_stroke, screw_diameter, shot_volume, shot_weight,
        injection_pressure, injection_rate, plasticizing_capacity,
        nozzle_contact_force, machine_dimensions, machine_weight, motor_power,
        description, sort_order, is_active, created_at, updated_at
      ) VALUES (
        :tonnage_value, :manufacturer, :model_name, :tonnage_value, :clamping_stroke,
        :daylight_opening, :platen_size_h, :platen_size_v,
        :tiebar_spacing_h, :tiebar_spacing_v, :min_mold_thickness, :max_mold_thickness,
        :max_mold_width, :max_mold_height,
        :ejector_force, :ejector_stroke, :screw_diameter, :shot_volume, :shot_weight,
        :injection_pressure, :injection_rate, :plasticizing_capacity,
        :nozzle_contact_force, :machine_dimensions, :machine_weight, :motor_power,
        :description, :sort_order, true, NOW(), NOW()
      ) RETURNING *
    `, {
      replacements: {
        tonnage_value, manufacturer: manufacturer || null, model_name: model_name || null,
        clamping_stroke: clamping_stroke || null, daylight_opening: daylight_opening || null,
        platen_size_h: platen_size_h || null, platen_size_v: platen_size_v || null,
        tiebar_spacing_h: tiebar_spacing_h || null, tiebar_spacing_v: tiebar_spacing_v || null,
        min_mold_thickness: min_mold_thickness || null, max_mold_thickness: max_mold_thickness || null,
        max_mold_width: max_mold_width || null, max_mold_height: max_mold_height || null,
        ejector_force: ejector_force || null, ejector_stroke: ejector_stroke || null,
        screw_diameter: screw_diameter || null, shot_volume: shot_volume || null,
        shot_weight: shot_weight || null, injection_pressure: injection_pressure || null,
        injection_rate: injection_rate || null, plasticizing_capacity: plasticizing_capacity || null,
        nozzle_contact_force: nozzle_contact_force || null, machine_dimensions: machine_dimensions || null,
        machine_weight: machine_weight || null, motor_power: motor_power || null,
        description: description || null, sort_order: sort_order || 0
      }
    });

    logger.info(`Tonnage created: ${result[0].id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: result[0]
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
    const updateFields = [];
    const replacements = { id };

    const allowedFields = [
      'tonnage_value', 'manufacturer', 'model_name', 'clamping_force', 'clamping_stroke',
      'daylight_opening', 'platen_size_h', 'platen_size_v',
      'tiebar_spacing_h', 'tiebar_spacing_v', 'min_mold_thickness', 'max_mold_thickness',
      'max_mold_width', 'max_mold_height',
      'ejector_force', 'ejector_stroke', 'screw_diameter', 'shot_volume', 'shot_weight',
      'injection_pressure', 'injection_rate', 'plasticizing_capacity',
      'nozzle_contact_force', 'machine_dimensions', 'machine_weight', 'motor_power',
      'description', 'sort_order', 'is_active'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = req.body[field];
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '수정할 필드가 없습니다' }
      });
    }

    updateFields.push('updated_at = NOW()');

    const [result] = await sequelize.query(`
      UPDATE tonnages SET ${updateFields.join(', ')} WHERE id = :id RETURNING *
    `, { replacements });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '톤수를 찾을 수 없습니다' }
      });
    }

    logger.info(`Tonnage updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: result[0]
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

// 금형사이즈/형체력 기반 사출기 추천 API
const recommendTonnages = async (req, res) => {
  try {
    const { mold_width, mold_height, clamping_force, manufacturer } = req.query;
    
    let whereConditions = ['is_active = true'];
    const replacements = {};
    
    // 금형 사이즈 기준 추천 (최대 금형 사이즈보다 큰 사출기)
    if (mold_width && mold_height) {
      whereConditions.push('max_mold_width >= :mold_width');
      whereConditions.push('max_mold_height >= :mold_height');
      replacements.mold_width = parseInt(mold_width);
      replacements.mold_height = parseInt(mold_height);
    }
    
    // 형체력 기준 추천
    if (clamping_force) {
      whereConditions.push('clamping_force >= :clamping_force');
      replacements.clamping_force = parseInt(clamping_force);
    }
    
    // 제조처 필터
    if (manufacturer) {
      whereConditions.push('manufacturer = :manufacturer');
      replacements.manufacturer = manufacturer;
    }
    
    const [tonnages] = await sequelize.query(`
      SELECT * FROM tonnages 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY clamping_force ASC, tonnage_value ASC
      LIMIT 20
    `, { replacements });
    
    res.json({
      success: true,
      data: tonnages,
      recommendation: tonnages.length > 0 ? {
        optimal: tonnages[0],
        message: `금형 사이즈에 적합한 최소 사출기: ${tonnages[0].tonnage_value}T (${tonnages[0].manufacturer})`
      } : null
    });
  } catch (error) {
    logger.error('Recommend tonnages error:', error);
    res.status(500).json({
      success: false,
      error: { message: '톤수 삭제 실패' }
    });
  }
};

// 제작처 사출기 데이터 자동 수집/분석/추가
const syncTonnagesFromMakers = async (req, res) => {
  try {
    // 1) 기존 tonnages에서 이미 등록된 (tonnage_value + manufacturer) 조합 조회
    const [existingTonnages] = await sequelize.query(`
      SELECT tonnage_value, COALESCE(manufacturer, '') as manufacturer FROM tonnages WHERE is_active = true
    `);
    const existingSet = new Set(existingTonnages.map(t => `${t.tonnage_value}_${t.manufacturer}`));

    // 2) maker_specifications에서 사출기 톤수 데이터 수집
    const [makerData] = await sequelize.query(`
      SELECT DISTINCT 
        ms.tonnage as tonnage_value,
        ms.maker_id,
        u.name as maker_name,
        c.company_name as company_name,
        COUNT(*) as usage_count
      FROM maker_specifications ms
      LEFT JOIN users u ON ms.maker_id = u.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE ms.tonnage IS NOT NULL AND ms.tonnage > 0
      GROUP BY ms.tonnage, ms.maker_id, u.name, c.company_name
      ORDER BY ms.tonnage ASC
    `);

    // 3) mold_specifications에서도 사출기 톤수 데이터 수집
    const [moldSpecData] = await sequelize.query(`
      SELECT DISTINCT 
        tonnage as tonnage_value,
        COUNT(*) as usage_count
      FROM mold_specifications
      WHERE tonnage IS NOT NULL AND tonnage > 0
      GROUP BY tonnage
      ORDER BY tonnage ASC
    `);

    // 4) 신규 톤수 식별 및 자동 추가
    const newlyAdded = [];
    const analyzed = [];

    // 제작처 데이터에서 신규 발견
    for (const item of makerData) {
      const key = `${item.tonnage_value}_`;
      const keyWithMaker = `${item.tonnage_value}_${item.company_name || ''}`;
      
      analyzed.push({
        tonnage_value: item.tonnage_value,
        source_maker: item.maker_name || item.company_name || '제작처',
        usage_count: parseInt(item.usage_count)
      });

      // 같은 톤수가 이미 존재하는지 확인 (manufacturer 무관)
      const alreadyExists = existingTonnages.some(t => t.tonnage_value === item.tonnage_value);
      if (!alreadyExists) {
        try {
          // 중복 방지: tonnage_value로 한 번 더 확인
          const [check] = await sequelize.query(
            'SELECT id FROM tonnages WHERE tonnage_value = :tv LIMIT 1',
            { replacements: { tv: item.tonnage_value } }
          );
          if (check.length === 0) {
            const maxOrder = await sequelize.query(
              'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM tonnages',
              { type: sequelize.QueryTypes.SELECT }
            );
            const nextOrder = maxOrder[0]?.next_order || 1;

            await sequelize.query(`
              INSERT INTO tonnages (tonnage_value, manufacturer, clamping_force, description, sort_order, is_active, is_new, source, created_at, updated_at)
              VALUES (:tv, :mfr, :cf, :desc, :so, true, true, 'auto_sync', NOW(), NOW())
            `, {
              replacements: {
                tv: item.tonnage_value,
                mfr: item.company_name || '자동수집',
                cf: item.tonnage_value,
                desc: `제작처(${item.maker_name || item.company_name || '미상'}) 금형 ${item.usage_count}건에서 자동 수집`,
                so: nextOrder
              }
            });

            newlyAdded.push({
              tonnage_value: item.tonnage_value,
              manufacturer: item.company_name || '자동수집',
              source_maker: item.maker_name || item.company_name,
              usage_count: parseInt(item.usage_count)
            });

            // existingSet 업데이트
            existingSet.add(`${item.tonnage_value}_${item.company_name || ''}`);
          }
        } catch (insertErr) {
          logger.warn(`Tonnage sync insert skip (${item.tonnage_value}T):`, insertErr.message);
        }
      }
    }

    // 금형사양 데이터에서 신규 발견
    for (const item of moldSpecData) {
      const alreadyExists = existingTonnages.some(t => t.tonnage_value === item.tonnage_value) 
        || newlyAdded.some(n => n.tonnage_value === item.tonnage_value);
      
      if (!alreadyExists) {
        try {
          const [check] = await sequelize.query(
            'SELECT id FROM tonnages WHERE tonnage_value = :tv LIMIT 1',
            { replacements: { tv: item.tonnage_value } }
          );
          if (check.length === 0) {
            const maxOrder = await sequelize.query(
              'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM tonnages',
              { type: sequelize.QueryTypes.SELECT }
            );
            const nextOrder = maxOrder[0]?.next_order || 1;

            await sequelize.query(`
              INSERT INTO tonnages (tonnage_value, clamping_force, description, sort_order, is_active, is_new, source, created_at, updated_at)
              VALUES (:tv, :cf, :desc, :so, true, true, 'auto_sync', NOW(), NOW())
            `, {
              replacements: {
                tv: item.tonnage_value,
                cf: item.tonnage_value,
                desc: `금형사양 ${item.usage_count}건에서 자동 수집`,
                so: nextOrder
              }
            });

            newlyAdded.push({
              tonnage_value: item.tonnage_value,
              manufacturer: '자동수집',
              source_maker: '금형사양',
              usage_count: parseInt(item.usage_count)
            });
          }
        } catch (insertErr) {
          logger.warn(`Tonnage sync insert skip (${item.tonnage_value}T):`, insertErr.message);
        }
      }
    }

    // 5) 결과 반환
    const [updatedList] = await sequelize.query(`
      SELECT * FROM tonnages WHERE is_active = true ORDER BY tonnage_value ASC
    `);

    res.json({
      success: true,
      data: updatedList,
      syncResult: {
        analyzed_count: analyzed.length + moldSpecData.length,
        existing_count: existingTonnages.length,
        newly_added_count: newlyAdded.length,
        newly_added: newlyAdded,
        analyzed: analyzed.slice(0, 20)
      }
    });
  } catch (error) {
    logger.error('Sync tonnages from makers error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사출기 데이터 자동 수집 실패: ' + error.message }
    });
  }
};

// ===== 원재료 관리 =====
const getRawMaterials = async (req, res) => {
  try {
    const { is_active, supplier, ms_spec } = req.query;
    let whereClause = '';
    const replacements = {};
    
    if (is_active !== undefined) {
      whereClause += ' WHERE is_active = :is_active';
      replacements.is_active = is_active === 'true';
    }
    if (supplier) {
      whereClause += whereClause ? ' AND supplier = :supplier' : ' WHERE supplier = :supplier';
      replacements.supplier = supplier;
    }
    if (ms_spec) {
      whereClause += whereClause ? ' AND ms_spec = :ms_spec' : ' WHERE ms_spec = :ms_spec';
      replacements.ms_spec = ms_spec;
    }

    const [rawMaterials] = await sequelize.query(
      `SELECT * FROM raw_materials${whereClause} ORDER BY sort_order ASC, ms_spec ASC`,
      { replacements }
    );

    res.json({
      success: true,
      data: rawMaterials
    });
  } catch (error) {
    logger.error('Get raw materials error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 목록 조회 실패' }
    });
  }
};

const createRawMaterial = async (req, res) => {
  try {
    const {
      ms_spec, material_type, grade, grade_code, supplier,
      shrinkage_rate, specific_gravity, mold_shrinkage,
      usage, advantages, disadvantages, characteristics,
      unit_price, notes, sort_order
    } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO raw_materials (
        ms_spec, material_type, grade, grade_code, supplier,
        shrinkage_rate, specific_gravity, mold_shrinkage,
        usage, advantages, disadvantages, characteristics,
        unit_price, notes, sort_order, is_active, created_at, updated_at
      ) VALUES (
        :ms_spec, :material_type, :grade, :grade_code, :supplier,
        :shrinkage_rate, :specific_gravity, :mold_shrinkage,
        :usage, :advantages, :disadvantages, :characteristics,
        :unit_price, :notes, :sort_order, true, NOW(), NOW()
      ) RETURNING *
    `, {
      replacements: {
        ms_spec, material_type,
        grade: grade || null, grade_code: grade_code || null, supplier: supplier || null,
        shrinkage_rate: shrinkage_rate || null, specific_gravity: specific_gravity || null,
        mold_shrinkage: mold_shrinkage || null,
        usage: usage || null, advantages: advantages || null,
        disadvantages: disadvantages || null, characteristics: characteristics || null,
        unit_price: unit_price || null, notes: notes || null, sort_order: sort_order || 0
      }
    });

    logger.info(`Raw material created: ${result[0].id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Create raw material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 등록 실패', details: error.message }
    });
  }
};

const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const replacements = { id };

    const allowedFields = [
      'ms_spec', 'material_type', 'grade', 'grade_code', 'supplier',
      'shrinkage_rate', 'specific_gravity', 'mold_shrinkage',
      'usage', 'advantages', 'disadvantages', 'characteristics',
      'unit_price', 'notes', 'sort_order', 'is_active'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = req.body[field];
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '수정할 필드가 없습니다' }
      });
    }

    updateFields.push('updated_at = NOW()');

    const [result] = await sequelize.query(
      `UPDATE raw_materials SET ${updateFields.join(', ')} WHERE id = :id RETURNING *`,
      { replacements }
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '원재료를 찾을 수 없습니다' }
      });
    }

    logger.info(`Raw material updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Update raw material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 수정 실패' }
    });
  }
};

const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await sequelize.query(
      'DELETE FROM raw_materials WHERE id = :id RETURNING id',
      { replacements: { id } }
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '원재료를 찾을 수 없습니다' }
      });
    }

    logger.info(`Raw material deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: '원재료가 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete raw material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 삭제 실패' }
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
  // 톤수 (사출기 사양)
  getTonnages,
  createTonnage,
  updateTonnage,
  deleteTonnage,
  recommendTonnages,
  syncTonnagesFromMakers,
  // 원재료
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial
};
