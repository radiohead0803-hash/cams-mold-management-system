const logger = require('../utils/logger');
const { TransferRequest, Mold, Company, User } = require('../models/newIndex');
let pool;
try {
  pool = require('../config/database');
} catch (e) {
  pool = null;
}

// 이관 목록 조회
const getTransfers = async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // TransferRequest 모델이 있으면 사용, 없으면 빈 배열 반환
    let items = [];
    let total = 0;
    
    try {
      const result = await TransferRequest.findAndCountAll({
        where,
        include: [
          { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name'] },
          { model: Company, as: 'fromCompany', attributes: ['id', 'company_name'] },
          { model: Company, as: 'toCompany', attributes: ['id', 'company_name'] },
          { model: User, as: 'requester', attributes: ['id', 'name'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      items = result.rows;
      total = result.count;
    } catch (modelError) {
      // 모델이나 테이블이 없는 경우 무시
      logger.warn('TransferRequest model/table not available:', modelError.message);
    }
    
    res.json({
      success: true,
      data: {
        items,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get transfers error:', error);
    // 에러 시 빈 데이터 반환
    res.json({
      success: true,
      data: {
        items: [],
        total: 0,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0
      }
    });
  }
};

// 이관 상세 조회
const getTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // TransferRequest 모델로 조회 시도
    try {
      const transfer = await TransferRequest.findByPk(id, {
        include: [
          { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name'] },
          { model: Company, as: 'fromCompany', attributes: ['id', 'company_name'] },
          { model: Company, as: 'toCompany', attributes: ['id', 'company_name'] },
          { model: User, as: 'requester', attributes: ['id', 'name'] }
        ]
      });
      
      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: { message: 'Transfer not found' }
        });
      }
      
      res.json({
        success: true,
        data: transfer
      });
    } catch (modelError) {
      logger.warn('TransferRequest model/table not available:', modelError.message);
      res.status(404).json({
        success: false,
        error: { message: 'Transfer not found' }
      });
    }
  } catch (error) {
    logger.error('Get transfer by ID error:', error);
    res.status(404).json({
      success: false,
      error: { message: 'Transfer not found' }
    });
  }
};

// 이관 요청 생성
const createTransfer = async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      success: false,
      error: { message: 'Database connection not available' }
    });
  }
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
  if (!pool) {
    return res.status(500).json({
      success: false,
      error: { message: 'Database connection not available' }
    });
  }
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
  if (!pool) {
    return res.status(500).json({
      success: false,
      error: { message: 'Database connection not available' }
    });
  }
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

// 4M 체크리스트 조회
const get4MChecklist = async (req, res) => {
  try {
    const { transfer_id } = req.params;
    
    const query = `
      SELECT * FROM transfer_4m_checklist
      WHERE transfer_id = $1
      ORDER BY checklist_type
    `;
    const result = await pool.query(query, [transfer_id]);
    
    res.json({
      success: true,
      data: {
        checklists: result.rows,
        transfer_id: parseInt(transfer_id)
      }
    });
  } catch (error) {
    logger.error('Get 4M checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get 4M checklist', details: error.message }
    });
  }
};

