const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// POST /api/v1/auth/qr-login
router.post('/qr-login', authController.qrLogin);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

// GET /api/v1/auth/me - 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticate, authController.me);

module.exports = router;
