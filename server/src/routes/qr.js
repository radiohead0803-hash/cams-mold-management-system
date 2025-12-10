const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticate } = require('../middleware/auth');

/**
 * QR 스캔 및 세션 관리 라우트
 */

// QR 코드 스캔 및 세션 생성
router.post('/scan', authenticate, qrController.scanQR);

// 세션 검증
router.get('/session/:session_token', authenticate, qrController.validateSession);

// 세션 종료
router.delete('/session/:session_token', authenticate, qrController.endSession);

// 활성 세션 목록
router.get('/sessions/active', authenticate, qrController.getActiveSessions);

// 전체 세션 목록 (관리자용)
router.get('/sessions', authenticate, qrController.getAllSessions);

// QR 세션을 통한 수리요청 생성
router.post('/molds/:id/repairs', authenticate, qrController.createRepairRequest);

module.exports = router;
