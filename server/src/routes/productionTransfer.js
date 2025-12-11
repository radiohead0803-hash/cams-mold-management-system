const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  ProductionTransferChecklistMaster,
  ProductionTransferRequest,
  ProductionTransferChecklistItem,
  ProductionTransferApproval,
  Mold,
  MoldSpecification,
  MakerSpecification,
  User,
  sequelize
} = require('../models/newIndex');

// ==================== 체크리스트 마스터 API ====================

// 체크리스트 마스터 목록 조회
router.get('/checklist-master', async (req, res) => {
  try {
    const { category, is_active } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const items = await ProductionTransferChecklistMaster.findAll({
      where,
      order: [['category', 'ASC'], ['display_order', 'ASC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });

    // 카테고리별 그룹핑
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        items,
        grouped,
        total: items.length
      }
    });
  } catch (error) {
    console.error('체크리스트 마스터 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '체크리스트 마스터 조회 중 오류가 발생했습니다.' }
    });
  }
});

// 체크리스트 마스터 항목 추가
router.post('/checklist-master', async (req, res) => {
  try {
    const item = await ProductionTransferChecklistMaster.create({
      ...req.body,
      created_by: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('체크리스트 마스터 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '체크리스트 마스터 추가 중 오류가 발생했습니다.' }
    });
  }
});

// 체크리스트 마스터 항목 수정
router.put('/checklist-master/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ProductionTransferChecklistMaster.findByPk(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: '항목을 찾을 수 없습니다.' }
      });
    }

    await item.update(req.body);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('체크리스트 마스터 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '체크리스트 마스터 수정 중 오류가 발생했습니다.' }
    });
  }
});

// ==================== 양산이관 신청 API ====================

// 양산이관 신청 목록 조회
router.get('/requests', async (req, res) => {
  try {
    const { status, from_maker_id, to_plant_id, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (from_maker_id) where.from_maker_id = from_maker_id;
    if (to_plant_id) where.to_plant_id = to_plant_id;

    const offset = (page - 1) * limit;

    const { count, rows } = await ProductionTransferRequest.findAndCountAll({
      where,
      include: [
        { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name'] },
        { model: MoldSpecification, as: 'moldSpecification', attributes: ['id', 'part_number', 'part_name'] },
        { model: User, as: 'fromMaker', attributes: ['id', 'name', 'company_name'] },
        { model: User, as: 'toPlant', attributes: ['id', 'name', 'company_name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        requests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('양산이관 신청 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 신청 목록 조회 중 오류가 발생했습니다.' }
    });
  }
});

// 양산이관 신청 상세 조회
router.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ProductionTransferRequest.findByPk(id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: MoldSpecification, as: 'moldSpecification' },
        { model: User, as: 'fromMaker', attributes: ['id', 'name', 'company_name'] },
        { model: User, as: 'toPlant', attributes: ['id', 'name', 'company_name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        {
          model: ProductionTransferChecklistItem,
          as: 'checklistItems',
          include: [{
            model: ProductionTransferChecklistMaster,
            as: 'masterItem'
          }, {
            model: User,
            as: 'checker',
            attributes: ['id', 'name']
          }]
        },
        {
          model: ProductionTransferApproval,
          as: 'approvals',
          include: [{
            model: User,
            as: 'approver',
            attributes: ['id', 'name']
          }],
          order: [['action_at', 'DESC']]
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { message: '양산이관 신청을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('양산이관 신청 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 신청 상세 조회 중 오류가 발생했습니다.' }
    });
  }
});

// 양산이관 신청 생성
router.post('/requests', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { mold_id, mold_spec_id, to_plant_id, planned_transfer_date, notes } = req.body;

    // 신청번호 자동 생성
    const request_number = await ProductionTransferRequest.generateRequestNumber();

    // 신청 생성
    const request = await ProductionTransferRequest.create({
      request_number,
      mold_id,
      mold_spec_id,
      from_maker_id: req.user?.id,
      to_plant_id,
      requested_date: new Date(),
      planned_transfer_date,
      status: 'draft',
      notes,
      created_by: req.user?.id
    }, { transaction });

    // 체크리스트 마스터에서 활성화된 항목 가져와서 체크리스트 항목 생성
    const masterItems = await ProductionTransferChecklistMaster.findAll({
      where: { is_active: true },
      order: [['category', 'ASC'], ['display_order', 'ASC']]
    });

    const checklistItems = masterItems.map(master => ({
      transfer_request_id: request.id,
      master_item_id: master.id,
      is_checked: false
    }));

    await ProductionTransferChecklistItem.bulkCreate(checklistItems, { transaction });

    // 승인 이력 추가 (신청)
    await ProductionTransferApproval.create({
      transfer_request_id: request.id,
      approval_type: 'submit',
      approver_id: req.user?.id,
      approver_name: req.user?.name,
      decision: 'pending',
      comments: '양산이관 신청'
    }, { transaction });

    await transaction.commit();

    // 생성된 신청 조회
    const createdRequest = await ProductionTransferRequest.findByPk(request.id, {
      include: [
        { model: Mold, as: 'mold' },
        { model: ProductionTransferChecklistItem, as: 'checklistItems' }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdRequest,
      message: '양산이관 신청이 생성되었습니다.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('양산이관 신청 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 신청 생성 중 오류가 발생했습니다.' }
    });
  }
});

// 체크리스트 항목 업데이트
router.put('/requests/:requestId/checklist/:itemId', async (req, res) => {
  try {
    const { requestId, itemId } = req.params;
    const { is_checked, check_result, check_value, remarks, attachment_url, attachment_filename } = req.body;

    const item = await ProductionTransferChecklistItem.findOne({
      where: {
        id: itemId,
        transfer_request_id: requestId
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: '체크리스트 항목을 찾을 수 없습니다.' }
      });
    }

    await item.update({
      is_checked,
      check_result,
      check_value,
      remarks,
      attachment_url,
      attachment_filename,
      checked_by: req.user?.id,
      checked_at: is_checked ? new Date() : null
    });

    // 신청 상태 업데이트 (체크리스트 작성중)
    const request = await ProductionTransferRequest.findByPk(requestId);
    if (request && request.status === 'draft') {
      await request.update({ status: 'checklist_in_progress' });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('체크리스트 항목 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '체크리스트 항목 업데이트 중 오류가 발생했습니다.' }
    });
  }
});

// 승인 요청
router.post('/requests/:id/submit', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const request = await ProductionTransferRequest.findByPk(id, {
      include: [{
        model: ProductionTransferChecklistItem,
        as: 'checklistItems',
        include: [{
          model: ProductionTransferChecklistMaster,
          as: 'masterItem'
        }]
      }]
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '양산이관 신청을 찾을 수 없습니다.' }
      });
    }

    // 필수 항목 체크 확인
    const requiredItems = request.checklistItems.filter(item => item.masterItem.is_required);
    const uncheckedRequired = requiredItems.filter(item => !item.is_checked);

    if (uncheckedRequired.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { 
          message: '필수 체크리스트 항목을 모두 완료해주세요.',
          uncheckedItems: uncheckedRequired.map(item => item.masterItem.item_name)
        }
      });
    }

    // 상태 업데이트
    await request.update({ status: 'pending_approval' }, { transaction });

    // 승인 이력 추가
    await ProductionTransferApproval.create({
      transfer_request_id: id,
      approval_type: 'submit',
      approver_id: req.user?.id,
      approver_name: req.user?.name,
      decision: 'pending',
      comments: '승인 요청'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '승인 요청이 완료되었습니다.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('승인 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 요청 중 오류가 발생했습니다.' }
    });
  }
});

