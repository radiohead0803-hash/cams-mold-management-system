/**
 * 모바일 승인함 페이지 (고급 기능)
 * - API 연동: GET /approvals (type, status, page, limit), GET /approvals/counts
 * - 유형별 필터 탭 + 뱃지 카운트
 * - 상태 필터 (대기중/승인됨/반려됨/전체)
 * - Pull-to-refresh 제스처
 * - 일괄 승인/반려 (선택 모드)
 * - 상세 바텀시트
 * - 반려 사유 모달 (필수 입력)
 * - 우선순위 색상 뱃지 + SLA 긴급 표시
 * - 상대 시간 표시
 * - 필터별 빈 상태 메시지
 * - 로딩 스켈레톤
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, CheckCircle, XCircle, Clock, ClipboardCheck,
  Wrench, Truck, Trash2, AlertTriangle, User, Calendar, FileText,
  ChevronDown, X, CheckSquare, Square, Building2, Info, Timer, Shield
} from 'lucide-react';
import api from '../../lib/api';

// ─── 상수 ───────────────────────────────────────────────
const TYPE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'inspection_approval', label: '점검' },
  { key: 'repair_liability', label: '수리' },
  { key: 'transfer_approval', label: '이관' },
  { key: 'scrapping_approval', label: '폐기' },
];

const STATUS_FILTERS = [
  { key: '', label: '전체' },
  { key: 'pending', label: '대기중' },
  { key: 'approved', label: '승인됨' },
  { key: 'rejected', label: '반려됨' },
];

const TYPE_CONFIG = {
  inspection_approval: { icon: ClipboardCheck, color: 'text-blue-500', bg: 'bg-blue-50', label: '점검승인' },
  repair_liability: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50', label: '수리승인' },
  transfer_approval: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50', label: '이관승인' },
  scrapping_approval: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50', label: '폐기승인' },
  checklist_revision: { icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50', label: '체크리스트개정' },
  document_publish: { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50', label: '문서배포' },
};

const PRIORITY_CONFIG = {
  critical: { label: '긴급', color: 'bg-red-500 text-white' },
  high: { label: '높음', color: 'bg-orange-100 text-orange-700' },
  normal: { label: '보통', color: 'bg-blue-100 text-blue-700' },
  low: { label: '낮음', color: 'bg-gray-100 text-gray-500' },
};

const STATUS_CONFIG = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인됨', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려됨', color: 'bg-red-100 text-red-700' },
  cancelled: { label: '취소됨', color: 'bg-gray-100 text-gray-500' },
};

const EMPTY_MESSAGES = {
  all: { pending: '대기 중인 승인 요청이 없습니다.', approved: '승인 완료된 건이 없습니다.', rejected: '반려된 건이 없습니다.', '': '승인 요청이 없습니다.' },
  inspection_approval: { pending: '대기 중인 점검 승인이 없습니다.', approved: '승인된 점검 건이 없습니다.', rejected: '반려된 점검 건이 없습니다.', '': '점검 승인 요청이 없습니다.' },
  repair_liability: { pending: '대기 중인 수리 승인이 없습니다.', approved: '승인된 수리 건이 없습니다.', rejected: '반려된 수리 건이 없습니다.', '': '수리 승인 요청이 없습니다.' },
  transfer_approval: { pending: '대기 중인 이관 승인이 없습니다.', approved: '승인된 이관 건이 없습니다.', rejected: '반려된 이관 건이 없습니다.', '': '이관 승인 요청이 없습니다.' },
  scrapping_approval: { pending: '대기 중인 폐기 승인이 없습니다.', approved: '승인된 폐기 건이 없습니다.', rejected: '반려된 폐기 건이 없습니다.', '': '폐기 승인 요청이 없습니다.' },
};

const PAGE_LIMIT = 20;

// ─── 유틸 함수 ───────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  } catch {
    return '-';
  }
}

function isDueSoon(dueDate) {
  if (!dueDate) return false;
  try {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due - now;
    return diffMs > 0 && diffMs < 86400000; // within 1 day
  } catch {
    return false;
  }
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date();
  } catch {
    return false;
  }
}

function getTypeInfo(type) {
  return TYPE_CONFIG[type] || { icon: ClipboardCheck, color: 'text-gray-500', bg: 'bg-gray-50', label: type || '-' };
}

// ─── 스켈레톤 카드 ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-14 bg-gray-200 rounded" />
            <div className="h-4 w-10 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex gap-4 mt-3">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function MobileApprovalInbox() {
  const navigate = useNavigate();

  // 데이터 상태
  const [approvals, setApprovals] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byType: {} });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // 필터 상태
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');

  // 선택 모드
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 처리 상태
  const [processing, setProcessing] = useState(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // 반려 모달
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null); // single or 'batch'
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // 상세 바텀시트
  const [detailSheet, setDetailSheet] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pull-to-refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 80;

  // ─── API 호출 ───────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get('/approvals/counts');
      if (res.data.success) {
        setCounts(res.data.data);
      }
    } catch (err) {
      console.error('승인 카운트 조회 오류:', err);
    }
  }, []);

  const fetchApprovals = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = { page, limit: PAGE_LIMIT };
      if (activeTab !== 'all') params.type = activeTab;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/approvals', { params });
      if (res.data.success) {
        const { approvals: items, pagination: pag } = res.data.data;
        if (append) {
          setApprovals(prev => [...prev, ...(items || [])]);
        } else {
          setApprovals(items || []);
        }
        setPagination(pag || { total: 0, page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('승인 목록 조회 오류:', err);
      setError('승인 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, statusFilter]);

  const fetchDetail = useCallback(async (id) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/approvals/${id}`);
      if (res.data.success) {
        setDetailSheet(res.data.data);
      }
    } catch (err) {
      console.error('상세 조회 오류:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // 초기 로드 + 필터 변경 시 재조회
  useEffect(() => {
    fetchApprovals(1, false);
    fetchCounts();
  }, [activeTab, statusFilter, fetchApprovals, fetchCounts]);

  // 새로고침 (pull-to-refresh 포함)
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchApprovals(1, false), fetchCounts()]);
    setIsRefreshing(false);
  }, [fetchApprovals, fetchCounts]);

  // 더 보기
  const loadMore = () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    fetchApprovals(pagination.page + 1, true);
  };

  // ─── Pull-to-refresh 핸들러 ─────────────────────────
  const handleTouchStart = (e) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
    isPulling.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current || isRefreshing) return;
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD) {
      refreshAll();
    }
    setPullDistance(0);
  };

  // ─── 승인/반려 처리 ────────────────────────────────
  const handleApprove = async (approval) => {
    try {
      setProcessing(approval.id);
      await api.patch(`/approvals/${approval.id}/approve`, { comment: '' });
      await Promise.all([fetchApprovals(1, false), fetchCounts()]);
      // 바텀시트 열려 있으면 닫기
      if (detailSheet?.id === approval.id) setDetailSheet(null);
    } catch (err) {
      console.error('승인 처리 오류:', err);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (approval) => {
    setRejectTarget(approval);
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('반려 사유를 입력해 주세요.');
      return;
    }
    if (rejectReason.trim().length < 5) {
      setRejectError('반려 사유를 5자 이상 입력해 주세요.');
      return;
    }

    try {
      if (rejectTarget === 'batch') {
        // 일괄 반려
        setBatchProcessing(true);
        const ids = Array.from(selectedIds);
        await Promise.all(
          ids.map(id => api.patch(`/approvals/${id}/reject`, { comment: rejectReason }))
        );
        setSelectedIds(new Set());
        setSelectMode(false);
      } else {
        // 단건 반려
        setProcessing(rejectTarget.id);
        await api.patch(`/approvals/${rejectTarget.id}/reject`, { comment: rejectReason });
        if (detailSheet?.id === rejectTarget.id) setDetailSheet(null);
      }

      setShowRejectModal(false);
      setRejectTarget(null);
      await Promise.all([fetchApprovals(1, false), fetchCounts()]);
    } catch (err) {
      console.error('반려 처리 오류:', err);
      alert('반려 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
      setBatchProcessing(false);
    }
  };

  // ─── 일괄 승인 ──────────────────────────────────────
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}건을 일괄 승인하시겠습니까?`)) return;

    try {
      setBatchProcessing(true);
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map(id => api.patch(`/approvals/${id}/approve`, { comment: '일괄 승인' }))
      );
      setSelectedIds(new Set());
      setSelectMode(false);
      await Promise.all([fetchApprovals(1, false), fetchCounts()]);
    } catch (err) {
      console.error('일괄 승인 오류:', err);
      alert('일괄 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchReject = () => {
    if (selectedIds.size === 0) return;
    setRejectTarget('batch');
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  // ─── 선택 토글 ──────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingItems = approvals.filter(a => a.status === 'pending');
    if (selectedIds.size === pendingItems.length && pendingItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingItems.map(a => a.id)));
    }
  };

  // ─── 탭 변경 시 선택 초기화 ─────────────────────────
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedIds(new Set());
  };

  const handleStatusChange = (key) => {
    setStatusFilter(key);
    setSelectedIds(new Set());
  };

  // ─── 카운트 뱃지 값 ─────────────────────────────────
  const getTabCount = (key) => {
    if (key === 'all') return counts.total || 0;
    return counts.byType?.[key] || 0;
  };

  // ─── 빈 상태 메시지 ─────────────────────────────────
  const getEmptyMessage = () => {
    const typeMessages = EMPTY_MESSAGES[activeTab] || EMPTY_MESSAGES.all;
    return typeMessages[statusFilter] || typeMessages[''];
  };

  // ─── 뱃지 렌더러 ────────────────────────────────────
  const renderPriorityBadge = (priority) => {
    const config = PRIORITY_CONFIG[priority];
    if (!config || priority === 'normal') return null;
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const config = STATUS_CONFIG[status];
    if (!config) return null;
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderSlaBadge = (approval) => {
    if (approval.status !== 'pending') return null;
    if (isOverdue(approval.due_date)) {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white flex items-center gap-0.5">
          <Timer className="w-3 h-3" />
          기한초과
        </span>
      );
    }
    if (isDueSoon(approval.due_date)) {
      return (
        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700 flex items-center gap-0.5 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          긴급
        </span>
      );
    }
    return null;
  };

  // ─── 카드 아이템 렌더 ────────────────────────────────
  const renderApprovalCard = (approval) => {
    const typeInfo = getTypeInfo(approval.approval_type);
    const TypeIcon = typeInfo.icon;
    const isProcessingThis = processing === approval.id;
    const isSelected = selectedIds.has(approval.id);
    const isPending = approval.status === 'pending';

    return (
      <div
        key={approval.id}
        className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isOverdue(approval.due_date) && isPending ? 'border-l-4 border-red-500' : ''}`}
      >
        <div className="p-4">
          {/* Top Row */}
          <div className="flex items-start gap-3">
            {/* 선택 모드 체크박스 */}
            {selectMode && isPending && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(approval.id); }}
                className="mt-1 flex-shrink-0"
              >
                {isSelected
                  ? <CheckSquare className="w-5 h-5 text-blue-500" />
                  : <Square className="w-5 h-5 text-gray-300" />
                }
              </button>
            )}

            {/* 유형 아이콘 */}
            <button
              onClick={() => fetchDetail(approval.id)}
              className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform`}
            >
              <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
            </button>

            {/* 제목/정보 */}
            <button
              onClick={() => fetchDetail(approval.id)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-xs font-medium text-gray-400">{typeInfo.label}</span>
                {renderPriorityBadge(approval.priority)}
                {renderSlaBadge(approval)}
                {statusFilter === '' && renderStatusBadge(approval.status)}
              </div>
              <p className="font-semibold text-gray-900 truncate text-sm">
                {approval.title || approval.description || '-'}
              </p>
            </button>
          </div>

          {/* 요청자/시간 */}
          <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {approval.requester_name || '-'}
            </span>
            {approval.requester_company && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {approval.requester_company}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {relativeTime(approval.requested_at)}
            </span>
          </div>

          {/* 금형 코드 */}
          {approval.mold_code && (
            <div className="mt-2 px-2 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-500">
              금형: {approval.mold_code}
            </div>
          )}

          {/* 액션 버튼 (대기 중일때만) */}
          {isPending && !selectMode && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => openRejectModal(approval)}
                disabled={isProcessingThis}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm active:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                반려
              </button>
              <button
                onClick={() => handleApprove(approval)}
                disabled={isProcessingThis}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {isProcessingThis ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                승인
              </button>
            </div>
          )}

          {/* 처리 완료 정보 */}
          {!isPending && approval.processed_at && (
            <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {approval.approver_name && `${approval.approver_name} · `}
              {relativeTime(approval.processed_at)} 처리
              {approval.comment && (
                <span className="ml-1 text-gray-500 truncate">- {approval.comment}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── 렌더 ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── 헤더 ── */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold">승인함</h1>
            {counts.total > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium min-w-[22px] text-center">
                {counts.total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* 선택 모드 토글 */}
            {statusFilter === 'pending' && approvals.length > 0 && (
              <button
                onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectMode ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                선택 모드
              </button>
            )}
            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="p-2"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── 유형 탭 (뱃지 카운트) ── */}
        <div className="flex px-4 pb-2 gap-2 overflow-x-auto scrollbar-hide">
          {TYPE_TABS.map(tab => {
            const count = getTabCount(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 상태 필터 ── */}
        <div className="flex px-4 pb-3 gap-1.5">
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.key}
              onClick={() => handleStatusChange(sf.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === sf.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* 선택 모드: 전체 선택 바 */}
        {selectMode && (
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-t border-blue-100">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-blue-700 font-medium"
            >
              {selectedIds.size === approvals.filter(a => a.status === 'pending').length && approvals.filter(a => a.status === 'pending').length > 0
                ? <CheckSquare className="w-4 h-4" />
                : <Square className="w-4 h-4" />
              }
              전체 선택
            </button>
            <span className="text-xs text-blue-600">{selectedIds.size}건 선택됨</span>
          </div>
        )}
      </div>

      {/* ── Pull-to-refresh 인디케이터 ── */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center bg-gray-50 overflow-hidden transition-all"
          style={{ height: pullDistance }}
        >
          <div className={`flex items-center gap-2 text-sm ${
            pullDistance >= PULL_THRESHOLD ? 'text-blue-500' : 'text-gray-400'
          }`}>
            <RefreshCw
              className={`w-5 h-5 transition-transform`}
              style={{ transform: `rotate(${pullDistance * 3}deg)` }}
            />
            {pullDistance >= PULL_THRESHOLD ? '놓으면 새로고침' : '당겨서 새로고침'}
          </div>
        </div>
      )}

      {isRefreshing && pullDistance === 0 && (
        <div className="flex items-center justify-center py-2 bg-blue-50">
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-2" />
          <span className="text-xs text-blue-600">새로고침 중...</span>
        </div>
      )}

      {/* ── 콘텐츠 ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 pb-32">
          {loading ? (
            /* 스켈레톤 */
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            /* 에러 */
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-3" />
              <p className="text-red-500 mb-3 text-sm">{error}</p>
              <button
                onClick={() => fetchApprovals(1, false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
              >
                다시 시도
              </button>
            </div>
          ) : approvals.length === 0 ? (
            /* 빈 상태 */
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <CheckCircle className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">{getEmptyMessage()}</p>
            </div>
          ) : (
            /* 카드 목록 */
            <>
              <div className="space-y-3">
                {approvals.map(renderApprovalCard)}
              </div>

              {/* 더 보기 */}
              {pagination.page < pagination.totalPages && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3 bg-white rounded-xl shadow-sm text-sm text-gray-500 font-medium flex items-center justify-center gap-2 active:bg-gray-50"
                >
                  {loadingMore ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  더 보기 ({pagination.page}/{pagination.totalPages})
                </button>
              )}

              {/* 총 건수 */}
              <p className="text-center text-xs text-gray-400 mt-3">
                총 {pagination.total}건
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── 일괄 처리 바 (선택 모드) ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg px-4 py-3 safe-area-pb">
          <div className="flex gap-3">
            <button
              onClick={handleBatchReject}
              disabled={batchProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm active:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              일괄 반려 ({selectedIds.size})
            </button>
            <button
              onClick={handleBatchApprove}
              disabled={batchProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 disabled:opacity-50"
            >
              {batchProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              일괄 승인 ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* ── 상세 바텀시트 ── */}
      {(detailSheet || detailLoading) && (
        <div className="fixed inset-0 z-50">
          {/* 백드롭 */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => { setDetailSheet(null); setDetailLoading(false); }}
          />
          {/* 시트 */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up safe-area-pb">
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {detailLoading && !detailSheet ? (
              <div className="p-8 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : detailSheet ? (
              <div className="px-5 pb-6">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeInfo(detailSheet.approval_type).bg} ${getTypeInfo(detailSheet.approval_type).color}`}>
                        {getTypeInfo(detailSheet.approval_type).label}
                      </span>
                      {renderPriorityBadge(detailSheet.priority)}
                      {renderStatusBadge(detailSheet.status)}
                      {renderSlaBadge(detailSheet)}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">
                      {detailSheet.title || '-'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setDetailSheet(null)}
                    className="p-1 -mr-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* 요청 정보 그리드 */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 w-16">요청자</span>
                    <span className="font-medium text-gray-900">
                      {detailSheet.requester_name || '-'}
                      {detailSheet.requester_company && (
                        <span className="text-gray-400 font-normal ml-1">({detailSheet.requester_company})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 w-16">요청일</span>
                    <span className="font-medium text-gray-900">
                      {detailSheet.requested_at
                        ? new Date(detailSheet.requested_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </span>
                  </div>
                  {detailSheet.due_date && (
                    <div className="flex items-center gap-3">
                      <Timer className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 w-16">마감일</span>
                      <span className={`font-medium ${isOverdue(detailSheet.due_date) ? 'text-red-600' : isDueSoon(detailSheet.due_date) ? 'text-orange-600' : 'text-gray-900'}`}>
                        {new Date(detailSheet.due_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {isOverdue(detailSheet.due_date) && ' (기한 초과)'}
                        {isDueSoon(detailSheet.due_date) && ' (오늘 마감)'}
                      </span>
                    </div>
                  )}
                  {detailSheet.mold_code && (
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 w-16">금형</span>
                      <span className="font-medium text-gray-900">{detailSheet.mold_code}</span>
                    </div>
                  )}
                </div>

                {/* 설명 */}
                {detailSheet.description && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">요청 내용</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                      {detailSheet.description}
                    </p>
                  </div>
                )}

                {/* 메타데이터 */}
                {detailSheet.metadata && Object.keys(detailSheet.metadata).length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">추가 정보</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                      {Object.entries(detailSheet.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500">{key}</span>
                          <span className="text-gray-900 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 처리 결과 (이미 처리된 경우) */}
                {detailSheet.status !== 'pending' && detailSheet.processed_at && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">처리 결과</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">처리자:</span>
                        <span className="font-medium">{detailSheet.approver_name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">처리일:</span>
                        <span className="font-medium">{relativeTime(detailSheet.processed_at)}</span>
                      </div>
                      {detailSheet.comment && (
                        <div className="mt-2 p-3 bg-white rounded-lg text-gray-600">
                          {detailSheet.comment}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 (대기 중일때만) */}
                {detailSheet.status === 'pending' && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { setDetailSheet(null); openRejectModal(detailSheet); }}
                      disabled={processing === detailSheet.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-medium active:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      반려
                    </button>
                    <button
                      onClick={() => handleApprove(detailSheet)}
                      disabled={processing === detailSheet.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium active:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {processing === detailSheet.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      승인
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── 반려 사유 모달 ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => { setShowRejectModal(false); setRejectTarget(null); }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up safe-area-pb">
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  반려 사유 입력
                </h2>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectTarget(null); }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 대상 정보 */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                {rejectTarget === 'batch' ? (
                  <p className="text-sm font-medium text-gray-700">
                    {selectedIds.size}건 일괄 반려
                  </p>
                ) : rejectTarget ? (
                  <>
                    <p className="text-sm font-medium text-gray-700">{rejectTarget.title || '-'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getTypeInfo(rejectTarget.approval_type).label} · {rejectTarget.requester_name || '-'}
                    </p>
                  </>
                ) : null}
              </div>

              {/* 사유 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                  placeholder="반려 사유를 상세히 입력하세요 (최소 5자)..."
                  rows={4}
                  className={`w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
                    rejectError
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-red-500'
                  }`}
                  autoFocus
                />
                {rejectError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {rejectError}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {rejectReason.length}자
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectTarget(null); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processing || batchProcessing}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium active:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {(processing || batchProcessing) ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  반려 확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 글로벌 스타일 (애니메이션) ── */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
