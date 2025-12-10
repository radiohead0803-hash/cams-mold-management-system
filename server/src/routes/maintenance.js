const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate } = require('../middleware/auth');

/**
 * 유지보전 관리 라우트
 */

// 유지보전 유형 목록
router.get('/types', authenticate, maintenanceController.getMaintenanceTypes);

// 유지보전 통계 조회
router.get('/statistics', authenticate, maintenanceController.getStatistics);

// 금형별 유지보전 이력 조회
router.get('/mold/:mold_id/history', authenticate, maintenanceController.getMoldMaintenanceHistory);

// 유지보전 기록 목록 조회
router.get('/', authenticate, maintenanceController.getMaintenanceRecords);

// 유지보전 기록 상세 조회
router.get('/:id', authenticate, maintenanceController.getMaintenanceRecordById);

// 유지보전 기록 생성
router.post('/', authenticate, maintenanceController.createMaintenanceRecord);

// 유지보전 기록 수정
router.put('/:id', authenticate, maintenanceController.updateMaintenanceRecord);

module.exports = router;
