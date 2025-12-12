const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// ==================== 사내 사용자 관리 ====================

// 사내 사용자 목록 조회
const getInternalUsers = async (req, res) => {
  try {
    const { search, department, permission_class, is_active } = req.query;
    
    let whereClause = "WHERE user_type IN ('system_admin', 'mold_developer') AND partner_type IS NULL";
    const replacements = {};
    
    if (search) {
      whereClause += " AND (name ILIKE :search OR username ILIKE :search OR employee_id ILIKE :search)";
      replacements.search = `%${search}%`;
    }
    if (department) {
      whereClause += " AND department = :department";
      replacements.department = department;
    }
    if (permission_class) {
      whereClause += " AND permission_class = :permission_class";
      replacements.permission_class = permission_class;
    }
    if (is_active !== undefined) {
      whereClause += " AND is_active = :is_active";
      replacements.is_active = is_active === 'true';
    }
    
    const [users] = await sequelize.query(`
      SELECT 
        id, username, employee_id, name, email, phone,
        user_type, department, position, factory,
        permission_class, is_active, is_password_changed,
        approval_status, created_at, last_login_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `, { replacements });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get internal users error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사내 사용자 목록 조회 실패' }
    });
  }
};

// 사내 사용자 생성
const createInternalUser = async (req, res) => {
  try {
    const {
      username, employee_id, name, email, phone,
      department, position, factory, permission_class
    } = req.body;
    
    // 중복 체크
    const [existing] = await sequelize.query(
      'SELECT id FROM users WHERE username = :username OR employee_id = :employee_id',
      { replacements: { username, employee_id } }
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: '이미 존재하는 아이디 또는 사번입니다' }
      });
    }
    
    // 초기 비밀번호 = 아이디
    const password_hash = await bcrypt.hash(username, 10);
    
    const [result] = await sequelize.query(`
      INSERT INTO users (
        username, password_hash, employee_id, name, email, phone,
        user_type, department, position, factory, permission_class,
        is_active, is_password_changed, approval_status,
        created_at, updated_at
      ) VALUES (
        :username, :password_hash, :employee_id, :name, :email, :phone,
        'mold_developer', :department, :position, :factory, :permission_class,
        true, false, 'approved',
        NOW(), NOW()
      ) RETURNING *
    `, {
      replacements: {
        username, password_hash, employee_id, name,
        email: email || null, phone: phone || null,
        department: department || null, position: position || null,
        factory: factory || null, permission_class: permission_class || 'user'
      }
    });
    
    logger.info(`Internal user created: ${result[0].id} by user ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: '사용자가 등록되었습니다. 초기 비밀번호는 아이디와 동일합니다.'
    });
  } catch (error) {
    logger.error('Create internal user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사내 사용자 등록 실패', details: error.message }
    });
  }
};

// 사내 사용자 수정
const updateInternalUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const replacements = { id };
    
    const allowedFields = [
      'name', 'email', 'phone', 'employee_id',
      'department', 'position', 'factory', 'permission_class', 'is_active'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = req.body[field];
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '수정할 필드가 없습니다' }
      });
    }
    
    updateFields.push('updated_at = NOW()');
    
    const [result] = await sequelize.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = :id RETURNING *`,
      { replacements }
    );
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '사용자를 찾을 수 없습니다' }
      });
    }
    
    logger.info(`Internal user updated: ${id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Update internal user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사내 사용자 수정 실패' }
    });
  }
};

// 비밀번호 초기화
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [user] = await sequelize.query(
      'SELECT username FROM users WHERE id = :id',
      { replacements: { id } }
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '사용자를 찾을 수 없습니다' }
      });
    }
    
    // 비밀번호를 아이디로 초기화
    const password_hash = await bcrypt.hash(user[0].username, 10);
    
    await sequelize.query(`
      UPDATE users SET 
        password_hash = :password_hash,
        is_password_changed = false,
        password_reset_at = NOW(),
        updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id, password_hash } });
    
    logger.info(`Password reset for user ${id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: '비밀번호가 초기화되었습니다. 새 비밀번호는 아이디와 동일합니다.'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: { message: '비밀번호 초기화 실패' }
    });
  }
};

// ==================== 협력사 사용자 관리 ====================

// 협력사 사용자 목록 조회
const getPartnerUsers = async (req, res) => {
  try {
    const { search, partner_type, approval_status, is_active } = req.query;
    
    let whereClause = "WHERE user_type IN ('maker', 'plant') OR partner_type IS NOT NULL";
    const replacements = {};
    
    if (search) {
      whereClause += " AND (name ILIKE :search OR username ILIKE :search OR company_name ILIKE :search OR partner_code ILIKE :search)";
      replacements.search = `%${search}%`;
    }
    if (partner_type) {
      whereClause += " AND (partner_type = :partner_type OR user_type = :partner_type)";
      replacements.partner_type = partner_type;
    }
    if (approval_status) {
      whereClause += " AND approval_status = :approval_status";
      replacements.approval_status = approval_status;
    }
    if (is_active !== undefined) {
      whereClause += " AND is_active = :is_active";
      replacements.is_active = is_active === 'true';
    }
    
    const [users] = await sequelize.query(`
      SELECT 
        id, username, partner_code, name, email, phone,
        user_type, partner_type, company_id, company_name,
        partner_contact, partner_address,
        permission_class, is_active, is_password_changed,
        approval_status, approved_by, approved_at, rejection_reason,
        created_at, last_login_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `, { replacements });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get partner users error:', error);
    res.status(500).json({
      success: false,
      error: { message: '협력사 사용자 목록 조회 실패' }
    });
  }
};

// 협력사 사용자 생성 (업체 등록 시 자동 생성용)
const createPartnerUser = async (req, res) => {
  try {
    const {
      company_id, company_name, partner_type, // maker or plant
      name, email, phone, partner_contact, partner_address
    } = req.body;
    
    // 업체코드 자동 생성 (예: MK001, PL001)
    const prefix = partner_type === 'maker' ? 'MK' : 'PL';
    const [countResult] = await sequelize.query(
      "SELECT COUNT(*) as cnt FROM users WHERE partner_code LIKE :prefix",
      { replacements: { prefix: `${prefix}%` } }
    );
    const nextNum = parseInt(countResult[0].cnt) + 1;
    const partner_code = `${prefix}${String(nextNum).padStart(3, '0')}`;
    
    // 아이디 = 업체코드
    const username = partner_code.toLowerCase();
    
    // 중복 체크
    const [existing] = await sequelize.query(
      'SELECT id FROM users WHERE username = :username',
      { replacements: { username } }
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: '이미 존재하는 아이디입니다' }
      });
    }
    
    // 초기 비밀번호 = 아이디
    const password_hash = await bcrypt.hash(username, 10);
    
    const [result] = await sequelize.query(`
      INSERT INTO users (
        username, password_hash, partner_code, name, email, phone,
        user_type, partner_type, company_id, company_name,
        partner_contact, partner_address,
        permission_class, is_active, is_password_changed, approval_status,
        created_at, updated_at
      ) VALUES (
        :username, :password_hash, :partner_code, :name, :email, :phone,
        :partner_type, :partner_type, :company_id, :company_name,
        :partner_contact, :partner_address,
        'user', true, false, 'pending',
        NOW(), NOW()
      ) RETURNING *
    `, {
      replacements: {
        username, password_hash, partner_code, name,
        email: email || null, phone: phone || null,
        partner_type, company_id: company_id || null, company_name,
        partner_contact: partner_contact || null, partner_address: partner_address || null
      }
    });
    
    // 승인 요청 알림 생성
    await sequelize.query(`
      INSERT INTO user_approval_requests (
        user_id, request_type, request_data, status, requested_at
      ) VALUES (
        :user_id, 'new_user', :request_data, 'pending', NOW()
      )
    `, {
      replacements: {
        user_id: result[0].id,
        request_data: JSON.stringify({
          company_name,
          partner_type,
          partner_code,
          email
        })
      }
    });
    
    logger.info(`Partner user created: ${result[0].id} (${partner_code}) - pending approval`);
    
    res.status(201).json({
      success: true,
      data: result[0],
      message: `협력사 사용자가 등록되었습니다. 아이디: ${username}, 초기 비밀번호: ${username}. 관리자 승인 후 로그인 가능합니다.`
    });
  } catch (error) {
    logger.error('Create partner user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '협력사 사용자 등록 실패', details: error.message }
    });
  }
};

// 협력사 사용자 수정
const updatePartnerUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const replacements = { id };
    
    const allowedFields = [
      'name', 'email', 'phone', 'company_name',
      'partner_contact', 'partner_address',
      'permission_class', 'is_active'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = req.body[field];
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '수정할 필드가 없습니다' }
      });
    }
    
    updateFields.push('updated_at = NOW()');
    
    const [result] = await sequelize.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = :id RETURNING *`,
      { replacements }
    );
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '사용자를 찾을 수 없습니다' }
      });
    }
    
    logger.info(`Partner user updated: ${id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    logger.error('Update partner user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '협력사 사용자 수정 실패' }
    });
  }
};

// ==================== 승인 관리 ====================

// 승인 대기 목록 조회
const getPendingApprovals = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        r.id, r.user_id, r.request_type, r.request_data, r.status, r.requested_at,
        u.username, u.name, u.email, u.company_name, u.partner_type, u.partner_code
      FROM user_approval_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.requested_at ASC
    `);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 대기 목록 조회 실패' }
    });
  }
};

