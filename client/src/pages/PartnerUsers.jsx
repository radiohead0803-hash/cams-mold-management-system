import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManagementAPI } from '../lib/api';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Search, 
  Key, CheckCircle, XCircle, Clock, Building2
} from 'lucide-react';

const PartnerUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartnerType, setFilterPartnerType] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [permissionClasses, setPermissionClasses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPendingApprovals();
    fetchPermissionClasses();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterPartnerType) params.partner_type = filterPartnerType;
      if (filterApprovalStatus) params.approval_status = filterApprovalStatus;
      if (filterActive) params.is_active = filterActive;
      
      const response = await userManagementAPI.getPartnerUsers(params);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('협력사 사용자 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await userManagementAPI.getPendingApprovals();
      setPendingApprovals(response.data.data || []);
    } catch (error) {
      console.error('승인 대기 목록 조회 실패:', error);
    }
  };

  const fetchPermissionClasses = async () => {
    try {
      const response = await userManagementAPI.getPermissionClasses();
      setPermissionClasses(response.data.data || []);
    } catch (error) {
      console.error('권한 클래스 조회 실패:', error);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleAdd = () => {
    setFormData({
      company_name: '',
      partner_type: 'maker',
      name: '',
      email: '',
      phone: '',
      partner_contact: '',
      partner_address: ''
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (user) => {
    setFormData({ ...user });
    setEditingId(user.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setFormData({});
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const response = await userManagementAPI.createPartnerUser(formData);
        alert(response.data.message || '협력사 사용자가 등록되었습니다.');
      } else {
        await userManagementAPI.updatePartnerUser(editingId, formData);
        alert('협력사 사용자 정보가 수정되었습니다.');
      }
      handleCancel();
      fetchUsers();
      fetchPendingApprovals();
    } catch (error) {
      alert(error.response?.data?.error?.message || '저장 실패');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await userManagementAPI.deleteUser(id);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error?.message || '삭제 실패');
    }
  };

  const handleResetPassword = async (id, username) => {
    if (!confirm(`${username} 사용자의 비밀번호를 초기화하시겠습니까?\n초기화 후 비밀번호는 아이디와 동일합니다.`)) return;
    try {
      await userManagementAPI.resetPartnerPassword(id);
      alert('비밀번호가 초기화되었습니다.');
    } catch (error) {
      alert(error.response?.data?.error?.message || '비밀번호 초기화 실패');
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('이 사용자를 승인하시겠습니까?')) return;
    try {
      await userManagementAPI.approveUser(userId);
      alert('사용자가 승인되었습니다.');
      fetchUsers();
      fetchPendingApprovals();
    } catch (error) {
      alert(error.response?.data?.error?.message || '승인 실패');
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('거부 사유를 입력하세요:');
    if (reason === null) return;
    try {
      await userManagementAPI.rejectUser(userId, reason);
      alert('사용자 등록이 거부되었습니다.');
      fetchUsers();
      fetchPendingApprovals();
    } catch (error) {
      alert(error.response?.data?.error?.message || '거부 실패');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userManagementAPI.updatePartnerUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (error) {
      alert('상태 변경 실패');
    }
  };

  const getPermissionLabel = (code) => {
    const cls = permissionClasses.find(p => p.class_code === code);
    return cls?.class_name || code;
  };

  const getPartnerTypeLabel = (type) => {
    return type === 'maker' ? '제작처' : type === 'plant' ? '생산처' : type || '-';
  };

  const getApprovalStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">승인됨</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">대기중</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">거부됨</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">협력사 사용자 현황</h1>
            <p className="text-sm text-gray-600 mt-1">제작처/생산처 사용자 계정을 관리합니다</p>
          </div>
        </div>
        
        {/* 승인 대기 알림 */}
        {pendingApprovals.length > 0 && (
          <button
            onClick={() => setShowApprovalPanel(!showApprovalPanel)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 animate-pulse"
          >
            <Clock size={18} />
            승인 대기 {pendingApprovals.length}건
          </button>
        )}
      </div>

      {/* 승인 대기 패널 */}
      {showApprovalPanel && pendingApprovals.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <Clock size={18} />
            승인 대기 목록
          </h3>
          <div className="space-y-2">
            {pendingApprovals.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Building2 size={20} className="text-gray-400" />
                  <div>
                    <div className="font-medium">{req.company_name}</div>
                    <div className="text-sm text-gray-500">
                      {getPartnerTypeLabel(req.partner_type)} | {req.partner_code} | {req.name}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req.user_id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                  >
                    <CheckCircle size={14} />
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(req.user_id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 text-sm"
                  >
                    <XCircle size={14} />
                    거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="업체명, 아이디, 업체코드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterPartnerType}
            onChange={(e) => setFilterPartnerType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 구분</option>
            <option value="maker">제작처</option>
            <option value="plant">생산처</option>
          </select>
          <select
            value={filterApprovalStatus}
            onChange={(e) => setFilterApprovalStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 승인상태</option>
            <option value="approved">승인됨</option>
            <option value="pending">대기중</option>
            <option value="rejected">거부됨</option>
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search size={18} />
            검색
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={18} />
            협력사 추가
          </button>
        </div>
      </div>

      {/* 입력 폼 */}
      {(isAdding || editingId) && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">
            {isAdding ? '새 협력사 사용자 등록' : '협력사 사용자 정보 수정'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="업체명 *"
              value={formData.company_name || ''}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.partner_type || 'maker'}
              onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!isAdding}
            >
              <option value="maker">제작처</option>
              <option value="plant">생산처</option>
            </select>
            <input
              type="text"
              placeholder="담당자명 *"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="이메일"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="핸드폰"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="업체 연락처"
              value={formData.partner_contact || ''}
              onChange={(e) => setFormData({ ...formData, partner_contact: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="업체 주소"
              value={formData.partner_address || ''}
              onChange={(e) => setFormData({ ...formData, partner_address: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 col-span-2"
            />
            {editingId && (
              <>
                <select
                  value={formData.permission_class || 'user'}
                  onChange={(e) => setFormData({ ...formData, permission_class: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {permissionClasses.map(cls => (
                    <option key={cls.class_code} value={cls.class_code}>{cls.class_name}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>활성화</span>
                </label>
              </>
            )}
          </div>
          {isAdding && (
            <p className="text-sm text-blue-600 mt-2">
              * 아이디와 초기 비밀번호는 자동 생성된 업체코드로 설정됩니다. 관리자 승인 후 로그인 가능합니다.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={18} />
              저장
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <X size={18} />
              취소
            </button>
          </div>
        </div>
      )}

      {/* 사용자 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체코드</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체명</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">구분</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">주소</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">권한</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">승인상태</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="14" className="px-3 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-3 py-8 text-center text-gray-500">
                    등록된 협력사 사용자가 없습니다
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className={!user.is_active ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-3 py-2 text-xs text-gray-400">{index + 1}</td>
                    <td className="px-3 py-2 text-xs font-medium text-purple-600">{user.partner_code || '-'}</td>
                    <td className="px-3 py-2 text-xs font-medium text-blue-600">{user.username}</td>
                    <td className="px-3 py-2 text-xs font-medium">{user.company_name || '-'}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.partner_type === 'maker' || user.user_type === 'maker' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {getPartnerTypeLabel(user.partner_type || user.user_type)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{user.name}</td>
                    <td className="px-3 py-2 text-xs">{user.partner_contact || user.phone || '-'}</td>
                    <td className="px-3 py-2 text-xs">{user.email || '-'}</td>
                    <td className="px-3 py-2 text-xs max-w-[150px] truncate" title={user.partner_address}>
                      {user.partner_address || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.permission_class === 'admin' ? 'bg-red-100 text-red-700' :
                        user.permission_class === 'manager' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getPermissionLabel(user.permission_class)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {getApprovalStatusBadge(user.approval_status)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`px-2 py-1 rounded text-xs ${
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex gap-1">
                        {user.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="승인"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="거부"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="수정"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id, user.username)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="비밀번호 초기화"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <span>총 {users.length}명</span>
        <span>|</span>
        <span className="text-blue-600">제작처: {users.filter(u => u.partner_type === 'maker' || u.user_type === 'maker').length}명</span>
        <span className="text-green-600">생산처: {users.filter(u => u.partner_type === 'plant' || u.user_type === 'plant').length}명</span>
        <span>|</span>
        <span className="text-yellow-600">승인대기: {users.filter(u => u.approval_status === 'pending').length}명</span>
      </div>
    </div>
  );
};

export default PartnerUsers;
