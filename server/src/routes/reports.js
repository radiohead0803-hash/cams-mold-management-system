const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/reports/generate
router.post('/generate', authenticate, reportController.generateReport);

// GET /api/v1/reports/:id
router.get('/:id', authenticate, reportController.getReport);

// GET /api/v1/reports/transfer/:transferId
router.get('/transfer/:transferId', authenticate, reportController.getTransferReport);

// GET /api/v1/reports/inspection/:inspectionId
router.get('/inspection/:inspectionId', authenticate, reportController.getInspectionReport);

module.exports = router;
