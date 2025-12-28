const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { sequelize } = require('../models/newIndex');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { uploadImage, deleteImage: deleteCloudinaryImage, getPublicIdFromUrl } = require('../config/cloudinary');

// Cloudinary 환경변수 체크
const CLOUDINARY_ENABLED = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Multer 설정 (메모리 스토리지)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if ([...allowedImageTypes, ...allowedDocTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  }
});

/**
 * POST /api/v1/files/upload
 * 범용 파일 업로드 API
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: '파일이 필요합니다.' }
      });
    }

    const {
      entity_type,  // mold, checklist, inspection, repair, transfer, tryout_issue
      entity_id,
      category,
      description
    } = req.body;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'entity_type과 entity_id가 필요합니다.' }
      });
    }

    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${entity_type}/${entity_id}/${fileId}${fileExtension}`;
    const isImage = file.mimetype.startsWith('image/');

    let fileUrl = `/api/v1/files/${fileId}`;
    let cloudinaryPublicId = null;

    // 이미지인 경우 Cloudinary 업로드 시도
    if (isImage && CLOUDINARY_ENABLED) {
      try {
        const cloudinaryResult = await uploadImage(file.buffer, {
          folder: `cams-molds/files/${entity_type}/${entity_id}`,
          public_id: fileId
        });
        fileUrl = cloudinaryResult.secure_url;
        cloudinaryPublicId = cloudinaryResult.public_id;
        logger.info('File uploaded to Cloudinary:', fileUrl);
      } catch (cloudErr) {
        logger.error('Cloudinary upload error, falling back to DB:', cloudErr.message);
      }
    }

    // file_attachments 테이블에 저장
    const [rows] = await sequelize.query(`
      INSERT INTO file_attachments (
        entity_type, entity_id, file_name, file_url, file_type, file_size, uploaded_by, uploaded_at
      ) VALUES (
        :entity_type, :entity_id, :file_name, :file_url, :file_type, :file_size, :uploaded_by, NOW()
      )
      RETURNING *
    `, {
      replacements: {
        entity_type,
        entity_id: parseInt(entity_id),
        file_name: file.originalname,
        file_url: fileUrl,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: req.user?.id || null
      }
    });

    // Cloudinary에 업로드되지 않은 경우에만 BYTEA에 저장
    if (!cloudinaryPublicId && rows && rows[0]) {
      try {
        await sequelize.query(`
          UPDATE file_attachments 
          SET file_data = $1 
          WHERE id = $2
        `, {
          bind: [file.buffer, rows[0].id],
          type: sequelize.QueryTypes.UPDATE
        });
      } catch (e) {
        // file_data 컨럼이 없으면 추가
        try {
          await sequelize.query(`ALTER TABLE file_attachments ADD COLUMN IF NOT EXISTS file_data BYTEA`);
          await sequelize.query(`
            UPDATE file_attachments 
            SET file_data = $1 
            WHERE id = $2
          `, {
            bind: [file.buffer, rows[0].id],
            type: sequelize.QueryTypes.UPDATE
          });
        } catch (e2) {
          logger.warn('Failed to save file_data:', e2.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: rows[0].id,
        file_name: file.originalname,
        file_url: fileUrl,
        file_type: file.mimetype,
        file_size: file.size,
        is_image: isImage,
        cloudinary_public_id: cloudinaryPublicId
      }
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 업로드 실패', details: error.message }
    });
  }
});

/**
 * POST /api/v1/files/upload-multiple
 * 다중 파일 업로드 API
 */
router.post('/upload-multiple', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '파일이 필요합니다.' }
      });
    }

    const { entity_type, entity_id, category } = req.body;

    if (!entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'entity_type과 entity_id가 필요합니다.' }
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileId = uuidv4();
      const isImage = file.mimetype.startsWith('image/');

      const [rows] = await sequelize.query(`
        INSERT INTO file_attachments (
          entity_type, entity_id, file_name, file_url, file_type, file_size, uploaded_by, uploaded_at
        ) VALUES (
          :entity_type, :entity_id, :file_name, :file_url, :file_type, :file_size, :uploaded_by, NOW()
        )
        RETURNING *
      `, {
        replacements: {
          entity_type,
          entity_id: parseInt(entity_id),
          file_name: file.originalname,
          file_url: `/api/v1/files/${fileId}`,
          file_type: file.mimetype,
          file_size: file.size,
          uploaded_by: req.user?.id || null
        }
      });

      // 파일 데이터 저장
      if (rows && rows[0]) {
        try {
          await sequelize.query(`
            UPDATE file_attachments SET file_data = $1 WHERE id = $2
          `, {
            bind: [file.buffer, rows[0].id],
            type: sequelize.QueryTypes.UPDATE
          });
        } catch (e) {
          logger.warn('Failed to save file_data:', e.message);
        }
      }

      uploadedFiles.push({
        id: rows[0].id,
        file_name: file.originalname,
        file_url: `/api/v1/files/${rows[0].id}`,
        file_type: file.mimetype,
        file_size: file.size,
        is_image: isImage
      });
    }

    res.status(201).json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 업로드 실패', details: error.message }
    });
  }
});

/**
 * GET /api/v1/files/:id
 * 파일 다운로드/조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await sequelize.query(`
      SELECT * FROM file_attachments WHERE id = :id
    `, { replacements: { id: parseInt(id) } });

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '파일을 찾을 수 없습니다.' }
      });
    }

    const file = rows[0];

    if (file.file_data) {
      res.set('Content-Type', file.file_type || 'application/octet-stream');
      res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`);
      res.set('Cache-Control', 'public, max-age=31536000');
      return res.send(file.file_data);
    }

    res.status(404).json({
      success: false,
      error: { message: '파일 데이터를 찾을 수 없습니다.' }
    });
  } catch (error) {
    logger.error('File download error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 다운로드 실패', details: error.message }
    });
  }
});

/**
 * GET /api/v1/files/entity/:entity_type/:entity_id
 * 엔티티별 파일 목록 조회
 */
router.get('/entity/:entity_type/:entity_id', authenticate, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;

    const [rows] = await sequelize.query(`
      SELECT id, entity_type, entity_id, file_name, file_url, file_type, file_size, uploaded_by, uploaded_at
      FROM file_attachments 
      WHERE entity_type = :entity_type AND entity_id = :entity_id
      ORDER BY uploaded_at DESC
    `, { replacements: { entity_type, entity_id: parseInt(entity_id) } });

    res.json({
      success: true,
      data: rows || []
    });
  } catch (error) {
    logger.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 목록 조회 실패', details: error.message }
    });
  }
});

/**
 * DELETE /api/v1/files/:id
 * 파일 삭제
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(`DELETE FROM file_attachments WHERE id = :id`, {
      replacements: { id: parseInt(id) }
    });

    res.json({
      success: true,
      data: { message: '파일이 삭제되었습니다.' }
    });
  } catch (error) {
    logger.error('File delete error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 삭제 실패', details: error.message }
    });
  }
});

module.exports = router;
