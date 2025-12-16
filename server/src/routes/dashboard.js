const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { cacheMiddleware, CACHE_CONFIG } = require('../middleware/cache');

// GET /api/v1/dashboard/system-admin/kpis - 시스템 관리자 대시보드 KPI
router.get('/system-admin/kpis', authenticate, cacheMiddleware(CACHE_CONFIG.DASHBOARD_TTL), dashboardController.getSystemAdminKpis);

// GET /api/v1/dashboard/plant/kpis - 생산처 대시보드 KPI
router.get('/plant/kpis', authenticate, cacheMiddleware(CACHE_CONFIG.DASHBOARD_TTL), dashboardController.getPlantKpis);

// GET /api/v1/dashboard/maker/kpis - 제작처 대시보드 KPI
router.get('/maker/kpis', authenticate, cacheMiddleware(CACHE_CONFIG.DASHBOARD_TTL), dashboardController.getMakerKpis);

// GET /api/v1/dashboard/developer/kpis - 금형개발 담당 대시보드 KPI
router.get('/developer/kpis', authenticate, cacheMiddleware(CACHE_CONFIG.DASHBOARD_TTL), dashboardController.getDeveloperKpis);

module.exports = router;
