import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepairRequestDetail } from '../../hooks/useRepairRequests';
import { ArrowLeft } from 'lucide-react';
import api from '../../lib/api';

export default function RepairRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useRepairRequestDetail(id);
  const [saving, setSaving] = useState(false);
  const [localData, setLocalData] = useState<any>(null);

  // data가 로드되면 localData에 복사
  if (data && !localData) {
    setLocalData(data);
  }

  const handleChangeStatus = async (nextStatus: string) => {
    if (!id) return;
    if (!confirm(`상태를 '${getStatusLabel(nextStatus)}'(으)로 변경하시겠습니까?`)) return;

    try {
      setSaving(true);
      const res = await api.patch(`/api/v1/repair-requests/${id}/status`, {
        status: nextStatus
      });
      
      // 로컬 상태 업데이트
      setLocalData(res.data.data);
      alert('상태가 변경되었습니다.');
    } catch (err: any) {
      console.error('update status error', err);
      const message = err.response?.data?.message || '상태 변경 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      requested: '요청',
      accepted: '접수',
      in_progress: '진행중',
      done: '완료',
      rejected: '반려'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-600">
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error}
      </div>
    );
  }

  const displayData = localData || data;

  if (!displayData) {
    return (
      <div className="p-6 text-sm text-slate-500">
        데이터를 찾을 수 없습니다.
      </div>
    );
  }

  // 현재 상태에 따라 표시할 버튼 결정
  const currentStatus = displayData.status;
  const canAccept = currentStatus === 'requested';
  const canStart = currentStatus === 'accepted';
  const canComplete = currentStatus === 'in_progress';
  const canReject = ['requested', 'accepted', 'in_progress'].includes(currentStatus);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      requested: { label: '요청', className: 'bg-blue-100 text-blue-700' },
      accepted: { label: '접수', className: 'bg-green-100 text-green-700' },
      in_progress: { label: '진행중', className: 'bg-yellow-100 text-yellow-700' },
      done: { label: '완료', className: 'bg-slate-100 text-slate-700' },
      rejected: { label: '거부', className: 'bg-red-100 text-red-700' }
    };

    const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-700' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/plant/repairs')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold mb-2">{displayData.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>요청일: {new Date(displayData.created_at).toLocaleString('ko-KR')}</span>
              <span>•</span>
              <span>ID: {displayData.id}</span>
            </div>
          </div>
          {getStatusBadge(displayData.status)}
        </div>
      </div>

      {/* 상태 변경 버튼 */}
      {(canAccept || canStart || canComplete || canReject) && (
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-3">작업 관리</div>
          <div className="flex gap-2 flex-wrap">
            {canAccept && (
              <button
                disabled={saving}
                onClick={() => handleChangeStatus('accepted')}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ 접수하기
              </button>
            )}
            {canStart && (
              <button
                disabled={saving}
                onClick={() => handleChangeStatus('in_progress')}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶ 작업 시작
              </button>
            )}
            {canComplete && (
              <button
                disabled={saving}
                onClick={() => handleChangeStatus('done')}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ 완료 처리
              </button>
            )}
            {canReject && (
              <button
                disabled={saving}
                onClick={() => handleChangeStatus('rejected')}
                className="px-4 py-2 rounded-lg border border-red-500 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕ 반려
              </button>
            )}
          </div>
        </div>
      )}

      {/* 금형 정보 */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">금형 정보</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {displayData.mold?.mold_code}
            </span>
            <span className="text-sm text-slate-600">
              {displayData.mold?.mold_name}
            </span>
          </div>
          {displayData.checklist && (
            <div className="text-xs text-slate-500">
              점검 ID: {displayData.checklist.id} ({displayData.checklist.category === 'daily' ? '일상점검' : '정기점검'})
            </div>
          )}
        </div>
      </div>

      {/* 요청 정보 */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">요청 정보</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">우선순위</div>
            <div className="font-medium">
              {displayData.priority === 'low' ? '낮음' : displayData.priority === 'normal' ? '보통' : displayData.priority === 'high' ? '높음' : displayData.priority}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">요청 유형</div>
            <div className="font-medium">
              {displayData.request_type === 'ng_repair' ? 'NG 수리' : displayData.request_type === 'preventive' ? '예방 정비' : displayData.request_type === 'modification' ? '개조' : displayData.request_type}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">요청자 역할</div>
            <div className="font-medium">
              {displayData.requested_role === 'production' ? '생산처' : displayData.requested_role === 'maker' ? '제작처' : displayData.requested_role === 'hq' ? '본사' : displayData.requested_role || '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">최종 수정</div>
            <div className="font-medium text-xs">
              {new Date(displayData.updated_at).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      </div>

      {/* 요청 내용 */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">요청 내용</div>
        <div className="text-sm text-slate-700 whitespace-pre-wrap">
          {displayData.description || '-'}
        </div>
      </div>

      {/* NG 항목 */}
      {displayData.items && displayData.items.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-3">
            NG 항목 ({displayData.items.length}건)
          </div>
          <ul className="space-y-2">
            {displayData.items.map((item: any) => (
              <li key={item.id} className="flex items-start gap-3 p-2 bg-red-50 rounded border border-red-100">
                <div className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    {item.item_label}
                  </div>
                  {item.item_section && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      섹션: {item.item_section}
                    </div>
                  )}
                  {item.value_bool !== null && (
                    <div className="text-xs text-slate-600 mt-1">
                      답변: {item.value_bool ? '정상' : '비정상'}
                    </div>
                  )}
                  {item.value_text && (
                    <div className="text-xs text-slate-600 mt-1">
                      답변: {item.value_text}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
