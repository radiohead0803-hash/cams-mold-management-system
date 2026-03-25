/**
 * 모바일 승인함 페이지
 * 점검, 수리, 이관, 폐기 등 각종 승인 요청 관리
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, CheckCircle, XCircle, Clock, ClipboardCheck,
  Wrench, Truck, Trash2, Filter, AlertTriangle, ChevronRight, User, Calendar
} from 'lucide-react';
import api from '../../lib/api';

const APPROVAL_TABS = [
  { key: 'all', label: '전체' },
  { key: 'inspection', label: '점검승인' },
  { key: 'repair', label: '수리승인' },
  { key: 'transfer', label: '이관승인' },
  { key: 'scrap', label: '폐기승인' },
];

const TYPE_CONFIG = {
  inspection: { icon: ClipboardCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
  repair: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
  transfer: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
  scrap: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
};

export default function MobileApprovalInbox() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/approvals');
      if (response.data.success) {
        setApprovals(response.data.data || []);
      }
    } catch (err) {
      console.error('승인 목록 조회 오류:', err);
      setError('승인 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval) => {
    if (!confirm('승인하시겠습니까?')) return;
    try {
      setProcessing(approval.id);
      await api.put(`/approvals/${approval.id}/approve`, {
        type: approval.type,
        comments: '',
      });
      alert('승인되었습니다.');
      fetchApprovals();
    } catch (err) {
      console.error('승인 처리 오류:', err);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (approval) => {
    setRejectTarget(approval);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력하세요.');
      return;
    }
    try {
      setProcessing(rejectTarget.id);
      await api.put(`/approvals/${rejectTarget.id}/reject`, {
        type: rejectTarget.type,
        reason: rejectReason,
      });
      alert('반려되었습니다.');
      setShowRejectModal(false);
      setRejectTarget(null);
      fetchApprovals();
    } catch (err) {
      console.error('반려 처리 오류:', err);
      alert('반려 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const getTypeInfo = (type) => {
    return TYPE_CONFIG[type] || { icon: ClipboardCheck, color: 'text-gray-500', bg: 'bg-gray-50' };
  };

  const getTypeName = (type) => {
    const map = {
      inspection: '점검승인',
      repair: '수리승인',
      transfer: '이관승인',
      scrap: '폐기승인',
    };
    return map[type] || type || '-';
  };

  const getUrgencyBadge = (urgency) => {
    if (!urgency || urgency === 'normal') return null;
    const map = {
      high: { label: '긴급', color: 'bg-red-100 text-red-700' },
      medium: { label: '보통', color: 'bg-yellow-100 text-yellow-700' },
      urgent: { label: '매우긴급', color: 'bg-red-500 text-white' },
    };
    const info = map[urgency] || null;
    if (!info) return null;
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return '방금 전';
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  const filteredApprovals = approvals.filter(a => {
    if (activeTab === 'all') return true;
    return a.type === activeTab;
  });

  const tabCounts = {
    all: approvals.length,
    inspection: approvals.filter(a => a.type === 'inspection').length,
    repair: approvals.filter(a => a.type === 'repair').length,
    transfer: approvals.filter(a => a.type === 'transfer').length,
    scrap: approvals.filter(a => a.type === 'scrap').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">승인함</h1>
            {approvals.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {approvals.length}
              </span>
            )}
          </div>
          <button onClick={fetchApprovals} className="p-2">
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs with Badge Counts */}
        <div className="flex px-4 pb-2 gap-2 overflow-x-auto">
          {APPROVAL_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  activeTab === tab.key ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchApprovals}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeTab === 'all' ? '대기 중인 승인 건이 없습니다.' : `대기 중인 ${getTypeName(activeTab)} 건이 없습니다.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApprovals.map((approval) => {
              const typeInfo = getTypeInfo(approval.type);
              const TypeIcon = typeInfo.icon;
              const isProcessingThis = processing === approval.id;

              return (
                <div
                  key={approval.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="p-4">
                    {/* Top Row: Type Icon + Title + Urgency */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-gray-400">{getTypeName(approval.type)}</span>
                          {getUrgencyBadge(approval.urgency)}
                        </div>
                        <p className="font-semibold text-gray-900 truncate">
                          {approval.title || approval.description || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {approval.requester_name || approval.requester || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(approval.created_at || approval.request_date)}
                      </span>
                    </div>

                    {/* Mold Info if available */}
                    {(approval.mold_number || approval.mold_name) && (
                      <div className="mt-2 px-2 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-500">
                        금형: {approval.mold_number} {approval.mold_name ? `(${approval.mold_name})` : ''}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => openRejectModal(approval)}
                        disabled={isProcessingThis}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium active:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        반려
                      </button>
                      <button
                        onClick={() => handleApprove(approval)}
                        disabled={isProcessingThis}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-medium active:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        승인
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">반려 사유 입력</h2>
              <button
                onClick={() => { setShowRejectModal(false); setRejectTarget(null); }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700">{rejectTarget.title || rejectTarget.description || '-'}</p>
              <p className="text-xs text-gray-400 mt-1">
                {getTypeName(rejectTarget.type)} | {rejectTarget.requester_name || rejectTarget.requester || '-'}
              </p>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요..."
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectTarget(null); }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium active:bg-red-600 disabled:opacity-50"
              >
                반려 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
