const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads/inspection-photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WEBP만 허용)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 사진 업로드
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { mold_id, checklist_id, item_status_id, item_id, inspection_type, shot_count, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 없습니다.' });
    }

    // 파일 URL 생성
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/inspection-photos/${req.file.filename}`;

    // 메타데이터
    const metadata = {
      originalName: req.file.originalname,
      item_id: item_id ? parseInt(item_id) : null,
      inspection_type: inspection_type || 'daily',
      category: category || null,
      uploadedFrom: req.headers['user-agent'] || 'unknown'
    };

    // DB 저장
    const photo = await InspectionPhoto.create({
      mold_id: mold_id ? parseInt(mold_id) : null,
      checklist_id: checklist_id ? parseInt(checklist_id) : null,
      item_status_id: item_status_id ? parseInt(item_status_id) : null,
      file_url: fileUrl,
      thumbnail_url: fileUrl, // 썸네일은 동일하게 사용 (추후 리사이징 구현 가능)
      file_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user?.id || 1, // 인증된 사용자 ID 또는 기본값
      shot_count: shot_count ? parseInt(shot_count) : null,
      metadata
    });

    res.json({
      success: true,
      message: '사진이 업로드되었습니다.',
      data: photo
    });
  } catch (error) {
    console.error('사진 업로드 오류:', error);
    res.status(500).json({ success: false, message: '사진 업로드 중 오류가 발생했습니다.', error: error.message });
  }
});

// 특정 금형의 점검 사진 조회
router.get('/mold/:moldId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { moldId } = req.params;
    const { inspection_type, item_id, limit = 50 } = req.query;

    const where = { mold_id: parseInt(moldId) };
    
    const photos = await InspectionPhoto.findAll({
      where,
      order: [['uploaded_at', 'DESC']],
      limit: parseInt(limit)
    });

    // inspection_type 또는 item_id로 필터링 (metadata에서)
    let filteredPhotos = photos;
    if (inspection_type) {
      filteredPhotos = filteredPhotos.filter(p => p.metadata?.inspection_type === inspection_type);
    }
    if (item_id) {
      filteredPhotos = filteredPhotos.filter(p => p.metadata?.item_id === parseInt(item_id));
    }

    res.json({
      success: true,
      data: filteredPhotos
    });
  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

// 특정 점검 항목의 사진 조회
router.get('/item/:itemId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { itemId } = req.params;
    const { mold_id } = req.query;

    const photos = await InspectionPhoto.findAll({
      order: [['uploaded_at', 'DESC']],
      limit: 20
    });

    // item_id로 필터링 (metadata에서)
    let filteredPhotos = photos.filter(p => p.metadata?.item_id === parseInt(itemId));
    
    if (mold_id) {
      filteredPhotos = filteredPhotos.filter(p => p.mold_id === parseInt(mold_id));
    }

    res.json({
      success: true,
      data: filteredPhotos
    });
  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

// 사진 삭제
router.delete('/:photoId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { photoId } = req.params;

    const photo = await InspectionPhoto.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: '사진을 찾을 수 없습니다.' });
    }

    // 파일 삭제
    const filename = photo.file_url.split('/').pop();
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // DB에서 삭제
    await photo.destroy();

    res.json({
      success: true,
      message: '사진이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사진 삭제 오류:', error);
    res.status(500).json({ success: false, message: '사진 삭제 중 오류가 발생했습니다.', error: error.message });
  }
});

// 사진 상세 조회
router.get('/:photoId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { photoId } = req.params;

    const photo = await InspectionPhoto.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: '사진을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

module.exports = router;
