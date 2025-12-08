const logger = require('../utils/logger');
const pool = require('../config/database');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'cams-mold-images';

/**
 * 금형/제품 이미지 업로드
 */
const uploadMoldImage = async (req, res) => {
  try {
    const { mold_id, mold_spec_id, image_type = 'mold', description, is_primary } = req.body;
    const file = req.file;
    const uploaded_by = req.user.id;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: '이미지 파일이 필요합니다.' }
      });
    }

    if (!mold_id && !mold_spec_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'mold_id 또는 mold_spec_id가 필요합니다.' }
      });
    }

    // 파일 확장자 확인
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: { message: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WEBP만 허용)' }
      });
    }

    // S3 업로드 키 생성
    const fileExtension = path.extname(file.originalname);
    const fileName = `${image_type}/${mold_spec_id || mold_id}/${uuidv4()}${fileExtension}`;

    let imageUrl;

    // S3 업로드 시도
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read'
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${fileName}`;
      } catch (s3Error) {
        logger.error('S3 upload error:', s3Error);
        // S3 실패 시 Base64로 저장
        imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    } else {
      // S3 설정이 없으면 Base64로 저장 (개발용)
      imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    // is_primary가 true이면 기존 대표 이미지 해제
    if (is_primary === 'true' || is_primary === true) {
      await pool.query(`
        UPDATE mold_images 
        SET is_primary = false, updated_at = NOW()
        WHERE (mold_id = $1 OR mold_spec_id = $2) AND image_type = $3
      `, [mold_id, mold_spec_id, image_type]);
    }

    // DB에 이미지 정보 저장
    const insertQuery = `
      INSERT INTO mold_images (
        mold_id, mold_spec_id, image_type, image_url, 
        original_filename, file_size, mime_type,
        description, is_primary, uploaded_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      mold_id || null,
      mold_spec_id || null,
      image_type,
      imageUrl,
      file.originalname,
      file.size,
      file.mimetype,
      description || null,
      is_primary === 'true' || is_primary === true,
      uploaded_by
    ]);

    const savedImage = result.rows[0];

    // 대표 이미지인 경우 mold_specifications 테이블도 업데이트
    if ((is_primary === 'true' || is_primary === true) && mold_spec_id) {
      const columnName = image_type === 'product' ? 'product_image_url' : 'mold_image_url';
      await pool.query(`
        UPDATE mold_specifications 
        SET ${columnName} = $1, updated_at = NOW()
        WHERE id = $2
      `, [imageUrl, mold_spec_id]);
    }

    res.status(201).json({
      success: true,
      data: savedImage
    });
  } catch (error) {
    logger.error('Upload mold image error:', error);
    res.status(500).json({
      success: false,
      error: { message: '이미지 업로드 실패', details: error.message }
    });
  }
};

/**
 * 금형/제품 이미지 목록 조회
 */
const getMoldImages = async (req, res) => {
  try {
    const { mold_id, mold_spec_id, image_type } = req.query;

    let query = `
      SELECT mi.*, u.name as uploader_name
      FROM mold_images mi
      LEFT JOIN users u ON mi.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (mold_id) {
      params.push(mold_id);
      query += ` AND mi.mold_id = $${params.length}`;
    }

    if (mold_spec_id) {
      params.push(mold_spec_id);
      query += ` AND mi.mold_spec_id = $${params.length}`;
    }

    if (image_type) {
      params.push(image_type);
      query += ` AND mi.image_type = $${params.length}`;
    }

    query += ` ORDER BY mi.is_primary DESC, mi.display_order, mi.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get mold images error:', error);
    res.status(500).json({
      success: false,
      error: { message: '이미지 목록 조회 실패', details: error.message }
    });
  }
};

/**
 * 대표 이미지 설정
 */
const setPrimaryImage = async (req, res) => {
  try {
    const { id } = req.params;

    // 현재 이미지 정보 조회
    const imageResult = await pool.query('SELECT * FROM mold_images WHERE id = $1', [id]);
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '이미지를 찾을 수 없습니다.' }
      });
    }

    const image = imageResult.rows[0];

    // 같은 타입의 기존 대표 이미지 해제
    await pool.query(`
      UPDATE mold_images 
      SET is_primary = false, updated_at = NOW()
      WHERE (mold_id = $1 OR mold_spec_id = $2) AND image_type = $3
    `, [image.mold_id, image.mold_spec_id, image.image_type]);

    // 새 대표 이미지 설정
    await pool.query(`
      UPDATE mold_images 
      SET is_primary = true, updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // mold_specifications 테이블 업데이트
    if (image.mold_spec_id) {
      const columnName = image.image_type === 'product' ? 'product_image_url' : 'mold_image_url';
      await pool.query(`
        UPDATE mold_specifications 
        SET ${columnName} = $1, updated_at = NOW()
        WHERE id = $2
      `, [image.image_url, image.mold_spec_id]);
    }

    res.json({
      success: true,
      data: { message: '대표 이미지가 설정되었습니다.' }
    });
  } catch (error) {
    logger.error('Set primary image error:', error);
    res.status(500).json({
      success: false,
      error: { message: '대표 이미지 설정 실패', details: error.message }
    });
  }
};

/**
 * 이미지 삭제
 */
const deleteMoldImage = async (req, res) => {
  try {
    const { id } = req.params;

    // 이미지 정보 조회
    const imageResult = await pool.query('SELECT * FROM mold_images WHERE id = $1', [id]);
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '이미지를 찾을 수 없습니다.' }
      });
    }

    const image = imageResult.rows[0];

    // S3에서 삭제 시도 (S3 URL인 경우)
    if (image.image_url && image.image_url.includes('s3.') && process.env.AWS_ACCESS_KEY_ID) {
      try {
        const key = image.image_url.split('.com/')[1];
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key
        }));
      } catch (s3Error) {
        logger.error('S3 delete error:', s3Error);
      }
    }

    // DB에서 삭제
    await pool.query('DELETE FROM mold_images WHERE id = $1', [id]);

    // 대표 이미지였다면 mold_specifications 업데이트
    if (image.is_primary && image.mold_spec_id) {
      const columnName = image.image_type === 'product' ? 'product_image_url' : 'mold_image_url';
      await pool.query(`
        UPDATE mold_specifications 
        SET ${columnName} = NULL, updated_at = NOW()
        WHERE id = $1
      `, [image.mold_spec_id]);
    }

    res.json({
      success: true,
      data: { message: '이미지가 삭제되었습니다.' }
    });
  } catch (error) {
    logger.error('Delete mold image error:', error);
    res.status(500).json({
      success: false,
      error: { message: '이미지 삭제 실패', details: error.message }
    });
  }
};

module.exports = {
  uploadMoldImage,
  getMoldImages,
  setPrimaryImage,
  deleteMoldImage
};
