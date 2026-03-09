/**
 * 시스템 규칙/기준값 컨트롤러
 */
const logger = require('../utils/logger');
const { SystemRule, sequelize } = require('../models/newIndex');

/**
 * 모든 규칙 조회
 * GET /api/v1/system-rules
 */
const getRules = async (req, res) => {
  try {
    const { category, active_only = 'true' } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (active_only === 'true') where.is_active = true;

    const rules = await SystemRule.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const grouped = rules.reduce((acc, rule) => {
      if (!acc[rule.category]) acc[rule.category] = [];
      acc[rule.category].push(rule);
      return acc;
    }, {});

    res.json({
      success: true,
      data: { rules, grouped, total: rules.length }
    });
  } catch (error) {
    logger.error('규칙 목록 조회 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙 목록을 불러올 수 없습니다.' } });
  }
};

/**
 * 규칙 상세 조회
 * GET /api/v1/system-rules/:key
 */
const getRuleByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const rule = await SystemRule.findOne({ where: { rule_key: key } });
    if (!rule) return res.status(404).json({ success: false, error: { message: '규칙을 찾을 수 없습니다.' } });
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error('규칙 조회 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙을 불러올 수 없습니다.' } });
  }
};

/**
 * 규칙 값 업데이트
 * PATCH /api/v1/system-rules/:key
 */
const updateRule = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const rule = await SystemRule.findOne({ where: { rule_key: key } });
    if (!rule) return res.status(404).json({ success: false, error: { message: '규칙을 찾을 수 없습니다.' } });
    if (!rule.is_editable) return res.status(403).json({ success: false, error: { message: '이 규칙은 수정할 수 없습니다.' } });

    if (rule.value_type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return res.status(400).json({ success: false, error: { message: '숫자 값을 입력해주세요.' } });
      if (rule.min_value !== null && numValue < rule.min_value) return res.status(400).json({ success: false, error: { message: `최소값은 ${rule.min_value}입니다.` } });
      if (rule.max_value !== null && numValue > rule.max_value) return res.status(400).json({ success: false, error: { message: `최대값은 ${rule.max_value}입니다.` } });
    }

    await rule.update({ value, updated_by: req.user?.id || 1, updated_by_name: req.user?.name || 'Admin' });
    res.json({ success: true, data: rule, message: '규칙이 업데이트되었습니다.' });
  } catch (error) {
    logger.error('규칙 업데이트 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙 업데이트에 실패했습니다.' } });
  }
};

/**
 * 규칙 생성 (관리자 전용)
 * POST /api/v1/system-rules
 */
const createRule = async (req, res) => {
  try {
    const { rule_key, category, name, description, value, value_type = 'number', unit, min_value, max_value, default_value, applies_to = 'all', is_editable = true } = req.body;

    const existing = await SystemRule.findOne({ where: { rule_key } });
    if (existing) return res.status(400).json({ success: false, error: { message: '이미 존재하는 규칙 키입니다.' } });

    const rule = await SystemRule.create({
      rule_key, category, name, description, value, value_type, unit, min_value, max_value,
      default_value: default_value || value, applies_to, is_editable,
      updated_by: req.user?.id || 1, updated_by_name: req.user?.name || 'Admin'
    });

    res.status(201).json({ success: true, data: rule, message: '규칙이 생성되었습니다.' });
  } catch (error) {
    logger.error('규칙 생성 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙 생성에 실패했습니다.' } });
  }
};

/**
 * 규칙 삭제 (관리자 전용)
 * DELETE /api/v1/system-rules/:key
 */
const deleteRule = async (req, res) => {
  try {
    const { key } = req.params;
    const rule = await SystemRule.findOne({ where: { rule_key: key } });
    if (!rule) return res.status(404).json({ success: false, error: { message: '규칙을 찾을 수 없습니다.' } });
    await rule.destroy();
    res.json({ success: true, message: '규칙이 삭제되었습니다.' });
  } catch (error) {
    logger.error('규칙 삭제 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙 삭제에 실패했습니다.' } });
  }
};

/**
 * 규칙 초기화 (기본값으로)
 * POST /api/v1/system-rules/:key/reset
 */
const resetRule = async (req, res) => {
  try {
    const { key } = req.params;
    const rule = await SystemRule.findOne({ where: { rule_key: key } });
    if (!rule) return res.status(404).json({ success: false, error: { message: '규칙을 찾을 수 없습니다.' } });
    if (!rule.default_value) return res.status(400).json({ success: false, error: { message: '기본값이 설정되지 않은 규칙입니다.' } });

    await rule.update({ value: rule.default_value, updated_by: req.user?.id || 1, updated_by_name: req.user?.name || 'Admin' });
    res.json({ success: true, data: rule, message: '규칙이 기본값으로 초기화되었습니다.' });
  } catch (error) {
    logger.error('규칙 초기화 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙 초기화에 실패했습니다.' } });
  }
};

