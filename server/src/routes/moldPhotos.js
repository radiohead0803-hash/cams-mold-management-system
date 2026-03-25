const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * 금형 사진 관리 API
 *
 * GET /api/v1/mold-photos?moldId=123 — 금형별 사진 목록 조회
 */

// 인증 필수
router.use(authenticate);

/**
 * GET /
 * 특정 금형의 사진 목록 조회
 * Query params: moldId (required), photo_type, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { moldId, photo_type, limit = 50, offset = 0 } = req.query;

    if (!moldId) {
      return res.status(400).json({
        success: false,
        error: { message: 'moldId 파라미터가 필요합니다.' }
      });
    }

    const parsedMoldId = parseInt(moldId);
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    // 1. mold_photos 테이블에서 금형 사진 조회
    let typeFilter = '';
    const binds = [parsedMoldId, parsedLimit, parsedOffset];

    if (photo_type) {
      binds.push(photo_type);
      typeFilter = `AND photo_type = $${binds.length}`;
    }

    const [moldPhotos] = await sequelize.query(
      `SELECT
        id,
        mold_id,
        photo_type,
        file_name,
        original_name,
        file_url,
        thumbnail_url,
        file_size,
        mime_type,
        description,
        uploaded_by,
        is_primary,
        display_order,
        metadata,
        created_at,
        updated_at,
        'mold_photo' AS source
      FROM mold_photos
      WHERE mold_id = $1
      ${typeFilter}
      ORDER BY is_primary DESC, display_order ASC, created_at DESC
      LIMIT $2 OFFSET $3`,
      { bind: binds }
    ).catch(() => [[]]);

    // 2. inspection_photos 테이블에서 이미지 타입 사진도 조회
    const [inspPhotos] = await sequelize.query(
      `SELECT
        id,
        mold_id,
        inspection_type AS photo_type,
        file_name,
        original_name,
        file_url,
        thumbnail_url,
        file_size,
        mime_type,
        description,
        uploaded_by,
        false AS is_primary,
        0 AS display_order,
        metadata,
        created_at,
        created_at AS updated_at,
        'inspection_photo' AS source
      FROM inspection_photos
      WHERE mold_id = $1
        AND is_active = true
        AND (mime_type LIKE 'image/%')
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      { bind: [parsedMoldId, parsedLimit, parsedOffset] }
    ).catch(() => [[]]);

    // 결과 병합: mold_photos 우선, 그 다음 inspection_photos
    const data = [...(moldPhotos || []), ...(inspPhotos || [])];

    res.json({
      success: true,
      data: data.slice(0, parsedLimit)
    });
  } catch (error) {
    console.error('금형 사진 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 사진 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
