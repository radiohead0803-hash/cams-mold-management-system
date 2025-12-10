const { Mold, DailyCheck, ChecklistAnswer, QrSession, User, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 점검 목록 조회
 */
const getInspections = async (req, res) => {
  try {
    const { type, status, mold_id, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (mold_id) where.mold_id = mold_id;
    
    let inspections = [];
    
    // 일상점검 조회
    if (!type || type === 'daily') {
      const dailyChecks = await DailyCheck.findAll({
        where,
        include: [
          { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name', 'car_model'] },
          { model: User, as: 'user', attributes: ['id', 'name', 'user_type'] },
          { model: User, as: 'approver', attributes: ['id', 'name', 'user_type'] }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });
      
      inspections = dailyChecks.map(check => ({
        ...check.toJSON(),
        inspection_type: 'daily',
        inspection_type_label: '일상점검'
      }));
    }
    
    // 정기점검 조회
    if (!type || type === 'periodic') {
      const PeriodicInspection = require('../models/newIndex').PeriodicInspection;
      if (PeriodicInspection) {
        const periodicChecks = await PeriodicInspection.findAll({
          where,
          include: [
            { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name', 'car_model'] },
            { model: User, as: 'user', attributes: ['id', 'name', 'user_type'] }
          ],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['created_at', 'DESC']]
        });
        
        const periodicData = periodicChecks.map(check => ({
          ...check.toJSON(),
          inspection_type: 'periodic',
          inspection_type_label: '정기점검'
        }));
        
        inspections = [...inspections, ...periodicData];
      }
    }
    
    // 날짜순 정렬
    inspections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      data: inspections.slice(0, parseInt(limit)),
      total: inspections.length
    });
  } catch (error) {
    logger.error('Get inspections error:', error);
    // 테이블이 없어도 빈 배열 반환
    res.json({
      success: true,
      data: [],
      total: 0
    });
  }
};

/**
 * 승인 대기 점검 목록 조회
 */
const getPendingInspections = async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    let inspections = [];
    
    // 일상점검 승인 대기
    if (!type || type === 'daily') {
      const dailyChecks = await DailyCheck.findAll({
        where: { status: 'pending_approval' },
        include: [
          { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name', 'car_model'] },
          { model: User, as: 'user', attributes: ['id', 'name', 'user_type'] }
        ],
        order: [['created_at', 'DESC']]
      });
      
      inspections = dailyChecks.map(check => ({
        ...check.toJSON(),
        inspection_type: 'daily',
        inspection_type_label: '일상점검'
      }));
    }
    
    // 정기점검 승인 대기
    if (!type || type === 'periodic') {
      const PeriodicInspection = require('../models/newIndex').PeriodicInspection;
      if (PeriodicInspection) {
        const periodicChecks = await PeriodicInspection.findAll({
          where: { status: 'pending_approval' },
          include: [
            { model: Mold, as: 'mold', attributes: ['id', 'mold_code', 'mold_name', 'car_model'] },
            { model: User, as: 'user', attributes: ['id', 'name', 'user_type'] }
          ],
          order: [['created_at', 'DESC']]
        });
        
        const periodicData = periodicChecks.map(check => ({
          ...check.toJSON(),
          inspection_type: 'periodic',
          inspection_type_label: '정기점검'
        }));
        
        inspections = [...inspections, ...periodicData];
      }
    }
    
    // 날짜순 정렬
    inspections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      data: inspections.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      total: inspections.length
    });
  } catch (error) {
    logger.error('Get pending inspections error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get pending inspections', details: error.message }
    });
  }
};

/**
 * 점검 상세 조회
 */
