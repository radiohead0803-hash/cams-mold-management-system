const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { Mold, Repair, QRSession, Notification, User, sequelize } = require('../models/newIndex');

// 모든 /api/v1/hq/* 엔드포인트는 system_admin, mold_developer만 접근 가능
router.use(authenticate, authorize(['system_admin', 'mold_developer']));

/**
 * GET /api/v1/hq/dashboard/summary
 * 관리자 대시보드 요약 정보
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    // 1) 전체 금형 수
    const totalMolds = await Mold.count();

    // 2) 양산 중 금형 (status: active, in_production 등)
    const activeMolds = await Mold.count({
      where: {
        status: {
          [Op.in]: ['active', 'in_production', 'production']
        }
      }
    });

    // 3) NG 상태 금형
    const ngMolds = await Mold.count({
      where: {
        status: {
          [Op.in]: ['ng', 'NG', 'defective']
        }
      }
    });

    // 4) 진행 중 수리요청 (completed, rejected 제외)
    const openRepairs = await Repair.count({
      where: {
        status: {
          [Op.notIn]: ['completed', 'rejected', 'cancelled']
        }
      }
    });

    // 5) 오늘 QR 스캔 건수
    const todayScans = await QRSession.count({
      where: {
        created_at: {
          [Op.gte]: startOfToday
        }
      }
    });

    // 6) 오늘 Critical/Urgent 알림 수
    const criticalAlerts = await Notification.count({
      where: {
        priority: {
          [Op.in]: ['urgent', 'high', 'critical']
        },
        created_at: {
          [Op.gte]: startOfToday
        }
      }
    });

    return res.json({
      success: true,
      data: {
        totalMolds,
        activeMolds,
        ngMolds,
        openRepairs,
        todayScans,
        criticalAlerts
      }
    });
  } catch (error) {
    console.error('HQ dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '대시보드 요약 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/dashboard/alerts
 * 최근 알림 리스트 (최대 10개)
 */
router.get('/dashboard/alerts', async (req, res) => {
  try {
    const alerts = await Notification.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: [
        'id',
        'notification_type',
        'title',
        'message',
        'priority',
        'related_type',
        'related_id',
        'action_url',
        'is_read',
        'created_at'
      ]
    });

    return res.json({
      success: true,
      data: {
        alerts
      }
    });
  } catch (error) {
    console.error('HQ dashboard alerts error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '알림 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/dashboard/recent-activities
 * 최근 활동 내역
 */
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    // 최근 QR 스캔 5건
    const recentScans = await QRSession.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        {
          association: 'user',
          attributes: ['id', 'name', 'username']
        },
        {
          association: 'mold',
          attributes: ['id', 'mold_number', 'mold_name']
        }
      ]
    });

    // 최근 수리요청 5건
    const recentRepairs = await Repair.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: [
        'id',
        'request_number',
        'issue_type',
        'severity',
        'status',
        'created_at'
      ]
    });

    return res.json({
      success: true,
      data: {
        recentScans,
        recentRepairs
      }
    });
  } catch (error) {
    console.error('HQ dashboard recent activities error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '최근 활동 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/repair-requests
 * HQ 수리요청 목록 조회
 * Query params:
 *  - status: requested, in_progress, completed, confirmed, cancelled
 *  - urgency: low, medium, high, urgent
 */
router.get('/repair-requests', async (req, res) => {
  try {
    const { status, urgency } = req.query;

    const where = {};
    if (status) where.status = status;
    if (urgency) where.severity = urgency;

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
          attributes: ['id', 'name', 'username', 'user_type']
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
    console.error('HQ repair requests error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '수리요청 목록 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * GET /api/v1/hq/repair-requests/:id
 * 수리요청 상세 조회
 */
router.get('/repair-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const repair = await Repair.findByPk(id, {
      include: [
        {
          association: 'mold',
          attributes: ['id', 'mold_code', 'mold_name', 'status', 'location']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'username', 'user_type', 'company_name']
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

    return res.json({
      success: true,
      data: {
        repair
      }
    });
  } catch (error) {
    console.error('HQ repair request detail error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '수리요청 상세 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
