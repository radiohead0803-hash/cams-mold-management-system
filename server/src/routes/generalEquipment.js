const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/generalEquipmentController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 협력사 보유 장비현황 라우트
 * 
 * === 카테고리 ===
 * GET    /categories                - 카테고리 목록
 * POST   /categories                - 카테고리 등록
 * PATCH  /categories/:id            - 카테고리 수정
 * DELETE /categories/:id            - 카테고리 삭제
 * 
 * === 장비 마스터 ===
 * GET    /masters                   - 마스터 목록
 * POST   /masters                   - 마스터 등록
 * PATCH  /masters/:id               - 마스터 수정
 * DELETE /masters/:id               - 마스터 삭제
 * 
 * === 업체별 보유장비 ===
 * GET    /my                        - 내 업체 보유장비
 * POST   /my                        - 내 업체 장비 등록
 * GET    /company/:company_id       - 특정 업체 보유장비
 * POST   /company/:company_id       - 특정 업체 장비 등록
 * PATCH  /:id                       - 보유장비 수정
 * DELETE /:id                       - 보유장비 삭제
 * 
 * === 분석 ===
 * GET    /analytics                 - 장비 보유/캐파 분석
 */

// 카테고리
router.get('/categories', authenticate, ctrl.getCategories);
router.post('/categories', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.createCategory);
router.patch('/categories/:id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.updateCategory);
router.delete('/categories/:id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.deleteCategory);

// 장비 마스터
router.get('/masters', authenticate, ctrl.getGeneralMasters);
router.post('/masters', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.createGeneralMaster);
router.patch('/masters/:id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.updateGeneralMaster);
router.delete('/masters/:id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.deleteGeneralMaster);

// 내 업체 보유장비
router.get('/my', authenticate, ctrl.getCompanyGeneralEquipments);
router.post('/my', authenticate, ctrl.addCompanyGeneralEquipment);

// 특정 업체 보유장비
router.get('/company/:company_id', authenticate, ctrl.getCompanyGeneralEquipments);
router.post('/company/:company_id', authenticate, authorize(['system_admin', 'mold_developer']), ctrl.addCompanyGeneralEquipment);

// 보유장비 수정/삭제
router.patch('/:id', authenticate, ctrl.updateCompanyGeneralEquipment);
router.delete('/:id', authenticate, ctrl.deleteCompanyGeneralEquipment);

// 분석
router.get('/analytics', authenticate, ctrl.getGeneralEquipmentAnalytics);

module.exports = router;
