const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * 금형 문서 관리 API
 *
 * GET /api/v1/mold-documents?moldId=123 — 금형별 문서 목록 조회
 */

// 인증 필수
router.use(authenticate);

/**
 * GET /
 * 특정 금형의 문서 목록 조회
 * Query params: moldId (required), type, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { moldId, type, limit = 50, offset = 0 } = req.query;

    if (!moldId) {
      return res.status(400).json({
        success: false,
        error: { message: 'moldId 파라미터가 필요합니다.' }
      });
    }

    // checklist_attachments 테이블에서 금형 관련 문서 조회
    // + standard_document_templates 에서 금형 관련 표준문서 조회
    let typeFilter = '';
    const binds = [parseInt(moldId), parseInt(limit), parseInt(offset)];

    if (type) {
      binds.push(type);
      typeFilter = `AND attachment_type = $${binds.length}`;
    }

    // 1. checklist_attachments에서 해당 금형 체크리스트의 첨부문서 조회
    const [attachments] = await sequelize.query(
      `SELECT
        ca.id,
        ca.file_name,
        ca.original_name,
        ca.file_url,
        ca.file_size,
        ca.mime_type,
        ca.attachment_type AS document_type,
        ca.description,
        ca.checklist_type,
        ca.category,
        ca.status,
        ca.created_at,
        'checklist_attachment' AS source
      FROM checklist_attachments ca
      WHERE ca.checklist_id IN (
        SELECT id FROM checklist_instances WHERE mold_id = $1
        UNION
        SELECT id FROM pre_production_checklists WHERE mold_id = $1
      )
      ${typeFilter}
      ORDER BY ca.created_at DESC
      LIMIT $2 OFFSET $3`,
      { bind: binds }
    ).catch(() => [[]]);

    // 2. inspection_photos에서 문서 타입 파일 조회 (PDF 등)
    const [docPhotos] = await sequelize.query(
      `SELECT
        id,
        file_name,
        original_name,
        file_url,
        file_size,
        mime_type,
        category AS document_type,
        description,
        checklist_type,
        category,
        'uploaded' AS status,
        created_at,
        'inspection_photo' AS source
      FROM inspection_photos
      WHERE mold_id = $1
        AND is_active = true
        AND (mime_type LIKE '%pdf%' OR mime_type LIKE '%document%' OR mime_type LIKE '%spreadsheet%' OR mime_type LIKE '%text%')
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      { bind: [parseInt(moldId), parseInt(limit), parseInt(offset)] }
    ).catch(() => [[]]);

    // 결과 병합
    const data = [...(attachments || []), ...(docPhotos || [])];
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      data: data.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('금형 문서 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: { message: '금형 문서 조회 중 오류가 발생했습니다.' }
    });
  }
});

module.exports = router;
