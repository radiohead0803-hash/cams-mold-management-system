const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ChecklistInstance, User, Notification, sequelize } = require('../models/newIndex');

/**
 * 일상점검 임시저장
 * POST /api/v1/checklist-instances/daily/draft
 */
router.post('/daily/draft', authenticate, async (req, res) => {
  try {
    const { mold_id, check_date, results, production_quantity, summary } = req.body;
    const user = req.user;

    const instance = await ChecklistInstance.create({
      mold_id,
      category: 'daily',
      check_date: check_date || new Date(),
      status: 'draft',
      results: JSON.stringify(results),
      production_quantity: production_quantity || 0,
      summary: JSON.stringify(summary),
      inspector_id: user.id,
      inspector_name: user.name,
      created_by: user.id
    });

    console.log('[Daily Draft] Saved:', { id: instance.id, moldId: mold_id, userId: user.id });

    return res.json({
      success: true,
      message: '임시저장이 완료되었습니다.',
      data: { id: instance.id }
    });
  } catch (error) {
    console.error('[Daily Draft] Error:', error);
    return res.status(500).json({
      success: false,
      message: '임시저장 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 일상점검 승인요청
 * POST /api/v1/checklist-instances/daily/request-approval
 */
router.post('/daily/request-approval', authenticate, async (req, res) => {
  try {
    const { mold_id, check_date, results, production_quantity, summary, approver_id } = req.body;
    const user = req.user;

    if (!approver_id) {
      return res.status(400).json({
        success: false,
        message: '승인자를 선택해주세요.'
      });
    }

    // 승인자 확인
    const approver = await User.findByPk(approver_id);
    if (!approver) {
      return res.status(404).json({
        success: false,
        message: '승인자를 찾을 수 없습니다.'
      });
    }

    const instance = await ChecklistInstance.create({
      mold_id,
      category: 'daily',
      check_date: check_date || new Date(),
      status: 'pending_approval',
      approver_id,
      results: JSON.stringify(results),
      production_quantity: production_quantity || 0,
      summary: JSON.stringify(summary),
      inspector_id: user.id,
      inspector_name: user.name,
      created_by: user.id,
      requested_at: new Date()
    });

    // 승인자에게 알림 전송
    try {
      await Notification.create({
        user_id: approver_id,
        type: 'inspection_approval',
        title: '일상점검 승인 요청',
        message: `${user.name}님이 일상점검 승인을 요청했습니다. (금형 ID: ${mold_id})`,
        priority: 'normal',
        is_read: false
      });
    } catch (notifErr) {
      console.error('[Daily Approval] Notification error:', notifErr);
    }

    console.log('[Daily Approval Request] Saved:', {
      id: instance.id,
      moldId: mold_id,
      userId: user.id,
      approverId: approver_id
    });

    return res.json({
      success: true,
      message: `${approver.name}님께 승인요청이 완료되었습니다.`,
      data: { id: instance.id }
    });
  } catch (error) {
    console.error('[Daily Approval Request] Error:', error);
    return res.status(500).json({
      success: false,
      message: '승인요청 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 점검 승인 처리
 * POST /api/v1/checklist-instances/:id/approve
 */
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const instance = await ChecklistInstance.findByPk(id);
    if (!instance) {
      return res.status(404).json({ success: false, message: '점검 기록을 찾을 수 없습니다.' });
    }

    if (instance.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: '승인 대기 상태가 아닙니다.' });
    }

    await instance.update({
      status: 'completed',
      approved_by: user.id,
      approved_at: new Date()
    });

    // 요청자에게 알림
    if (instance.inspector_id) {
      try {
        await Notification.create({
          user_id: instance.inspector_id,
          type: 'inspection_approved',
          title: '일상점검 승인 완료',
          message: `${user.name}님이 일상점검을 승인했습니다.`,
          priority: 'normal',
          is_read: false
        });
      } catch (notifErr) {
        console.error('[Approve] Notification error:', notifErr);
      }
    }

    return res.json({ success: true, message: '승인이 완료되었습니다.' });
  } catch (error) {
    console.error('[Approve Inspection] Error:', error);
    return res.status(500).json({ success: false, message: '승인 처리 중 오류가 발생했습니다.' });
  }
});

/**
 * 점검 반려 처리
 * POST /api/v1/checklist-instances/:id/reject
 */
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const instance = await ChecklistInstance.findByPk(id);
    if (!instance) {
      return res.status(404).json({ success: false, message: '점검 기록을 찾을 수 없습니다.' });
    }

    await instance.update({
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: new Date(),
      rejection_reason: reason
    });

    // 요청자에게 알림
    if (instance.inspector_id) {
      try {
        await Notification.create({
          user_id: instance.inspector_id,
          type: 'inspection_rejected',
          title: '일상점검 반려',
          message: `${user.name}님이 일상점검을 반려했습니다. 사유: ${reason || '없음'}`,
          priority: 'high',
          is_read: false
        });
      } catch (notifErr) {
        console.error('[Reject] Notification error:', notifErr);
      }
    }

    return res.json({ success: true, message: '반려 처리가 완료되었습니다.' });
  } catch (error) {
    console.error('[Reject Inspection] Error:', error);
    return res.status(500).json({ success: false, message: '반려 처리 중 오류가 발생했습니다.' });
  }
});

/**
 * 금형별 점검 현황 조회 (최근 일상/정기 점검 상태)
 * GET /api/v1/checklist-instances/mold/:moldId/status
 */
router.get('/mold/:moldId/status', async (req, res) => {
  try {
    const { moldId } = req.params;

    // 일상점검 최근 기록
    const [dailyRows] = await sequelize.query(`
      SELECT id, status, inspector_name, check_date, created_at, approver_id,
             summary, requested_at, approved_at, rejected_at, rejection_reason
      FROM checklist_instances
      WHERE mold_id = :moldId AND category = 'daily'
      ORDER BY created_at DESC
      LIMIT 5
    `, { replacements: { moldId } });

    // 정기점검 최근 기록
    const [periodicRows] = await sequelize.query(`
      SELECT id, status, inspector_name, check_date, created_at, approver_id,
             summary, requested_at, approved_at, rejected_at, rejection_reason
      FROM checklist_instances
      WHERE mold_id = :moldId AND category = 'periodic'
      ORDER BY created_at DESC
      LIMIT 5
    `, { replacements: { moldId } });

    const statusLabel = (s) => ({
      'draft': '임시저장',
      'pending_approval': '승인대기',
      'completed': '완료',
      'rejected': '반려',
      'in_progress': '진행중'
    }[s] || s || '없음');

    const mapRow = (r) => ({
      id: r.id,
      status: r.status,
      statusLabel: statusLabel(r.status),
      inspectorName: r.inspector_name,
      checkDate: r.check_date,
      createdAt: r.created_at,
      requestedAt: r.requested_at,
      approvedAt: r.approved_at,
      rejectedAt: r.rejected_at,
      rejectionReason: r.rejection_reason
    });

    return res.json({
      success: true,
      data: {
        daily: {
          latest: dailyRows.length > 0 ? mapRow(dailyRows[0]) : null,
          count: dailyRows.length,
          history: dailyRows.map(mapRow)
        },
        periodic: {
          latest: periodicRows.length > 0 ? mapRow(periodicRows[0]) : null,
          count: periodicRows.length,
          history: periodicRows.map(mapRow)
        }
      }
    });
  } catch (error) {
    console.error('[Mold Inspection Status] Error:', error);
    return res.status(500).json({
      success: false,
      message: '점검 현황 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
