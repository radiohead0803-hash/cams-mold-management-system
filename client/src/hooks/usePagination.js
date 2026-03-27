import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 무한 스크롤 페이지네이션 훅
 *
 * @param {Object} options
 * @param {Function} options.fetchPage - (page, limit) => Promise<{ items: Array, hasMore: boolean }>
 * @param {number}   [options.limit=20]  - 페이지당 항목 수
 * @param {boolean}  [options.autoLoad=true] - sentinel 노출 시 자동 로드
 * @returns {{ items, loading, hasMore, loadMore, sentinelRef, reset }}
 */
export default function usePagination({ fetchPage, limit = 20, autoLoad = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const initialLoadDone = useRef(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !fetchPage) return;

    setLoading(true);
    try {
      const result = await fetchPage(pageRef.current, limit);
      const newItems = result?.items || [];
      const more = result?.hasMore ?? (newItems.length >= limit);

      setItems((prev) => (pageRef.current === 1 ? newItems : [...prev, ...newItems]));
      setHasMore(more);
      pageRef.current += 1;
    } catch (err) {
      console.error('페이지 로드 오류:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, fetchPage, limit]);

  const reset = useCallback(() => {
    pageRef.current = 1;
    setItems([]);
    setHasMore(true);
    setLoading(false);
    initialLoadDone.current = false;
  }, []);

  // IntersectionObserver: sentinel이 뷰포트에 보이면 다음 페이지 로드
  useEffect(() => {
    if (!autoLoad) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [autoLoad, hasMore, loading, loadMore]);

  // 초기 로드
  useEffect(() => {
    if (!initialLoadDone.current && fetchPage) {
      initialLoadDone.current = true;
      loadMore();
    }
  }, [fetchPage]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    hasMore,
    loadMore,
    sentinelRef,
    reset,
  };
}
