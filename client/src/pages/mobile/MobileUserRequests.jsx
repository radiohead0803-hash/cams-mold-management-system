/**
 * 모바일 사용자 가입요청 관리 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, User, Building2, Calendar, Shield,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import api from '../../lib/api';

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '반려' },
];

export default function MobileUserRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/user-requests');
      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (err) {
      console.error('가입요청 목록 조회 오류:', err);
      setError('가입요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('이 요청을 승인하시겠습니까?')) return;
    try {
      setProcessing(id);
      await api.put(`/user-requests/${id}/approve`);
      alert('승인되었습니다.');
      fetchRequests();
    } catch (err) {
      console.error('승인 처리 오류:', err);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (!reason) return;
    try {
      setProcessing(id);
      await api.put(`/user-requests/${id}/reject`, { reason });
      alert('반려되었습니다.');
      fetchRequests();
    } catch (err) {
      console.error('반려 처리 오류:', err);
      alert('반려 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      approved: { label: '승인', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: '반려', color: 'bg-red-100 text-red-700', icon: XCircle },
    };
    const info = map[status] || { label: status || '-', color: 'bg-gray-100 text-gray-600', icon: Clock };
    const Icon = info.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${info.color}`}>
        <Icon className="w-3 h-3" />
        {info.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  const getRoleName = (role) => {
    const map = {
      admin: '관리자',
      manager: '매니저',
      inspector: '점검자',
      operator: '작업자',
      viewer: '조회자',
    };
    return map[role] || role || '-';
  };

  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    if (!matchesTab) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      req.name?.toLowerCase().includes(term) ||
      req.company_name?.toLowerCase().includes(term) ||
      req.email?.toLowerCase().includes(term)
    );
  });

  const tabCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
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
            <h1 className="text-lg font-semibold">가입요청 관리</h1>
          </div>
          <button onClick={fetchRequests} className="p-2">
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 회사명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 pb-2 gap-2 overflow-x-auto">
          {STATUS_TABS.map(tab => (
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
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {tabCounts[tab.key]}
              </span>
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
              onClick={fetchRequests}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '가입요청이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isExpanded = expandedId === req.id;
              const isPending = req.status === 'pending';
              const isProcessingThis = processing === req.id;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Card Header - always visible */}
                  <div
                    className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <p className="font-semibold text-gray-900 truncate">{req.name || '-'}</p>
                          {getStatusBadge(req.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">{req.company_name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {getRoleName(req.role)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(req.created_at)}
                          </span>
                        </div>
                      </div>
                      <button className="p-1 ml-2">
                        {isExpanded
                          ? <ChevronUp className="w-5 h-5 text-gray-400" />
                          : <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">이메일</span>
                          <span className="text-gray-900">{req.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">전화번호</span>
                          <span className="text-gray-900">{req.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">부서</span>
                          <span className="text-gray-900">{req.department || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">직급</span>
                          <span className="text-gray-900">{req.position || '-'}</span>
                        </div>
                        {req.message && (
                          <div className="pt-2 border-t border-gray-50">
                            <span className="text-gray-500 block mb-1">요청 메시지</span>
                            <p className="text-gray-700 bg-gray-50 p-2 rounded-lg">{req.message}</p>
                          </div>
                        )}
                        {req.reject_reason && (
                          <div className="pt-2 border-t border-gray-50">
                            <span className="text-gray-500 block mb-1">반려 사유</span>
                            <p className="text-red-600 bg-red-50 p-2 rounded-lg">{req.reject_reason}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Pending */}
                      {isPending && (
                        <div className="flex gap-3 p-4 pt-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReject(req.id); }}
                            disabled={isProcessingThis}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium active:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            반려
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                            disabled={isProcessingThis}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-medium active:bg-green-600 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            승인
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
