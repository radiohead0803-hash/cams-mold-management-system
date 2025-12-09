const { RepairRequest, Mold, User, Notification, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * Phase 3-1: 수리요청 생성
 */
const createRepairRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      mold_id,
      mold_spec_id,
      title,
      description,
      issue_type,           // 클라이언트에서 보내는 필드
      issue_description,    // 클라이언트에서 보내는 필드
      ng_type,
      severity,             // 클라이언트에서 보내는 필드 (low, medium, high, urgent)
      urgency,              // 'low', 'normal', 'high', 'urgent'
      estimated_cost,
      session_id
    } = req.body;
    const userId = req.user.id;
    const files = req.files;

    // 필드 매핑 (클라이언트 필드 → 백엔드 필드)
    const finalTitle = title || issue_type || 'Repair Request';
    const finalDescription = description || issue_description || '';
    const finalNgType = ng_type || issue_type;
    const finalUrgency = urgency || severity || 'normal';

    // 1. 필수 필드 검증
    if (!mold_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Mold ID is required' }
      });
    }

    // 2. 금형 조회
    const mold = await Mold.findByPk(mold_id, { transaction });
    
    if (!mold) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 3. 요청자 정보 조회
    const requester = await User.findByPk(userId);

    // 4. 수리요청 번호 생성 (RR-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await RepairRequest.count({
      where: {
        created_at: {
          [sequelize.Op.gte]: new Date(today.setHours(0, 0, 0, 0))
        }
      },
      transaction
    });
    const requestNumber = `RR-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    // 5. 수리요청 생성
    const repairRequest = await RepairRequest.create({
      request_number: requestNumber,
      mold_id,
      mold_spec_id: mold_spec_id || null,
      requester_id: userId,
      requester_company_id: requester?.company_id,
      title: finalTitle,
      description: finalDescription,
      issue_type: issue_type || null,
      issue_description: issue_description || finalDescription,
      ng_type: finalNgType,
      severity: severity || 'medium',
      urgency: finalUrgency,
      estimated_cost: estimated_cost || null,
      status: 'requested',
      requested_at: new Date()
    }, { transaction });

    // 6. 사진 첨부 파일 저장
    if (files && files.length > 0) {
      const RepairRequestFile = require('../models/newIndex').RepairRequestFile;
      
      for (const file of files) {
        await RepairRequestFile.create({
          repair_request_id: repairRequest.id,
          file_path: file.path,
          file_name: file.originalname,
          file_type: 'photo',
          file_size: file.size
        }, { transaction });
      }
    }

    // 7. 금형 상태 업데이트
    await mold.update({
      status: 'repair_requested',
      needs_repair: true
    }, { transaction });

    // 8. 본사(금형개발 담당)에게 알림 생성
    const developers = await User.findAll({
      where: {
        user_type: 'mold_developer',
        is_active: true
      }
    });

    for (const developer of developers) {
      await Notification.create({
        user_id: developer.id,
        notification_type: 'repair_request',
        title: `새로운 수리요청 - ${mold.mold_code}`,
        message: `${requester.company_name}에서 금형 ${mold.mold_code}에 대한 수리요청을 접수했습니다.`,
        priority: urgency === 'urgent' ? 'high' : 'normal',
        related_type: 'repair_request',
        related_id: repairRequest.id,
        action_url: `/hq/repair-requests/${repairRequest.id}`,
        is_read: false
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          request_number: requestNumber,
          mold_id: repairRequest.mold_id,
          title: repairRequest.title,
          status: repairRequest.status,
          urgency: repairRequest.urgency,
          requested_at: repairRequest.requested_at
        },
        mold: {
          id: mold.id,
          mold_code: mold.mold_code,
          status: mold.status
        },
        files_count: files ? files.length : 0
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Create repair request error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create repair request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Phase 3-2: 수리요청 승인
 */
const approveRepairRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const repairRequest = await RepairRequest.findByPk(id, { transaction });
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Repair request not found' }
      });
    }

    if (repairRequest.status !== 'requested') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Only requested repair requests can be approved' }
      });
    }

    // 수리요청 승인
    await repairRequest.update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date(),
      approval_notes: notes
    }, { transaction });

    // 이력 기록
    const RepairRequestHistory = require('../models/newIndex').RepairRequestHistory;
    await RepairRequestHistory.create({
      repair_request_id: id,
      user_id: userId,
      action: 'approved',
      notes,
      created_at: new Date()
    }, { transaction });

    // 요청자에게 알림
    await Notification.create({
      user_id: repairRequest.requester_id,
      notification_type: 'repair_approved',
      title: `수리요청 승인 - ${repairRequest.request_number}`,
      message: `수리요청이 승인되었습니다.`,
      priority: 'normal',
      related_type: 'repair_request',
      related_id: repairRequest.id,
      is_read: false
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          status: repairRequest.status,
          approved_at: repairRequest.approved_at
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Approve repair request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve repair request' }
    });
  }
};

/**
 * Phase 3-2: 수리요청 반려
 */
const rejectRepairRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Rejection reason is required' }
      });
    }

    const repairRequest = await RepairRequest.findByPk(id, {
      include: [{ model: Mold, as: 'mold' }],
      transaction
    });
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Repair request not found' }
      });
    }

    // 수리요청 반려
    await repairRequest.update({
      status: 'rejected',
      rejected_by: userId,
      rejected_at: new Date(),
      rejection_reason: reason
    }, { transaction });

    // 금형 상태 복원
    await repairRequest.mold.update({
      status: 'production',
      needs_repair: false
    }, { transaction });

    // 이력 기록
    const RepairRequestHistory = require('../models/newIndex').RepairRequestHistory;
    await RepairRequestHistory.create({
      repair_request_id: id,
      user_id: userId,
      action: 'rejected',
      notes: reason,
      created_at: new Date()
    }, { transaction });

    // 요청자에게 알림
    await Notification.create({
      user_id: repairRequest.requester_id,
      notification_type: 'repair_rejected',
      title: `수리요청 반려 - ${repairRequest.request_number}`,
      message: `수리요청이 반려되었습니다. 사유: ${reason}`,
      priority: 'high',
      related_type: 'repair_request',
      related_id: repairRequest.id,
      is_read: false
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          status: repairRequest.status,
          rejected_at: repairRequest.rejected_at,
          rejection_reason: repairRequest.rejection_reason
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Reject repair request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject repair request' }
    });
  }
};

/**
 * Phase 3-2: 제작처 배정
 */
const assignRepairRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { assigned_to_company_id, notes } = req.body;
    const userId = req.user.id;

    if (!assigned_to_company_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Assigned company ID is required' }
      });
    }

    const repairRequest = await RepairRequest.findByPk(id, { transaction });
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Repair request not found' }
      });
    }

    // 제작처 배정
    await repairRequest.update({
      status: 'assigned',
      assigned_to_company_id,
      assigned_by: userId,
      assigned_at: new Date(),
      assignment_notes: notes
    }, { transaction });

    // 이력 기록
    const RepairRequestHistory = require('../models/newIndex').RepairRequestHistory;
    await RepairRequestHistory.create({
      repair_request_id: id,
      user_id: userId,
      action: 'assigned',
      notes: `제작처 배정: ${assigned_to_company_id}`,
      created_at: new Date()
    }, { transaction });

    // 배정된 제작처의 사용자들에게 알림
    const makerUsers = await User.findAll({
      where: {
        company_id: assigned_to_company_id,
        user_type: 'maker',
        is_active: true
      }
    });

    for (const makerUser of makerUsers) {
      await Notification.create({
        user_id: makerUser.id,
        notification_type: 'repair_assigned',
        title: `수리 작업 배정 - ${repairRequest.request_number}`,
        message: `새로운 수리 작업이 배정되었습니다.`,
        priority: repairRequest.urgency === 'urgent' ? 'high' : 'normal',
        related_type: 'repair_request',
        related_id: repairRequest.id,
        action_url: `/maker/repair-requests/${repairRequest.id}`,
        is_read: false
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          status: repairRequest.status,
          assigned_to_company_id: repairRequest.assigned_to_company_id,
          assigned_at: repairRequest.assigned_at
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Assign repair request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to assign repair request' }
    });
  }
};

/**
 * Phase 3-3: 수리 진행 상태 업데이트
 */
const updateRepairProgress = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, progress_notes, estimated_completion_date } = req.body;
    const userId = req.user.id;

    const validStatuses = ['assigned', 'in_progress', 'done', 'confirmed', 'closed'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }
      });
    }

    const repairRequest = await RepairRequest.findByPk(id, {
      include: [{ model: Mold, as: 'mold' }],
      transaction
    });
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Repair request not found' }
      });
    }

    // 상태 업데이트
    const updateData = {
      status,
      progress_notes
    };

    if (status === 'in_progress' && !repairRequest.started_at) {
      updateData.started_at = new Date();
    }

    if (status === 'done' && !repairRequest.completed_at) {
      updateData.completed_at = new Date();
    }

    if (status === 'confirmed' && !repairRequest.confirmed_at) {
      updateData.confirmed_at = new Date();
      updateData.confirmed_by = userId;
    }

    if (status === 'closed' && !repairRequest.closed_at) {
      updateData.closed_at = new Date();
      // 금형 상태 복원
      await repairRequest.mold.update({
        status: 'production',
        needs_repair: false
      }, { transaction });
    }

    if (estimated_completion_date) {
      updateData.estimated_completion_date = estimated_completion_date;
    }

    await repairRequest.update(updateData, { transaction });

    // 이력 기록
    const RepairRequestHistory = require('../models/newIndex').RepairRequestHistory;
    await RepairRequestHistory.create({
      repair_request_id: id,
      user_id: userId,
      action: `status_changed_to_${status}`,
      notes: progress_notes,
      created_at: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          status: repairRequest.status,
          started_at: repairRequest.started_at,
          completed_at: repairRequest.completed_at,
          confirmed_at: repairRequest.confirmed_at,
          closed_at: repairRequest.closed_at
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Update repair progress error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update repair progress' }
    });
  }
};

/**
 * Phase 3-4: 귀책 당사자 업데이트
 */
const updateBlameParty = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { blame_party, blame_percentage, blame_reason } = req.body;
    const userId = req.user.id;

    const validBlameParties = ['maker', 'plant', 'hq', 'shared', 'other'];
    if (!validBlameParties.includes(blame_party)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: `Invalid blame party. Must be one of: ${validBlameParties.join(', ')}` }
      });
    }

    const repairRequest = await RepairRequest.findByPk(id, { transaction });
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Repair request not found' }
      });
    }

    // 귀책 정보 업데이트
    await repairRequest.update({
      blame_party,
      blame_percentage: blame_percentage || 100,
      blame_reason,
      blame_confirmed: true,
      blame_confirmed_by: userId,
      blame_confirmed_at: new Date()
    }, { transaction });

    // 이력 기록
    const RepairRequestHistory = require('../models/newIndex').RepairRequestHistory;
    await RepairRequestHistory.create({
      repair_request_id: id,
      user_id: userId,
      action: 'blame_updated',
      notes: `귀책: ${blame_party} (${blame_percentage || 100}%) - ${blame_reason}`,
      created_at: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          blame_party: repairRequest.blame_party,
          blame_percentage: repairRequest.blame_percentage,
          blame_confirmed: repairRequest.blame_confirmed,
          blame_confirmed_at: repairRequest.blame_confirmed_at
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Update blame party error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update blame party' }
    });
  }
};

module.exports = {
  createRepairRequest,
  approveRepairRequest,
  rejectRepairRequest,
  assignRepairRequest,
  updateRepairProgress,
  updateBlameParty
};
