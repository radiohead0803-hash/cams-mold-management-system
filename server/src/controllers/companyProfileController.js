const { sequelize } = require('../models/newIndex');
const { User } = require('../models/newIndex');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// ============================================================
// 비밀번호 변경 (승인 없이 즉시)
// ============================================================
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ success: false, error: { message: '현재 비밀번호와 새 비밀번호를 입력하세요' } });
    if (new_password.length < 4) return res.status(400).json({ success: false, error: { message: '새 비밀번호는 4자 이상이어야 합니다' } });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: { message: '사용자를 찾을 수 없습니다' } });

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: { message: '현재 비밀번호가 일치하지 않습니다' } });

    const hashed = await bcrypt.hash(new_password, 10);
    await User.update({ password: hashed }, { where: { id: userId } });

    res.json({ success: true, message: '비밀번호가 변경되었습니다' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, error: { message: '비밀번호 변경 실패' } });
  }
};

// ============================================================
// GPS 좌표 (주소 → 좌표 변환은 프론트에서 Kakao/Naver API 호출 후 저장)
// ============================================================
const updateGPS = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { latitude, longitude } = req.body;
    await sequelize.query(`UPDATE companies SET latitude = :lat, longitude = :lng WHERE id = :id`, {
      replacements: { lat: latitude || null, lng: longitude || null, id: companyId }
    });
    res.json({ success: true, message: 'GPS 좌표 저장 완료' });
  } catch (error) {
    logger.error('Update GPS error:', error);
    res.status(500).json({ success: false, error: { message: 'GPS 좌표 저장 실패' } });
  }
};

// ============================================================
// 담당자 CRUD (공장/차종별 여러 명)
// ============================================================
const getContacts = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const [rows] = await sequelize.query(`
      SELECT * FROM company_contacts WHERE company_id = :cid AND is_active = true ORDER BY is_primary DESC, sort_order, contact_name
    `, { replacements: { cid: companyId } });
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ success: false, error: { message: '담당자 조회 실패' } });
  }
};

const addContact = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { contact_name, contact_role, department, plant_name, car_model, phone, mobile, email, is_primary } = req.body;
    if (!contact_name) return res.status(400).json({ success: false, error: { message: '담당자명은 필수입니다' } });

    if (is_primary) {
      await sequelize.query(`UPDATE company_contacts SET is_primary = false WHERE company_id = :cid`, { replacements: { cid: companyId } });
    }

    const [result] = await sequelize.query(`
      INSERT INTO company_contacts (company_id, contact_name, contact_role, department, plant_name, car_model, phone, mobile, email, is_primary)
      VALUES (:cid, :contact_name, :contact_role, :department, :plant_name, :car_model, :phone, :mobile, :email, :is_primary)
      RETURNING *
    `, { replacements: { cid: companyId, contact_name, contact_role: contact_role || null, department: department || null, plant_name: plant_name || null, car_model: car_model || null, phone: phone || null, mobile: mobile || null, email: email || null, is_primary: is_primary || false } });
    res.status(201).json({ success: true, data: result[0], message: '담당자 등록 완료' });
  } catch (error) {
    logger.error('Add contact error:', error);
    res.status(500).json({ success: false, error: { message: '담당자 등록 실패' } });
  }
};

const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_name, contact_role, department, plant_name, car_model, phone, mobile, email, is_primary } = req.body;

    if (is_primary) {
      const companyId = req.user?.company_id;
      await sequelize.query(`UPDATE company_contacts SET is_primary = false WHERE company_id = :cid`, { replacements: { cid: companyId } });
    }

    const [result] = await sequelize.query(`
      UPDATE company_contacts SET
        contact_name = COALESCE(:contact_name, contact_name),
        contact_role = COALESCE(:contact_role, contact_role),
        department = COALESCE(:department, department),
        plant_name = COALESCE(:plant_name, plant_name),
        car_model = COALESCE(:car_model, car_model),
        phone = COALESCE(:phone, phone),
        mobile = COALESCE(:mobile, mobile),
        email = COALESCE(:email, email),
        is_primary = COALESCE(:is_primary, is_primary),
        updated_at = NOW()
      WHERE id = :id RETURNING *
    `, { replacements: { id, contact_name: contact_name || null, contact_role: contact_role ?? null, department: department ?? null, plant_name: plant_name ?? null, car_model: car_model ?? null, phone: phone ?? null, mobile: mobile ?? null, email: email ?? null, is_primary: is_primary ?? null } });
    if (!result.length) return res.status(404).json({ success: false, error: { message: '담당자를 찾을 수 없습니다' } });
    res.json({ success: true, data: result[0], message: '담당자 수정 완료' });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({ success: false, error: { message: '담당자 수정 실패' } });
  }
};

