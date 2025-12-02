import { useParams, useNavigate } from 'react-router-dom';
import { useRepairRequestDetail } from '../../hooks/useRepairRequests';
import { ArrowLeft } from 'lucide-react';

export default function RepairRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useRepairRequestDetail(id);

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

  if (!data) {
    return (
      <div className="p-6 text-sm text-slate-500">
        데이터를 찾을 수 없습니다.
      </div>
    );
  }

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
            <h1 className="text-xl font-semibold mb-2">{data.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>요청일: {new Date(data.created_at).toLocaleString('ko-KR')}</span>
              <span>•</span>
              <span>ID: {data.id}</span>
            </div>
          </div>
          {getStatusBadge(data.status)}
        </div>
      </div>

      {/* 금형 정보 */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">금형 정보</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {data.mold?.mold_code}
            </span>
            <span className="text-sm text-slate-600">
              {data.mold?.mold_name}
            </span>
          </div>
          {data.checklist && (
            <div className="text-xs text-slate-500">
              점검 ID: {data.checklist.id} ({data.checklist.category === 'daily' ? '일상점검' : '정기점검'})
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
              {data.priority === 'low' ? '낮음' : data.priority === 'normal' ? '보통' : data.priority === 'high' ? '높음' : data.priority}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">요청 유형</div>
            <div className="font-medium">
              {data.request_type === 'ng_repair' ? 'NG 수리' : data.request_type === 'preventive' ? '예방 정비' : data.request_type === 'modification' ? '개조' : data.request_type}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">요청자 역할</div>
            <div className="font-medium">
              {data.requested_role === 'production' ? '생산처' : data.requested_role === 'maker' ? '제작처' : data.requested_role === 'hq' ? '본사' : data.requested_role || '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">최종 수정</div>
            <div className="font-medium text-xs">
              {new Date(data.updated_at).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      </div>

      {/* 요청 내용 */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">요청 내용</div>
        <div className="text-sm text-slate-700 whitespace-pre-wrap">
          {data.description || '-'}
        </div>
      </div>

      {/* NG 항목 */}
      {data.items && data.items.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 mb-3">
            NG 항목 ({data.items.length}건)
          </div>
          <ul className="space-y-2">
            {data.items.map((item) => (
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
