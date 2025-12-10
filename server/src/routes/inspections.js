const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/inspections - 점검 목록 조회
router.get('/', authenticate, inspectionController.getInspections);

// GET /api/v1/inspections/pending - 승인 대기 점검 목록
router.get('/pending', authenticate, inspectionController.getPendingInspections);

// GET /api/v1/inspections/:id - 점검 상세 조회
router.get('/:id', authenticate, inspectionController.getInspectionById);

// POST /api/v1/inspections/daily - 일상점검 제출
router.post('/daily', authenticate, inspectionController.createDailyInspection);

// POST /api/v1/inspections/periodic - 정기점검 제출
router.post('/periodic', authenticate, inspectionController.createPeriodicInspection);

// PATCH /api/v1/inspections/:id - 점검 수정
router.patch('/:id', authenticate, inspectionController.updateInspection);

// POST /api/v1/inspections/:id/approve - 점검 승인
router.post('/:id/approve', authenticate, inspectionController.approveInspection);

// POST /api/v1/inspections/:id/reject - 점검 반려
router.post('/:id/reject', authenticate, inspectionController.rejectInspection);

module.exports = router;
