const express = require('express');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { Mold, DailyCheck, Repair, ProductionQuantity, QRSession, sequelize } = require('../models/newIndex');

const router = express.Router();

// 개발 환경에서는 인증 스킵 (프로덕션에서는 주석 해제)
// router.use(authenticate, authorize(['plant']));

/**
 * GET /api/v1/plant/dashboard/test
 * 테스트 엔드포인트 - 데이터베이스 연결 확인
 */
router.get('/dashboard/test', async (req, res) => {
  try {
    console.log('[Plant Dashboard Test] Starting database connection test...');
    
    // 1. 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('[Plant Dashboard Test] ✅ Database connection OK');
    
    // 2. 각 테이블 존재 여부 및 레코드 수 확인
    const tables = {};
    
    try {
      tables.molds = await Mold.count();
      console.log('[Plant Dashboard Test] ✅ Mold table:', tables.molds, 'records');
    } catch (err) {
      console.error('[Plant Dashboard Test] ❌ Mold table error:', err.message);
      tables.molds = `ERROR: ${err.message}`;
    }
    
    try {
      tables.dailyChecks = await DailyCheck.count();
      console.log('[Plant Dashboard Test] ✅ DailyCheck table:', tables.dailyChecks, 'records');
    } catch (err) {
      console.error('[Plant Dashboard Test] ❌ DailyCheck table error:', err.message);
      tables.dailyChecks = `ERROR: ${err.message}`;
    }
    
    try {
      tables.repairs = await Repair.count();
      console.log('[Plant Dashboard Test] ✅ Repair table:', tables.repairs, 'records');
    } catch (err) {
      console.error('[Plant Dashboard Test] ❌ Repair table error:', err.message);
      tables.repairs = `ERROR: ${err.message}`;
    }
    
    try {
      tables.productionQuantities = await ProductionQuantity.count();
      console.log('[Plant Dashboard Test] ✅ ProductionQuantity table:', tables.productionQuantities, 'records');
    } catch (err) {
      console.error('[Plant Dashboard Test] ❌ ProductionQuantity table error:', err.message);
      tables.productionQuantities = `ERROR: ${err.message}`;
    }
    
    try {
      tables.qrSessions = await QRSession.count();
      console.log('[Plant Dashboard Test] ✅ QRSession table:', tables.qrSessions, 'records');
    } catch (err) {
      console.error('[Plant Dashboard Test] ❌ QRSession table error:', err.message);
      tables.qrSessions = `ERROR: ${err.message}`;
    }
    
    return res.json({
      success: true,
      message: 'Database test completed',
      data: {
        databaseConnected: true,
        tables
      }
    });
  } catch (error) {
    console.error('[Plant Dashboard Test] ❌ Test failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Database test failed',
        details: error.message,
        stack: error.stack
      }
    });
  }
});

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
    
    // 실제 DB 데이터 사용

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
    const limit = parseInt(req.query.limit) || 10;
    const activities = [];

    // 최근 일상점검 (방어적 처리)
    try {
      const [checks] = await sequelize.query(`
        SELECT dc.id, dc.mold_id, dc.created_at, dc.overall_status,
          m.mold_code, m.mold_name
        FROM daily_checks dc
        LEFT JOIN molds m ON m.id = dc.mold_id
        ORDER BY dc.created_at DESC LIMIT 5
      `);
      checks.forEach(c => activities.push({
        type: 'check', title: '일상점검 완료',
        mold_code: c.mold_code, mold_name: c.mold_name,
        status: c.overall_status, time: c.created_at
      }));
    } catch (e) { console.warn('[PlantDashboard] checks query error:', e.message); }

    // 최근 수리요청 (방어적 처리)
    try {
      const [repairs] = await sequelize.query(`
        SELECT rr.id, rr.mold_id, rr.created_at, rr.status,
          m.mold_code, m.mold_name
        FROM repair_requests rr
        LEFT JOIN molds m ON m.id = rr.mold_id
        ORDER BY rr.created_at DESC LIMIT 5
      `);
      repairs.forEach(r => activities.push({
        type: 'repair', title: '수리 요청',
        mold_code: r.mold_code, mold_name: r.mold_name,
        status: r.status, time: r.created_at
      }));
    } catch (e) { console.warn('[PlantDashboard] repairs query error:', e.message); }

    // 최근 생산 기록 (방어적 처리)
    try {
      const [production] = await sequelize.query(`
        SELECT pq.id, pq.mold_id, pq.created_at, pq.quantity,
          m.mold_code, m.mold_name
        FROM production_quantities pq
        LEFT JOIN molds m ON m.id = pq.mold_id
        ORDER BY pq.created_at DESC LIMIT 5
      `);
      production.forEach(p => activities.push({
        type: 'production', title: '생산 수량 입력',
        mold_code: p.mold_code, mold_name: p.mold_name,
        quantity: p.quantity, time: p.created_at
      }));
    } catch (e) { console.warn('[PlantDashboard] production query error:', e.message); }

    // 정렬
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    return res.json({
      success: true,
      data: { activities: activities.slice(0, limit) }
    });
  } catch (error) {
    console.error('Plant recent activities error:', error);
    return res.json({
      success: true,
      data: { activities: [] }
    });
  }
});

module.exports = router;
