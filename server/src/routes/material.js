const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticate } = require('../middleware/auth');

// 원재료 정보 업데이트 (개발담당자만)
router.put('/:mold_spec_id', authenticate, materialController.updateMaterial);

// 원재료 이력 조회
router.get('/:mold_spec_id/history', authenticate, materialController.getMaterialHistory);

// 현재 원재료 정보 조회
router.get('/:mold_spec_id', authenticate, materialController.getCurrentMaterial);

module.exports = router;
