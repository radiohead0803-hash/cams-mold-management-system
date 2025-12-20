const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const productionTransferController = require('../controllers/productionTransferController');

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads/production-transfer');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pt-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  }
});

// 체크리스트 마스터 항목 조회
router.get('/checklist-master', authenticate, productionTransferController.getChecklistMasterItems);

// 양산이관 요청 CRUD
router.post('/requests', authenticate, productionTransferController.createTransferRequest);
router.get('/requests', authenticate, productionTransferController.getTransferRequests);
router.get('/requests/:id', authenticate, productionTransferController.getTransferRequest);
router.put('/requests/:id', authenticate, productionTransferController.updateTransferRequest);

// 승인/거절
router.post('/requests/:id/approve', authenticate, productionTransferController.approveTransferRequest);
router.post('/requests/:id/reject', authenticate, productionTransferController.rejectTransferRequest);

// 이관 완료
router.post('/requests/:id/complete', authenticate, productionTransferController.completeTransfer);

// 첨부파일 업로드/삭제
router.post('/attachments/upload', authenticate, upload.single('file'), productionTransferController.uploadAttachment);
router.delete('/attachments/:id', authenticate, productionTransferController.deleteAttachment);

module.exports = router;
