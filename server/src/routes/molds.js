const express = require('express');
const router = express.Router();
const moldController = require('../controllers/moldController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/molds
router.get('/', authenticate, moldController.getMolds);

// GET /api/v1/molds/locations - 전체 금형 위치 조회 (must be before /:id)
router.get('/locations', authenticate, moldController.getMoldLocations);

// GET /api/v1/molds/qr/:qrCode
router.get('/qr/:qrCode', authenticate, moldController.getMoldByQR);

// POST /api/v1/molds
router.post('/', authenticate, moldController.createMold);

// PATCH /api/v1/molds/:id
router.patch('/:id', authenticate, moldController.updateMold);

// GET /api/v1/molds/:id/history
router.get('/:id/history', authenticate, moldController.getMoldHistory);

// GET /api/v1/molds/:id/location - 특정 금형 위치 조회
router.get('/:id/location', authenticate, moldController.getMoldLocation);

// POST /api/v1/molds/:id/location - 금형 위치 업데이트
router.post('/:id/location', authenticate, moldController.updateMoldLocation);

// GET /api/v1/mold/:id (단수형 - 호환성)
router.get('/mold/:id', authenticate, moldController.getMoldById);

// GET /api/v1/molds/:id (must be last to avoid shadowing static paths)
router.get('/:id', authenticate, moldController.getMoldById);

module.exports = router;
