const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const pdfReportService = require('../services/pdfReportService');

// POST /api/v1/reports/generate
router.post('/generate', authenticate, reportController.generateReport);

/**
 * @route   GET /api/v1/reports/pdf/inspection/:moldId
 * @desc    금형 점검 리포트 PDF 다운로드
 * @access  Private
 */
router.get('/pdf/inspection/:moldId', async (req, res) => {
  try {
    const { moldId } = req.params;
    const { startDate, endDate } = req.query;

    // 기본값: 최근 30일
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const pdfBuffer = await pdfReportService.generateInspectionReport(moldId, start, end);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inspection_report_${moldId}_${end}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: 'PDF 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/reports/pdf/statistics
 * @desc    통계 리포트 PDF 다운로드
 * @access  Private
 */
router.get('/pdf/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 기본값: 최근 30일
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const pdfBuffer = await pdfReportService.generateStatisticsReport(start, end);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=statistics_report_${end}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: 'PDF 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// GET /api/v1/reports/:id
router.get('/:id', authenticate, reportController.getReport);

// GET /api/v1/reports/transfer/:transferId
router.get('/transfer/:transferId', authenticate, reportController.getTransferReport);

// GET /api/v1/reports/inspection/:inspectionId
router.get('/inspection/:inspectionId', authenticate, reportController.getInspectionReport);

module.exports = router;
