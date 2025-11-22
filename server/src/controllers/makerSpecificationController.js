const { MakerSpecification, MoldSpecification, User, Mold } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 제작처에 할당된 금형 사양 목록 조회
 */
const getMakerSpecifications = async (req, res) => {
  try {
    const { status, current_stage } = req.query;
    const makerId = req.user.id;

    const where = { maker_id: makerId };
    if (status) where.status = status;
    if (current_stage) where.current_stage = current_stage;

    const specifications = await MakerSpecification.findAll({
      where,
      include: [
        {
          model: MoldSpecification,
          as: 'specification',
          attributes: ['id', 'part_number', 'part_name', 'car_model', 'order_date', 'target_delivery_date']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: specifications
    });
  } catch (error) {
    logger.error('Get maker specifications error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 목록 조회 실패' }
    });
  }
};

/**
 * 제작처 금형 사양 상세 조회
 */
const getMakerSpecificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const makerId = req.user.id;

    const specification = await MakerSpecification.findOne({
      where: { id, maker_id: makerId },
      include: [
        {
          model: MoldSpecification,
          as: 'specification'
        }
      ]
    });

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    res.json({
      success: true,
      data: specification
    });
  } catch (error) {
    logger.error('Get maker specification by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 조회 실패' }
    });
  }
};

/**
 * 제작처 추가 정보 입력 (maker_specifications 업데이트)
 */
const updateMakerSpecification = async (req, res) => {
  try {
    const { id } = req.params;
    const makerId = req.user.id;
    const {
      design_completion_date,
      manufacturing_start_date,
      trial_run_date,
      actual_delivery_date,
      production_progress,
      current_stage,
      status,
      notes,
      technical_notes
    } = req.body;

    const specification = await MakerSpecification.findOne({
      where: { id, maker_id: makerId }
    });

    if (!specification) {
      return res.status(404).json({
        success: false,
        error: { message: '금형 사양을 찾을 수 없습니다' }
      });
    }

    await specification.update({
      design_completion_date,
      manufacturing_start_date,
      trial_run_date,
      actual_delivery_date,
      production_progress,
      current_stage,
      status,
      notes,
      technical_notes,
      updated_at: new Date()
    });

    logger.info(`Maker specification updated: ${id} by maker ${makerId}`);

    res.json({
      success: true,
      data: specification
    });
  } catch (error) {
    logger.error('Update maker specification error:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사양 업데이트 실패' }
    });
  }
};

/**
 * 제작처 대시보드 통계
 */
const getMakerDashboardStats = async (req, res) => {
  try {
    const makerId = req.user.id;

    // 단계별 현황
    const design = await MakerSpecification.count({
      where: { maker_id: makerId, current_stage: '설계' }
    });

    const machining = await MakerSpecification.count({
      where: { maker_id: makerId, current_stage: '가공' }
    });

    const assembly = await MakerSpecification.count({
      where: { maker_id: makerId, current_stage: '조립' }
    });

    const trialWaiting = await MakerSpecification.count({
      where: { maker_id: makerId, current_stage: '시운전대기' }
    });

    // 상태별 현황
    const pending = await MakerSpecification.count({
      where: { maker_id: makerId, status: 'pending' }
    });

    const inProgress = await MakerSpecification.count({
      where: { maker_id: makerId, status: 'in_progress' }
    });

    const completed = await MakerSpecification.count({
      where: { maker_id: makerId, status: 'completed' }
    });

    // 이번 주 완료
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekCompleted = await MakerSpecification.count({
      where: {
        maker_id: makerId,
        status: 'completed',
        updated_at: {
          [require('sequelize').Op.gte]: weekAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        design,
        machining,
        assembly,
        trialWaiting,
        pending,
        inProgress,
        completed,
        weekCompleted
      }
    });
  } catch (error) {
    logger.error('Get maker dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: '대시보드 통계 조회 실패' }
    });
  }
};

module.exports = {
  getMakerSpecifications,
  getMakerSpecificationById,
  updateMakerSpecification,
  getMakerDashboardStats
};
