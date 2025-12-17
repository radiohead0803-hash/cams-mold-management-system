const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  startInspection,
  getInspectionInstance,
  saveDraft,
  submitInspection,
  getSchedulesByMold,
  recalculateSchedules,
  getDueSchedules,
  getInspectionHistory
} = require('../controllers/inspectionNewController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 점검 수행
router.post('/start', startInspection);
router.get('/:id', getInspectionInstance);
router.patch('/:id/save-draft', saveDraft);
router.post('/:id/submit', submitInspection);

// 점검 이력
router.get('/', getInspectionHistory);

// 스케줄
router.get('/schedules/due', getDueSchedules);
router.get('/schedules', getSchedulesByMold);
router.post('/schedules/recalc', recalculateSchedules);

module.exports = router;
