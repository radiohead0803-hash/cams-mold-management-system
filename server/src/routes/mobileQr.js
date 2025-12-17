const express = require('express');
const router = express.Router();
const qrController = require('../controllers/mobileQrController');
const checklistController = require('../controllers/mobileChecklistController');
const { MoldSpecification, sequelize } = require('../models/newIndex');

/**
 * QR 코드 스캔 (구버전 호환)
 * GET /api/v1/mobile/qrcode/scan?code=M2024-001
 */
router.get('/qrcode/scan', qrController.scanQr);

/**
 * QR 코드 스캔 (신버전 - POST/GET 둘 다 지원)
 * POST /api/v1/mobile/qr/scan { code: "M2024-001" }
 * GET /api/v1/mobile/qr/scan?code=M2024-001
 */
router.post('/qr/scan', qrController.scanQr);
router.get('/qr/scan', qrController.scanQr);

/**
 * QR 코드로 로그인 (세션 생성)
 * POST /api/v1/mobile/qr/login
 * Body: { code: "QR-MOLD-001", userId: 1, gps: { lat, lng }, deviceInfo: {} }
 */
router.post('/qr/login', qrController.qrLogin);

/**
 * QR 세션 검증
 * GET /api/v1/mobile/qr/session/:token
 */
router.get('/qr/session/:token', qrController.validateSession);

/**
 * QR 세션 종료
 * POST /api/v1/mobile/qr/session/:token/end
 */
router.post('/qr/session/:token/end', qrController.endSession);

/**
 * QR 세션 목록 조회
 * GET /api/v1/mobile/qr/sessions
 */
