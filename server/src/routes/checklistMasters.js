const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMasterVersions,
  getMasterVersionById,
  createMasterVersion,
  updateMasterVersion,
  submitForReview,
  approveMasterVersion,
  deployMasterVersion,
  cloneMasterVersion,
  getCurrentDeployedVersion,
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  getCycleCodes
} = require('../controllers/checklistMasterController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 주기 코드
router.get('/cycles', getCycleCodes);

// 점검항목
router.get('/items', getChecklistItems);
router.post('/items', createChecklistItem);
router.patch('/items/:id', updateChecklistItem);

// 현재 배포 버전
router.get('/deployed', getCurrentDeployedVersion);

// 마스터 버전 CRUD
router.get('/', getMasterVersions);
router.post('/', createMasterVersion);
router.get('/:id', getMasterVersionById);
router.patch('/:id', updateMasterVersion);

// 상태 전환
router.post('/:id/submit-review', submitForReview);
router.post('/:id/approve', approveMasterVersion);
router.post('/:id/deploy', deployMasterVersion);
router.post('/:id/clone', cloneMasterVersion);

module.exports = router;
