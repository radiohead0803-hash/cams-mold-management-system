const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/alerts
router.get('/', authenticate, alertController.getAlerts);

// GET /api/v1/alerts/:id
router.get('/:id', authenticate, alertController.getAlertById);

// POST /api/v1/alerts/trigger
router.post('/trigger', authenticate, alertController.triggerAlert);

// PATCH /api/v1/alerts/:id/read
router.patch('/:id/read', authenticate, alertController.markAsRead);

module.exports = router;
