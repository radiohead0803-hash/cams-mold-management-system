const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  createMoldSpecification,
  getMoldSpecifications,
  getMoldSpecificationById,
  updateMoldSpecification,
  deleteMoldSpecification,
  uploadPartImage,
  deletePartImage
} = require('../controllers/moldSpecificationController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 금형 사양 등록 (금형개발 담당만 가능)
router.post('/', authorize(['mold_developer', 'system_admin']), createMoldSpecification);

// 금형 사양 목록 조회
router.get('/', getMoldSpecifications);

// 금형 사양 상세 조회
router.get('/:id', getMoldSpecificationById);

// 금형 사양 수정
router.patch('/:id', updateMoldSpecification);

// 금형 사양 삭제
router.delete('/:id', deleteMoldSpecification);

// 부품 사진 업로드 (단일 이미지)
router.post('/:id/part-image', uploadSingle, uploadPartImage);

// 부품 사진 삭제
router.delete('/:id/part-image', deletePartImage);

module.exports = router;
