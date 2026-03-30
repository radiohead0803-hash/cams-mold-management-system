const express = require('express');
const router = express.Router();
const qrController = require('../controllers/mobileQrController');
const checklistController = require('../controllers/mobileChecklistController');
const { authenticate } = require('../middleware/auth');
const { Mold, MoldLocationLog, sequelize } = require('../models/newIndex');

// ──────────────────────────────────────────────────────────────────────────────
// QR 스캔 (인증 선택 — 비로그인도 스캔은 가능하되 user 정보만 빈값)
// ──────────────────────────────────────────────────────────────────────────────

/** GET/POST /api/v1/mobile/qr/scan */
router.get('/qrcode/scan', qrController.scanQr);
router.post('/qr/scan', qrController.scanQr);
router.get('/qr/scan', qrController.scanQr);

/** QR 로그인/세션 (인증 필요) */
router.post('/qr/login', qrController.qrLogin);
router.get('/qr/session/:token', qrController.validateSession);
router.post('/qr/session/:token/end', qrController.endSession);

// ──────────────────────────────────────────────────────────────────────────────
// 아래 모든 라우트에 인증 미들웨어 적용
// ──────────────────────────────────────────────────────────────────────────────
router.use(authenticate);

/**
 * QR 세션 목록 조회
 * GET /api/v1/mobile/qr/sessions
 */
