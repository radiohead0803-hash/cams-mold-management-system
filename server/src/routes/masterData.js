const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getCarModels,
  createCarModel,
  updateCarModel,
  deleteCarModel,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMoldTypes,
  createMoldType,
  updateMoldType,
  deleteMoldType,
  getTonnages,
  createTonnage,
  updateTonnage,
  deleteTonnage,
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial
} = require('../controllers/masterDataController');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// ===== 차종 관리 =====
router.get('/car-models', getCarModels);
router.post('/car-models', authorize(['mold_developer', 'system_admin']), createCarModel);
router.patch('/car-models/:id', authorize(['mold_developer', 'system_admin']), updateCarModel);
router.delete('/car-models/:id', authorize(['mold_developer', 'system_admin']), deleteCarModel);

// ===== 재질 관리 =====
router.get('/materials', getMaterials);
router.post('/materials', authorize(['mold_developer', 'system_admin']), createMaterial);
router.patch('/materials/:id', authorize(['mold_developer', 'system_admin']), updateMaterial);
router.delete('/materials/:id', authorize(['mold_developer', 'system_admin']), deleteMaterial);

// ===== 금형타입 관리 =====
router.get('/mold-types', getMoldTypes);
router.post('/mold-types', authorize(['mold_developer', 'system_admin']), createMoldType);
router.patch('/mold-types/:id', authorize(['mold_developer', 'system_admin']), updateMoldType);
router.delete('/mold-types/:id', authorize(['mold_developer', 'system_admin']), deleteMoldType);

// ===== 톤수 관리 =====
router.get('/tonnages', getTonnages);
router.post('/tonnages', authorize(['mold_developer', 'system_admin']), createTonnage);
router.patch('/tonnages/:id', authorize(['mold_developer', 'system_admin']), updateTonnage);
router.delete('/tonnages/:id', authorize(['mold_developer', 'system_admin']), deleteTonnage);

// ===== 원재료 관리 =====
router.get('/raw-materials', getRawMaterials);
router.post('/raw-materials', authorize(['mold_developer', 'system_admin']), createRawMaterial);
router.patch('/raw-materials/:id', authorize(['mold_developer', 'system_admin']), updateRawMaterial);
router.delete('/raw-materials/:id', authorize(['mold_developer', 'system_admin']), deleteRawMaterial);

module.exports = router;
