const logger = require('../utils/logger');
const { sequelize } = require('../models/newIndex');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// S3 환경변수 체크
const S3_ENABLED = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// S3 클라이언트 설정 (환경변수가 있을 때만)
let s3Client = null;
if (S3_ENABLED) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  logger.info('S3 client initialized successfully');
} else {
  logger.warn('S3 credentials not configured - image upload will use local storage');
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'cams-mold-images';
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * 금형/제품 이미지 업로드
 * 다양한 연계 항목 지원: 금형정보, 체크리스트, 점검, 수리, 이관 등
 */
const uploadMoldImage = async (req, res) => {
  try {
    // 먼저 테이블 존재 여부 확인 및 생성
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS mold_images (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
          mold_spec_id INTEGER,
          image_type VARCHAR(50) NOT NULL DEFAULT 'mold',
          image_url TEXT NOT NULL,
          original_filename VARCHAR(255),
          file_size INTEGER,
          mime_type VARCHAR(100),
          description TEXT,
          display_order INTEGER DEFAULT 0,
          is_primary BOOLEAN DEFAULT FALSE,
          uploaded_by INTEGER,
          reference_type VARCHAR(50),
          reference_id INTEGER,
          checklist_id INTEGER,
          checklist_item_id INTEGER,
          repair_id INTEGER,
          transfer_id INTEGER,
          maker_spec_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableError) {
      logger.warn('Table creation check:', tableError.message);
    }

    const { 
      mold_id, 
      mold_spec_id, 
      image_type = 'mold', 
      description, 
      is_primary,
      // 연계 항목들
      reference_type,  // mold_info, daily_check, periodic_check, repair, transfer, maker_checklist, development
      reference_id,
      checklist_id,
      checklist_item_id,
      repair_id,
      transfer_id,
      maker_spec_id
    } = req.body;
    const file = req.file;
    const uploaded_by = req.user?.id || null;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: '이미지 파일이 필요합니다.' }
      });
    }

    // 최소한 하나의 연계 ID가 필요
    if (!mold_id && !mold_spec_id && !checklist_id && !repair_id && !transfer_id && !maker_spec_id && !reference_id) {
      return res.status(400).json({
        success: false,
        error: { message: '연계할 항목 ID가 필요합니다. (mold_id, mold_spec_id, checklist_id, repair_id, transfer_id, maker_spec_id, reference_id 중 하나)' }
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

    // 이미지 저장 방식 결정
    const fileExtension = path.extname(file.originalname);
    const fileId = uuidv4();
    const fileName = `${image_type}/${mold_spec_id || mold_id}/${fileId}${fileExtension}`;

    let imageUrl;
    let imageData = null;

    // S3 업로드 시도 (환경변수가 있을 때만)
    if (S3_ENABLED && s3Client) {
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
        logger.info('Image uploaded to S3:', imageUrl);
      } catch (s3Error) {
        logger.error('S3 upload error, falling back to DB storage:', s3Error.message);
        // S3 실패 시 DB에 직접 저장
        imageData = file.buffer;
        imageUrl = `/api/v1/mold-images/file/${fileId}`;
      }
    } else {
      // S3 설정이 없으면 PostgreSQL BYTEA에 직접 저장
      imageData = file.buffer;
      imageUrl = `/api/v1/mold-images/file/${fileId}`;
      logger.info('Image will be stored in PostgreSQL BYTEA');
    }

    // is_primary가 true이면 기존 대표 이미지 해제
    if (is_primary === 'true' || is_primary === true) {
      await sequelize.query(`
        UPDATE mold_images 
        SET is_primary = false, updated_at = NOW()
        WHERE (mold_id = :mold_id OR mold_spec_id = :mold_spec_id) AND image_type = :image_type
      `, { replacements: { mold_id, mold_spec_id, image_type } });
    }

    // DB에 이미지 정보 저장
    let result;
    
    // 먼저 확장 컬럼(image_data 포함)으로 시도, 실패하면 기본 컬럼으로 재시도
    try {
      const insertQuery = `
        INSERT INTO mold_images (
          mold_id, mold_spec_id, image_type, image_url, image_data,
          original_filename, file_size, mime_type,
          description, is_primary, uploaded_by,
          reference_type, reference_id, checklist_id, checklist_item_id,
          repair_id, transfer_id, maker_spec_id,
          created_at, updated_at
        ) VALUES (
          :mold_id, :mold_spec_id, :image_type, :image_url, :image_data,
          :original_filename, :file_size, :mime_type,
          :description, :is_primary, :uploaded_by,
          :reference_type, :reference_id, :checklist_id, :checklist_item_id,
          :repair_id, :transfer_id, :maker_spec_id,
          NOW(), NOW()
        )
        RETURNING *
      `;
      const [rows] = await sequelize.query(insertQuery, {
        replacements: {
          mold_id: mold_id || null,
          mold_spec_id: mold_spec_id || null,
          image_type,
          image_url: imageUrl,
          image_data: imageData, // BYTEA로 저장
          original_filename: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          description: description || null,
          is_primary: is_primary === 'true' || is_primary === true,
          uploaded_by,
          reference_type: reference_type || null,
          reference_id: reference_id || null,
          checklist_id: checklist_id || null,
          checklist_item_id: checklist_item_id || null,
          repair_id: repair_id || null,
          transfer_id: transfer_id || null,
          maker_spec_id: maker_spec_id || null
        }
      });
      result = { rows };
    } catch (extendedError) {
      // 확장 컬럼이 없으면 기본 컬럼만 사용 (image_data 포함)
      logger.warn('Extended columns not available, using basic columns:', extendedError.message);
      const basicInsertQuery = `
        INSERT INTO mold_images (
          mold_id, mold_spec_id, image_type, image_url, image_data,
          original_filename, file_size, mime_type,
          description, is_primary, uploaded_by,
          created_at, updated_at
        ) VALUES (
          :mold_id, :mold_spec_id, :image_type, :image_url, :image_data,
          :original_filename, :file_size, :mime_type,
          :description, :is_primary, :uploaded_by,
          NOW(), NOW()
        )
        RETURNING *
      `;
      const [basicRows] = await sequelize.query(basicInsertQuery, {
        replacements: {
          mold_id: mold_id || null,
          mold_spec_id: mold_spec_id || null,
          image_type,
          image_url: imageUrl,
          image_data: imageData, // BYTEA로 저장
          original_filename: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          description: description || null,
          is_primary: is_primary === 'true' || is_primary === true,
          uploaded_by
        }
      });
      result = { rows: basicRows };
    }

    const savedImage = result.rows[0];

    // 대표 이미지인 경우 mold_specifications 테이블도 업데이트
    if ((is_primary === 'true' || is_primary === true) && mold_spec_id) {
      const columnName = image_type === 'product' ? 'product_image_url' : 'mold_image_url';
      await sequelize.query(`
        UPDATE mold_specifications 
        SET ${columnName} = :imageUrl, updated_at = NOW()
        WHERE id = :mold_spec_id
      `, { replacements: { imageUrl, mold_spec_id } });
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
 * 다양한 연계 항목으로 필터링 가능
 */
const getMoldImages = async (req, res) => {
  try {
    const { 
      mold_id, 
      mold_spec_id, 
      image_type,
      reference_type,
      reference_id,
      checklist_id,
      repair_id,
      transfer_id,
      maker_spec_id
    } = req.query;

    // 먼저 테이블 존재 여부 확인 및 생성
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS mold_images (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
          mold_spec_id INTEGER,
          image_type VARCHAR(50) NOT NULL DEFAULT 'mold',
          image_url TEXT NOT NULL,
          original_filename VARCHAR(255),
          file_size INTEGER,
          mime_type VARCHAR(100),
          description TEXT,
          display_order INTEGER DEFAULT 0,
          is_primary BOOLEAN DEFAULT FALSE,
          uploaded_by INTEGER,
          reference_type VARCHAR(50),
          reference_id INTEGER,
          checklist_id INTEGER,
          checklist_item_id INTEGER,
          repair_id INTEGER,
          transfer_id INTEGER,
          maker_spec_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableError) {
      // 테이블 생성 실패해도 계속 진행
      logger.warn('Table creation check:', tableError.message);
    }

    // 테이블 존재 확인
    try {
      await sequelize.query('SELECT 1 FROM mold_images LIMIT 1');
    } catch (tableError) {
      // 테이블이 없으면 빈 배열 반환
      logger.warn('mold_images table does not exist, returning empty array');
      return res.json({
        success: true,
        data: []
      });
    }

    // 기본 쿼리 - display_order 컬럼이 없을 수 있으므로 안전하게 처리
    let query = `
      SELECT mi.*, u.name as uploader_name
      FROM mold_images mi
      LEFT JOIN users u ON mi.uploaded_by = u.id
      WHERE 1=1
    `;
    const replacements = {};

    if (mold_id) {
      query += ` AND mi.mold_id = :mold_id`;
      replacements.mold_id = mold_id;
    }

    if (mold_spec_id) {
      query += ` AND mi.mold_spec_id = :mold_spec_id`;
      replacements.mold_spec_id = mold_spec_id;
    }

    if (image_type) {
      query += ` AND mi.image_type = :image_type`;
      replacements.image_type = image_type;
    }

    if (reference_type) {
      query += ` AND mi.reference_type = :reference_type`;
      replacements.reference_type = reference_type;
    }

    if (reference_id) {
      query += ` AND mi.reference_id = :reference_id`;
      replacements.reference_id = reference_id;
    }

    if (checklist_id) {
      query += ` AND mi.checklist_id = :checklist_id`;
      replacements.checklist_id = checklist_id;
    }

    if (repair_id) {
      query += ` AND mi.repair_id = :repair_id`;
      replacements.repair_id = repair_id;
    }

    if (transfer_id) {
      query += ` AND mi.transfer_id = :transfer_id`;
      replacements.transfer_id = transfer_id;
    }

    if (maker_spec_id) {
      query += ` AND mi.maker_spec_id = :maker_spec_id`;
      replacements.maker_spec_id = maker_spec_id;
    }

    query += ` ORDER BY mi.is_primary DESC, mi.created_at DESC`;

    const [rows] = await sequelize.query(query, { replacements });

    res.json({
      success: true,
      data: rows || []
    });
  } catch (error) {
    logger.error('Get mold images error:', error);
    // 테이블 관련 에러인 경우 빈 배열 반환
    if (error.message && (error.message.includes('does not exist') || error.message.includes('column') || error.message.includes('relation'))) {
      return res.json({
        success: true,
        data: []
      });
    }
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
    const [imageRows] = await sequelize.query('SELECT * FROM mold_images WHERE id = :id', { replacements: { id } });
    
    if (imageRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '이미지를 찾을 수 없습니다.' }
      });
    }

    const image = imageRows[0];

    // 같은 타입의 기존 대표 이미지 해제
    await sequelize.query(`
      UPDATE mold_images 
      SET is_primary = false, updated_at = NOW()
      WHERE (mold_id = :mold_id OR mold_spec_id = :mold_spec_id) AND image_type = :image_type
    `, { replacements: { mold_id: image.mold_id, mold_spec_id: image.mold_spec_id, image_type: image.image_type } });

    // 새 대표 이미지 설정
    await sequelize.query(`
      UPDATE mold_images 
      SET is_primary = true, updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id } });

    // mold_specifications 테이블 업데이트
    if (image.mold_spec_id) {
      const columnName = image.image_type === 'product' ? 'product_image_url' : 'mold_image_url';
      await sequelize.query(`
        UPDATE mold_specifications 
        SET ${columnName} = :image_url, updated_at = NOW()
        WHERE id = :mold_spec_id
      `, { replacements: { image_url: image.image_url, mold_spec_id: image.mold_spec_id } });
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
    const [deleteImageRows] = await sequelize.query('SELECT * FROM mold_images WHERE id = :id', { replacements: { id } });
    
    if (deleteImageRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '이미지를 찾을 수 없습니다.' }
      });
    }

    const image = deleteImageRows[0];

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
    await sequelize.query('DELETE FROM mold_images WHERE id = :id', { replacements: { id } });

    // 대표 이미지였다면 mold_specifications 업데이트
    if (image.is_primary && image.mold_spec_id) {
      const columnName = image.image_type === 'product' ? 'product_image_url' : 'mold_image_url';
      await sequelize.query(`
        UPDATE mold_specifications 
        SET ${columnName} = NULL, updated_at = NOW()
        WHERE id = :mold_spec_id
      `, { replacements: { mold_spec_id: image.mold_spec_id } });
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

/**
 * DB에 저장된 이미지 파일 조회 (BYTEA)
 * GET /api/v1/mold-images/file/:id
 */
const getImageFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ID로 이미지 조회 (image_url에서 ID 추출하거나 직접 ID로 조회)
    let image;
    
    // UUID 형식인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      // image_url에 UUID가 포함된 경우
      const [rows] = await sequelize.query(
        `SELECT * FROM mold_images WHERE image_url LIKE :pattern LIMIT 1`,
        { replacements: { pattern: `%${id}%` } }
      );
      image = rows[0];
    } else {
      // 숫자 ID인 경우
      const [rows] = await sequelize.query(
        `SELECT * FROM mold_images WHERE id = :id`,
        { replacements: { id: parseInt(id) } }
      );
      image = rows[0];
    }
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: { message: '이미지를 찾을 수 없습니다.' }
      });
    }
    
    // image_data가 있으면 BYTEA에서 직접 반환
    if (image.image_data) {
      res.set('Content-Type', image.mime_type || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // 1년 캐시
      return res.send(image.image_data);
    }
    
    // image_data가 없고 image_url이 외부 URL이면 리다이렉트
    if (image.image_url && image.image_url.startsWith('http')) {
      return res.redirect(image.image_url);
    }
    
    // image_url이 Base64인 경우
    if (image.image_url && image.image_url.startsWith('data:')) {
      const matches = image.image_url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=31536000');
        return res.send(buffer);
      }
    }
    
    res.status(404).json({
      success: false,
      error: { message: '이미지 데이터를 찾을 수 없습니다.' }
    });
  } catch (error) {
    logger.error('Get image file error:', error);
    res.status(500).json({
      success: false,
      error: { message: '이미지 조회 실패', details: error.message }
    });
  }
};

module.exports = {
  uploadMoldImage,
  getMoldImages,
  setPrimaryImage,
  deleteMoldImage,
  getImageFile
};
