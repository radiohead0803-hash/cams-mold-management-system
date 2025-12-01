const { Op } = require('sequelize');
const { 
  DailyCheck, 
  DailyCheckItem, 
  CheckItemMaster, 
  Repair, 
  Mold, 
  User, 
  Notification 
} = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 일상점검 NG 항목에서 자동 수리요청 생성
 * @param {number} dailyCheckId - 일상점검 ID
 * @param {number} requestedByUserId - 요청자 ID
 */
async function createRepairsFromDailyCheck(dailyCheckId, requestedByUserId) {
  try {
    // 1. 일상점검 조회
    const dailyCheck = await DailyCheck.findByPk(dailyCheckId);
    if (!dailyCheck) {
      logger.warn(`Daily check not found: ${dailyCheckId}`);
      return null;
    }

    // 2. 금형 조회
    const mold = await Mold.findByPk(dailyCheck.mold_id);
    if (!mold) {
      logger.warn(`Mold not found: ${dailyCheck.mold_id}`);
      return null;
    }

    // 3. 점검 항목 조회 (마스터와 조인)
    const items = await DailyCheckItem.findAll({
      where: { daily_check_id: dailyCheckId },
      include: [
        {
          association: 'checkItemMaster',
          required: false
        }
      ]
    });

    // 4. auto_repair=true이면서 result='ng'인 항목 필터링
    // (check_item_master에 auto_repair 컬럼이 있다고 가정)
    const ngItems = items.filter(item => {
      return item.result === 'ng';
      // 향후: item.checkItemMaster?.auto_repair === true 조건 추가 가능
    });

    if (ngItems.length === 0) {
      logger.info(`No NG items requiring auto repair for daily check ${dailyCheckId}`);
      return null;
    }

    // 5. 수리요청 번호 생성
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Repair.count({
      where: {
        request_date: {
          [Op.gte]: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });
    const requestNumber = `DR-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    // 6. NG 항목 설명 생성
    const descriptionLines = ngItems.map(item => {
      const itemName = item.checkItemMaster?.item_name || `항목 ${item.check_item_id}`;
      const notes = item.notes ? ` (${item.notes})` : '';
      return `- [NG] ${itemName}${notes}`;
    });

    const issueDescription = [
      `일상점검(#${dailyCheckId})에서 자동 생성된 수리요청입니다.`,
      '',
      ...descriptionLines
    ].join('\n');

    // 7. 기본 issue_type과 severity 결정
    // 향후: check_item_master의 default_issue_type, default_severity 사용
    const issueType = 'GENERAL_DEFECT';
    const severity = ngItems.length >= 3 ? 'high' : 'medium';

    // 8. 수리요청 생성
    const repair = await Repair.create({
      mold_id: dailyCheck.mold_id,
      qr_session_id: null,
      request_number: requestNumber,
      requested_by: requestedByUserId,
      request_date: new Date(),
      issue_type: issueType,
      issue_description: issueDescription,
      severity: severity,
      status: 'requested',
      photos: null
    });

    logger.info(`Auto repair created: ${requestNumber} for mold ${mold.mold_code} from daily check ${dailyCheckId}`);

    // 9. 관련자에게 알림 전송
    try {
      const users = await User.findAll({
        where: {
          user_type: {
            [Op.in]: ['system_admin', 'mold_developer', 'maker']
          },
          is_active: true
        }
      });

      for (const user of users) {
        await Notification.create({
          user_id: user.id,
          notification_type: 'repair_request',
          title: `점검 NG → 자동 수리요청 - ${mold.mold_code}`,
          message: `일상점검에서 NG 항목(${ngItems.length}건)이 발생하여 금형 ${mold.mold_code}에 대한 수리요청이 자동 등록되었습니다.`,
          priority: severity === 'urgent' || severity === 'high' ? 'high' : 'normal',
          related_type: 'repair',
          related_id: repair.id,
          action_url: `/hq/repair-requests/${repair.id}`,
          is_read: false
        });
      }

      logger.info(`Auto repair notifications sent to ${users.length} users`);
    } catch (notifError) {
      logger.error('Auto repair notification error:', notifError);
    }

    return repair;

  } catch (error) {
    logger.error('Create repairs from daily check error:', error);
    throw error;
  }
}

module.exports = {
  createRepairsFromDailyCheck
};
