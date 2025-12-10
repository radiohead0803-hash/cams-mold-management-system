import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, Filter, RefreshCw, 
  ClipboardCheck, Calendar, User, ChevronRight, AlertTriangle,
  Eye, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { inspectionAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';

/**
 * 점검 승인 페이지
 * 일상점검/정기점검 승인 및 반려 관리
 * PC/모바일 동기화: inspectionAPI 사용
 */
const STATUS_FILTERS = [
  { key: 'pending_approval', label: '승인 대기' },
  { key: 'approved', label: '승인 완료' },
  { key: 'rejected', label: '반려' },
  { key: 'all', label: '전체' },
];

const TYPE_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'daily', label: '일상점검' },
  { key: 'periodic', label: '정기점검' },
];

export default function InspectionApproval() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const status = searchParams.get('status') || 'pending_approval';
  const type = searchParams.get('type') || 'all';

  useEffect(() => {
    loadInspections();
  }, [status, type]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { limit: 100 };
      if (status !== 'all') params.status = status;
      if (type !== 'all') params.type = type;

      const response = status === 'pending_approval' 
        ? await inspectionAPI.getPending(params)
        : await inspectionAPI.getAll(params);

      if (response.data.success) {
        setInspections(response.data.data || []);
      }
    } catch (err) {
      console.error('Load inspections error:', err);
      setError('점검 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (inspection) => {
    if (!confirm('이 점검을 승인하시겠습니까?')) return;
    
    try {
      setProcessing(true);
      await inspectionAPI.approve(inspection.id, {
        type: inspection.inspection_type,
        comments: ''
      });
      alert('승인되었습니다.');
      loadInspections();
    } catch (err) {
      console.error('Approve error:', err);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    
    try {
      setProcessing(true);
      await inspectionAPI.reject(selectedInspection.id, {
        type: selectedInspection.inspection_type,
        reason: rejectReason
      });
      alert('반려되었습니다.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedInspection(null);
      loadInspections();
    } catch (err) {
      console.error('Reject error:', err);
      alert('반려 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_approval: { label: '승인 대기', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      approved: { label: '승인 완료', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      rejected: { label: '반려', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      completed: { label: '완료', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
      in_progress: { label: '진행중', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock }
    };
    return badges[status] || badges.pending_approval;
  };

  const getTypeBadge = (type) => {
    return type === 'daily' 
      ? { label: '일상점검', color: 'bg-blue-50 text-blue-600' }
      : { label: '정기점검', color: 'bg-purple-50 text-purple-600' };
  };

  const canApprove = ['system_admin', 'mold_developer'].includes(user?.user_type);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">점검 승인</h1>
                <p className="text-sm text-slate-500">일상점검 및 정기점검 승인 관리</p>
              </div>
            </div>
            <button
              onClick={loadInspections}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* 필터 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 상태 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">상태:</span>
              <div className="flex gap-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setSearchParams({ status: f.key, type })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      status === f.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 유형 필터 */}
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-medium text-slate-700">유형:</span>
              <div className="flex gap-2">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setSearchParams({ status, type: f.key })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      type === f.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-500">로딩 중...</p>
            </div>
          </div>
        )}

        {/* 에러 */}
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
        {!loading && !error && inspections.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">해당 조건의 점검 내역이 없습니다.</p>
          </div>
        )}

        {/* 점검 목록 */}
        {!loading && !error && inspections.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">금형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">점검자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">점검일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspections.map((inspection) => {
                  const statusBadge = getStatusBadge(inspection.status);
                  const typeBadge = getTypeBadge(inspection.inspection_type);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr key={`${inspection.inspection_type}-${inspection.id}`} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {inspection.mold?.mold_code || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {inspection.mold?.car_model || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {inspection.user?.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {inspection.created_at 
                              ? format(new Date(inspection.created_at), 'yyyy-MM-dd HH:mm')
                              : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/inspection/${inspection.id}?type=${inspection.inspection_type}`)}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="상세보기"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {canApprove && inspection.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApprove(inspection)}
                                disabled={processing}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                                title="승인"
                              >
                                <ThumbsUp size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInspection(inspection);
                                  setShowRejectModal(true);
                                }}
                                disabled={processing}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="반려"
                              >
                                <ThumbsDown size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 */}
        {!loading && !error && inspections.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-600">
              총 <span className="font-semibold text-slate-900">{inspections.length}</span>건의 점검
            </p>
          </div>
        )}
      </main>

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">점검 반려</h3>
            <p className="text-sm text-slate-600 mb-4">
              반려 사유를 입력해주세요.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="반려 사유를 입력하세요..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedInspection(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {processing ? '처리 중...' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
