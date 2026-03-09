/**
 * 수리요청 단계별 워크플로우 API
 * 
 * 7단계: 요청접수 → 수리처선정 → 수리진행 → 체크리스트 → 생산처검수 → 귀책처리 → 완료
 * 각 단계별: 임시저장 → 제출 → 승인요청 → 승인/반려
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');

router.use(authenticate);

const STEPS = [
  { number: 1, name: '요청접수', role: 'plant', approverRole: 'mold_developer' },
  { number: 2, name: '수리처선정', role: 'plant', approverRole: 'mold_developer' },
  { number: 3, name: '수리진행', role: 'maker', approverRole: 'mold_developer' },
  { number: 4, name: '체크리스트', role: 'maker', approverRole: 'mold_developer' },
  { number: 5, name: '생산처검수', role: 'plant', approverRole: 'mold_developer' },
  { number: 6, name: '귀책처리', role: 'mold_developer', approverRole: 'system_admin' },
  { number: 7, name: '완료', role: 'mold_developer', approverRole: null }
];

function getStepDef(stepNumber) {
  return STEPS.find(s => s.number === stepNumber);
}

/**
 * 수리요청 생성 (1단계 시작)
 * POST /api/v1/repair-step-workflow
 */
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { mold_spec_id, mold_id, draft_data } = req.body;

    // repair_requests 생성
    const [result] = await sequelize.query(`
      INSERT INTO repair_requests (
        mold_id, mold_spec_id, status, current_step, current_step_name, 
        current_step_status, requester_id, requester_name, requester_company_id,
        created_at, updated_at
      ) VALUES (
        :moldId, :moldSpecId, '요청접수', 1, '요청접수', 'draft',
        :userId, :userName, :companyId,
        NOW(), NOW()
      ) RETURNING id, current_step, current_step_name, current_step_status
    `, {
      replacements: {
        moldId: mold_id || null,
        moldSpecId: mold_spec_id || null,
        userId,
        userName: req.user.name || req.user.username,
        companyId: req.user.company_id || null
      },
      transaction: t
    });

    const repairId = result[0].id;

    // 1단계 draft 저장
    if (draft_data) {
      await sequelize.query(`
        INSERT INTO repair_step_drafts (repair_request_id, step_number, step_name, draft_data, saved_by, saved_by_name)
        VALUES (:repairId, 1, '요청접수', :draftData, :userId, :userName)
        ON CONFLICT (repair_request_id, step_number)
        DO UPDATE SET draft_data = :draftData, saved_by = :userId, saved_by_name = :userName, updated_at = NOW()
      `, {
        replacements: {
          repairId,
          draftData: JSON.stringify(draft_data),
          userId,
          userName: req.user.name || req.user.username
        },
        transaction: t
      });
    }

    // 이력 기록
    await recordHistory(repairId, 1, '요청접수', 'created', 'draft', req.user, null, t);

    await t.commit();
    res.json({
      success: true,
      data: { id: repairId, current_step: 1, current_step_name: '요청접수', current_step_status: 'draft' }
    });
  } catch (error) {
    await t.rollback();
    console.error('[RepairStepWorkflow] Create error:', error);
    res.status(500).json({ success: false, error: { message: '수리요청 생성 실패: ' + error.message } });
  }
});