/**
 * 기본 규칙 시드 데이터 생성
 * POST /api/v1/system-rules/seed
 */
const seedDefaultRules = async (req, res) => {
  try {
    const defaultRules = getDefaultRules();

    let created = 0, skipped = 0;
    for (const rule of defaultRules) {
      const existing = await SystemRule.findOne({ where: { rule_key: rule.rule_key } });
      if (!existing) {
        await SystemRule.create({ ...rule, applies_to: 'all', is_active: true, is_editable: true });
        created++;
      } else {
        skipped++;
      }
    }

    res.json({ success: true, message: `기본 규칙 시드 완료: ${created}개 생성, ${skipped}개 스킵` });
  } catch (error) {
    logger.error('규칙 시드 에러:', error);
    res.status(500).json({ success: false, error: { message: '규칙 시드에 실패했습니다.' } });
  }
};

/**
 * 서버 부팅 시 자동 시드 (API 아닌 내부 호출)
 */
const autoSeedRules = async () => {
  try {
    const defaultRules = getDefaultRules();
    let created = 0;
    for (const rule of defaultRules) {
      const existing = await SystemRule.findOne({ where: { rule_key: rule.rule_key } });
      if (!existing) {
        await SystemRule.create({ ...rule, applies_to: 'all', is_active: true, is_editable: true });
        created++;
      }
    }
    if (created > 0) console.log(`✅ System rules auto-seed: ${created}개 생성`);
  } catch (error) {
    console.error('⚠️ System rules auto-seed warning:', error.message);
  }
};

