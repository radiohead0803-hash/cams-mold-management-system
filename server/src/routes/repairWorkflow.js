/**
 * 수리요청 워크플로우 API
 * - 요청 → 접수 → 진행 → 완료 → 확인(Closed) 종단 흐름
 * - 사진첨부, 상태변경, 담당배정, 귀책협의, 승인/반려
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');
const alertAutoService = require('../services/alertAutoService');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 수리요청 상태 정의
const REPAIR_STATUS = {
  PENDING: 'pending',           // 요청됨 (생산처)
  ACCEPTED: 'accepted',         // 접수됨 (제작처)
  IN_PROGRESS: 'in_progress',   // 수리중 (제작처)
  COMPLETED: 'completed',       // 수리완료 (제작처)
  CONFIRMED: 'confirmed',       // 확인완료 (생산처)
  REJECTED: 'rejected',         // 반려됨
  LIABILITY_DISCUSSION: 'liability_discussion'  // 귀책협의중
};

/**
 * 수리요청 접수 (제작처)
 * POST /api/v1/repair-workflow/:id/accept
 */
router.post('/:id/accept', authorize(['maker']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estimatedDays, assigneeId, comment } = req.body;
    const userId = req.user.id;

    // 수리요청 확인
    const [repair] = await sequelize.query(`
      SELECT id, status, mold_id, requester_company_id
      FROM repair_requests WHERE id = :id
    `, {
      replacements: { id },
      transaction,
      type: sequelize.QueryTypes.SELECT
    });

    if (!repair) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: { message: '수리요청을 찾을 수 없습니다.' } });
    }

    if (repair.status !== REPAIR_STATUS.PENDING) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { message: '접수 가능한 상태가 아닙니다.' } });
    }

    // 상태 업데이트
    await sequelize.query(`
      UPDATE repair_requests
      SET status = 'accepted', 
          accepted_at = NOW(),
          accepted_by = :userId,
          assignee_id = :assigneeId,
          estimated_completion_days = :estimatedDays,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, userId, assigneeId: assigneeId || userId, estimatedDays: estimatedDays || 7 },
      transaction
    });

    // 이력 기록
    await recordWorkflowHistory(id, 'accepted', userId, comment, transaction);

    await transaction.commit();

    res.json({
      success: true,
      message: '수리요청이 접수되었습니다.',
      data: { status: 'accepted' }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('[RepairWorkflow] Accept error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to accept repair request' } });
  }
});

/**
 * 수리 시작 (제작처)
 * POST /api/v1/repair-workflow/:id/start
 */
router.post('/:id/start', authorize(['maker']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const [repair] = await sequelize.query(`
      SELECT id, status FROM repair_requests WHERE id = :id
    `, {
      replacements: { id },
      transaction,
      type: sequelize.QueryTypes.SELECT
    });

    if (!repair || repair.status !== REPAIR_STATUS.ACCEPTED) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { message: '수리 시작 가능한 상태가 아닙니다.' } });
    }

    await sequelize.query(`
      UPDATE repair_requests
      SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id }, transaction });

    await recordWorkflowHistory(id, 'in_progress', userId, comment, transaction);

    await transaction.commit();

    res.json({ success: true, message: '수리가 시작되었습니다.', data: { status: 'in_progress' } });
  } catch (error) {
    await transaction.rollback();
    console.error('[RepairWorkflow] Start error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to start repair' } });
  }
});

/**
 * 수리 완료 (제작처)
 * POST /api/v1/repair-workflow/:id/complete
 */
router.post('/:id/complete', authorize(['maker']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { repairDescription, repairCost, liabilityRatio, photos, comment } = req.body;
    const userId = req.user.id;

    const [repair] = await sequelize.query(`
      SELECT id, status, mold_id, requester_company_id
      FROM repair_requests WHERE id = :id
    `, {
      replacements: { id },
      transaction,
      type: sequelize.QueryTypes.SELECT
    });

    if (!repair || repair.status !== REPAIR_STATUS.IN_PROGRESS) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { message: '완료 처리 가능한 상태가 아닙니다.' } });
    }

    await sequelize.query(`
      UPDATE repair_requests
      SET status = 'completed',
          completed_at = NOW(),
          completed_by = :userId,
          repair_description = :repairDescription,
          repair_cost = :repairCost,
          liability_ratio = :liabilityRatio,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { 
        id, userId, 
        repairDescription: repairDescription || null,
        repairCost: repairCost || 0,
        liabilityRatio: liabilityRatio || null
      },
      transaction
    });

    await recordWorkflowHistory(id, 'completed', userId, comment, transaction);

    // 생산처에 알림 발송
    await alertAutoService.createAlert({
      moldId: repair.mold_id,
      companyId: repair.requester_company_id,
      alertType: 'repair_completed',
      severity: 'medium',
      title: '[수리 완료] 확인 필요',
      message: '수리가 완료되었습니다. 확인해주세요.',
      relatedId: id,
      relatedType: 'repair_request'
    });

    await transaction.commit();

    res.json({ success: true, message: '수리가 완료되었습니다.', data: { status: 'completed' } });
  } catch (error) {
    await transaction.rollback();
    console.error('[RepairWorkflow] Complete error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to complete repair' } });
  }
});

/**
 * 수리 확인 (생산처) - 최종 종료
 * POST /api/v1/repair-workflow/:id/confirm
 */
router.post('/:id/confirm', authorize(['plant']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { satisfactionScore, comment } = req.body;
    const userId = req.user.id;

    const [repair] = await sequelize.query(`
      SELECT id, status FROM repair_requests WHERE id = :id
    `, {
      replacements: { id },
      transaction,
      type: sequelize.QueryTypes.SELECT
    });

    if (!repair || repair.status !== REPAIR_STATUS.COMPLETED) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: { message: '확인 가능한 상태가 아닙니다.' } });
    }

    await sequelize.query(`
      UPDATE repair_requests
      SET status = 'confirmed',
          confirmed_at = NOW(),
          confirmed_by = :userId,
          satisfaction_score = :satisfactionScore,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, userId, satisfactionScore: satisfactionScore || null },
      transaction
    });

    await recordWorkflowHistory(id, 'confirmed', userId, comment, transaction);

    await transaction.commit();

    res.json({ success: true, message: '수리 확인이 완료되었습니다.', data: { status: 'confirmed' } });
  } catch (error) {
    await transaction.rollback();
    console.error('[RepairWorkflow] Confirm error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to confirm repair' } });
  }
});

