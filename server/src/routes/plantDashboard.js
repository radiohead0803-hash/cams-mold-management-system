const express = require('express');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { Mold, DailyCheck, Repair, ProductionQuantity, QRSession, sequelize } = require('../models/newIndex');

const router = express.Router();

// 개발 환경에서는 인증 스킵 (프로덕션에서는 주석 해제)
// router.use(authenticate, authorize(['plant']));

/**
 * GET /api/v1/plant/dashboard/summary
 * 생산처 대시보드 요약 정보
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    console.log('[Plant Dashboard] Summary request received');
    
    // 개발 환경: 인증 없이 테스트용 기본값 사용
    const userId = req.user?.id || 1;
    const companyId = req.user?.company_id || 1;

    console.log('[Plant Dashboard] userId:', userId, 'companyId:', companyId);

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
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    // 1) 우리 생산처에 배치된 금형 수 (조건 완화)
    const totalMolds = await Mold.count().catch(err => {
      console.error('[Plant Dashboard] totalMolds error:', err);
      return 0;
    });

    // 2) 가동 중인 금형 (조건 완화)
    const activeMolds = await Mold.count({
      where: {
        status: {
          [Op.in]: ['active', 'in_production', 'production']
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] activeMolds error:', err);
      return 0;
    });

    // 3) 오늘 일상점검 완료 수 (조건 완화)
    const todayChecks = await DailyCheck.count({
      where: {
        created_at: {
          [Op.gte]: startOfToday
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] todayChecks error:', err);
      return 0;
    });

    // 4) 진행 중인 수리 (조건 완화)
    const pendingRepairs = await Repair.count({
      where: {
        status: {
          [Op.notIn]: ['completed', 'rejected']
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] pendingRepairs error:', err);
      return 0;
    });

    // 5) 오늘 생산 수량 (조건 완화)
    const todayProductionResult = await ProductionQuantity.sum('quantity', {
      where: {
        production_date: {
          [Op.gte]: startOfToday
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] todayProduction error:', err);
      return 0;
    });
    const todayProduction = todayProductionResult || 0;

    // 6) 이번 달 생산 수량 (조건 완화)
    const monthlyProductionResult = await ProductionQuantity.sum('quantity', {
      where: {
        production_date: {
          [Op.gte]: startOfMonth
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] monthlyProduction error:', err);
      return 0;
    });
    const monthlyProduction = monthlyProductionResult || 0;

    // 7) 오늘 QR 스캔 수 (조건 완화)
    const todayScans = await QRSession.count({
      where: {
        created_at: {
          [Op.gte]: startOfToday
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] todayScans error:', err);
      return 0;
    });

    // 8) NG 발생 금형 수 (조건 완화)
    const ngMolds = await Mold.count({
      where: {
        status: {
          [Op.in]: ['ng', 'NG', 'defective']
        }
      }
    }).catch(err => {
      console.error('[Plant Dashboard] ngMolds error:', err);
      return 0;
    });

    console.log('[Plant Dashboard] Summary data:', {
      totalMolds,
      activeMolds,
      todayChecks,
      pendingRepairs,
      todayProduction,
      monthlyProduction,
      todayScans,
      ngMolds
    });

    return res.json({
      success: true,
      data: {
        totalMolds,
        activeMolds,
        todayChecks,
        pendingRepairs,
        todayProduction,
        monthlyProduction,
        todayScans,
        ngMolds
      }
    });
  } catch (error) {
    console.error('[Plant Dashboard] Summary error:', error);
    console.error('[Plant Dashboard] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: {
        message: '대시보드 요약 조회 중 오류가 발생했습니다.',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/v1/plant/dashboard/recent-activities
 * 최근 활동 내역 (점검, 생산, 수리요청)
 */
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    // 개발 환경: 인증 없이 테스트용 기본값 사용
    const userId = req.user?.id || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 최근 일상점검
    const recentChecks = await DailyCheck.findAll({
      where: {
        performed_by: userId
      },
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // 최근 수리요청
    const recentRepairs = await Repair.findAll({
      where: {
        requested_by: userId
      },
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // 최근 생산 기록
    const recentProduction = await ProductionQuantity.findAll({
      where: {
        recorded_by: userId
      },
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_code', 'mold_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // 통합 및 정렬
    const activities = [
      ...recentChecks.map(c => ({
        type: 'check',
        title: '일상점검 완료',
        mold_code: c.mold?.mold_code,
        mold_name: c.mold?.mold_name,
        status: c.overall_status,
        time: c.created_at
      })),
      ...recentRepairs.map(r => ({
        type: 'repair',
        title: '수리 요청',
        mold_code: r.mold?.mold_code,
        mold_name: r.mold?.mold_name,
        status: r.status,
        time: r.created_at
      })),
      ...recentProduction.map(p => ({
        type: 'production',
        title: '생산 수량 입력',
        mold_code: p.mold?.mold_code,
        mold_name: p.mold?.mold_name,
        quantity: p.quantity,
        time: p.created_at
      }))
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);

    return res.json({
      success: true,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Plant recent activities error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '최근 활동 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
