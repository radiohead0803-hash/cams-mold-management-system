import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Wrench, Clock, CheckCircle,
  Truck, Package, Search, AlertTriangle
} from 'lucide-react';
import api from '../../lib/api';

export default function MobileMakerRepairList() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filterTabs = ['전체', '접수대기', '수리중', '출하대기', '완료'];

  const statusMap = {
    '접수대기': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, progress: 0 },
    '접수': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, progress: 10 },
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, progress: 0 },
    '수리중': { bg: 'bg-orange-100', text: 'text-orange-700', icon: Wrench, progress: 50 },
    'in_progress': { bg: 'bg-orange-100', text: 'text-orange-700', icon: Wrench, progress: 50 },
    '출하대기': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck, progress: 80 },
    'shipping': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck, progress: 80 },
    '완료': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, progress: 100 },
    'completed': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, progress: 100 },
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/repairs/maker');
      const data = response.data?.data || response.data || [];
      setRepairs(Array.isArray(data) ? data : data.items || data.repairs || []);
    } catch (err) {
      console.error('메이커 수리 목록 로드 실패:', err);
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

  const normalizeStatus = (status) => {
    if (!status) return '접수대기';
    if (status === 'pending' || status === '접수' || status === '접수대기') return '접수대기';
    if (status === 'in_progress' || status === '수리중' || status === '수리 중') return '수리중';
    if (status === 'shipping' || status === '출하대기') return '출하대기';
    if (status === 'completed' || status === '완료') return '완료';
    return status;
  };

  const getStatusConfig = (status) => {
    const normalized = normalizeStatus(status);
    return statusMap[normalized] || statusMap['접수대기'];
  };

  const matchesFilter = (repair) => {
    if (filter === '전체') return true;
    const status = repair.status || '';
    return normalizeStatus(status) === filter;
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchFilter = matchesFilter(repair);
    const matchSearch = !searchText ||
      (repair.mold_number || repair.mold_no || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (repair.problem_type || repair.repair_type || '').toLowerCase().includes(searchText.toLowerCase());
    return matchFilter && matchSearch;
  });

  const calcDaysElapsed = (startDate) => {
    if (!startDate) return null;
    try {
      const start = new Date(startDate);
      const now = new Date();
      const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

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
              <h1 className="text-lg font-semibold text-gray-900">메이커 수리 현황</h1>
              <p className="text-xs text-gray-500">수리 접수 및 진행 관리</p>
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
              placeholder="금형번호 또는 수리유형 검색..."
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
            <Package size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchText ? '검색 결과가 없습니다.' : '수리 요청이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 px-1">총 {filteredRepairs.length}건</p>

            {filteredRepairs.map((repair, index) => {
              const status = repair.status || '접수대기';
              const normalizedStatus = normalizeStatus(status);
              const statusConfig = getStatusConfig(status);
              const StatusIcon = statusConfig.icon;
              const daysElapsed = calcDaysElapsed(repair.repair_start_date || repair.created_at);

              return (
                <button
                  key={repair.id || index}
                  onClick={() => navigate(`/mobile/repair/${repair.id}`)}
                  className="w-full bg-white rounded-xl shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
                >
                  {/* 상단: 금형번호 + 상태 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 text-sm">
                        {repair.mold_number || repair.mold_no || '금형번호 없음'}
                      </span>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {repair.problem_type || repair.repair_type || '수리 유형 미지정'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon size={12} />
                      {normalizedStatus}
                    </span>
                  </div>

                  {/* 진행률 바 */}
                  <div className="mt-2 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">진행률</span>
                      <span className="text-[10px] text-gray-500 font-medium">{statusConfig.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          statusConfig.progress === 100
                            ? 'bg-green-500'
                            : statusConfig.progress >= 50
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${statusConfig.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 날짜 정보 */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {repair.repair_start_date && (
                        <span>시작: {formatDate(repair.repair_start_date)}</span>
                      )}
                      {repair.repair_end_date ? (
                        <span>완료: {formatDate(repair.repair_end_date)}</span>
                      ) : repair.completion_date ? (
                        <span>예정: {formatDate(repair.completion_date)}</span>
                      ) : (
                        <span>접수: {formatDate(repair.created_at)}</span>
                      )}
                    </div>
                    {daysElapsed !== null && normalizedStatus !== '완료' && (
                      <span className={`text-xs font-medium ${daysElapsed > 7 ? 'text-red-500' : 'text-gray-500'}`}>
                        {daysElapsed}일 경과
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
