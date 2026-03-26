const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/companyProfileController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 협력사 프로필 관리 라우트
 * Base: /api/v1/company-profile
 */

// 내 프로필 조회
router.get('/me', authenticate, async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const [rows] = await sequelize.query(
      `SELECT id, username, name, email, phone, user_type, company_id, company_name, company_type, created_at
       FROM users WHERE id = $1`,
      { bind: [req.user.id] }
    );
    if (!rows.length) return res.status(404).json({ success: false, error: { message: '사용자를 찾을 수 없습니다' } });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: '프로필 조회 실패' } });
  }
});

// 내 프로필 수정 (이름, 이메일, 전화번호)
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { sequelize } = require('../models/newIndex');
    const { name, email, phone } = req.body;
    const updates = [];
    const binds = [];

    if (name) { binds.push(name); updates.push(`name = $${binds.length}`); }
    if (email !== undefined) { binds.push(email); updates.push(`email = $${binds.length}`); }
    if (phone !== undefined) { binds.push(phone); updates.push(`phone = $${binds.length}`); }

    if (updates.length === 0) return res.status(400).json({ success: false, error: { message: '수정할 항목이 없습니다' } });

    binds.push(req.user.id);
    await sequelize.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${binds.length}`,
      { bind: binds }
    );

    const [rows] = await sequelize.query(
      `SELECT id, username, name, email, phone, user_type, company_name FROM users WHERE id = $1`,
      { bind: [req.user.id] }
    );

    res.json({ success: true, data: rows[0], message: '프로필이 수정되었습니다' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: '프로필 수정 실패' } });
  }
});

// 비밀번호 변경 (승인 없이 즉시)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { sequelize } = require('../models/newIndex');
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) return res.status(400).json({ success: false, error: { message: '현재 비밀번호와 새 비밀번호를 입력하세요' } });
    if (new_password.length < 4) return res.status(400).json({ success: false, error: { message: '새 비밀번호는 4자 이상이어야 합니다' } });

    const [rows] = await sequelize.query('SELECT password_hash FROM users WHERE id = $1', { bind: [req.user.id] });
    if (!rows.length) return res.status(404).json({ success: false, error: { message: '사용자를 찾을 수 없습니다' } });

    const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ success: false, error: { message: '현재 비밀번호가 일치하지 않습니다' } });

    const hashed = await bcrypt.hash(new_password, 10);
    await sequelize.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', { bind: [hashed, req.user.id] });

    res.json({ success: true, message: '비밀번호가 변경되었습니다' });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: '비밀번호 변경 실패' } });
  }
});

// GPS 좌표 저장
router.post('/gps', authenticate, ctrl.updateGPS);

// 담당자 CRUD
router.get('/contacts', authenticate, ctrl.getContacts);
router.get('/contacts/company/:company_id', authenticate, ctrl.getContacts);
router.post('/contacts', authenticate, ctrl.addContact);
router.patch('/contacts/:id', authenticate, ctrl.updateContact);
router.delete('/contacts/:id', authenticate, ctrl.deleteContact);

// 인증현황 CRUD
router.get('/certifications', authenticate, ctrl.getCertifications);
router.get('/certifications/company/:company_id', authenticate, ctrl.getCertifications);
router.post('/certifications', authenticate, ctrl.addCertification);
router.patch('/certifications/:id', authenticate, ctrl.updateCertification);
router.delete('/certifications/:id', authenticate, ctrl.deleteCertification);

// 프로필 임시저장 / 승인요청
router.post('/draft', authenticate, ctrl.saveDraft);
router.post('/submit', authenticate, ctrl.submitForApproval);

// 프로필 승인/반려 (관리자용)
router.post('/approve/:company_id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.approveProfile);
router.post('/reject/:company_id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.rejectProfile);

// 사출기 톤수별 집계
router.get('/tonnage-summary', authenticate, ctrl.getEquipmentTonnageSummary);
router.get('/tonnage-summary/:company_id', authenticate, ctrl.getEquipmentTonnageSummary);

// 수동입력 장비 승인 (관리자용)
router.get('/pending-equipments', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.getPendingEquipments);
router.post('/approve-equipment/:id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.approveEquipment);

module.exports = router;
