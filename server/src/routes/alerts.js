const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');
const { runAllAlertChecks } = require('../services/maintenanceAlertService');

// POST /api/v1/alerts/check-all - 모든 예방 알람 체크 실행
router.post('/check-all', authenticate, async (req, res) => {
  try {
    const result = await runAllAlertChecks();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/alerts
router.get('/', authenticate, alertController.getAlerts);

// GET /api/v1/alerts/:id
router.get('/:id', authenticate, alertController.getAlertById);

// POST /api/v1/alerts/trigger
router.post('/trigger', authenticate, alertController.triggerAlert);

// PATCH /api/v1/alerts/:id/read
router.patch('/:id/read', authenticate, alertController.markAsRead);

module.exports = router;
