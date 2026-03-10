const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { uploadImage, deleteImage: deleteCloudinaryImage, getPublicIdFromUrl } = require('../config/cloudinary');

// Cloudinary 환경변수 체크
const CLOUDINARY_ENABLED = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Haversine 공식으로 두 GPS 좌표 사이 거리(미터) 계산
function calculateDistanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

// 사진 업로드 (Sequelize 모델 사용)
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { InspectionPhoto, sequelize } = require('../models/newIndex');
    const { 
      mold_id, checklist_id, item_id, inspection_type, shot_count, category,
      source_page, capture_method, gps_latitude, gps_longitude,
      repair_request_id, entity_type, entity_id, checklist_type
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 없습니다.' });
    }

    const photoId = uuidv4();
    let fileUrl;
    let storeInDb = false;

    // 1. Cloudinary 업로드 시도
    if (CLOUDINARY_ENABLED) {
      try {
        const cloudinaryResult = await uploadImage(req.file.buffer, {
          folder: `cams-molds/inspection-photos/${mold_id || 'general'}`,
          public_id: `photo_${Date.now()}`
        });
        fileUrl = cloudinaryResult.secure_url;
      } catch (cloudErr) {
        console.error('Cloudinary upload error, falling back to DB BYTEA:', cloudErr.message);
        storeInDb = true;
      }
    } else {
      storeInDb = true;
    }

    if (storeInDb) {
      fileUrl = `/api/v1/inspection-photos/file/${photoId}`;
    }

    const fileName = `photo_${Date.now()}_${req.file.originalname}`;
    const uploadedBy = req.user?.id || 1;

    const parsedLat = gps_latitude ? parseFloat(gps_latitude) : null;
    const parsedLng = gps_longitude ? parseFloat(gps_longitude) : null;
    const parsedAccuracy = req.body.gps_accuracy ? parseFloat(req.body.gps_accuracy) : null;
    const parsedMoldId = mold_id ? parseInt(mold_id) : null;

    // Sequelize 모델로 INSERT
    const photo = await InspectionPhoto.create({
      id: photoId,
      mold_id: parsedMoldId,
      checklist_id: checklist_id ? parseInt(checklist_id) : null,
      checklist_type: checklist_type || null,
      item_id: item_id ? parseInt(item_id) : null,
      category: category || null,
      inspection_type: inspection_type || 'daily',
      file_name: fileName,
      original_name: req.file.originalname,
      file_url: fileUrl,
      thumbnail_url: fileUrl,
      file_type: req.file.mimetype,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: uploadedBy,
      shot_count: shot_count ? parseInt(shot_count) : null,
      metadata: { uploadedFrom: req.headers['user-agent'] || 'unknown' },
      is_active: true,
      source_page: source_page || null,
      capture_method: capture_method || null,
      gps_latitude: parsedLat,
      gps_longitude: parsedLng,
      repair_request_id: repair_request_id ? parseInt(repair_request_id) : null,
      entity_type: entity_type || null,
      entity_id: entity_id ? parseInt(entity_id) : null
    });

    // GPS 정확도 저장 (별도 업데이트 - 모델에 없을 수 있음)
    if (parsedAccuracy !== null) {
      try {
        await sequelize.query(
          'UPDATE inspection_photos SET gps_accuracy = $1 WHERE id = $2',
          { bind: [parsedAccuracy, photoId] }
        );
      } catch (e) { /* gps_accuracy 컬럼 미존재 시 무시 */ }
    }

    // DB BYTEA에 이미지 데이터 저장 (Cloudinary 미사용 시)
    if (storeInDb) {
      try {
        await sequelize.query(
          'UPDATE inspection_photos SET image_data = $1 WHERE id = $2',
          { bind: [req.file.buffer, photoId] }
        );
      } catch (dbErr) {
        console.error('DB BYTEA 저장 실패:', dbErr.message);
      }
    }

    // ★ GPS 좌표 + mold_id가 있으면 → 금형 위치 자동 업데이트 + 이력 기록
    let locationUpdated = false;
    let driftDetected = false;
    if (parsedLat && parsedLng && parsedMoldId) {
      try {
        // 1. molds 테이블의 last_gps 업데이트
        const [moldRows] = await sequelize.query(
          'SELECT base_gps_lat, base_gps_lng, drift_threshold_m FROM molds WHERE id = $1',
          { bind: [parsedMoldId] }
        );
        const mold = moldRows[0];

        // 위치 이탈 감지: base 좌표가 있으면 거리 계산
        let distanceM = null;
        if (mold && mold.base_gps_lat && mold.base_gps_lng) {
          distanceM = calculateDistanceM(
            parseFloat(mold.base_gps_lat), parseFloat(mold.base_gps_lng),
            parsedLat, parsedLng
          );
          const threshold = mold.drift_threshold_m || 500;
          driftDetected = distanceM > threshold;
        }

        const locationStatus = driftDetected ? 'moved' : 'normal';

        await sequelize.query(
          `UPDATE molds SET 
            last_gps_lat = $1, last_gps_lng = $2, last_gps_time = NOW(),
            last_gps_accuracy = $3, last_gps_source = 'photo',
            location_status = $4
          WHERE id = $5`,
          { bind: [parsedLat, parsedLng, parsedAccuracy, locationStatus, parsedMoldId] }
        );

        // 2. mold_location_logs에 이력 기록
        await sequelize.query(
          `INSERT INTO mold_location_logs 
            (mold_id, scanned_by_id, scanned_at, gps_lat, gps_lng, distance_m, 
             status, source, notes, photo_id, accuracy, source_page, inspection_type, created_at)
          VALUES ($1, $2, NOW(), $3, $4, $5, $6, 'photo', $7, $8, $9, $10, $11, NOW())`,
          { bind: [
            parsedMoldId, uploadedBy, parsedLat, parsedLng,
            distanceM ? Math.round(distanceM) : null,
            driftDetected ? 'moved' : 'normal',
            driftDetected ? `위치이탈 감지: ${Math.round(distanceM)}m` : null,
            photoId, parsedAccuracy,
            source_page || null, inspection_type || 'daily'
          ]}
        );

        locationUpdated = true;

        // 3. 위치 이탈 시 알림 생성
        if (driftDetected) {
          try {
            await sequelize.query(
              `INSERT INTO alerts (mold_id, alert_type, severity, title, message, metadata, is_resolved, created_at)
              VALUES ($1, 'location_drift', 'high', $2, $3, $4, false, NOW())`,
              { bind: [
                parsedMoldId,
                '금형 위치 이탈 감지',
                `금형이 기준 위치에서 ${Math.round(distanceM)}m 이탈하였습니다.`,
                JSON.stringify({
                  photo_id: photoId,
                  distance_m: Math.round(distanceM),
                  gps_lat: parsedLat,
                  gps_lng: parsedLng,
                  base_lat: parseFloat(mold.base_gps_lat),
                  base_lng: parseFloat(mold.base_gps_lng),
                  source_page: source_page
                })
              ]}
            );
          } catch (alertErr) {
            console.error('위치이탈 알림 생성 실패:', alertErr.message);
          }
        }
      } catch (locErr) {
        console.error('금형 위치 업데이트 오류:', locErr.message);
      }
    }

    res.json({
      success: true,
      message: '사진이 업로드되었습니다.',
      data: {
        id: photoId,
        file_url: fileUrl,
        thumbnail_url: fileUrl,
        file_name: fileName,
        original_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        inspection_type: photo.inspection_type,
        source_page: photo.source_page,
        capture_method: photo.capture_method,
        gps_latitude: parsedLat,
        gps_longitude: parsedLng,
        gps_accuracy: parsedAccuracy,
        location_updated: locationUpdated,
        drift_detected: driftDetected
      }
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

// 특정 금형의 점검 사진 조회 (DB 레벨 필터링)
router.get('/mold/:moldId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { moldId } = req.params;
    const { inspection_type, item_id, source_page, limit = 50, offset = 0 } = req.query;

    const where = { mold_id: parseInt(moldId), is_active: true };
    if (inspection_type) where.inspection_type = inspection_type;
    if (item_id) where.item_id = parseInt(item_id);
    if (source_page) where.source_page = source_page;

    const { count, rows: photos } = await InspectionPhoto.findAndCountAll({
      where,
      order: [['uploaded_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: [] }
    });

    res.json({
      success: true,
      data: photos,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

// 특정 점검 항목의 사진 조회 (DB 레벨 필터링)
router.get('/item/:itemId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { itemId } = req.params;
    const { mold_id, inspection_type } = req.query;

    const where = { item_id: parseInt(itemId), is_active: true };
    if (mold_id) where.mold_id = parseInt(mold_id);
    if (inspection_type) where.inspection_type = inspection_type;

    const photos = await InspectionPhoto.findAll({
      where,
      order: [['uploaded_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

// 점검 유형별 사진 조회
router.get('/by-type/:inspectionType', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { inspectionType } = req.params;
    const { mold_id, limit = 50, offset = 0 } = req.query;

    const where = { inspection_type: inspectionType, is_active: true };
    if (mold_id) where.mold_id = parseInt(mold_id);

    const { count, rows: photos } = await InspectionPhoto.findAndCountAll({
      where,
      order: [['uploaded_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: photos,
      total: count
    });
  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 중 오류가 발생했습니다.', error: error.message });
  }
});

// 수리요청 관련 사진 조회
router.get('/repair/:repairRequestId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { repairRequestId } = req.params;

    const photos = await InspectionPhoto.findAll({
      where: { 
        repair_request_id: parseInt(repairRequestId),
        is_active: true
      },
      order: [['uploaded_at', 'DESC']]
    });

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('수리 사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '수리 사진 조회 실패', error: error.message });
  }
});

// 엔티티별 사진 조회 (범용)
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { InspectionPhoto } = require('../models/newIndex');
    const { entityType, entityId } = req.params;

    const photos = await InspectionPhoto.findAll({
      where: { 
        entity_type: entityType,
        entity_id: parseInt(entityId),
        is_active: true
      },
      order: [['uploaded_at', 'DESC']]
    });

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('엔티티 사진 조회 오류:', error);
    res.status(500).json({ success: false, message: '사진 조회 실패', error: error.message });
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

    // soft delete (is_active = false)
    await photo.update({ is_active: false });

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

// 통계 API
router.get('/stats/summary', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { mold_id } = req.query;

    let whereClause = 'WHERE is_active = true';
    const binds = [];
    if (mold_id) {
      binds.push(parseInt(mold_id));
      whereClause += ` AND mold_id = $${binds.length}`;
    }

    const [rows] = await sequelize.query(
      `SELECT 
        inspection_type, 
        COUNT(*) as count,
        MAX(uploaded_at) as last_upload
      FROM inspection_photos 
      ${whereClause}
      GROUP BY inspection_type 
      ORDER BY count DESC`,
      { bind: binds }
    );

    const [totalRow] = await sequelize.query(
      `SELECT COUNT(*) as total FROM inspection_photos ${whereClause}`,
      { bind: binds }
    );

    res.json({
      success: true,
      data: {
        by_type: rows,
        total: parseInt(totalRow[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error('사진 통계 오류:', error);
    res.status(500).json({ success: false, message: '통계 조회 실패', error: error.message });
  }
});

module.exports = router;
