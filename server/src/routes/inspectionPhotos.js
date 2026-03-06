const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { uploadImage, deleteImage: deleteCloudinaryImage, getPublicIdFromUrl } = require('../config/cloudinary');

// Cloudinary 환경변수 체크
const CLOUDINARY_ENABLED = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// 항상 메모리 스토리지 사용 (Railway는 ephemeral filesystem)
const storage = multer.memoryStorage();

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
    const { mold_id, checklist_id, item_id, inspection_type, shot_count, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 없습니다.' });
    }

    let fileUrl;
    let cloudinaryPublicId = null;
    let storeInDb = false;

    // 1. Cloudinary 업로드 시도
    if (CLOUDINARY_ENABLED) {
      try {
        const cloudinaryResult = await uploadImage(req.file.buffer, {
          folder: `cams-molds/inspection-photos/${mold_id || 'general'}`,
          public_id: `photo_${Date.now()}`
        });
        fileUrl = cloudinaryResult.secure_url;
        cloudinaryPublicId = cloudinaryResult.public_id;
      } catch (cloudErr) {
        console.error('Cloudinary upload error, falling back to DB BYTEA:', cloudErr.message);
        storeInDb = true;
      }
    } else {
      // Cloudinary 미설정 → DB BYTEA 저장
      storeInDb = true;
    }

    // 2. DB BYTEA 폴백: inspection_photos에 image_data 컬럼 사용
    if (storeInDb) {
      const photoId = uuidv4();
      fileUrl = `/api/v1/inspection-photos/file/${photoId}`;
    }

    // 메타데이터
    const metadata = {
      uploadedFrom: req.headers['user-agent'] || 'unknown'
    };

    // DB 저장
    const photo = await InspectionPhoto.create({
      mold_id: mold_id ? parseInt(mold_id) : null,
      checklist_id: checklist_id ? parseInt(checklist_id) : null,
      item_id: item_id ? parseInt(item_id) : null,
      category: category || null,
      inspection_type: inspection_type || 'daily',
      file_name: `photo_${Date.now()}_${req.file.originalname}`,
      original_name: req.file.originalname,
      file_url: fileUrl,
      thumbnail_url: fileUrl,
      file_type: req.file.mimetype,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user?.id || 1,
      shot_count: shot_count ? parseInt(shot_count) : null,
      metadata
    });

    // DB BYTEA에 이미지 데이터 저장 (Cloudinary 미사용 시)
    if (storeInDb && photo.id) {
      try {
        const { sequelize } = require('../models/newIndex');
        // image_data 컬럼 확인 및 추가
        try {
          await sequelize.query('ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS image_data BYTEA');
        } catch (e) { /* 이미 존재하면 무시 */ }
        await sequelize.query(
          'UPDATE inspection_photos SET image_data = $1 WHERE id = $2',
          { bind: [req.file.buffer, photo.id], type: sequelize.QueryTypes.UPDATE }
        );
        // fileUrl을 DB ID 기반으로 업데이트
        await sequelize.query(
          'UPDATE inspection_photos SET file_url = $1, thumbnail_url = $1 WHERE id = $2',
          { bind: [`/api/v1/inspection-photos/file/${photo.id}`, photo.id], type: sequelize.QueryTypes.UPDATE }
        );
        photo.file_url = `/api/v1/inspection-photos/file/${photo.id}`;
        photo.thumbnail_url = photo.file_url;
      } catch (dbErr) {
        console.error('DB BYTEA 저장 실패:', dbErr.message);
      }
    }

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

// DB BYTEA에서 이미지 파일 조회
router.get('/file/:id', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { id } = req.params;

    // UUID 형식이면 file_url에서 매칭, 숫자면 id로 매칭
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query, replacements;
    if (isUUID) {
      query = 'SELECT * FROM inspection_photos WHERE file_url LIKE $1 LIMIT 1';
      replacements = [`%${id}%`];
    } else {
      query = 'SELECT * FROM inspection_photos WHERE id = $1 LIMIT 1';
      replacements = [id];
    }
    const [rows] = await sequelize.query(query, { bind: replacements });
    const photo = rows[0];

    if (!photo) {
      return res.status(404).json({ success: false, message: '이미지를 찾을 수 없습니다.' });
    }

    // image_data가 있으면 BYTEA에서 직접 반환
    if (photo.image_data) {
      res.set('Content-Type', photo.mime_type || photo.file_type || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000');
      return res.send(photo.image_data);
    }

    // 외부 URL이면 리다이렉트
    if (photo.file_url && photo.file_url.startsWith('http')) {
      return res.redirect(photo.file_url);
    }

    res.status(404).json({ success: false, message: '이미지 데이터를 찾을 수 없습니다.' });
  } catch (error) {
    console.error('이미지 파일 조회 오류:', error);
    res.status(500).json({ success: false, message: '이미지 조회 실패', error: error.message });
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

    // Cloudinary 이미지인 경우 Cloudinary에서도 삭제
    if (photo.file_url && photo.file_url.includes('cloudinary.com')) {
      try {
        const publicId = getPublicIdFromUrl(photo.file_url);
        if (publicId) {
          await deleteCloudinaryImage(publicId);
        }
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
      }
    }

    // DB에서 삭제 (BYTEA 데이터 포함)
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
