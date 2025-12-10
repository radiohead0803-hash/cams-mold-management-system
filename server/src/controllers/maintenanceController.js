const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 유지보전 기록 목록 조회
 * GET /api/v1/maintenance
 */
const getMaintenanceRecords = async (req, res) => {
  try {
    const { mold_id, maintenance_type, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (mold_id) {
      whereClause += ' AND mr.mold_id = :mold_id';
      replacements.mold_id = mold_id;
    }
    if (maintenance_type) {
      whereClause += ' AND mr.maintenance_type = :maintenance_type';
      replacements.maintenance_type = maintenance_type;
    }
    
    const [records] = await sequelize.query(`
      SELECT 
        mr.*,
        m.mold_code,
        ms.part_number,
        ms.part_name,
        u.name as performed_by_name
      FROM maintenance_records mr
      LEFT JOIN molds m ON mr.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN users u ON mr.performed_by = u.id
      ${whereClause}
      ORDER BY mr.performed_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements });
    
    // 총 개수
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM maintenance_records mr ${whereClause}
    `, { replacements });
    
    res.json({
      success: true,
      data: {
        items: records,
        total: parseInt(countResult[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    logger.error('Get maintenance records error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get maintenance records' }
    });
  }
};

/**
 * 유지보전 기록 상세 조회
 * GET /api/v1/maintenance/:id
 */
const getMaintenanceRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [records] = await sequelize.query(`
      SELECT 
        mr.*,
        m.mold_code,
        m.current_shots,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        u.name as performed_by_name
      FROM maintenance_records mr
      LEFT JOIN molds m ON mr.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN users u ON mr.performed_by = u.id
      WHERE mr.id = :id
    `, { replacements: { id } });
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Maintenance record not found' }
      });
    }
    
    res.json({
      success: true,
      data: records[0]
    });
    
  } catch (error) {
    logger.error('Get maintenance record by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get maintenance record' }
    });
  }
};

/**
 * 유지보전 기록 생성
 * POST /api/v1/maintenance
 */
const createMaintenanceRecord = async (req, res) => {
  try {
    const {
      mold_id,
      maintenance_type,
      maintenance_category,
      description,
      work_details,
      parts_replaced,
      cost,
      performed_at,
      next_maintenance_date,
      next_maintenance_shots,
      photos,
      notes
    } = req.body;
    
    const userId = req.user?.id;
    
    const [result] = await sequelize.query(`
      INSERT INTO maintenance_records (
        mold_id, maintenance_type, maintenance_category,
        description, work_details, parts_replaced, cost,
        performed_by, performed_at,
        next_maintenance_date, next_maintenance_shots,
        photos, notes, created_at, updated_at
      ) VALUES (
        :mold_id, :maintenance_type, :maintenance_category,
        :description, :work_details, :parts_replaced::jsonb, :cost,
        :performed_by, :performed_at,
        :next_maintenance_date, :next_maintenance_shots,
        :photos::jsonb, :notes, NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        mold_id,
        maintenance_type,
        maintenance_category: maintenance_category || null,
        description: description || null,
        work_details: work_details || null,
        parts_replaced: JSON.stringify(parts_replaced || []),
        cost: cost || null,
        performed_by: userId,
        performed_at: performed_at || new Date(),
        next_maintenance_date: next_maintenance_date || null,
        next_maintenance_shots: next_maintenance_shots || null,
        photos: JSON.stringify(photos || []),
        notes: notes || null
      }
    });
    
    // 금형의 마지막 점검일 업데이트
    if (maintenance_type === '정기점검' || maintenance_type === '세척' || maintenance_type === '습합') {
      await sequelize.query(`
        UPDATE molds
        SET last_inspection_date = :performed_at, updated_at = NOW()
        WHERE id = :mold_id
      `, {
        replacements: { mold_id, performed_at: performed_at || new Date() }
      });
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: result[0].id,
        maintenance_type
      }
    });
    
  } catch (error) {
    logger.error('Create maintenance record error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create maintenance record' }
    });
  }
};

/**
 * 유지보전 기록 수정
 * PUT /api/v1/maintenance/:id
 */
const updateMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      maintenance_type,
      maintenance_category,
      description,
      work_details,
      parts_replaced,
      cost,
      next_maintenance_date,
      next_maintenance_shots,
      photos,
      notes
    } = req.body;
    
    await sequelize.query(`
      UPDATE maintenance_records
      SET 
        maintenance_type = COALESCE(:maintenance_type, maintenance_type),
        maintenance_category = COALESCE(:maintenance_category, maintenance_category),
        description = COALESCE(:description, description),
        work_details = COALESCE(:work_details, work_details),
        parts_replaced = COALESCE(:parts_replaced::jsonb, parts_replaced),
        cost = COALESCE(:cost, cost),
        next_maintenance_date = COALESCE(:next_maintenance_date, next_maintenance_date),
        next_maintenance_shots = COALESCE(:next_maintenance_shots, next_maintenance_shots),
        photos = COALESCE(:photos::jsonb, photos),
        notes = COALESCE(:notes, notes),
        updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: {
        id,
        maintenance_type: maintenance_type || null,
        maintenance_category: maintenance_category || null,
        description: description || null,
        work_details: work_details || null,
        parts_replaced: parts_replaced ? JSON.stringify(parts_replaced) : null,
        cost: cost || null,
        next_maintenance_date: next_maintenance_date || null,
        next_maintenance_shots: next_maintenance_shots || null,
        photos: photos ? JSON.stringify(photos) : null,
        notes: notes || null
      }
    });
    
    res.json({
      success: true,
      data: { id: parseInt(id) }
    });
    
  } catch (error) {
    logger.error('Update maintenance record error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update maintenance record' }
    });
  }
};

