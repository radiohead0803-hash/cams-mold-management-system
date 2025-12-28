const { RepairRequest, Mold, User, Notification, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');
const { uploadImage } = require('../config/cloudinary');

// Cloudinary 환경변수 체크
const CLOUDINARY_ENABLED = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

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
      issue_type,
      issue_description,
      ng_type,
      severity,
      urgency,
      estimated_cost,
      session_id,
      // 협력사 작성항목
      problem,
      cause_and_reason,
      priority,
      problem_source,
      occurred_date,
      manager_name,
      requester_name,
      car_model,
      part_number,
      part_name,
      occurrence_type,
      production_site,
      production_manager,
      contact,
      production_shot,
      maker,
      operation_type,
      problem_type,
      repair_category,
      repair_cost,
      completion_date,
      temporary_action,
      root_cause_action,
      mold_arrival_date,
      repair_start_date,
      repair_end_date,
      stock_schedule_date,
      stock_quantity,
      stock_unit,
      stock_depletion_days,
      repair_company,
      repair_duration,
      management_type,
      sign_off_status,
      representative_part_number,
      order_company,
      related_files,
      // 생산처 담당자
      plant_manager_name,
      plant_manager_contact,
      // 캠스 담당자
      cams_manager_id,
      cams_manager_name,
      cams_manager_contact,
      // 수리처 선정
      repair_shop_type,
      repair_shop_selected_by,
      repair_shop_selected_date,
      repair_shop_approval_status,
      repair_shop_approved_by,
      repair_shop_approved_date,
      repair_shop_rejection_reason,
      // 귀책 협의
      liability_type,
      liability_ratio_maker,
      liability_ratio_plant,
      liability_reason,
      liability_decided_by,
      liability_decided_date
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

    // 2. 금형 조회 (연관 정보 포함)
    const mold = await Mold.findByPk(mold_id, { 
      transaction,
      include: [
        { model: User, as: 'maker', attributes: ['id', 'name', 'company_name'] },
        { model: User, as: 'plant', attributes: ['id', 'name', 'company_name'] }
      ]
    });
    
    if (!mold) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 2-1. 금형사양 조회 (mold_spec_id가 있는 경우)
    let moldSpec = null;
    if (mold_spec_id) {
      const MoldSpecification = require('../models/newIndex').MoldSpecification;
      moldSpec = await MoldSpecification.findByPk(mold_spec_id, { transaction });
    }

    // 3. 요청자 정보 조회
    const requester = await User.findByPk(userId);
    
    // 4. 금형정보에서 자동 연동 데이터 추출
    const autoLinkedData = {
      car_model: car_model || moldSpec?.car_model || mold.car_model || null,
      part_number: part_number || moldSpec?.part_number || null,
      part_name: part_name || moldSpec?.part_name || mold.part_name || null,
      maker: maker || mold.maker?.company_name || null,
      production_site: production_site || mold.plant?.company_name || null,
      production_shot: production_shot || mold.current_shots || null
    };

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
      requested_at: new Date(),
      // 새로운 협력사 작성항목 (금형정보 자동 연동 포함)
      problem: problem || null,
      cause_and_reason: cause_and_reason || null,
      priority: priority || '보통',
      problem_source: problem_source || null,
      occurred_date: occurred_date || null,
      manager_name: manager_name || null,
      requester_name: requester_name || requester?.name || null,
      // 금형정보 자동 연동 필드
      car_model: autoLinkedData.car_model,
      part_number: autoLinkedData.part_number,
      part_name: autoLinkedData.part_name,
      maker: autoLinkedData.maker,
      production_site: autoLinkedData.production_site,
      production_shot: autoLinkedData.production_shot,
      // 사용자 입력 필드
      occurrence_type: occurrence_type || '신규',
      production_manager: production_manager || null,
      contact: contact || null,
      operation_type: operation_type || '양산',
      problem_type: problem_type || null,
      repair_category: repair_category || null,
      repair_cost: repair_cost || null,
      completion_date: completion_date || null,
      temporary_action: temporary_action || null,
      root_cause_action: root_cause_action || null,
      mold_arrival_date: mold_arrival_date || null,
      repair_start_date: repair_start_date || null,
      repair_end_date: repair_end_date || null,
      stock_schedule_date: stock_schedule_date || null,
      stock_quantity: stock_quantity || null,
      stock_unit: stock_unit || 'EA',
      stock_depletion_days: stock_depletion_days || null,
      repair_company: repair_company || null,
      repair_duration: repair_duration || null,
      management_type: management_type || null,
      sign_off_status: sign_off_status || '제출되지 않음',
      representative_part_number: representative_part_number || null,
      order_company: order_company || null,
      related_files: related_files || [],
      // 생산처 담당자
      plant_manager_name: plant_manager_name || null,
      plant_manager_contact: plant_manager_contact || null,
      // 캠스 담당자
      cams_manager_id: cams_manager_id || null,
      cams_manager_name: cams_manager_name || null,
      cams_manager_contact: cams_manager_contact || null,
      // 수리처 선정
      repair_shop_type: repair_shop_type || null,
      repair_shop_selected_by: repair_shop_selected_by || null,
      repair_shop_selected_date: repair_shop_selected_date || null,
      repair_shop_approval_status: repair_shop_approval_status || '대기',
      repair_shop_approved_by: repair_shop_approved_by || null,
      repair_shop_approved_date: repair_shop_approved_date || null,
      repair_shop_rejection_reason: repair_shop_rejection_reason || null,
      // 귀책 협의
      liability_type: liability_type || null,
      liability_ratio_maker: liability_ratio_maker || null,
      liability_ratio_plant: liability_ratio_plant || null,
      liability_reason: liability_reason || null,
      liability_decided_by: liability_decided_by || null,
      liability_decided_date: liability_decided_date || null
    }, { transaction });

    // 6. 사진 첨부 파일 저장 - Cloudinary 지원
    if (files && files.length > 0) {
      const RepairRequestFile = require('../models/newIndex').RepairRequestFile;
      
      for (const file of files) {
        let filePath = file.path;
        
        // 이미지인 경우 Cloudinary 업로드 시도
        if (CLOUDINARY_ENABLED && file.buffer && file.mimetype?.startsWith('image/')) {
          try {
            const cloudinaryResult = await uploadImage(file.buffer, {
              folder: `cams-molds/repairs/${repairRequest.id}`,
              public_id: `photo_${Date.now()}`
            });
            filePath = cloudinaryResult.secure_url;
          } catch (cloudErr) {
            logger.warn('Cloudinary upload error for repair photo:', cloudErr.message);
          }
        }
        
        await RepairRequestFile.create({
          repair_request_id: repairRequest.id,
          file_path: filePath,
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

/**
 * 수리요청 수정 (협력사 작성항목 포함)
 */
const updateRepairRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    const repairRequest = await RepairRequest.findByPk(id);
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '수리요청을 찾을 수 없습니다.' }
      });
    }

    // 업데이트 가능한 필드 목록
    const allowedFields = [
      'title', 'description', 'issue_type', 'issue_description', 'severity', 'urgency',
      'problem', 'cause_and_reason', 'priority', 'problem_source', 'occurred_date',
      'manager_name', 'requester_name', 'car_model', 'part_number', 'part_name',
      'occurrence_type', 'production_site', 'production_manager', 'contact',
      'production_shot', 'maker', 'operation_type', 'problem_type', 'repair_category',
      'repair_cost', 'completion_date', 'temporary_action', 'root_cause_action',
      'mold_arrival_date', 'repair_start_date', 'repair_end_date',
      'stock_schedule_date', 'stock_quantity', 'stock_unit', 'stock_depletion_days',
      'repair_company', 'repair_duration', 'management_type', 'sign_off_status',
      'representative_part_number', 'order_company', 'related_files', 'status',
      // 생산처 담당자
      'plant_manager_name', 'plant_manager_contact',
      // 캠스 담당자
      'cams_manager_id', 'cams_manager_name', 'cams_manager_contact',
      // 수리처 선정
      'repair_shop_type', 'repair_shop_selected_by', 'repair_shop_selected_date',
      'repair_shop_approval_status', 'repair_shop_approved_by', 'repair_shop_approved_date',
      'repair_shop_rejection_reason',
      // 생산처 검수
      'plant_inspection_status', 'plant_inspection_result', 'plant_inspection_comment',
      'plant_inspection_by', 'plant_inspection_date', 'plant_inspection_rejection_reason',
      // 체크리스트 점검
      'checklist_result', 'checklist_comment', 'checklist_inspector', 'checklist_date', 'checklist_status',
      // 귀책 협의
      'liability_type', 'liability_ratio_maker', 'liability_ratio_plant',
      'liability_reason', 'liability_decided_by', 'liability_decided_date'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    await repairRequest.update(filteredData, { transaction });

    // 이력 기록
    try {
      const RepairRequestHistory = require('../models/newIndex').RepairRequestHistory;
      if (RepairRequestHistory) {
        await RepairRequestHistory.create({
          repair_request_id: id,
          user_id: userId,
          action: 'updated',
          notes: `수리요청 정보 수정`,
          created_at: new Date()
        }, { transaction });
      }
    } catch (e) {
      // 이력 테이블이 없어도 계속 진행
    }

    await transaction.commit();

    // 업데이트된 데이터 조회
    const updated = await RepairRequest.findByPk(id);

    logger.info(`Repair request ${id} updated by user ${userId}`);

    res.json({
      success: true,
      message: '수리요청이 수정되었습니다.',
      data: updated
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Update repair request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '수리요청 수정 실패', details: error.message }
    });
  }
};

