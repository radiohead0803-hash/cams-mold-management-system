const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 중량 업데이트 (설계중량/실중량)
 * - 이력 테이블에 기록 후 최신값을 mold_specifications에 반영
 */
const updateWeight = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;
    const { weight_type, weight_value, weight_unit, change_reason } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.username;

    if (!mold_spec_id || !weight_type || weight_value === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'mold_spec_id, weight_type, weight_value는 필수입니다.' }
      });
    }

    if (!['design', 'actual'].includes(weight_type)) {
      return res.status(400).json({
        success: false,
        error: { message: 'weight_type은 design 또는 actual이어야 합니다.' }
      });
    }

    // 권한 체크
    const userType = req.user?.user_type || req.user?.role_group;
    const isDeveloper = ['mold_developer', 'system_admin', 'hq'].includes(userType);
    
    if (weight_type === 'design' && !isDeveloper) {
      return res.status(403).json({
        success: false,
        error: { message: '설계중량은 개발담당자만 입력할 수 있습니다.' }
      });
    }
    
    if (weight_type === 'actual' && isDeveloper) {
      return res.status(403).json({
        success: false,
        error: { message: '실중량은 제작처/생산처만 입력할 수 있습니다.' }
      });
    }

    // 현재 값 조회 (이전 값 기록용)
    const columnName = weight_type === 'design' ? 'design_weight' : 'actual_weight';
    const unitColumnName = weight_type === 'design' ? 'design_weight_unit' : 'actual_weight_unit';
    
    const [currentRows] = await sequelize.query(`
      SELECT ${columnName} as current_value, ${unitColumnName} as current_unit, mold_id
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
      INSERT INTO weight_history (
        mold_spec_id, mold_id, weight_type, weight_value, weight_unit,
        change_reason, registered_by, registered_by_name, registered_at,
        previous_value, previous_unit
      ) VALUES (
        :mold_spec_id, :mold_id, :weight_type, :weight_value, :weight_unit,
        :change_reason, :registered_by, :registered_by_name, NOW(),
        :previous_value, :previous_unit
      )
    `, {
      replacements: {
        mold_spec_id,
        mold_id: currentData.mold_id,
        weight_type,
        weight_value,
        weight_unit: weight_unit || 'g',
        change_reason: change_reason || null,
        registered_by: userId,
        registered_by_name: userName,
        previous_value: currentData.current_value,
        previous_unit: currentData.current_unit
      }
    });

    // mold_specifications 최신값 업데이트
    const registeredByColumn = weight_type === 'design' ? 'design_weight_registered_by' : 'actual_weight_registered_by';
    const registeredAtColumn = weight_type === 'design' ? 'design_weight_registered_at' : 'actual_weight_registered_at';

    await sequelize.query(`
      UPDATE mold_specifications SET
        ${columnName} = :weight_value,
        ${unitColumnName} = :weight_unit,
        ${registeredByColumn} = :registered_by,
        ${registeredAtColumn} = NOW(),
        updated_at = NOW()
      WHERE id = :mold_spec_id
    `, {
      replacements: {
        weight_value,
        weight_unit: weight_unit || 'g',
        registered_by: userId,
        mold_spec_id
      }
    });

    logger.info(`Weight updated: ${weight_type} = ${weight_value}${weight_unit || 'g'} for mold_spec_id ${mold_spec_id}`);

    res.json({
      success: true,
      message: `${weight_type === 'design' ? '설계중량' : '실중량'}이 업데이트되었습니다.`,
      data: {
        weight_type,
        weight_value,
        weight_unit: weight_unit || 'g',
        registered_by: userName,
        registered_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Update weight error:', error);
    res.status(500).json({
      success: false,
      error: { message: '중량 업데이트 실패', details: error.message }
    });
  }
};

/**
 * 중량 이력 조회
 */
const getWeightHistory = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;
    const { weight_type, limit = 50 } = req.query;

    let query = `
      SELECT * FROM weight_history
      WHERE mold_spec_id = :mold_spec_id
    `;
    const replacements = { mold_spec_id, limit: parseInt(limit) };

    if (weight_type) {
      query += ` AND weight_type = :weight_type`;
      replacements.weight_type = weight_type;
    }

    query += ` ORDER BY registered_at DESC LIMIT :limit`;

    const [rows] = await sequelize.query(query, { replacements });

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    logger.error('Get weight history error:', error);
    res.status(500).json({
      success: false,
      error: { message: '중량 이력 조회 실패', details: error.message }
    });
  }
};

/**
 * 현재 중량 조회 (최신값)
 */
const getCurrentWeight = async (req, res) => {
  try {
    const { mold_spec_id } = req.params;

    const [rows] = await sequelize.query(`
      SELECT 
        design_weight, design_weight_unit,
        design_weight_registered_by, design_weight_registered_at,
        actual_weight, actual_weight_unit,
        actual_weight_registered_by, actual_weight_registered_at
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
    if (data.design_weight_registered_by) {
      const [userRows] = await sequelize.query(
        'SELECT name FROM users WHERE id = :id',
        { replacements: { id: data.design_weight_registered_by } }
      );
      data.design_weight_registered_by_name = userRows[0]?.name;
    }
    if (data.actual_weight_registered_by) {
      const [userRows] = await sequelize.query(
        'SELECT name FROM users WHERE id = :id',
        { replacements: { id: data.actual_weight_registered_by } }
      );
      data.actual_weight_registered_by_name = userRows[0]?.name;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Get current weight error:', error);
    res.status(500).json({
      success: false,
      error: { message: '중량 조회 실패', details: error.message }
    });
  }
};

module.exports = {
  updateWeight,
  getWeightHistory,
  getCurrentWeight
};