const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    
    let inspection = null;
    
    // 일상점검에서 먼저 조회
    if (!type || type === 'daily') {
      inspection = await DailyCheck.findByPk(id, {
        include: [
          { model: Mold, as: 'mold' },
          { model: User, as: 'user', attributes: ['id', 'name', 'user_type'] },
          { model: User, as: 'approver', attributes: ['id', 'name', 'user_type'] },
          { model: ChecklistAnswer, as: 'answers' }
        ]
      });
      
      if (inspection) {
        return res.json({
          success: true,
          data: {
            ...inspection.toJSON(),
            inspection_type: 'daily',
            inspection_type_label: '일상점검'
          }
        });
      }
    }
    
    // 정기점검에서 조회
    if (!type || type === 'periodic') {
      const PeriodicInspection = require('../models/newIndex').PeriodicInspection;
      if (PeriodicInspection) {
        inspection = await PeriodicInspection.findByPk(id, {
          include: [
            { model: Mold, as: 'mold' },
            { model: User, as: 'user', attributes: ['id', 'name', 'user_type'] },
            { model: ChecklistAnswer, as: 'answers' }
          ]
        });
        
        if (inspection) {
          return res.json({
            success: true,
            data: {
              ...inspection.toJSON(),
              inspection_type: 'periodic',
              inspection_type_label: '정기점검'
            }
          });
        }
      }
    }
    
    res.status(404).json({
      success: false,
      error: { message: 'Inspection not found' }
    });
  } catch (error) {
    logger.error('Get inspection by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get inspection', details: error.message }
    });
  }
};

/**
 * 점검 승인
 */
const approveInspection = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { type, comments } = req.body;
    const approverId = req.user.id;
    
    let inspection = null;
    
    // 일상점검 승인
    if (type === 'daily') {
      inspection = await DailyCheck.findByPk(id, { transaction });
      
      if (!inspection) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { message: 'Daily inspection not found' }
        });
      }
      
      await inspection.update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date(),
        approval_comments: comments
      }, { transaction });
    }
    
    // 정기점검 승인
    if (type === 'periodic') {
      const PeriodicInspection = require('../models/newIndex').PeriodicInspection;
      inspection = await PeriodicInspection.findByPk(id, { transaction });
      
      if (!inspection) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { message: 'Periodic inspection not found' }
        });
      }
      
      await inspection.update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date(),
        approval_comments: comments
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: {
        message: '점검이 승인되었습니다.',
        inspection_id: id,
        approved_at: new Date()
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Approve inspection error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve inspection', details: error.message }
    });
  }
};

/**
 * 점검 반려
 */
const rejectInspection = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { type, reason } = req.body;
    const approverId = req.user.id;
    
    if (!reason) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: '반려 사유를 입력해주세요.' }
      });
    }
    
    let inspection = null;
    
    // 일상점검 반려
    if (type === 'daily') {
      inspection = await DailyCheck.findByPk(id, { transaction });
      
      if (!inspection) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { message: 'Daily inspection not found' }
        });
      }
      
      await inspection.update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date(),
        rejection_reason: reason
      }, { transaction });
    }
    
    // 정기점검 반려
    if (type === 'periodic') {
      const PeriodicInspection = require('../models/newIndex').PeriodicInspection;
      inspection = await PeriodicInspection.findByPk(id, { transaction });
      
      if (!inspection) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: { message: 'Periodic inspection not found' }
        });
      }
      
      await inspection.update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date(),
        rejection_reason: reason
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: {
        message: '점검이 반려되었습니다.',
        inspection_id: id,
        rejected_at: new Date(),
        reason
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Reject inspection error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject inspection', details: error.message }
    });
  }
};

/**
 * 정기점검 제출
 */
