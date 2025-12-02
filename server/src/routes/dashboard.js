const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/dashboard/system-admin/kpis - 시스템 관리자 대시보드 KPI
router.get('/system-admin/kpis', authenticate, dashboardController.getSystemAdminKpis);

// GET /api/v1/dashboard/plant/kpis - 생산처 대시보드 KPI
router.get('/plant/kpis', authenticate, dashboardController.getPlantKpis);

// GET /api/v1/dashboard/maker/kpis - 제작처 대시보드 KPI
router.get('/maker/kpis', authenticate, dashboardController.getMakerKpis);

// GET /api/v1/dashboard/developer/kpis - 금형개발 담당 대시보드 KPI
router.get('/developer/kpis', authenticate, dashboardController.getDeveloperKpis);

module.exports = router;
