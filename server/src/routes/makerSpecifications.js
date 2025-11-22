const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMakerSpecifications,
  getMakerSpecificationById,
  updateMakerSpecification,
  getMakerDashboardStats
} = require('../controllers/makerSpecificationController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 대시보드 통계
router.get('/dashboard/stats', getMakerDashboardStats);

// 제작처 금형 사양 목록
router.get('/', getMakerSpecifications);

// 제작처 금형 사양 상세
router.get('/:id', getMakerSpecificationById);

// 제작처 추가 정보 입력
router.patch('/:id', updateMakerSpecification);

module.exports = router;
