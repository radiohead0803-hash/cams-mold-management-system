/**
 * 알람 자동 연계 서비스
 * - NG 발생 시 자동 알람
 * - 점검 지연 시 자동 알람
 * - 타수 초과 시 자동 알람
 * - GPS 이탈 시 자동 알람
 */

const { sequelize } = require('../models/newIndex');

// 알람 심각도 정의
const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// 알람 유형 정의
const ALERT_TYPES = {
  NG_OCCURRED: 'ng_occurred',
  INSPECTION_OVERDUE: 'inspection_overdue',
  SHOTS_WARNING: 'shots_warning',
  SHOTS_EXCEEDED: 'shots_exceeded',
  GPS_DEVIATION: 'gps_deviation',
  MAINTENANCE_DUE: 'maintenance_due',
  REPAIR_REQUESTED: 'repair_requested',
  TRANSFER_PENDING: 'transfer_pending'
};

/**
 * 알람 생성 (중복 방지)
 */
const createAlert = async ({
  moldId,
  userId,
  companyId,
  alertType,
  severity,
  title,
  message,
  relatedId = null,
  relatedType = null
}) => {
  try {
    // 동일 알람 중복 체크 (24시간 이내)
    const [existing] = await sequelize.query(`
      SELECT id FROM alerts 
      WHERE mold_id = :moldId 
        AND alert_type = :alertType
        AND created_at >= NOW() - INTERVAL '24 hours'
      LIMIT 1
    `, {
      replacements: { moldId, alertType },
      type: sequelize.QueryTypes.SELECT
    });

    if (existing) {
      console.log(`[Alert] Duplicate alert skipped: ${alertType} for mold ${moldId}`);
      return null;
    }

    const [result] = await sequelize.query(`
      INSERT INTO alerts (
        mold_id, user_id, company_id, alert_type, severity,
        title, message, related_id, related_type,
        is_read, created_at
      ) VALUES (
        :moldId, :userId, :companyId, :alertType, :severity,
        :title, :message, :relatedId, :relatedType,
        false, NOW()
      )
      RETURNING id
    `, {
      replacements: {
        moldId, userId, companyId, alertType, severity,
        title, message, relatedId, relatedType
      },
      type: sequelize.QueryTypes.INSERT
    });

    console.log(`[Alert] Created: ${alertType} for mold ${moldId}`);
    return result?.[0]?.id || null;
  } catch (error) {
    console.error('[Alert] Error creating alert:', error.message);
    return null;
  }
};

/**
 * NG 발생 시 알람 생성
 */
const createNgAlert = async ({ moldId, userId, companyId, ngType, ngDescription, checkId }) => {
  const severityMap = {
    'critical': SEVERITY.CRITICAL,
    'major': SEVERITY.HIGH,
    'minor': SEVERITY.MEDIUM
  };

  return createAlert({
    moldId,
    userId,
    companyId,
    alertType: ALERT_TYPES.NG_OCCURRED,
    severity: severityMap[ngType] || SEVERITY.MEDIUM,
    title: `[NG 발생] ${ngType || '불량'}`,
    message: ngDescription || 'NG가 발생했습니다. 확인이 필요합니다.',
    relatedId: checkId,
    relatedType: 'daily_check'
  });
};

/**
 * 점검 지연 알람 체크 및 생성
 */
