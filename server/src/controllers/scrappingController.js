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
 * 금형 폐기 요청 생성 (draft 임시저장 + 정식 제출 통합)
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
      estimated_scrap_value,
      status: reqStatus,
      current_step
    } = req.body;
    
    const userId = req.user?.id;
    const isDraft = reqStatus === 'draft';
    const finalStatus = isDraft ? 'draft' : 'requested';
    const parsedMoldId = mold_id ? parseInt(mold_id) : null;
    
    // mold_id가 없으면 draft만 가능
    if (!parsedMoldId && !isDraft) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '금형을 선택해주세요.' }
      });
    }
    
    let mold = null;
    let repairHistorySummary = null;
    
    if (parsedMoldId) {
      // 금형 정보 조회
      const [molds] = await sequelize.query(`
        SELECT m.*, ms.target_shots
        FROM molds m
        LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
        WHERE m.id = :mold_id
      `, { replacements: { mold_id: parsedMoldId }, transaction });
      
      if (molds.length === 0 && !isDraft) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { message: 'Mold not found' }
        });
      }
      
      mold = molds[0] || null;
      
      // 수리 이력 요약
      try {
        const [repairHistory] = await sequelize.query(`
          SELECT 
            COUNT(*) as total_repairs,
            STRING_AGG(DISTINCT issue_type, ', ') as issue_types
          FROM repair_requests
          WHERE mold_id = :mold_id
        `, { replacements: { mold_id: parsedMoldId }, transaction });
        
        if (repairHistory[0]) {
          repairHistorySummary = `총 ${repairHistory[0].total_repairs}회 수리, 주요 이슈: ${repairHistory[0].issue_types || '없음'}`;
        }
      } catch (e) {
        logger.warn('Repair history query skipped:', e.message);
      }
    }
    
    // 요청 번호 생성
    const requestNumber = `SCR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    
    // 폐기 요청 생성
    const [result] = await sequelize.query(`
      INSERT INTO scrapping_requests (
        request_number, mold_id, reason, reason_detail,
        current_shots, target_shots, condition_assessment,
        repair_history_summary, estimated_scrap_value,
        status, current_step, requested_by, requested_at,
        created_at, updated_at
      ) VALUES (
        :request_number, :mold_id, :reason, :reason_detail,
        :current_shots, :target_shots, :condition_assessment,
        :repair_history_summary, :estimated_scrap_value,
        :status, :current_step, :requested_by, NOW(),
        NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        request_number: requestNumber,
        mold_id: parsedMoldId,
        reason: reason || null,
        reason_detail: reason_detail || null,
        current_shots: mold?.current_shots || 0,
        target_shots: mold?.target_shots || null,
        condition_assessment: condition_assessment || null,
        repair_history_summary: repairHistorySummary,
        estimated_scrap_value: estimated_scrap_value ? parseFloat(estimated_scrap_value) : null,
        status: finalStatus,
        current_step: current_step || null,
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
        status: finalStatus
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Create scrapping request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create scrapping request', details: error.message }
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
      WHERE id = :id AND status IN ('requested', 'reviewed')
      RETURNING id, status
    `, {
      replacements: { id, approved_by: userId, notes: notes || null }
    });
    
    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot approve this request. Status must be reviewed or requested.' }
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
    
    const [result] = await sequelize.query(`
      UPDATE scrapping_requests
      SET status = 'rejected',
          rejection_reason = :reason,
          updated_at = NOW()
      WHERE id = :id AND status IN ('requested', 'assessed', 'reviewed', 'first_approved')
      RETURNING id, status
    `, {
      replacements: { id, reason: reason || '반려됨' }
    });
    
    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot reject this request' }
      });
    }
    
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

/**
 * 폐기 요청 업데이트 (단계별 임시저장 및 상태 전환)
 * PATCH /api/v1/scrapping/:id
 */
const updateScrappingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      status, current_step,
      // 요청 단계
      reason, reason_detail, condition_assessment, estimated_scrap_value,
      // 상태 평가 단계
      appearance_condition, functional_condition, dimensional_condition, assessment_notes,
      // 경제성 검토 단계
      repair_cost_estimate, new_mold_cost, remaining_value, review_result, review_notes,
      // 폐기 처리 단계
      disposal_method, disposal_company, disposal_cost, disposal_certificate,
      // 사후 관리 단계
      asset_disposal_completed, documentation_archived, replacement_plan, postcare_notes
    } = req.body;

    // 상태 전환 시 추가 필드 설정
    let extraSets = '';
    const replacements = {
      id,
      status: status || null,
      current_step: current_step || null,
      reason: reason || null,
      reason_detail: reason_detail || null,
      condition_assessment: condition_assessment || null,
      estimated_scrap_value: estimated_scrap_value || null,
      appearance_condition: appearance_condition || null,
      functional_condition: functional_condition || null,
      dimensional_condition: dimensional_condition || null,
      assessment_notes: assessment_notes || null,
      repair_cost_estimate: repair_cost_estimate || null,
      new_mold_cost: new_mold_cost || null,
      remaining_value: remaining_value || null,
      review_result: review_result || null,
      review_notes: review_notes || null,
      disposal_method: disposal_method || null,
      disposal_company: disposal_company || null,
      disposal_cost: disposal_cost || null,
      disposal_certificate: disposal_certificate || null,
      asset_disposal_completed: asset_disposal_completed || false,
      documentation_archived: documentation_archived || false,
      replacement_plan: replacement_plan || null,
      postcare_notes: postcare_notes || null,
      user_id: userId
    };

    if (status === 'assessed') {
      extraSets = ', assessed_by = :user_id, assessed_at = NOW()';
    } else if (status === 'reviewed') {
      extraSets = ', reviewed_by = :user_id, reviewed_at = NOW()';
    } else if (status === 'closed') {
      extraSets = ', closed_by = :user_id, closed_at = NOW()';
    }

    const [result] = await sequelize.query(`
      UPDATE scrapping_requests
      SET status = COALESCE(:status, status),
          current_step = COALESCE(:current_step, current_step),
          reason = COALESCE(:reason, reason),
          reason_detail = COALESCE(:reason_detail, reason_detail),
          condition_assessment = COALESCE(:condition_assessment, condition_assessment),
          estimated_scrap_value = COALESCE(:estimated_scrap_value, estimated_scrap_value),
          appearance_condition = COALESCE(:appearance_condition, appearance_condition),
          functional_condition = COALESCE(:functional_condition, functional_condition),
          dimensional_condition = COALESCE(:dimensional_condition, dimensional_condition),
          assessment_notes = COALESCE(:assessment_notes, assessment_notes),
          repair_cost_estimate = COALESCE(:repair_cost_estimate, repair_cost_estimate),
          new_mold_cost = COALESCE(:new_mold_cost, new_mold_cost),
          remaining_value = COALESCE(:remaining_value, remaining_value),
          review_result = COALESCE(:review_result, review_result),
          review_notes = COALESCE(:review_notes, review_notes),
          disposal_method = COALESCE(:disposal_method, disposal_method),
          disposal_company = COALESCE(:disposal_company, disposal_company),
          disposal_cost = COALESCE(:disposal_cost, disposal_cost),
          disposal_certificate = COALESCE(:disposal_certificate, disposal_certificate),
          asset_disposal_completed = :asset_disposal_completed,
          documentation_archived = :documentation_archived,
          replacement_plan = COALESCE(:replacement_plan, replacement_plan),
          postcare_notes = COALESCE(:postcare_notes, postcare_notes),
          updated_at = NOW()
          ${extraSets}
      WHERE id = :id
      RETURNING id, status, current_step
    `, { replacements });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Scrapping request not found' }
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    logger.error('Update scrapping request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update scrapping request', details: error.message }
    });
  }
};

module.exports = {
  getScrappingRequests,
  getScrappingRequestById,
  createScrappingRequest,
  updateScrappingRequest,
  firstApprove,
  secondApprove,
  rejectRequest,
  completeScrapping,
  getStatistics
};