const createPeriodicInspection = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      session_id, 
      mold_id, 
      inspection_type,  // '20K', '100K', '400K', '800K'
      checklist_items,
      notes,
      inspector_name,
      inspection_duration  // 점검 소요 시간 (분)
    } = req.body;
    const userId = req.user.id;

    // 1. 필수 필드 검증
    if (!mold_id || !inspection_type) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Mold ID and inspection type are required' }
      });
    }

    // 2. 점검 유형 검증
    const validTypes = ['20K', '100K', '400K', '800K'];
    if (!validTypes.includes(inspection_type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid inspection type. Must be one of: 20K, 100K, 400K, 800K' }
      });
    }

    // 3. 금형 조회
    const mold = await Mold.findByPk(mold_id, { transaction });
    
    if (!mold) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold not found' }
      });
    }

    // 4. 정기점검 기록 생성
    const PeriodicInspection = require('../models/newIndex').PeriodicInspection;
    
    const periodicInspection = await PeriodicInspection.create({
      mold_id,
      user_id: userId,
      session_id,
      inspection_type,
      inspector_name: inspector_name || req.user.name,
      inspection_duration: inspection_duration ? parseInt(inspection_duration) : null,
      notes,
      status: 'completed',
      inspected_at: new Date()
    }, { transaction });

    // 5. 체크리스트 항목 저장 및 NG 감지
    let hasNg = false;
    let hasCriticalNg = false;
    const ngItems = [];
    const criticalItems = [];

    if (checklist_items && Array.isArray(checklist_items)) {
      for (const item of checklist_items) {
        const answer = await ChecklistAnswer.create({
          periodic_inspection_id: periodicInspection.id,
          question_id: item.question_id,
          answer: item.answer,
          answer_type: item.answer_type || 'text',
          is_ng: item.is_ng || false,
          is_critical: item.is_critical || false,
          ng_reason: item.ng_reason,
          photo_url: item.photo_url,
          measured_value: item.measured_value,  // 측정값 (숫자형)
          spec_min: item.spec_min,  // 규격 최소값
          spec_max: item.spec_max   // 규격 최대값
        }, { transaction });

        if (item.is_ng) {
          hasNg = true;
          ngItems.push({
            question_id: item.question_id,
            answer_id: answer.id,
            ng_reason: item.ng_reason,
            is_critical: item.is_critical
          });

          if (item.is_critical) {
            hasCriticalNg = true;
            criticalItems.push({
              question_id: item.question_id,
              ng_reason: item.ng_reason
            });
          }
        }
      }
    }

    // 6. 금형 정기점검 이력 업데이트
    const updateData = {
      last_periodic_check_shot: mold.current_shot,
      last_periodic_check_date: new Date(),
      [`last_${inspection_type.toLowerCase()}_check_date`]: new Date()
    };

    // 정기점검 주기별 다음 점검 Shot 계산
    const intervalMap = {
      '20K': 20000,
      '100K': 100000,
      '400K': 400000,
      '800K': 800000
    };
    
    const interval = intervalMap[inspection_type];
    if (interval) {
      updateData.last_periodic_check_shot = mold.current_shot;
      // 다음 정기점검은 현재 shot + 해당 주기
    }

    await mold.update(updateData, { transaction });

    // 7. Critical NG 발생 시 금형 상태 변경 및 알림
    if (hasCriticalNg) {
      await mold.update({ 
        status: 'inspection_ng',
        needs_repair: true
      }, { transaction });

      // TODO: 자동 수리요청 생성 또는 알림 발송
      logger.warn(`Critical NG detected in periodic inspection for mold ${mold.mold_code}`);
    }

    // 8. QR 세션 종료
    if (session_id) {
      await QrSession.update(
        { 
          status: 'completed', 
          completed_at: new Date(),
          is_active: false
        },
        { 
          where: { session_token: session_id },
          transaction 
        }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        periodicInspection: {
          id: periodicInspection.id,
          mold_id: periodicInspection.mold_id,
          inspection_type: periodicInspection.inspection_type,
          has_ng: hasNg,
          has_critical_ng: hasCriticalNg,
          inspected_at: periodicInspection.inspected_at,
          inspector_name: periodicInspection.inspector_name,
          inspection_duration: periodicInspection.inspection_duration
        },
        mold: {
          current_shot: mold.current_shot,
          status: mold.status,
          needs_repair: mold.needs_repair,
          next_periodic_check_shot: mold.current_shot + interval
        },
        ng_items: ngItems,
        critical_items: criticalItems
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Create periodic inspection error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to create periodic inspection',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

const updateInspection = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { message: 'Update inspection - To be implemented' }
    });
  } catch (error) {
    logger.error('Update inspection error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update inspection' }
    });
  }
};

