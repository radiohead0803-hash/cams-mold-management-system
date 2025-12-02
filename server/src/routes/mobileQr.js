const express = require('express');
const router = express.Router();
const qrController = require('../controllers/mobileQrController');
const checklistController = require('../controllers/mobileChecklistController');

/**
 * QR 코드 스캔
 * GET /api/v1/mobile/qrcode/scan?code=M2024-001
 */
router.get('/qrcode/scan', qrController.scanQr);

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

module.exports = router;
