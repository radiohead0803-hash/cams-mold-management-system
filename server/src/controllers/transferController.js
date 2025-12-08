const logger = require('../utils/logger');
const pool = require('../config/database');

// 이관 목록 조회
const getTransfers = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        t.*,
        m.mold_code,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        fc.company_name as from_company_name,
        tc.company_name as to_company_name,
        u.name as requested_by_name
      FROM transfers t
      LEFT JOIN molds m ON t.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN companies fc ON t.from_company_id = fc.id
      LEFT JOIN companies tc ON t.to_company_id = tc.id
      LEFT JOIN users u ON t.requested_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status && status !== 'all') {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // 총 개수 조회
    let countQuery = 'SELECT COUNT(*) FROM transfers WHERE 1=1';
    const countParams = [];
    if (status && status !== 'all') {
      countParams.push(status);
      countQuery += ` AND status = $${countParams.length}`;
    }
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      success: true,
      data: {
        items: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get transfers error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get transfers', details: error.message }
    });
  }
};

// 이관 상세 조회
const getTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 이관 기본 정보
    const transferQuery = `
      SELECT 
        t.*,
        m.mold_code,
        ms.part_number,
        ms.part_name,
        ms.car_model,
        ms.mold_type,
        ms.tonnage,
        ms.material,
        fc.company_name as from_company_name,
        tc.company_name as to_company_name,
        u.name as requested_by_name,
        du.name as developer_name
      FROM transfers t
      LEFT JOIN molds m ON t.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      LEFT JOIN companies fc ON t.from_company_id = fc.id
      LEFT JOIN companies tc ON t.to_company_id = tc.id
      LEFT JOIN users u ON t.requested_by = u.id
      LEFT JOIN users du ON t.developer_id = du.id
      WHERE t.id = $1
    `;
    const transferResult = await pool.query(transferQuery, [id]);
    
    if (transferResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transfer not found' }
      });
    }
    
    // 승인 정보 조회
    const approvalsQuery = `
      SELECT * FROM transfer_approvals 
      WHERE transfer_id = $1 
      ORDER BY approval_order
    `;
    const approvalsResult = await pool.query(approvalsQuery, [id]);
    
    // 체크리스트 결과 조회
    const checklistQuery = `
      SELECT 
        tir.*,
        tci.category,
        tci.item_name,
        tci.item_description
      FROM transfer_inspection_results tir
      LEFT JOIN transfer_checklist_items tci ON tir.checklist_item_id = tci.id
      WHERE tir.transfer_id = $1
      ORDER BY tci.category_order, tci.item_order
    `;
    const checklistResult = await pool.query(checklistQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...transferResult.rows[0],
        approvals: approvalsResult.rows,
        checklist_results: checklistResult.rows
      }
    });
  } catch (error) {
    logger.error('Get transfer by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get transfer', details: error.message }
    });
  }
};

