/**
 * 모바일 공장 금형 선택 페이지
 * 작업 유형에 따라 금형을 선택하여 해당 작업 페이지로 이동
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Package, ChevronRight, RefreshCw, CheckCircle, Clock, AlertTriangle, Wrench } from 'lucide-react';
import api from '../../lib/api';

const TASK_CONFIG = {
  'daily-check': {
    label: '일상점검',
    headerColor: 'bg-blue-600',
    icon: CheckCircle,
    route: (moldId) => `/mobile/inspection/daily/${moldId}`,
  },
  'periodic-check': {
    label: '정기점검',
    headerColor: 'bg-green-600',
    icon: Clock,
    route: (moldId) => `/mobile/inspection/periodic/${moldId}`,
  },
  'repair-request': {
    label: '수리요청',
    headerColor: 'bg-red-600',
    icon: Wrench,
    route: (moldId) => `/mobile/repair-request/${moldId}`,
  },
  'condition-check': {
    label: '사출조건 확인',
    headerColor: 'bg-purple-600',
    icon: AlertTriangle,
    route: (moldId) => `/mobile/injection-condition/${moldId}`,
  },
};

export default function MobilePlantMoldSelect() {
  const navigate = useNavigate();
  const { task } = useParams();
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const config = TASK_CONFIG[task] || {
    label: '금형 선택',
    headerColor: 'bg-gray-600',
    icon: Package,
    route: (moldId) => `/mobile/mold/${moldId}`,
  };

  const TaskIcon = config.icon;

  useEffect(() => {
    fetchMolds();
  }, []);

  const fetchMolds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/molds', { params: { companyType: 'plant' } });
      if (response.data.success) {
        setMolds(response.data.data || []);
      }
    } catch (err) {
      console.error('금형 목록 조회 오류:', err);
      setError('금형 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      mold.mold_number?.toLowerCase().includes(term) ||
      mold.mold_name?.toLowerCase().includes(term) ||
      mold.part_name?.toLowerCase().includes(term)
    );
  });

  const getStatusInfo = (status) => {
    const map = {
      active: { label: '가동중', color: 'bg-green-100 text-green-700' },
      inactive: { label: '비가동', color: 'bg-gray-100 text-gray-600' },
      maintenance: { label: '정비중', color: 'bg-yellow-100 text-yellow-700' },
      repair: { label: '수리중', color: 'bg-red-100 text-red-700' },
    };
    return map[status] || { label: status || '-', color: 'bg-gray-100 text-gray-600' };
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

  const handleMoldSelect = (mold) => {
    navigate(config.route(mold.id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${config.headerColor} shadow-sm sticky top-0 z-10`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <TaskIcon className="w-5 h-5 text-white" />
              <h1 className="text-lg font-semibold text-white">{config.label} - 금형 선택</h1>
            </div>
          </div>
          <button onClick={fetchMolds} className="p-2">
            <RefreshCw className={`w-5 h-5 text-white/80 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="금형번호 또는 금형명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      {/* Task Info Banner */}
      <div className="mx-4 mt-4 mb-2">
        <div className={`${config.headerColor} bg-opacity-10 border border-opacity-20 rounded-xl p-3`}>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{config.label}</span>을 수행할 금형을 선택하세요.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchMolds}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : filteredMolds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 금형이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">총 {filteredMolds.length}개 금형</p>
            {filteredMolds.map((mold) => {
              const statusInfo = getStatusInfo(mold.status);
              return (
                <div
                  key={mold.id}
                  className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleMoldSelect(mold)}
                >
                  <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div className={`w-2 h-12 rounded-full flex-shrink-0 ${
                      mold.status === 'active' ? 'bg-green-500' :
                      mold.status === 'repair' ? 'bg-red-500' :
                      mold.status === 'maintenance' ? 'bg-yellow-500' :
                      'bg-gray-300'
                    }`} />

                    {/* Mold Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {mold.mold_number || '-'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {mold.mold_name || mold.part_name || '-'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          최종점검: {formatDate(mold.last_check_date || mold.last_inspection_date)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
