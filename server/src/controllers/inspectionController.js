const { Mold, DailyCheck, ChecklistAnswer, QrSession, User, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

const getInspections = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { message: 'Get inspections - To be implemented' }
    });
  } catch (error) {
    logger.error('Get inspections error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get inspections' }
    });
  }
};

const getInspectionById = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { message: 'Get inspection by ID - To be implemented' }
    });
  } catch (error) {
    logger.error('Get inspection by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get inspection' }
    });
  }
};

const createPeriodicInspection = async (req, res) => {
  try {
    res.json({
      success: true,
      data: { message: 'Create periodic inspection - To be implemented' }
    });
  } catch (error) {
    logger.error('Create periodic inspection error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create periodic inspection' }
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
  createDailyInspection,
  createPeriodicInspection,
  updateInspection
};
