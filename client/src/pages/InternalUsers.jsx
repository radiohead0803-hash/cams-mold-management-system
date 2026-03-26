import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManagementAPI } from '../lib/api';
import {
  ArrowLeft, Plus, Edit2, Trash2, Save, X, Search,
  RefreshCw, Key, UserCheck, UserX, Filter,
  ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import useResizableColumns from '../hooks/useResizableColumns';

const INTERNAL_DEFAULT_WIDTHS = {
  '#': 40,
  username: 80,
  employee_id: 70,
  name: 80,
  department: 80,
  position: 70,
  factory: 70,
  permission_class: 70,
  email: 160,
  phone: 110,
  created_at: 90,
  is_active: 60,
  password_changed: 70,
  actions: 80,
};

const InternalUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterPermission, setFilterPermission] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [departments, setDepartments] = useState([]);
  const [permissionClasses, setPermissionClasses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { columnWidths, handleMouseDown } = useResizableColumns(
    'internalUsers_colWidths',
    INTERNAL_DEFAULT_WIDTHS,
    60
  );

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchPermissionClasses();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterDepartment) params.department = filterDepartment;
      if (filterPermission) params.permission_class = filterPermission;
      if (filterActive) params.is_active = filterActive;

      const response = await userManagementAPI.getInternalUsers(params);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await userManagementAPI.getDepartments();
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('부서 목록 조회 실패:', error);
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
    setCurrentPage(1);
    fetchUsers();
  };

  const handleAdd = () => {
    setFormData({
      username: '',
      employee_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      factory: '',
      permission_class: 'user'
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
        await userManagementAPI.createInternalUser(formData);
        alert('사용자가 등록되었습니다. 초기 비밀번호는 아이디와 동일합니다.');
      } else {
        await userManagementAPI.updateInternalUser(editingId, formData);
        alert('사용자 정보가 수정되었습니다.');
      }
      handleCancel();
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error?.message || '저장 실패');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?\n(다른 데이터에서 참조 중이면 비활성화 처리됩니다)')) return;
    try {
      const res = await userManagementAPI.deleteUser(id);
      if (res.data?.deleteType === 'soft') {
        alert(`⚠️ ${res.data?.message || '비활성화 처리되었습니다'}`);
      }
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error?.message || '삭제 실패');
    }
  };

  const handleResetPassword = async (id, username) => {
    if (!confirm(`${username} 사용자의 비밀번호를 초기화하시겠습니까?\n초기화 후 비밀번호는 아이디와 동일합니다.`)) return;
    try {
      await userManagementAPI.resetInternalPassword(id);
      alert('비밀번호가 초기화되었습니다.');
    } catch (error) {
      alert(error.response?.data?.error?.message || '비밀번호 초기화 실패');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userManagementAPI.updateInternalUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (error) {
      alert('상태 변경 실패');
    }
  };

  const getPermissionLabel = (code) => {
    const cls = permissionClasses.find(p => p.class_code === code);
    return cls?.class_name || code;
  };

  const sortableColumns = [
    { key: 'username', label: '아이디' },
    { key: 'employee_id', label: '사번' },
    { key: 'name', label: '이름' },
    { key: 'department', label: '부서' },
    { key: 'position', label: '직급' },
    { key: 'factory', label: '공장' },
    { key: 'permission_class', label: '권한' },
    { key: 'email', label: '이메일' },
    { key: 'phone', label: '핸드폰' },
    { key: 'created_at', label: '등록일' },
    { key: 'is_active', label: '상태' },
  ];

  /** Render a resize handle for a given column key */
  const ResizeHandle = ({ colKey }) => (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 4,
        cursor: 'col-resize',
        zIndex: 1,
      }}
      onMouseDown={(e) => handleMouseDown(colKey, e)}
    />
  );

  const cellStyle = (key) => ({
    width: columnWidths[key],
    minWidth: 60,
    maxWidth: columnWidths[key],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사내 사용자 현황</h1>
          <p className="text-sm text-gray-600 mt-1">사내 사용자 계정을 관리합니다</p>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="이름, 아이디, 사번 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 부서</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterPermission}
            onChange={(e) => setFilterPermission(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 권한</option>
            {permissionClasses.map(cls => (
              <option key={cls.class_code} value={cls.class_code}>{cls.class_name}</option>
            ))}
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
            사용자 추가
          </button>
        </div>
      </div>

      {/* 입력 폼 */}
      {(isAdding || editingId) && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">
            {isAdding ? '새 사용자 등록' : '사용자 정보 수정'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="아이디 *"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!isAdding}
            />
            <input
              type="text"
              placeholder="사번 *"
              value={formData.employee_id || ''}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="이름 *"
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
              placeholder="부서명"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="직급"
              value={formData.position || ''}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="공장"
              value={formData.factory || ''}
              onChange={(e) => setFormData({ ...formData, factory: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.permission_class || 'user'}
              onChange={(e) => setFormData({ ...formData, permission_class: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {permissionClasses.map(cls => (
                <option key={cls.class_code} value={cls.class_code}>{cls.class_name}</option>
              ))}
            </select>
            {editingId && (
              <label className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>활성화</span>
              </label>
            )}
          </div>
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
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <table className="divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: Object.values(columnWidths).reduce((a, b) => a + b, 0) }}>
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {/* # column */}
                <th
                  className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  style={{ ...cellStyle('#'), position: 'relative' }}
                >
                  #
                  <ResizeHandle colKey="#" />
                </th>
                {sortableColumns.map(col => (
                  <th
                    key={col.key}
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none transition-colors"
                    style={{ ...cellStyle(col.key), position: 'relative' }}
                    onClick={() => {
                      if (sortField === col.key) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField(col.key);
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={10} className="text-gray-300" />
                      )}
                    </span>
                    <ResizeHandle colKey={col.key} />
                  </th>
                ))}
                {/* 비번변경 column */}
                <th
                  className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  style={{ ...cellStyle('password_changed'), position: 'relative' }}
                >
                  비번변경
                  <ResizeHandle colKey="password_changed" />
                </th>
                {/* 작업 column */}
                <th
                  className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  style={{ ...cellStyle('actions'), position: 'relative' }}
                >
                  작업
                  <ResizeHandle colKey="actions" />
                </th>
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
                    등록된 사용자가 없습니다
                  </td>
                </tr>
              ) : (
                (() => {
                  const sorted = [...users].sort((a, b) => {
                    let aVal = a[sortField] ?? '';
                    let bVal = b[sortField] ?? '';
                    if (sortField === 'created_at') {
                      aVal = new Date(aVal).getTime() || 0;
                      bVal = new Date(bVal).getTime() || 0;
                    } else if (sortField === 'is_active') {
                      aVal = aVal ? 1 : 0;
                      bVal = bVal ? 1 : 0;
                    } else {
                      aVal = String(aVal).toLowerCase();
                      bVal = String(bVal).toLowerCase();
                    }
                    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                  });
                  const paginatedUsers = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                  return paginatedUsers.map((user, index) => (
                  <tr key={user.id} className={!user.is_active ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-2 py-2 text-xs text-gray-400" style={cellStyle('#')}>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-2 py-2 text-xs font-medium text-blue-600" style={cellStyle('username')}>{user.username}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('employee_id')}>{user.employee_id || '-'}</td>
                    <td className="px-2 py-2 text-xs font-medium" style={cellStyle('name')}>{user.name}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('department')}>{user.department || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('position')}>{user.position || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('factory')}>{user.factory || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('permission_class')}>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.permission_class === 'admin' ? 'bg-red-100 text-red-700' :
                        user.permission_class === 'manager' ? 'bg-orange-100 text-orange-700' :
                        user.permission_class === 'user' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getPermissionLabel(user.permission_class)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('email')}>{user.email || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('phone')}>{user.phone || '-'}</td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('created_at')}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('is_active')}>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`px-2 py-1 rounded text-xs ${
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-xs" style={cellStyle('password_changed')}>
                      {user.is_password_changed ? (
                        <span className="text-green-600">변경됨</span>
                      ) : (
                        <span className="text-orange-600">미변경</span>
                      )}
                    </td>
                    <td className="px-2 py-2" style={cellStyle('actions')}>
                      <div className="flex gap-1">
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
                ));
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!loading && users.length > 0 && (() => {
          const totalPages = Math.ceil(users.length / PAGE_SIZE);
          if (totalPages <= 1) return null;
          const startPage = Math.max(1, currentPage - 2);
          const endPage = Math.min(totalPages, startPage + 4);
          const pages = [];
          for (let i = startPage; i <= endPage; i++) pages.push(i);
          return (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-xs text-gray-600">
                총 {users.length}명 | 페이지 {currentPage}/{totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                {pages.map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-2 py-1 text-xs rounded border min-w-[28px] ${
                      p === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 통계 */}
      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <span>총 {users.length}명</span>
        <span>|</span>
        <span className="text-green-600">활성: {users.filter(u => u.is_active).length}명</span>
        <span className="text-red-600">비활성: {users.filter(u => !u.is_active).length}명</span>
      </div>
    </div>
  );
};

export default InternalUsers;
