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
 * GET /api/v1/mobile/molds/:id
 */
router.get('/molds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mold = await MoldSpecification.findByPk(id);
    
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    return res.json({
      success: true,
      data: mold
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

module.exports = router;
