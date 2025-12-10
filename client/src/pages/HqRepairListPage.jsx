import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, ChevronRight, AlertTriangle, Clock, CheckCircle2, Filter, RefreshCw, ArrowLeft, Plus } from 'lucide-react';
import { repairRequestAPI } from '../lib/api';

/**
 * HQ 수리요청 목록 페이지
 * 시스템 관리자 및 금형개발 담당자용
 * PC/모바일 동기화: /repair-requests API 사용, repair_requests 테이블
 */
const STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: '금형수정중', label: '수정중' },
  { key: '수리완료', label: '완료' },
  { key: '검토중', label: '검토중' },
  { key: '승인대기', label: '승인대기' },
  { key: '반려', label: '반려' },
];

const statusLabelMap = {
  '금형수정중': '수정중',
  '수리완료': '완료',
  '검토중': '검토중',
  '승인대기': '승인대기',
  '반려': '반려',
};

const priorityLabelMap = {
  '높음': { label: '높음', color: 'bg-red-100 text-red-700' },
  '보통': { label: '보통', color: 'bg-yellow-100 text-yellow-700' },
  '낮음': { label: '낮음', color: 'bg-green-100 text-green-700' },
};

export default function HqRepairListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const status = searchParams.get('status') || 'all';
  const moldId = searchParams.get('moldId');

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { limit: 100 };
      if (status !== 'all') {
        params.status = status;
      }
      if (moldId) {
        params.mold_spec_id = moldId;
      }

      // PC/모바일 동일 API 사용
      const response = await repairRequestAPI.getAll(params);
      
      if (response.data.success) {
        setRepairs(response.data.data || []);
        setTotal(response.data.total || response.data.data?.length || 0);
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
      '금형수정중': { label: '수정중', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      '수리완료': { label: '완료', color: 'bg-green-100 text-green-700 border-green-200' },
      '검토중': { label: '검토중', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      '승인대기': { label: '승인대기', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      '반려': { label: '반려', color: 'bg-red-100 text-red-700 border-red-200' }
    };
    return badges[status] || { label: status || '-', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      '높음': { label: '높음', color: 'bg-red-100 text-red-600' },
      '보통': { label: '보통', color: 'bg-yellow-100 text-yellow-600' },
      '낮음': { label: '낮음', color: 'bg-green-100 text-green-600' }
    };
    return badges[priority] || { label: priority || '보통', color: 'bg-slate-100 text-slate-600' };
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
                    차종/품번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    문제
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    발생일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {repairs.map((repair) => {
                  const statusBadge = getStatusBadge(repair.status);
                  const priorityBadge = getPriorityBadge(repair.priority);
                  
                  return (
                    <tr key={repair.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {repair.car_model || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {repair.part_number || '-'} / {repair.part_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 max-w-xs truncate">{repair.problem || '-'}</div>
                        {repair.problem_type && (
                          <div className="text-xs text-slate-500">{repair.problem_type}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {repair.occurred_date ? new Date(repair.occurred_date).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => navigate(`/repair-request?id=${repair.id}`)}
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
        {!loading && !error && repairs.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">
              총 <span className="font-semibold text-slate-900">{total}</span>건의 수리요청
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
