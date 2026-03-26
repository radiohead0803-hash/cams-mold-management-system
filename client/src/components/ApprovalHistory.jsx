/**
 * 승인 이력 타임라인 컴포넌트
 * - 승인 감사 추적(audit trail)을 수직 타임라인으로 표시
 * - compact 모드: 모바일용 수평 스크롤 간소화 뷰
 */
import { useState, useEffect, useMemo } from 'react';
import { Send, CheckCircle, XCircle, Save, Clock, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

// 액션별 설정
const ACTION_CONFIG = {
  submit: { icon: Send, color: 'blue', label: '승인 요청', dotClass: 'bg-blue-500' },
  submitted: { icon: Send, color: 'blue', label: '승인 요청', dotClass: 'bg-blue-500' },
  pending: { icon: Clock, color: 'blue', label: '대기중', dotClass: 'bg-blue-500' },
  approve: { icon: CheckCircle, color: 'green', label: '승인', dotClass: 'bg-green-500' },
  approved: { icon: CheckCircle, color: 'green', label: '승인', dotClass: 'bg-green-500' },
  approve_1: { icon: CheckCircle, color: 'green', label: '1차 승인', dotClass: 'bg-green-500' },
  approve_2: { icon: CheckCircle, color: 'green', label: '2차 승인', dotClass: 'bg-green-500' },
  approve_final: { icon: CheckCircle, color: 'green', label: '최종 승인', dotClass: 'bg-green-500' },
  reject: { icon: XCircle, color: 'red', label: '반려', dotClass: 'bg-red-500' },
  rejected: { icon: XCircle, color: 'red', label: '반려', dotClass: 'bg-red-500' },
  draft: { icon: Save, color: 'gray', label: '임시저장', dotClass: 'bg-gray-400' },
  created: { icon: Save, color: 'gray', label: '생성', dotClass: 'bg-gray-400' },
};

const DEFAULT_CONFIG = { icon: Clock, color: 'gray', label: '알 수 없음', dotClass: 'bg-gray-400' };

// 색상별 텍스트/배경 매핑
const COLOR_CLASSES = {
  green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  red: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  gray: { text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
};

// 역할 한글 매핑
const ROLE_LABELS = {
  system_admin: '시스템관리자',
  mold_developer: '금형개발자',
  manager: '관리자',
  operator: '작업자',
  viewer: '조회자',
  admin: '관리자',
};

/**
 * 상대 시간 표시 (한국어)
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  // 30일 이상이면 날짜 표시
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * 이력 항목에서 액션 타입 추론
 */
function resolveAction(entry) {
  const action = entry.action || entry.status || entry.event_type || entry.type || '';
  return action.toLowerCase().replace(/\s+/g, '_');
}

/**
 * API에서 승인 이력 데이터 가져오기
 * 여러 API 패턴을 시도하여 호환성 확보
 */
async function fetchApprovalHistory(targetId, targetType) {
  // 1차: 범용 approvals API
  try {
    const res = await api.get('/approvals', {
      params: { target_id: targetId, target_type: targetType },
    });
    const data = res.data?.data?.items || res.data?.data || res.data?.items || [];
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // 무시 — 다음 패턴 시도
  }

  // 2차: repair 전용 워크플로우 히스토리
  if (targetType === 'repair') {
    try {
      const res = await api.get(`/repair-step-workflow/${targetId}/history`);
      const data = res.data?.data || res.data?.history || [];
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // 무시
    }
  }

  // 3차: 타입별 단건 조회 후 상태 필드에서 이력 구성
  const typeEndpoints = {
    repair: `/repairs/${targetId}`,
    transfer: `/transfers/${targetId}`,
    scrapping: `/scrappings/${targetId}`,
    inspection: `/inspections/${targetId}`,
  };

  const endpoint = typeEndpoints[targetType];
  if (endpoint) {
    try {
      const res = await api.get(endpoint);
      const record = res.data?.data || res.data;
      if (record) return buildHistoryFromRecord(record, targetType);
    } catch {
      // 무시
    }
  }

  return [];
}

/**
 * 레코드의 상태 필드로부터 이력 배열 구성 (fallback)
 */
function buildHistoryFromRecord(record, targetType) {
  const history = [];

  // 생성일
  if (record.created_at) {
    history.push({
      action: 'created',
      actor_name: record.requester_name || record.created_by_name || record.inspector_name || '-',
      actor_role: record.requester_role || '',
      created_at: record.created_at,
      comment: null,
    });
  }

  // 요청/제출일
  if (record.requested_at || record.submitted_at) {
    history.push({
      action: 'submit',
      actor_name: record.requester_name || record.submitted_by_name || '-',
      actor_role: record.requester_role || '',
      created_at: record.requested_at || record.submitted_at,
      comment: record.request_reason || record.reason || null,
    });
  }

  // 1차 승인
  if (record.approved_at || record.first_approved_at) {
    history.push({
      action: record.second_approved_at ? 'approve_1' : 'approved',
      actor_name: record.approver_name || record.first_approver_name || '-',
      actor_role: record.approver_role || '',
      created_at: record.approved_at || record.first_approved_at,
      comment: record.approval_comment || null,
    });
  }

  // 2차 승인
  if (record.second_approved_at) {
    history.push({
      action: 'approve_2',
      actor_name: record.second_approver_name || '-',
      actor_role: '',
      created_at: record.second_approved_at,
      comment: record.second_approval_comment || null,
    });
  }

  // 최종 승인
  if (record.final_approved_at) {
    history.push({
      action: 'approve_final',
      actor_name: record.final_approver_name || '-',
      actor_role: '',
      created_at: record.final_approved_at,
      comment: null,
    });
  }

  // 반려
  if (record.rejected_at) {
    history.push({
      action: 'rejected',
      actor_name: record.rejector_name || record.approver_name || '-',
      actor_role: '',
      created_at: record.rejected_at,
      comment: record.reject_reason || record.rejection_reason || null,
    });
  }

  // 현재 pending 상태 표시
  if (
    !record.approved_at &&
    !record.rejected_at &&
    (record.status === 'pending' || record.status === 'submitted' || record.status === 'requested')
  ) {
    history.push({
      action: 'pending',
      actor_name: record.approver_name || '승인자',
      actor_role: '',
      created_at: null,
      comment: '승인 대기중',
    });
  }

  // 시간순 정렬 (null은 마지막)
  history.sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  return history;
}

// ─── 타임라인 항목 (데스크톱) ───
function TimelineEntry({ entry, isLast }) {
  const actionKey = resolveAction(entry);
  const config = ACTION_CONFIG[actionKey] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const colorCls = COLOR_CLASSES[config.color] || COLOR_CLASSES.gray;
  const actorName = entry.actor_name || entry.user_name || entry.name || '-';
  const actorRole = entry.actor_role || entry.user_type || entry.role || '';
  const roleLabel = ROLE_LABELS[actorRole] || actorRole;
  const comment = entry.comment || entry.reason || entry.note || entry.remarks || null;
  const timestamp = entry.created_at || entry.timestamp || entry.date;

  return (
    <div className="relative flex gap-4">
      {/* 수직선 + 도트 */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorCls.bg} ${colorCls.border} border`}>
          <Icon size={14} className={colorCls.text} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 min-h-[24px]" />}
      </div>

      {/* 내용 */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${colorCls.text}`}>{config.label}</span>
          {timestamp && (
            <span className="text-xs text-gray-400" title={new Date(timestamp).toLocaleString('ko-KR')}>
              {formatRelativeTime(timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm text-gray-700">{actorName}</span>
          {roleLabel && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
              {roleLabel}
            </span>
          )}
        </div>
        {comment && (
          <p className="mt-1 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            {comment}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 타임라인 항목 (컴팩트/모바일) ───
function CompactEntry({ entry }) {
  const actionKey = resolveAction(entry);
  const config = ACTION_CONFIG[actionKey] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const colorCls = COLOR_CLASSES[config.color] || COLOR_CLASSES.gray;
  const actorName = entry.actor_name || entry.user_name || entry.name || '-';
  const timestamp = entry.created_at || entry.timestamp || entry.date;

  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px] shrink-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorCls.bg} ${colorCls.border} border`}>
        <Icon size={14} className={colorCls.text} />
      </div>
      <span className={`text-[11px] font-semibold text-center leading-tight ${colorCls.text}`}>
        {config.label}
      </span>
      <span className="text-[10px] text-gray-500 text-center leading-tight truncate max-w-[72px]">
        {actorName}
      </span>
      {timestamp && (
        <span className="text-[10px] text-gray-400 text-center">
          {formatRelativeTime(timestamp)}
        </span>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ───
export default function ApprovalHistory({ targetId, targetType, compact = false }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetId || !targetType) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApprovalHistory(targetId, targetType);
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) setError('승인 이력을 불러오는데 실패했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [targetId, targetType]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-4' : 'py-8'}`}>
        <Loader2 size={20} className="animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-400">이력 로딩중...</span>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'py-3 px-3' : 'py-4 px-4'} bg-red-50 rounded-lg border border-red-100`}>
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  // 빈 상태
  if (!entries || entries.length === 0) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-4' : 'py-8'} text-gray-400`}>
        <Clock size={16} className="mr-2" />
        <span className="text-sm">승인 이력이 없습니다</span>
      </div>
    );
  }

  // 컴팩트 모드 (모바일 수평 스크롤)
  if (compact) {
    return (
      <div className="overflow-x-auto scrollbar-hide -mx-1">
        <div className="flex items-start gap-1 px-1 py-2 min-w-min">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex items-start">
              <CompactEntry entry={entry} />
              {idx < entries.length - 1 && (
                <div className="flex items-center h-8 px-0.5">
                  <div className="w-4 h-0.5 bg-gray-200 rounded" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 기본 수직 타임라인
  return (
    <div className="py-2">
      {entries.map((entry, idx) => (
        <TimelineEntry
          key={idx}
          entry={entry}
          isLast={idx === entries.length - 1}
        />
      ))}
    </div>
  );
}
