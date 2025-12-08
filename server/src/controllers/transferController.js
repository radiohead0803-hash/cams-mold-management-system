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

// 체크리스트 항목 조회 (마스터 템플릿 연동)
const getChecklistItems = async (req, res) => {
  try {
    // 1. 먼저 체크리스트 마스터 템플릿에서 이관 타입 조회
    const masterQuery = `
      SELECT cmt.id as template_id, cmt.template_name, cmt.version,
             cti.id, cti.category, cti.item_name, cti.item_description,
             cti.check_method, cti.pass_criteria, cti.is_required, cti.display_order
      FROM checklist_master_templates cmt
      LEFT JOIN checklist_template_items cti ON cmt.id = cti.template_id
      WHERE cmt.template_type = 'transfer' AND cmt.is_active = true
      ORDER BY cti.display_order, cti.id
    `;
    const masterResult = await pool.query(masterQuery);
    
    if (masterResult.rows.length > 0 && masterResult.rows[0].id) {
      // 마스터 템플릿에서 항목 반환
      const items = masterResult.rows.map((row, idx) => ({
        id: row.id,
        template_id: row.template_id,
        template_name: row.template_name,
        version: row.version,
        category: row.category || 'general',
        category_name: getCategoryName(row.category),
        item_name: row.item_name,
        item_description: row.item_description || row.check_method,
        pass_criteria: row.pass_criteria,
        is_required: row.is_required,
        requires_photo: false,
        item_order: row.display_order || idx + 1
      }));
      
      return res.json({
        success: true,
        data: items,
        source: 'master_template'
      });
    }
    
    // 2. 마스터 템플릿이 없으면 transfer_checklist_items 테이블에서 조회
    const fallbackQuery = `
      SELECT * FROM transfer_checklist_items 
      WHERE is_active = true 
      ORDER BY category_order, item_order
    `;
    const fallbackResult = await pool.query(fallbackQuery);
    
    if (fallbackResult.rows.length > 0) {
      return res.json({
        success: true,
        data: fallbackResult.rows,
        source: 'transfer_checklist_items'
      });
    }
    
    // 3. 둘 다 없으면 기본 항목 반환
    const defaultItems = getDefaultTransferChecklistItems();
    res.json({
      success: true,
      data: defaultItems,
      source: 'default'
    });
  } catch (error) {
    logger.error('Get checklist items error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklist items', details: error.message }
    });
  }
};

// 카테고리명 변환
const getCategoryName = (category) => {
  const names = {
    'fitting': '습합',
    'appearance': '외관',
    'cavity': '캐비티',
    'core': '코어',
    'hydraulic': '유압장치',
    'heater': '히터',
    'general': '일반'
  };
  return names[category] || category || '일반';
};

// 기본 이관 체크리스트 항목
const getDefaultTransferChecklistItems = () => [
  { id: 1, category: 'fitting', category_name: '습합', item_name: '제품 BURR', item_description: 'BURR 발생부 습합개소 확인', requires_photo: false, item_order: 1 },
  { id: 2, category: 'appearance', category_name: '외관', item_name: 'EYE BOLT 체결부', item_description: '피치 마모 및 밀착상태 확인', requires_photo: false, item_order: 2 },
  { id: 3, category: 'appearance', category_name: '외관', item_name: '상,하 고정판 확인', item_description: '이물 및 녹 오염상태 확인', requires_photo: false, item_order: 3 },
  { id: 4, category: 'appearance', category_name: '외관', item_name: '냉각상태', item_description: '냉각호스 정리 및 오염상태 확인', requires_photo: false, item_order: 4 },
  { id: 5, category: 'cavity', category_name: '캐비티', item_name: '표면 흠집,녹', item_description: '표면 흠 및 녹 발생상태 확인', requires_photo: true, item_order: 5 },
  { id: 6, category: 'cavity', category_name: '캐비티', item_name: '파팅면 오염,탄화', item_description: '파팅면 오염 및 탄화수지 확인', requires_photo: true, item_order: 6 },
  { id: 7, category: 'cavity', category_name: '캐비티', item_name: '파팅면 BURR', item_description: '파팅면 끝단 손으로 접촉 확인', requires_photo: false, item_order: 7 },
  { id: 8, category: 'core', category_name: '코어', item_name: '코어류 분해청소', item_description: '긁힘 상태확인 및 이물확인', requires_photo: true, item_order: 8 },
  { id: 9, category: 'core', category_name: '코어', item_name: '마모', item_description: '작동부 마모상태 점검', requires_photo: false, item_order: 9 },
  { id: 10, category: 'core', category_name: '코어', item_name: '작동유 윤활유', item_description: '작동유 윤활상태 확인', requires_photo: false, item_order: 10 },
  { id: 11, category: 'hydraulic', category_name: '유압장치', item_name: '작동유 누유', item_description: '유압 배관 파손 확인', requires_photo: false, item_order: 11 },
  { id: 12, category: 'hydraulic', category_name: '유압장치', item_name: '호스 및 배선정리', item_description: '호스,배선 정돈상태 확인', requires_photo: false, item_order: 12 },
  { id: 13, category: 'heater', category_name: '히터', item_name: '히터단선 누전', item_description: '히터단선,누전확인[테스터기]', requires_photo: false, item_order: 13 },
  { id: 14, category: 'heater', category_name: '히터', item_name: '수지 누출', item_description: '수지 넘침 확인', requires_photo: false, item_order: 14 }
];

module.exports = {
  getTransfers,
  getTransferById,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  getChecklistItems
};
