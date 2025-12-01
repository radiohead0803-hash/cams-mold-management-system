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
    // 개발 환경: 인증 없이 테스트용 기본값 사용
    const userId = req.user?.id || 1;
    const companyId = req.user?.company_id || 1;

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

    // 1) 우리 생산처에 배치된 금형 수
    const totalMolds = await Mold.count({
      where: {
        current_location_type: 'plant',
        current_location_id: companyId
      }
    });

    // 2) 가동 중인 금형
    const activeMolds = await Mold.count({
      where: {
        current_location_type: 'plant',
        current_location_id: companyId,
        status: {
          [Op.in]: ['active', 'in_production', 'production']
        }
      }
    });

    // 3) 오늘 일상점검 완료 수
    const todayChecks = await DailyCheck.count({
      where: {
        performed_by: userId,
        created_at: {
          [Op.gte]: startOfToday
        }
      }
    });

    // 4) 우리가 요청한 수리 중 진행 중인 것
    const pendingRepairs = await Repair.count({
      where: {
        requested_by: userId,
        status: {
          [Op.notIn]: ['completed', 'rejected']
        }
      }
    });

    // 5) 오늘 생산 수량 (합계)
    const todayProductionResult = await ProductionQuantity.sum('quantity', {
      where: {
        recorded_by: userId,
        production_date: {
          [Op.gte]: startOfToday
        }
      }
    });
    const todayProduction = todayProductionResult || 0;

    // 6) 이번 달 생산 수량 (합계)
    const monthlyProductionResult = await ProductionQuantity.sum('quantity', {
      where: {
        recorded_by: userId,
        production_date: {
          [Op.gte]: startOfMonth
        }
      }
    });
    const monthlyProduction = monthlyProductionResult || 0;

    // 7) 오늘 QR 스캔 수
    const todayScans = await QRSession.count({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startOfToday
        }
      }
    });

    // 8) NG 발생 금형 수 (우리 생산처)
    const ngMolds = await Mold.count({
      where: {
        current_location_type: 'plant',
        current_location_id: companyId,
        status: {
          [Op.in]: ['ng', 'NG', 'defective']
        }
      }
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
    console.error('Plant dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '대시보드 요약 조회 중 오류가 발생했습니다.'
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
