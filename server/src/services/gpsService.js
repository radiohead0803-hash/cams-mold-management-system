/**
 * GPS 서비스
 * - GPS 위치 기록
 * - GPS 이탈 감지
 * - 역지오코딩 (좌표 → 주소)
 */

const { sequelize } = require('../models/newIndex');

// 허용 반경 (미터)
const DEFAULT_ALLOWED_RADIUS = 500; // 500m

/**
 * 두 좌표 간 거리 계산 (Haversine 공식)
 * @param {number} lat1 - 위도1
 * @param {number} lng1 - 경도1
 * @param {number} lat2 - 위도2
 * @param {number} lng2 - 경도2
 * @returns {number} 거리 (미터)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // 지구 반경 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * GPS 위치 기록
 * @param {Object} params - 파라미터
 * @param {number} params.moldId - 금형 ID
 * @param {number} params.userId - 사용자 ID
 * @param {Object} params.gps - GPS 정보 { lat, lng, accuracy, altitude, speed }
 * @param {string} params.actionType - 액션 타입 (qr_scan, daily_check, periodic_check, repair, transfer)
 * @param {string} params.placeName - 장소명 (역지오코딩 결과)
 * @param {Object} params.transaction - Sequelize 트랜잭션
 */
const recordGpsLocation = async ({ moldId, userId, gps, actionType, placeName = null, transaction = null }) => {
  if (!gps || !gps.lat || !gps.lng) {
    console.log('[GPS] No GPS data provided');
    return null;
  }

  try {
    const [result] = await sequelize.query(`
      INSERT INTO gps_locations (
        mold_id, user_id, latitude, longitude, accuracy, altitude, speed,
        action_type, place_name, recorded_at, created_at
      ) VALUES (
        :mold_id, :user_id, :latitude, :longitude, :accuracy, :altitude, :speed,
        :action_type, :place_name, NOW(), NOW()
      )
      RETURNING id
    `, {
      replacements: {
        mold_id: moldId,
        user_id: userId,
        latitude: gps.lat,
        longitude: gps.lng,
        accuracy: gps.accuracy || null,
        altitude: gps.altitude || null,
        speed: gps.speed || null,
        action_type: actionType,
        place_name: placeName
      },
      transaction,
      type: sequelize.QueryTypes.INSERT
    });

    console.log(`[GPS] Location recorded: mold=${moldId}, action=${actionType}, coords=(${gps.lat}, ${gps.lng})`);
    return result?.[0]?.id || null;
  } catch (error) {
    console.error('[GPS] Error recording location:', error.message);
    return null;
  }
};

/**
 * GPS 이탈 감지
 * @param {number} moldId - 금형 ID
 * @param {Object} currentGps - 현재 GPS { lat, lng }
 * @param {number} allowedRadius - 허용 반경 (미터)
 * @returns {Object} { isOutOfRange, distance, registeredLocation }
 */
const checkGpsDeviation = async (moldId, currentGps, allowedRadius = DEFAULT_ALLOWED_RADIUS) => {
  if (!currentGps || !currentGps.lat || !currentGps.lng) {
    return { isOutOfRange: false, distance: null, reason: 'No GPS data' };
  }

  try {
    // 금형의 등록된 위치 조회 (plant_molds 또는 mold_specifications)
    const [registeredLocation] = await sequelize.query(`
      SELECT 
        pm.gps_latitude as lat, 
        pm.gps_longitude as lng,
        pm.location_name,
        c.name as plant_name
      FROM plant_molds pm
      LEFT JOIN companies c ON pm.plant_id = c.id
      WHERE pm.mold_spec_id = :moldId
        AND pm.gps_latitude IS NOT NULL
        AND pm.gps_longitude IS NOT NULL
      LIMIT 1
    `, {
      replacements: { moldId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!registeredLocation || !registeredLocation.lat || !registeredLocation.lng) {
      return { isOutOfRange: false, distance: null, reason: 'No registered location' };
    }

    const distance = calculateDistance(
      currentGps.lat, currentGps.lng,
      registeredLocation.lat, registeredLocation.lng
    );

    const isOutOfRange = distance > allowedRadius;

    if (isOutOfRange) {
      console.log(`[GPS] Deviation detected: mold=${moldId}, distance=${Math.round(distance)}m, allowed=${allowedRadius}m`);
    }

    return {
      isOutOfRange,
      distance: Math.round(distance),
      allowedRadius,
      registeredLocation: {
        lat: registeredLocation.lat,
        lng: registeredLocation.lng,
        name: registeredLocation.location_name || registeredLocation.plant_name
      }
    };
  } catch (error) {
    console.error('[GPS] Error checking deviation:', error.message);
    return { isOutOfRange: false, distance: null, error: error.message };
  }
};

/**
 * GPS 이탈 알람 생성
 * @param {number} moldId - 금형 ID
 * @param {number} userId - 사용자 ID
 * @param {Object} deviationInfo - 이탈 정보
 */
const createGpsDeviationAlert = async (moldId, userId, deviationInfo) => {
  try {
    await sequelize.query(`
      INSERT INTO alerts (
        mold_id, user_id, alert_type, severity, title, message,
        is_read, created_at
      ) VALUES (
        :mold_id, :user_id, 'gps_deviation', 'high',
        'GPS 이탈 감지',
        :message,
        false, NOW()
      )
    `, {
      replacements: {
        mold_id: moldId,
        user_id: userId,
        message: `금형이 등록된 위치에서 ${deviationInfo.distance}m 이탈되었습니다. (허용 반경: ${deviationInfo.allowedRadius}m)`
      },
      type: sequelize.QueryTypes.INSERT
    });

    console.log(`[GPS] Deviation alert created for mold ${moldId}`);
  } catch (error) {
    console.error('[GPS] Error creating deviation alert:', error.message);
  }
};

/**
 * 최근 GPS 기록 조회
 * @param {number} moldId - 금형 ID
 * @param {number} limit - 조회 개수
 */
const getRecentGpsLocations = async (moldId, limit = 10) => {
  try {
    const [locations] = await sequelize.query(`
      SELECT 
        gl.id, gl.latitude, gl.longitude, gl.accuracy, gl.action_type,
        gl.place_name, gl.recorded_at,
        u.name as user_name
      FROM gps_locations gl
      LEFT JOIN users u ON gl.user_id = u.id
      WHERE gl.mold_id = :moldId
      ORDER BY gl.recorded_at DESC
      LIMIT :limit
    `, {
      replacements: { moldId, limit },
      type: sequelize.QueryTypes.SELECT
    });

    return locations || [];
  } catch (error) {
    console.error('[GPS] Error getting recent locations:', error.message);
    return [];
  }
};

/**
 * GPS 통계 조회
 * @param {number} moldId - 금형 ID
 * @param {number} days - 조회 기간 (일)
 */
const getGpsStatistics = async (moldId, days = 30) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT DATE(recorded_at)) as active_days,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(recorded_at) as first_record,
        MAX(recorded_at) as last_record,
        AVG(accuracy) as avg_accuracy
      FROM gps_locations
      WHERE mold_id = :moldId
        AND recorded_at >= CURRENT_DATE - INTERVAL ':days days'
    `, {
      replacements: { moldId, days },
      type: sequelize.QueryTypes.SELECT
    });

    return stats || {};
  } catch (error) {
    console.error('[GPS] Error getting statistics:', error.message);
    return {};
  }
};

module.exports = {
  calculateDistance,
  recordGpsLocation,
  checkGpsDeviation,
  createGpsDeviationAlert,
  getRecentGpsLocations,
  getGpsStatistics,
  DEFAULT_ALLOWED_RADIUS
};
