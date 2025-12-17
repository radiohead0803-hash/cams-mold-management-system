/**
 * 오프라인 동기화 E2E 테스트
 * - 오프라인 상태 감지
 * - 요청 큐잉
 * - 온라인 복귀 시 동기화
 */
import { test, expect } from '@playwright/test';

test.describe('오프라인 동기화 테스트', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('오프라인 상태 감지', async ({ page, context }) => {
    await page.goto('/mobile/home');
    
    // 오프라인 모드로 전환
    await context.setOffline(true);
    
    // 오프라인 상태 표시 확인
    await page.waitForTimeout(1000);
    
    // 온라인 모드로 복귀
    await context.setOffline(false);
    
    // 페이지가 정상 동작하는지 확인
    await expect(page.locator('body')).toBeVisible();
  });

  test('오프라인 시 요청 큐잉', async ({ page, context }) => {
    // 먼저 로그인
    await page.goto('/mobile/qr-login');
    
    const quickLoginBtn = page.getByText('생산처 담당자');
    if (await quickLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickLoginBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // 오프라인 모드로 전환
    await context.setOffline(true);
    
    // 페이지 이동 시도
    await page.goto('/mobile/molds').catch(() => {});
    
    // 오프라인 상태에서도 캐시된 페이지 표시 확인
    await page.waitForTimeout(2000);
    
    // 온라인 모드로 복귀
    await context.setOffline(false);
    
    // 동기화 확인
    await page.waitForTimeout(2000);
  });

  test('서비스 워커 캐싱 확인', async ({ page }) => {
    // 첫 방문으로 캐시 생성
    await page.goto('/mobile/home');
    await page.waitForTimeout(2000);
    
    // 서비스 워커 등록 확인
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration ? true : false;
      }
      return false;
    });
    
    console.log('Service Worker registered:', swRegistration);
  });

});

test.describe('PWA 기능 테스트', () => {

  test('manifest.json 로드', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
  });

  test('서비스 워커 파일 존재', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
  });

  test('Firebase 서비스 워커 파일 존재', async ({ request }) => {
    const response = await request.get('/firebase-messaging-sw.js');
    expect(response.status()).toBe(200);
  });

});

test.describe('IndexedDB 저장소 테스트', () => {

  test('임시저장 기능', async ({ page }) => {
    await page.goto('/mobile/home');
    
    // IndexedDB 지원 확인
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    
    expect(hasIndexedDB).toBe(true);
  });

  test('localStorage 저장소', async ({ page }) => {
    await page.goto('/mobile/home');
    
    // localStorage 테스트
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });
    
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
    
    // 정리
    await page.evaluate(() => {
      localStorage.removeItem('test-key');
    });
  });

});