const checkInspectionOverdueAlerts = async () => {
  try {
    // 일상점검 지연 체크 (오늘 점검 예정인데 미완료)
    const [overdueDaily] = await sequelize.query(`
      SELECT 
        ms.id as mold_id,
        ms.mold_number,
        ms.part_name,
        pm.plant_id as company_id,
        COALESCE(
          (SELECT MAX(check_date) FROM daily_checks WHERE mold_id = ms.id),
          ms.created_at::date
        ) as last_check_date
      FROM mold_specifications ms
      JOIN plant_molds pm ON ms.id = pm.mold_spec_id
      WHERE ms.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM daily_checks dc 
          WHERE dc.mold_id = ms.id 
            AND DATE(dc.check_date) = CURRENT_DATE
        )
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.mold_id = ms.id 
            AND a.alert_type = 'inspection_overdue'
            AND DATE(a.created_at) = CURRENT_DATE
        )
      LIMIT 50
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    let createdCount = 0;
    for (const mold of overdueDaily) {
      await createAlert({
        moldId: mold.mold_id,
        companyId: mold.company_id,
        alertType: ALERT_TYPES.INSPECTION_OVERDUE,
        severity: SEVERITY.MEDIUM,
        title: '[점검 지연] 일상점검 미완료',
        message: `${mold.mold_number} (${mold.part_name || '-'}) - 오늘 일상점검이 완료되지 않았습니다.`
      });
      createdCount++;
    }

    console.log(`[Alert] Inspection overdue alerts created: ${createdCount}`);
    return createdCount;
  } catch (error) {
    console.error('[Alert] Error checking inspection overdue:', error.message);
    return 0;
  }
};

/**
 * 타수 초과/경고 알람 체크 및 생성
 */
const checkShotsAlerts = async () => {
  try {
    // 타수 90% 이상 도달 금형 체크
    const [shotsWarning] = await sequelize.query(`
      SELECT 
        ms.id as mold_id,
        ms.mold_number,
        ms.part_name,
        ms.current_shots,
        ms.target_shots,
        ROUND(ms.current_shots::numeric / NULLIF(ms.target_shots, 0) * 100, 1) as percent,
        pm.plant_id as company_id
      FROM mold_specifications ms
      LEFT JOIN plant_molds pm ON ms.id = pm.mold_spec_id
      WHERE ms.status = 'active'
        AND ms.target_shots > 0
        AND ms.current_shots >= ms.target_shots * 0.9
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.mold_id = ms.id 
            AND a.alert_type IN ('shots_warning', 'shots_exceeded')
            AND a.created_at >= NOW() - INTERVAL '7 days'
        )
      ORDER BY percent DESC
      LIMIT 50
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    let createdCount = 0;
    for (const mold of shotsWarning) {
      const percent = parseFloat(mold.percent);
      const isExceeded = percent >= 100;

      await createAlert({
        moldId: mold.mold_id,
        companyId: mold.company_id,
        alertType: isExceeded ? ALERT_TYPES.SHOTS_EXCEEDED : ALERT_TYPES.SHOTS_WARNING,
        severity: isExceeded ? SEVERITY.CRITICAL : SEVERITY.HIGH,
        title: isExceeded ? '[타수 초과] 목표 타수 도달' : '[타수 경고] 목표 타수 임박',
        message: `${mold.mold_number} (${mold.part_name || '-'}) - 현재 ${mold.current_shots?.toLocaleString()}타 / 목표 ${mold.target_shots?.toLocaleString()}타 (${percent}%)`
      });
      createdCount++;
    }

    console.log(`[Alert] Shots alerts created: ${createdCount}`);
    return createdCount;
  } catch (error) {
    console.error('[Alert] Error checking shots:', error.message);
    return 0;
  }
};

/**
 * 수리 요청 알람 생성
 */
const createRepairRequestAlert = async ({ moldId, userId, companyId, repairId, title, priority }) => {
  const severityMap = {
    'urgent': SEVERITY.CRITICAL,
    'high': SEVERITY.HIGH,
    'normal': SEVERITY.MEDIUM,
    'low': SEVERITY.LOW
  };

  return createAlert({
    moldId,
    userId,
    companyId,
    alertType: ALERT_TYPES.REPAIR_REQUESTED,
    severity: severityMap[priority] || SEVERITY.MEDIUM,
    title: `[수리 요청] ${title}`,
    message: `새로운 수리 요청이 등록되었습니다.`,
    relatedId: repairId,
    relatedType: 'repair_request'
  });
};

/**
 * 이관 요청 알람 생성
 */
const createTransferAlert = async ({ moldId, userId, companyId, transferId, fromPlant, toPlant }) => {
  return createAlert({
    moldId,
    userId,
    companyId,
    alertType: ALERT_TYPES.TRANSFER_PENDING,
    severity: SEVERITY.MEDIUM,
    title: '[이관 요청] 승인 대기',
    message: `${fromPlant} → ${toPlant} 이관 요청이 등록되었습니다.`,
    relatedId: transferId,
    relatedType: 'transfer'
  });
};

/**
 * 모든 자동 알람 체크 실행
 */
const runAllAlertChecks = async () => {
  console.log('[Alert] Running all alert checks...');
  
  const results = {
    inspectionOverdue: await checkInspectionOverdueAlerts(),
    shotsWarning: await checkShotsAlerts()
  };

  console.log('[Alert] Alert check completed:', results);
  return results;
};

module.exports = {
  SEVERITY,
  ALERT_TYPES,
  createAlert,
  createNgAlert,
  checkInspectionOverdueAlerts,
  checkShotsAlerts,
  createRepairRequestAlert,
  createTransferAlert,
  runAllAlertChecks
};
