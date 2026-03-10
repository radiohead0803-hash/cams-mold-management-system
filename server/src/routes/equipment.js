const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 장비 관리 라우트
 * 
 * === 장비 마스터 (기초정보) ===
 * GET    /api/v1/equipment/masters              - 마스터 목록 조회
 * GET    /api/v1/equipment/masters/manufacturers - 제조사 목록
 * GET    /api/v1/equipment/masters/:id           - 마스터 단건 조회
 * POST   /api/v1/equipment/masters               - 마스터 등록
 * PATCH  /api/v1/equipment/masters/:id           - 마스터 수정
 * DELETE /api/v1/equipment/masters/:id           - 마스터 삭제
 * 
 * === 업체별 보유장비 ===
 * GET    /api/v1/equipment/my                    - 내 업체 보유장비
 * POST   /api/v1/equipment/my                    - 내 업체 장비 등록
 * POST   /api/v1/equipment/my/bulk               - 내 업체 장비 일괄등록
 * GET    /api/v1/equipment/company/:company_id   - 특정 업체 보유장비
 * POST   /api/v1/equipment/company/:company_id   - 특정 업체 장비 등록
 * POST   /api/v1/equipment/company/:company_id/bulk - 특정 업체 장비 일괄등록
 * PATCH  /api/v1/equipment/:id                   - 보유장비 수정
 * DELETE /api/v1/equipment/:id                   - 보유장비 삭제
 * 
 * === 분석 ===
 * GET    /api/v1/equipment/analytics             - 전체 장비보유/캐파 분석
 */

// --- 장비 마스터 (기초정보) ---
router.get('/masters/manufacturers', authenticate, equipmentController.getManufacturers);
router.get('/masters', authenticate, equipmentController.getEquipmentMasters);
router.get('/masters/:id', authenticate, equipmentController.getEquipmentMasterById);
router.post('/masters', authenticate, authorize(['system_admin', 'mold_developer']), equipmentController.createEquipmentMaster);
router.patch('/masters/:id', authenticate, authorize(['system_admin', 'mold_developer']), equipmentController.updateEquipmentMaster);
router.delete('/masters/:id', authenticate, authorize(['system_admin', 'mold_developer']), equipmentController.deleteEquipmentMaster);

// --- 내 업체 보유장비 ---
router.get('/my', authenticate, equipmentController.getMyCompanyEquipments);
router.post('/my', authenticate, equipmentController.addCompanyEquipment);
router.post('/my/bulk', authenticate, equipmentController.bulkAddCompanyEquipment);

// --- 특정 업체 보유장비 ---
router.get('/company/:company_id', authenticate, equipmentController.getCompanyEquipments);
router.post('/company/:company_id', authenticate, authorize(['system_admin', 'mold_developer']), equipmentController.addCompanyEquipment);
router.post('/company/:company_id/bulk', authenticate, authorize(['system_admin', 'mold_developer']), equipmentController.bulkAddCompanyEquipment);

// --- 보유장비 수정/삭제 ---
router.patch('/:id', authenticate, equipmentController.updateCompanyEquipment);
router.delete('/:id', authenticate, equipmentController.deleteCompanyEquipment);

// --- 분석 ---
router.get('/analytics', authenticate, equipmentController.getEquipmentAnalytics);

module.exports = router;
