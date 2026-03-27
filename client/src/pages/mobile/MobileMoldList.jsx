/**
 * 모바일 금형 목록 페이지
 * - 무한 스크롤 페이지네이션 (20개씩)
 * - Pull-to-refresh
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Package, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import useAuthRestore from '../../hooks/useAuthRestore';
import usePagination from '../../hooks/usePagination';
import usePullToRefresh from '../../hooks/usePullToRefresh';

const PAGE_SIZE = 20;

export default function MobileMoldList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  // 페이지네이션 fetch 함수
  const fetchPage = useCallback(async (page, limit) => {
    const params = { page, limit };
    if (statusFilter !== 'all') params.status = statusFilter;

    let molds = [];
    let total = 0;

    try {
      // 1차: mold-specifications API (페이지네이션 지원)
      const response = await api.get('/mold-specifications', { params });
      const d = response.data?.data;
      total = d?.total || 0;
      molds = d?.items || d?.rows || (Array.isArray(d) ? d : []);
      if (!molds.length && Array.isArray(response.data)) molds = response.data;
    } catch (e1) {
      // 2차: mobile/dashboard/molds 폴백
      try {
        const fallback = await api.get('/mobile/dashboard/molds', {
          params: { ...(statusFilter !== 'all' ? { status: statusFilter } : {}), limit: 100 },
        });
        molds = fallback.data?.data?.molds || fallback.data?.molds || [];
        // 폴백은 전체 로드이므로 수동 슬라이스
        total = molds.length;
        const start = (page - 1) * limit;
        molds = molds.slice(start, start + limit);
      } catch (e2) {
        console.error('금형 목록 조회 실패:', e2.message);
      }
    }

    return {
      items: molds,
      hasMore: molds.length >= limit && (total === 0 || page * limit < total),
    };
  }, [statusFilter]);

  const {
    items: molds,
    loading,
    hasMore,
    sentinelRef,
    reset,
  } = usePagination({ fetchPage, limit: PAGE_SIZE });

  // 필터 변경 시 리셋 후 재로드
  useEffect(() => {
    reset();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useAuthRestore(() => reset());

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    reset();
  }, [reset]);

  const { pullDistance, isRefreshing, handlers: pullHandlers } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  // 클라이언트 측 검색 필터
  const filteredMolds = useMemo(() => {
    if (!searchTerm) return molds;
    const term = searchTerm.toLowerCase();
    return molds.filter(mold =>
      mold.mold_number?.toLowerCase().includes(term) ||
      mold.part_name?.toLowerCase().includes(term) ||
      mold.car_model?.toLowerCase().includes(term)
    );
  }, [molds, searchTerm]);

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      repair: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: '가동중',
      inactive: '비가동',
      maintenance: '정비중',
      repair: '수리중'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.inactive}`}>
        {labels[status] || status}
      </span>
    );
  };

  const isFirstLoad = loading && molds.length === 0;

  return (
    <div className="min-h-screen bg-gray-50" style={{ touchAction: 'pan-y' }}>
      {/* Pull-to-refresh 인디케이터 */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            size={20}
            className={`text-blue-600 transition-transform ${pullDistance >= 80 ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      {/* 새로고침 중 표시 */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm py-2">
          <RefreshCw size={16} className="text-blue-600 animate-spin mr-2" />
          <span className="text-sm text-blue-600">새로고침 중...</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">금형 목록</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilter(!showFilter)} className="p-2">
              <Filter className={`w-5 h-5 ${showFilter ? 'text-blue-500' : ''}`} />
            </button>
            <button onClick={handleRefresh} className="p-2">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="금형번호, 부품명, 차종 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter */}
        {showFilter && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: '전체' },
              { key: 'active', label: '가동중' },
              { key: 'inactive', label: '비가동' },
              { key: 'maintenance', label: '정비중' },
              { key: 'repair', label: '수리중' }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  statusFilter === opt.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mold List (Pull-to-refresh 핸들러 적용) */}
      <div className="p-4 space-y-3 pb-20" {...pullHandlers}>
        {isFirstLoad ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMolds.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>금형이 없습니다</p>
          </div>
        ) : (
          <>
            {filteredMolds.map(mold => (
              <div
                key={mold.id}
                onClick={() => navigate(`/mobile/mold/${mold.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-600">{mold.mold_number}</span>
                      {getStatusBadge(mold.status)}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{mold.part_name || '-'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{mold.car_model || '-'}</span>
                      <span>•</span>
                      <span>{mold.current_shots?.toLocaleString() || 0}타</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}

            {/* 무한 스크롤 sentinel + 로딩 스피너 */}
            <div ref={sentinelRef} className="py-4">
              {loading && molds.length > 0 && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              {!hasMore && molds.length > 0 && (
                <p className="text-center text-xs text-gray-400">모든 금형을 불러왔습니다</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Count */}
      <div className="fixed bottom-4 left-4 right-4">
        <div className="bg-gray-800 text-white text-center py-2 rounded-lg text-sm">
          총 {filteredMolds.length}개 금형
        </div>
      </div>
    </div>
  );
}
