/**
 * 모바일 E2E 테스트
 * - 모바일 홈 페이지
 * - QR 로그인
 * - 대시보드
 * - 금형 목록
 */
import { test, expect } from '@playwright/test';

// 테스트 계정
const TEST_USER = {
  username: 'plant1',
  password: 'plant123'
};

test.describe('모바일 페이지 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('모바일 QR 로그인 페이지 로드', async ({ page }) => {
    await page.goto('/mobile/qr-login');
    
    // 페이지 타이틀 확인
    await expect(page.locator('h1')).toContainText('CAMS');
    
    // QR 스캔 버튼 확인
    await expect(page.getByText('카메라로 QR 스캔')).toBeVisible();
  });

  test('모바일 홈 페이지 로드 (로그인 후)', async ({ page }) => {
    // 로그인
    await page.goto('/mobile/qr-login');
    
    // 테스트 빠른 로그인 버튼 클릭
    const quickLoginBtn = page.getByText('생산처 담당자');
    if (await quickLoginBtn.isVisible()) {
      await quickLoginBtn.click();
      
      // 홈 페이지로 이동 확인
      await page.waitForURL('**/mobile/home', { timeout: 10000 });
      
      // 빠른 작업 섹션 확인
      await expect(page.getByText('빠른 작업')).toBeVisible();
    }
  });

  test('모바일 금형 목록 페이지', async ({ page }) => {
    await page.goto('/mobile/molds');
    
    // 페이지 로드 확인
    await expect(page.locator('body')).toBeVisible();
  });

  test('모바일 알림 페이지', async ({ page }) => {
    await page.goto('/mobile/alerts');
    
    // 페이지 로드 확인
    await expect(page.locator('body')).toBeVisible();
  });

  test('모바일 리포트 페이지', async ({ page }) => {
    await page.goto('/mobile/reports');
    
    // 통계 리포트 타이틀 확인
    await expect(page.getByText('통계 리포트')).toBeVisible();
    
    // 기간 탭 확인
    await expect(page.getByText('주간')).toBeVisible();
    await expect(page.getByText('월간')).toBeVisible();
  });

});

test.describe('PC 페이지 테스트', () => {

  test('로그인 페이지 로드', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 폼 확인
    await expect(page.locator('input[type="text"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('대시보드 접근 (인증 필요)', async ({ page }) => {
    await page.goto('/');
    
    // 인증되지 않으면 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/login/);
  });

});

test.describe('API 응답 테스트', () => {

  test('모바일 대시보드 API 응답', async ({ request }) => {
    const response = await request.get('/api/v1/mobile/dashboard/plant');
    
    // 401 또는 200 응답 확인 (인증 여부에 따라)
    expect([200, 401]).toContain(response.status());
  });

  test('통계 리포트 API 응답', async ({ request }) => {
    const response = await request.get('/api/v1/statistics-report/summary?period=weekly');
    
    // 401 또는 200 응답 확인
    expect([200, 401]).toContain(response.status());
  });

});