const deleteContact = async (req, res) => {
  try {
    await sequelize.query(`UPDATE company_contacts SET is_active = false, updated_at = NOW() WHERE id = :id`, { replacements: { id: req.params.id } });
    res.json({ success: true, message: '담당자 삭제 완료' });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({ success: false, error: { message: '담당자 삭제 실패' } });
  }
};

// ============================================================
// 인증현황 CRUD (인증서 사진/파일 + 주관처)
// ============================================================
const getCertifications = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const [rows] = await sequelize.query(`
      SELECT * FROM company_certifications WHERE company_id = :cid AND is_active = true ORDER BY expiry_date DESC NULLS LAST, cert_name
    `, { replacements: { cid: companyId } });
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Get certifications error:', error);
    res.status(500).json({ success: false, error: { message: '인증현황 조회 실패' } });
  }
};

const addCertification = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { cert_name, cert_number, issuing_authority, issue_date, expiry_date, cert_file_url, cert_file_name, notes } = req.body;
    if (!cert_name) return res.status(400).json({ success: false, error: { message: '인증명은 필수입니다' } });

    const [result] = await sequelize.query(`
      INSERT INTO company_certifications (company_id, cert_name, cert_number, issuing_authority, issue_date, expiry_date, cert_file_url, cert_file_name, notes)
      VALUES (:cid, :cert_name, :cert_number, :issuing_authority, :issue_date, :expiry_date, :cert_file_url, :cert_file_name, :notes)
      RETURNING *
    `, { replacements: { cid: companyId, cert_name, cert_number: cert_number || null, issuing_authority: issuing_authority || null, issue_date: issue_date || null, expiry_date: expiry_date || null, cert_file_url: cert_file_url || null, cert_file_name: cert_file_name || null, notes: notes || null } });
    res.status(201).json({ success: true, data: result[0], message: '인증 등록 완료' });
  } catch (error) {
    logger.error('Add certification error:', error);
    res.status(500).json({ success: false, error: { message: '인증 등록 실패' } });
  }
};

const updateCertification = async (req, res) => {
  try {
    const { id } = req.params;
    const { cert_name, cert_number, issuing_authority, issue_date, expiry_date, cert_file_url, cert_file_name, status, notes } = req.body;
    const [result] = await sequelize.query(`
      UPDATE company_certifications SET
        cert_name = COALESCE(:cert_name, cert_name),
        cert_number = COALESCE(:cert_number, cert_number),
        issuing_authority = COALESCE(:issuing_authority, issuing_authority),
        issue_date = COALESCE(:issue_date, issue_date),
        expiry_date = COALESCE(:expiry_date, expiry_date),
        cert_file_url = COALESCE(:cert_file_url, cert_file_url),
        cert_file_name = COALESCE(:cert_file_name, cert_file_name),
        status = COALESCE(:status, status),
        notes = COALESCE(:notes, notes),
        updated_at = NOW()
      WHERE id = :id RETURNING *
    `, { replacements: { id, cert_name: cert_name || null, cert_number: cert_number ?? null, issuing_authority: issuing_authority ?? null, issue_date: issue_date ?? null, expiry_date: expiry_date ?? null, cert_file_url: cert_file_url ?? null, cert_file_name: cert_file_name ?? null, status: status || null, notes: notes ?? null } });
    if (!result.length) return res.status(404).json({ success: false, error: { message: '인증을 찾을 수 없습니다' } });
    res.json({ success: true, data: result[0], message: '인증 수정 완료' });
  } catch (error) {
    logger.error('Update certification error:', error);
    res.status(500).json({ success: false, error: { message: '인증 수정 실패' } });
  }
};