// 승인 처리
router.post('/requests/:id/approve', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const request = await ProductionTransferRequest.findByPk(id, {
      include: [
        { model: MoldSpecification, as: 'moldSpecification' }
      ]
    });

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '양산이관 신청을 찾을 수 없습니다.' }
      });
    }

    if (request.status !== 'pending_approval') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '승인 대기 상태가 아닙니다.' }
      });
    }

    // 상태 업데이트
    await request.update({
      status: 'approved',
      approved_by: req.user?.id,
      approved_at: new Date()
    }, { transaction });

    // 승인 이력 추가
    await ProductionTransferApproval.create({
      transfer_request_id: id,
      approval_type: 'approve',
      approver_id: req.user?.id,
      approver_name: req.user?.name,
      approver_role: req.user?.user_type,
      decision: 'approved',
      comments
    }, { transaction });

    // 금형 사양의 진행단계를 '양산'으로 변경
    if (request.mold_spec_id) {
      await MoldSpecification.update(
        { development_stage: '양산' },
        { where: { id: request.mold_spec_id }, transaction }
      );

      // maker_specifications도 연동 업데이트
      await MakerSpecification.update(
        { development_stage: '양산' },
        { where: { specification_id: request.mold_spec_id }, transaction }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: '승인이 완료되었습니다. 진행단계가 양산으로 변경되었습니다.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('승인 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 처리 중 오류가 발생했습니다.' }
    });
  }
});

// 반려 처리
router.post('/requests/:id/reject', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { rejection_reason, comments } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        error: { message: '반려 사유를 입력해주세요.' }
      });
    }

    const request = await ProductionTransferRequest.findByPk(id);

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '양산이관 신청을 찾을 수 없습니다.' }
      });
    }

    // 상태 업데이트
    await request.update({
      status: 'rejected',
      rejection_reason
    }, { transaction });

    // 승인 이력 추가
    await ProductionTransferApproval.create({
      transfer_request_id: id,
      approval_type: 'reject',
      approver_id: req.user?.id,
      approver_name: req.user?.name,
      approver_role: req.user?.user_type,
      decision: 'rejected',
      comments: comments || rejection_reason
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '반려 처리가 완료되었습니다.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('반려 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '반려 처리 중 오류가 발생했습니다.' }
    });
  }
});

// 이관 완료 처리
router.post('/requests/:id/complete', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const request = await ProductionTransferRequest.findByPk(id);

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: '양산이관 신청을 찾을 수 없습니다.' }
      });
    }

    if (request.status !== 'approved') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '승인 완료 상태가 아닙니다.' }
      });
    }

    // 상태 업데이트
    await request.update({
      status: 'transferred',
      actual_transfer_date: new Date()
    }, { transaction });

    // 승인 이력 추가
    await ProductionTransferApproval.create({
      transfer_request_id: id,
      approval_type: 'complete',
      approver_id: req.user?.id,
      approver_name: req.user?.name,
      decision: 'approved',
      comments: '이관 완료'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '이관이 완료되었습니다.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('이관 완료 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '이관 완료 처리 중 오류가 발생했습니다.' }
    });
  }
});

// 통계 조회
router.get('/statistics', async (req, res) => {
  try {
    const stats = await ProductionTransferRequest.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const statusMap = stats.reduce((acc, item) => {
      acc[item.status] = parseInt(item.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        draft: statusMap.draft || 0,
        checklist_in_progress: statusMap.checklist_in_progress || 0,
        pending_approval: statusMap.pending_approval || 0,
        approved: statusMap.approved || 0,
        rejected: statusMap.rejected || 0,
        transferred: statusMap.transferred || 0,
        cancelled: statusMap.cancelled || 0
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '통계 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
