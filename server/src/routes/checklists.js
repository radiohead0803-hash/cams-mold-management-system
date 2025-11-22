const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { authenticate } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');

// POST /api/v1/checklists/daily/start
router.post('/daily/start', authenticate, checklistController.startDailyChecklist);

// PATCH /api/v1/checklists/daily/:id
router.patch('/daily/:id', authenticate, checklistController.updateDailyChecklist);

// GET /api/v1/checklists/daily/:id
router.get('/daily/:id', authenticate, checklistController.getDailyChecklist);

// GET /api/v1/checklists/history
router.get('/history', authenticate, checklistController.getChecklistHistory);

// POST /api/v1/checklists/photos
router.post('/photos', authenticate, uploadPhotos, checklistController.uploadPhotos);

// POST /api/v1/checklists/transfer/request
router.post('/transfer/request', authenticate, checklistController.createTransferRequest);

// PATCH /api/v1/checklists/transfer/:id/confirm
router.patch('/transfer/:id/confirm', authenticate, checklistController.confirmTransfer);

module.exports = router;
