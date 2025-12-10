const express = require('express');
const router = express.Router();
const periodicInspectionController = require('../controllers/periodicInspectionController');
const { authenticate } = require('../middleware/auth');

/**
 * 정기점검 항목 및 체크리스트 템플릿 관리 라우트
 */

// 타수별 정기점검 항목 조회
router.get('/items', authenticate, periodicInspectionController.getInspectionItems);

// 모든 정기점검 항목 조회
router.get('/items/all', authenticate, periodicInspectionController.getAllInspectionItems);

// 타수별 점검 항목 수 요약
router.get('/summary', authenticate, periodicInspectionController.getInspectionSummary);

// 체크리스트 템플릿 버전 목록 조회
router.get('/templates/versions', authenticate, periodicInspectionController.getTemplateVersions);

// 체크리스트 템플릿 버전 생성
router.post('/templates/versions', authenticate, periodicInspectionController.createTemplateVersion);

// 체크리스트 템플릿 배포
router.post('/templates/versions/:id/deploy', authenticate, periodicInspectionController.deployTemplateVersion);

// 체크리스트 템플릿 롤백
router.post('/templates/versions/:id/rollback', authenticate, periodicInspectionController.rollbackTemplateVersion);

module.exports = router;
