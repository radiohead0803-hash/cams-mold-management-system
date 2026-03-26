const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Haversine 공식으로 두 GPS 좌표 사이 거리(미터) 계산
function calculateDistanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/v1/mold-locations/realtime
 * 전체 금형 실시간 위치 조회 (GPS 좌표가 있는 금형만)
 */
router.get('/realtime', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { status, has_drift, plant_id } = req.query;

    let whereClause = 'WHERE m.last_gps_lat IS NOT NULL AND m.last_gps_lng IS NOT NULL';
    const binds = [];
    
    if (status) {
      binds.push(status);
      whereClause += ` AND m.status = $${binds.length}`;
    }
    if (has_drift === 'true') {
      whereClause += ` AND m.location_status = 'moved'`;
    }
    if (plant_id) {
      binds.push(parseInt(plant_id));
      whereClause += ` AND m.plant_id = $${binds.length}`;
    }

    const [rows] = await sequelize.query(
      `SELECT 
        m.id, m.mold_code, m.mold_name, m.status, m.location,
        m.last_gps_lat, m.last_gps_lng, m.last_gps_time,
        m.last_gps_accuracy, m.last_gps_source, m.location_status,
        m.base_gps_lat, m.base_gps_lng, m.drift_threshold_m,
        m.plant_id, m.current_shots,
        (SELECT COUNT(*) FROM mold_location_logs WHERE mold_id = m.id) as log_count,
        (SELECT MAX(scanned_at) FROM mold_location_logs WHERE mold_id = m.id) as last_log_time
      FROM molds m
      ${whereClause}
      ORDER BY m.last_gps_time DESC NULLS LAST`,
      { bind: binds }
    );

    const items = rows.map(row => {
      let distance = null;
      if (row.base_gps_lat && row.base_gps_lng) {
        distance = Math.round(calculateDistanceM(
          parseFloat(row.base_gps_lat), parseFloat(row.base_gps_lng),
          parseFloat(row.last_gps_lat), parseFloat(row.last_gps_lng)
        ));
      }
      return {
        mold_id: row.id,
        mold_code: row.mold_code,
        mold_name: row.mold_name,
        status: row.status,
        location: row.location,
        latitude: parseFloat(row.last_gps_lat),
        longitude: parseFloat(row.last_gps_lng),
        accuracy: row.last_gps_accuracy ? parseFloat(row.last_gps_accuracy) : null,
        last_gps_time: row.last_gps_time,
        gps_source: row.last_gps_source,
        location_status: row.location_status || 'normal',
        has_drift: row.location_status === 'moved',
        base_latitude: row.base_gps_lat ? parseFloat(row.base_gps_lat) : null,
        base_longitude: row.base_gps_lng ? parseFloat(row.base_gps_lng) : null,
        drift_threshold_m: row.drift_threshold_m || 500,
        distance_from_base_m: distance,
        log_count: parseInt(row.log_count || 0),
        last_log_time: row.last_log_time,
        current_shots: row.current_shots
      };
    });

    const driftCount = items.filter(i => i.has_drift).length;

    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        drift_count: driftCount,
        normal_count: items.length - driftCount
      }
    });
  } catch (error) {
    console.error('실시간 위치 조회 오류:', error);
    res.status(500).json({ success: false, message: '위치 조회 실패', error: error.message });
  }
});

/**
 * GET /api/v1/mold-locations/history/:moldId
 * 특정 금형의 위치 이력 조회
 */