/**
 * 일상점검 제출
 */
const createDailyInspection = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      session_id, 
      mold_id, 
      production_quantity, 
      ng_quantity, 
      checklist_items,
      notes 
    } = req.body;
    const userId = req.user.id;

    // 1. 필수 필드 검증
    if (!mold_id || production_quantity === undefined) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Mold ID and production quantity are required' }
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

    // 3. 일상점검 기록 생성
    const dailyCheck = await DailyCheck.create({
      mold_id,
      user_id: userId,
      session_id,
      production_quantity: parseInt(production_quantity),
      ng_quantity: parseInt(ng_quantity || 0),
      notes,
      status: 'completed',
      checked_at: new Date()
    }, { transaction });

    // 4. 체크리스트 항목 저장 및 NG 감지
    let hasNg = false;
    const ngItems = [];

    if (checklist_items && Array.isArray(checklist_items)) {
      for (const item of checklist_items) {
        const answer = await ChecklistAnswer.create({
          daily_check_id: dailyCheck.id,
          question_id: item.question_id,
          answer: item.answer,
          answer_type: item.answer_type || 'text',
          is_ng: item.is_ng || false,
          ng_reason: item.ng_reason,
          photo_url: item.photo_url
        }, { transaction });

        if (item.is_ng) {
          hasNg = true;
          ngItems.push({
            question_id: item.question_id,
            answer_id: answer.id,
            ng_reason: item.ng_reason
          });
        }
      }
    }

    // 5. 금형 타수(shot) 업데이트
    const newCurrentShot = (mold.current_shot || 0) + parseInt(production_quantity);
    
    await mold.update({
      current_shot: newCurrentShot,
      last_daily_check_shot: newCurrentShot,
      last_daily_check_date: new Date(),
      total_shots: (mold.total_shots || 0) + parseInt(production_quantity)
    }, { transaction });

    // 6. 다음 점검일 계산
    const nextDailyCheckShot = mold.daily_check_interval 
      ? newCurrentShot + mold.daily_check_interval 
      : null;
    
    const nextPeriodicCheckShot = mold.periodic_check_interval
      ? (mold.last_periodic_check_shot || 0) + mold.periodic_check_interval
      : null;

    // 7. QR 세션 종료 (세션이 있는 경우)
    if (session_id) {
      await QrSession.update(
        { 
          status: 'completed', 
          completed_at: new Date(),
          is_active: false
        },
        { 
          where: { session_token: session_id },
          transaction 
        }
      );
    }

    // 8. NG 발생 시 자동 수리요청 생성 (선택적)
    // TODO: NG가 critical한 경우 자동으로 수리요청 생성
    // if (hasNg && ngItems.some(item => item.is_critical)) {
    //   await createAutoRepairRequest(mold, ngItems, transaction);
    // }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        dailyCheck: {
          id: dailyCheck.id,
          mold_id: dailyCheck.mold_id,
          production_quantity: dailyCheck.production_quantity,
          ng_quantity: dailyCheck.ng_quantity,
          has_ng: hasNg,
          checked_at: dailyCheck.checked_at
        },
        mold: {
          current_shot: newCurrentShot,
          next_daily_check_shot: nextDailyCheckShot,
          next_periodic_check_shot: nextPeriodicCheckShot
        },
        ng_items: ngItems
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Create daily inspection error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to create daily inspection',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

module.exports = {
  getInspections,
  getInspectionById,
  getPendingInspections,
  createDailyInspection,
  createPeriodicInspection,
  updateInspection,
  approveInspection,
  rejectInspection
};
