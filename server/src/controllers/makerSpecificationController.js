const { MakerSpecification, MoldSpecification, User, Mold, Company } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 제작처에 할당된 금형 사양 목록 조회
 * - maker_specifications에 maker_id 컬럼 없음
 * - mold_specifications.maker_company_id를 통해 company 기반 필터링
 */
const getMakerSpecifications = async (req, res) => {
  try {
    const { status, current_stage } = req.query;
    const companyId = req.user.company_id;

    const where = {};
    if (status) where.status = status;
    if (current_stage) where.current_stage = current_stage;

    // company_id가 있으면 mold_specifications.maker_company_id로 필터링
    const specInclude = {
      model: MoldSpecification,
      as: 'specification',
      attributes: ['id', 'part_number', 'part_name', 'car_model', 'car_year', 'mold_type',
        'tonnage', 'material', 'cavity_count', 'order_date', 'target_delivery_date',
        'development_stage', 'status', 'maker_company_id', 'plant_company_id']
    };
    if (companyId) {
      specInclude.where = { maker_company_id: companyId };
      specInclude.required = true;
    }

    const specifications = await MakerSpecification.findAll({
      where,
      include: [specInclude],
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

    const specification = await MakerSpecification.findOne({
      where: { id },
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
    const companyId = req.user.company_id;

    // company_id 기반 include 조건
    const companyInclude = companyId ? {
      model: MoldSpecification,
      as: 'specification',
      where: { maker_company_id: companyId },
      required: true,
      attributes: []
    } : null;

    const countOpts = (extraWhere) => {
      const opts = { where: { ...extraWhere } };
      if (companyInclude) opts.include = [companyInclude];
      return opts;
    };

    // 단계별 현황
    const design = await MakerSpecification.count(countOpts({ current_stage: '설계' }));
    const machining = await MakerSpecification.count(countOpts({ current_stage: '가공' }));
    const assembly = await MakerSpecification.count(countOpts({ current_stage: '조립' }));
    const trialWaiting = await MakerSpecification.count(countOpts({ current_stage: '시운전대기' }));

    // 상태별 현황
    const pending = await MakerSpecification.count(countOpts({ status: 'pending' }));
    const inProgress = await MakerSpecification.count(countOpts({ status: 'in_progress' }));
    const completed = await MakerSpecification.count(countOpts({ status: 'completed' }));

    // 이번 주 완료
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekCompleted = await MakerSpecification.count(countOpts({
      status: 'completed',
      updated_at: {
        [require('sequelize').Op.gte]: weekAgo
      }
    }));

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