router.get('/qr/sessions', async (req, res) => {
  try {
    const { is_active, user_id, limit = 50 } = req.query;
    
    let whereClause = '1=1';
    const replacements = { limit: parseInt(limit) };
    
    if (is_active !== undefined) {
      whereClause += ' AND qs.is_active = :is_active';
      replacements.is_active = is_active === 'true';
    }
    
    if (user_id) {
      whereClause += ' AND qs.user_id = :user_id';
      replacements.user_id = user_id;
    }
    
    const [sessions] = await sequelize.query(`
      SELECT 
        qs.id, qs.session_token, qs.is_active, qs.expires_at,
        qs.gps_latitude, qs.gps_longitude, qs.gps_accuracy,
        qs.created_at,
        u.id as user_id, u.name as user_name, u.user_type,
        ms.id as mold_id, ms.mold_number, ms.part_name
      FROM qr_sessions qs
      LEFT JOIN users u ON qs.user_id = u.id
      LEFT JOIN mold_specifications ms ON qs.mold_id = ms.id
      WHERE ${whereClause}
      ORDER BY qs.created_at DESC
      LIMIT :limit
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    // 결과 포맷팅
    const formattedSessions = (sessions || []).map(s => ({
      id: s.id,
      session_token: s.session_token,
      is_active: s.is_active,
      expires_at: s.expires_at,
      gps_latitude: s.gps_latitude,
      gps_longitude: s.gps_longitude,
      gps_accuracy: s.gps_accuracy,
      created_at: s.created_at,
      user: s.user_id ? {
        id: s.user_id,
        name: s.user_name,
        user_type: s.user_type
      } : null,
      mold: s.mold_id ? {
        id: s.mold_id,
        mold_number: s.mold_number,
        part_name: s.part_name
      } : null
    }));
    
    return res.json({
      success: true,
      data: formattedSessions
    });
  } catch (error) {
    console.error('[QR Sessions List] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'QR 세션 목록 조회 실패' }
    });
  }
});

/**
 * 금형별 체크리스트 템플릿 조회
 * GET /api/v1/mobile/molds/:moldId/checklist-templates
 */
router.get('/molds/:moldId/checklist-templates', async (req, res) => {
  try {
    const { moldId } = req.params;
    const { category } = req.query; // 'daily' | 'regular'

    // 활성 템플릿 조회
    const [templates] = await sequelize.query(`
      SELECT 
        id, template_name as name, template_type as category,
        description, is_active, version
      FROM checklist_templates
      WHERE is_active = true
      ${category ? "AND template_type = :category" : ""}
      ORDER BY template_name
    `, {
      replacements: { category },
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      data: templates || []
    });
  } catch (error) {
    console.error('[Checklist Templates] Error:', error);
    return res.status(500).json({
      success: false,
      message: '템플릿 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 점검 세션 시작
 * POST /api/v1/mobile/molds/:moldId/checklists/start
 */
router.post('/molds/:moldId/checklists/start', checklistController.startChecklist);

/**
 * 점검 결과 제출
 * POST /api/v1/mobile/checklists/:instanceId/submit
 */
router.post('/checklists/:instanceId/submit', checklistController.submitChecklist);

/**
 * 모바일용 금형 목록 조회 (인증 불필요)
 * GET /api/v1/mobile/molds/list
 */
router.get('/molds/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const molds = await MoldSpecification.findAll({
      attributes: ['id', 'mold_code', 'part_name', 'car_model', 'status', 'qr_code', 'created_at'],
      order: [['created_at', 'DESC']],
      limit
    });

    // QR 코드가 없는 금형에 자동 생성
    const moldsWithQR = molds.map(m => {
      const mold = m.toJSON();
      if (!mold.qr_code) {
        mold.qr_code = `MOLD-${mold.id}`;
      }
      return mold;
    });

    return res.json({
      success: true,
      data: moldsWithQR
    });
  } catch (error) {
    console.error('[Mobile Molds List] Error:', error);
    return res.status(500).json({
      success: false,
      message: '금형 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * QR 코드로 금형 검색 (인증 불필요)
 * GET /api/v1/mobile/molds/by-qr/:qrCode
 */
router.get('/molds/by-qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    // MOLD-{id} 형식인 경우 ID 추출
    let moldId = null;
    if (qrCode.startsWith('MOLD-')) {
      moldId = parseInt(qrCode.replace('MOLD-', ''));
    }
    
    let mold = null;
    
    // 1. qr_code 컬럼으로 검색
    mold = await MoldSpecification.findOne({
      where: { qr_code: qrCode }
    });
    
    // 2. MOLD-{id} 형식이면 ID로 검색
    if (!mold && moldId) {
      mold = await MoldSpecification.findByPk(moldId);
    }
    
    // 3. mold_code로 검색
    if (!mold) {
      mold = await MoldSpecification.findOne({
        where: { mold_code: qrCode }
      });
    }
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '해당 QR 코드의 금형을 찾을 수 없습니다.'
      });
    }

    const moldData = mold.toJSON();
    if (!moldData.qr_code) {
      moldData.qr_code = `MOLD-${moldData.id}`;
    }

    return res.json({
      success: true,
      data: moldData
    });
  } catch (error) {
    console.error('[Mobile Mold by QR] Error:', error);
    return res.status(500).json({
      success: false,
      message: '금형 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 모바일용 금형 상세 조회 (인증 불필요)
 * GET /api/v1/mobile/molds/detail/:id
 * GET /api/v1/mobile/mold/:id (별칭)
 */
router.get('/molds/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mold = await MoldSpecification.findByPk(id);
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    const moldData = mold.toJSON();
    if (!moldData.qr_code) {
      moldData.qr_code = `MOLD-${moldData.id}`;
    }

    return res.json({
      success: true,
      data: moldData
    });
  } catch (error) {
    console.error('[Mobile Mold Detail] Error:', error);
    return res.status(500).json({
      success: false,
      message: '금형 조회 중 오류가 발생했습니다.'
    });
  }
});

// 별칭 라우트
router.get('/mold/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mold = await MoldSpecification.findByPk(id);
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    const moldData = mold.toJSON();
    if (!moldData.qr_code) {
      moldData.qr_code = `MOLD-${moldData.id}`;
    }

    return res.json({
      success: true,
      data: moldData
    });
  } catch (error) {
    console.error('[Mobile Mold Detail] Error:', error);
    return res.status(500).json({
      success: false,
      message: '금형 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * QR 스캔 후 금형 위치 업데이트 (MoldSpecification용)
 * POST /api/v1/mobile/mold/:id/location
 */
router.post('/mold/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, scanned_by, scanned_at, device_info } = req.body;

    console.log(`[Mobile Location Update] Mold ID: ${id}, Lat: ${latitude}, Lng: ${longitude}`);

    // 입력 검증
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'latitude, longitude 값이 필요합니다.'
      });
    }

    // 금형 조회
    const mold = await MoldSpecification.findByPk(id);
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    // 금형 위치 업데이트
    await mold.update({
      gps_lat: latitude,
      gps_lng: longitude,
      last_scanned_at: scanned_at || new Date(),
      last_scanned_by: scanned_by
    });

    // 위치 로그 저장 (GPSLocation 테이블이 있는 경우)
    try {
      const { GPSLocation } = require('../models/newIndex');
      if (GPSLocation) {
        await GPSLocation.create({
          mold_spec_id: id,
          latitude,
          longitude,
          accuracy,
          scanned_by,
          scanned_at: scanned_at || new Date(),
          device_info: device_info ? JSON.stringify(device_info) : null,
          source: 'qr_scan'
        });
      }
    } catch (logError) {
      console.log('[Mobile Location] GPSLocation log skipped:', logError.message);
    }

    return res.json({
      success: true,
      message: '위치가 업데이트되었습니다.',
      data: {
        moldId: id,
        latitude,
        longitude,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('[Mobile Location Update] Error:', error);
    return res.status(500).json({
      success: false,
      message: '위치 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 모든 금형의 QR 코드 및 URL 업데이트 (관리자용)
 * POST /api/v1/mobile/molds/update-qr-codes
 */
router.post('/molds/update-qr-codes', async (req, res) => {
  try {
    const baseUrl = req.body.baseUrl || 'https://spirited-liberation-production-1a4d.up.railway.app';
    
    // 모든 금형 조회
    const molds = await MoldSpecification.findAll();
    
    let updated = 0;
    for (const mold of molds) {
      const qrCode = `MOLD-${mold.id}`;
      const qrUrl = `${baseUrl}/m/qr/${qrCode}`;
      
      await mold.update({
        qr_code: qrCode,
        qr_url: qrUrl
      });
      updated++;
    }

    return res.json({
      success: true,
      message: `${updated}개 금형의 QR 코드가 업데이트되었습니다.`,
      data: { updated, baseUrl }
    });
  } catch (error) {
    console.error('[Update QR Codes] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'QR 코드 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * QR 스캔 로그 기록
 * POST /api/v1/mobile/qr/scan-log
 * Body: { qr_code, mold_id, user_id, scan_result, error_message, gps, device_info }
 */
router.post('/qr/scan-log', async (req, res) => {
  try {
    const { 
      qr_code, 
      mold_id, 
      user_id, 
      scan_result, // 'success' | 'fail' | 'not_found'
      error_message,
      gps,
      device_info 
    } = req.body;

    // audit_logs 테이블에 기록
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
        user_id: user_id || null,
        new_value: JSON.stringify({
          qr_code,
          scan_result,
          gps,
          device_info,
          scanned_at: new Date().toISOString()
        }),
        description: scan_result === 'success' 
          ? `QR 스캔 성공: ${qr_code}` 
          : `QR 스캔 실패: ${qr_code} - ${error_message || '알 수 없는 오류'}`,
        ip_address: req.ip || req.connection?.remoteAddress || null
      }
    });

    console.log(`[QR Scan Log] ${scan_result}: ${qr_code}`);

    return res.json({
      success: true,
      message: '스캔 로그가 기록되었습니다.'
    });
  } catch (error) {
    console.error('[QR Scan Log] Error:', error);
    // 로그 기록 실패해도 에러 반환하지 않음
    return res.json({
      success: true,
      message: '스캔 로그 기록 중 오류가 발생했습니다.',
      warning: error.message
    });
  }
});

/**
 * QR 스캔 로그 조회
 * GET /api/v1/mobile/qr/scan-logs
 */
router.get('/qr/scan-logs', async (req, res) => {
  try {
    const { mold_id, user_id, scan_result, limit = 50 } = req.query;

    let whereClause = "entity_type = 'qr_scan'";
    const replacements = { limit: parseInt(limit) };

    if (mold_id) {
      whereClause += ' AND entity_id = :mold_id';
      replacements.mold_id = mold_id;
    }

    if (user_id) {
      whereClause += ' AND user_id = :user_id';
      replacements.user_id = user_id;
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

    // 결과 포맷팅
    const formattedLogs = (logs || []).map(log => {
      let parsedValue = {};
      try {
        parsedValue = JSON.parse(log.new_value || '{}');
      } catch (e) {}

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

    return res.json({
      success: true,
      data: formattedLogs
    });
  } catch (error) {
    console.error('[QR Scan Logs] Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'QR 스캔 로그 조회 실패' }
    });
  }
});

module.exports = router;
