const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { User, sequelize } = require('../models/newIndex');

/**
 * @route   POST /api/v1/email/test
 * @desc    이메일 발송 테스트
 * @access  Private (Admin only)
 */
router.post('/test', async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: '수신자(to)와 제목(subject)은 필수입니다.'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html: `<p>${message || '테스트 이메일입니다.'}</p>`
    });

    res.json({
      success: result.success,
      message: result.success ? '이메일이 발송되었습니다.' : '이메일 발송에 실패했습니다.',
      data: result
    });

  } catch (error) {
    console.error('이메일 테스트 오류:', error);
    res.status(500).json({
      success: false,
      message: '이메일 발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/email/send-daily-summary
 * @desc    일일 요약 이메일 발송 (스케줄러용)
 * @access  Private (System)
 */
router.post('/send-daily-summary', async (req, res) => {
  try {
    // 이메일 수신 설정된 사용자 조회
    const [users] = await sequelize.query(`
      SELECT id, name, email, user_type 
      FROM users 
      WHERE email IS NOT NULL 
        AND email != ''
        AND is_active = true
        AND COALESCE(email_notifications, true) = true
      LIMIT 100
    `);

    const results = [];

    for (const user of users) {
      // 사용자별 요약 데이터 조회
      const [summaryData] = await sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM daily_checks WHERE check_date = CURRENT_DATE) as inspections_today,
          (SELECT COUNT(*) FROM alerts WHERE is_read = false AND created_at >= CURRENT_DATE) as pending_alerts,
          (SELECT COUNT(*) FROM repair_requests WHERE status = 'pending') as pending_repairs
      `);

      const summary = {
        inspections_due: summaryData[0]?.inspections_today || 0,
        pending_approvals: summaryData[0]?.pending_alerts || 0,
        overdue_items: summaryData[0]?.pending_repairs || 0,
        alerts: []
      };

      const result = await emailService.sendDailySummaryEmail(user, summary);
      results.push({ userId: user.id, email: user.email, ...result });
    }

    res.json({
      success: true,
      message: `${results.filter(r => r.success).length}/${users.length}명에게 이메일 발송 완료`,
      data: results
    });

  } catch (error) {
    console.error('일일 요약 이메일 발송 오류:', error);
    res.status(500).json({
      success: false,
      message: '일일 요약 이메일 발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/email/config
 * @desc    이메일 설정 상태 확인
 * @access  Private (Admin only)
 */
router.get('/config', async (req, res) => {
  try {
    const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    res.json({
      success: true,
      data: {
        configured: isConfigured,
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '설정 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
