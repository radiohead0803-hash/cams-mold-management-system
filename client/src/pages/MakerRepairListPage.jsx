import { useState } from 'react';
import { useMakerRepairs } from '../hooks/useMakerRepairs';
import { Wrench, Play, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

/**
 * 제작처 수리요청 목록 페이지
 * 수리 담당자용 - 상태 변경 가능
 */
export default function MakerRepairListPage() {
  const [statusFilter, setStatusFilter] = useState('requested');
  const { data, loading, error, refetch, updateStatus } = useMakerRepairs(statusFilter);
  const [updating, setUpdating] = useState(null);

  const handleUpdateStatus = async (id, newStatus) => {
    if (updating) return;
    
    try {
      setUpdating(id);
      await updateStatus(id, newStatus);
      // 성공 메시지 표시 (선택사항)
    } catch (err) {
      alert(err.response?.data?.error?.message || '상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: { label: '요청됨', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
      in_progress: { label: '진행중', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
      completed: { label: '완료', color: 'bg-green-500/20 text-green-600 border-green-500/30' }
    };
    return badges[status] || badges.requested;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-slate-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">수리요청 처리</h1>
                <p className="text-sm text-slate-500">제작처 수리 작업 관리</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
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
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('requested')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === 'requested' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              요청됨
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === 'in_progress' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              진행중
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === 'completed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              완료
            </button>
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
        {!loading && !error && data.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">처리할 수리요청이 없습니다.</p>
          </div>
        )}

        {/* 수리요청 카드 목록 */}
        {!loading && !error && data.length > 0 && (
          <div className="space-y-4">
            {data.map((repair) => {
              const statusBadge = getStatusBadge(repair.status);
              const isUpdating = updating === repair.id;
              
              return (
                <div
                  key={repair.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* 수리요청 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(repair.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {repair.mold?.mold_code || '-'}
                      </h3>
                      
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">불량유형:</span> {repair.issue_type || '-'}
                      </p>
                      
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {repair.issue_description || '-'}
                      </p>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {repair.status === 'requested' && (
                        <button
                          onClick={() => handleUpdateStatus(repair.id, 'in_progress')}
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                        >
                          {isUpdating ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              처리 중...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              수리 시작
                            </>
                          )}
                        </button>
                      )}

                      {repair.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(repair.id, 'completed')}
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                        >
                          {isUpdating ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              처리 중...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              수리 완료
                            </>
                          )}
                        </button>
                      )}

                      {repair.status === 'completed' && (
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          완료됨
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
