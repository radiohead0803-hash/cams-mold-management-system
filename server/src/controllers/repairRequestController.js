const {
  RepairRequest,
  RepairRequestItem,
  Mold,
  ChecklistInstance
} = require('../models/newIndex');

/**
 * 수리요청 목록 조회
 * GET /api/v1/repair-requests?plantId=3&status=requested
 */
async function listRepairRequests(req, res) {
  try {
    // 추후 JWT에서 plantId, role을 가져오도록
    const plantId = req.user?.plantId || req.query.plantId || null;
    const status = req.query.status; // optional

    const where = {};
    if (plantId) where.plant_id = plantId;
    if (status) where.status = status;

    const list = await RepairRequest.findAll({
      where,
      include: [
        { 
          model: Mold, 
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    console.log('[listRepairRequests] Found:', list.length);

    res.json({
      success: true,
      data: list
    });
  } catch (err) {
    console.error('[listRepairRequests] error:', err);
    res.status(500).json({ 
      success: false, 
      message: '수리요청 조회 실패' 
    });
  }
}

/**
 * 수리요청 상세 조회
 * GET /api/v1/repair-requests/:id
 */
async function getRepairRequestDetail(req, res) {
  try {
    const { id } = req.params;

    const rr = await RepairRequest.findByPk(id, {
      include: [
        { 
          model: Mold, 
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status']
        },
        {
          model: ChecklistInstance,
          as: 'checklist',
          attributes: ['id', 'category', 'inspected_at']
        },
        {
          model: RepairRequestItem,
          as: 'items'
        }
      ]
    });

    if (!rr) {
      return res.status(404).json({ 
        success: false, 
        message: '수리요청을 찾을 수 없습니다.' 
      });
    }

    console.log('[getRepairRequestDetail] Found:', {
      id: rr.id,
      itemCount: rr.items?.length || 0
    });

    res.json({ 
      success: true, 
      data: rr 
    });
  } catch (err) {
    console.error('[getRepairRequestDetail] error:', err);
    res.status(500).json({ 
      success: false, 
      message: '수리요청 상세 조회 실패' 
    });
  }
}

/**
 * 수리요청 상태 변경
 * PATCH /api/v1/repair-requests/:id/status
 */
async function updateRepairRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || null;
    const userRole = req.user?.role || 'production';

    const validStatuses = ['requested', 'accepted', 'in_progress', 'done', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태입니다.'
      });
    }

    const rr = await RepairRequest.findByPk(id, {
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name'] }
      ]
    });

    if (!rr) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    // 상태 전이 규칙 검증
    const currentStatus = rr.status;
    const nextStatus = status;

    const canTransition = (from, to) => {
      if (from === to) return true; // 같은 상태는 허용
      
      // requested → accepted, rejected
      if (from === 'requested' && ['accepted', 'rejected'].includes(to)) return true;
      
      // accepted → in_progress, rejected
      if (from === 'accepted' && ['in_progress', 'rejected'].includes(to)) return true;
      
      // in_progress → done, rejected
      if (from === 'in_progress' && ['done', 'rejected'].includes(to)) return true;
      
      return false;
    };

    if (!canTransition(currentStatus, nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `현재 상태(${currentStatus})에서 ${nextStatus}로 변경할 수 없습니다.`
      });
    }

    // 상태 업데이트
    await rr.update({ status: nextStatus });

    console.log('[updateRepairRequestStatus] Updated:', {
      id: rr.id,
      moldCode: rr.mold?.mold_code,
      oldStatus: currentStatus,
      newStatus: nextStatus,
      updatedBy: userId,
      userRole
    });

    // (선택) 상태 변경 알림 생성
    // if (rr.requested_by) {
    //   await createNotification({
    //     userId: rr.requested_by,
    //     type: 'repair_status',
    //     title: `수리요청 상태 변경: ${rr.mold?.mold_code}`,
    //     message: `수리요청이 '${currentStatus}' → '${nextStatus}' 로 변경되었습니다.`,
    //     moldId: rr.mold_id,
    //   });
    // }

    res.json({
      success: true,
      data: rr
    });
  } catch (err) {
    console.error('[updateRepairRequestStatus] error:', err);
    res.status(500).json({
      success: false,
      message: '상태 변경 실패'
    });
  }
}

/**
 * 수리요청 요약 (대시보드용)
 * GET /api/v1/repair-requests/summary
 */
async function getRepairSummary(req, res) {
  try {
    const plantId = req.user?.plantId || req.query.plantId || null;
    const where = {};
    if (plantId) where.plant_id = plantId;

    const statuses = ['requested', 'accepted', 'in_progress', 'done', 'rejected'];
    const counts = {};

    for (const status of statuses) {
      const w = { ...where, status };
      counts[status] = await RepairRequest.count({ where: w });
    }

    console.log('[getRepairSummary] Counts:', counts);

    res.json({
      success: true,
      data: counts
    });
  } catch (err) {
    console.error('[getRepairSummary] error:', err);
    res.status(500).json({
      success: false,
      message: '수리요청 요약 조회 실패'
    });
  }
}

module.exports = {
  listRepairRequests,
  getRepairRequestDetail,
  updateRepairRequestStatus,
  getRepairSummary
};
