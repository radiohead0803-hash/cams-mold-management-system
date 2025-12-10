const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 유지보전 예방 알람 서비스
 * - 다음 유지보전 예정일/타수 도달 시 알림 생성
 */

/**
 * 유지보전 예정 알림 체크 및 생성
 */
const checkMaintenanceAlerts = async () => {
  try {
    logger.info('Checking maintenance alerts...');
    
    // 1. 일자 기준 유지보전 예정 체크 (7일, 3일, 1일 전)
    const [dateAlerts] = await sequelize.query(`
      SELECT 
        mr.id as record_id,
        mr.mold_id,
        mr.maintenance_type,
        mr.next_maintenance_date,
        m.mold_code,
        ms.part_name,
        EXTRACT(DAY FROM mr.next_maintenance_date - CURRENT_DATE) as days_until
      FROM maintenance_records mr
      JOIN molds m ON mr.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE mr.next_maintenance_date IS NOT NULL
        AND mr.next_maintenance_date >= CURRENT_DATE
        AND mr.next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.mold_id = mr.mold_id 
            AND a.alert_type = 'maintenance_due'
            AND a.created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND a.message LIKE '%' || mr.maintenance_type || '%'
        )
      ORDER BY mr.next_maintenance_date ASC
    `);

    for (const alert of dateAlerts) {
      const daysUntil = parseInt(alert.days_until);
      let priority = 'low';
      if (daysUntil <= 1) priority = 'high';
      else if (daysUntil <= 3) priority = 'medium';

      await sequelize.query(`
        INSERT INTO alerts (
          mold_id, alert_type, title, message, priority, 
          trigger_type, trigger_value, is_read, created_at
        ) VALUES (
          :mold_id, 'maintenance_due', :title, :message, :priority,
          'date', :trigger_value, false, NOW()
        )
      `, {
        replacements: {
          mold_id: alert.mold_id,
          title: `[${alert.maintenance_type}] 유지보전 예정`,
          message: `${alert.mold_code} (${alert.part_name || '-'}) - ${alert.maintenance_type} 예정일: ${new Date(alert.next_maintenance_date).toLocaleDateString('ko-KR')} (D-${daysUntil})`,
          priority,
          trigger_value: daysUntil.toString()
        }
      });
    }

    // 2. 타수 기준 유지보전 예정 체크
    const [shotsAlerts] = await sequelize.query(`
      SELECT 
        mr.id as record_id,
        mr.mold_id,
        mr.maintenance_type,
        mr.next_maintenance_shots,
        m.mold_code,
        m.current_shots,
        ms.part_name,
        (mr.next_maintenance_shots - COALESCE(m.current_shots, 0)) as shots_remaining
      FROM maintenance_records mr
      JOIN molds m ON mr.mold_id = m.id
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE mr.next_maintenance_shots IS NOT NULL
        AND mr.next_maintenance_shots > 0
        AND COALESCE(m.current_shots, 0) >= (mr.next_maintenance_shots * 0.9)
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.mold_id = mr.mold_id 
            AND a.alert_type = 'maintenance_due'
            AND a.created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND a.trigger_type = 'shots'
        )
      ORDER BY shots_remaining ASC
    `);

    for (const alert of shotsAlerts) {
      const shotsRemaining = parseInt(alert.shots_remaining);
      const currentShots = parseInt(alert.current_shots) || 0;
      const targetShots = parseInt(alert.next_maintenance_shots);
      const percent = Math.round((currentShots / targetShots) * 100);
      
      let priority = 'low';
      if (percent >= 100) priority = 'high';
      else if (percent >= 95) priority = 'medium';

      await sequelize.query(`
        INSERT INTO alerts (
          mold_id, alert_type, title, message, priority, 
          trigger_type, trigger_value, is_read, created_at
        ) VALUES (
          :mold_id, 'maintenance_due', :title, :message, :priority,
          'shots', :trigger_value, false, NOW()
        )
      `, {
        replacements: {
          mold_id: alert.mold_id,
          title: `[${alert.maintenance_type}] 타수 도달 예정`,
          message: `${alert.mold_code} (${alert.part_name || '-'}) - 현재 ${currentShots.toLocaleString()}타 / 목표 ${targetShots.toLocaleString()}타 (${percent}%)`,
          priority,
          trigger_value: shotsRemaining.toString()
        }
      });
    }

    logger.info(`Maintenance alerts created: ${dateAlerts.length} date-based, ${shotsAlerts.length} shots-based`);
    
    return {
      dateAlerts: dateAlerts.length,
      shotsAlerts: shotsAlerts.length
    };

  } catch (error) {
    logger.error('Check maintenance alerts error:', error);
    throw error;
  }
};

