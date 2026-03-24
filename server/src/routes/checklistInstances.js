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

    // 기존 draft가 있으면 업데이트, 없으면 생성 (UPSERT)
    const [existing] = await sequelize.query(`
      SELECT id FROM checklist_instances
      WHERE mold_id = :mold_id AND category = 'daily' AND status = 'draft' AND inspector_id = :user_id
      ORDER BY id DESC LIMIT 1
    `, { replacements: { mold_id, user_id: user.id } });

    let instance;
    if (existing.length > 0) {
      await ChecklistInstance.update({
        results,
        production_quantity: production_quantity || 0,
        summary,
        check_date: check_date || new Date()
      }, { where: { id: existing[0].id } });
      instance = { id: existing[0].id };
    } else {
      instance = await ChecklistInstance.create({
        mold_id,
        category: 'daily',
        check_date: check_date || new Date(),
        status: 'draft',
        results,
        production_quantity: production_quantity || 0,
        summary,
        inspector_id: user.id,
        inspector_name: user.name,
        created_by: user.id
      });
    }

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

    // 기존 draft 삭제 + 새 인스턴스 생성을 트랜잭션으로 묶음
    const transaction = await sequelize.transaction();
    let instance;
    try {
      await sequelize.query(`
        DELETE FROM checklist_instances
        WHERE mold_id = :mold_id AND category = 'daily' AND status = 'draft' AND inspector_id = :user_id
      `, { replacements: { mold_id, user_id: user.id }, transaction });

      instance = await ChecklistInstance.create({
        mold_id,
        category: 'daily',
        check_date: check_date || new Date(),
        status: 'pending_approval',
        approver_id,
        results,
        production_quantity: production_quantity || 0,
        summary,
        inspector_id: user.id,
        inspector_name: user.name,
        created_by: user.id,
        requested_at: new Date()
      }, { transaction });

      await transaction.commit();
    } catch (txError) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw txError;
    }

    // 승인자에게 알림 전송 (트랜잭션 커밋 후 비핵심 작업)
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
 * 일상점검 완료 (승인 없이 바로 완료)
 * POST /api/v1/checklist-instances/daily/complete
 */
