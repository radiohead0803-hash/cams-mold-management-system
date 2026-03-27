/**
 * GPS Tracking API
 * - GPS 이벤트 기록
 * - 금형별 GPS 이력 조회
 * - 최근 GPS 로그 조회
 *
 * POST /api/v1/gps/log         - GPS 이벤트 기록
 * GET  /api/v1/gps/history/:moldId - 금형별 GPS 이력
 * GET  /api/v1/gps/recent       - 최근 GPS 로그
 */

const express = require('express');
const router = express.Router();
const { logGPS, getGPSHistory, getRecentGPSLogs } = require('../utils/gpsLogger');

// ─── POST /log — GPS 이벤트 기록 ────────────────────────────────────────────

router.post('/log', async (req, res) => {
  try {
    const { moldId, eventType, latitude, longitude, locationName, accuracy } = req.body;

    // 기본 유효성 검사
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'latitude, longitude 값이 필요합니다.'
      });
    }

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'eventType 값이 필요합니다.'
      });
    }

    // 유효한 이벤트 타입
    const validTypes = ['qr_scan', 'daily_check', 'periodic_check', 'repair_request', 'transfer', 'scrapping', 'manual', 'login'];
    if (!validTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 eventType입니다. 허용: ${validTypes.join(', ')}`
      });
    }

    // 사용자 ID (인증된 경우)
    const userId = req.user?.id || req.body.userId || null;

    const logId = await logGPS({
      moldId: moldId || null,
      userId,
      eventType,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      locationName: locationName || null,
      accuracy: accuracy ? parseFloat(accuracy) : null
    });

    return res.json({
      success: true,
      message: 'GPS 위치가 기록되었습니다.',
      data: { logId }
    });
  } catch (error) {
    console.error('[GPS Tracking] POST /log error:', error);
    return res.status(500).json({
      success: false,
      message: 'GPS 기록 중 오류가 발생했습니다.'
    });
  }
});

// ─── GET /history/:moldId — 금형별 GPS 이력 ──────────────────────────────────

router.get('/history/:moldId', async (req, res) => {
  try {
    const { moldId } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const eventType = req.query.eventType || null;

    const logs = await getGPSHistory(parseInt(moldId, 10), { limit, offset, eventType });

    return res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        moldId: parseInt(moldId, 10)
      }
    });
  } catch (error) {
    console.error('[GPS Tracking] GET /history error:', error);
    return res.status(500).json({
      success: false,
      message: 'GPS 이력 조회 중 오류가 발생했습니다.'
    });
  }
});

// ─── GET /recent — 최근 GPS 로그 ────────────────────────────────────────────

router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const eventType = req.query.eventType || null;

    const logs = await getRecentGPSLogs({ limit, eventType });

    return res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    console.error('[GPS Tracking] GET /recent error:', error);
    return res.status(500).json({
      success: false,
      message: '최근 GPS 로그 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