// 4M 체크리스트 저장/업데이트
const save4MChecklist = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { transfer_id } = req.params;
    const { checklist_type, ...checklistData } = req.body;
    const userId = req.user?.id;
    
    // 기존 체크리스트 확인
    const existingQuery = `
      SELECT id FROM transfer_4m_checklist
      WHERE transfer_id = $1 AND checklist_type = $2
    `;
    const existing = await client.query(existingQuery, [transfer_id, checklist_type]);
    
    if (existing.rows.length > 0) {
      // 업데이트
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(checklistData)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
      
      updateFields.push(`checked_by = $${paramIndex}`);
      updateValues.push(userId);
      paramIndex++;
      
      updateFields.push(`checked_at = NOW()`);
      updateFields.push(`updated_at = NOW()`);
      
      updateValues.push(transfer_id, checklist_type);
      
      const updateQuery = `
        UPDATE transfer_4m_checklist
        SET ${updateFields.join(', ')}
        WHERE transfer_id = $${paramIndex} AND checklist_type = $${paramIndex + 1}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, updateValues);
      await client.query('COMMIT');
      
      return res.json({
        success: true,
        data: result.rows[0]
      });
    } else {
      // 새로 생성
      const insertQuery = `
        INSERT INTO transfer_4m_checklist (
          transfer_id, checklist_type,
          man_operator_assigned, man_operator_name, man_training_completed, man_training_date, man_skill_level, man_notes,
          machine_tonnage_check, machine_tonnage_value, machine_spec_compatible, machine_condition_check, machine_injection_unit_check, machine_notes,
          material_type_confirmed, material_name, material_grade, material_drying_condition, material_drying_temp, material_drying_time, material_color_confirmed, material_notes,
          method_sop_available, method_sop_version, method_injection_condition, method_cycle_time_set, method_cycle_time_value, method_quality_standard, method_notes,
          overall_status, checked_by, checked_at, created_at, updated_at
        ) VALUES (
          $1, $2,
          $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29,
          'pending', $30, NOW(), NOW(), NOW()
        )
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        transfer_id, checklist_type,
        checklistData.man_operator_assigned || false,
        checklistData.man_operator_name || null,
        checklistData.man_training_completed || false,
        checklistData.man_training_date || null,
        checklistData.man_skill_level || null,
        checklistData.man_notes || null,
        checklistData.machine_tonnage_check || false,
        checklistData.machine_tonnage_value || null,
        checklistData.machine_spec_compatible || false,
        checklistData.machine_condition_check || false,
        checklistData.machine_injection_unit_check || false,
        checklistData.machine_notes || null,
        checklistData.material_type_confirmed || false,
        checklistData.material_name || null,
        checklistData.material_grade || null,
        checklistData.material_drying_condition || false,
        checklistData.material_drying_temp || null,
        checklistData.material_drying_time || null,
        checklistData.material_color_confirmed || false,
        checklistData.material_notes || null,
        checklistData.method_sop_available || false,
        checklistData.method_sop_version || null,
        checklistData.method_injection_condition || false,
        checklistData.method_cycle_time_set || false,
        checklistData.method_cycle_time_value || null,
        checklistData.method_quality_standard || false,
        checklistData.method_notes || null,
        userId
      ]);
      
      await client.query('COMMIT');
      
      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Save 4M checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save 4M checklist', details: error.message }
    });
  } finally {
    client.release();
  }
};

// 반출 체크리스트 저장
const saveShipmentChecklist = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { transfer_id } = req.params;
    const checklistData = req.body;
    
    // 기존 체크리스트 확인
    const existingQuery = `SELECT id FROM transfer_shipment_checklist WHERE transfer_id = $1`;
    const existing = await client.query(existingQuery, [transfer_id]);
    
    if (existing.rows.length > 0) {
      // 업데이트
      const updateQuery = `
        UPDATE transfer_shipment_checklist SET
          mold_condition_check = $1, mold_condition_notes = $2,
          mold_cleaning_done = $3, mold_rust_prevention = $4,
          accessories_check = $5, accessories_list = $6,
          spare_parts_included = $7, spare_parts_list = $8,
          documents_included = $9, document_list = $10,
          drawing_included = $11, sop_included = $12,
          packaging_done = $13, packaging_type = $14, packaging_photos = $15,
          shipment_gps_lat = $16, shipment_gps_lng = $17,
          shipper_name = $18, shipper_signature = $19,
          shipped_at = $20, updated_at = NOW()
        WHERE transfer_id = $21
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [
        checklistData.mold_condition_check || false,
        checklistData.mold_condition_notes || null,
        checklistData.mold_cleaning_done || false,
        checklistData.mold_rust_prevention || false,
        checklistData.accessories_check || false,
        JSON.stringify(checklistData.accessories_list || []),
        checklistData.spare_parts_included || false,
        JSON.stringify(checklistData.spare_parts_list || []),
        checklistData.documents_included || false,
        JSON.stringify(checklistData.document_list || []),
        checklistData.drawing_included || false,
        checklistData.sop_included || false,
        checklistData.packaging_done || false,
        checklistData.packaging_type || null,
        JSON.stringify(checklistData.packaging_photos || []),
        checklistData.shipment_gps_lat || null,
        checklistData.shipment_gps_lng || null,
        checklistData.shipper_name || null,
        checklistData.shipper_signature || null,
        checklistData.shipped_at || null,
        transfer_id
      ]);
      
      // 이관 상태 업데이트
      if (checklistData.shipped_at) {
        await client.query(`
          UPDATE mold_transfers SET shipped_at = $1, status = 'shipped', updated_at = NOW()
          WHERE id = $2
        `, [checklistData.shipped_at, transfer_id]);
      }
      
      await client.query('COMMIT');
      return res.json({ success: true, data: result.rows[0] });
    } else {
      // 새로 생성
      const insertQuery = `
        INSERT INTO transfer_shipment_checklist (
          transfer_id, mold_condition_check, mold_condition_notes,
          mold_cleaning_done, mold_rust_prevention,
          accessories_check, accessories_list, spare_parts_included, spare_parts_list,
          documents_included, document_list, drawing_included, sop_included,
          packaging_done, packaging_type, packaging_photos,
          shipment_gps_lat, shipment_gps_lng,
          shipper_name, shipper_signature, shipped_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
        )
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        transfer_id,
        checklistData.mold_condition_check || false,
        checklistData.mold_condition_notes || null,
        checklistData.mold_cleaning_done || false,
        checklistData.mold_rust_prevention || false,
        checklistData.accessories_check || false,
        JSON.stringify(checklistData.accessories_list || []),
        checklistData.spare_parts_included || false,
        JSON.stringify(checklistData.spare_parts_list || []),
        checklistData.documents_included || false,
        JSON.stringify(checklistData.document_list || []),
        checklistData.drawing_included || false,
        checklistData.sop_included || false,
        checklistData.packaging_done || false,
        checklistData.packaging_type || null,
        JSON.stringify(checklistData.packaging_photos || []),
        checklistData.shipment_gps_lat || null,
        checklistData.shipment_gps_lng || null,
        checklistData.shipper_name || null,
        checklistData.shipper_signature || null,
        checklistData.shipped_at || null
      ]);
      
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: result.rows[0] });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Save shipment checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save shipment checklist', details: error.message }
    });
  } finally {
    client.release();
  }
};