/**
 * 1차 귀책 협의 (생산처 ↔ 제작처)
 */
const initiateFirstLiabilityNegotiation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      proposed_liability_type,
      proposed_ratio_maker,
      proposed_ratio_plant,
      proposal_reason,
      proposed_by_type // 'plant' or 'maker'
    } = req.body;
    const userId = req.user.id;

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

    // 1차 협의 시작
    await repairRequest.update({
      liability_negotiation_status: 'first_negotiation',
      first_proposal_type: proposed_liability_type,
      first_proposal_ratio_maker: proposed_ratio_maker || 0,
      first_proposal_ratio_plant: proposed_ratio_plant || 0,
      first_proposal_reason: proposal_reason,
      first_proposal_by: userId,
      first_proposal_by_type: proposed_by_type,
      first_proposal_date: new Date()
    }, { transaction });

    // 상대방에게 알림 생성
    const targetUserType = proposed_by_type === 'plant' ? 'maker' : 'plant';
    const targetUsers = await User.findAll({
      where: {
        user_type: targetUserType,
        is_active: true,
        ...(targetUserType === 'maker' && repairRequest.assigned_to_company_id 
          ? { company_id: repairRequest.assigned_to_company_id } 
          : {})
      }
    });

    for (const targetUser of targetUsers) {
      await Notification.create({
        user_id: targetUser.id,
        notification_type: 'liability_negotiation',
        title: `귀책 협의 요청 - ${repairRequest.request_number}`,
        message: `수리요청 ${repairRequest.request_number}에 대한 귀책 협의가 요청되었습니다.`,
        priority: 'high',
        related_type: 'repair_request',
        related_id: repairRequest.id,
        is_read: false
      }, { transaction });
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          liability_negotiation_status: 'first_negotiation',
          first_proposal_date: repairRequest.first_proposal_date
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Initiate first liability negotiation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to initiate liability negotiation' }
    });
  }
};

