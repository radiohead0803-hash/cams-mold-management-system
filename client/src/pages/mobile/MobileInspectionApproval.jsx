import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw, 
  ClipboardCheck, Calendar, User, ChevronRight, AlertTriangle,
  ThumbsUp, ThumbsDown, Filter, Eye
} from 'lucide-react';
import { inspectionAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';

/**
 * 모바일 점검 승인 페이지
 * PC/모바일 동기화: inspectionAPI 사용
 */
export default function MobileInspectionApproval() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const { user } = useAuthStore();
  
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending_approval');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInspections();
  }, [filter, typeFilter, moldId]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      
      const params = { limit: 100 };
      if (filter !== 'all') params.status = filter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (moldId) params.mold_id = moldId;

      const response = filter === 'pending_approval'
        ? await inspectionAPI.getPending(params)
        : await inspectionAPI.getAll(params);

      if (response.data.success) {
        setInspections(response.data.data || []);
      }
    } catch (error) {
      console.error('Load inspections error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
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

  const getStatusConfig = (status) => {
    const configs = {
      pending_approval: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        label: '승인 대기',
        icon: Clock
      },
      approved: { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        label: '승인 완료',
        icon: CheckCircle
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        label: '반려',
        icon: XCircle
      },
      completed: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        label: '완료',
        icon: CheckCircle
      },
      in_progress: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        label: '진행중',
        icon: Clock
      }
    };
    return configs[status] || configs.pending_approval;
  };

  const statusFilters = [
    { value: 'pending_approval', label: '승인대기' },
    { value: 'approved', label: '승인완료' },
    { value: 'rejected', label: '반려' },
    { value: 'all', label: '전체' }
  ];

  const typeFilters = [
    { value: 'all', label: '전체' },
    { value: 'daily', label: '일상' },
    { value: 'periodic', label: '정기' }
  ];

  const canApprove = ['system_admin', 'mold_developer'].includes(user?.user_type);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold">점검 승인</h1>
                <p className="text-xs text-white/80">일상점검 / 정기점검 승인 관리</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* 상태 필터 */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {statusFilters.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-white text-emerald-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 유형 필터 */}
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            {typeFilters.map(option => (
              <button
                key={option.value}
                onClick={() => setTypeFilter(option.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  typeFilter === option.value
                    ? 'bg-white/30 text-white'
                    : 'bg-transparent text-white/70 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 점검 목록 */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">로딩 중...</p>
            </div>
          </div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500 text-sm">점검 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inspections.map((inspection) => {
              const statusConfig = getStatusConfig(inspection.status);
              const StatusIcon = statusConfig.icon;
              const isDaily = inspection.inspection_type === 'daily';
              
              return (
                <div 
                  key={`${inspection.inspection_type}-${inspection.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="p-4">
                    {/* 상단: 유형 & 상태 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDaily ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {isDaily ? '일상점검' : '정기점검'}
                        </span>
                        {inspection.inspection_type === 'periodic' && inspection.inspection_type_detail && (
                          <span className="text-xs text-gray-500">
                            ({inspection.inspection_type_detail})
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    {/* 금형 정보 */}
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900">
                        {inspection.mold?.mold_code || '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {inspection.mold?.car_model || '-'} / {inspection.mold?.mold_name || '-'}
                      </p>
                    </div>
                    
                    {/* 점검자 & 날짜 */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{inspection.user?.name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {inspection.created_at 
                            ? format(new Date(inspection.created_at), 'yyyy-MM-dd HH:mm')
                            : '-'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 액션 버튼 */}
                    {canApprove && inspection.status === 'pending_approval' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleApprove(inspection)}
                          disabled={processing}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <ThumbsUp size={14} />
                          승인
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInspection(inspection);
                            setShowRejectModal(true);
                          }}
                          disabled={processing}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <ThumbsDown size={14} />
                          반려
                        </button>
                      </div>
                    )}
                    
                    {/* 반려 사유 표시 */}
                    {inspection.status === 'rejected' && inspection.rejection_reason && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600">
                          <span className="font-medium">반려 사유:</span> {inspection.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">점검 반려</h3>
            <p className="text-sm text-gray-600 mb-4">
              반려 사유를 입력해주세요.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="반려 사유를 입력하세요..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedInspection(null);
                }}
                className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {processing ? '처리 중...' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