// 사용자 승인
const approveUser = async (req, res) => {
  try {
    const { id } = req.params; // user_id
    
    await sequelize.query(`
      UPDATE users SET 
        approval_status = 'approved',
        approved_by = :approved_by,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id, approved_by: req.user.id } });
    
    await sequelize.query(`
      UPDATE user_approval_requests SET 
        status = 'approved',
        processed_by = :processed_by,
        processed_at = NOW(),
        updated_at = NOW()
      WHERE user_id = :user_id AND status = 'pending'
    `, { replacements: { user_id: id, processed_by: req.user.id } });
    
    logger.info(`User ${id} approved by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: '사용자가 승인되었습니다'
    });
  } catch (error) {
    logger.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 승인 실패' }
    });
  }
};

// 사용자 거부
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await sequelize.query(`
      UPDATE users SET 
        approval_status = 'rejected',
        approved_by = :approved_by,
        approved_at = NOW(),
        rejection_reason = :reason,
        is_active = false,
        updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id, approved_by: req.user.id, reason: reason || null } });
    
    await sequelize.query(`
      UPDATE user_approval_requests SET 
        status = 'rejected',
        processed_by = :processed_by,
        processed_at = NOW(),
        process_note = :reason,
        updated_at = NOW()
      WHERE user_id = :user_id AND status = 'pending'
    `, { replacements: { user_id: id, processed_by: req.user.id, reason: reason || null } });
    
    logger.info(`User ${id} rejected by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: '사용자 등록이 거부되었습니다'
    });
  } catch (error) {
    logger.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 거부 실패' }
    });
  }
};

