import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Wrench, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

interface RepairRequest {
  id: number;
  title: string;
  description: string;
  status: 'requested' | 'accepted' | 'in_progress' | 'done' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  mold_code?: string;
  mold_name?: string;
}

interface Props {
  showStatusOnly?: boolean;
}

export default function RepairRequestListPage({ showStatusOnly = false }: Props) {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const [data, setData] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchList();
  }, [moldId]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[RepairRequestList] Fetching for mold:', moldId);

      const res = await api.get('/api/v1/repair-requests', {
        params: { moldId },
      });

      console.log('[RepairRequestList] Data:', res.data);
      setData(res.data.data || []);
    } catch (err: any) {
      console.error('[RepairRequestList] Fetch error:', err);
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px]">
            <Clock size={10} />
            요청
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px]">
            <AlertCircle size={10} />
            접수
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px]">
            <Wrench size={10} />
            진행중
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px]">
            <CheckCircle size={10} />
            완료
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full text-[10px]">
            반려
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-500">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-rose-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-slate-600';
      default:
        return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-500">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-[10px] text-slate-500">
                {showStatusOnly ? '금형수리 진행현황' : '수리요청 목록'}
              </div>
              <div className="text-sm font-semibold text-slate-900">
                금형 M-{moldId}
              </div>
            </div>
          </div>
          <Wrench size={18} className="text-slate-600" />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-rose-700">{error}</div>
          </div>
        )}

        {/* 목록 */}
        {data.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Wrench size={32} className="mx-auto text-slate-300 mb-2" />
            <div className="text-xs text-slate-500">
              이 금형의 수리요청이 없습니다.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((request) => (
              <button
                key={request.id}
                onClick={() =>
                  navigate(
                    `/mobile/molds/${moldId}/repair/requests/${request.id}`,
                    { state }
                  )
                }
                className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900 mb-1">
                      {request.title}
                    </div>
                    {request.description && (
                      <div className="text-[10px] text-slate-600 line-clamp-2 mb-2">
                        {request.description}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    <span className={getPriorityColor(request.priority)}>
                      {request.priority === 'high' && '🔴 긴급'}
                      {request.priority === 'medium' && '🟡 보통'}
                      {request.priority === 'low' && '🟢 낮음'}
                    </span>
                  </div>
                  <div className="text-slate-400">→</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        {!showStatusOnly && data.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-[10px] text-blue-900 font-semibold mb-1">
              💡 수리요청 안내
            </div>
            <div className="text-[10px] text-blue-700 space-y-0.5">
              <div>• 점검 중 NG 항목이 발견되면 자동으로 수리요청이 생성됩니다.</div>
              <div>• 수리요청을 클릭하여 상세 내용을 확인할 수 있습니다.</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
