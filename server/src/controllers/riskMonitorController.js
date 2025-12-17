/**
 * 운영 리스크 모니터링 컨트롤러
 * 점검 미이행, GPS 미수신, 타수 미입력 등 운영 리스크 집계
 */
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 리스크 현황 요약 조회
 * GET /api/v1/risk-monitor/summary
 */
const getRiskSummary = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    
    // 실제 DB 쿼리 대신 집계 데이터 반환 (추후 실제 쿼리로 교체)
    const summary = {
      inspection_overdue: {
        count: 0,
        label: '점검 미완료',
        severity: 'high',
        description: '예정일이 지난 점검 건수'
      },
      gps_offline: {
        count: 0,
        label: 'GPS 미수신',
        severity: 'medium',
        description: '1시간 이상 GPS 신호 없는 금형'
      },
      shot_missing: {
        count: 0,
        label: '타수 미입력',
        severity: 'low',
        description: '최근 7일간 타수 미입력 금형'
      },
      photo_missing: {
        count: 0,
        label: '사진 누락',
        severity: 'low',
        description: '점검 시 사진 미첨부 건수'
      },
      approval_pending: {
        count: 0,
        label: '승인 지연',
        severity: 'medium',
        description: 'SLA 초과 승인 대기 건수'
      },
      repair_pending: {
        count: 0,
        label: '수리 대기',
        severity: 'high',
        description: '7일 이상 수리 대기 건수'
      }
    };

    // 실제 데이터 조회 시도
    try {
      // 승인 대기 건수 (Approval 모델이 있는 경우)
      const Approval = require('../models/Approval')(sequelize);
      const pendingApprovals = await Approval.count({
        where: { status: 'pending' }
      });
      summary.approval_pending.count = pendingApprovals;
    } catch (e) {
      // 모델이 없으면 0 유지
    }

    const totalRisks = Object.values(summary).reduce((sum, item) => sum + item.count, 0);
    const highSeverityCount = Object.values(summary)
      .filter(item => item.severity === 'high')
      .reduce((sum, item) => sum + item.count, 0);

    res.json({
      success: true,
      data: {
        summary,
        totalRisks,
        highSeverityCount,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('리스크 요약 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '리스크 현황을 불러올 수 없습니다.' }
    });
  }
};

/**
 * 점검 미완료 목록 조회
 * GET /api/v1/risk-monitor/inspection-overdue
 */
const getInspectionOverdue = async (req, res) => {
  try {
    // 실제 DB 쿼리로 교체 필요
    res.json({
      success: true,
      data: {
        items: [],
        total: 0
      }
    });
  } catch (error) {
    logger.error('점검 미완료 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '점검 미완료 목록을 불러올 수 없습니다.' }
    });
  }
};

/**
 * GPS 미수신 금형 목록 조회
 * GET /api/v1/risk-monitor/gps-offline
 */
const getGpsOffline = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        items: [],
        total: 0
      }
    });
  } catch (error) {
    logger.error('GPS 미수신 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: 'GPS 미수신 목록을 불러올 수 없습니다.' }
    });
  }
};

/**
 * 타수 미입력 금형 목록 조회
 * GET /api/v1/risk-monitor/shot-missing
 */
const getShotMissing = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        items: [],
        total: 0
      }
    });
  } catch (error) {
    logger.error('타수 미입력 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '타수 미입력 목록을 불러올 수 없습니다.' }
    });
  }
};

/**
 * 승인 지연 목록 조회
 * GET /api/v1/risk-monitor/approval-delayed
 */
const getApprovalDelayed = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    
    let items = [];
    try {
      const Approval = require('../models/Approval')(sequelize);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      items = await Approval.findAll({
        where: {
          status: 'pending',
          requested_at: { [Op.lt]: threeDaysAgo }
        },
        order: [['requested_at', 'ASC']],
        limit: 50
      });
    } catch (e) {
      // 모델이 없으면 빈 배열
    }

    res.json({
      success: true,
      data: {
        items,
        total: items.length
      }
    });
  } catch (error) {
    logger.error('승인 지연 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 지연 목록을 불러올 수 없습니다.' }
    });
  }
};

module.exports = {
  getRiskSummary,
  getInspectionOverdue,
  getGpsOffline,
  getShotMissing,
  getApprovalDelayed
};