/**
 * 금형별 유지보전 이력 조회
 * GET /api/v1/maintenance/mold/:mold_id/history
 */
const getMoldMaintenanceHistory = async (req, res) => {
  try {
    const { mold_id } = req.params;
    const { limit = 20 } = req.query;
    
    const [records] = await sequelize.query(`
      SELECT 
        mr.*,
        u.name as performed_by_name
      FROM maintenance_records mr
      LEFT JOIN users u ON mr.performed_by = u.id
      WHERE mr.mold_id = :mold_id
      ORDER BY mr.performed_at DESC
      LIMIT :limit
    `, { replacements: { mold_id, limit: parseInt(limit) } });
    
    // 유지보전 통계
    const [stats] = await sequelize.query(`
      SELECT 
        maintenance_type,
        COUNT(*) as count,
        SUM(COALESCE(cost, 0)) as total_cost,
        MAX(performed_at) as last_performed
      FROM maintenance_records
      WHERE mold_id = :mold_id
      GROUP BY maintenance_type
    `, { replacements: { mold_id } });
    
    res.json({
      success: true,
      data: {
        mold_id: parseInt(mold_id),
        records,
        statistics: stats
      }
    });
    
  } catch (error) {
    logger.error('Get mold maintenance history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get maintenance history' }
    });
  }
};

/**
 * 유지보전 유형 목록
 * GET /api/v1/maintenance/types
 */
const getMaintenanceTypes = async (req, res) => {
  try {
    const types = [
      { code: 'periodic', name: '정기점검', description: '타수/일자 기준 정기 점검' },
      { code: 'cleaning', name: '세척', description: '금형 세척 작업' },
      { code: 'lubrication', name: '윤활', description: '윤활유 보충/교체' },
      { code: 'fitting', name: '습합', description: '습합 점검 및 조정' },
      { code: 'repair', name: '수리', description: '고장/이상 수리' },
      { code: 'replacement', name: '부품교체', description: '소모품/부품 교체' },
      { code: 'calibration', name: '교정', description: '센서/계측기 교정' },
      { code: 'preventive', name: '예방정비', description: '예방 차원의 정비' },
      { code: 'other', name: '기타', description: '기타 유지보전 작업' }
    ];
    
    res.json({
      success: true,
      data: types
    });
    
  } catch (error) {
    logger.error('Get maintenance types error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get maintenance types' }
    });
  }
};

/**
 * 유지보전 통계 조회
 * GET /api/v1/maintenance/statistics
 */
const getStatistics = async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    let dateFilter = `EXTRACT(YEAR FROM performed_at) = ${targetYear}`;
    if (month) {
      dateFilter += ` AND EXTRACT(MONTH FROM performed_at) = ${month}`;
    }
    
    // 유형별 통계
    const [typeStats] = await sequelize.query(`
      SELECT 
        maintenance_type,
        COUNT(*) as count,
        SUM(COALESCE(cost, 0)) as total_cost
      FROM maintenance_records
      WHERE ${dateFilter}
      GROUP BY maintenance_type
      ORDER BY count DESC
    `);
    
    // 월별 통계
    const [monthlyStats] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM performed_at) as month,
        COUNT(*) as count,
        SUM(COALESCE(cost, 0)) as total_cost
      FROM maintenance_records
      WHERE EXTRACT(YEAR FROM performed_at) = :year
      GROUP BY EXTRACT(MONTH FROM performed_at)
      ORDER BY month
    `, { replacements: { year: targetYear } });
    
    // 금형별 통계 (상위 10개)
    const [moldStats] = await sequelize.query(`
      SELECT 
        mr.mold_id,
        m.mold_code,
        COUNT(*) as count,
        SUM(COALESCE(mr.cost, 0)) as total_cost
      FROM maintenance_records mr
      LEFT JOIN molds m ON mr.mold_id = m.id
      WHERE ${dateFilter}
      GROUP BY mr.mold_id, m.mold_code
      ORDER BY count DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        month: month ? parseInt(month) : null,
        by_type: typeStats,
        by_month: monthlyStats,
        by_mold: moldStats
      }
    });
    
  } catch (error) {
    logger.error('Get maintenance statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get statistics' }
    });
  }
};

module.exports = {
  getMaintenanceRecords,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getMoldMaintenanceHistory,
  getMaintenanceTypes,
  getStatistics
};