router.get('/history/:moldId', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { moldId } = req.params;
    const { limit = 100, offset = 0, from_date, to_date, source } = req.query;

    let whereClause = 'WHERE l.mold_id = $1';
    const binds = [parseInt(moldId)];

    if (from_date) {
      binds.push(from_date);
      whereClause += ` AND l.scanned_at >= $${binds.length}`;
    }
    if (to_date) {
      binds.push(to_date);
      whereClause += ` AND l.scanned_at <= $${binds.length}`;
    }
    if (source) {
      binds.push(source);
      whereClause += ` AND l.source = $${binds.length}`;
    }

    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total FROM mold_location_logs l ${whereClause}`,
      { bind: binds }
    );

    const [rows] = await sequelize.query(
      `SELECT 
        l.id, l.mold_id, l.gps_lat, l.gps_lng, l.distance_m,
        l.status, l.source, l.notes, l.scanned_at, l.created_at,
        l.photo_id, l.accuracy, l.source_page, l.inspection_type,
        u.name as scanned_by_name, u.username as scanned_by_username
      FROM mold_location_logs l
      LEFT JOIN users u ON l.scanned_by_id = u.id
      ${whereClause}
      ORDER BY l.scanned_at DESC
      LIMIT $${binds.length + 1} OFFSET $${binds.length + 2}`,
      { bind: [...binds, parseInt(limit), parseInt(offset)] }
    );

    // 금형 기본 정보
    const [moldInfo] = await sequelize.query(
      `SELECT id, mold_code, mold_name, location, last_gps_lat, last_gps_lng,
        last_gps_time, location_status, base_gps_lat, base_gps_lng, drift_threshold_m
      FROM molds WHERE id = $1`,
      { bind: [parseInt(moldId)] }
    );

    res.json({
      success: true,
      data: {
        mold: moldInfo[0] || null,
        history: rows.map(r => ({
          id: r.id,
          latitude: parseFloat(r.gps_lat),
          longitude: parseFloat(r.gps_lng),
          distance_m: r.distance_m,
          status: r.status,
          source: r.source,
          notes: r.notes,
          scanned_at: r.scanned_at,
          photo_id: r.photo_id,
          accuracy: r.accuracy ? parseFloat(r.accuracy) : null,
          source_page: r.source_page,
          inspection_type: r.inspection_type,
          scanned_by: r.scanned_by_name || r.scanned_by_username
        })),
        total: parseInt(countResult[0]?.total || 0),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('위치 이력 조회 오류:', error);
    res.status(500).json({ success: false, message: '위치 이력 조회 실패', error: error.message });
  }
});

/**
 * POST /api/v1/mold-locations/record
 * GPS 위치 수동 기록 (QR 스캔, 수동 입력 등)
 */
router.post('/record', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { mold_id, gps_latitude, gps_longitude, gps_accuracy, source, notes, source_page } = req.body;

    if (!mold_id || !gps_latitude || !gps_longitude) {
      return res.status(400).json({ success: false, message: 'mold_id, gps_latitude, gps_longitude는 필수입니다.' });
    }

    const parsedLat = parseFloat(gps_latitude);
    const parsedLng = parseFloat(gps_longitude);
    const parsedAccuracy = gps_accuracy ? parseFloat(gps_accuracy) : null;
    const parsedMoldId = parseInt(mold_id);
    const userId = req.user?.id || 1;

    // 기준점과 거리 계산
    const [moldRows] = await sequelize.query(
      'SELECT base_gps_lat, base_gps_lng, drift_threshold_m FROM molds WHERE id = $1',
      { bind: [parsedMoldId] }
    );
    const mold = moldRows[0];

    let distanceM = null;
    let driftDetected = false;
    if (mold && mold.base_gps_lat && mold.base_gps_lng) {
      distanceM = calculateDistanceM(
        parseFloat(mold.base_gps_lat), parseFloat(mold.base_gps_lng),
        parsedLat, parsedLng
      );
      driftDetected = distanceM > (mold.drift_threshold_m || 500);
    }

    const locationStatus = driftDetected ? 'moved' : 'normal';

    // molds 테이블 업데이트
    await sequelize.query(
      `UPDATE molds SET 
        last_gps_lat = $1, last_gps_lng = $2, last_gps_time = NOW(),
        last_gps_accuracy = $3, last_gps_source = $4, location_status = $5
      WHERE id = $6`,
      { bind: [parsedLat, parsedLng, parsedAccuracy, source || 'manual', locationStatus, parsedMoldId] }
    );

    // 이력 기록
    await sequelize.query(
      `INSERT INTO mold_location_logs 
        (mold_id, scanned_by_id, scanned_at, gps_lat, gps_lng, distance_m,
         status, source, notes, accuracy, source_page, created_at)
      VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      { bind: [
        parsedMoldId, userId, parsedLat, parsedLng,
        distanceM ? Math.round(distanceM) : null,
        locationStatus, source || 'manual',
        notes || null, parsedAccuracy, source_page || null
      ]}
    );

    res.json({
      success: true,
      message: '위치가 기록되었습니다.',
      data: {
        mold_id: parsedMoldId,
        latitude: parsedLat,
        longitude: parsedLng,
        accuracy: parsedAccuracy,
        distance_from_base_m: distanceM ? Math.round(distanceM) : null,
        drift_detected: driftDetected,
        location_status: locationStatus
      }
    });
  } catch (error) {
    console.error('위치 기록 오류:', error);
    res.status(500).json({ success: false, message: '위치 기록 실패', error: error.message });
  }
});

