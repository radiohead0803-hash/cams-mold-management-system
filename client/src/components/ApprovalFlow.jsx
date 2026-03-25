import { useState } from 'react';
import { Search, User, X, Send, CheckCircle } from 'lucide-react';
import api from '../lib/api';

/**
 * 공통 승인 플로우 컴포넌트
 * - 승인자 검색 모달
 * - 선택된 승인자 표시
 * - 승인요청 버튼
 *
 * Props:
 *   selectedApprover: { id, name, email, user_type } | null
 *   onSelectApprover: (user) => void
 *   onRequestApproval: () => void  // 승인요청 실행
 *   disabled?: boolean
 *   saving?: boolean
 *   label?: string  // 기본 '승인요청'
 *   className?: string
 */
export default function ApprovalFlow({
  selectedApprover,
  onSelectApprover,
  onRequestApproval,
  disabled = false,
  saving = false,
  label = '승인요청',
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchApprovers = async (q) => {
    if (!q || q.length < 1) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/users', { params: { search: q, user_type: 'mold_developer,system_admin', limit: 20 } });
      setResults(res.data?.data?.items || res.data?.data || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleOpen = () => {
    setShowModal(true);
    setKeyword('');
    setResults([]);
    // 초기 목록 로드
    searchApprovers('a');
  };

  const handleSelect = (user) => {
    onSelectApprover(user);
    setShowModal(false);
  };

  return (
    <div className={className}>
      {/* 선택된 승인자 표시 */}
      {selectedApprover && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-blue-600" />
            <span className="text-sm text-blue-800">
              승인자: <strong>{selectedApprover.name}</strong> ({selectedApprover.email || selectedApprover.user_type})
            </span>
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
          onClick={onRequestApproval}
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

      {/* 승인자 검색 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">승인자 선택</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => { setKeyword(e.target.value); searchApprovers(e.target.value); }}
                  placeholder="이름 또는 이메일로 검색..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
              {searching && (
                <div className="text-center py-4 text-sm text-gray-400">검색중...</div>
              )}
              {!searching && results.length === 0 && keyword && (
                <div className="text-center py-4 text-sm text-gray-400">결과 없음</div>
              )}
              {results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {user.name}
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                      user.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.user_type === 'system_admin' ? '관리자' : '금형개발'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
