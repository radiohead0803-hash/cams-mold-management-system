const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * 양산이관 체크리스트 마스터 항목 조회
 */
const getChecklistMasterItems = async (req, res) => {
  try {
    const [items] = await sequelize.query(`
      SELECT id, category, item_code, item_name, description, 
             is_required, requires_attachment, attachment_type, 
             display_order, is_active
      FROM production_transfer_checklist_master
      WHERE is_active = true
      ORDER BY display_order, id
    `);

    res.json({
      success: true,
      data: {
        items,
        total: items.length
      }
    });
  } catch (error) {
    logger.error('Get checklist master items error:', error);
    res.status(500).json({
      success: false,
      error: { message: '체크리스트 마스터 항목 조회 실패', details: error.message }
    });
  }
};

/**
 * 양산이관 요청 생성
 */
const createTransferRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      mold_id,
      mold_spec_id,
      transfer_date,
      reason,
      remarks,
      checklist_results,
      attachments,
      status = 'draft'
    } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO production_transfer_requests (
        mold_id, mold_spec_id, transfer_date, reason, remarks,
        checklist_results, attachments, status, created_by, updated_by,
        created_at, updated_at
      ) VALUES (
        :mold_id, :mold_spec_id, :transfer_date, :reason, :remarks,
        :checklist_results, :attachments, :status, :created_by, :updated_by,
        NOW(), NOW()
      ) RETURNING *
    `, {
      replacements: {
        mold_id: mold_id || null,
        mold_spec_id: mold_spec_id || null,
        transfer_date: transfer_date || null,
        reason: reason || null,
        remarks: remarks || null,
        checklist_results: JSON.stringify(checklist_results || {}),
        attachments: JSON.stringify(attachments || {}),
        status,
        created_by: userId,
        updated_by: userId
      }
    });

    res.status(201).json({
      success: true,
      data: result[0],
      message: status === 'draft' ? '임시저장 되었습니다.' : '양산이관 요청이 등록되었습니다.'
    });
  } catch (error) {
    logger.error('Create transfer request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 요청 생성 실패', details: error.message }
    });
  }
};

/**
 * 양산이관 요청 수정
 */
const updateTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      transfer_date,
      reason,
      remarks,
      checklist_results,
      attachments,
      status
    } = req.body;

    const [result] = await sequelize.query(`
      UPDATE production_transfer_requests
      SET transfer_date = COALESCE(:transfer_date, transfer_date),
          reason = COALESCE(:reason, reason),
          remarks = COALESCE(:remarks, remarks),
          checklist_results = COALESCE(:checklist_results, checklist_results),
          attachments = COALESCE(:attachments, attachments),
          status = COALESCE(:status, status),
          updated_by = :updated_by,
          updated_at = NOW()
      WHERE id = :id
      RETURNING *
    `, {
      replacements: {
        id,
        transfer_date: transfer_date || null,
        reason: reason || null,
        remarks: remarks || null,
        checklist_results: checklist_results ? JSON.stringify(checklist_results) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: status || null,
        updated_by: userId
      }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: '양산이관 요청이 수정되었습니다.'
    });
  } catch (error) {
    logger.error('Update transfer request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 요청 수정 실패', details: error.message }
    });
  }
};

/**
 * 양산이관 요청 조회
 */
const getTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await sequelize.query(`
      SELECT ptr.*,
             u.name as created_by_name,
             m.mold_code, m.mold_name,
             ms.part_number, ms.part_name, ms.car_model
      FROM production_transfer_requests ptr
      LEFT JOIN users u ON ptr.created_by = u.id
      LEFT JOIN molds m ON ptr.mold_id = m.id
      LEFT JOIN mold_specifications ms ON ptr.mold_spec_id = ms.id
      WHERE ptr.id = :id
    `, {
      replacements: { id }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다.' }
      });
    }

    // 첨부파일 조회
    const [attachments] = await sequelize.query(`
      SELECT * FROM production_transfer_attachments
      WHERE request_id = :request_id
      ORDER BY item_id, created_at
    `, {
      replacements: { request_id: id }
    });

    const request = result[0];
    request.attachment_files = attachments;

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    logger.error('Get transfer request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 요청 조회 실패', details: error.message }
    });
  }
};

/**
 * 양산이관 요청 목록 조회
 */
const getTransferRequests = async (req, res) => {
  try {
    const { mold_id, mold_spec_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const replacements = { limit: parseInt(limit), offset };

    if (mold_id) {
      whereClause += ' AND ptr.mold_id = :mold_id';
      replacements.mold_id = parseInt(mold_id);
    }
    if (mold_spec_id) {
      whereClause += ' AND ptr.mold_spec_id = :mold_spec_id';
      replacements.mold_spec_id = parseInt(mold_spec_id);
    }
    if (status) {
      whereClause += ' AND ptr.status = :status';
      replacements.status = status;
    }

    const [items] = await sequelize.query(`
      SELECT ptr.*,
             u.name as created_by_name,
             m.mold_code, m.mold_name,
             ms.part_number, ms.part_name
      FROM production_transfer_requests ptr
      LEFT JOIN users u ON ptr.created_by = u.id
      LEFT JOIN molds m ON ptr.mold_id = m.id
      LEFT JOIN mold_specifications ms ON ptr.mold_spec_id = ms.id
      ${whereClause}
      ORDER BY ptr.created_at DESC
      LIMIT :limit OFFSET :offset
    `, { replacements });

    const [[{ count }]] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM production_transfer_requests ptr
      ${whereClause}
    `, { replacements });

    res.json({
      success: true,
      data: {
        items,
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get transfer requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: '양산이관 요청 목록 조회 실패', details: error.message }
    });
  }
};

