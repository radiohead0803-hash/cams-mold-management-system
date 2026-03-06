const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 항상 메모리 스토리지 사용 (Railway는 ephemeral filesystem)
const storage = multer.memoryStorage();

// 파일 필터 (이미지, PDF만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and Excel files are allowed'));
  }
};

// Multer 설정
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// 사진 업로드 (최대 10개)
const uploadPhotos = upload.array('photos', 10);

// 단일 파일 업로드
const uploadSingle = upload.single('file');

// 문서 업로드 (최대 5개)
const uploadDocuments = upload.array('documents', 5);

module.exports = {
  uploadPhotos,
  uploadSingle,
  uploadDocuments
};
