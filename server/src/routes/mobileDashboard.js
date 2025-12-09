const express = require('express');
const { Op } = require('sequelize');
const { 
  Mold, DailyCheck, Repair, ProductionQuantity, QRSession, 
  Notification, User, Inspection, Alert, MoldSpecification,
  sequelize 
} = require('../models/newIndex');

const router = express.Router();

/**
 * GET /api/v1/mobile/dashboard/:role
 * 역할별 모바일 대시보드 데이터
 */
router.get('/dashboard/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user?.id || 1;
    const companyId = req.user?.company_id || 1;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    let dashboardData = {};

    switch (role) {
      case 'developer':
      case 'mold_developer':
      case 'system_admin':
        // 금형개발 담당 대시보드
        dashboardData = await getDeveloperDashboard(startOfToday, startOfMonth);
        break;

      case 'maker':
        // 제작처 대시보드
        dashboardData = await getMakerDashboard(companyId, startOfToday);
        break;

      case 'plant':
      case 'production':
        // 생산처 대시보드
        dashboardData = await getPlantDashboard(companyId, startOfToday, startOfMonth);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 역할입니다.'
        });
    }

    return res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('[Mobile Dashboard] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '대시보드 데이터 조회 중 오류가 발생했습니다.' }
    });
  }
});

/**
 * 금형개발 담당 대시보드
 */
