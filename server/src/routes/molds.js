const express = require('express');
const router = express.Router();
const moldController = require('../controllers/moldController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/molds
 * @desc    금형 목록 조회 (검색, 필터링, 페이징)
 * @access  Private
 */
router.get('/', authenticate, moldController.getMolds);

/**
 * @route   GET /api/molds/stats
 * @desc    금형 통계
 * @access  Private
 */
router.get('/stats', authenticate, moldController.getMoldStats);

/**
 * @route   GET /api/molds/:id
 * @desc    금형 상세 조회
 * @access  Private
 */
router.get('/:id', authenticate, moldController.getMold);

/**
 * @route   POST /api/molds
 * @desc    금형 생성
 * @access  Private (HQ Admin, HQ Manager)
 */
router.post('/', 
  authenticate, 
  authorize('hq_admin', 'hq_manager'), 
  moldController.createMold
);

/**
 * @route   PUT /api/molds/:id
 * @desc    금형 수정
 * @access  Private (HQ Admin, HQ Manager, Partner Admin)
 */
router.put('/:id', 
  authenticate, 
  authorize('hq_admin', 'hq_manager', 'partner_admin'), 
  moldController.updateMold
);

/**
 * @route   DELETE /api/molds/:id
 * @desc    금형 삭제
 * @access  Private (HQ Admin, HQ Manager)
 */
router.delete('/:id', 
  authenticate, 
  authorize('hq_admin', 'hq_manager'), 
  moldController.deleteMold
);

/**
 * @route   PATCH /api/molds/:id/status
 * @desc    금형 상태 변경
 * @access  Private
 */
router.patch('/:id/status', 
  authenticate, 
  moldController.updateMoldStatus
);

/**
 * @route   PATCH /api/molds/:id/location
 * @desc    금형 위치 변경
 * @access  Private (HQ Admin, HQ Manager)
 */
router.patch('/:id/location', 
  authenticate, 
  authorize('hq_admin', 'hq_manager'), 
  moldController.updateMoldLocation
);

module.exports = router;
