import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, X, Send, CheckCircle, AlertCircle, RotateCcw, Clock } from 'lucide-react';
import api from '../lib/api';

const RECENT_KEY = 'cams_recent_approvers';
const DEBOUNCE_MS = 300;

function getRecentApprovers() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 3);
  } catch {
    return [];
  }
}

function saveRecentApprover(user) {
  try {
    const recent = getRecentApprovers().filter(u => u.id !== user.id);
    recent.unshift({ id: user.id, name: user.name, email: user.email, company_name: user.company_name, phone: user.phone, user_type: user.user_type });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 3)));
  } catch { /* localStorage 실패 무시 */ }
}

/**
 * 공통 승인 플로우 컴포넌트
 * - 승인자 검색 모달 (디바운스 적용)
 * - 최근 선택 승인자 표시
 * - 승인 확인 다이얼로그
 * - 사전 검증(onValidate) 지원
 *
 * Props:
 *   selectedApprover: { id, name, email, user_type, company_name?, phone? } | null
 *   onSelectApprover: (user) => void
 *   onRequestApproval: () => void
 *   currentUserId?: number          — 본인 승인 방지
 *   onValidate?: () => { valid: boolean, message?: string }  — 사전 검증
 *   disabled?: boolean
 *   saving?: boolean
 *   label?: string
 *   className?: string
 */