/**
 * 수리요청 상세 조회 (전체 단계 + 임시저장 + 승인 상태)
 * GET /api/v1/repair-step-workflow/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 기본 정보
    const [repairs] = await sequelize.query(`
      SELECT rr.*, 
        u.name as requester_display_name, u.user_type as requester_type
      FROM repair_requests rr
      LEFT JOIN users u ON rr.requester_id = u.id
      WHERE rr.id = :id
    `, { replacements: { id } });

    if (!repairs[0]) {
      return res.status(404).json({ success: false, error: { message: '수리요청을 찾을 수 없습니다.' } });
    }

    // 단계별 임시저장 데이터
    const [drafts] = await sequelize.query(`
      SELECT * FROM repair_step_drafts 
      WHERE repair_request_id = :id ORDER BY step_number
    `, { replacements: { id } });

    // 단계별 승인 상태
    const [approvals] = await sequelize.query(`
      SELECT * FROM repair_step_approvals 
      WHERE repair_request_id = :id ORDER BY step_number
    `, { replacements: { id } });

    // 워크플로우 이력
    const [history] = await sequelize.query(`
      SELECT * FROM repair_workflow_history 
      WHERE repair_request_id = :id ORDER BY created_at DESC LIMIT 50
    `, { replacements: { id } });

    // 단계 정보 조합
    const steps = STEPS.map(stepDef => {
      const draft = drafts.find(d => d.step_number === stepDef.number);
      const approval = approvals.find(a => a.step_number === stepDef.number);
      return {
        ...stepDef,
        draft: draft ? {
          draft_data: draft.draft_data,
          is_submitted: draft.is_submitted,
          submitted_at: draft.submitted_at,
          saved_by_name: draft.saved_by_name,
          updated_at: draft.updated_at
        } : null,
        approval: approval ? {
          approval_status: approval.approval_status,
          requested_by_name: approval.requested_by_name,
          requested_at: approval.requested_at,
          approver_name: approval.approver_name,
          approved_at: approval.approved_at,
          rejection_reason: approval.rejection_reason,
          approval_notes: approval.approval_notes
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        repair: repairs[0],
        steps,
        history
      }
    });
  } catch (error) {
    console.error('[RepairStepWorkflow] Get detail error:', error);
    res.status(500).json({ success: false, error: { message: '수리요청 상세 조회 실패' } });
  }
});

/**
 * 단계별 임시저장
 * PUT /api/v1/repair-step-workflow/:id/steps/:stepNumber/draft
 */
router.put('/:id/steps/:stepNumber/draft', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, stepNumber } = req.params;
    const { draft_data } = req.body;
    const userId = req.user.id;
    const step = parseInt(stepNumber);

    // 유효성 확인
    const stepDef = getStepDef(step);
    if (!stepDef) {
      await t.rollback();
      return res.status(400).json({ success: false, error: { message: '유효하지 않은 단계입니다.' } });
    }

    // 수리요청 존재 확인
    const [repairs] = await sequelize.query(
      'SELECT id, current_step FROM repair_requests WHERE id = :id',
      { replacements: { id }, transaction: t }
    );
    if (!repairs[0]) {
      await t.rollback();
      return res.status(404).json({ success: false, error: { message: '수리요청을 찾을 수 없습니다.' } });
    }

    // draft 저장 (upsert)
    await sequelize.query(`
      INSERT INTO repair_step_drafts (repair_request_id, step_number, step_name, draft_data, saved_by, saved_by_name)
      VALUES (:repairId, :step, :stepName, :draftData, :userId, :userName)
      ON CONFLICT (repair_request_id, step_number)
      DO UPDATE SET draft_data = :draftData, saved_by = :userId, saved_by_name = :userName, updated_at = NOW()
    `, {
      replacements: {
        repairId: id,
        step,
        stepName: stepDef.name,
        draftData: JSON.stringify(draft_data),
        userId,
        userName: req.user.name || req.user.username
      },
      transaction: t
    });

    // repair_requests의 해당 단계 필드도 업데이트
    await updateRepairRequestFields(id, step, draft_data, t);

    // 이력 기록
    await recordHistory(id, step, stepDef.name, 'draft_saved', 'draft', req.user, null, t);

    await t.commit();
    res.json({
      success: true,
      message: `${stepDef.name} 단계 임시저장 완료`,
      data: { step_number: step, step_name: stepDef.name }
    });
  } catch (error) {
    await t.rollback();
    console.error('[RepairStepWorkflow] Draft save error:', error);
    res.status(500).json({ success: false, error: { message: '임시저장 실패: ' + error.message } });
  }
});

/**
 * 단계별 제출 (임시저장 → 제출)
 * POST /api/v1/repair-step-workflow/:id/steps/:stepNumber/submit
 */