/**
 * 정기점검 예정 알림 체크 (복합 조건: 타수 OR 일자)
 */
const checkPeriodicInspectionAlerts = async () => {
  try {
    logger.info('Checking periodic inspection alerts...');
    
    // 타수 기준 점검 예정
    const [shotsAlerts] = await sequelize.query(`
      SELECT 
        m.id as mold_id,
        m.mold_code,
        m.current_shots,
        m.next_inspection_shots,
        ms.part_name,
        (m.next_inspection_shots - COALESCE(m.current_shots, 0)) as shots_remaining
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE m.next_inspection_shots IS NOT NULL
        AND m.next_inspection_shots > 0
        AND COALESCE(m.current_shots, 0) >= (m.next_inspection_shots * 0.9)
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.mold_id = m.id 
            AND a.alert_type = 'inspection_due_shots'
            AND a.created_at >= CURRENT_DATE - INTERVAL '1 day'
        )
    `);

    for (const alert of shotsAlerts) {
      const currentShots = parseInt(alert.current_shots) || 0;
      const targetShots = parseInt(alert.next_inspection_shots);
      const percent = Math.round((currentShots / targetShots) * 100);
      
      await sequelize.query(`
        INSERT INTO alerts (
          mold_id, alert_type, title, message, priority, 
          trigger_type, trigger_value, is_read, created_at
        ) VALUES (
          :mold_id, 'inspection_due_shots', :title, :message, :priority,
          'shots', :trigger_value, false, NOW()
        )
      `, {
        replacements: {
          mold_id: alert.mold_id,
          title: '[타수] 정기점검 예정',
          message: `${alert.mold_code} (${alert.part_name || '-'}) - 현재 ${currentShots.toLocaleString()}타 / 목표 ${targetShots.toLocaleString()}타 (${percent}%)`,
          priority: percent >= 100 ? 'high' : 'medium',
          trigger_value: alert.shots_remaining?.toString() || '0'
        }
      });
    }

    // 일자 기준 점검 예정
    const [dateAlerts] = await sequelize.query(`
      SELECT 
        m.id as mold_id,
        m.mold_code,
        m.next_inspection_date,
        ms.part_name,
        EXTRACT(DAY FROM m.next_inspection_date - CURRENT_DATE) as days_until
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
      WHERE m.next_inspection_date IS NOT NULL
        AND m.next_inspection_date >= CURRENT_DATE
        AND m.next_inspection_date <= CURRENT_DATE + INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM alerts a 
          WHERE a.mold_id = m.id 
            AND a.alert_type = 'inspection_due_date'
            AND a.created_at >= CURRENT_DATE - INTERVAL '1 day'
        )
    `);

    for (const alert of dateAlerts) {
      const daysUntil = parseInt(alert.days_until);
      
      await sequelize.query(`
        INSERT INTO alerts (
          mold_id, alert_type, title, message, priority, 
          trigger_type, trigger_value, is_read, created_at
        ) VALUES (
          :mold_id, 'inspection_due_date', :title, :message, :priority,
          'date', :trigger_value, false, NOW()
        )
      `, {
        replacements: {
          mold_id: alert.mold_id,
          title: '[일자] 정기점검 예정',
          message: `${alert.mold_code} (${alert.part_name || '-'}) - 점검 예정일: ${new Date(alert.next_inspection_date).toLocaleDateString('ko-KR')} (D-${daysUntil})`,
          priority: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'low',
          trigger_value: daysUntil.toString()
        }
      });
    }

    logger.info(`Periodic inspection alerts created: ${shotsAlerts.length} shots-based, ${dateAlerts.length} date-based`);
    
    return {
      shotsAlerts: shotsAlerts.length,
      dateAlerts: dateAlerts.length
    };

  } catch (error) {
    logger.error('Check periodic inspection alerts error:', error);
    throw error;
  }
};

/**
 * 모든 예방 알람 체크 실행
 */
const runAllAlertChecks = async () => {
  try {
    const maintenanceResult = await checkMaintenanceAlerts();
    const inspectionResult = await checkPeriodicInspectionAlerts();
    
    return {
      maintenance: maintenanceResult,
      inspection: inspectionResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Run all alert checks error:', error);
    throw error;
  }
};

module.exports = {
  checkMaintenanceAlerts,
  checkPeriodicInspectionAlerts,
  runAllAlertChecks
};
