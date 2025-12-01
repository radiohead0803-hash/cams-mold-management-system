const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { recalcInspectionSchedules, recalcDateBasedInspections } = require('../services/inspectionSchedule');
const logger = require('../utils/logger');

// 본사 관리자 및 금형개발 담당자만 접근 가능
router.use(authenticate, authorize(['system_admin', 'mold_developer']));

/**
 * POST /api/v1/hq/jobs/recalc-inspections
 * 점검 스케줄 재계산 (타수 기반)
 */
router.post('/jobs/recalc-inspections', async (req, res) => {
  try {
    logger.info('Manual inspection schedule recalculation triggered by user:', req.user.id);

    const result = await recalcInspectionSchedules();

    return res.json({
      success: true,
      message: '점검 스케줄 재계산이 완료되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('Recalc inspections job error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '점검 스케줄 재계산 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/jobs/recalc-date-inspections
 * 점검 스케줄 재계산 (날짜 기반)
 */
router.post('/jobs/recalc-date-inspections', async (req, res) => {
  try {
    logger.info('Manual date-based inspection schedule recalculation triggered by user:', req.user.id);

    const result = await recalcDateBasedInspections();

    return res.json({
      success: true,
      message: '날짜 기반 점검 스케줄 재계산이 완료되었습니다.',
      data: result
    });

  } catch (error) {
    logger.error('Recalc date inspections job error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '날짜 기반 점검 스케줄 재계산 중 오류가 발생했습니다.'
      }
    });
  }
});

/**
 * POST /api/v1/hq/jobs/recalc-all
 * 모든 점검 스케줄 재계산 (타수 + 날짜)
 */
router.post('/jobs/recalc-all', async (req, res) => {
  try {
    logger.info('Manual full inspection schedule recalculation triggered by user:', req.user.id);

    const shotResult = await recalcInspectionSchedules();
    const dateResult = await recalcDateBasedInspections();

    return res.json({
      success: true,
      message: '전체 점검 스케줄 재계산이 완료되었습니다.',
      data: {
        shot_based: shotResult,
        date_based: dateResult,
        total_scheduled: shotResult.scheduledCount + dateResult.scheduledCount
      }
    });

  } catch (error) {
    logger.error('Recalc all inspections job error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: '전체 점검 스케줄 재계산 중 오류가 발생했습니다.'
      }
    });
  }
});

module.exports = router;