router.post('/daily/complete', authenticate, async (req, res) => {
  try {
    const { mold_id, check_date, results, production_quantity, summary } = req.body;
    const user = req.user;

    // 기존 draft 삭제 + 새 인스턴스 생성을 트랜잭션으로 묶음
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(`
        DELETE FROM checklist_instances
        WHERE mold_id = :mold_id AND category = 'daily' AND status = 'draft' AND inspector_id = :user_id
      `, { replacements: { mold_id, user_id: user.id }, transaction });

      const instance = await ChecklistInstance.create({
        mold_id,
        category: 'daily',
        check_date: check_date || new Date(),
        status: 'completed',
        results,
        production_quantity: production_quantity || 0,
        summary,
        inspector_id: user.id,
        inspector_name: user.name,
        created_by: user.id,
        approved_at: new Date()
      }, { transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: '일상점검이 완료되었습니다.',
        data: { id: instance.id }
      });
    } catch (txError) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw txError;
    }
  } catch (error) {
    console.error('[Daily Complete] Error:', error);
    return res.status(500).json({
      success: false,
      message: '점검 완료 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 금형 체크리스트 임시저장
 * POST /api/v1/checklist-instances/mold-checklist/draft
 */
router.post('/mold-checklist/draft', authenticate, async (req, res) => {
  try {
    const { mold_id, results, summary } = req.body;
    const user = req.user;

    // 기존 draft가 있으면 업데이트, 없으면 생성
    const [existing] = await sequelize.query(`
      SELECT id FROM checklist_instances
      WHERE mold_id = :mold_id AND category = 'mold_checklist' AND status = 'draft' AND inspector_id = :user_id
      ORDER BY id DESC LIMIT 1
    `, { replacements: { mold_id, user_id: user.id } });

    let instance;
    if (existing.length > 0) {
      await ChecklistInstance.update({
        results,
        summary,
        check_date: new Date()
      }, { where: { id: existing[0].id } });
      instance = { id: existing[0].id };
    } else {
      instance = await ChecklistInstance.create({
        mold_id,
        category: 'mold_checklist',
        check_date: new Date(),
        status: 'draft',
        results,
        summary,
        inspector_id: user.id,
        inspector_name: user.name,
        created_by: user.id
      });
    }

    return res.json({ success: true, message: '임시저장이 완료되었습니다.', data: { id: instance.id } });
  } catch (error) {
    console.error('[MoldChecklist Draft] Error:', error);
    return res.status(500).json({ success: false, message: '임시저장 중 오류가 발생했습니다.' });
  }
});

/**
 * 금형 체크리스트 승인요청
 * POST /api/v1/checklist-instances/mold-checklist/request-approval
 */
router.post('/mold-checklist/request-approval', authenticate, async (req, res) => {
  try {
    const { mold_id, results, summary, approver_id } = req.body;
    const user = req.user;

    if (!approver_id) {
      return res.status(400).json({ success: false, message: '승인자를 선택해주세요.' });
    }

    const approver = await User.findByPk(approver_id);
    if (!approver) {
      return res.status(404).json({ success: false, message: '승인자를 찾을 수 없습니다.' });
    }

    // 기존 draft 삭제
    await sequelize.query(`
      DELETE FROM checklist_instances
      WHERE mold_id = :mold_id AND category = 'mold_checklist' AND status = 'draft' AND inspector_id = :user_id
    `, { replacements: { mold_id, user_id: user.id } });

    const instance = await ChecklistInstance.create({
      mold_id,
      category: 'mold_checklist',
      check_date: new Date(),
      status: 'pending_approval',
      approver_id,
      results,
      summary,
      inspector_id: user.id,
      inspector_name: user.name,
      created_by: user.id,
      requested_at: new Date()
    });

    try {
      await Notification.create({
        user_id: approver_id,
        type: 'inspection_approval',
        title: '금형 체크리스트 승인 요청',
        message: `${user.name}님이 금형 체크리스트 승인을 요청했습니다. (금형 ID: ${mold_id})`,
        priority: 'normal',
        is_read: false
      });
    } catch (notifErr) {
      console.error('[MoldChecklist Approval] Notification error:', notifErr);
    }

    return res.json({
      success: true,
      message: `${approver.name}님께 승인요청이 완료되었습니다.`,
      data: { id: instance.id }
    });
  } catch (error) {
    console.error('[MoldChecklist Approval] Error:', error);
    return res.status(500).json({ success: false, message: '승인요청 중 오류가 발생했습니다.' });
  }
});

/**
 * 금형 체크리스트 완료 (승인 없이 바로 완료)
 * POST /api/v1/checklist-instances/mold-checklist/complete
 */
router.post('/mold-checklist/complete', authenticate, async (req, res) => {
  try {
    const { mold_id, results, summary } = req.body;
    const user = req.user;

    // 기존 draft 삭제
    await sequelize.query(`
      DELETE FROM checklist_instances
      WHERE mold_id = :mold_id AND category = 'mold_checklist' AND status = 'draft' AND inspector_id = :user_id
    `, { replacements: { mold_id, user_id: user.id } });

    const instance = await ChecklistInstance.create({
      mold_id,
      category: 'mold_checklist',
      check_date: new Date(),
      status: 'completed',
      results,
      summary,
      inspector_id: user.id,
      inspector_name: user.name,
      created_by: user.id,
      approved_at: new Date()
    });

    return res.json({ success: true, message: '금형 체크리스트가 완료되었습니다.', data: { id: instance.id } });
  } catch (error) {
    console.error('[MoldChecklist Complete] Error:', error);
    return res.status(500).json({ success: false, message: '완료 처리 중 오류가 발생했습니다.' });
  }
});

/**
 * 정기점검 임시저장 (UPSERT)
 * POST /api/v1/checklist-instances/periodic/draft
 */
router.post('/periodic/draft', authenticate, async (req, res) => {
  try {
    const { mold_id, check_date, results, production_quantity, summary } = req.body;
    const user = req.user;

    const [existing] = await sequelize.query(`
      SELECT id FROM checklist_instances
      WHERE mold_id = :mold_id AND category = 'periodic' AND status = 'draft' AND inspector_id = :user_id
      ORDER BY id DESC LIMIT 1
    `, { replacements: { mold_id, user_id: user.id } });

    let instance;
    if (existing.length > 0) {
      await ChecklistInstance.update({
        results,
        production_quantity: production_quantity || 0,
        summary,
        check_date: check_date || new Date()
      }, { where: { id: existing[0].id } });
      instance = { id: existing[0].id };
    } else {
      instance = await ChecklistInstance.create({
        mold_id,
        category: 'periodic',
        check_date: check_date || new Date(),
        status: 'draft',
        results,
        production_quantity: production_quantity || 0,
        summary,
        inspector_id: user.id,
        inspector_name: user.name,
        created_by: user.id
      });
    }

    return res.json({ success: true, message: '임시저장이 완료되었습니다.', data: { id: instance.id } });
  } catch (error) {
    console.error('[Periodic Draft] Error:', error);
    return res.status(500).json({ success: false, message: '임시저장 중 오류가 발생했습니다.' });
  }
});

/**
 * 정기점검 완료 (승인 없이 바로 완료)
 * POST /api/v1/checklist-instances/periodic/complete
 */
router.post('/periodic/complete', authenticate, async (req, res) => {
  try {
    const { mold_id, check_date, results, production_quantity, summary, inspection_type } = req.body;
    const user = req.user;

    // 기존 draft 삭제
    await sequelize.query(`
      DELETE FROM checklist_instances
      WHERE mold_id = :mold_id AND category = 'periodic' AND status = 'draft' AND inspector_id = :user_id
    `, { replacements: { mold_id, user_id: user.id } });

    const instance = await ChecklistInstance.create({
      mold_id,
      category: 'periodic',
      check_date: check_date || new Date(),
      status: 'completed',
      results,
      production_quantity: production_quantity || 0,
      summary: { ...summary, inspection_type },
      inspector_id: user.id,
      inspector_name: user.name,
      created_by: user.id,
      approved_at: new Date()
    });

    console.log('[Periodic Complete] Saved:', { id: instance.id, moldId: mold_id, userId: user.id });

    return res.json({
      success: true,
      message: '정기점검이 완료되었습니다.',
      data: { id: instance.id }
    });
  } catch (error) {
    console.error('[Periodic Complete] Error:', error);
    return res.status(500).json({
      success: false,
      message: '정기점검 완료 처리 중 오류가 발생했습니다.'
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
      SELECT id, status, inspector_name, check_date, approver_id,
             summary, requested_at, approved_at, rejected_at, rejection_reason
      FROM checklist_instances
      WHERE mold_id = :moldId AND category = 'daily'
      ORDER BY id DESC
      LIMIT 5
    `, { replacements: { moldId } });

    // 정기점검 최근 기록
    const [periodicRows] = await sequelize.query(`
      SELECT id, status, inspector_name, check_date, approver_id,
             summary, requested_at, approved_at, rejected_at, rejection_reason
      FROM checklist_instances
      WHERE mold_id = :moldId AND category = 'periodic'
      ORDER BY id DESC
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
      createdAt: r.check_date,
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

/**
 * 점검 인스턴스 상세 조회
 * GET /api/v1/checklist-instances/:id
 * 주의: /mold/:moldId/status 뒤에 위치해야 라우트 충돌 방지
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await sequelize.query(`
      SELECT ci.*, u1.name as inspector_display_name, u2.name as approver_display_name
      FROM checklist_instances ci
      LEFT JOIN users u1 ON ci.inspector_id = u1.id
      LEFT JOIN users u2 ON ci.approver_id = u2.id
      WHERE ci.id = :id
    `, { replacements: { id } });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '점검 기록을 찾을 수 없습니다.' });
    }

    const instance = rows[0];
    if (typeof instance.results === 'string') {
      try { instance.results = JSON.parse(instance.results); } catch (e) { /* keep string */ }
    }
    if (typeof instance.summary === 'string') {
      try { instance.summary = JSON.parse(instance.summary); } catch (e) { /* keep string */ }
    }

    return res.json({ success: true, data: instance });
  } catch (error) {
    console.error('[ChecklistInstance Detail] Error:', error);
    return res.status(500).json({ success: false, message: '점검 기록 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