// 이관 요청 생성
const createTransfer = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      mold_id,
      transfer_type,
      from_company_id,
      to_company_id,
      developer_id,
      request_date,
      planned_transfer_date,
      reason,
      current_shots,
      mold_info_snapshot,
      checklist_results
    } = req.body;
    
    const requested_by = req.user.id;
    
    // 이관번호 생성
    const transferNumber = `TRF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    
    // 이관 요청 생성
    const insertQuery = `
      INSERT INTO transfers (
        mold_id, transfer_number, transfer_type, 
        from_company_id, to_company_id, developer_id,
        requested_by, request_date, planned_transfer_date,
        reason, current_shots, mold_info_snapshot,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'requested', NOW(), NOW())
      RETURNING *
    `;
    
    const insertResult = await client.query(insertQuery, [
      mold_id, transferNumber, transfer_type || 'plant_to_plant',
      from_company_id, to_company_id, developer_id,
      requested_by, request_date, planned_transfer_date,
      reason, current_shots, JSON.stringify(mold_info_snapshot)
    ]);
    
    const transfer = insertResult.rows[0];
    
    // 3단계 승인 레코드 생성
    const approvalStages = [
      { stage: 'plant_approval', order: 1, name: '생산처 승인' },
      { stage: 'developer_approval', order: 2, name: '개발담당 승인' },
      { stage: 'receiver_approval', order: 3, name: '인수처 승인' }
    ];
    
    for (const stage of approvalStages) {
      await client.query(`
        INSERT INTO transfer_approvals (
          transfer_id, approval_stage, approval_order, approval_status, created_at, updated_at
        ) VALUES ($1, $2, $3, 'pending', NOW(), NOW())
      `, [transfer.id, stage.stage, stage.order]);
    }
    
    // 체크리스트 결과 저장
    if (checklist_results && Object.keys(checklist_results).length > 0) {
      for (const [itemId, result] of Object.entries(checklist_results)) {
        await client.query(`
          INSERT INTO transfer_inspection_results (
            transfer_id, checklist_item_id, result, result_value, 
            inspection_notes, inspected_by, inspected_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
        `, [
          transfer.id, 
          parseInt(itemId), 
          result.result || null,
          result.value || null,
          result.notes || null,
          requested_by
        ]);
      }
    }
    
    // 이력 기록
    await client.query(`
      INSERT INTO transfer_history (
        transfer_id, mold_id, action_type, action_description,
        old_status, new_status, performed_by, performed_at
      ) VALUES ($1, $2, 'created', '이관 요청 생성', NULL, 'requested', $3, NOW())
    `, [transfer.id, mold_id, requested_by]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create transfer error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create transfer', details: error.message }
    });
  } finally {
    client.release();
  }
};

// 이관 승인
const approveTransfer = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { approval_stage, comments } = req.body;
    const approver_id = req.user.id;
    
    // 현재 승인 단계 확인
    const approvalQuery = `
      SELECT * FROM transfer_approvals 
      WHERE transfer_id = $1 AND approval_stage = $2
    `;
    const approvalResult = await client.query(approvalQuery, [id, approval_stage]);
    
    if (approvalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { message: 'Approval stage not found' }
      });
    }
    
    // 이전 단계 승인 확인
    const prevApprovalQuery = `
      SELECT * FROM transfer_approvals 
      WHERE transfer_id = $1 AND approval_order < $2 AND approval_status != 'approved'
    `;
    const prevResult = await client.query(prevApprovalQuery, [id, approvalResult.rows[0].approval_order]);
    
    if (prevResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { message: '이전 단계 승인이 완료되지 않았습니다.' }
      });
    }
    
    // 승인 처리
    await client.query(`
      UPDATE transfer_approvals 
      SET approval_status = 'approved', 
          approver_id = $1, 
          approval_date = NOW(),
          approval_comments = $2,
          updated_at = NOW()
      WHERE transfer_id = $3 AND approval_stage = $4
    `, [approver_id, comments, id, approval_stage]);
    
    // 모든 승인 완료 확인
    const allApprovalsQuery = `
      SELECT COUNT(*) as pending FROM transfer_approvals 
      WHERE transfer_id = $1 AND approval_status != 'approved'
    `;
    const allApprovalsResult = await client.query(allApprovalsQuery, [id]);
    
    let newStatus = 'in_progress';
    if (parseInt(allApprovalsResult.rows[0].pending) === 0) {
      newStatus = 'completed';
      
      // 이관 완료 시 금형 정보 업데이트
      const transferQuery = 'SELECT * FROM transfers WHERE id = $1';
      const transferResult = await client.query(transferQuery, [id]);
      const transfer = transferResult.rows[0];
      
      if (transfer) {
        // plant_molds 업데이트 (생산처 변경)
        await client.query(`
          UPDATE plant_molds 
          SET plant_id = $1, updated_at = NOW()
          WHERE mold_id = $2
        `, [transfer.to_company_id, transfer.mold_id]);
        
        // mold_specifications 업데이트
        await client.query(`
          UPDATE mold_specifications 
          SET plant_company_id = $1, updated_at = NOW()
          WHERE mold_id = $2
        `, [transfer.to_company_id, transfer.mold_id]);
      }
      
      // 이관 완료 플래그 설정
      await client.query(`
        UPDATE transfers 
        SET all_approvals_completed = true, 
            actual_transfer_date = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `, [id]);
    }
    
    // 이관 상태 업데이트
    await client.query(`
      UPDATE transfers SET status = $1, updated_at = NOW() WHERE id = $2
    `, [newStatus, id]);
    
    // 이력 기록
    await client.query(`
      INSERT INTO transfer_history (
        transfer_id, mold_id, action_type, action_description,
        old_status, new_status, performed_by, performed_at, metadata
      ) VALUES (
        $1, 
        (SELECT mold_id FROM transfers WHERE id = $1), 
        'approval', 
        $2,
        NULL, 
        'approved', 
        $3, 
        NOW(),
        $4
      )
    `, [id, `${approval_stage} 승인`, approver_id, JSON.stringify({ stage: approval_stage, comments })]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: { 
        message: '승인이 완료되었습니다.',
        all_completed: newStatus === 'completed'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Approve transfer error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve transfer', details: error.message }
    });
  } finally {
    client.release();
  }
};

// 이관 반려
const rejectTransfer = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { approval_stage, rejection_reason } = req.body;
    const approver_id = req.user.id;
    
    // 승인 반려 처리
    await client.query(`
      UPDATE transfer_approvals 
      SET approval_status = 'rejected', 
          approver_id = $1, 
          approval_date = NOW(),
          rejection_reason = $2,
          updated_at = NOW()
      WHERE transfer_id = $3 AND approval_stage = $4
    `, [approver_id, rejection_reason, id, approval_stage]);
    
    // 이관 상태 업데이트
    await client.query(`
      UPDATE transfers SET status = 'rejected', updated_at = NOW() WHERE id = $1
    `, [id]);
    
    // 이력 기록
    await client.query(`
      INSERT INTO transfer_history (
        transfer_id, mold_id, action_type, action_description,
        old_status, new_status, performed_by, performed_at, metadata
      ) VALUES (
        $1, 
        (SELECT mold_id FROM transfers WHERE id = $1), 
        'rejection', 
        $2,
        NULL, 
        'rejected', 
        $3, 
        NOW(),
        $4
      )
    `, [id, `${approval_stage} 반려: ${rejection_reason}`, approver_id, JSON.stringify({ stage: approval_stage, reason: rejection_reason })]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: { message: '반려 처리되었습니다.' }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Reject transfer error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject transfer', details: error.message }
    });
  } finally {
    client.release();
  }
};

// 체크리스트 항목 조회
const getChecklistItems = async (req, res) => {
  try {
    const query = `
      SELECT * FROM transfer_checklist_items 
      WHERE is_active = true 
      ORDER BY category_order, item_order
    `;
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get checklist items error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklist items', details: error.message }
    });
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  getChecklistItems
};