// ==================== 권한 클래스 관리 ====================

// 권한 클래스 목록 조회
const getPermissionClasses = async (req, res) => {
  try {
    const [classes] = await sequelize.query(`
      SELECT * FROM permission_classes
      WHERE is_active = true
      ORDER BY sort_order
    `);
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    logger.error('Get permission classes error:', error);
    res.status(500).json({
      success: false,
      error: { message: '권한 클래스 목록 조회 실패' }
    });
  }
};

// 사용자 삭제
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 자기 자신은 삭제 불가
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { message: '자기 자신은 삭제할 수 없습니다' }
      });
    }
    
    const [result] = await sequelize.query(
      'DELETE FROM users WHERE id = :id RETURNING id',
      { replacements: { id } }
    );
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '사용자를 찾을 수 없습니다' }
      });
    }
    
    logger.info(`User ${id} deleted by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: '사용자가 삭제되었습니다'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사용자 삭제 실패' }
    });
  }
};

// 부서 목록 조회
const getDepartments = async (req, res) => {
  try {
    const [departments] = await sequelize.query(`
      SELECT DISTINCT department FROM users 
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `);
    
    res.json({
      success: true,
      data: departments.map(d => d.department)
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      error: { message: '부서 목록 조회 실패' }
    });
  }
};

module.exports = {
  getInternalUsers,
  createInternalUser,
  updateInternalUser,
  resetPassword,
  getPartnerUsers,
  createPartnerUser,
  updatePartnerUser,
  getPendingApprovals,
  approveUser,
  rejectUser,
  getPermissionClasses,
  deleteUser,
  getDepartments
};
