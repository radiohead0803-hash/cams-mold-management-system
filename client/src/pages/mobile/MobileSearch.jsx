/**
 * 모바일 검색 페이지
 * 금형 검색, 필터링, 최근 검색 기록
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, X, Filter, Clock, Box, ChevronRight, 
  AlertTriangle, CheckCircle, Wrench, Loader2
} from 'lucide-react';
import api from '../../lib/api';
import { MobileHeader } from '../../components/mobile/MobileLayout';
import { SkeletonListItem } from '../../components/mobile/Skeleton';

// 최근 검색 저장 키
const RECENT_SEARCHES_KEY = 'cams_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export default function MobileSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: ''
  });

  // 최근 검색 로드
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 검색 실행 (디바운스)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: 20
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/api/mold-specifications/search?${params}`);
      setResults(response.data?.data?.items || response.data?.data || []);
      
      // 최근 검색에 추가
      saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('[Search] 검색 실패:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [
      trimmed,
      ...recentSearches.filter(s => s !== trimmed)
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleRecentSearch = (search) => {
    setQuery(search);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleMoldClick = (mold) => {
    navigate(`/mobile/mold/${mold.id}`, { state: { mold } });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      normal: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: '정상' },
      ng: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'NG' },
      repair: { color: 'bg-orange-100 text-orange-700', icon: Wrench, label: '수리중' },
      inactive: { color: 'bg-gray-100 text-gray-700', icon: Box, label: '비활성' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 검색 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-2 p-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="금형 코드, 품번, 품명 검색..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="px-4 pb-3 border-t bg-gray-50">
            <div className="flex gap-2 pt-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm"
              >
                <option value="">상태 전체</option>
                <option value="normal">정상</option>
                <option value="ng">NG</option>
                <option value="repair">수리중</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm"
              >
                <option value="">유형 전체</option>
                <option value="injection">사출</option>
                <option value="press">프레스</option>
                <option value="die_casting">다이캐스팅</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* 로딩 상태 */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <SkeletonListItem key={i} className="bg-white rounded-xl" />
            ))}
          </div>
        )}

        {/* 검색 결과 */}
        {!loading && query && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-3">
              검색 결과 <span className="font-medium text-gray-900">{results.length}</span>건
            </p>
            {results.map((mold) => (
              <button
                key={mold.id}
                onClick={() => handleMoldClick(mold)}
                className="w-full bg-white rounded-xl p-4 shadow-sm text-left flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      {mold.mold_code || mold.part_number}
                    </span>
                    {getStatusBadge(mold.status)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {mold.part_name || mold.mold_name || '-'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">다른 검색어를 입력해보세요</p>
          </div>
        )}

        {/* 최근 검색 (검색어 없을 때) */}
        {!query && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">최근 검색</h3>
              <button
                onClick={clearRecentSearches}
                className="text-sm text-gray-500"
              >
                전체 삭제
              </button>
            </div>
            <div className="space-y-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearch(search)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-lg text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 안내 (검색어 없고 최근 검색도 없을 때) */}
        {!query && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">금형을 검색해보세요</p>
            <p className="text-sm text-gray-400 mt-1">
              금형 코드, 품번, 품명으로 검색할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