// 입고 체크리스트 저장
const saveReceivingChecklist = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { transfer_id } = req.params;
    const checklistData = req.body;
    const userId = req.user?.id;
    
    // 기존 체크리스트 확인
    const existingQuery = `SELECT id FROM transfer_receiving_checklist WHERE transfer_id = $1`;
    const existing = await client.query(existingQuery, [transfer_id]);
    
    if (existing.rows.length > 0) {
      // 업데이트
      const updateQuery = `
        UPDATE transfer_receiving_checklist SET
          mold_condition_check = $1, mold_condition_notes = $2,
          damage_found = $3, damage_description = $4, damage_photos = $5,
          accessories_received = $6, accessories_missing = $7,
          spare_parts_received = $8, spare_parts_missing = $9,
          documents_received = $10, documents_missing = $11,
          packaging_condition = $12, packaging_notes = $13,
          receiving_gps_lat = $14, receiving_gps_lng = $15,
          receiver_name = $16, receiver_signature = $17,
          received_at = $18, issue_reported = $19, issue_description = $20,
          updated_at = NOW()
        WHERE transfer_id = $21
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [
        checklistData.mold_condition_check || false,
        checklistData.mold_condition_notes || null,
        checklistData.damage_found || false,
        checklistData.damage_description || null,
        JSON.stringify(checklistData.damage_photos || []),
        checklistData.accessories_received || false,
        JSON.stringify(checklistData.accessories_missing || []),
        checklistData.spare_parts_received || false,
        JSON.stringify(checklistData.spare_parts_missing || []),
        checklistData.documents_received || false,
        JSON.stringify(checklistData.documents_missing || []),
        checklistData.packaging_condition || null,
        checklistData.packaging_notes || null,
        checklistData.receiving_gps_lat || null,
        checklistData.receiving_gps_lng || null,
        checklistData.receiver_name || null,
        checklistData.receiver_signature || null,
        checklistData.received_at || null,
        checklistData.issue_reported || false,
        checklistData.issue_description || null,
        transfer_id
      ]);
      
      // 이관 상태 업데이트
      if (checklistData.received_at) {
        await client.query(`
          UPDATE mold_transfers SET 
            received_at = $1, received_by = $2, status = 'received', updated_at = NOW()
          WHERE id = $3
        `, [checklistData.received_at, userId, transfer_id]);
      }
      
      await client.query('COMMIT');
      return res.json({ success: true, data: result.rows[0] });
    } else {
      // 새로 생성
      const insertQuery = `
        INSERT INTO transfer_receiving_checklist (
          transfer_id, mold_condition_check, mold_condition_notes,
          damage_found, damage_description, damage_photos,
          accessories_received, accessories_missing,
          spare_parts_received, spare_parts_missing,
          documents_received, documents_missing,
          packaging_condition, packaging_notes,
          receiving_gps_lat, receiving_gps_lng,
          receiver_name, receiver_signature, received_at,
          issue_reported, issue_description,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
        )
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        transfer_id,
        checklistData.mold_condition_check || false,
        checklistData.mold_condition_notes || null,
        checklistData.damage_found || false,
        checklistData.damage_description || null,
        JSON.stringify(checklistData.damage_photos || []),
        checklistData.accessories_received || false,
        JSON.stringify(checklistData.accessories_missing || []),
        checklistData.spare_parts_received || false,
        JSON.stringify(checklistData.spare_parts_missing || []),
        checklistData.documents_received || false,
        JSON.stringify(checklistData.documents_missing || []),
        checklistData.packaging_condition || null,
        checklistData.packaging_notes || null,
        checklistData.receiving_gps_lat || null,
        checklistData.receiving_gps_lng || null,
        checklistData.receiver_name || null,
        checklistData.receiver_signature || null,
        checklistData.received_at || null,
        checklistData.issue_reported || false,
        checklistData.issue_description || null
      ]);
      
      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: result.rows[0] });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Save receiving checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to save receiving checklist', details: error.message }
    });
  } finally {
    client.release();
  }
};

