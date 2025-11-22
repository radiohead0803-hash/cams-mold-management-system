const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/inspections
router.get('/', authenticate, inspectionController.getInspections);

// GET /api/v1/inspections/:id
router.get('/:id', authenticate, inspectionController.getInspectionById);

// POST /api/v1/inspections/periodic
router.post('/periodic', authenticate, inspectionController.createPeriodicInspection);

// PATCH /api/v1/inspections/:id
router.patch('/:id', authenticate, inspectionController.updateInspection);

module.exports = router;
