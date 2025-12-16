/**
 * 운영감사/추적 API
 * - 마스터 수정 이력
 * - 승인/반려 이력
 * - 귀책비율 변경 이력
 * - 시스템 변경 로그
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sequelize } = require('../models/newIndex');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 감사 로그 유형
const AUDIT_TYPES = {
  MASTER_UPDATE: 'master_update',
  APPROVAL: 'approval',
  REJECTION: 'rejection',
  LIABILITY_CHANGE: 'liability_change',
  STATUS_CHANGE: 'status_change',
  USER_ACTION: 'user_action',
  SYSTEM_ACTION: 'system_action'
};

/**
 * 감사 로그 기록
 */
const recordAuditLog = async ({
  entityType,
  entityId,
  action,
  userId,
  companyId,
  previousValue,
  newValue,
  description,
  ipAddress,
  transaction = null
}) => {
  try {
    await sequelize.query(`
      INSERT INTO audit_logs (
        entity_type, entity_id, action, user_id, company_id,
        previous_value, new_value, description, ip_address, created_at
      ) VALUES (
        :entityType, :entityId, :action, :userId, :companyId,
        :previousValue, :newValue, :description, :ipAddress, NOW()
      )
    `, {
      replacements: {
        entityType,
        entityId,
        action,
        userId,
        companyId,
        previousValue: previousValue ? JSON.stringify(previousValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        description,
        ipAddress
      },
      transaction
    });
    return true;
  } catch (error) {
    console.error('[AuditLog] Error recording:', error.message);
    return false;
  }
};

/**
 * 감사 로그 조회
 * GET /api/v1/audit-log
 */
router.get('/', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const { 
      entityType, entityId, action, userId, 
      startDate, endDate, limit = 50, offset = 0 
    } = req.query;

    let whereClause = '1=1';
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };

    if (entityType) {
      whereClause += ' AND al.entity_type = :entityType';
      replacements.entityType = entityType;
    }
    if (entityId) {
      whereClause += ' AND al.entity_id = :entityId';
      replacements.entityId = entityId;
    }
    if (action) {
      whereClause += ' AND al.action = :action';
      replacements.action = action;
    }
    if (userId) {
      whereClause += ' AND al.user_id = :userId';
      replacements.userId = userId;
    }
    if (startDate) {
      whereClause += ' AND al.created_at >= :startDate';
      replacements.startDate = startDate;
    }
    if (endDate) {
      whereClause += ' AND al.created_at <= :endDate';
      replacements.endDate = endDate;
    }

    const [logs] = await sequelize.query(`
      SELECT 
        al.id, al.entity_type, al.entity_id, al.action,
        al.previous_value, al.new_value, al.description,
        al.ip_address, al.created_at,
        u.name as user_name, u.user_type,
        c.name as company_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN companies c ON al.company_id = c.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // 총 개수
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total FROM audit_logs al WHERE ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: logs || [],
      pagination: {
        total: parseInt(countResult?.total || 0),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('[AuditLog] List error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get audit logs' } });
  }
});

/**
 * 특정 엔티티의 변경 이력 조회
 * GET /api/v1/audit-log/entity/:entityType/:entityId
 */
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const [logs] = await sequelize.query(`
      SELECT 
        al.id, al.action, al.previous_value, al.new_value,
        al.description, al.created_at,
        u.name as user_name, u.user_type
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = :entityType AND al.entity_id = :entityId
      ORDER BY al.created_at DESC
      LIMIT 100
    `, {
      replacements: { entityType, entityId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: logs || [] });
  } catch (error) {
    console.error('[AuditLog] Entity history error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get entity history' } });
  }
});

/**
 * 승인/반려 이력 조회
 * GET /api/v1/audit-log/approvals
 */
router.get('/approvals', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [logs] = await sequelize.query(`
      SELECT 
        al.id, al.entity_type, al.entity_id, al.action,
        al.description, al.created_at,
        u.name as user_name, u.user_type,
        c.name as company_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN companies c ON al.company_id = c.id
      WHERE al.action IN ('approval', 'rejection')
        AND al.created_at >= CURRENT_DATE - INTERVAL ':days days'
      ORDER BY al.created_at DESC
      LIMIT 100
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: logs || [] });
  } catch (error) {
    console.error('[AuditLog] Approvals error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get approval history' } });
  }
});

/**
 * 귀책비율 변경 이력 조회
 * GET /api/v1/audit-log/liability-changes
 */
router.get('/liability-changes', authorize(['system_admin', 'mold_developer']), async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const [logs] = await sequelize.query(`
      SELECT 
        al.id, al.entity_type, al.entity_id,
        al.previous_value, al.new_value, al.description,
        al.created_at,
        u.name as user_name,
        rr.title as repair_title,
        ms.mold_number
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN repair_requests rr ON al.entity_type = 'repair_request' AND al.entity_id = rr.id::text
      LEFT JOIN mold_specifications ms ON rr.mold_id = ms.id
      WHERE al.action = 'liability_change'
        AND al.created_at >= CURRENT_DATE - INTERVAL ':days days'
      ORDER BY al.created_at DESC
      LIMIT 100
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: logs || [] });
  } catch (error) {
    console.error('[AuditLog] Liability changes error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get liability changes' } });
  }
});

/**
 * 마스터 데이터 변경 이력 조회
 * GET /api/v1/audit-log/master-changes
 */
router.get('/master-changes', authorize(['system_admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [logs] = await sequelize.query(`
      SELECT 
        al.id, al.entity_type, al.entity_id, al.action,
        al.previous_value, al.new_value, al.description,
        al.created_at,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action = 'master_update'
        AND al.created_at >= CURRENT_DATE - INTERVAL ':days days'
      ORDER BY al.created_at DESC
      LIMIT 100
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({ success: true, data: logs || [] });
  } catch (error) {
    console.error('[AuditLog] Master changes error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get master changes' } });
  }
});

/**
 * 감사 로그 통계
 * GET /api/v1/audit-log/stats
 */
router.get('/stats', authorize(['system_admin']), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // 액션별 통계
    const [byAction] = await sequelize.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY action
      ORDER BY count DESC
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    // 사용자별 통계
    const [byUser] = await sequelize.query(`
      SELECT 
        u.name as user_name,
        COUNT(*) as count
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY u.id, u.name
      ORDER BY count DESC
      LIMIT 10
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    // 일별 추이
    const [daily] = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL ':days days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, {
      replacements: { days },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        byAction: byAction || [],
        byUser: byUser || [],
        daily: daily || []
      }
    });
  } catch (error) {
    console.error('[AuditLog] Stats error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get audit stats' } });
  }
});

/**
 * 감사 로그 수동 기록 (관리자 전용)
 * POST /api/v1/audit-log
 */
router.post('/', authorize(['system_admin']), async (req, res) => {
  try {
    const { entityType, entityId, action, previousValue, newValue, description } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const success = await recordAuditLog({
      entityType,
      entityId,
      action,
      userId,
      companyId,
      previousValue,
      newValue,
      description,
      ipAddress
    });

    if (success) {
      res.json({ success: true, message: '감사 로그가 기록되었습니다.' });
    } else {
      res.status(500).json({ success: false, error: { message: 'Failed to record audit log' } });
    }
  } catch (error) {
    console.error('[AuditLog] Record error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to record audit log' } });
  }
});

// 감사 로그 기록 함수 export
router.recordAuditLog = recordAuditLog;
router.AUDIT_TYPES = AUDIT_TYPES;

module.exports = router;