router.post('/:id/steps/:stepNumber/submit', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, stepNumber } = req.params;
    const { draft_data } = req.body;
    const userId = req.user.id;
    const step = parseInt(stepNumber);
    const stepDef = getStepDef(step);

    if (!stepDef) {
      await t.rollback();
      return res.status(400).json({ success: false, error: { message: '유효하지 않은 단계입니다.' } });
    }

    // draft 저장 + submitted 플래그
    await sequelize.query(`
      INSERT INTO repair_step_drafts (repair_request_id, step_number, step_name, draft_data, saved_by, saved_by_name, is_submitted, submitted_at)
      VALUES (:repairId, :step, :stepName, :draftData, :userId, :userName, TRUE, NOW())
      ON CONFLICT (repair_request_id, step_number)
      DO UPDATE SET draft_data = :draftData, saved_by = :userId, saved_by_name = :userName, 
                    is_submitted = TRUE, submitted_at = NOW(), updated_at = NOW()
    `, {
      replacements: {
        repairId: id, step, stepName: stepDef.name,
        draftData: JSON.stringify(draft_data || {}),
        userId, userName: req.user.name || req.user.username
      },
      transaction: t
    });

    // repair_requests 필드 업데이트
    if (draft_data) {
      await updateRepairRequestFields(id, step, draft_data, t);
    }

    // 현재 단계 상태 업데이트
    await sequelize.query(`
      UPDATE repair_requests 
      SET current_step = :step, current_step_name = :stepName, current_step_status = 'submitted', updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id, step, stepName: stepDef.name }, transaction: t });

    await recordHistory(id, step, stepDef.name, 'submitted', 'submitted', req.user, null, t);

    await t.commit();
    res.json({
      success: true,
      message: `${stepDef.name} 단계 제출 완료`,
      data: { step_number: step, current_step_status: 'submitted' }
    });
  } catch (error) {
    await t.rollback();
    console.error('[RepairStepWorkflow] Submit error:', error);
    res.status(500).json({ success: false, error: { message: '제출 실패: ' + error.message } });
  }
});

/**
 * 승인요청
 * POST /api/v1/repair-step-workflow/:id/steps/:stepNumber/request-approval
 */
router.post('/:id/steps/:stepNumber/request-approval', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, stepNumber } = req.params;
    const { approver_id, approver_name, comment } = req.body;
    const userId = req.user.id;
    const step = parseInt(stepNumber);
    const stepDef = getStepDef(step);

    if (!stepDef) {
      await t.rollback();
      return res.status(400).json({ success: false, error: { message: '유효하지 않은 단계입니다.' } });
    }

    // 승인 요청 레코드 upsert
    await sequelize.query(`
      INSERT INTO repair_step_approvals (
        repair_request_id, step_number, step_name, approval_status,
        requested_by, requested_by_name, requested_at,
        approver_id, approver_name
      ) VALUES (
        :repairId, :step, :stepName, 'requested',
        :userId, :userName, NOW(),
        :approverId, :approverName
      )
      ON CONFLICT (repair_request_id, step_number)
      DO UPDATE SET approval_status = 'requested',
                    requested_by = :userId, requested_by_name = :userName, requested_at = NOW(),
                    approver_id = :approverId, approver_name = :approverName,
                    rejection_reason = NULL, updated_at = NOW()
    `, {
      replacements: {
        repairId: id, step, stepName: stepDef.name,
        userId, userName: req.user.name || req.user.username,
        approverId: approver_id || null, approverName: approver_name || null
      },
      transaction: t
    });

    // repair_requests 상태 업데이트
    await sequelize.query(`
      UPDATE repair_requests 
      SET current_step_status = 'pending_approval', updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id }, transaction: t });

    await recordHistory(id, step, stepDef.name, 'approval_requested', 'pending_approval', req.user, comment, t);

    await t.commit();
    res.json({
      success: true,
      message: `${stepDef.name} 단계 승인요청 완료`,
      data: { step_number: step, approval_status: 'requested' }
    });
  } catch (error) {
    await t.rollback();
    console.error('[RepairStepWorkflow] Request approval error:', error);
    res.status(500).json({ success: false, error: { message: '승인요청 실패: ' + error.message } });
  }
});

/**
 * 승인 처리
 * POST /api/v1/repair-step-workflow/:id/steps/:stepNumber/approve
 */
