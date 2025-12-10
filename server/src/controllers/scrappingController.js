const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 금형 폐기 요청 목록 조회
 * GET /api/v1/scrapping
 */
const getScrappingRequests = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (status) {
      whereClause += ' AND s.status = :status';
      replacements.status = status;
    }
    
    const [requests] = await sequelize.query(`
      SELECT 
        s.*,
        m.mold_code,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        u.name as requested_by_name,
        fa.name as first_approved_by_name,
        sa.name as second_approved_by_name
      FROM scrapping_requests s
      LEFT JOIN molds m ON s.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN users u ON s.requested_by = u.id
      LEFT JOIN users fa ON s.first_approved_by = fa.id
      LEFT JOIN users sa ON s.second_approved_by = sa.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements });
    
    // 총 개수
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM scrapping_requests s ${whereClause}
    `, { replacements });
    
    res.json({
      success: true,
      data: {
        items: requests,
        total: parseInt(countResult[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    logger.error('Get scrapping requests error:', error);
    // 테이블이 없어도 빈 배열 반환
    res.json({
      success: true,
      data: { items: [], total: 0, limit: 50, offset: 0 }
    });
  }
};

/**
 * 금형 폐기 요청 상세 조회
 * GET /api/v1/scrapping/:id
 */
const getScrappingRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [requests] = await sequelize.query(`
      SELECT 
        s.*,
        m.mold_code,
        m.current_shots,
        m.target_shots,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        ms.mold_type,
        ms.tonnage,
        ms.material,
        u.name as requested_by_name,
        fa.name as first_approved_by_name,
        sa.name as second_approved_by_name,
        sb.name as scrapped_by_name
      FROM scrapping_requests s
      LEFT JOIN molds m ON s.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN users u ON s.requested_by = u.id
      LEFT JOIN users fa ON s.first_approved_by = fa.id
      LEFT JOIN users sa ON s.second_approved_by = sa.id
      LEFT JOIN users sb ON s.scrapped_by = sb.id
      WHERE s.id = :id
    `, { replacements: { id } });
    
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Scrapping request not found' }
      });
    }
    
    // 수리 이력 요약 조회
    const [repairHistory] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_repairs,
        SUM(COALESCE(repair_cost, 0)) as total_cost,
        MAX(created_at) as last_repair_date
      FROM repair_requests
      WHERE mold_id = :mold_id
    `, { replacements: { mold_id: requests[0].mold_id } });
    
    res.json({
      success: true,
      data: {
        ...requests[0],
        repair_summary: repairHistory[0]
      }
    });
    
  } catch (error) {
    logger.error('Get scrapping request by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get scrapping request' }
    });
  }
};

/**
 * 금형 폐기 요청 생성
 * POST /api/v1/scrapping
 */
const createScrappingRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      mold_id,
      reason,
      reason_detail,
      condition_assessment,
      estimated_scrap_value
    } = req.body;
    
    const userId = req.user?.id;
    
    // 금형 정보 조회
    const [molds] = await sequelize.query(`
      SELECT m.*, ms.target_shots
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE m.id = :mold_id
    `, { replacements: { mold_id }, transaction });
    
    if (molds.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }
    
    const mold = molds[0];
    
    // 수리 이력 요약
    const [repairHistory] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_repairs,
        STRING_AGG(DISTINCT issue_type, ', ') as issue_types
      FROM repair_requests
      WHERE mold_id = :mold_id
    `, { replacements: { mold_id }, transaction });
    
    // 요청 번호 생성
    const requestNumber = `SCR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    
    // 폐기 요청 생성
    const [result] = await sequelize.query(`
      INSERT INTO scrapping_requests (
        request_number, mold_id, reason, reason_detail,
        current_shots, target_shots, condition_assessment,
        repair_history_summary, estimated_scrap_value,
        status, requested_by, requested_at,
        created_at, updated_at
      ) VALUES (
        :request_number, :mold_id, :reason, :reason_detail,
        :current_shots, :target_shots, :condition_assessment,
        :repair_history_summary, :estimated_scrap_value,
        'requested', :requested_by, NOW(),
        NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        request_number: requestNumber,
        mold_id,
        reason,
        reason_detail: reason_detail || null,
        current_shots: mold.current_shots || 0,
        target_shots: mold.target_shots || null,
        condition_assessment: condition_assessment || null,
        repair_history_summary: repairHistory[0] ? 
          `총 ${repairHistory[0].total_repairs}회 수리, 주요 이슈: ${repairHistory[0].issue_types || '없음'}` : null,
        estimated_scrap_value: estimated_scrap_value || null,
        requested_by: userId
      },
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      data: {
        id: result[0].id,
        request_number: requestNumber,
        status: 'requested'
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Create scrapping request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create scrapping request' }
    });
  }
};

/**
 * 1차 승인 (금형개발 담당)
 * POST /api/v1/scrapping/:id/first-approve
 */
const firstApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;
    
    const [result] = await sequelize.query(`
      UPDATE scrapping_requests
      SET status = 'first_approved',
          first_approved_by = :approved_by,
          first_approved_at = NOW(),
          first_approval_notes = :notes,
          updated_at = NOW()
      WHERE id = :id AND status = 'requested'
      RETURNING id, status
    `, {
      replacements: { id, approved_by: userId, notes: notes || null }
    });
    
    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot approve this request' }
      });
    }
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'first_approved' }
    });
    
  } catch (error) {
    logger.error('First approve error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve' }
    });
  }
};

