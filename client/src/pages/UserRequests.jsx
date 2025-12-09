import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { UserPlus, Check, X, Trash2, Clock } from 'lucide-react';

export default function UserRequests() {
  const { token, user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isMoldDeveloper = user?.user_type === 'mold_developer';
  const isSystemAdmin = user?.user_type === 'system_admin';

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let url = `${import.meta.env.VITE_API_URL}/user-requests?limit=100`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data.items || []);
      }
    } catch (error) {
      console.error('사용자 요청 조회 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('이 요청을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('요청이 삭제되었습니다.');
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error?.message}`);
      }
    } catch (error) {
      console.error('삭제 에러:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '대기' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '승인' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '거부' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="사용자 계정 요청 관리"
        subtitle="업체 사용자 계정 생성 요청 및 승인"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 및 액션 버튼 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                대기 중
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인됨
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                거부됨
              </button>
            </div>

            {isMoldDeveloper && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={20} />
                <span>계정 요청</span>
              </button>
            )}
          </div>
        </div>

        {/* 요청 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              요청이 없습니다.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.company?.company_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.company?.company_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        request.user_type === 'maker'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {request.user_type === 'maker' ? '제작처' : '생산처'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {request.requester?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {request.status === 'pending' && isSystemAdmin && (
                          <>
                            <button
                              onClick={() => handleApprove(request)}
                              className="text-green-600 hover:text-green-800"
                              title="승인"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              className="text-red-600 hover:text-red-800"
                              title="거부"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="text-gray-600 hover:text-gray-800"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 모달들 */}
      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRequests();
          }}
        />
      )}

      {showApproveModal && selectedRequest && (
        <ApproveModal
          request={selectedRequest}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}

      {showRejectModal && selectedRequest && (
        <RejectModal
          request={selectedRequest}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}

// 계정 요청 생성 모달
function CreateRequestModal({ onClose, onSuccess }) {
  const { token } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    company_id: '',
    username: '',
    name: '',
    email: '',
    phone: '',
    user_type: '',
    department: '',
    position: '',
    request_reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/companies?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data.items || []);
      }
    } catch (error) {
      console.error('업체 목록 조회 에러:', error);
    }
  };

  const handleCompanyChange = (companyId) => {
    const company = companies.find(c => c.id === parseInt(companyId));
    setFormData({
      ...formData,
      company_id: companyId,
      user_type: company ? company.company_type : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.company_id || !formData.username || !formData.name) {
      alert('업체, 사용자 ID, 이름은 필수입니다.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('계정 요청이 생성되었습니다.');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`요청 실패: ${error.error?.message}`);
      }
    } catch (error) {
      console.error('요청 생성 에러:', error);
      alert('요청 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">사용자 계정 요청</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업체 선택 *
              </label>
              <select
                value={formData.company_id}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">업체를 선택하세요</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.company_name} ({company.company_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 ID *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="user123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  부서
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="생산팀"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  직급
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="대리"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                요청 사유
              </label>
              <textarea
                value={formData.request_reason}
                onChange={(e) => setFormData({ ...formData, request_reason: e.target.value })}
                placeholder="계정 생성이 필요한 사유를 입력하세요"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '요청 중...' : '요청 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ request, onClose, onSuccess }) {
  const { token } = useAuthStore();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      alert('초기 비밀번호를 입력하세요.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ initial_password: password })
      });

      if (response.ok) {
        alert('계정이 승인되고 생성되었습니다.');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`승인 실패: ${error.error?.message}`);
      }
    } catch (error) {
      console.error('승인 에러:', error);
      alert('승인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">계정 승인</h2>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">사용자 ID: <span className="font-medium">{request.username}</span></p>
            <p className="text-sm text-gray-600">이름: <span className="font-medium">{request.name}</span></p>
            <p className="text-sm text-gray-600">업체: <span className="font-medium">{request.company?.company_name}</span></p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                초기 비밀번호 *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="초기 비밀번호 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                사용자에게 전달할 초기 비밀번호를 입력하세요
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? '승인 중...' : '승인'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ request, onClose, onSuccess }) {
  const { token } = useAuthStore();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      alert('거부 사유를 입력하세요.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-requests/${request.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: reason })
      });

      if (response.ok) {
        alert('요청이 거부되었습니다.');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`거부 실패: ${error.error?.message}`);
      }
    } catch (error) {
      console.error('거부 에러:', error);
      alert('거부에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">계정 요청 거부</h2>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">사용자 ID: <span className="font-medium">{request.username}</span></p>
            <p className="text-sm text-gray-600">이름: <span className="font-medium">{request.name}</span></p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거부 사유 *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="거부 사유를 입력하세요"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? '거부 중...' : '거부'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