// 4M 체크리스트 기본 항목 반환
const get4MChecklistTemplate = async (req, res) => {
  try {
    const template = {
      man: {
        title: 'Man (인력)',
        items: [
          { key: 'man_operator_assigned', label: '작업자 배정', type: 'boolean', required: true },
          { key: 'man_operator_name', label: '작업자명', type: 'text', required: true },
          { key: 'man_training_completed', label: '교육 이수', type: 'boolean', required: true },
          { key: 'man_training_date', label: '교육 이수일', type: 'date', required: false },
          { key: 'man_skill_level', label: '숙련도', type: 'select', options: ['초급', '중급', '고급'], required: false },
          { key: 'man_notes', label: '비고', type: 'textarea', required: false }
        ]
      },
      machine: {
        title: 'Machine (설비)',
        items: [
          { key: 'machine_tonnage_check', label: '톤수 확인', type: 'boolean', required: true },
          { key: 'machine_tonnage_value', label: '톤수 (ton)', type: 'number', required: true },
          { key: 'machine_spec_compatible', label: '사양 호환성', type: 'boolean', required: true },
          { key: 'machine_condition_check', label: '설비 상태 확인', type: 'boolean', required: true },
          { key: 'machine_injection_unit_check', label: '사출 유닛 확인', type: 'boolean', required: true },
          { key: 'machine_notes', label: '비고', type: 'textarea', required: false }
        ]
      },
      material: {
        title: 'Material (원료)',
        items: [
          { key: 'material_type_confirmed', label: '원료 종류 확인', type: 'boolean', required: true },
          { key: 'material_name', label: '원료명', type: 'text', required: true },
          { key: 'material_grade', label: '그레이드', type: 'text', required: true },
          { key: 'material_drying_condition', label: '건조 조건 확인', type: 'boolean', required: true },
          { key: 'material_drying_temp', label: '건조 온도 (°C)', type: 'number', required: false },
          { key: 'material_drying_time', label: '건조 시간 (hr)', type: 'number', required: false },
          { key: 'material_color_confirmed', label: '색상 확인', type: 'boolean', required: false },
          { key: 'material_notes', label: '비고', type: 'textarea', required: false }
        ]
      },
      method: {
        title: 'Method (작업방법)',
        items: [
          { key: 'method_sop_available', label: 'SOP 확보', type: 'boolean', required: true },
          { key: 'method_sop_version', label: 'SOP 버전', type: 'text', required: false },
          { key: 'method_injection_condition', label: '사출 조건 확인', type: 'boolean', required: true },
          { key: 'method_cycle_time_set', label: '사이클 타임 설정', type: 'boolean', required: true },
          { key: 'method_cycle_time_value', label: '사이클 타임 (초)', type: 'number', required: false },
          { key: 'method_quality_standard', label: '품질 기준 확인', type: 'boolean', required: true },
          { key: 'method_notes', label: '비고', type: 'textarea', required: false }
        ]
      }
    };
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Get 4M checklist template error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get 4M checklist template' }
    });
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  getChecklistItems,
  get4MChecklist,
  save4MChecklist,
  saveShipmentChecklist,
  saveReceivingChecklist,
  get4MChecklistTemplate
};