router.post('/:id/steps/:stepNumber/approve', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, stepNumber } = req.params;
    const { approval_notes } = req.body;
    const userId = req.user.id;
    const step = parseInt(stepNumber);
    const stepDef = getStepDef(step);

    if (!stepDef) {
      await t.rollback();
      return res.status(400).json({ success: false, error: { message: '유효하지 않은 단계입니다.' } });
    }

    // 승인 업데이트
    await sequelize.query(`
      UPDATE repair_step_approvals 
      SET approval_status = 'approved', approver_id = :userId, approver_name = :userName,
          approved_at = NOW(), approval_notes = :notes, updated_at = NOW()
      WHERE repair_request_id = :id AND step_number = :step
    `, {
      replacements: {
        id, step, userId,
        userName: req.user.name || req.user.username,
        notes: approval_notes || null
      },
      transaction: t
    });

    // 다음 단계로 이동
    const nextStep = step < 7 ? step + 1 : 7;
    const nextStepDef = getStepDef(nextStep);
    const nextStatus = step >= 7 ? 'completed' : 'draft';
    const repairStatus = step >= 7 ? '완료' : nextStepDef.name;

    await sequelize.query(`
      UPDATE repair_requests 
      SET current_step = :nextStep, current_step_name = :nextStepName, 
          current_step_status = :nextStatus, status = :repairStatus, updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, nextStep, nextStepName: nextStepDef.name, nextStatus, repairStatus },
      transaction: t
    });

    await recordHistory(id, step, stepDef.name, 'approved', 'approved', req.user, approval_notes, t);

    await t.commit();
    res.json({
      success: true,
      message: `${stepDef.name} 단계 승인 완료. 다음 단계: ${nextStepDef.name}`,
      data: { step_number: step, next_step: nextStep, approval_status: 'approved' }
    });
  } catch (error) {
    await t.rollback();
    console.error('[RepairStepWorkflow] Approve error:', error);
    res.status(500).json({ success: false, error: { message: '승인 실패: ' + error.message } });
  }
});

/**
 * 반려 처리
 * POST /api/v1/repair-step-workflow/:id/steps/:stepNumber/reject
 */
router.post('/:id/steps/:stepNumber/reject', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, stepNumber } = req.params;
    const { rejection_reason } = req.body;
    const userId = req.user.id;
    const step = parseInt(stepNumber);
    const stepDef = getStepDef(step);

    if (!stepDef) {
      await t.rollback();
      return res.status(400).json({ success: false, error: { message: '유효하지 않은 단계입니다.' } });
    }

    if (!rejection_reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: { message: '반려 사유를 입력해주세요.' } });
    }

    await sequelize.query(`
      UPDATE repair_step_approvals 
      SET approval_status = 'rejected', approver_id = :userId, approver_name = :userName,
          approved_at = NOW(), rejection_reason = :reason, updated_at = NOW()
      WHERE repair_request_id = :id AND step_number = :step
    `, {
      replacements: {
        id, step, userId,
        userName: req.user.name || req.user.username,
        reason: rejection_reason
      },
      transaction: t
    });

    // 현재 단계로 되돌림 (재작성 필요)
    await sequelize.query(`
      UPDATE repair_requests 
      SET current_step_status = 'rejected', updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id }, transaction: t });

    // draft의 is_submitted를 false로 리셋 (재작성 가능)
    await sequelize.query(`
      UPDATE repair_step_drafts 
      SET is_submitted = FALSE, updated_at = NOW()
      WHERE repair_request_id = :id AND step_number = :step
    `, { replacements: { id, step }, transaction: t });

    await recordHistory(id, step, stepDef.name, 'rejected', 'rejected', req.user, rejection_reason, t);

    await t.commit();
    res.json({
      success: true,
      message: `${stepDef.name} 단계가 반려되었습니다.`,
      data: { step_number: step, approval_status: 'rejected', rejection_reason }
    });
  } catch (error) {
    await t.rollback();
    console.error('[RepairStepWorkflow] Reject error:', error);
    res.status(500).json({ success: false, error: { message: '반려 실패: ' + error.message } });
  }
});

