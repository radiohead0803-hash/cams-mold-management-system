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
      attributes: ['id', 'mold_code', 'part_name', 'car_model', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit
    });

    return res.json({
      success: true,
      data: molds
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

module.exports = router;
