/**
 * 전역 검색 컴포넌트
 * 헤더에 통합되는 검색 기능
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Building2, Wrench, User, Loader2 } from 'lucide-react';
import api from '../lib/api';

const TYPE_CONFIG = {
  mold: { icon: Package, label: '금형', color: 'blue' },
  company: { icon: Building2, label: '업체', color: 'green' },
  repair: { icon: Wrench, label: '수리', color: 'orange' },
  user: { icon: User, label: '사용자', color: 'purple' }
};

export default function GlobalSearch({ className = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // 검색 실행
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (response.data.success) {
        setResults(response.data.data.results || []);
      }
    } catch (error) {
      console.error('검색 에러:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  // 결과 선택
  const handleSelect = (result) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    navigate(result.link);
  };

  // 검색창 열기
  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 검색창 닫기
  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 검색 버튼 (닫힌 상태) */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="hidden md:inline text-sm">검색</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 rounded border">
            /
          </kbd>
        </button>
      )}

      {/* 검색창 (열린 상태) */}
      {isOpen && (
        <div className="absolute right-0 top-0 w-80 md:w-96 bg-white rounded-xl shadow-2xl border z-50">
          {/* 검색 입력 */}
          <div className="flex items-center gap-2 p-3 border-b">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="금형코드, 차종, 업체명 검색..."
              className="flex-1 outline-none text-sm"
              autoComplete="off"
            />
            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* 검색 결과 */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                2글자 이상 입력해주세요
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.mold;
                  const Icon = config.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-${config.color}-100 flex-shrink-0`}>
                        <Icon className={`w-4 h-4 text-${config.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {result.title}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded bg-${config.color}-100 text-${config.color}-700`}>
                            {config.label}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{result.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 검색 팁 */}
          <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center justify-between">
            <span>↑↓ 이동 · Enter 선택 · Esc 닫기</span>
          </div>
        </div>
      )}
    </div>
  );
}
