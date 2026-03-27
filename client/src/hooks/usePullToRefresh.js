import { useState, useRef, useCallback } from 'react';

/**
 * 모바일 Pull-to-Refresh 훅
 *
 * @param {Object} options
 * @param {Function} options.onRefresh - 새로고침 콜백 (async 가능)
 * @param {number}  [options.threshold=80] - 새로고침 트리거 거리(px)
 * @param {number}  [options.maxPull=120]  - 최대 당김 거리(px)
 * @returns {{ pullDistance: number, isPulling: boolean, isRefreshing: boolean, handlers: Object }}
 */
export default function usePullToRefresh({ onRefresh, threshold = 80, maxPull = 120 } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    // 스크롤이 맨 위에 있을 때만 pull-to-refresh 활성화
    const el = e.currentTarget;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
    setIsPulling(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const el = e.currentTarget;
    if (el.scrollTop > 0) {
      // 스크롤 중이면 pull 리셋
      pulling.current = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // 감속 비율 적용 (0.5)
      setPullDistance(Math.min(delta * 0.5, maxPull));
    }
  }, [maxPull]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing && onRefresh) {
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } catch (err) {
        console.error('Pull-to-refresh 오류:', err);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
