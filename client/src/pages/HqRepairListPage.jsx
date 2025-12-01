import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, ChevronRight, AlertTriangle, Clock, CheckCircle2, Filter, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../lib/api';

/**
 * HQ 수리요청 목록 페이지
 * 시스템 관리자 및 금형개발 담당자용
 */
const STATUS_FILTERS = [
  { key: 'open', label: '진행 중' },
  { key: 'completed', label: '완료' },
  { key: 'rejected', label: '반려' },
  { key: 'all', label: '전체' },
];

const statusLabelMap = {
  requested: '요청',
  liability_review: '귀책협의',
  approved: '승인',
  in_repair: '수리중',
  completed: '완료',
  rejected: '반려',
};

const severityLabelMap = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
  urgent: 'URGENT',
};

export default function HqRepairListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const status = searchParams.get('status') || 'open';

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/hq/repairs?status=${status}`);
      
      if (response.data.success) {
        setRepairs(response.data.data.items || []);
      } else {
        throw new Error(response.data.error?.message || '수리요청 목록 조회 실패');
      }
    } catch (err) {
      console.error('load repairs error', err);
      setError(err.response?.data?.error?.message || '수리요청 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleChangeStatus = (key) => {
    setSearchParams({ status: key });
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: { label: '요청됨', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      in_progress: { label: '진행중', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      completed: { label: '완료', color: 'bg-green-100 text-green-700 border-green-200' },
      confirmed: { label: '확정', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      cancelled: { label: '취소', color: 'bg-red-100 text-red-700 border-red-200' }
    };
    return badges[status] || badges.requested;
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      low: { label: '낮음', color: 'bg-slate-100 text-slate-600' },
      medium: { label: '보통', color: 'bg-blue-100 text-blue-600' },
      high: { label: '높음', color: 'bg-orange-100 text-orange-600' },
      urgent: { label: '긴급', color: 'bg-rose-100 text-rose-600' }
    };
    return badges[urgency] || badges.medium;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg hover:bg-slate-100 transition"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <Wrench className="w-6 h-6 text-slate-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">수리요청 관리</h1>
                <p className="text-sm text-slate-500">전체 수리요청 모니터링</p>
              </div>
            </div>
            <button
              onClick={() => loadRepairs()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              새로고침
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        {/* 필터 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">필터:</span>
            </div>
            <div className="flex gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleChangeStatus(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    status === f.key 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500">로딩 중...</p>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">오류 발생</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && !error && repairs.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">해당 조건의 수리요청이 없습니다.</p>
          </div>
        )}

        {/* 수리요청 목록 */}
        {!loading && !error && repairs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    금형코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    불량유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    긴급도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {repairs.map((repair) => {
                  const statusBadge = getStatusBadge(repair.status);
                  const urgencyBadge = getUrgencyBadge(repair.severity);
                  
                  return (
                    <tr key={repair.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {repair.mold?.mold_code || '-'}
                        </div>
                        {repair.mold?.mold_name && (
                          <div className="text-xs text-slate-500">
                            {repair.mold.mold_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{repair.issue_type || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyBadge.color}`}>
                          {urgencyBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(repair.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => navigate(`/hq/repair-requests/${repair.id}`)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          상세보기
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 요약 */}
        {!loading && !error && data.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">
              총 <span className="font-semibold text-slate-900">{data.length}</span>건의 수리요청
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
