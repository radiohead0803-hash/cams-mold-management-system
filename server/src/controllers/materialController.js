const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 원재료 정보 업데이트 (개발담당자만 가능)
 * - 이력 테이블에 기록 후 최신값을 mold_specifications에 반영
 */
const updateMaterial = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;
    const { material_spec, material_grade, material_supplier, material_shrinkage, mold_shrinkage, change_reason } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.username;

    // 권한 체크 - 개발담당자만 가능
    const userType = req.user?.user_type || req.user?.role_group;
    const isDeveloper = ['mold_developer', 'system_admin', 'hq'].includes(userType);
    
    if (!isDeveloper) {
      return res.status(403).json({
        success: false,
        error: { message: '원재료 정보는 개발담당자만 입력할 수 있습니다.' }
      });
    }

    // 현재 값 조회 (이전 값 기록용)
    const [currentRows] = await sequelize.query(`
      SELECT material_spec, material_grade, material_supplier, material_shrinkage, mold_shrinkage, mold_id
      FROM mold_specifications WHERE id = :mold_spec_id
    `, { replacements: { mold_spec_id } });

    const currentData = currentRows[0];
    if (!currentData) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다.' }
      });
    }

    // 이력 테이블에 기록
    await sequelize.query(`
      INSERT INTO material_history (
        mold_spec_id, mold_id, material_spec, material_grade, material_supplier,
        material_shrinkage, mold_shrinkage, change_reason,
        registered_by, registered_by_name, registered_at, previous_data
      ) VALUES (
        :mold_spec_id, :mold_id, :material_spec, :material_grade, :material_supplier,
        :material_shrinkage, :mold_shrinkage, :change_reason,
        :registered_by, :registered_by_name, NOW(), :previous_data
      )
    `, {
      replacements: {
        mold_spec_id,
        mold_id: currentData.mold_id,
        material_spec: material_spec || null,
        material_grade: material_grade || null,
        material_supplier: material_supplier || null,
        material_shrinkage: material_shrinkage || null,
        mold_shrinkage: mold_shrinkage || null,
        change_reason: change_reason || null,
        registered_by: userId,
        registered_by_name: userName,
        previous_data: JSON.stringify({
          material_spec: currentData.material_spec,
          material_grade: currentData.material_grade,
          material_supplier: currentData.material_supplier,
          material_shrinkage: currentData.material_shrinkage,
          mold_shrinkage: currentData.mold_shrinkage
        })
      }
    });

    // mold_specifications 최신값 업데이트
    await sequelize.query(`
      UPDATE mold_specifications SET
        material_spec = :material_spec,
        material_grade = :material_grade,
        material_supplier = :material_supplier,
        material_shrinkage = :material_shrinkage,
        mold_shrinkage = :mold_shrinkage,
        material_registered_by = :registered_by,
        material_registered_at = NOW(),
        updated_at = NOW()
      WHERE id = :mold_spec_id
    `, {
      replacements: {
        material_spec: material_spec || null,
        material_grade: material_grade || null,
        material_supplier: material_supplier || null,
        material_shrinkage: material_shrinkage || null,
        mold_shrinkage: mold_shrinkage || null,
        registered_by: userId,
        mold_spec_id
      }
    });

    logger.info(`Material info updated for mold_spec_id ${mold_spec_id} by ${userName}`);

    res.json({
      success: true,
      message: '원재료 정보가 업데이트되었습니다.',
      data: {
        material_spec,
        material_grade,
        material_supplier,
        material_shrinkage,
        mold_shrinkage,
        registered_by: userName,
        registered_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Update material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 정보 업데이트 실패', details: error.message }
    });
  }
};

/**
 * 원재료 이력 조회
 */
const getMaterialHistory = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;
    const { limit = 50 } = req.query;

    const [rows] = await sequelize.query(`
      SELECT * FROM material_history
      WHERE mold_spec_id = :mold_spec_id
      ORDER BY registered_at DESC
      LIMIT :limit
    `, { replacements: { mold_spec_id, limit: parseInt(limit) } });

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    logger.error('Get material history error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 이력 조회 실패', details: error.message }
    });
  }
};

/**
 * 현재 원재료 정보 조회
 */
const getCurrentMaterial = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;

    const [rows] = await sequelize.query(`
      SELECT 
        material_spec, material_grade, material_supplier,
        material_shrinkage, mold_shrinkage,
        material_registered_by, material_registered_at
      FROM mold_specifications
      WHERE id = :mold_spec_id
    `, { replacements: { mold_spec_id } });

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다.' }
      });
    }

    // 등록자 이름 조회
    const data = rows[0];
    if (data.material_registered_by) {
      const [userRows] = await sequelize.query(
        'SELECT name FROM users WHERE id = :id',
        { replacements: { id: data.material_registered_by } }
      );
      data.material_registered_by_name = userRows[0]?.name;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Get current material error:', error);
    res.status(500).json({
      success: false,
      error: { message: '원재료 정보 조회 실패', details: error.message }
    });
  }
};

module.exports = {
  updateMaterial,
  getMaterialHistory,
  getCurrentMaterial
};
