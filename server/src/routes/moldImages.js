const express = require('express');
const router = express.Router();
const multer = require('multer');
const moldImageController = require('../controllers/moldImageController');
const { authenticate } = require('../middleware/auth');

// Multer 설정 (메모리 스토리지)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다.'), false);
    }
  }
});

// POST /api/v1/mold-images - 이미지 업로드
router.post('/', authenticate, upload.single('image'), moldImageController.uploadMoldImage);

// GET /api/v1/mold-images - 이미지 목록 조회
router.get('/', authenticate, moldImageController.getMoldImages);

// PATCH /api/v1/mold-images/:id/primary - 대표 이미지 설정
router.patch('/:id/primary', authenticate, moldImageController.setPrimaryImage);

// DELETE /api/v1/mold-images/:id - 이미지 삭제
router.delete('/:id', authenticate, moldImageController.deleteMoldImage);

module.exports = router;
