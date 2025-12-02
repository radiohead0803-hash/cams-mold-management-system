const { Op } = require('sequelize');
const { Mold, User, QrSession, RepairRequest, DailyCheck, PeriodicInspection, sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');

/**
 * 시스템 관리자 대시보드 KPI
 */
const getSystemAdminKpis = async (req, res) => {
  try {
    // 1. 금형 현황 요약
    const moldSummary = {
      total: await Mold.count(),
      inProduction: await Mold.count({ where: { status: 'production' } }),
      underRepair: await Mold.count({ where: { status: 'under_repair' } }),
      inTransit: await Mold.count({ where: { status: 'in_transit' } })
    };

    // 2. 알람 요약 (최근 24시간)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // TODO: QrScanAlert 모델이 있으면 사용, 없으면 임시 데이터
    const alertsSummary = {
      critical: 0,
      major: 0,
      minor: 0
    };

    // 3. GPS 요약
    const gpsSummary = {
      registeredLocations: await Mold.count({
        where: {
          latitude: { [Op.ne]: null },
          longitude: { [Op.ne]: null }
        }
      }),
      outOfArea: await Mold.count({ where: { is_out_of_area: true } })
    };

    // 4. 시스템 상태
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const systemStatus = {
      activeUsers: await User.count({ where: { is_active: true } }),
      todayQrScans: await QrSession.count({
        where: { created_at: { [Op.gte]: today } }
      }),
      dbStatus: 'healthy',
      gpsServiceStatus: 'healthy'
    };

    // 5. 최근 알람 (최근 20개) - 임시로 최근 수리요청으로 대체
    const recentAlerts = await RepairRequest.findAll({
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Mold,
          as: 'mold',
          attributes: ['id', 'mold_number', 'mold_name']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        moldSummary,
        alertsSummary,
        gpsSummary,
        systemStatus,
        recentAlerts: recentAlerts.map(alert => ({
          id: alert.id,
          type: 'repair_request',
          severity: alert.priority || 'normal',
          message: alert.title,
          timestamp: alert.created_at,
          mold: alert.mold,
          user: alert.requester
        }))
      }
    });
  } catch (error) {
    logger.error('System admin dashboard KPI error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load dashboard KPIs' }
    });
  }
};

/**
 * 생산처 대시보드 KPI
 */