/**
 * 2차 승인 (시스템 관리자)
 * POST /api/v1/scrapping/:id/second-approve
 */
const secondApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;
    
    const [result] = await sequelize.query(`
      UPDATE scrapping_requests
      SET status = 'approved',
          second_approved_by = :approved_by,
          second_approved_at = NOW(),
          second_approval_notes = :notes,
          updated_at = NOW()
      WHERE id = :id AND status = 'first_approved'
      RETURNING id, status
    `, {
      replacements: { id, approved_by: userId, notes: notes || null }
    });
    
    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot approve this request. First approval required.' }
      });
    }
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'approved' }
    });
    
  } catch (error) {
    logger.error('Second approve error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve' }
    });
  }
};

/**
 * 폐기 요청 반려
 * POST /api/v1/scrapping/:id/reject
 */
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    await sequelize.query(`
      UPDATE scrapping_requests
      SET status = 'rejected',
          first_approval_notes = COALESCE(first_approval_notes, '') || ' [반려] ' || :reason,
          updated_at = NOW()
      WHERE id = :id AND status IN ('requested', 'first_approved')
    `, {
      replacements: { id, reason: reason || '반려됨' }
    });
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'rejected' }
    });
    
  } catch (error) {
    logger.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject request' }
    });
  }
};

/**
 * 폐기 처리 완료
 * POST /api/v1/scrapping/:id/complete
 */
const completeScrapping = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      disposal_method,
      disposal_company,
      disposal_cost,
      disposal_certificate
    } = req.body;
    const userId = req.user?.id;
    
    // 폐기 요청 조회
    const [requests] = await sequelize.query(`
      SELECT * FROM scrapping_requests WHERE id = :id AND status = 'approved'
    `, { replacements: { id }, transaction });
    
    if (requests.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot complete. Request must be approved first.' }
      });
    }
    
    const request = requests[0];
    
    // 폐기 처리 완료
    await sequelize.query(`
      UPDATE scrapping_requests
      SET status = 'scrapped',
          scrapped_at = NOW(),
          scrapped_by = :scrapped_by,
          disposal_method = :disposal_method,
          disposal_company = :disposal_company,
          disposal_cost = :disposal_cost,
          disposal_certificate = :disposal_certificate,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: {
        id,
        scrapped_by: userId,
        disposal_method: disposal_method || null,
        disposal_company: disposal_company || null,
        disposal_cost: disposal_cost || null,
        disposal_certificate: disposal_certificate || null
      },
      transaction
    });
    
    // 금형 상태 업데이트 (폐기)
    await sequelize.query(`
      UPDATE molds
      SET status = 'scrapped', updated_at = NOW()
      WHERE id = :mold_id
    `, {
      replacements: { mold_id: request.mold_id },
      transaction
    });
    
    // 금형 이력 기록
    await sequelize.query(`
      INSERT INTO stage_change_history (
        mold_id, from_stage, to_stage, changed_by, change_reason, changed_at
      ) VALUES (
        :mold_id, 'active', 'scrapped', :changed_by, :reason, NOW()
      )
    `, {
      replacements: {
        mold_id: request.mold_id,
        changed_by: userId,
        reason: `폐기 처리 완료 (요청번호: ${request.request_number})`
      },
      transaction
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: { id: parseInt(id), status: 'scrapped' }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Complete scrapping error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to complete scrapping' }
    });
  }
};

/**
 * 폐기 통계 조회
 * GET /api/v1/scrapping/statistics
 */
const getStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    // 상태별 통계
    const [statusStats] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM scrapping_requests
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY status
    `, { replacements: { year: targetYear } });
    
    // 월별 통계
    const [monthlyStats] = await sequelize.query(`
      SELECT 
        EXTRACT(MONTH FROM scrapped_at) as month,
        COUNT(*) as count,
        SUM(COALESCE(disposal_cost, 0)) as total_cost
      FROM scrapping_requests
      WHERE status = 'scrapped'
        AND EXTRACT(YEAR FROM scrapped_at) = :year
      GROUP BY EXTRACT(MONTH FROM scrapped_at)
      ORDER BY month
    `, { replacements: { year: targetYear } });
    
    // 폐기 사유별 통계
    const [reasonStats] = await sequelize.query(`
      SELECT 
        reason,
        COUNT(*) as count
      FROM scrapping_requests
      WHERE EXTRACT(YEAR FROM created_at) = :year
      GROUP BY reason
      ORDER BY count DESC
    `, { replacements: { year: targetYear } });
    
    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        by_status: statusStats,
        by_month: monthlyStats,
        by_reason: reasonStats
      }
    });
    
  } catch (error) {
    logger.error('Get statistics error:', error);
    // 테이블이 없어도 빈 데이터 반환
    res.json({
      success: true,
      data: {
        year: new Date().getFullYear(),
        by_status: [],
        by_month: [],
        by_reason: []
      }
    });
  }
};

module.exports = {
  getScrappingRequests,
  getScrappingRequestById,
  createScrappingRequest,
  firstApprove,
  secondApprove,
  rejectRequest,
  completeScrapping,
  getStatistics
};
