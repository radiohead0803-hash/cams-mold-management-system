/**
 * 지연 로딩 유틸리티
 * 페이지 컴포넌트를 동적으로 로드하여 초기 번들 크기 감소
 */
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// 로딩 컴포넌트
export function LoadingFallback({ message = '로딩 중...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

// 모바일 로딩 컴포넌트
export function MobileLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-sm text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 컴포넌트 로딩 실패 시 폴백
export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          페이지를 불러올 수 없습니다
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {error?.message || '네트워크 연결을 확인해주세요.'}
        </p>
        <button
          onClick={resetErrorBoundary || (() => window.location.reload())}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

/**
 * 지연 로딩 래퍼
 * @param {Function} importFn - 동적 import 함수
 * @param {Object} options - 옵션
 * @returns {React.Component} 지연 로딩된 컴포넌트
 */
export function lazyLoad(importFn, options = {}) {
  const { 
    fallback = <LoadingFallback />,
    preload = false 
  } = options;

  const LazyComponent = lazy(importFn);

  // 프리로드 옵션이 있으면 미리 로드
  if (preload) {
    importFn();
  }

  // Suspense로 감싼 컴포넌트 반환
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * 모바일 페이지 지연 로딩
 */
export function lazyMobilePage(importFn) {
  return lazyLoad(importFn, { 
    fallback: <MobileLoadingFallback /> 
  });
}

/**
 * 프리로드 함수
 * 사용자가 링크에 호버할 때 미리 로드
 */
export function preloadComponent(importFn) {
  return () => {
    importFn();
  };
}

// 자주 사용되는 모바일 페이지 지연 로딩 예시
export const LazyMobilePages = {
  MobileDashboard: lazyMobilePage(() => import('../pages/mobile/MobileDashboard')),
  MobileSearch: lazyMobilePage(() => import('../pages/mobile/MobileSearch')),
  MobileProfile: lazyMobilePage(() => import('../pages/mobile/MobileProfile')),
  MobileHelp: lazyMobilePage(() => import('../pages/mobile/MobileHelp')),
  MobileNotificationSettings: lazyMobilePage(() => import('../pages/mobile/MobileNotificationSettings')),
};

export default {
  LoadingFallback,
  MobileLoadingFallback,
  ErrorFallback,
  lazyLoad,
  lazyMobilePage,
  preloadComponent,
  LazyMobilePages
};
