/**
 * 시스템 규칙/기준값 라우터
 */
const express = require('express');
const router = express.Router();
const systemRuleController = require('../controllers/systemRuleController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 모든 규칙 조회
 * GET /api/v1/system-rules
 */
router.get('/', authenticate, systemRuleController.getRules);

/**
 * 기본 규칙 시드 데이터 생성
 * POST /api/v1/system-rules/seed
 */
router.post('/seed', authenticate, authorize(['system_admin']), systemRuleController.seedDefaultRules);

/**
 * 규칙 상세 조회
 * GET /api/v1/system-rules/:key
 */
router.get('/:key', authenticate, systemRuleController.getRuleByKey);

/**
 * 규칙 값 업데이트
 * PATCH /api/v1/system-rules/:key
 */
router.patch('/:key', authenticate, authorize(['system_admin']), systemRuleController.updateRule);

/**
 * 규칙 생성
 * POST /api/v1/system-rules
 */
router.post('/', authenticate, authorize(['system_admin']), systemRuleController.createRule);

/**
 * 규칙 초기화
 * POST /api/v1/system-rules/:key/reset
 */
router.post('/:key/reset', authenticate, authorize(['system_admin']), systemRuleController.resetRule);

module.exports = router;
