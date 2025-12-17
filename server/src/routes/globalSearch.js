/**
 * 전역 검색 라우터
 */
const express = require('express');
const router = express.Router();
const globalSearchController = require('../controllers/globalSearchController');
const { authenticate } = require('../middleware/auth');

/**
 * 전역 검색
 * GET /api/v1/search
 */
router.get('/', authenticate, globalSearchController.globalSearch);

/**
 * 검색 제안 (자동완성)
 * GET /api/v1/search/suggestions
 */
router.get('/suggestions', authenticate, globalSearchController.getSearchSuggestions);

module.exports = router;
