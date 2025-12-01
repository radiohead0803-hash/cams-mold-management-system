const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { Mold, GPSLocation, Alert } = require('../models/newIndex');

// 개발 환경에서는 인증 스킵
// router.use(authenticate, authorize(['system_admin', 'mold_developer']));

/**
 * GET /api/v1/hq/mold-locations
 * 금형 위치 및 위치 이탈 정보 조회
 */
router.get('/mold-locations', async (req, res) => {
  try {
    // 1. 모든 금형 조회
    const molds = await Mold.findAll({
      attributes: ['id', 'mold_code', 'mold_name', 'status', 'company_id', 'location']
    });

    const moldIds = molds.map(m => m.id);

    // 2. 각 금형의 최신 GPS 위치 조회
    const allLocations = await GPSLocation.findAll({
      where: { mold_id: moldIds },
      order: [['recorded_at', 'DESC']]
    });

    // 3. 미해결 위치 이탈 알람 조회
    const alerts = await Alert.findAll({
      where: {
        alert_type: 'gps_drift',
        is_resolved: false,
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 최근 30일
        }
      },
      order: [['created_at', 'DESC']]
    });

    // 4. 금형별로 최신 위치 매핑
    const latestLocByMold = new Map();
    for (const loc of allLocations) {
      if (!latestLocByMold.has(loc.mold_id)) {
        latestLocByMold.set(loc.mold_id, loc);
      }
    }

    // 5. 금형별로 최신 알람 매핑
    const latestAlertByMold = new Map();
    for (const alert of alerts) {
      const moldId = alert.metadata?.mold_id;
      if (!moldId) continue;
      if (!latestAlertByMold.has(moldId)) {
        latestAlertByMold.set(moldId, alert);
      }
    }

    // 6. 결과 조합
    const result = molds.map(mold => {
      const loc = latestLocByMold.get(mold.id);
      const alert = latestAlertByMold.get(mold.id);

      return {
        id: mold.id,
        mold_code: mold.mold_code,
        mold_name: mold.mold_name,
        status: mold.status,
        company_id: mold.company_id,
        base_location: mold.location, // 기본 텍스트 위치
        gps: loc ? {
          latitude: loc.latitude,
          longitude: loc.longitude,
          recorded_at: loc.recorded_at
        } : null,
        gps_alert: alert ? {
          alert_id: alert.id,
          severity: alert.severity,
          message: alert.message,
          created_at: alert.created_at,
          metadata: alert.metadata
        } : null
      };
    });

    return res.json({
      success: true,
      data: {
        molds: result
      }
    });

  } catch (error) {
    console.error('Mold locations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '금형 위치 조회 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * PATCH /api/v1/hq/alerts/:id/resolve
 * 알람 해결 처리
 */
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_comment } = req.body;

    const alert = await Alert.findByPk(id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          message: '알람을 찾을 수 없습니다.'
        }
      });
    }

    alert.is_resolved = true;
    alert.resolved_at = new Date();
    
    if (resolution_comment) {
      alert.metadata = {
        ...alert.metadata,
        resolution_comment
      };
    }
    
    await alert.save();

    return res.json({
      success: true,
      data: {
        alert
      }
    });

  } catch (error) {
    console.error('Alert resolve error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '알람 해결 처리 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