/**
 * 양산이관 요청 승인
 */
const approveTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_type } = req.body; // plant, quality, final
    const userId = req.user.id;

    let updateField, nextStatus;
    
    switch (approval_type) {
      case 'plant':
        updateField = 'plant_approved_by = :user_id, plant_approved_at = NOW()';
        nextStatus = 'pending_quality';
        break;
      case 'quality':
        updateField = 'quality_approved_by = :user_id, quality_approved_at = NOW()';
        nextStatus = 'pending_final';
        break;
      case 'final':
        updateField = 'final_approved_by = :user_id, final_approved_at = NOW()';
        nextStatus = 'approved';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: '유효하지 않은 승인 유형입니다.' }
        });
    }

    const [result] = await sequelize.query(`
      UPDATE production_transfer_requests
      SET ${updateField},
          status = :next_status,
          updated_by = :user_id,
          updated_at = NOW()
      WHERE id = :id
      RETURNING *
    `, {
      replacements: {
        id,
        user_id: userId,
        next_status: nextStatus
      }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: '승인되었습니다.'
    });
  } catch (error) {
    logger.error('Approve transfer request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 처리 실패', details: error.message }
    });
  }
};

/**
 * 양산이관 요청 거절
 */
const rejectTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const userId = req.user.id;

    const [result] = await sequelize.query(`
      UPDATE production_transfer_requests
      SET status = 'rejected',
          rejected_by = :user_id,
          rejected_at = NOW(),
          rejection_reason = :rejection_reason,
          updated_by = :user_id,
          updated_at = NOW()
      WHERE id = :id
      RETURNING *
    `, {
      replacements: {
        id,
        user_id: userId,
        rejection_reason: rejection_reason || null
      }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '요청을 찾을 수 없습니다.' }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: '거절되었습니다.'
    });
  } catch (error) {
    logger.error('Reject transfer request error:', error);
    res.status(500).json({
      success: false,
      error: { message: '거절 처리 실패', details: error.message }
    });
  }
};

/**
 * 첨부파일 업로드
 */
const uploadAttachment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_id, mold_id, request_id, upload_type = 'image' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: '파일이 없습니다.' }
      });
    }

    const file = req.file;
    const fileUrl = `/uploads/production-transfer/${file.filename}`;

    const [result] = await sequelize.query(`
      INSERT INTO production_transfer_attachments (
        request_id, item_id, mold_id, file_name, file_type, file_size,
        file_path, file_url, upload_type, uploaded_by, created_at
      ) VALUES (
        :request_id, :item_id, :mold_id, :file_name, :file_type, :file_size,
        :file_path, :file_url, :upload_type, :uploaded_by, NOW()
      ) RETURNING *
    `, {
      replacements: {
        request_id: request_id || null,
        item_id: parseInt(item_id) || null,
        mold_id: parseInt(mold_id) || null,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_path: file.path,
        file_url: fileUrl,
        upload_type,
        uploaded_by: userId
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...result[0],
        file_url: `${process.env.API_URL || ''}${fileUrl}`
      },
      message: '파일이 업로드되었습니다.'
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 업로드 실패', details: error.message }
    });
  }
};

/**
 * 첨부파일 삭제
 */
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // 파일 정보 조회
    const [files] = await sequelize.query(`
      SELECT * FROM production_transfer_attachments WHERE id = :id
    `, { replacements: { id } });

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '파일을 찾을 수 없습니다.' }
      });
    }

    const file = files[0];

    // 파일 삭제
    if (file.file_path) {
      try {
        await fs.unlink(file.file_path);
      } catch (err) {
        logger.warn('File deletion failed:', err);
      }
    }

    // DB 레코드 삭제
    await sequelize.query(`
      DELETE FROM production_transfer_attachments WHERE id = :id
    `, { replacements: { id } });

    res.json({
      success: true,
      message: '파일이 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      error: { message: '파일 삭제 실패', details: error.message }
    });
  }
};

/**
 * 이관 완료 처리
 */
const completeTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await sequelize.query(`
      UPDATE production_transfer_requests
      SET status = 'transferred',
          updated_by = :user_id,
          updated_at = NOW()
      WHERE id = :id AND status = 'approved'
      RETURNING *
    `, {
      replacements: { id, user_id: userId }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '승인된 요청을 찾을 수 없습니다.' }
      });
    }

    // 금형 상태 업데이트 (development_stage를 '양산'으로 변경)
    if (result[0].mold_spec_id) {
      await sequelize.query(`
        UPDATE mold_specifications
        SET development_stage = '양산',
            updated_at = NOW()
        WHERE id = :mold_spec_id
      `, {
        replacements: { mold_spec_id: result[0].mold_spec_id }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: '이관이 완료되었습니다.'
    });
  } catch (error) {
    logger.error('Complete transfer error:', error);
    res.status(500).json({
      success: false,
      error: { message: '이관 완료 처리 실패', details: error.message }
    });
  }
};

module.exports = {
  getChecklistMasterItems,
  createTransferRequest,
  updateTransferRequest,
  getTransferRequest,
  getTransferRequests,
  approveTransferRequest,
  rejectTransferRequest,
  uploadAttachment,
  deleteAttachment,
  completeTransfer
};
