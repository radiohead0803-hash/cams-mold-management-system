/**
 * 통합 승인함 컨트롤러
 */
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// 모델은 동적으로 로드
let Approval;

const initModel = (sequelize) => {
  if (!Approval) {
    Approval = require('../models/Approval')(sequelize);
  }
  return Approval;
};

/**
 * 승인 대기 목록 조회
 * GET /api/v1/approvals
 */
const getApprovals = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);
    
    const {
      type,           // 승인 유형 필터
      status = 'pending',  // 상태 필터 (기본: 대기중)
      priority,       // 우선순위 필터
      page = 1,
      limit = 20,
      sortBy = 'requested_at',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};
    
    if (type) {
      where.approval_type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ApprovalModel.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        approvals: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('승인 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 목록을 불러올 수 없습니다.' }
    });
  }
};

/**
 * 승인 대기 개수 조회 (유형별)
 * GET /api/v1/approvals/counts
 */
const getApprovalCounts = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);

    const counts = await ApprovalModel.findAll({
      attributes: [
        'approval_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status: 'pending' },
      group: ['approval_type']
    });

    const totalPending = await ApprovalModel.count({
      where: { status: 'pending' }
    });

    // 유형별 카운트를 객체로 변환
    const countsByType = {};
    counts.forEach(item => {
      countsByType[item.approval_type] = parseInt(item.dataValues.count);
    });

    res.json({
      success: true,
      data: {
        total: totalPending,
        byType: countsByType
      }
    });
  } catch (error) {
    logger.error('승인 개수 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 개수를 불러올 수 없습니다.' }
    });
  }
};

/**
 * 승인 상세 조회
 * GET /api/v1/approvals/:id
 */
const getApprovalById = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);
    const { id } = req.params;

    const approval = await ApprovalModel.findByPk(id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: { message: '승인 요청을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: approval
    });
  } catch (error) {
    logger.error('승인 상세 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 정보를 불러올 수 없습니다.' }
    });
  }
};

/**
 * 승인 요청 생성
 * POST /api/v1/approvals
 */
const createApproval = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);

    const {
      approval_type,
      target_id,
      target_table,
      title,
      description,
      priority = 'normal',
      due_date,
      mold_code,
      metadata
    } = req.body;

    // 요청자 정보
    const requester_id = req.user?.id || 1;
    const requester_name = req.user?.name || 'System';
    const requester_company = req.user?.company_name || '';

    const approval = await ApprovalModel.create({
      approval_type,
      target_id,
      target_table,
      title,
      description,
      requester_id,
      requester_name,
      requester_company,
      priority,
      due_date,
      mold_code,
      metadata
    });

    res.status(201).json({
      success: true,
      data: approval,
      message: '승인 요청이 생성되었습니다.'
    });
  } catch (error) {
    logger.error('승인 요청 생성 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 요청을 생성할 수 없습니다.' }
    });
  }
};

/**
 * 승인 처리
 * PATCH /api/v1/approvals/:id/approve
 */
const approveRequest = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);
    const { id } = req.params;
    const { comment } = req.body;

    const approval = await ApprovalModel.findByPk(id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: { message: '승인 요청을 찾을 수 없습니다.' }
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: '이미 처리된 승인 요청입니다.' }
      });
    }

    await approval.update({
      status: 'approved',
      approver_id: req.user?.id || 1,
      approver_name: req.user?.name || 'Admin',
      processed_at: new Date(),
      comment
    });

    res.json({
      success: true,
      data: approval,
      message: '승인 처리되었습니다.'
    });
  } catch (error) {
    logger.error('승인 처리 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 처리에 실패했습니다.' }
    });
  }
};

/**
 * 반려 처리
 * PATCH /api/v1/approvals/:id/reject
 */
const rejectRequest = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: { message: '반려 사유를 입력해주세요.' }
      });
    }

    const approval = await ApprovalModel.findByPk(id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: { message: '승인 요청을 찾을 수 없습니다.' }
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: '이미 처리된 승인 요청입니다.' }
      });
    }

    await approval.update({
      status: 'rejected',
      approver_id: req.user?.id || 1,
      approver_name: req.user?.name || 'Admin',
      processed_at: new Date(),
      comment
    });

    res.json({
      success: true,
      data: approval,
      message: '반려 처리되었습니다.'
    });
  } catch (error) {
    logger.error('반려 처리 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '반려 처리에 실패했습니다.' }
    });
  }
};

/**
 * 승인 요청 취소
 * DELETE /api/v1/approvals/:id
 */
const cancelApproval = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const ApprovalModel = initModel(sequelize);
    const { id } = req.params;

    const approval = await ApprovalModel.findByPk(id);

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: { message: '승인 요청을 찾을 수 없습니다.' }
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: '대기 중인 요청만 취소할 수 있습니다.' }
      });
    }

    await approval.update({
      status: 'cancelled'
    });

    res.json({
      success: true,
      message: '승인 요청이 취소되었습니다.'
    });
  } catch (error) {
    logger.error('승인 취소 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 취소에 실패했습니다.' }
    });
  }
};

module.exports = {
  getApprovals,
  getApprovalCounts,
  getApprovalById,
  createApproval,
  approveRequest,
  rejectRequest,
  cancelApproval
};
