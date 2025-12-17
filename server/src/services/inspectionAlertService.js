const { 
  InspectionSchedule, 
  ChecklistCycleCode, 
  Mold, 
  Notification,
  User,
  sequelize 
} = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 점검 알림 서비스
 * - Due/Overdue 스케줄 감지
 * - 협력사 알림 생성
 * - 쿨다운 관리
 */
class InspectionAlertService {
  
  /**
   * 스케줄 상태 업데이트 및 알림 생성
   */
  async processScheduleAlerts() {
    try {
      const schedules = await InspectionSchedule.findAll({
        where: {
          status: { [Op.in]: ['upcoming', 'due'] }
        },
        include: [
          { model: Mold, as: 'mold' },
          { model: ChecklistCycleCode, as: 'cycleCode' }
        ]
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const schedule of schedules) {
        await this.updateScheduleStatus(schedule, today);
      }

      logger.info(`Processed ${schedules.length} inspection schedules`);
    } catch (error) {
      logger.error('Process schedule alerts error:', error);
    }
  }

  /**
   * 개별 스케줄 상태 업데이트
   */
  async updateScheduleStatus(schedule, today) {
    const cycleCode = schedule.cycleCode;
    let newStatus = schedule.status;
    let overduePercentage = 0;

    if (cycleCode.cycle_type === 'shots') {
      const currentShots = schedule.mold?.current_shots || 0;
      const nextDue = schedule.next_due_shots || 0;

      if (nextDue > 0) {
        if (currentShots >= nextDue) {
          newStatus = 'overdue';
          overduePercentage = ((currentShots - nextDue) / nextDue * 100).toFixed(2);
        } else if (currentShots >= nextDue * 0.9) {
          newStatus = 'due';
        } else {
          newStatus = 'upcoming';
        }
      }
    } else if (cycleCode.cycle_type === 'daily') {
      const dueDate = schedule.next_due_date ? new Date(schedule.next_due_date) : null;
      if (dueDate) {
        dueDate.setHours(0, 0, 0, 0);
        if (today > dueDate) {
          newStatus = 'overdue';
          const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          overduePercentage = daysDiff;
        } else if (today.getTime() === dueDate.getTime()) {
          newStatus = 'due';
        } else {
          newStatus = 'upcoming';
        }
      }
    }

    // 상태 변경 시 업데이트 및 알림 생성
    if (schedule.status !== newStatus) {
      await schedule.update({ 
        status: newStatus,
        overdue_percentage: overduePercentage
      });

      // 알림 생성
      if (newStatus === 'due' || newStatus === 'overdue') {
        await this.createInspectionAlert(schedule, newStatus);
      }
    }
  }

  /**
   * 점검 알림 생성
   */
  async createInspectionAlert(schedule, status) {
    const cooldownKey = `inspection_${schedule.mold_id}_${schedule.cycle_code_id}_${status}`;
    
    // 쿨다운 체크 (24시간 내 동일 알림 방지)
    const existingAlert = await Notification.findOne({
      where: {
        cooldown_key: cooldownKey,
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAlert) {
      return; // 쿨다운 중
    }

    const mold = schedule.mold;
    const cycleCode = schedule.cycleCode;
    
    const severity = status === 'overdue' ? 'high' : 'medium';
    const type = status === 'overdue' ? 'inspection_overdue' : 'inspection_due';
    
    let message = '';
    if (status === 'due') {
      message = `[점검 도래] ${mold?.mold_code || mold?.mold_name} - ${cycleCode?.label} 점검이 필요합니다.`;
    } else {
      message = `[점검 지연] ${mold?.mold_code || mold?.mold_name} - ${cycleCode?.label} 점검이 지연되었습니다.`;
    }

    // 생산처 담당자에게 알림
    await Notification.create({
      type,
      severity,
      mold_id: schedule.mold_id,
      schedule_id: schedule.id,
      to_role: 'plant',
      message,
      cooldown_key: cooldownKey,
      is_read: false
    });

    // Overdue가 심각한 경우 본사에도 알림
    if (status === 'overdue' && schedule.overdue_percentage > 10) {
      await Notification.create({
        type: 'inspection_overdue_threshold',
        severity: 'urgent',
        mold_id: schedule.mold_id,
        schedule_id: schedule.id,
        to_role: 'hq',
        message: `[심각 지연] ${mold?.mold_code || mold?.mold_name} - ${cycleCode?.label} 점검이 ${schedule.overdue_percentage}% 초과되었습니다.`,
        cooldown_key: `${cooldownKey}_hq`,
        is_read: false
      });
    }

    logger.info(`Created inspection alert: ${type} for mold ${schedule.mold_id}`);
  }

  /**
   * 점검 완료 시 알림 종료
   */
  async resolveAlerts(moldId, cycleCodeId) {
    try {
      await Notification.update(
        { is_read: true },
        {
          where: {
            mold_id: moldId,
            type: { [Op.in]: ['inspection_due', 'inspection_overdue', 'inspection_overdue_threshold'] },
            is_read: false
          }
        }
      );

      logger.info(`Resolved inspection alerts for mold ${moldId}`);
    } catch (error) {
      logger.error('Resolve alerts error:', error);
    }
  }

  /**
   * 일일 요약 리포트 생성
   */
  async generateDailySummary() {
    try {
      const overdueCount = await InspectionSchedule.count({
        where: { status: 'overdue' }
      });

      const dueCount = await InspectionSchedule.count({
        where: { status: 'due' }
      });

      if (overdueCount > 0 || dueCount > 0) {
        await Notification.create({
          type: 'inspection_daily_summary',
          severity: overdueCount > 0 ? 'high' : 'medium',
          to_role: 'hq',
          message: `[일일 점검 현황] 도래: ${dueCount}건, 지연: ${overdueCount}건`,
          is_read: false
        });
      }

      logger.info(`Daily summary: due=${dueCount}, overdue=${overdueCount}`);
    } catch (error) {
      logger.error('Generate daily summary error:', error);
    }
  }
}

module.exports = new InspectionAlertService();
