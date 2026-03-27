/**
 * GPS 통합 이력 로거
 * - gps_location_logs 테이블에 모든 GPS 이벤트를 기록
 * - mold_specifications의 현재 위치를 업데이트
 * - 비차단(non-blocking) — 실패 시에도 null 반환
 */

const { sequelize } = require('../models/newIndex');

/**
 * GPS 이력 기록
 * @param {Object} params
 * @param {number} params.moldId - 금형 ID
 * @param {number} params.userId - 사용자 ID
 * @param {string} params.eventType - 이벤트 유형 (qr_scan, daily_check, periodic_check, repair_request, transfer, scrapping)
 * @param {number} params.latitude - 위도
 * @param {number} params.longitude - 경도
 * @param {string} [params.locationName] - 장소명
 * @param {number} [params.accuracy] - GPS 정확도 (미터)
 * @returns {Promise<number|null>} 생성된 로그 ID 또는 null
 */
async function logGPS({ moldId, userId, eventType, latitude, longitude, locationName, accuracy }) {
  if (!latitude || !longitude) return null;

  try {
    // 1. GPS 이력 기록
    const [result] = await sequelize.query(
      `INSERT INTO gps_location_logs (mold_id, user_id, event_type, latitude, longitude, location_name, accuracy, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
      { bind: [moldId || null, userId || null, eventType, latitude, longitude, locationName || null, accuracy || null] }
    );

    // 2. 금형 현재 위치 업데이트 (moldId가 있는 경우)
    if (moldId) {
      await sequelize.query(
        `UPDATE mold_specifications
         SET current_latitude = $1,
             current_longitude = $2,
             last_location_update = NOW(),
             last_scan_location = $3
         WHERE id = $4`,
        { bind: [latitude, longitude, locationName || null, moldId] }
      ).catch((err) => {
        console.warn('[GPS Logger] Failed to update mold location:', err.message);
      });
    }

    const logId = result[0]?.id || null;
    console.log(`[GPS Logger] Recorded: event=${eventType}, mold=${moldId}, coords=(${latitude}, ${longitude}), id=${logId}`);
    return logId;
  } catch (e) {
    console.error('[GPS Logger] Error:', e.message);
    return null;
  }
}

/**
 * 금형별 GPS 이력 조회
 * @param {number} moldId - 금형 ID
 * @param {Object} [options]
 * @param {number} [options.limit=20] - 조회 개수
 * @param {number} [options.offset=0] - 오프셋
 * @param {string} [options.eventType] - 이벤트 유형 필터
 * @returns {Promise<Array>}
 */
async function getGPSHistory(moldId, options = {}) {
  const { limit = 20, offset = 0, eventType } = options;

  try {
    let whereClause = 'WHERE gl.mold_id = $1';
    const binds = [moldId];
    let bindIdx = 2;

    if (eventType) {
      whereClause += ` AND gl.event_type = $${bindIdx++}`;
      binds.push(eventType);
    }

    binds.push(limit, offset);

    const [rows] = await sequelize.query(`
      SELECT gl.id, gl.mold_id, gl.user_id, gl.event_type,
             gl.latitude, gl.longitude, gl.location_name,
             gl.accuracy, gl.created_at,
             u.name AS user_name
      FROM gps_location_logs gl
      LEFT JOIN users u ON gl.user_id = u.id
      ${whereClause}
      ORDER BY gl.created_at DESC
      LIMIT $${bindIdx++} OFFSET $${bindIdx++}
    `, { bind: binds });

    return rows || [];
  } catch (e) {
    console.error('[GPS Logger] getGPSHistory error:', e.message);
    return [];
  }
}

/**
 * 최근 GPS 로그 조회 (전체)
 * @param {Object} [options]
 * @param {number} [options.limit=50] - 조회 개수
 * @param {string} [options.eventType] - 이벤트 유형 필터
 * @returns {Promise<Array>}
 */
async function getRecentGPSLogs(options = {}) {
  const { limit = 50, eventType } = options;

  try {
    let whereClause = '';
    const binds = [];
    let bindIdx = 1;

    if (eventType) {
      whereClause = `WHERE gl.event_type = $${bindIdx++}`;
      binds.push(eventType);
    }

    binds.push(limit);

    const [rows] = await sequelize.query(`
      SELECT gl.id, gl.mold_id, gl.user_id, gl.event_type,
             gl.latitude, gl.longitude, gl.location_name,
             gl.accuracy, gl.created_at,
             u.name AS user_name,
             ms.mold_code, ms.part_name
      FROM gps_location_logs gl
      LEFT JOIN users u ON gl.user_id = u.id
      LEFT JOIN mold_specifications ms ON gl.mold_id = ms.id
      ${whereClause}
      ORDER BY gl.created_at DESC
      LIMIT $${bindIdx++}
    `, { bind: binds });

    return rows || [];
  } catch (e) {
    console.error('[GPS Logger] getRecentGPSLogs error:', e.message);
    return [];
  }
}

module.exports = { logGPS, getGPSHistory, getRecentGPSLogs };
