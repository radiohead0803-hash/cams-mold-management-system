import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Plus, Wrench, AlertTriangle,
  Clock, CheckCircle, XCircle, Search, Filter
} from 'lucide-react';
import api from '../../lib/api';

export default function MobileRepairList() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filterTabs = ['전체', '요청', '접수', '수리중', '완료'];

  const statusMap = {
    '요청': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
    '요청접수': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
    '접수': { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
    '수리중': { bg: 'bg-orange-100', text: 'text-orange-700', icon: Wrench },
    '완료': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    '반려': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  };

  const severityMap = {
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
      const response = await api.get('/repairs');
      const data = response.data?.data || response.data || [];
      setRepairs(Array.isArray(data) ? data : data.items || data.repairs || []);
    } catch (err) {
      console.error('수리 목록 로드 실패:', err);
      setError('수리 목록을 불러오는데 실패했습니다.');
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
    return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };
  };

  const getSeverityConfig = (severity) => {
    return severityMap[severity] || severityMap['보통'];
  };

  const matchesFilter = (repair) => {
    if (filter === '전체') return true;
    const status = repair.status || '';
    if (filter === '요청') return status === '요청' || status === '요청접수';
    if (filter === '접수') return status === '접수';
    if (filter === '수리중') return status === '수리중' || status === '수리 중';
    if (filter === '완료') return status === '완료';
    return true;
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchFilter = matchesFilter(repair);
    const matchSearch = !searchText ||
      (repair.mold_number || repair.mold_no || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (repair.problem || repair.description || '').toLowerCase().includes(searchText.toLowerCase());
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
            <h1 className="text-lg font-semibold text-gray-900">수리 관리</h1>
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
              placeholder="금형번호 또는 내용 검색..."
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
            <p className="text-gray-500 text-sm mt-3">수리 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Wrench size={48} className="mx-auto text-red-300 mb-3" />
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
            <Wrench size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchText ? '검색 결과가 없습니다.' : '수리 요청이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 px-1">총 {filteredRepairs.length}건</p>

            {filteredRepairs.map((repair, index) => {
              const status = repair.status || '요청';
              const severity = repair.priority || repair.severity || '보통';
              const statusConfig = getStatusConfig(status);
              const severityConfig = getSeverityConfig(severity);
              const StatusIcon = statusConfig.icon;

              return (
                <button
                  key={repair.id || index}
                  onClick={() => navigate(`/mobile/repair/${repair.id}`)}
                  className="w-full bg-white rounded-xl shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {repair.mold_number || repair.mold_no || '금형번호 없음'}
                        </span>
                        {severity === '긴급' && (
                          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-2">
                        {repair.problem_type || repair.repair_type || repair.problem || '수리 유형 미지정'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon size={12} />
                          {status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.bg} ${severityConfig.text}`}>
                          {severity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-xs text-gray-400">
                        {formatDate(repair.created_at || repair.occurred_date)}
                      </p>
                      {(repair.requester_name || repair.plant_manager_name) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {repair.requester_name || repair.plant_manager_name}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB - 새 수리 요청 */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
        onClick={() => navigate('/mobile/repair/new')}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