/**
 * 1차 귀책 협의 응답 (수락/거절)
 */
const respondFirstLiabilityNegotiation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      response, // 'accept' or 'reject'
      counter_proposal_type,
      counter_ratio_maker,
      counter_ratio_plant,
      counter_reason
    } = req.body;
    const userId = req.user.id;

    const repairRequest = await RepairRequest.findByPk(id, { transaction });
    
    if (!repairRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Repair request not found' }
      });
    }

    if (response === 'accept') {
      // 1차 협의 수락 - 귀책 확정
      await repairRequest.update({
        liability_negotiation_status: 'agreed',
        liability_type: repairRequest.first_proposal_type,
        liability_ratio_maker: repairRequest.first_proposal_ratio_maker,
        liability_ratio_plant: repairRequest.first_proposal_ratio_plant,
        liability_reason: repairRequest.first_proposal_reason,
        liability_decided_by: userId,
        liability_decided_date: new Date(),
        first_response: 'accepted',
        first_response_by: userId,
        first_response_date: new Date()
      }, { transaction });
    } else {
      // 1차 협의 거절 - 2차 협의로 이관
      await repairRequest.update({
        liability_negotiation_status: 'second_negotiation_required',
        first_response: 'rejected',
        first_response_by: userId,
        first_response_date: new Date(),
        counter_proposal_type,
        counter_ratio_maker: counter_ratio_maker || 0,
        counter_ratio_plant: counter_ratio_plant || 0,
        counter_reason
      }, { transaction });

      // 본사(금형개발 담당)에게 2차 협의 요청 알림
      const developers = await User.findAll({
        where: {
          user_type: 'mold_developer',
          is_active: true
        }
      });

      for (const developer of developers) {
        await Notification.create({
          user_id: developer.id,
          notification_type: 'liability_escalation',
          title: `2차 귀책 협의 필요 - ${repairRequest.request_number}`,
          message: `1차 귀책 협의가 합의되지 않아 본사 개입이 필요합니다.`,
          priority: 'critical',
          related_type: 'repair_request',
          related_id: repairRequest.id,
          is_read: false
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          liability_negotiation_status: repairRequest.liability_negotiation_status,
          first_response: response === 'accept' ? 'accepted' : 'rejected'
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Respond first liability negotiation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to respond to liability negotiation' }
    });
  }
};

