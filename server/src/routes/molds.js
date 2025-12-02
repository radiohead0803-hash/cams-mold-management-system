const express = require('express');
const router = express.Router();
const moldController = require('../controllers/moldController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/molds
router.get('/', authenticate, moldController.getMolds);

// GET /api/v1/molds/:id
router.get('/:id', authenticate, moldController.getMoldById);

// GET /api/v1/mold/:id (단수형 - 호환성)
router.get('/mold/:id', authenticate, moldController.getMoldById);

// GET /api/v1/molds/qr/:qrCode
router.get('/qr/:qrCode', authenticate, moldController.getMoldByQR);

// POST /api/v1/molds
router.post('/', authenticate, moldController.createMold);

// PATCH /api/v1/molds/:id
router.patch('/:id', authenticate, moldController.updateMold);

// GET /api/v1/molds/:id/history
router.get('/:id/history', authenticate, moldController.getMoldHistory);

module.exports = router;
