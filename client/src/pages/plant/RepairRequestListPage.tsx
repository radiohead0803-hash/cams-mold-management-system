import { useNavigate } from 'react-router-dom';
import { useRepairRequests } from '../../hooks/useRepairRequests';

export default function RepairRequestListPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useRepairRequests({});

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-600">
        수리요청을 불러오는 중입니다...
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

  if (!data.length) {
    return (
      <div className="p-6 space-y-2">
        <div className="text-sm text-slate-500">
          아직 등록된 수리요청이 없습니다.
        </div>
        <div className="text-xs text-slate-400">
          점검 시 NG 발생하면 자동으로 생성됩니다.
        </div>
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

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; className: string }> = {
      low: { label: '낮음', className: 'text-slate-500' },
      normal: { label: '보통', className: 'text-blue-600' },
      high: { label: '높음', className: 'text-red-600' }
    };

    const config = priorityMap[priority] || { label: priority, className: 'text-slate-500' };

    return (
      <span className={`text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">수리요청 목록</h1>
        <div className="text-xs text-slate-500">
          총 {data.length}건
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left w-28 text-xs font-medium text-slate-600">
                요청일
              </th>
              <th className="px-3 py-2 text-left w-32 text-xs font-medium text-slate-600">
                금형코드
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                제목
              </th>
              <th className="px-3 py-2 text-left w-20 text-xs font-medium text-slate-600">
                우선순위
              </th>
              <th className="px-3 py-2 text-left w-24 text-xs font-medium text-slate-600">
                상태
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr
                key={r.id}
                className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/plant/repairs/${r.id}`)}
              >
                <td className="px-3 py-3 text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleDateString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </td>
                <td className="px-3 py-3">
                  <div className="text-xs font-medium text-slate-900">
                    {r.mold?.mold_code || '-'}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[120px]">
                    {r.mold?.mold_name || ''}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-slate-700">
                  {r.title}
                </td>
                <td className="px-3 py-3">
                  {getPriorityBadge(r.priority)}
                </td>
                <td className="px-3 py-3">
                  {getStatusBadge(r.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
