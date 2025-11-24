const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * 회사 관리 라우트 (제작처/생산처 통합)
 * 
 * GET    /api/v1/companies          - 회사 목록 조회
 * GET    /api/v1/companies/:id      - 회사 상세 조회
 * POST   /api/v1/companies          - 회사 등록
 * PATCH  /api/v1/companies/:id      - 회사 정보 수정
 * DELETE /api/v1/companies/:id      - 회사 비활성화
 * GET    /api/v1/companies/:id/stats - 회사 통계 조회
 */

// 전체 업체 통계 조회 (모든 인증된 사용자)
router.get('/stats/all', authenticate, companyController.getAllCompaniesStats);

// 회사 목록 조회 (모든 인증된 사용자)
router.get('/', authenticate, companyController.getCompanies);

// 회사 상세 조회 (모든 인증된 사용자)
router.get('/:id', authenticate, companyController.getCompanyById);

// 회사 등록 (시스템 관리자, 금형개발 담당)
router.post('/', 
  authenticate, 
  authorize(['system_admin', 'mold_developer']), 
  companyController.createCompany
);

// 회사 정보 수정 (시스템 관리자, 금형개발 담당)
router.patch('/:id', 
  authenticate, 
  authorize(['system_admin', 'mold_developer']), 
  companyController.updateCompany
);

// 회사 비활성화 (시스템 관리자만)
router.delete('/:id', 
  authenticate, 
  authorize(['system_admin']), 
  companyController.deleteCompany
);

// 회사 통계 조회 (모든 인증된 사용자)
router.get('/:id/stats', authenticate, companyController.getCompanyStats);

module.exports = router;