function getDefaultRules() {
  return [
    // 점검 관련
    { rule_key: 'daily_inspection_cycle', category: 'inspection', name: '일상점검 주기', description: '일상점검 실시 주기 (일 단위)', value: '1', value_type: 'number', unit: '일', min_value: 1, max_value: 7, default_value: '1' },
    { rule_key: 'periodic_inspection_cycle', category: 'inspection', name: '정기점검 주기', description: '정기점검 실시 주기 (일 단위)', value: '30', value_type: 'number', unit: '일', min_value: 7, max_value: 365, default_value: '30' },
    { rule_key: 'cleaning_cycle', category: 'inspection', name: '세척 주기', description: '금형 세척 실시 주기', value: '7', value_type: 'number', unit: '일', min_value: 1, max_value: 30, default_value: '7' },
    { rule_key: 'greasing_cycle', category: 'inspection', name: '습합(그리스) 주기', description: '금형 그리스 도포 주기', value: '14', value_type: 'number', unit: '일', min_value: 1, max_value: 60, default_value: '14' },
    { rule_key: 'inspection_photo_required', category: 'inspection', name: '점검 사진 필수 여부', description: '점검 시 사진 첨부 의무화 (1=필수, 0=선택)', value: '1', value_type: 'number', unit: '', min_value: 0, max_value: 1, default_value: '1' },
    { rule_key: 'inspection_min_photos', category: 'inspection', name: '점검 최소 사진 수', description: '점검 시 최소 첨부해야 할 사진 수', value: '1', value_type: 'number', unit: '장', min_value: 0, max_value: 10, default_value: '1' },

    // 타수 관련
    { rule_key: 'guarantee_shot_warning_pct', category: 'shot_count', name: '보증숏수 경고 비율', description: '보증숏수 대비 경고 발생 비율 (%)', value: '90', value_type: 'number', unit: '%', min_value: 50, max_value: 99, default_value: '90' },
    { rule_key: 'guarantee_shot_critical_pct', category: 'shot_count', name: '보증숏수 긴급 비율', description: '보증숏수 대비 긴급 알림 발생 비율 (%)', value: '100', value_type: 'number', unit: '%', min_value: 80, max_value: 120, default_value: '100' },
    { rule_key: 'shot_inspection_interval', category: 'shot_count', name: '타수별 정기점검 간격', description: '숏수 기준 정기점검 트리거 간격', value: '20000', value_type: 'number', unit: '회', min_value: 5000, max_value: 100000, default_value: '20000' },
    { rule_key: 'shot_20k_inspection', category: 'shot_count', name: '20,000 SHOT 점검', description: '20,000 숏 도달 시 정기점검 실시', value: '20000', value_type: 'number', unit: '회', min_value: 10000, max_value: 50000, default_value: '20000' },
    { rule_key: 'shot_50k_inspection', category: 'shot_count', name: '50,000 SHOT 점검', description: '50,000 숏 도달 시 정기점검 실시', value: '50000', value_type: 'number', unit: '회', min_value: 30000, max_value: 100000, default_value: '50000' },
    { rule_key: 'shot_100k_inspection', category: 'shot_count', name: '100,000 SHOT 점검', description: '100,000 숏 도달 시 정기점검 실시', value: '100000', value_type: 'number', unit: '회', min_value: 50000, max_value: 200000, default_value: '100000' },

    // GPS 관련
    { rule_key: 'gps_deviation_radius', category: 'gps', name: 'GPS 이탈 허용 반경', description: '금형 위치 이탈 판정 반경', value: '500', value_type: 'number', unit: 'm', min_value: 100, max_value: 5000, default_value: '500' },
    { rule_key: 'gps_update_interval', category: 'gps', name: 'GPS 업데이트 주기', description: '위치 정보 갱신 간격', value: '60', value_type: 'number', unit: '초', min_value: 30, max_value: 600, default_value: '60' },
    { rule_key: 'gps_offline_alert_threshold', category: 'gps', name: 'GPS 오프라인 알림 기준', description: 'GPS 미수신 경과 시 알림 발생', value: '3600', value_type: 'number', unit: '초', min_value: 600, max_value: 86400, default_value: '3600' },

    // 알림 관련
    { rule_key: 'notification_retention_days', category: 'notification', name: '알림 보관 기간', description: '알림 기록 보관 일수', value: '90', value_type: 'number', unit: '일', min_value: 30, max_value: 365, default_value: '90' },
    { rule_key: 'critical_alert_resend_interval', category: 'notification', name: '긴급 알림 재발송 간격', description: '미확인 긴급 알림 재전송 간격', value: '30', value_type: 'number', unit: '분', min_value: 5, max_value: 120, default_value: '30' },
    { rule_key: 'overdue_inspection_alert', category: 'notification', name: '점검 지연 알림', description: '점검 미실시 경과 시 알림 (일 단위)', value: '1', value_type: 'number', unit: '일', min_value: 1, max_value: 7, default_value: '1' },

    // 승인 관련
    { rule_key: 'approval_sla_days', category: 'approval', name: '승인 SLA 기준', description: '승인 요청 후 처리 목표 일수', value: '3', value_type: 'number', unit: '일', min_value: 1, max_value: 14, default_value: '3' },
    { rule_key: 'approval_reminder_hours', category: 'approval', name: '승인 리마인더 발송', description: '미처리 승인건 리마인더 발송 간격', value: '24', value_type: 'number', unit: '시간', min_value: 4, max_value: 72, default_value: '24' },
    { rule_key: 'approval_auto_escalate_days', category: 'approval', name: '자동 에스컬레이션', description: '미처리 시 상위 관리자에게 자동 전달 기준', value: '5', value_type: 'number', unit: '일', min_value: 2, max_value: 30, default_value: '5' },

    // 시스템 설정
    { rule_key: 'session_timeout_minutes', category: 'system', name: '세션 타임아웃', description: '로그인 세션 유효 시간', value: '480', value_type: 'number', unit: '분', min_value: 30, max_value: 1440, default_value: '480' },
    { rule_key: 'qr_session_hours', category: 'system', name: 'QR 세션 유효시간', description: 'QR 코드 스캔 세션 유효 시간', value: '8', value_type: 'number', unit: '시간', min_value: 1, max_value: 24, default_value: '8' },
    { rule_key: 'max_upload_size_mb', category: 'system', name: '최대 업로드 용량', description: '파일 업로드 최대 크기', value: '10', value_type: 'number', unit: 'MB', min_value: 1, max_value: 50, default_value: '10' },
    { rule_key: 'data_retention_years', category: 'system', name: '데이터 보관 기간', description: '점검/이력 데이터 보관 연수', value: '5', value_type: 'number', unit: '년', min_value: 1, max_value: 10, default_value: '5' },
    { rule_key: 'hardness_hrc_min', category: 'system', name: '경도 측정 최소값(HRC)', description: '경도 측정 유효 최소 범위', value: '40', value_type: 'number', unit: 'HRC', min_value: 0, max_value: 70, default_value: '40' },
    { rule_key: 'hardness_hrc_max', category: 'system', name: '경도 측정 최대값(HRC)', description: '경도 측정 유효 최대 범위', value: '65', value_type: 'number', unit: 'HRC', min_value: 30, max_value: 80, default_value: '65' }
  ];
}

module.exports = {
  getRules,
  getRuleByKey,
  updateRule,
  createRule,
  deleteRule,
  resetRule,
  seedDefaultRules,
  autoSeedRules
};
