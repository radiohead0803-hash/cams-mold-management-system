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

    const validStatuses = ['requested', 'accepted', 'in_progress', 'done', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상태입니다.'
      });
    }

    const rr = await RepairRequest.findByPk(id);
    if (!rr) {
      return res.status(404).json({
        success: false,
        message: '수리요청을 찾을 수 없습니다.'
      });
    }

    await rr.update({ status });

    console.log('[updateRepairRequestStatus] Updated:', {
      id: rr.id,
      oldStatus: rr.status,
      newStatus: status
    });

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

module.exports = {
  listRepairRequests,
  getRepairRequestDetail,
  updateRepairRequestStatus
};
