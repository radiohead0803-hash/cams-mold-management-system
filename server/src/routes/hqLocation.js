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
    
    // 🔥 임시: Mock 데이터 반환 (DB 에러 우회)
    const USE_MOCK_DATA = false; // 실제 DB 사용으로 변경
    
    if (USE_MOCK_DATA) {
      console.log('[GPS Locations] Using MOCK data');
      
      // 한국 주요 자동차 공장 실제 GPS 좌표
      const mockLocations = [
        { id: 1, code: 'M2024-001', name: 'K5 프론트 범퍼', lat: 35.5384, lng: 129.3114, location: '현대 울산공장', drift: false },
        { id: 2, code: 'M2024-002', name: '쏘나타 리어 범퍼', lat: 37.2636, lng: 126.9780, location: '기아 화성공장', drift: false },
        { id: 3, code: 'M2024-003', name: '아반떼 펜더', lat: 37.5085, lng: 126.7224, location: 'GM 부평공장', drift: false },
        { id: 4, code: 'M2024-004', name: 'G80 도어 패널', lat: 35.0995, lng: 128.9903, location: '르노삼성 부산공장', drift: false },
        { id: 5, code: 'M2024-005', name: '그랜저 후드', lat: 36.9921, lng: 127.0889, location: '쌍용 평택공장', drift: false },
        { id: 6, code: 'M2024-006', name: '투싼 트렁크', lat: 36.7836, lng: 127.0660, location: '현대 아산공장', drift: false },
        { id: 7, code: 'M2024-007', name: '스포티지 미러', lat: 37.2411, lng: 126.9644, location: '기아 소하리공장', drift: false },
        { id: 8, code: 'M2024-008', name: '셀토스 그릴', lat: 35.8242, lng: 127.1478, location: '현대 전주공장', drift: false },
        { id: 9, code: 'M2024-009', name: 'GV70 헤드램프', lat: 37.5665, lng: 126.9780, location: '서울 시청', drift: true },
        { id: 10, code: 'M2024-010', name: 'EV6 테일램프', lat: 33.4996, lng: 126.5312, location: '제주도', drift: true },
      ];
      
      const items = mockLocations.map(loc => ({
        mold_id: loc.id,
        mold_code: loc.code,
        mold_name: loc.name,
        latitude: loc.lat,
        longitude: loc.lng,
        current_location: loc.location,
        has_drift: loc.drift,
        last_gps_time: new Date().toISOString()
      }));
      
      return res.json({
        success: true,
        data: { items }
      });
    }
    
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