const deleteCertification = async (req, res) => {
  try {
    await sequelize.query(`UPDATE company_certifications SET is_active = false, updated_at = NOW() WHERE id = :id`, { replacements: { id: req.params.id } });
    res.json({ success: true, message: '인증 삭제 완료' });
  } catch (error) {
    logger.error('Delete certification error:', error);
    res.status(500).json({ success: false, error: { message: '인증 삭제 실패' } });
  }
};

// ============================================================
// 프로필 임시저장 / 제출(승인요청) / 승인 / 반려
// ============================================================
const saveDraft = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { draft_data } = req.body;
    await sequelize.query(`UPDATE companies SET profile_draft = :draft, profile_status = 'draft' WHERE id = :id`, {
      replacements: { draft: JSON.stringify(draft_data || {}), id: companyId }
    });
    res.json({ success: true, message: '임시저장 완료' });
  } catch (error) {
    logger.error('Save draft error:', error);
    res.status(500).json({ success: false, error: { message: '임시저장 실패' } });
  }
};

const submitForApproval = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const { draft_data } = req.body;
    await sequelize.query(`UPDATE companies SET profile_draft = :draft, profile_status = 'pending_approval', profile_submitted_at = NOW() WHERE id = :id`, {
      replacements: { draft: JSON.stringify(draft_data || {}), id: companyId }
    });
    res.json({ success: true, message: '승인 요청이 제출되었습니다' });
  } catch (error) {
    logger.error('Submit for approval error:', error);
    res.status(500).json({ success: false, error: { message: '승인 요청 실패' } });
  }
};

const approveProfile = async (req, res) => {
  try {
    const { company_id } = req.params;
    const approverId = req.user.id;

    const [companies] = await sequelize.query(`SELECT profile_draft FROM companies WHERE id = :id`, { replacements: { id: company_id } });
    if (!companies.length) return res.status(404).json({ success: false, error: { message: '업체를 찾을 수 없습니다' } });

    const draft = companies[0].profile_draft || {};

    // draft 내용을 실제 필드에 반영
    const updateFields = [];
    const replacements = { id: company_id, approver: approverId };
    const allowedFields = ['phone', 'fax', 'email', 'address', 'address_detail', 'postal_code',
      'manager_name', 'manager_phone', 'manager_email', 'representative', 'business_number',
      'production_capacity', 'specialties', 'production_lines', 'daily_capacity', 'notes',
      'latitude', 'longitude'];

    for (const field of allowedFields) {
      if (draft[field] !== undefined) {
        updateFields.push(`${field} = :${field}`);
        replacements[field] = typeof draft[field] === 'object' ? JSON.stringify(draft[field]) : draft[field];
      }
    }

    if (updateFields.length > 0) {
      await sequelize.query(`UPDATE companies SET ${updateFields.join(', ')}, profile_status = 'approved', profile_approved_at = NOW(), profile_approved_by = :approver, profile_draft = '{}' WHERE id = :id`, { replacements });
    } else {
      await sequelize.query(`UPDATE companies SET profile_status = 'approved', profile_approved_at = NOW(), profile_approved_by = :approver, profile_draft = '{}' WHERE id = :id`, { replacements });
    }

    res.json({ success: true, message: '프로필 승인 완료' });
  } catch (error) {
    logger.error('Approve profile error:', error);
    res.status(500).json({ success: false, error: { message: '승인 처리 실패' } });
  }
};

const rejectProfile = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { reason } = req.body;
    await sequelize.query(`UPDATE companies SET profile_status = 'rejected', profile_reject_reason = :reason WHERE id = :id`, {
      replacements: { reason: reason || '반려 사유 없음', id: company_id }
    });
    res.json({ success: true, message: '프로필 반려 완료' });
  } catch (error) {
    logger.error('Reject profile error:', error);
    res.status(500).json({ success: false, error: { message: '반려 처리 실패' } });
  }
};

