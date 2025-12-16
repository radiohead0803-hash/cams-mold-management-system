const express = require('express');
const router = express.Router();
const { getCacheStats, clearCache, invalidateCache } = require('../middleware/cache');

/**
 * @route   GET /api/v1/cache/stats
 * @desc    캐시 통계 조회
 * @access  Private (Admin only)
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '캐시 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/cache/clear
 * @desc    전체 캐시 클리어
 * @access  Private (Admin only)
 */
router.post('/clear', (req, res) => {
  try {
    clearCache();
    res.json({
      success: true,
      message: '캐시가 클리어되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '캐시 클리어 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/cache/invalidate
 * @desc    특정 패턴의 캐시 무효화
 * @access  Private (Admin only)
 */
router.post('/invalidate', (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        message: 'pattern은 필수입니다.'
      });
    }

    invalidateCache(pattern);
    res.json({
      success: true,
      message: `패턴 "${pattern}"에 해당하는 캐시가 무효화되었습니다.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '캐시 무효화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
