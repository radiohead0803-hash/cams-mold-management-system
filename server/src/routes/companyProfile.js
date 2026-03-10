const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/companyProfileController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 협력사 프로필 관리 라우트
 * Base: /api/v1/company-profile
 */

// 비밀번호 변경 (승인 없이 즉시)
router.post('/change-password', authenticate, ctrl.changePassword);

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