async function getDeveloperDashboard(startOfToday, startOfMonth) {
  try {
    // 전체 금형 수
    const totalMolds = await Mold.count().catch(() => 0);
    
    // 양산 중 금형
    const activeMolds = await Mold.count({
      where: { status: { [Op.in]: ['active', 'in_production', 'production'] } }
    }).catch(() => 0);

    // 개발 중 금형 (mold_specifications에서)
    const developingMolds = await MoldSpecification.count({
      where: { status: { [Op.in]: ['draft', 'planning', 'in_development'] } }
    }).catch(() => 0);

    // NG 상태 금형
    const ngMolds = await Mold.count({
      where: { status: { [Op.in]: ['ng', 'NG', 'defective'] } }
    }).catch(() => 0);

    // 진행 중 수리요청
    const pendingRepairs = await Repair.count({
      where: { status: { [Op.notIn]: ['completed', 'rejected'] } }
    }).catch(() => 0);

    // 승인 대기 건
    const pendingApprovals = await Repair.count({
      where: { status: 'liability_review' }
    }).catch(() => 0);

    // 오늘 QR 스캔 수
    const todayScans = await QRSession.count({
      where: { created_at: { [Op.gte]: startOfToday } }
    }).catch(() => 0);

    // 정기검사 필요 금형
    const inspectionDue = await Inspection.count({
      where: {
        inspection_type: 'periodic',
        status: 'scheduled',
        inspection_date: { [Op.lte]: new Date() }
      }
    }).catch(() => 0);

    // 최근 알림
    const recentAlerts = await Notification.findAll({
      where: { created_at: { [Op.gte]: startOfToday } },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'message', 'priority', 'created_at']
    }).catch(() => []);

    // 최근 금형 목록
    const recentMolds = await MoldSpecification.findAll({
      order: [['updated_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'mold_code', 'part_name', 'car_model', 'status', 'updated_at']
    }).catch(() => []);

    return {
      role: 'developer',
      summary: {
        totalMolds,
        activeMolds,
        developingMolds,
        ngMolds,
        pendingRepairs,
        pendingApprovals,
        todayScans,
        inspectionDue
      },
      recentAlerts,
      recentMolds
    };
  } catch (error) {
    console.error('[Developer Dashboard] Error:', error);
    return getMockDeveloperDashboard();
  }
}

/**
 * 제작처 대시보드
 */
async function getMakerDashboard(companyId, startOfToday) {
  try {
    // 담당 금형 수
    const assignedMolds = await MoldSpecification.count({
      where: { target_maker_id: companyId }
    }).catch(() => 0);

    // 제작 진행 중
    const inProduction = await MoldSpecification.count({
      where: {
        target_maker_id: companyId,
        status: { [Op.in]: ['in_development', 'manufacturing'] }
      }
    }).catch(() => 0);

    // 수리 요청 대기
    const repairRequests = await Repair.count({
      where: {
        assigned_maker_id: companyId,
        status: { [Op.in]: ['requested', 'approved'] }
      }
    }).catch(() => 0);

    // 수리 진행 중
    const repairInProgress = await Repair.count({
      where: {
        assigned_maker_id: companyId,
        status: 'in_repair'
      }
    }).catch(() => 0);

    // 완료 대기 (검수 필요)
    const pendingInspection = await MoldSpecification.count({
      where: {
        target_maker_id: companyId,
        status: 'inspection_pending'
      }
    }).catch(() => 0);

    // 오늘 작업 완료
    const todayCompleted = await Repair.count({
      where: {
        assigned_maker_id: companyId,
        status: 'completed',
        updated_at: { [Op.gte]: startOfToday }
      }
    }).catch(() => 0);

    // 최근 작업 목록
    const recentWorks = await Repair.findAll({
      where: { assigned_maker_id: companyId },
      order: [['updated_at', 'DESC']],
      limit: 5,
      include: [{
        model: Mold,
        as: 'mold',
        attributes: ['id', 'mold_code', 'mold_name']
      }]
    }).catch(() => []);

    // 담당 금형 목록
    const assignedMoldList = await MoldSpecification.findAll({
      where: { target_maker_id: companyId },
      order: [['updated_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'mold_code', 'part_name', 'car_model', 'status', 'target_delivery_date']
    }).catch(() => []);

    return {
      role: 'maker',
      summary: {
        assignedMolds,
        inProduction,
        repairRequests,
        repairInProgress,
        pendingInspection,
        todayCompleted
      },
      recentWorks,
      assignedMoldList
    };
  } catch (error) {
    console.error('[Maker Dashboard] Error:', error);
    return getMockMakerDashboard();
  }
}

/**
 * 생산처 대시보드
 */
async function getPlantDashboard(companyId, startOfToday, startOfMonth) {
  try {
    // 배치된 금형 수
    const totalMolds = await Mold.count().catch(() => 0);

    // 가동 중 금형
    const activeMolds = await Mold.count({
      where: { status: { [Op.in]: ['active', 'in_production', 'production'] } }
    }).catch(() => 0);

    // 오늘 일상점검 완료
    const todayChecks = await DailyCheck.count({
      where: { created_at: { [Op.gte]: startOfToday } }
    }).catch(() => 0);

    // 점검 필요 금형 (오늘 미점검)
    const needsCheck = Math.max(0, activeMolds - todayChecks);

    // 진행 중 수리요청
    const pendingRepairs = await Repair.count({
      where: { status: { [Op.notIn]: ['completed', 'rejected'] } }
    }).catch(() => 0);

    // 오늘 생산 수량
    const todayProduction = await ProductionQuantity.sum('quantity', {
      where: { production_date: { [Op.gte]: startOfToday } }
    }).catch(() => 0) || 0;

    // 이번 달 생산 수량
    const monthlyProduction = await ProductionQuantity.sum('quantity', {
      where: { production_date: { [Op.gte]: startOfMonth } }
    }).catch(() => 0) || 0;

    // 오늘 QR 스캔 수
    const todayScans = await QRSession.count({
      where: { created_at: { [Op.gte]: startOfToday } }
    }).catch(() => 0);

    // NG 발생 금형
    const ngMolds = await Mold.count({
      where: { status: { [Op.in]: ['ng', 'NG', 'defective'] } }
    }).catch(() => 0);

    // 이관 대기 금형
    const transferPending = 0; // Transfer 모델이 있으면 조회

    // 최근 점검 목록
    const recentChecks = await DailyCheck.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [{
        model: Mold,
        as: 'mold',
        attributes: ['id', 'mold_code', 'mold_name']
      }]
    }).catch(() => []);

    // 금형 목록
    const moldList = await Mold.findAll({
      order: [['updated_at', 'DESC']],
      limit: 10,
      attributes: ['id', 'mold_code', 'mold_name', 'status', 'current_shots', 'target_shots', 'location']
    }).catch(() => []);

    return {
      role: 'plant',
      summary: {
        totalMolds,
        activeMolds,
        todayChecks,
        needsCheck,
        pendingRepairs,
        todayProduction,
        monthlyProduction,
        todayScans,
        ngMolds,
        transferPending
      },
      recentChecks,
      moldList
    };
  } catch (error) {
    console.error('[Plant Dashboard] Error:', error);
    return getMockPlantDashboard();
  }
}

// Mock 데이터 (DB 연결 실패 시)
function getMockDeveloperDashboard() {
  return {
    role: 'developer',
    summary: {
      totalMolds: 150,
      activeMolds: 120,
      developingMolds: 15,
      ngMolds: 3,
      pendingRepairs: 12,
      pendingApprovals: 5,
      todayScans: 89,
      inspectionDue: 8
    },
    recentAlerts: [],
    recentMolds: []
  };
}

function getMockMakerDashboard() {
  return {
    role: 'maker',
    summary: {
      assignedMolds: 25,
      inProduction: 8,
      repairRequests: 5,
      repairInProgress: 3,
      pendingInspection: 2,
      todayCompleted: 1
    },
    recentWorks: [],
    assignedMoldList: []
  };
}

function getMockPlantDashboard() {
  return {
    role: 'plant',
    summary: {
      totalMolds: 80,
      activeMolds: 65,
      todayChecks: 45,
      needsCheck: 20,
      pendingRepairs: 8,
      todayProduction: 5000,
      monthlyProduction: 150000,
      todayScans: 56,
      ngMolds: 2,
      transferPending: 1
    },
    recentChecks: [],
    moldList: []
  };
}

/**
 * GET /api/v1/mobile/dashboard/molds
 * 모바일용 금형 목록 (역할별 필터링)
 */
router.get('/dashboard/molds', async (req, res) => {
  try {
    const { role, status, limit = 20 } = req.query;
    const companyId = req.user?.company_id || 1;

    let where = {};
    
    if (status) {
      where.status = status;
    }

    const molds = await Mold.findAll({
      where,
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      attributes: [
        'id', 'mold_code', 'mold_name', 'car_model', 'part_name',
        'status', 'current_shots', 'target_shots', 'location'
      ]
    });

    return res.json({
      success: true,
      data: { molds }
    });

  } catch (error) {
    console.error('[Mobile Dashboard Molds] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: '금형 목록 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