const getPlantKpis = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const companyId = user.company_id;

    // 1. 오늘 점검 예정 금형 수 계산
    const moldsAtPlant = await Mold.findAll({
      where: { current_location_company_id: companyId }
    });

    let todayCheckCount = 0;
    for (const mold of moldsAtPlant) {
      // 일상점검 필요 여부
      if (mold.daily_check_interval && mold.current_shot >= (mold.last_daily_check_shot || 0) + mold.daily_check_interval) {
        todayCheckCount++;
        continue;
      }
      // 정기점검 필요 여부
      if (mold.periodic_check_interval && mold.current_shot >= (mold.last_periodic_check_shot || 0) + mold.periodic_check_interval) {
        todayCheckCount++;
      }
    }

    // 2. 미처리 수리요청
    const openRepairCount = await RepairRequest.count({
      where: {
        requester_company_id: companyId,
        status: {
          [Op.in]: ['requested', 'approved', 'assigned', 'in_progress']
        }
      }
    });

    // 3. 최근 7일 NG 금형 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNgMoldCount = await sequelize.query(`
      SELECT COUNT(DISTINCT mold_id) as count
      FROM daily_checks
      WHERE company_id = :companyId
        AND created_at >= :sevenDaysAgo
        AND ng_count > 0
    `, {
      replacements: { companyId, sevenDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    // 4. 사용 중 금형 수
    const activeMoldCount = await Mold.count({
      where: {
        current_location_company_id: companyId,
        status: 'production'
      }
    });

    // 5. 오늘 점검해야 할 금형 목록
    const todayChecks = [];
    for (const mold of moldsAtPlant.slice(0, 10)) {
      const needsDailyCheck = mold.daily_check_interval &&
        mold.current_shot >= (mold.last_daily_check_shot || 0) + mold.daily_check_interval;
      const needsPeriodicCheck = mold.periodic_check_interval &&
        mold.current_shot >= (mold.last_periodic_check_shot || 0) + mold.periodic_check_interval;

      if (needsDailyCheck || needsPeriodicCheck) {
        todayChecks.push({
          moldId: mold.id,
          moldCode: mold.mold_number,
          moldName: mold.mold_name,
          checkType: needsDailyCheck ? 'daily' : 'periodic',
          dueShot: needsDailyCheck ?
            (mold.last_daily_check_shot || 0) + mold.daily_check_interval :
            (mold.last_periodic_check_shot || 0) + mold.periodic_check_interval,
          currentShot: mold.current_shot
        });
      }
    }

    // 6. 수리 진행 현황
    const repairs = await RepairRequest.findAll({
      where: {
        requester_company_id: companyId,
        status: {
          [Op.in]: ['requested', 'approved', 'assigned', 'in_progress']
        }
      },
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [
        { model: Mold, as: 'mold', attributes: ['mold_number'] },
        { model: User, as: 'assignedTo', attributes: ['name', 'company_name'] }
      ]
    });

    // 7. 최근 NG 알림
    const recentNg = await sequelize.query(`
      SELECT 
        m.mold_number as "moldCode",
        m.mold_name as "moldName",
        'NG 발생' as "ngSummary",
        dc.created_at as "checkedAt"
      FROM daily_checks dc
      JOIN molds m ON m.id = dc.mold_id
      WHERE dc.company_id = :companyId
        AND dc.created_at >= :sevenDaysAgo
        AND dc.ng_count > 0
      ORDER BY dc.created_at DESC
      LIMIT 10
    `, {
      replacements: { companyId, sevenDaysAgo },
      type: sequelize.QueryTypes.SELECT
    });

    // 8. 금형 위치
    const locations = await Mold.findAll({
      where: {
        current_location_company_id: companyId,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      },
      attributes: ['id', 'mold_number', 'latitude', 'longitude', 'status']
    });

    res.json({
      success: true,
      data: {
        kpi: {
          todayCheckCount,
          openRepairCount,
          recentNgMoldCount: parseInt(recentNgMoldCount[0]?.count || 0),
          activeMoldCount
        },
        todayChecks,
        repairs: repairs.map(r => ({
          id: r.id,
          moldCode: r.mold?.mold_number,
          title: r.title,
          status: r.status,
          makerName: r.assignedTo?.company_name || '-',
          requestedAt: r.created_at,
          daysElapsed: Math.floor((new Date() - new Date(r.created_at)) / (1000 * 60 * 60 * 24))
        })),
        recentNg,
        locations: locations.map(l => ({
          moldId: l.id,
          moldCode: l.mold_number,
          lat: parseFloat(l.latitude),
          lng: parseFloat(l.longitude),
          status: l.status
        }))
      }
    });
  } catch (error) {
    logger.error('Plant dashboard KPI error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load plant dashboard KPIs' }
    });
  }
};

/**
 * 제작처 대시보드 KPI
 */
const getMakerKpis = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const companyId = user.company_id;

    // 1. 진행 중 개발금형 수
    const devMoldCount = await Mold.count({
      where: {
        manufacturer_id: companyId,
        status: {
          [Op.in]: ['design', 'manufacturing', 'trial']
        }
      }
    });

    // 2. 승인대기 개발계획 (임시)
    const pendingDevPlanCount = 0;

    // 3. 승인대기 경도/TRY-OUT (임시)
    const pendingHardnessTryoutCount = 0;

    // 4. 제작처 귀책률 (최근 6개월)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const blameStats = await RepairRequest.findAll({
      attributes: [
        'blame_party',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        blame_confirmed: true,
        closed_at: { [Op.gte]: sixMonthsAgo }
      },
      group: ['blame_party'],
      raw: true
    });

    const totalBlame = blameStats.reduce((sum, item) => sum + parseInt(item.count), 0);
    const makerBlame = blameStats.find(item => item.blame_party === 'maker');
    const makerBlamePercentage = makerBlame ? Math.round((parseInt(makerBlame.count) / totalBlame) * 100) : 0;

    // 5. 개발금형 목록
    const devMolds = await Mold.findAll({
      where: {
        manufacturer_id: companyId,
        status: {
          [Op.in]: ['design', 'manufacturing', 'trial']
        }
      },
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    // 6. 배정된 수리요청
    const assignedRepairs = await RepairRequest.findAll({
      where: {
        assigned_to_company_id: companyId,
        status: {
          [Op.in]: ['assigned', 'in_progress']
        }
      },
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [
        { model: Mold, as: 'mold', attributes: ['mold_number'] }
      ]
    });

    res.json({
      success: true,
      data: {
        kpi: {
          devMoldCount,
          pendingDevPlanCount,
          pendingHardnessTryoutCount,
          makerBlamePercentage
        },
        devMolds: devMolds.map(m => ({
          moldId: m.id,
          moldCode: m.mold_number,
          moldName: m.mold_name,
          stage: m.stage || 'P1',
          devPlanStatus: 'draft',
          checklistStatus: 'draft',
          hardnessStatus: 'draft',
          tryoutStatus: 'draft'
        })),
        assignedRepairs: assignedRepairs.map(r => ({
          id: r.id,
          moldCode: r.mold?.mold_number,
          title: r.title,
          status: r.status,
          assignedAt: r.assigned_at
        })),
        blameStats: {
          total: totalBlame,
          maker: parseInt(makerBlame?.count || 0),
          makerPercentage: makerBlamePercentage
        }
      }
    });
  } catch (error) {
    logger.error('Maker dashboard KPI error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load maker dashboard KPIs' }
    });
  }
};

/**
 * 금형개발 담당 대시보드 KPI
 */
const getDeveloperKpis = async (req, res) => {
  try {
    // 1. 단계별 금형 현황
    const moldSummary = {
      design: await Mold.count({ where: { status: 'design' } }),
      manufacturing: await Mold.count({ where: { status: 'manufacturing' } }),
      trial: await Mold.count({ where: { status: 'trial' } }),
      production: await Mold.count({ where: { status: 'production' } }),
      retired: await Mold.count({ where: { status: 'retired' } })
    };

    // 2. 승인 대기 목록 (임시)
    const pendingApprovals = {
      design: 0,
      tryout: 0,
      liability: 0
    };

    // 3. 최근 금형 등록
    const recentMolds = await Mold.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'mold_number', 'mold_name', 'status', 'created_at']
    });

    res.json({
      success: true,
      data: {
        moldSummary,
        pendingApprovals,
        recentMolds: recentMolds.map(m => ({
          id: m.id,
          moldCode: m.mold_number,
          moldName: m.mold_name,
          status: m.status,
          createdAt: m.created_at
        }))
      }
    });
  } catch (error) {
    logger.error('Developer dashboard KPI error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to load developer dashboard KPIs' }
    });
  }
};

module.exports = {
  getSystemAdminKpis,
  getPlantKpis,
  getMakerKpis,
  getDeveloperKpis
};