/**
 * 워크플로우 이력 조회
 * GET /api/v1/repair-step-workflow/:id/history
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const [history] = await sequelize.query(`
      SELECT * FROM repair_workflow_history 
      WHERE repair_request_id = :id 
      ORDER BY created_at DESC
    `, { replacements: { id } });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[RepairStepWorkflow] History error:', error);
    res.status(500).json({ success: false, error: { message: '이력 조회 실패' } });
  }
});

/**
 * 내 승인 대기 목록
 * GET /api/v1/repair-step-workflow/my/pending-approvals
 */
router.get('/my/pending-approvals', async (req, res) => {
  try {
    const userId = req.user.id;
    const [approvals] = await sequelize.query(`
      SELECT rsa.*, rr.mold_id, rr.mold_spec_id, rr.status as repair_status,
        rr.requester_name, rr.created_at as repair_created_at
      FROM repair_step_approvals rsa
      JOIN repair_requests rr ON rr.id = rsa.repair_request_id
      WHERE rsa.approval_status = 'requested'
        AND (rsa.approver_id = :userId OR rsa.approver_id IS NULL)
      ORDER BY rsa.requested_at DESC
    `, { replacements: { userId } });

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('[RepairStepWorkflow] Pending approvals error:', error);
    res.status(500).json({ success: false, error: { message: '승인 대기 목록 조회 실패' } });
  }
});

/**
 * repair_requests 필드 업데이트 헬퍼
 */
async function updateRepairRequestFields(repairId, step, data, transaction) {
  if (!data || typeof data !== 'object') return;

  // 단계별로 repair_requests의 해당 컬럼 업데이트
  const fieldMappings = {
    1: ['problem', 'cause_and_reason', 'priority', 'occurred_date', 'problem_type', 'occurrence_type',
        'repair_category', 'plant_manager_name', 'plant_manager_contact', 'cams_manager_id',
        'cams_manager_name', 'cams_manager_contact', 'stock_quantity', 'shortage_expected_date',
        'mold_arrival_request_datetime', 'car_model', 'part_number', 'part_name', 'maker',
        'production_site', 'production_shot'],
    2: ['repair_shop_type', 'repair_company', 'repair_shop_selected_by', 'repair_shop_selected_date',
        'repair_shop_approval_status', 'repair_shop_approved_by', 'repair_shop_approved_date',
        'repair_shop_rejection_reason'],
    3: ['manager_name', 'temporary_action', 'root_cause_action', 'repair_cost', 'repair_duration',
        'completion_date', 'mold_arrival_date', 'repair_start_date', 'repair_end_date'],
    4: ['checklist_result', 'checklist_comment', 'checklist_inspector', 'checklist_date', 'checklist_status'],
    5: ['plant_inspection_status', 'plant_inspection_result', 'plant_inspection_comment',
        'plant_inspection_by', 'plant_inspection_date', 'plant_inspection_rejection_reason'],
    6: ['liability_type', 'liability_ratio_maker', 'liability_ratio_plant', 'liability_reason',
        'liability_decided_by', 'liability_decided_date'],
    7: ['operation_type', 'management_type', 'sign_off_status', 'order_company']
  };

  const allowedFields = fieldMappings[step] || [];
  const updates = [];
  const replacements = { id: repairId };

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = :${field}`);
      replacements[field] = data[field] === '' ? null : data[field];
    }
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    await sequelize.query(
      `UPDATE repair_requests SET ${updates.join(', ')} WHERE id = :id`,
      { replacements, transaction }
    );
  }
}

/**
 * 워크플로우 이력 기록 헬퍼
 */
async function recordHistory(repairId, stepNumber, stepName, action, status, user, comment, transaction) {
  try {
    await sequelize.query(`
      INSERT INTO repair_workflow_history (
        repair_request_id, step_number, step_name, action, status,
        user_id, user_name, user_type, comment, created_at
      ) VALUES (
        :repairId, :stepNumber, :stepName, :action, :status,
        :userId, :userName, :userType, :comment, NOW()
      )
    `, {
      replacements: {
        repairId, stepNumber, stepName, action, status,
        userId: user.id,
        userName: user.name || user.username,
        userType: user.user_type || null,
        comment: comment || null
      },
      transaction
    });
  } catch (error) {
    console.error('[RecordHistory] Error:', error.message);
  }
}

module.exports = router;