/**
 * 2차 귀책 협의 (본사 개입)
 */
const finalizeSecondLiabilityNegotiation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      final_liability_type,
      final_ratio_maker,
      final_ratio_plant,
      final_reason,
      cost_allocation // { maker_cost, plant_cost, hq_cost }
    } = req.body;
    const userId = req.user.id;

    // 본사 권한 확인
    if (req.user.user_type !== 'mold_developer' && req.user.user_type !== 'system_admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: { message: '2차 귀책 협의는 본사 담당자만 가능합니다.' }
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

    // 2차 협의 확정
    await repairRequest.update({
      liability_negotiation_status: 'finalized',
      liability_type: final_liability_type,
      liability_ratio_maker: final_ratio_maker || 0,
      liability_ratio_plant: final_ratio_plant || 0,
      liability_reason: final_reason,
      liability_decided_by: userId,
      liability_decided_date: new Date(),
      second_decision_by: userId,
      second_decision_date: new Date(),
      cost_allocation_maker: cost_allocation?.maker_cost || 0,
      cost_allocation_plant: cost_allocation?.plant_cost || 0,
      cost_allocation_hq: cost_allocation?.hq_cost || 0
    }, { transaction });

    // 관련 당사자들에게 알림
    const notifyUserIds = [repairRequest.requester_id];
    if (repairRequest.assigned_to_company_id) {
      const makerUsers = await User.findAll({
        where: { company_id: repairRequest.assigned_to_company_id, is_active: true }
      });
      notifyUserIds.push(...makerUsers.map(u => u.id));
    }

    for (const notifyUserId of notifyUserIds) {
      if (notifyUserId) {
        await Notification.create({
          user_id: notifyUserId,
          notification_type: 'liability_finalized',
          title: `귀책 협의 확정 - ${repairRequest.request_number}`,
          message: `귀책 협의가 본사에 의해 확정되었습니다. 귀책: ${final_liability_type}`,
          priority: 'high',
          related_type: 'repair_request',
          related_id: repairRequest.id,
          is_read: false
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        repairRequest: {
          id: repairRequest.id,
          liability_negotiation_status: 'finalized',
          liability_type: final_liability_type,
          liability_ratio_maker: final_ratio_maker,
          liability_ratio_plant: final_ratio_plant,
          cost_allocation: cost_allocation
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Finalize second liability negotiation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to finalize liability negotiation' }
    });
  }
};

module.exports = {
  createRepairRequest,
  approveRepairRequest,
  rejectRepairRequest,
  assignRepairRequest,
  updateRepairProgress,
  updateBlameParty,
  updateRepairRequest,
  initiateFirstLiabilityNegotiation,
  respondFirstLiabilityNegotiation,
  finalizeSecondLiabilityNegotiation
};
