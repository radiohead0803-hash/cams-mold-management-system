/**
 * 통합 승인함 페이지
 * 관리자가 모든 승인 요청을 한 곳에서 관리
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Inbox, CheckCircle, XCircle, Clock, Filter, 
  ChevronDown, FileText, Truck, Trash2, Wrench,
  ClipboardList, AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../../lib/api';

const APPROVAL_TYPES = {
  checklist_revision: { label: '체크리스트 개정', icon: ClipboardList, color: 'blue' },
  document_publish: { label: '문서 배포', icon: FileText, color: 'purple' },
  transfer_approval: { label: '금형 이관', icon: Truck, color: 'green' },
  scrapping_approval: { label: '금형 폐기', icon: Trash2, color: 'red' },
  repair_liability: { label: '수리 귀책', icon: Wrench, color: 'orange' },
  inspection_approval: { label: '점검 승인', icon: CheckCircle, color: 'teal' }
};

const STATUS_CONFIG = {
  pending: { label: '대기중', color: 'yellow', icon: Clock },
  approved: { label: '승인됨', color: 'green', icon: CheckCircle },
  rejected: { label: '반려됨', color: 'red', icon: XCircle },
  cancelled: { label: '취소됨', color: 'gray', icon: XCircle }
};

const PRIORITY_CONFIG = {
  low: { label: '낮음', color: 'gray' },
  normal: { label: '보통', color: 'blue' },
  high: { label: '높음', color: 'orange' },
  critical: { label: '긴급', color: 'red' }
};

export default function ApprovalInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [approvals, setApprovals] = useState([]);
  const [counts, setCounts] = useState({ total: 0, byType: {} });
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const typeFilter = searchParams.get('type') || '';
  const statusFilter = searchParams.get('status') || 'pending';

  useEffect(() => {
    fetchApprovals();
    fetchCounts();
  }, [typeFilter, statusFilter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/approvals?${params.toString()}`);
      if (response.data.success) {
        setApprovals(response.data.data.approvals);
      }
    } catch (error) {
      console.error('승인 목록 조회 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await api.get('/approvals/counts');
      if (response.data.success) {
        setCounts(response.data.data);
      }
    } catch (error) {
      console.error('승인 개수 조회 에러:', error);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('승인 처리하시겠습니까?')) return;
    
    try {
      setProcessing(true);
      await api.patch(`/approvals/${id}/approve`, { comment: '승인' });
      fetchApprovals();
      fetchCounts();
      setSelectedApproval(null);
    } catch (error) {
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    
    try {
      setProcessing(true);
      await api.patch(`/approvals/${selectedApproval.id}/reject`, { comment: rejectComment });
      fetchApprovals();
      fetchCounts();
      setSelectedApproval(null);
      setShowRejectModal(false);
      setRejectComment('');
    } catch (error) {
      alert('반려 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-7 h-7 text-blue-600" />
            통합 승인함
          </h1>
          <p className="text-gray-500 mt-1">모든 승인 요청을 한 곳에서 관리합니다</p>
        </div>
        <button
          onClick={() => { fetchApprovals(); fetchCounts(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 유형별 카운트 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <button
          onClick={() => setFilter('type', '')}
          className={`p-4 rounded-xl border-2 transition-all ${
            !typeFilter ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
          <div className="text-sm text-gray-500">전체</div>
        </button>
        
        {Object.entries(APPROVAL_TYPES).map(([type, config]) => {
          const Icon = config.icon;
          const count = counts.byType?.[type] || 0;
          const isActive = typeFilter === type;
          
          return (
            <button
              key={type}
              onClick={() => setFilter('type', type)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isActive ? `border-${config.color}-500 bg-${config.color}-50` : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 text-${config.color}-600`} />
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <div className="text-xs text-gray-500 truncate">{config.label}</div>
            </button>
          );
        })}
      </div>

      {/* 필터 바 */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border">
        <Filter className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFilter('status', status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === status
                  ? `bg-${config.color}-100 text-${config.color}-700`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* 승인 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">승인 대기 항목이 없습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">우선순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {approvals.map((approval) => {
                const typeConfig = APPROVAL_TYPES[approval.approval_type] || {};
                const statusConfig = STATUS_CONFIG[approval.status] || {};
                const priorityConfig = PRIORITY_CONFIG[approval.priority] || {};
                const TypeIcon = typeConfig.icon || FileText;
                
                return (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-600`} />
                        <span className="text-sm">{typeConfig.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{approval.title}</div>
                      {approval.mold_code && (
                        <div className="text-xs text-gray-500">{approval.mold_code}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{approval.requester_name}</div>
                      <div className="text-xs text-gray-500">{approval.requester_company}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(approval.requested_at)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${priorityConfig.color}-100 text-${priorityConfig.color}-700`}>
                        {priorityConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {approval.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(approval.id)}
                            disabled={processing}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => { setSelectedApproval(approval); setShowRejectModal(true); }}
                            disabled={processing}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            반려
                          </button>
                        </div>
                      )}
                      {approval.status !== 'pending' && (
                        <span className="text-sm text-gray-400">처리완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">반려 사유 입력</h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="반려 사유를 입력해주세요..."
              className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectComment(''); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectComment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                반려 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
