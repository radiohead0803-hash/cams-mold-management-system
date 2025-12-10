const express = require('express');
const router = express.Router();
const weightController = require('../controllers/weightController');
const { authenticate } = require('../middleware/auth');

// 중량 업데이트 (설계중량/실중량)
router.put('/:mold_spec_id', authenticate, weightController.updateWeight);

// 중량 이력 조회
router.get('/:mold_spec_id/history', authenticate, weightController.getWeightHistory);

// 현재 중량 조회
router.get('/:mold_spec_id', authenticate, weightController.getCurrentWeight);

module.exports = router;
