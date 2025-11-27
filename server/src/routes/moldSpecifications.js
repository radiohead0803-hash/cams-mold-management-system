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

// 금형 사양 수정 (금형개발 담당만 가능)
router.patch('/:id', authorize(['mold_developer', 'system_admin']), updateMoldSpecification);

// 금형 사양 삭제 (금형개발 담당만 가능)
router.delete('/:id', authorize(['mold_developer', 'system_admin']), deleteMoldSpecification);

// 부품 사진 업로드 (금형개발 담당만 가능)
router.post('/:id/part-image', authorize(['mold_developer', 'system_admin']), uploadSingle, uploadPartImage);

// 부품 사진 삭제 (금형개발 담당만 가능)
router.delete('/:id/part-image', authorize(['mold_developer', 'system_admin']), deletePartImage);

module.exports = router;
