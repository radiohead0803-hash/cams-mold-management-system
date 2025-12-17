/**
 * 시스템 규칙/기준값 컨트롤러
 */
const logger = require('../utils/logger');

let SystemRule;

const initModel = (sequelize) => {
  if (!SystemRule) {
    SystemRule = require('../models/SystemRule')(sequelize);
  }
  return SystemRule;
};

/**
 * 모든 규칙 조회
 * GET /api/v1/system-rules
 */
const getRules = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const RuleModel = initModel(sequelize);
    
    const { category, active_only = 'true' } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (active_only === 'true') where.is_active = true;

    const rules = await RuleModel.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    // 카테고리별 그룹화
    const grouped = rules.reduce((acc, rule) => {
      if (!acc[rule.category]) acc[rule.category] = [];
      acc[rule.category].push(rule);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        rules,
        grouped,
        total: rules.length
      }
    });
  } catch (error) {
    logger.error('규칙 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '규칙 목록을 불러올 수 없습니다.' }
    });
  }
};

/**
 * 규칙 상세 조회
 * GET /api/v1/system-rules/:key
 */
const getRuleByKey = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const RuleModel = initModel(sequelize);
    const { key } = req.params;

    const rule = await RuleModel.findOne({
      where: { rule_key: key }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: { message: '규칙을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    logger.error('규칙 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '규칙을 불러올 수 없습니다.' }
    });
  }
};

/**
 * 규칙 값 업데이트
 * PATCH /api/v1/system-rules/:key
 */
const updateRule = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const RuleModel = initModel(sequelize);
    const { key } = req.params;
    const { value } = req.body;

    const rule = await RuleModel.findOne({
      where: { rule_key: key }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: { message: '규칙을 찾을 수 없습니다.' }
      });
    }

    if (!rule.is_editable) {
      return res.status(403).json({
        success: false,
        error: { message: '이 규칙은 수정할 수 없습니다.' }
      });
    }

    // 값 유효성 검사
    if (rule.value_type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return res.status(400).json({
          success: false,
          error: { message: '숫자 값을 입력해주세요.' }
        });
      }
      if (rule.min_value !== null && numValue < rule.min_value) {
        return res.status(400).json({
          success: false,
          error: { message: `최소값은 ${rule.min_value}입니다.` }
        });
      }
      if (rule.max_value !== null && numValue > rule.max_value) {
        return res.status(400).json({
          success: false,
          error: { message: `최대값은 ${rule.max_value}입니다.` }
        });
      }
    }

    await rule.update({
      value,
      updated_by: req.user?.id || 1,
      updated_by_name: req.user?.name || 'Admin'
    });

    res.json({
      success: true,
      data: rule,
      message: '규칙이 업데이트되었습니다.'
    });
  } catch (error) {
    logger.error('규칙 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '규칙 업데이트에 실패했습니다.' }
    });
  }
};

/**
 * 규칙 생성 (관리자 전용)
 * POST /api/v1/system-rules
 */
const createRule = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const RuleModel = initModel(sequelize);

    const {
      rule_key,
      category,
      name,
      description,
      value,
      value_type = 'number',
      unit,
      min_value,
      max_value,
      default_value,
      applies_to = 'all',
      is_editable = true
    } = req.body;

    // 중복 검사
    const existing = await RuleModel.findOne({
      where: { rule_key }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: '이미 존재하는 규칙 키입니다.' }
      });
    }

    const rule = await RuleModel.create({
      rule_key,
      category,
      name,
      description,
      value,
      value_type,
      unit,
      min_value,
      max_value,
      default_value: default_value || value,
      applies_to,
      is_editable,
      updated_by: req.user?.id || 1,
      updated_by_name: req.user?.name || 'Admin'
    });

    res.status(201).json({
      success: true,
      data: rule,
      message: '규칙이 생성되었습니다.'
    });
  } catch (error) {
    logger.error('규칙 생성 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '규칙 생성에 실패했습니다.' }
    });
  }
};

/**
 * 규칙 초기화 (기본값으로)
 * POST /api/v1/system-rules/:key/reset
 */
