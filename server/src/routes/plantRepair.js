const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Repair, Mold, User, Notification } = require('../models/newIndex');
const logger = require('../utils/logger');

// 생산처, 시스템 관리자, 금형개발 담당자 접근 가능
router.use(authenticate, authorize(['plant', 'system_admin', 'mold_developer']));

/**
 * PATCH /api/v1/plant/repair-requests/:id/confirm
 * 생산처/본사 수리 결과 확인
 * Body:
 *  - decision: confirmed | rejected
 *  - comment: string (선택)
 */
router.patch('/repair-requests/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comment } = req.body;
    const userId = req.user.id;

    // 허용된 결정값 체크
    if (!['confirmed', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '허용되지 않는 결정값입니다. (confirmed, rejected만 가능)'
        }
      });
    }

    const repair = await Repair.findByPk(id, {
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        }
      ]
    });

    if (!repair) {
      return res.status(404).json({
        success: false,
        error: {
          message: '수리요청을 찾을 수 없습니다.'
        }
      });
    }

    // 완료 상태가 아니면 확인 불가
    if (repair.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          message: '완료된 수리요청만 확인할 수 있습니다.'
        }
      });
    }

    // 상태 업데이트
    if (decision === 'confirmed') {
      repair.status = 'confirmed';
      repair.confirmed_at = new Date();
      repair.confirmed_by = userId;
    } else {
      // 거부 시 다시 요청 상태로 되돌림
      repair.status = 'requested';
    }

    if (comment) {
      repair.confirm_comment = comment;
    }

    await repair.save();

    // 알림 생성 (제작처에게)
    try {
      // 제작처 담당자 찾기 (간단히 maker 유형 사용자에게 알림)
      const makers = await User.findAll({
        where: {
          user_type: 'maker',
          is_active: true
        },
        limit: 5
      });

      for (const maker of makers) {
        await Notification.create({
          user_id: maker.id,
          notification_type: 'repair_confirmed',
          title: decision === 'confirmed' ? '수리 확인 완료' : '수리 재작업 요청',
          message: `금형 ${repair.mold?.mold_code} 수리가 ${decision === 'confirmed' ? '확인되었습니다' : '재작업이 필요합니다'}.`,
          priority: decision === 'rejected' ? 'high' : 'normal',
          related_type: 'repair',
          related_id: repair.id,
          action_url: `/maker/repair-requests/${repair.id}`,
          is_read: false
        });
      }
    } catch (notifError) {
      logger.error('Notification creation error:', notifError);
    }

    return res.json({
      success: true,
      data: {
        repair
      }
    });
  } catch (error) {
    logger.error('Confirm repair error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '수리 확인 처리 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
