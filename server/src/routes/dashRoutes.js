const express = require('express');
const router = express.Router();
const { Op, fn, col, where: seqWhere } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { Mold, Repair, DailyCheck, QRSession, Notification, sequelize } = require('../models/newIndex');

// 모든 /api/v1/dash/* 엔드포인트는 인증 필요
router.use(authenticate);

/**
 * GET /api/v1/dash/kpi
 * 대시보드 KPI 카드용 데이터
 */
router.get('/kpi', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );

    // 병렬로 모든 카운트 조회
    const [
      totalMolds,
      activeMolds,
      ngMolds,
      openRepairs,
      todayChecks,
      todayScans,
      criticalAlerts
    ] = await Promise.all([
      // 1) 전체 금형 수
      Mold.count(),
      
      // 2) 양산 중 금형
      Mold.count({
        where: {
          status: {
            [Op.in]: ['active', 'in_production', 'production']
          }
        }
      }),
      
      // 3) NG 상태 금형
      Mold.count({
        where: {
          status: {
            [Op.in]: ['ng', 'NG', 'defective']
          }
        }
      }),
      
      // 4) 진행 중 수리요청
      Repair.count({
        where: {
          status: {
            [Op.notIn]: ['completed', 'rejected', 'cancelled']
          }
        }
      }),
      
      // 5) 오늘 일상점검 수
      DailyCheck.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday
          }
        }
      }),
      
      // 6) 오늘 QR 스캔 건수
      QRSession.count({
        where: {
          created_at: {
            [Op.gte]: startOfToday
          }
        }
      }),
      
      // 7) 오늘 Critical 알림 수
      Notification.count({
        where: {
          priority: {
            [Op.in]: ['urgent', 'high', 'critical']
          },
          created_at: {
            [Op.gte]: startOfToday
          }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        totalMolds,
        activeMolds,
        ngMolds,
        openRepairs,
        todayChecks,
        todayScans,
        criticalAlerts,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard KPI error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Dashboard KPI 조회 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/v1/dash/charts
 * 대시보드 차트용 데이터
 */
router.get('/charts', async (req, res) => {
  try {
    // 최근 7일간 일상점검 추이
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyCheckTrend = await DailyCheck.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: sevenDaysAgo
        }
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // 금형 상태별 분포
    const moldStatusDistribution = await Mold.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 수리 상태별 분포
    const repairStatusDistribution = await Repair.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return res.json({
      success: true,
      data: {
        dailyCheckTrend,
        moldStatusDistribution,
        repairStatusDistribution,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard charts error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Dashboard 차트 데이터 조회 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/v1/dash/recent-activities
 * 최근 활동 내역
 */
router.get('/recent-activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 최근 QR 스캔
    const recentScans = await QRSession.findAll({
      order: [['created_at', 'DESC']],
      limit,
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

    // 최근 수리요청
    const recentRepairs = await Repair.findAll({
      order: [['created_at', 'DESC']],
      limit,
      attributes: [
        'id',
        'request_number',
        'issue_type',
        'severity',
        'status',
        'created_at'
      ]
    });

    // 최근 일상점검
    const recentChecks = await DailyCheck.findAll({
      order: [['created_at', 'DESC']],
      limit,
      attributes: [
        'id',
        'check_date',
        'status',
        'created_at'
      ]
    });

    return res.json({
      success: true,
      data: {
        recentScans,
        recentRepairs,
        recentChecks,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard recent activities error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '최근 활동 조회 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = router;
