const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// POST /api/v1/auth/qr-login
router.post('/qr-login', authController.qrLogin);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

module.exports = router;