export default function ApprovalFlow({
  selectedApprover,
  onSelectApprover,
  onRequestApproval,
  currentUserId,
  onValidate,
  disabled = false,
  saving = false,
  label = '승인요청',
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [validateError, setValidateError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // --- 승인자 검색 API ---
  const fetchApprovers = useCallback(async (query = '') => {
    // 이전 요청 취소
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setError(null);

    try {
      const res = await api.get('/workflow/approvers/search', {
        params: { name: query, limit: 30 },
        signal: controller.signal
      });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      // 본인 제외
      const filtered = currentUserId
        ? items.filter(u => u.id !== currentUserId)
        : items;
      setResults(filtered);
      setHasSearched(true);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setError('승인자 목록을 불러오지 못했습니다.');
      setResults([]);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  }, [currentUserId]);

  // --- 디바운스 검색 ---
  const handleSearchChange = (value) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchApprovers(value.trim());
    }, DEBOUNCE_MS);
  };

  // --- 모달 열기: 전체 승인자 로드 ---
  const handleOpen = () => {
    setShowModal(true);
    setKeyword('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    fetchApprovers('');
  };

  // --- 모달 닫기 ---
  const handleClose = () => {
    setShowModal(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  };

  // --- 승인자 선택 ---
  const handleSelect = (user) => {
    saveRecentApprover(user);
    onSelectApprover(user);
    handleClose();
  };

  // --- 승인요청 버튼 클릭 ---
  const handleRequestClick = () => {
    setValidateError(null);
    // 사전 검증
    if (onValidate) {
      const result = onValidate();
      if (!result.valid) {
        setValidateError(result.message || '입력값을 확인해주세요.');
        return;
      }
    }
    setShowConfirm(true);
  };

  // --- 확인 다이얼로그에서 승인 확정 ---
  const handleConfirmApproval = () => {
    setShowConfirm(false);
    onRequestApproval();
  };

  // --- 최근 승인자 (본인 제외, 검색 결과와 중복 제외) ---
  const recentApprovers = getRecentApprovers()
    .filter(u => u.id !== currentUserId)
    .filter(u => !results.some(r => r.id === u.id));

  // --- 이니셜 아바타 ---
  const Avatar = ({ name, size = 'md' }) => {
    const initial = (name || '?')[0];
    const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
    return (
      <div className={`${sizeClass} rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  // --- 승인자 카드 ---
  const ApproverCard = ({ user, isRecent = false }) => (
    <button
      onClick={() => handleSelect(user)}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-3"
    >
      <Avatar name={user.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{user.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${
            user.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {user.user_type === 'system_admin' ? '관리자' : '금형개발'}
          </span>
          {isRecent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">
              최근
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 truncate">
          {user.company_name && <span>{user.company_name}</span>}
          {user.company_name && user.phone && <span className="mx-1">·</span>}
          {user.phone && <span>{user.phone}</span>}
          {!user.company_name && !user.phone && user.email && <span>{user.email}</span>}
        </div>
      </div>
    </button>
  );

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <div className={className}>
      {/* 검증 에러 메시지 */}
      {validateError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{validateError}</span>
          <button onClick={() => setValidateError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 선택된 승인자 표시 */}
      {selectedApprover && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar name={selectedApprover.name} size="sm" />
            <div>
              <span className="text-sm text-blue-800">
                승인자: <strong>{selectedApprover.name}</strong>
              </span>
              <div className="text-xs text-blue-600">
                {selectedApprover.company_name || selectedApprover.email || selectedApprover.user_type}
                {selectedApprover.phone && ` · ${selectedApprover.phone}`}
              </div>
            </div>
          </div>
          <button onClick={() => onSelectApprover(null)} className="text-blue-400 hover:text-blue-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 승인자 선택 + 승인요청 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-medium hover:bg-blue-100 disabled:opacity-50"
        >
          <User size={18} />
          {selectedApprover ? '승인자 변경' : '승인자 선택'}
        </button>
        <button
          type="button"
          onClick={handleRequestClick}
          disabled={disabled || saving || !selectedApprover}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send size={18} />
          )}
          {saving ? '처리중...' : label}
        </button>
      </div>

      {/* 승인 확인 다이얼로그 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">승인 요청 확인</h3>
            <p className="text-sm text-gray-600 mb-6">
              승인자 <strong className="text-gray-900">{selectedApprover?.name}</strong>에게 승인을 요청하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmApproval}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                요청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승인자 검색 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">승인자 선택</h2>
              <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* 검색 입력 */}
            <div className="px-6 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="이름으로 검색하세요..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* 결과 목록 */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {/* 에러 상태 */}
              {error && (
                <div className="text-center py-6">
                  <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                  <button
                    onClick={() => fetchApprovers(keyword.trim())}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                  >
                    <RotateCcw size={14} />
                    다시 시도
                  </button>
                </div>
              )}

              {/* 로딩 상태 */}
              {searching && !error && (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-gray-400">검색중...</p>
                </div>
              )}

              {/* 결과 없음 */}
              {!searching && !error && hasSearched && results.length === 0 && recentApprovers.length === 0 && (
                <div className="text-center py-8">
                  <User size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {keyword ? '검색 결과가 없습니다.' : '승인 가능한 사용자가 없습니다.'}
                  </p>
                </div>
              )}

              {/* 초기 안내 (아직 검색 전이고 에러도 아닐 때) */}
              {!searching && !error && !hasSearched && results.length === 0 && (
                <div className="text-center py-8">
                  <Search size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">이름으로 검색하세요</p>
                </div>
              )}

              {/* 최근 선택 승인자 */}
              {!searching && !error && recentApprovers.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={12} className="text-amber-500" />
                    <span className="text-xs font-medium text-gray-500">최근 선택</span>
                  </div>
                  <div className="space-y-1.5">
                    {recentApprovers.map(user => (
                      <ApproverCard key={`recent-${user.id}`} user={user} isRecent />
                    ))}
                  </div>
                </div>
              )}

              {/* 검색 결과 */}
              {!searching && !error && results.length > 0 && (
                <div>
                  {recentApprovers.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <User size={12} className="text-blue-500" />
                      <span className="text-xs font-medium text-gray-500">
                        {keyword ? '검색 결과' : '전체 승인자'}
                      </span>
                      <span className="text-xs text-gray-400">({results.length}명)</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {results.map(user => (
                      <ApproverCard key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
