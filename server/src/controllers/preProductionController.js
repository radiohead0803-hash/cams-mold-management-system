const { PreProductionChecklist, MoldSpecification, User } = require('../models/newIndex');
const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 제작전 체크리스트 생성
 */
const createChecklist = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      mold_specification_id,
      injection_machine_tonnage,
      part_images
    } = req.body;
    const userId = req.user.id;

    // 1. 금형제작사양 조회
    const specification = await MoldSpecification.findByPk(mold_specification_id, { transaction });
    if (!specification) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Mold specification not found' }
      });
    }

    // 2. 사용자 정보 조회
    const user = await User.findByPk(userId, { transaction });

    // 3. 체크리스트 ID 생성
    const checklistId = await generateChecklistId(specification.part_number);

    // 4. 체크리스트 생성 (자동 입력 항목 포함)
    const checklist = await PreProductionChecklist.create({
      mold_specification_id,
      maker_id: userId,
      checklist_id: checklistId,
      checklist_title: `${specification.part_name} 금형`,
      // 자동 입력
      car_model: specification.car_model,
      part_number: specification.part_number,
      part_name: specification.part_name,
      created_date: new Date(),
      created_by_name: user.name,
      maker_name: user.company_name,
      clamping_force: specification.clamping_force,
      eo_cut_date: specification.eo_cut_date,
      trial_order_date: specification.trial_order_date,
      // 수동 입력
      injection_machine_tonnage,
      part_images,
      // 초기 카테고리 (빈 객체)
      category_material: {},
      category_mold: {},
      category_gas_vent: {},
      category_moldflow: {},
      category_sink_mark: {},
      category_ejection: {},
      category_mic: {},
      category_coating: {},
      category_rear_back_beam: {},
      status: '작성중'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: { checklist }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Create checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create checklist' }
    });
  }
};

/**
 * 체크리스트 항목 업데이트
 */
const updateChecklistItems = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { checklist_id } = req.params;
    const { category, items } = req.body;

    const checklist = await PreProductionChecklist.findByPk(checklist_id, { transaction });
    if (!checklist) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }

    // 카테고리 업데이트
    const categoryField = `category_${category}`;
    if (!checklist[categoryField]) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid category' }
      });
    }

    await checklist.update({
      [categoryField]: items,
      updated_at: new Date()
    }, { transaction });

    // 진행률 재계산
    await checklist.calculateProgress();

    await transaction.commit();

    res.json({
      success: true,
      data: { checklist }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Update checklist items error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update checklist items' }
    });
  }
};

/**
 * 체크리스트 제출
 */
const submitChecklist = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { checklist_id } = req.params;
    const { special_notes, risk_assessment } = req.body;

    const checklist = await PreProductionChecklist.findByPk(checklist_id, { transaction });
    if (!checklist) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }

    // 진행률 확인
    if (checklist.progress_rate < 100) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Checklist is not complete. Please fill all items.' }
      });
    }

    // 제출 처리
    await checklist.update({
      submitted: true,
      submitted_at: new Date(),
      special_notes,
      risk_assessment,
      status: '승인대기',
      review_status: 'pending',
      updated_at: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        checklist,
        message: 'Checklist submitted successfully'
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Submit checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit checklist' }
    });
  }
};

/**
 * 체크리스트 승인/반려
 */
const reviewChecklist = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { checklist_id } = req.params;
    const { review_status, review_comments, required_corrections } = req.body;
    const userId = req.user.id;

    // 권한 확인 (mold_developer만 가능)
    if (req.user.user_type !== 'mold_developer' && req.user.user_type !== 'system_admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only mold developers can review checklists' }
      });
    }

    const checklist = await PreProductionChecklist.findByPk(checklist_id, { transaction });
    if (!checklist) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }

    const reviewer = await User.findByPk(userId, { transaction });

    // 승인/반려 처리
    await checklist.update({
      review_status,
      reviewed_by: userId,
      reviewed_by_name: reviewer.name,
      reviewed_at: new Date(),
      review_comments,
      required_corrections: review_status === 'rejected' ? required_corrections : null,
      status: review_status === 'approved' ? '승인완료' : '반려',
      production_approved: review_status === 'approved',
      production_start_date: review_status === 'approved' ? new Date() : null,
      updated_at: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: {
        checklist,
        message: review_status === 'approved' ? 'Checklist approved' : 'Checklist rejected'
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Review checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to review checklist' }
    });
  }
};

/**
 * 체크리스트 조회
 */
const getChecklist = async (req, res) => {
  try {
    const { checklist_id } = req.params;

    const checklist = await PreProductionChecklist.findByPk(checklist_id, {
      include: [
        {
          association: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model']
        },
        {
          association: 'maker',
          attributes: ['id', 'name', 'company_name']
        },
        {
          association: 'reviewer',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!checklist) {
      return res.status(404).json({
        success: false,
        error: { message: 'Checklist not found' }
      });
    }

    res.json({
      success: true,
      data: { checklist }
    });

  } catch (error) {
    logger.error('Get checklist error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklist' }
    });
  }
};

/**
 * 체크리스트 목록 조회
 */
const getChecklists = async (req, res) => {
  try {
    const { review_status, maker_id, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (review_status) where.review_status = review_status;
    if (maker_id) where.maker_id = maker_id;

    const checklists = await PreProductionChecklist.findAndCountAll({
      where,
      include: [
        {
          association: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model']
        },
        {
          association: 'maker',
          attributes: ['id', 'name', 'company_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        checklists: checklists.rows,
        total: checklists.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('Get checklists error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get checklists' }
    });
  }
};

/**
 * 체크리스트 통계
 */
const getChecklistStatistics = async (req, res) => {
  try {
    const statistics = await PreProductionChecklist.findAll({
      attributes: [
        'review_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('progress_rate')), 'avg_progress'],
        [sequelize.fn('AVG', sequelize.col('pass_rate')), 'avg_pass_rate']
      ],
      group: ['review_status'],
      raw: true
    });

    res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    logger.error('Get checklist statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get statistics' }
    });
  }
};

/**
 * 체크리스트 ID 생성
 */
async function generateChecklistId(partNumber) {
  const prefix = partNumber ? partNumber.substring(0, 3).toUpperCase() : 'CHK';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

module.exports = {
  createChecklist,
  updateChecklistItems,
  submitChecklist,
  reviewChecklist,
  getChecklist,
  getChecklists,
  getChecklistStatistics
};