router.get('/qr/sessions', async (req, res) => {
  try {
    const { is_active, limit = 50 } = req.query;
    const userId = req.user?.id;

    let whereClause = '1=1';
    const replacements = { limit: parseInt(limit) };

    if (is_active !== undefined) {
      whereClause += ' AND qs.is_active = :is_active';
      replacements.is_active = is_active === 'true';
    }

    // 본인 세션만 조회 (관리자는 전체)
    if (req.user?.user_type !== 'system_admin') {
      whereClause += ' AND qs.user_id = :user_id';
      replacements.user_id = userId;
    }

    const [sessions] = await sequelize.query(`
      SELECT
        qs.id, qs.session_token, qs.is_active, qs.expires_at,
        qs.gps_latitude, qs.gps_longitude, qs.gps_accuracy,
        qs.created_at,
        u.id as user_id, u.name as user_name, u.user_type,
        m.id as mold_id, m.mold_code, m.mold_name
      FROM qr_sessions qs
      LEFT JOIN users u ON qs.user_id = u.id
      LEFT JOIN molds m ON qs.mold_id = m.id
      WHERE ${whereClause}
      ORDER BY qs.created_at DESC
      LIMIT :limit
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const formattedSessions = (sessions || []).map(s => ({
      id: s.id,
      session_token: s.session_token,
      is_active: s.is_active,
      expires_at: s.expires_at,
      gps_latitude: s.gps_latitude,
      gps_longitude: s.gps_longitude,
      gps_accuracy: s.gps_accuracy,
      created_at: s.created_at,
      user: s.user_id ? { id: s.user_id, name: s.user_name, user_type: s.user_type } : null,
      mold: s.mold_id ? { id: s.mold_id, mold_code: s.mold_code, mold_name: s.mold_name } : null
    }));

    return res.json({ success: true, data: formattedSessions });
  } catch (error) {
    console.error('[QR Sessions List] Error:', error);
    return res.status(500).json({ success: false, error: { message: 'QR 세션 목록 조회 실패' } });
  }
});

/**
 * 금형별 체크리스트 템플릿 조회
 * GET /api/v1/mobile/molds/:moldId/checklist-templates
 */
router.get('/molds/:moldId/checklist-templates', async (req, res) => {
  try {
    const { category } = req.query;

    const [tableCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'checklist_templates'
      ) as exists
    `, { type: sequelize.QueryTypes.SELECT });

    if (!tableCheck || !tableCheck.exists) {
      return res.json({ success: true, data: [] });
    }

    const templates = await sequelize.query(`
      SELECT id, name, category, shot_interval, is_active, version
      FROM checklist_templates
      WHERE is_active = true
      ${category ? "AND category = :category" : ""}
      ORDER BY name
    `, {
      replacements: { category },
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({ success: true, data: templates || [] });
  } catch (error) {
    console.error('[Checklist Templates] Error:', error);
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return res.json({ success: true, data: [] });
    }
    return res.status(500).json({ success: false, message: '템플릿 조회 중 오류가 발생했습니다.' });
  }
});

/** 점검 세션 시작/제출 */
router.post('/molds/:moldId/checklists/start', checklistController.startChecklist);
router.post('/checklists/:instanceId/submit', checklistController.submitChecklist);

/**
 * 모바일용 금형 목록 조회 (인증 필요 + 회사 접근 제어)
 * GET /api/v1/mobile/molds/list
 */
router.get('/molds/list', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const companyId = req.user?.company_id;
    const userType = req.user?.user_type;

    // 회사별 접근 제어
    let whereClause = '';
    const binds = [];
    let bindIdx = 1;

    if (userType === 'maker') {
      whereClause = `WHERE (m.maker_company_id = $${bindIdx} OR m.maker_id = $${bindIdx})`;
      binds.push(companyId);
      bindIdx++;
    } else if (userType === 'plant') {
      whereClause = `WHERE (m.plant_company_id = $${bindIdx} OR m.plant_id = $${bindIdx})`;
      binds.push(companyId);
      bindIdx++;
    }
    // system_admin / mold_developer → 전체

    const [molds] = await sequelize.query(`
      SELECT m.id, m.mold_code, m.mold_name, m.part_name, m.car_model,
             m.status, m.current_shots, m.target_shots, m.location,
             m.qr_token, m.created_at
      FROM molds m
      ${whereClause}
      ORDER BY m.updated_at DESC
      LIMIT $${bindIdx}
    `, { bind: [...binds, limit] });

    return res.json({ success: true, data: molds || [] });
  } catch (error) {
    console.error('[Mobile Molds List] Error:', error);
    return res.status(500).json({ success: false, message: '금형 목록 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * QR 코드로 금형 검색 (인증 필요)
 * GET /api/v1/mobile/molds/by-qr/:qrCode
 */
router.get('/molds/by-qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;

    // 1. qr_token으로 검색
    let mold = await Mold.findOne({ where: { qr_token: qrCode } });

    // 2. MOLD-{id} 형식이면 ID로 검색
    if (!mold && qrCode.startsWith('MOLD-')) {
      const moldId = parseInt(qrCode.replace('MOLD-', ''));
      if (moldId) mold = await Mold.findByPk(moldId);
    }

    // 3. mold_code로 검색
    if (!mold) {
      mold = await Mold.findOne({ where: { mold_code: qrCode } });
    }

    if (!mold) {
      return res.status(404).json({ success: false, message: '해당 QR 코드의 금형을 찾을 수 없습니다.' });
    }

    // 필요한 필드만 반환 (민감 정보 제외)
    const data = {
      id: mold.id,
      mold_code: mold.mold_code,
      mold_name: mold.mold_name,
      part_name: mold.part_name,
      car_model: mold.car_model,
      cavity: mold.cavity,
      status: mold.status,
      location: mold.location,
      current_shots: mold.current_shots,
      target_shots: mold.target_shots,
      spi_class: mold.spi_class,
      pm_level: mold.pm_level,
      qr_token: mold.qr_token,
      maker_company_id: mold.maker_company_id,
      plant_company_id: mold.plant_company_id,
      last_gps_lat: mold.last_gps_lat,
      last_gps_lng: mold.last_gps_lng,
      last_gps_time: mold.last_gps_time,
      created_at: mold.created_at,
      updated_at: mold.updated_at
    };

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[Mobile Mold by QR] Error:', error);
    return res.status(500).json({ success: false, message: '금형 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 모바일용 금형 상세 조회 (인증 필요)
 * GET /api/v1/mobile/molds/detail/:id
 * GET /api/v1/mobile/mold/:id (별칭)
 */
async function getMoldDetail(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await sequelize.query(`
      SELECT m.id, m.mold_code, m.mold_name, m.part_name, m.car_model,
             m.cavity, m.status, m.location, m.current_shots, m.target_shots,
             m.spi_class, m.pm_level, m.qr_token,
             m.maker_company_id, m.plant_company_id,
             m.last_gps_lat, m.last_gps_lng, m.last_gps_time,
             m.location_status, m.sop_date, m.eop_date,
             m.created_at, m.updated_at,
             mc.company_name AS maker_name,
             pc.company_name AS plant_name
      FROM molds m
      LEFT JOIN companies mc ON m.maker_company_id = mc.id
      LEFT JOIN companies pc ON m.plant_company_id = pc.id
      WHERE m.id = $1
    `, { bind: [id] });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: '금형을 찾을 수 없습니다.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Mobile Mold Detail] Error:', error);
    return res.status(500).json({ success: false, message: '금형 조회 중 오류가 발생했습니다.' });
  }
}

router.get('/molds/detail/:id', getMoldDetail);
router.get('/mold/:id', getMoldDetail);

/**
 * QR 스캔 후 금형 위치 업데이트 (Mold 테이블에 통일)
 * POST /api/v1/mobile/mold/:id/location
 */
router.post('/mold/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, device_info } = req.body;
    const userId = req.user?.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude, longitude 값이 필요합니다.' });
    }

    const mold = await Mold.findByPk(id);
    if (!mold) {
      return res.status(404).json({ success: false, message: '금형을 찾을 수 없습니다.' });
    }

    // Mold 테이블에 직접 업데이트 (PC와 동일)
    await mold.update({
      last_gps_lat: latitude,
      last_gps_lng: longitude,
      last_gps_time: new Date(),
      last_gps_accuracy: accuracy || null,
      last_gps_source: 'qr_scan'
    });

    // 위치 로그 기록 (MoldLocationLog)
    try {
      await MoldLocationLog.create({
        mold_id: id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        recorded_by: userId,
        source: 'qr_scan',
        device_info: device_info ? JSON.stringify(device_info) : null
      });
    } catch (logErr) {
      console.log('[Mobile Location] MoldLocationLog skipped:', logErr.message);
    }

    return res.json({
      success: true,
      message: '위치가 업데이트되었습니다.',
      data: { moldId: parseInt(id), latitude, longitude, updatedAt: new Date() }
    });
  } catch (error) {
    console.error('[Mobile Location Update] Error:', error);
    return res.status(500).json({ success: false, message: '위치 업데이트 중 오류가 발생했습니다.' });
  }
});

/**
 * 모든 금형의 QR 코드 업데이트 (관리자 전용)
 * POST /api/v1/mobile/molds/update-qr-codes
 */
router.post('/molds/update-qr-codes', async (req, res) => {
  try {
    if (req.user?.user_type !== 'system_admin') {
      return res.status(403).json({ success: false, message: '관리자만 실행할 수 있습니다.' });
    }

    const baseUrl = req.body.baseUrl || 'https://cams-mold-management-system-production-b7d0.up.railway.app';
    const molds = await Mold.findAll({ attributes: ['id', 'qr_token'] });

    let updated = 0;
    for (const mold of molds) {
      if (!mold.qr_token) {
        await mold.update({ qr_token: `MOLD-${mold.id}` });
        updated++;
      }
    }

    return res.json({
      success: true,
      message: `${updated}개 금형의 QR 코드가 업데이트되었습니다.`,
      data: { updated, total: molds.length }
    });
  } catch (error) {
    console.error('[Update QR Codes] Error:', error);
    return res.status(500).json({ success: false, message: 'QR 코드 업데이트 중 오류가 발생했습니다.' });
  }
});

/**
 * QR 스캔 로그 기록 (인증 필요)
 * POST /api/v1/mobile/qr/scan-log
 */
router.post('/qr/scan-log', async (req, res) => {
  try {
    const { qr_code, mold_id, scan_result, error_message, gps, device_info } = req.body;
    const userId = req.user?.id;

    await sequelize.query(`
      INSERT INTO audit_logs (
        entity_type, entity_id, action, user_id,
        new_value, description, ip_address, created_at
      ) VALUES (
        'qr_scan', :mold_id, :action, :user_id,
        :new_value, :description, :ip_address, NOW()
      )
    `, {
      replacements: {
        mold_id: mold_id || null,
        action: scan_result === 'success' ? 'qr_scan_success' : 'qr_scan_fail',
        user_id: userId,
        new_value: JSON.stringify({ qr_code, scan_result, gps, device_info, scanned_at: new Date().toISOString() }),
        description: scan_result === 'success'
          ? `QR 스캔 성공: ${qr_code}`
          : `QR 스캔 실패: ${qr_code} - ${error_message || '알 수 없는 오류'}`,
        ip_address: req.ip || req.connection?.remoteAddress || null
      }
    });

    return res.json({ success: true, message: '스캔 로그가 기록되었습니다.' });
  } catch (error) {
    console.error('[QR Scan Log] Error:', error);
    return res.json({ success: true, message: '스캔 로그 기록 중 오류 발생', warning: error.message });
  }
});

/**
 * QR 스캔 로그 조회 (인증 필요)
 * GET /api/v1/mobile/qr/scan-logs
 */
router.get('/qr/scan-logs', async (req, res) => {
  try {
    const { mold_id, scan_result, limit = 50 } = req.query;
    const userId = req.user?.id;
    const isAdmin = req.user?.user_type === 'system_admin';

    let whereClause = "entity_type = 'qr_scan'";
    const replacements = { limit: parseInt(limit) };

    // 관리자가 아니면 본인 로그만
    if (!isAdmin) {
      whereClause += ' AND al.user_id = :user_id';
      replacements.user_id = userId;
    }

    if (mold_id) {
      whereClause += ' AND entity_id = :mold_id';
      replacements.mold_id = mold_id;
    }

    if (scan_result) {
      whereClause += scan_result === 'success'
        ? " AND action = 'qr_scan_success'"
        : " AND action = 'qr_scan_fail'";
    }

    const [logs] = await sequelize.query(`
      SELECT
        al.id, al.entity_id as mold_id, al.action, al.user_id,
        al.new_value, al.description, al.ip_address, al.created_at,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT :limit
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const formattedLogs = (logs || []).map(log => {
      let parsedValue = {};
      try { parsedValue = JSON.parse(log.new_value || '{}'); } catch (e) {}

      return {
        id: log.id,
        mold_id: log.mold_id,
        user_id: log.user_id,
        user_name: log.user_name,
        scan_result: log.action === 'qr_scan_success' ? 'success' : 'fail',
        qr_code: parsedValue.qr_code,
        gps: parsedValue.gps,
        device_info: parsedValue.device_info,
        description: log.description,
        scanned_at: parsedValue.scanned_at || log.created_at,
        created_at: log.created_at
      };
    });

    return res.json({ success: true, data: formattedLogs });
  } catch (error) {
    console.error('[QR Scan Logs] Error:', error);
    return res.status(500).json({ success: false, error: { message: 'QR 스캔 로그 조회 실패' } });
  }
});

module.exports = router;