const resetRule = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const RuleModel = initModel(sequelize);
    const { key } = req.params;

    const rule = await RuleModel.findOne({
      where: { rule_key: key }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: { message: '규칙을 찾을 수 없습니다.' }
      });
    }

    if (!rule.default_value) {
      return res.status(400).json({
        success: false,
        error: { message: '기본값이 설정되지 않은 규칙입니다.' }
      });
    }

    await rule.update({
      value: rule.default_value,
      updated_by: req.user?.id || 1,
      updated_by_name: req.user?.name || 'Admin'
    });

    res.json({
      success: true,
      data: rule,
      message: '규칙이 기본값으로 초기화되었습니다.'
    });
  } catch (error) {
    logger.error('규칙 초기화 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '규칙 초기화에 실패했습니다.' }
    });
  }
};

/**
 * 기본 규칙 시드 데이터 생성
 * POST /api/v1/system-rules/seed
 */
const seedDefaultRules = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const RuleModel = initModel(sequelize);

    const defaultRules = [
      // 점검 관련
      { rule_key: 'daily_inspection_cycle', category: 'inspection', name: '일상점검 주기', value: '1', value_type: 'number', unit: '일', min_value: 1, max_value: 7, default_value: '1' },
      { rule_key: 'periodic_inspection_cycle', category: 'inspection', name: '정기점검 주기', value: '30', value_type: 'number', unit: '일', min_value: 7, max_value: 365, default_value: '30' },
      { rule_key: 'cleaning_cycle', category: 'inspection', name: '세척 주기', value: '7', value_type: 'number', unit: '일', min_value: 1, max_value: 30, default_value: '7' },
      { rule_key: 'greasing_cycle', category: 'inspection', name: '습합 주기', value: '14', value_type: 'number', unit: '일', min_value: 1, max_value: 60, default_value: '14' },
      
      // 타수 관련
      { rule_key: 'shot_warning_threshold', category: 'shot_count', name: '타수 경고 기준', value: '80000', value_type: 'number', unit: '회', min_value: 10000, max_value: 500000, default_value: '80000' },
      { rule_key: 'shot_limit_threshold', category: 'shot_count', name: '타수 한계 기준', value: '100000', value_type: 'number', unit: '회', min_value: 50000, max_value: 1000000, default_value: '100000' },
      { rule_key: 'shot_inspection_interval', category: 'shot_count', name: '타수별 점검 간격', value: '20000', value_type: 'number', unit: '회', min_value: 5000, max_value: 100000, default_value: '20000' },
      
      // GPS 관련
      { rule_key: 'gps_deviation_radius', category: 'gps', name: 'GPS 이탈 허용 반경', value: '500', value_type: 'number', unit: 'm', min_value: 100, max_value: 5000, default_value: '500' },
      { rule_key: 'gps_update_interval', category: 'gps', name: 'GPS 업데이트 주기', value: '60', value_type: 'number', unit: '초', min_value: 30, max_value: 600, default_value: '60' },
      { rule_key: 'gps_offline_alert_threshold', category: 'gps', name: 'GPS 오프라인 알림 기준', value: '3600', value_type: 'number', unit: '초', min_value: 600, max_value: 86400, default_value: '3600' },
      
      // 알림 관련
      { rule_key: 'notification_retention_days', category: 'notification', name: '알림 보관 기간', value: '90', value_type: 'number', unit: '일', min_value: 30, max_value: 365, default_value: '90' },
      { rule_key: 'critical_alert_resend_interval', category: 'notification', name: '긴급 알림 재발송 간격', value: '30', value_type: 'number', unit: '분', min_value: 5, max_value: 120, default_value: '30' },
      
      // 승인 관련
      { rule_key: 'approval_sla_days', category: 'approval', name: '승인 SLA 기준', value: '3', value_type: 'number', unit: '일', min_value: 1, max_value: 14, default_value: '3' },
      { rule_key: 'approval_reminder_hours', category: 'approval', name: '승인 리마인더 발송', value: '24', value_type: 'number', unit: '시간', min_value: 4, max_value: 72, default_value: '24' }
    ];

    let created = 0;
    let skipped = 0;

    for (const rule of defaultRules) {
      const existing = await RuleModel.findOne({ where: { rule_key: rule.rule_key } });
      if (!existing) {
        await RuleModel.create({
          ...rule,
          applies_to: 'all',
          is_active: true,
          is_editable: true
        });
        created++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `기본 규칙 시드 완료: ${created}개 생성, ${skipped}개 스킵`
    });
  } catch (error) {
    logger.error('규칙 시드 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '규칙 시드에 실패했습니다.' }
    });
  }
};

module.exports = {
  getRules,
  getRuleByKey,
  updateRule,
  createRule,
  resetRule,
  seedDefaultRules
};
