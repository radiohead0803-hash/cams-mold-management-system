const { Op } = require('sequelize');
const { Mold, Inspection, Alert, User, Notification } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 점검 스케줄 재계산 서비스
 * 모든 활성 금형에 대해 타수 기반 정기검사 필요 여부 판단
 */
async function recalcInspectionSchedules() {
  try {
    logger.info('Starting inspection schedule recalculation...');

    // 1. 활성 금형 조회
    const molds = await Mold.findAll({
      where: {
        status: {
          [Op.in]: ['active', 'maintenance']
        }
      }
    });

    logger.info(`Found ${molds.length} active molds to check`);

    let scheduledCount = 0;
    let alertCount = 0;

    // 2. 각 금형에 대해 점검 필요 여부 확인
    for (const mold of molds) {
      const moldId = mold.id;
      const currentShots = mold.current_shots || 0;
      const targetShots = mold.target_shots || 0;

      // 목표 타수가 없으면 스킵
      if (targetShots <= 0) continue;

      // 3. 마지막 완료된 정기검사 조회
      const lastCompleted = await Inspection.findOne({
        where: {
          mold_id: moldId,
          inspection_type: 'periodic',
          status: 'completed'
        },
        order: [['inspection_date', 'DESC']]
      });

      // 4. 이미 스케줄된 검사가 있는지 확인
      const existingScheduled = await Inspection.findOne({
        where: {
          mold_id: moldId,
          inspection_type: 'periodic',
          status: 'scheduled'
        }
      });

      // 이미 스케줄이 있으면 스킵
      if (existingScheduled) continue;

      // 5. 다음 검사 기준 타수 계산 (목표 타수의 10% 간격)
      const interval = Math.round(targetShots * 0.1);
      if (interval <= 0) continue;

      // 마지막 검사 기준 타수
      const lastShotBase = lastCompleted 
        ? (lastCompleted.notes?.match(/기준: (\d+) shot/) || [0, 0])[1]
        : 0;

      const nextShotThreshold = parseInt(lastShotBase) + interval;

      // 6. 현재 타수가 기준치를 초과했는지 확인
      if (currentShots >= nextShotThreshold) {
        // 정기검사 스케줄 생성
        const inspection = await Inspection.create({
          mold_id: moldId,
          inspection_type: 'periodic',
          inspection_date: new Date(), // 즉시 필요
          status: 'scheduled',
          notes: `타수 기준 정기검사 필요 (기준: ${nextShotThreshold} shot, 현재: ${currentShots} shot)`
        });

        scheduledCount++;
        logger.info(`Scheduled inspection for mold ${mold.mold_code}: ${currentShots}/${nextShotThreshold} shots`);

        // 7. Alert 생성
        const alert = await Alert.create({
          alert_type: 'over_shot',
          severity: 'high',
          message: `금형 ${mold.mold_code} 타수 ${currentShots} / 기준 ${nextShotThreshold} 초과. 정기검사 필요.`,
          metadata: {
            mold_id: moldId,
            mold_code: mold.mold_code,
            current_shots: currentShots,
            threshold: nextShotThreshold,
            inspection_id: inspection.id
          },
          is_resolved: false
        });

        alertCount++;

        // 8. 관련 사용자에게 알림 전송
        try {
          const users = await User.findAll({
            where: {
              user_type: {
                [Op.in]: ['system_admin', 'mold_developer', 'plant']
              },
              is_active: true
            }
          });

          for (const user of users) {
            await Notification.create({
              user_id: user.id,
              notification_type: 'inspection_due',
              title: `정기검사 필요 - ${mold.mold_code}`,
              message: `금형 ${mold.mold_code} 타수가 기준치(${nextShotThreshold})를 초과했습니다. (현재: ${currentShots}) 정기검사를 진행해주세요.`,
              priority: 'high',
              related_type: 'mold',
              related_id: moldId,
              action_url: `/hq/molds/${moldId}?tab=inspection`,
              is_read: false
            });
          }

          logger.info(`Sent notifications to ${users.length} users for mold ${mold.mold_code}`);
        } catch (notifError) {
          logger.error('Notification creation error:', notifError);
        }
      }
    }

    logger.info(`Inspection schedule recalculation completed: ${scheduledCount} inspections scheduled, ${alertCount} alerts created`);

    return {
      success: true,
      scheduledCount,
      alertCount
    };

  } catch (error) {
    logger.error('Inspection schedule recalculation error:', error);
    throw error;
  }
}

/**
 * 날짜 기반 점검 스케줄 재계산
 * 마지막 검사 후 90일 경과 시 스케줄 생성
 */
async function recalcDateBasedInspections() {
  try {
    logger.info('Starting date-based inspection schedule recalculation...');

    const molds = await Mold.findAll({
      where: {
        status: {
          [Op.in]: ['active', 'maintenance']
        }
      }
    });

    let scheduledCount = 0;
    const DAYS_THRESHOLD = 90; // 90일

    for (const mold of molds) {
      // 마지막 완료된 검사
      const lastCompleted = await Inspection.findOne({
        where: {
          mold_id: mold.id,
          inspection_type: 'periodic',
          status: 'completed'
        },
        order: [['inspection_date', 'DESC']]
      });

      // 이미 스케줄된 검사가 있는지 확인
      const existingScheduled = await Inspection.findOne({
        where: {
          mold_id: mold.id,
          inspection_type: 'periodic',
          status: 'scheduled'
        }
      });

      if (existingScheduled) continue;

      // 마지막 검사일로부터 경과 일수 계산
      if (lastCompleted) {
        const daysSinceLastInspection = Math.floor(
          (new Date() - new Date(lastCompleted.inspection_date)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastInspection >= DAYS_THRESHOLD) {
          await Inspection.create({
            mold_id: mold.id,
            inspection_type: 'periodic',
            inspection_date: new Date(),
            status: 'scheduled',
            notes: `시간 경과 정기검사 필요 (마지막 검사: ${daysSinceLastInspection}일 전)`
          });

          scheduledCount++;
          logger.info(`Scheduled date-based inspection for mold ${mold.mold_code}: ${daysSinceLastInspection} days since last inspection`);
        }
      }
    }

    logger.info(`Date-based inspection schedule completed: ${scheduledCount} inspections scheduled`);

    return {
      success: true,
      scheduledCount
    };

  } catch (error) {
    logger.error('Date-based inspection schedule error:', error);
    throw error;
  }
}

module.exports = {
  recalcInspectionSchedules,
  recalcDateBasedInspections
};