/**
 * PUT /api/v1/mold-locations/base/:moldId
 * 금형 기준 위치 설정 (관리자)
 */
router.put('/base/:moldId', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { moldId } = req.params;
    const { base_gps_lat, base_gps_lng, drift_threshold_m, location } = req.body;

    if (!base_gps_lat || !base_gps_lng) {
      return res.status(400).json({ success: false, message: 'base_gps_lat, base_gps_lng는 필수입니다.' });
    }

    const updates = [];
    const binds = [];

    binds.push(parseFloat(base_gps_lat));
    updates.push(`base_gps_lat = $${binds.length}`);
    binds.push(parseFloat(base_gps_lng));
    updates.push(`base_gps_lng = $${binds.length}`);

    if (drift_threshold_m) {
      binds.push(parseInt(drift_threshold_m));
      updates.push(`drift_threshold_m = $${binds.length}`);
    }
    if (location) {
      binds.push(location);
      updates.push(`location = $${binds.length}`);
    }

    binds.push(parseInt(moldId));

    await sequelize.query(
      `UPDATE molds SET ${updates.join(', ')} WHERE id = $${binds.length}`,
      { bind: binds }
    );

    // 현재 GPS와 새 기준점 비교하여 location_status 재계산
    const [moldRows] = await sequelize.query(
      'SELECT last_gps_lat, last_gps_lng, drift_threshold_m FROM molds WHERE id = $1',
      { bind: [parseInt(moldId)] }
    );
    const mold = moldRows[0];
    if (mold && mold.last_gps_lat && mold.last_gps_lng) {
      const dist = calculateDistanceM(
        parseFloat(base_gps_lat), parseFloat(base_gps_lng),
        parseFloat(mold.last_gps_lat), parseFloat(mold.last_gps_lng)
      );
      const threshold = drift_threshold_m ? parseInt(drift_threshold_m) : (mold.drift_threshold_m || 500);
      const newStatus = dist > threshold ? 'moved' : 'normal';
      await sequelize.query(
        'UPDATE molds SET location_status = $1 WHERE id = $2',
        { bind: [newStatus, parseInt(moldId)] }
      );
    }

    res.json({
      success: true,
      message: '기준 위치가 설정되었습니다.'
    });
  } catch (error) {
    console.error('기준 위치 설정 오류:', error);
    res.status(500).json({ success: false, message: '기준 위치 설정 실패', error: error.message });
  }
});

/**
 * GET /api/v1/mold-locations/drift-alerts
 * 위치 이탈 금형 목록
 */
router.get('/drift-alerts', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');

    const [rows] = await sequelize.query(
      `SELECT 
        m.id, m.mold_code, m.mold_name, m.status, m.location,
        m.last_gps_lat, m.last_gps_lng, m.last_gps_time,
        m.base_gps_lat, m.base_gps_lng, m.drift_threshold_m,
        m.location_status
      FROM molds m
      WHERE m.location_status = 'moved'
      ORDER BY m.last_gps_time DESC`
    );

    const items = rows.map(row => {
      const distance = calculateDistanceM(
        parseFloat(row.base_gps_lat), parseFloat(row.base_gps_lng),
        parseFloat(row.last_gps_lat), parseFloat(row.last_gps_lng)
      );
      return {
        mold_id: row.id,
        mold_code: row.mold_code,
        mold_name: row.mold_name,
        current_lat: parseFloat(row.last_gps_lat),
        current_lng: parseFloat(row.last_gps_lng),
        base_lat: parseFloat(row.base_gps_lat),
        base_lng: parseFloat(row.base_gps_lng),
        distance_m: Math.round(distance),
        threshold_m: row.drift_threshold_m || 500,
        last_gps_time: row.last_gps_time
      };
    });

    res.json({
      success: true,
      data: { items, count: items.length }
    });
  } catch (error) {
    console.error('위치이탈 조회 오류:', error);
    res.status(500).json({ success: false, message: '조회 실패', error: error.message });
  }
});

