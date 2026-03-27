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
    console.log('[GPS Locations] Request received');

    // 실제 DB 쿼리 - 새로운 GPS 필드 사용
    const molds = await Mold.findAll({
      attributes: [
        'id', 
        'mold_code', 
        'mold_name', 
        'status', 
        'location',
        'last_gps_lat',
        'last_gps_lng',
        'last_gps_time',
        'location_status',
        'base_gps_lat',
        'base_gps_lng'
      ]
    }).catch(err => {
      console.error('[GPS Locations] Mold query error:', err);
      return [];
    });

    if (molds.length === 0) {
      console.log('[GPS Locations] No molds found, returning empty array');
      return res.json({
        success: true,
        data: { items: [] }
      });
    }

    // 결과 조합 - location_status 기반
    const items = molds
      .filter(mold => mold.last_gps_lat && mold.last_gps_lng) // GPS 좌표가 있는 것만
      .map(mold => ({
        id: mold.id,
        mold_id: mold.id,
        mold_code: mold.mold_code,
        mold_name: mold.mold_name,
        latitude: parseFloat(mold.last_gps_lat),
        longitude: parseFloat(mold.last_gps_lng),
        current_location: mold.location || '미등록',
        registered_location: mold.location,
        has_drift: mold.location_status === 'moved',
        location_status: mold.location_status || 'normal',
        last_gps_time: mold.last_gps_time,
        base_gps_lat: mold.base_gps_lat ? parseFloat(mold.base_gps_lat) : null,
        base_gps_lng: mold.base_gps_lng ? parseFloat(mold.base_gps_lng) : null
      }));

    console.log(`[GPS Locations] Returning ${items.length} locations`);

    return res.json({
      success: true,
      data: { items }
    });

  } catch (error) {
    console.error('[GPS Locations] Error:', error);
    console.error('[GPS Locations] Stack:', error.stack);
    
    // 에러 시에도 빈 배열 반환
    return res.json({
      success: true,
      data: { items: [] }
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
