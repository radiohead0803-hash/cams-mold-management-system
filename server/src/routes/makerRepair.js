const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Repair, Mold, User, Notification } = require('../models/newIndex');
const logger = require('../utils/logger');

// 제작처만 접근 가능
router.use(authenticate, authorize(['maker']));

/**
 * GET /api/v1/maker/repair-requests
 * 제작처 수리요청 목록 조회
 * Query params:
 *  - status: requested, in_progress, completed
 */
router.get('/repair-requests', async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    const where = {};
    if (status) where.status = status;

    // 제작처는 자신이 담당하는 수리요청만 조회
    // TODO: 필요시 company_id 필터링 추가

    const repairs = await Repair.findAll({
      where,
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'user_type']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    return res.json({
      success: true,
      data: {
        repairs
      }
    });
  } catch (error) {
    logger.error('Maker repair requests error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '수리요청 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PATCH /api/v1/maker/repair-requests/:id/status
 * 제작처 수리요청 상태 변경
 * Body:
 *  - status: in_progress | completed
 */
router.patch('/repair-requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // 허용된 상태값 체크
    if (!['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: '허용되지 않는 상태값입니다. (in_progress, completed만 가능)'
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

    // TODO: 제작처 권한 확인 (company_id 체크)

    // 상태 업데이트
    repair.status = status;
    if (status === 'in_progress') {
      repair.started_at = new Date();
    } else if (status === 'completed') {
      repair.completed_at = new Date();
    }
    await repair.save();

    // 알림 생성 (요청자에게)
    try {
      await Notification.create({
        user_id: repair.requested_by,
        notification_type: 'repair_status_update',
        title: '수리 상태 변경',
        message: `금형 ${repair.mold?.mold_code} 수리가 ${status === 'in_progress' ? '진행 중' : '완료'}되었습니다.`,
        priority: status === 'completed' ? 'high' : 'normal',
        related_type: 'repair',
        related_id: repair.id,
        action_url: `/repairs/${repair.id}`,
        is_read: false
      });
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
    logger.error('Maker update repair status error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '수리 상태 변경 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