// ============================================================
// 사출기 톤수별 집계
// ============================================================
const getEquipmentTonnageSummary = async (req, res) => {
  try {
    const companyId = req.params.company_id || req.user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, error: { message: '업체 ID가 필요합니다' } });
    const [rows] = await sequelize.query(`
      SELECT tonnage, COUNT(*) as count, 
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(daily_capacity) as total_daily_capacity
      FROM company_equipment 
      WHERE company_id = :cid AND is_active = true
      GROUP BY tonnage
      ORDER BY tonnage
    `, { replacements: { cid: companyId } });
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('Tonnage summary error:', error);
    res.status(500).json({ success: false, error: { message: '톤수별 집계 실패' } });
  }
};

// ============================================================
// 수동입력 장비 승인 (관리자용)
// ============================================================
const approveEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { table_name } = req.body; // company_equipment or company_general_equipment
    const tableName = table_name === 'general' ? 'company_general_equipment' : 'company_equipment';
    
    await sequelize.query(`UPDATE ${tableName} SET approval_status = 'approved', approved_by = :uid, approved_at = NOW() WHERE id = :id`, {
      replacements: { uid: req.user.id, id }
    });

    // 수동입력 장비를 기초정보 마스터에 반영 (company_equipment만)
    if (tableName === 'company_equipment') {
      const [equips] = await sequelize.query(`SELECT * FROM company_equipment WHERE id = :id`, { replacements: { id } });
      if (equips.length && !equips[0].equipment_master_id) {
        const eq = equips[0];
        // equipment_master에 이미 같은 제조사+톤수가 있는지 확인
        const [existing] = await sequelize.query(`SELECT id FROM equipment_master WHERE manufacturer = :mfr AND tonnage = :ton LIMIT 1`, {
          replacements: { mfr: eq.manufacturer, ton: eq.tonnage }
        });
        if (!existing.length && eq.manufacturer && eq.tonnage) {
          await sequelize.query(`
            INSERT INTO equipment_master (equipment_type, manufacturer, model_name, tonnage, description, is_active)
            VALUES ('injection_machine', :mfr, :model, :ton, :desc, true)
          `, { replacements: { mfr: eq.manufacturer, model: eq.model_name, ton: eq.tonnage, desc: '협력사 수동입력에서 자동등록' } });
        }
      }
    }

    res.json({ success: true, message: '장비 승인 완료 (기초정보 반영)' });
  } catch (error) {
    logger.error('Approve equipment error:', error);
    res.status(500).json({ success: false, error: { message: '장비 승인 실패' } });
  }
};

const getPendingEquipments = async (req, res) => {
  try {
    const [injections] = await sequelize.query(`
      SELECT ce.*, co.company_name, co.company_type
      FROM company_equipment ce
      JOIN companies co ON co.id = ce.company_id
      WHERE ce.approval_status = 'pending' AND ce.is_active = true
      ORDER BY ce.created_at DESC
    `);
    const [generals] = await sequelize.query(`
      SELECT cge.*, co.company_name, co.company_type, cat.category_name
      FROM company_general_equipment cge
      JOIN companies co ON co.id = cge.company_id
      JOIN general_equipment_category cat ON cat.id = cge.category_id
      WHERE cge.approval_status = 'pending' AND cge.is_active = true
      ORDER BY cge.created_at DESC
    `);
    res.json({ success: true, data: { injection_machines: injections, general_equipments: generals } });
  } catch (error) {
    logger.error('Get pending equipments error:', error);
    res.status(500).json({ success: false, error: { message: '승인대기 장비 조회 실패' } });
  }
};

module.exports = {
  changePassword,
  updateGPS,
  getContacts, addContact, updateContact, deleteContact,
  getCertifications, addCertification, updateCertification, deleteCertification,
  saveDraft, submitForApproval, approveProfile, rejectProfile,
  getEquipmentTonnageSummary,
  approveEquipment, getPendingEquipments
};
