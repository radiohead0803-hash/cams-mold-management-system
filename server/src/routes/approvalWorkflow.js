const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Company, RepairRequest, Notification, MoldSpecification, sequelize } = require('../models/newIndex');
const { authenticate } = require('../middleware/auth');

/**
 * 개발담당자 검색 (이름으로)
 * GET /api/v1/workflow/developers/search?name=홍길동
 */
router.get('/developers/search', async (req, res) => {
  try {
    const { name, limit = 10 } = req.query;

    const where = {
      user_type: 'mold_developer',
      is_active: true
    };

    if (name) {
      where.name = { [Op.iLike]: `%${name}%` };
    }

    const developers = await User.findAll({
      where,
      attributes: ['id', 'name', 'username', 'email', 'phone', 'company_name'],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      data: developers
    });
  } catch (error) {
    console.error('[Developer Search] Error:', error);
    return res.status(500).json({
      success: false,
      message: '개발담당자 검색 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 제작처(업체) 검색
 * GET /api/v1/workflow/makers/search?name=A제작소
 */
router.get('/makers/search', async (req, res) => {
  try {
    const { name, limit = 10 } = req.query;

    const where = {
      company_type: 'maker',
      is_active: true
    };

    if (name) {
      where.name = { [Op.iLike]: `%${name}%` };
    }

    const makers = await Company.findAll({
      where,
      attributes: ['id', 'name', 'code', 'address', 'phone', 'email'],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      data: makers
    });
  } catch (error) {
    console.error('[Maker Search] Error:', error);
    return res.status(500).json({
      success: false,
      message: '제작처 검색 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 생산처(업체) 검색
 * GET /api/v1/workflow/plants/search?name=생산공장
 */
router.get('/plants/search', async (req, res) => {
  try {
    const { name, limit = 10 } = req.query;

    const where = {
      company_type: 'plant',
      is_active: true
    };

    if (name) {
      where.name = { [Op.iLike]: `%${name}%` };
    }

    const plants = await Company.findAll({
      where,
      attributes: ['id', 'name', 'code', 'address', 'phone', 'email'],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    return res.json({
      success: true,
      data: plants
    });
  } catch (error) {
    console.error('[Plant Search] Error:', error);
    return res.status(500).json({
      success: false,
      message: '생산처 검색 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 알림 생성 헬퍼 함수
 */
const createNotification = async (params) => {
  const {
    userId,
    type,
    title,
    message,
    repairRequestId,
    workflowAction,
    priority = 'normal'
  } = params;

  try {
    await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      repair_request_id: repairRequestId,
      workflow_action: workflowAction,
      priority,
      is_read: false
    });
  } catch (error) {
    console.error('[Create Notification] Error:', error);
  }
};

/**
 * 수리요청 생성 (생산처)
 * POST /api/v1/workflow/repair-requests
 */
router.post('/repair-requests', authenticate, async (req, res) => {
  try {
    const {
      mold_id,
      mold_spec_id,
      title,
      description,
      issue_type,
      priority,
      developer_id,
      developer_name
    } = req.body;

    const user = req.user;

    // 수리요청 생성
    const repairRequest = await RepairRequest.create({
      mold_id: mold_id || mold_spec_id,
      mold_spec_id,
      title,
      description,
      issue_type,
      priority: priority || 'normal',
      status: 'requested',
      workflow_status: 'plant_requested',
      requester_id: user.id,
      requester_company_id: user.company_id,
      requested_by: user.id,
      requested_role: 'plant',
      requested_at: new Date(),
      developer_id,
      developer_name,
      plant_id: user.company_id
    });

    // 개발담당자에게 알림 전송
    if (developer_id) {
      await createNotification({
        userId: developer_id,
        type: 'repair_request',
        title: '수리요청 승인 필요',
        message: `[${title}] 수리요청이 접수되었습니다. 승인이 필요합니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'request',
        priority: priority === 'high' ? 'high' : 'normal'
      });
    }

    return res.json({
      success: true,
      message: '수리요청이 등록되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[Create Repair Request] Error:', error);
    return res.status(500).json({
      success: false,
      message: '수리요청 등록 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 1차 승인 (개발담당 → 제작처 배정)
 * POST /api/v1/workflow/repair-requests/:id/first-approve
 */
router.post('/repair-requests/:id/first-approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { maker_company_id, maker_company_name, notes } = req.body;
    const user = req.user;

    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    // 상태 업데이트
    await repairRequest.update({
      workflow_status: 'hq_approved',
      status: 'assigned',
      first_approved_by: user.id,
      first_approved_at: new Date(),
      first_approval_notes: notes,
      maker_company_id,
      maker_company_name,
      assigned_to_company_id: maker_company_id,
      assigned_by: user.id,
      assigned_at: new Date()
    });

    // 제작처 담당자에게 알림
    const makerUsers = await User.findAll({
      where: { company_id: maker_company_id, is_active: true }
    });

    for (const makerUser of makerUsers) {
      await createNotification({
        userId: makerUser.id,
        type: 'repair_assigned',
        title: '수리 작업 배정',
        message: `[${repairRequest.title}] 수리 작업이 배정되었습니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'assign',
        priority: repairRequest.priority === 'high' ? 'high' : 'normal'
      });
    }

    // 요청자(생산처)에게 승인 알림
    if (repairRequest.requester_id) {
      await createNotification({
        userId: repairRequest.requester_id,
        type: 'repair_approved',
        title: '수리요청 승인됨',
        message: `[${repairRequest.title}] 수리요청이 승인되어 제작처에 배정되었습니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'approve'
      });
    }

    return res.json({
      success: true,
      message: '1차 승인이 완료되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[First Approve] Error:', error);
    return res.status(500).json({
      success: false,
      message: '승인 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 제작처 수리 시작
 * POST /api/v1/workflow/repair-requests/:id/start-repair
 */
router.post('/repair-requests/:id/start-repair', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;

    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    await repairRequest.update({
      workflow_status: 'maker_in_progress',
      status: 'in_progress',
      maker_started_at: new Date(),
      started_at: new Date()
    });

    // 개발담당자에게 알림
    if (repairRequest.developer_id) {
      await createNotification({
        userId: repairRequest.developer_id,
        type: 'repair_started',
        title: '수리 작업 시작',
        message: `[${repairRequest.title}] 제작처에서 수리 작업을 시작했습니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'start'
      });
    }

    return res.json({
      success: true,
      message: '수리 작업이 시작되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[Start Repair] Error:', error);
    return res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 제작처 수리 완료
 * POST /api/v1/workflow/repair-requests/:id/complete-repair
 */
router.post('/repair-requests/:id/complete-repair', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, actual_cost } = req.body;
    const user = req.user;

    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    await repairRequest.update({
      workflow_status: 'maker_completed',
      status: 'done',
      maker_completed_at: new Date(),
      completed_at: new Date(),
      maker_notes: notes,
      actual_cost
    });

    // 개발담당자에게 최종 승인 요청 알림
    if (repairRequest.developer_id) {
      await createNotification({
        userId: repairRequest.developer_id,
        type: 'repair_completed',
        title: '수리 완료 - 최종 승인 필요',
        message: `[${repairRequest.title}] 제작처 수리가 완료되었습니다. 최종 승인이 필요합니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'complete',
        priority: 'high'
      });
    }

    return res.json({
      success: true,
      message: '수리 완료가 등록되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[Complete Repair] Error:', error);
    return res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 최종 승인 (개발담당)
 * POST /api/v1/workflow/repair-requests/:id/final-approve
 */
router.post('/repair-requests/:id/final-approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;

    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    await repairRequest.update({
      workflow_status: 'hq_final_approved',
      status: 'confirmed',
      final_approved_by: user.id,
      final_approved_at: new Date(),
      final_approval_notes: notes,
      confirmed_at: new Date(),
      confirmed_by: user.id
    });

    // 생산처에게 확인 요청 알림
    if (repairRequest.requester_id) {
      await createNotification({
        userId: repairRequest.requester_id,
        type: 'repair_final_approved',
        title: '수리 최종 승인 - 확인 필요',
        message: `[${repairRequest.title}] 수리가 최종 승인되었습니다. 생산처 확인이 필요합니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'final_approve',
        priority: 'high'
      });
    }

    return res.json({
      success: true,
      message: '최종 승인이 완료되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[Final Approve] Error:', error);
    return res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 생산처 확인
 * POST /api/v1/workflow/repair-requests/:id/plant-confirm
 */
router.post('/repair-requests/:id/plant-confirm', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;

    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    await repairRequest.update({
      workflow_status: 'plant_confirmed',
      status: 'closed',
      plant_confirmed_by: user.id,
      plant_confirmed_at: new Date(),
      plant_confirmation_notes: notes,
      closed_at: new Date()
    });

    // 관련자들에게 완료 알림
    const notifyUsers = [repairRequest.developer_id];
    
    // 제작처 담당자들
    if (repairRequest.maker_company_id) {
      const makerUsers = await User.findAll({
        where: { company_id: repairRequest.maker_company_id, is_active: true },
        attributes: ['id']
      });
      notifyUsers.push(...makerUsers.map(u => u.id));
    }

    for (const userId of notifyUsers.filter(Boolean)) {
      await createNotification({
        userId,
        type: 'repair_closed',
        title: '수리 프로세스 완료',
        message: `[${repairRequest.title}] 수리 프로세스가 완료되었습니다.`,
        repairRequestId: repairRequest.id,
        workflowAction: 'close'
      });
    }

    return res.json({
      success: true,
      message: '생산처 확인이 완료되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[Plant Confirm] Error:', error);
    return res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 반려
 * POST /api/v1/workflow/repair-requests/:id/reject
 */
router.post('/repair-requests/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const repairRequest = await RepairRequest.findByPk(id);
    if (!repairRequest) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    await repairRequest.update({
      workflow_status: 'rejected',
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: new Date(),
      rejection_reason: reason
    });

    // 요청자에게 반려 알림
    if (repairRequest.requester_id) {
      await createNotification({
        userId: repairRequest.requester_id,
        type: 'repair_rejected',
        title: '수리요청 반려',
        message: `[${repairRequest.title}] 수리요청이 반려되었습니다. 사유: ${reason}`,
        repairRequestId: repairRequest.id,
        workflowAction: 'reject',
        priority: 'high'
      });
    }

    return res.json({
      success: true,
      message: '반려 처리되었습니다.',
      data: repairRequest
    });
  } catch (error) {
    console.error('[Reject] Error:', error);
    return res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 워크플로우 상태별 수리요청 목록
 * GET /api/v1/workflow/repair-requests?status=plant_requested
 */
router.get('/repair-requests', async (req, res) => {
  try {
    const { workflow_status, developer_id, maker_company_id, plant_id, limit = 50 } = req.query;

    const where = {};
    if (workflow_status) where.workflow_status = workflow_status;
    if (developer_id) where.developer_id = developer_id;
    if (maker_company_id) where.maker_company_id = maker_company_id;
    if (plant_id) where.plant_id = plant_id;

    const requests = await RepairRequest.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    return res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('[List Workflow Requests] Error:', error);
    return res.status(500).json({
      success: false,
      message: '목록 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
