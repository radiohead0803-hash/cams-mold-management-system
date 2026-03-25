import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Clock, CheckCircle, XCircle,
  Building, AlertTriangle, Search, Shield
} from 'lucide-react';
import api from '../../lib/api';

export default function MobileHqRepairList() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filterTabs = ['전체', '대기', '승인', '반려'];

  const statusMap = {
    '대기': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '대기' },
    '승인대기': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '승인대기' },
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '대기' },
    '승인': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '승인' },
    'approved': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '승인' },
    '반려': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '반려' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '반려' },
  };

  const priorityMap = {
    '긴급': { bg: 'bg-red-100', text: 'text-red-700' },
    '높음': { bg: 'bg-orange-100', text: 'text-orange-700' },
    '보통': { bg: 'bg-blue-100', text: 'text-blue-700' },
    '낮음': { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/hq/repairs');
      const data = response.data?.data || response.data || [];
      setRepairs(Array.isArray(data) ? data : data.items || data.repairs || []);
    } catch (err) {
      console.error('본사 수리 목록 로드 실패:', err);
      setError('수리 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRepairs();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  const getStatusConfig = (status) => {
    return statusMap[status] || statusMap['대기'];
  };

  const getStatusLabel = (status) => {
    const config = statusMap[status];
    return config?.label || status || '대기';
  };

  const normalizeStatus = (status) => {
    if (!status) return '대기';
    if (status === 'pending' || status === '승인대기' || status === '대기') return '대기';
    if (status === 'approved' || status === '승인') return '승인';
    if (status === 'rejected' || status === '반려') return '반려';
    return status;
  };

  const matchesFilter = (repair) => {
    if (filter === '전체') return true;
    const approvalStatus = repair.approval_status || repair.repair_shop_approval_status || repair.status || '';
    return normalizeStatus(approvalStatus) === filter;
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchFilter = matchesFilter(repair);
    const matchSearch = !searchText ||
      (repair.mold_number || repair.mold_no || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (repair.requester_name || repair.plant_manager_name || '').toLowerCase().includes(searchText.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">본사 수리 요청</h1>
              <p className="text-xs text-gray-500">승인/반려 관리</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="금형번호 또는 요청자 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm mt-3">수리 요청을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Building size={48} className="mx-auto text-red-300 mb-3" />
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Shield size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchText ? '검색 결과가 없습니다.' : '수리 요청이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 px-1">총 {filteredRepairs.length}건</p>

            {filteredRepairs.map((repair, index) => {
              const approvalStatus = repair.approval_status || repair.repair_shop_approval_status || repair.status || '대기';
              const normalizedStatus = normalizeStatus(approvalStatus);
              const statusConfig = getStatusConfig(normalizedStatus);
              const StatusIcon = statusConfig.icon;
              const priority = repair.priority || '보통';
              const priorityConfig = priorityMap[priority] || priorityMap['보통'];

              return (
                <button
                  key={repair.id || index}
                  onClick={() => navigate(`/mobile/repair/${repair.id}`)}
                  className="w-full bg-white rounded-xl shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
                >
                  {/* 상단: 금형번호 + 상태 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {repair.mold_number || repair.mold_no || '금형번호 없음'}
                        </span>
                        {priority === '긴급' && (
                          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {repair.part_name || repair.problem || ''}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon size={12} />
                      {getStatusLabel(normalizedStatus)}
                    </span>
                  </div>

                  {/* 정보 행 */}
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}>
                      {priority}
                    </span>
                    {repair.requester_name || repair.plant_manager_name ? (
                      <span className="text-xs text-gray-500">
                        요청: {repair.requester_name || repair.plant_manager_name}
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatDate(repair.created_at || repair.occurred_date)}
                    </span>
                  </div>

                  {/* 승인 액션 힌트 (대기 상태만) */}
                  {normalizedStatus === '대기' && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs text-blue-600 font-medium">승인/반려 처리가 필요합니다</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
