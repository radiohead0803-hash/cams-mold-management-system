/**
 * 서비스 유닛 테스트
 * - 캐시 미들웨어
 * - 이메일 서비스
 * - PDF 서비스
 */

describe('Cache Middleware', () => {
  let cache, cacheMiddleware, getCacheStats, clearCache, invalidateCache;

  beforeEach(() => {
    // 캐시 모듈 로드
    jest.resetModules();
    const cacheModule = require('../middleware/cache');
    cacheMiddleware = cacheModule.cacheMiddleware;
    getCacheStats = cacheModule.getCacheStats;
    clearCache = cacheModule.clearCache;
    invalidateCache = cacheModule.invalidateCache;
  });

  afterEach(() => {
    clearCache();
  });

  test('getCacheStats - 초기 상태', () => {
    const stats = getCacheStats();
    
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('validEntries');
    expect(stats).toHaveProperty('expiredEntries');
    expect(stats).toHaveProperty('maxEntries');
    expect(stats.totalEntries).toBe(0);
  });

  test('clearCache - 캐시 클리어', () => {
    clearCache();
    const stats = getCacheStats();
    
    expect(stats.totalEntries).toBe(0);
  });

  test('cacheMiddleware - 미들웨어 함수 반환', () => {
    const middleware = cacheMiddleware(60000);
    
    expect(typeof middleware).toBe('function');
  });
});

describe('Email Service', () => {
  let emailService;

  beforeEach(() => {
    jest.resetModules();
    // SMTP 설정 없이 테스트
    emailService = require('../services/emailService');
  });

  test('sendEmail - SMTP 미설정 시 스킵', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('SMTP not configured');
  });
});

describe('PDF Report Service', () => {
  test('모듈 로드 확인', () => {
    const pdfService = require('../services/pdfReportService');
    
    expect(pdfService).toHaveProperty('generateInspectionReport');
    expect(pdfService).toHaveProperty('generateStatisticsReport');
    expect(typeof pdfService.generateInspectionReport).toBe('function');
    expect(typeof pdfService.generateStatisticsReport).toBe('function');
  });
});

describe('Push Notification Service', () => {
  let pushService;

  beforeEach(() => {
    jest.resetModules();
    pushService = require('../services/pushNotificationService');
  });

  test('모듈 로드 확인', () => {
    expect(pushService).toHaveProperty('sendToDevice');
    expect(pushService).toHaveProperty('sendToMultipleDevices');
    expect(pushService).toHaveProperty('sendToTopic');
    expect(typeof pushService.sendToDevice).toBe('function');
  });

  test('sendToDevice - Firebase 미설정 시', async () => {
    const result = await pushService.sendToDevice('test-token', {
      title: 'Test',
      body: 'Test message'
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Firebase not configured');
  });
});