/**
 * GET /api/v1/mold-locations/stats
 * GPS 위치 통계
 */
router.get('/stats', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');

    const [moldStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_molds,
        COUNT(CASE WHEN last_gps_lat IS NOT NULL THEN 1 END) as gps_tracked,
        COUNT(CASE WHEN location_status = 'moved' THEN 1 END) as drift_count,
        COUNT(CASE WHEN location_status = 'normal' AND last_gps_lat IS NOT NULL THEN 1 END) as normal_count,
        COUNT(CASE WHEN last_gps_time > NOW() - INTERVAL '24 hours' THEN 1 END) as updated_24h,
        COUNT(CASE WHEN last_gps_time > NOW() - INTERVAL '7 days' THEN 1 END) as updated_7d
      FROM molds
    `);

    const [logStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN source = 'photo' THEN 1 END) as photo_logs,
        COUNT(CASE WHEN source = 'qr_scan' THEN 1 END) as qr_logs,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_logs,
        COUNT(CASE WHEN scanned_at > NOW() - INTERVAL '24 hours' THEN 1 END) as logs_24h
      FROM mold_location_logs
    `);

    res.json({
      success: true,
      data: {
        molds: moldStats[0],
        logs: logStats[0]
      }
    });
  } catch (error) {
    console.error('위치 통계 오류:', error);
    res.status(500).json({ success: false, message: '통계 조회 실패', error: error.message });
  }
});

/**
 * GET /api/v1/mold-locations/companies
 * GPS 좌표가 있는 업체 목록 (지도 마커용)
 * - 업체별 금형 수, 활성 금형 수 포함
 */
router.get('/companies', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { company_type } = req.query;

    let whereClause = 'WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND c.is_active = true';
    const binds = [];

    if (company_type) {
      binds.push(company_type);
      whereClause += ` AND c.company_type = $${binds.length}`;
    }

    const [rows] = await sequelize.query(`
      SELECT
        c.id, c.company_code, c.company_name, c.company_type,
        c.address, c.representative, c.phone,
        c.latitude, c.longitude,
        COUNT(DISTINCT m_maker.id) as maker_mold_count,
        COUNT(DISTINCT m_plant.id) as plant_mold_count,
        COUNT(DISTINCT CASE WHEN m_maker.status = 'active' THEN m_maker.id END) as maker_active_count,
        COUNT(DISTINCT CASE WHEN m_plant.status = 'active' THEN m_plant.id END) as plant_active_count
      FROM companies c
      LEFT JOIN molds m_maker ON m_maker.maker_company_id = c.id
      LEFT JOIN molds m_plant ON m_plant.plant_company_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.company_name
    `, { bind: binds });

    const companies = rows.map(r => ({
      id: r.id,
      company_code: r.company_code,
      company_name: r.company_name,
      company_type: r.company_type,
      address: r.address,
      representative: r.representative,
      phone: r.phone,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      total_molds: parseInt(r.maker_mold_count || 0) + parseInt(r.plant_mold_count || 0),
      active_molds: parseInt(r.maker_active_count || 0) + parseInt(r.plant_active_count || 0)
    }));

    res.json({
      success: true,
      data: {
        companies,
        total: companies.length
      }
    });
  } catch (error) {
    console.error('업체 위치 조회 오류:', error);
    res.status(500).json({ success: false, message: '업체 위치 조회 실패', error: error.message });
  }
});

module.exports = router;