/**
 * 귀책 협의 시작
 * POST /api/v1/repair-workflow/:id/start-liability-discussion
 */
router.post('/:id/start-liability-discussion', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason, proposedRatio, comment } = req.body;
    const userId = req.user.id;

    await sequelize.query(`
      UPDATE repair_requests
      SET status = 'liability_discussion',
          liability_discussion_started_at = NOW(),
          proposed_liability_ratio = :proposedRatio,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, proposedRatio: proposedRatio || null },
      transaction
    });

    await recordWorkflowHistory(id, 'liability_discussion', userId, `귀책협의 시작: ${reason || ''} ${comment || ''}`, transaction);

    await transaction.commit();

    res.json({ success: true, message: '귀책 협의가 시작되었습니다.', data: { status: 'liability_discussion' } });
  } catch (error) {
    await transaction.rollback();
    console.error('[RepairWorkflow] Liability discussion error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to start liability discussion' } });
  }
});

/**
 * 귀책 협의 완료
 * POST /api/v1/repair-workflow/:id/resolve-liability
 */
router.post('/:id/resolve-liability', authorize(['mold_developer', 'system_admin']), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { finalLiabilityRatio, resolution, comment } = req.body;
    const userId = req.user.id;

    await sequelize.query(`
      UPDATE repair_requests
      SET liability_ratio = :finalLiabilityRatio,
          liability_resolution = :resolution,
          liability_resolved_at = NOW(),
          liability_resolved_by = :userId,
          status = 'in_progress',
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, userId, finalLiabilityRatio, resolution: resolution || null },
      transaction
    });

    await recordWorkflowHistory(id, 'liability_resolved', userId, `귀책 확정: ${finalLiabilityRatio}% - ${comment || ''}`, transaction);

    await transaction.commit();

    res.json({ success: true, message: '귀책 협의가 완료되었습니다.', data: { liabilityRatio: finalLiabilityRatio } });
  } catch (error) {
    await transaction.rollback();
    console.error('[RepairWorkflow] Resolve liability error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to resolve liability' } });
  }
});

/**
 * 워크플로우 이력 조회
 * GET /api/v1/repair-workflow/:id/history
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const [history] = await sequelize.query(`
      SELECT 
        rwh.id, rwh.status, rwh.comment, rwh.created_at,
        u.name as user_name, u.user_type
      FROM repair_workflow_history rwh
      LEFT JOIN users u ON rwh.user_id = u.id
      WHERE rwh.repair_request_id = :id
      ORDER BY rwh.created_at DESC
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: history || [] });
  } catch (error) {
    console.error('[RepairWorkflow] History error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get workflow history' } });
  }
});

/**
 * 수리요청 TAT (Turn Around Time) 통계
 * GET /api/v1/repair-workflow/stats/tat
 */
router.get('/stats/tat', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as completed_repairs,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_completion_days,
        AVG(EXTRACT(EPOCH FROM (confirmed_at - completed_at)) / 86400) as avg_confirmation_days,
        AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 86400) as avg_total_days
      FROM repair_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
        AND status IN ('completed', 'confirmed')
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        totalRepairs: parseInt(stats?.total_repairs || 0),
        completedRepairs: parseInt(stats?.completed_repairs || 0),
        avgCompletionDays: parseFloat(stats?.avg_completion_days || 0).toFixed(1),
        avgConfirmationDays: parseFloat(stats?.avg_confirmation_days || 0).toFixed(1),
        avgTotalDays: parseFloat(stats?.avg_total_days || 0).toFixed(1)
      }
    });
  } catch (error) {
    console.error('[RepairWorkflow] TAT stats error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get TAT stats' } });
  }
});

/**
 * 워크플로우 이력 기록 함수
 */
async function recordWorkflowHistory(repairRequestId, status, userId, comment, transaction) {
  try {
    await sequelize.query(`
      INSERT INTO repair_workflow_history (
        repair_request_id, status, user_id, comment, created_at
      ) VALUES (
        :repairRequestId, :status, :userId, :comment, NOW()
      )
    `, {
      replacements: { repairRequestId, status, userId, comment: comment || null },
      transaction
    });
  } catch (error) {
    console.error('[RepairWorkflow] History record error:', error.message);
  }
}

module.exports = router;
