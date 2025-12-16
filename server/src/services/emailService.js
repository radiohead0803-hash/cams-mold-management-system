const nodemailer = require('nodemailer');

/**
 * 이메일 발송 서비스
 * - 중요 알림 이메일 발송
 * - 점검 예정/지연 알림
 * - 승인 요청/결과 알림
 */

// 이메일 전송자 설정 (환경변수에서 로드)
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  // SMTP 설정이 없으면 null 반환
  if (!config.auth.user || !config.auth.pass) {
    console.warn('[EmailService] SMTP credentials not configured. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransport(config);
};

let transporter = null;

/**
 * 이메일 발송
 * @param {Object} options - 이메일 옵션
 * @param {string} options.to - 수신자 이메일
 * @param {string} options.subject - 제목
 * @param {string} options.html - HTML 본문
 * @param {string} options.text - 텍스트 본문 (선택)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      console.log('[EmailService] Email skipped (SMTP not configured):', subject);
      return { success: false, reason: 'SMTP not configured' };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `[CAMS] ${subject}`,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Email sent:', result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[EmailService] Send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 점검 예정 알림 이메일
 */
const sendInspectionDueEmail = async (user, mold, daysUntil) => {
  const subject = `점검 예정 알림 - ${mold.mold_code}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">🔔 점검 예정 알림</h2>
      <p>안녕하세요, <strong>${user.name}</strong>님</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">금형 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0;"><strong>금형코드:</strong></td><td>${mold.mold_code}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>금형명:</strong></td><td>${mold.mold_name || '-'}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>품명:</strong></td><td>${mold.part_name || '-'}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>점검 예정일:</strong></td><td style="color: #d32f2f; font-weight: bold;">D-${daysUntil}</td></tr>
        </table>
      </div>
      <p>점검 일정을 확인하시고 준비해 주세요.</p>
      <a href="${process.env.CLIENT_URL || 'https://spirited-liberation-production.up.railway.app'}/molds/${mold.id}" 
         style="display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        금형 상세 보기
      </a>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">본 메일은 CAMS 금형관리시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
};

/**
 * 승인 요청 알림 이메일
 */
const sendApprovalRequestEmail = async (approver, requester, requestType, details) => {
  const typeLabels = {
    'daily_check': '일상점검',
    'periodic_inspection': '정기점검',
    'scrapping': '금형 폐기',
    'transfer': '금형 이관',
    'repair': '수리 요청'
  };

  const subject = `승인 요청 - ${typeLabels[requestType] || requestType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff9800;">📋 승인 요청</h2>
      <p>안녕하세요, <strong>${approver.name}</strong>님</p>
      <p><strong>${requester.name}</strong>님이 승인을 요청했습니다.</p>
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
        <h3 style="margin-top: 0;">요청 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0;"><strong>요청 유형:</strong></td><td>${typeLabels[requestType] || requestType}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>요청자:</strong></td><td>${requester.name}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>요청일시:</strong></td><td>${new Date().toLocaleString('ko-KR')}</td></tr>
          ${details.mold_code ? `<tr><td style="padding: 8px 0;"><strong>금형코드:</strong></td><td>${details.mold_code}</td></tr>` : ''}
          ${details.notes ? `<tr><td style="padding: 8px 0;"><strong>비고:</strong></td><td>${details.notes}</td></tr>` : ''}
        </table>
      </div>
      <a href="${process.env.CLIENT_URL || 'https://spirited-liberation-production.up.railway.app'}/approvals" 
         style="display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        승인 페이지로 이동
      </a>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">본 메일은 CAMS 금형관리시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  return sendEmail({ to: approver.email, subject, html });
};

/**
 * 승인 결과 알림 이메일
 */
const sendApprovalResultEmail = async (requester, approver, requestType, isApproved, details) => {
  const typeLabels = {
    'daily_check': '일상점검',
    'periodic_inspection': '정기점검',
    'scrapping': '금형 폐기',
    'transfer': '금형 이관',
    'repair': '수리 요청'
  };

  const status = isApproved ? '승인' : '반려';
  const statusColor = isApproved ? '#4caf50' : '#f44336';
  const statusEmoji = isApproved ? '✅' : '❌';

  const subject = `${status} 완료 - ${typeLabels[requestType] || requestType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${statusColor};">${statusEmoji} ${status} 완료</h2>
      <p>안녕하세요, <strong>${requester.name}</strong>님</p>
      <p>요청하신 건이 <strong style="color: ${statusColor};">${status}</strong>되었습니다.</p>
      <div style="background: ${isApproved ? '#e8f5e9' : '#ffebee'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
        <h3 style="margin-top: 0;">처리 정보</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0;"><strong>요청 유형:</strong></td><td>${typeLabels[requestType] || requestType}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>처리자:</strong></td><td>${approver.name}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>처리일시:</strong></td><td>${new Date().toLocaleString('ko-KR')}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>결과:</strong></td><td style="color: ${statusColor}; font-weight: bold;">${status}</td></tr>
          ${details.reject_reason ? `<tr><td style="padding: 8px 0;"><strong>반려 사유:</strong></td><td>${details.reject_reason}</td></tr>` : ''}
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">본 메일은 CAMS 금형관리시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  return sendEmail({ to: requester.email, subject, html });
};

/**
 * 긴급 알림 이메일 (수리 요청, 점검 지연 등)
 */
const sendUrgentAlertEmail = async (user, alertType, details) => {
  const alertLabels = {
    'repair_urgent': '긴급 수리 요청',
    'inspection_overdue': '점검 지연',
    'maintenance_overdue': '유지보전 지연',
    'scrapping_pending': '폐기 승인 대기'
  };

  const subject = `⚠️ 긴급 - ${alertLabels[alertType] || alertType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">⚠️ 긴급 알림</h2>
      <p>안녕하세요, <strong>${user.name}</strong>님</p>
      <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
        <h3 style="margin-top: 0; color: #d32f2f;">${alertLabels[alertType] || alertType}</h3>
        <p>${details.message}</p>
        ${details.mold_code ? `<p><strong>금형코드:</strong> ${details.mold_code}</p>` : ''}
        ${details.due_date ? `<p><strong>기한:</strong> ${details.due_date}</p>` : ''}
      </div>
      <p>즉시 확인 및 조치가 필요합니다.</p>
      <a href="${process.env.CLIENT_URL || 'https://spirited-liberation-production.up.railway.app'}/alerts" 
         style="display: inline-block; background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        알림 확인하기
      </a>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">본 메일은 CAMS 금형관리시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
};

/**
 * 일일 요약 이메일
 */
const sendDailySummaryEmail = async (user, summary) => {
  const subject = `일일 요약 리포트 - ${new Date().toLocaleDateString('ko-KR')}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">📊 일일 요약 리포트</h2>
      <p>안녕하세요, <strong>${user.name}</strong>님</p>
      <p>${new Date().toLocaleDateString('ko-KR')} 기준 현황입니다.</p>
      
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">오늘의 현황</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; text-align: center; background: white; border-radius: 4px; margin: 4px;">
              <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${summary.inspections_due || 0}</div>
              <div style="font-size: 12px; color: #666;">점검 예정</div>
            </td>
            <td style="padding: 12px; text-align: center; background: white; border-radius: 4px; margin: 4px;">
              <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${summary.pending_approvals || 0}</div>
              <div style="font-size: 12px; color: #666;">승인 대기</div>
            </td>
            <td style="padding: 12px; text-align: center; background: white; border-radius: 4px; margin: 4px;">
              <div style="font-size: 24px; font-weight: bold; color: #f44336;">${summary.overdue_items || 0}</div>
              <div style="font-size: 12px; color: #666;">지연 항목</div>
            </td>
          </tr>
        </table>
      </div>

      ${summary.alerts && summary.alerts.length > 0 ? `
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">주요 알림</h3>
        <ul style="padding-left: 20px;">
          ${summary.alerts.map(alert => `<li style="padding: 4px 0;">${alert}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <a href="${process.env.CLIENT_URL || 'https://spirited-liberation-production.up.railway.app'}/dashboard" 
         style="display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        대시보드 바로가기
      </a>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">본 메일은 CAMS 금형관리시스템에서 자동 발송되었습니다.</p>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
};

module.exports = {
  sendEmail,
  sendInspectionDueEmail,
  sendApprovalRequestEmail,
  sendApprovalResultEmail,
  sendUrgentAlertEmail,
  sendDailySummaryEmail
};
