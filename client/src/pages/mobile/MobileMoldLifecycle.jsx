/**
 * 모바일 금형 라이프사이클 페이지
 * 금형 개발 진행 현황 대시보드
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Package, Settings, Factory,
  Trash2, ChevronRight, Search, CheckCircle, Clock,
  AlertTriangle, BarChart3, Filter
} from 'lucide-react';
import api from '../../lib/api';

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'development', label: '개발중' },
  { key: 'production', label: '양산중' },
  { key: 'maintenance', label: '정비중' },
  { key: 'scrapped', label: '폐기' },
];

const MILESTONE_STEPS = [
  { key: 'design', label: '설계', step: 1 },
  { key: 'fabrication', label: '제작', step: 3 },
  { key: 'tryout', label: 'T/O', step: 5 },
  { key: 'correction', label: '보정', step: 7 },
  { key: 'validation', label: '검증', step: 9 },
  { key: 'approval', label: '승인', step: 11 },
  { key: 'production', label: '양산', step: 13 },
];

export default function MobileMoldLifecycle() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/mold-lifecycle/summary');
      if (response.data.success) {
        const data = response.data.data;
        setSummary(data.summary || data);
        setMolds(data.molds || data.items || []);
      } else {
        setError('데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('라이프사이클 데이터 조회 오류:', err);
      // Fallback: try fetching mold list directly
      try {
        const moldRes = await api.get('/mold-specifications');
        if (moldRes.data.success) {
          const moldData = moldRes.data.data || [];
          setMolds(moldData);
          // Build summary from mold data
          setSummary({
            total: moldData.length,
            development: moldData.filter(m => m.status === 'development').length,
            production: moldData.filter(m => m.status === 'active' || m.status === 'production').length,
            scrapped: moldData.filter(m => m.status === 'scrapped').length,
          });
        }
      } catch {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    { label: '총 금형수', value: summary?.total || 0, icon: Package, color: 'bg-blue-500' },
    { label: '개발중', value: summary?.development || 0, icon: Settings, color: 'bg-orange-500' },
    { label: '양산중', value: summary?.production || 0, icon: Factory, color: 'bg-green-500' },
    { label: '폐기', value: summary?.scrapped || 0, icon: Trash2, color: 'bg-gray-500' },
  ];

  const filteredMolds = molds.filter((mold) => {
    const matchesTab =
      activeTab === 'all' ||
      mold.status === activeTab ||
      (activeTab === 'production' && mold.status === 'active');
    const matchesSearch =
      !searchTerm ||
      mold.mold_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.mold_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getProgressPercent = (mold) => {
    if (mold.current_step && mold.total_steps) {
      return Math.round((mold.current_step / mold.total_steps) * 100);
    }
    if (mold.progress) return mold.progress;
    // Estimate from status
    const statusProgress = {
      design: 10, development: 30, tryout: 50,
      correction: 60, validation: 75, approval: 85,
      active: 100, production: 100, scrapped: 100,
    };
    return statusProgress[mold.status] || 0;
  };

  const getStatusBadge = (status) => {
    const configs = {
      development: { bg: 'bg-orange-100', text: 'text-orange-700', label: '개발중' },
      design: { bg: 'bg-purple-100', text: 'text-purple-700', label: '설계' },
      tryout: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'T/O' },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: '양산중' },
      production: { bg: 'bg-green-100', text: 'text-green-700', label: '양산중' },
      maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '정비중' },
      scrapped: { bg: 'bg-gray-100', text: 'text-gray-500', label: '폐기' },
    };
    const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || '-' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">금형 라이프사이클</h1>
          </div>
          <button onClick={fetchData} className="p-2">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-2">
          {kpiCards.map((kpi) => {
            const KpiIcon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white rounded-xl shadow-sm p-3 text-center">
                <div className={`w-8 h-8 rounded-full ${kpi.color} flex items-center justify-center mx-auto mb-2`}>
                  <KpiIcon className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
              </div>
            );
          })}
        </div>

        {/* Milestone Progress (Horizontal Scroll) */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">개발 단계</h3>
          <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {MILESTONE_STEPS.map((step, idx) => (
              <div key={step.key} className="flex items-center shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{step.label}</span>
                </div>
                {idx < MILESTONE_STEPS.length - 1 && (
                  <div className="w-6 h-0.5 bg-gray-200 mx-1 mt-[-10px]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="금형번호, 이름 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm text-sm border-0 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mold List */}
        {filteredMolds.length > 0 ? (
          <div className="space-y-3">
            {filteredMolds.map((mold) => {
              const progress = getProgressPercent(mold);
              return (
                <div
                  key={mold.id || mold.mold_id}
                  onClick={() => navigate(`/mobile/mold/${mold.id || mold.mold_id}`)}
                  className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {mold.mold_number || '-'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {mold.part_name || mold.mold_name || '-'}
                      </p>
                    </div>
                    {getStatusBadge(mold.status)}
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">진행률</span>
                      <span className="text-xs font-medium text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 100 ? 'bg-green-500' :
                          progress >= 50 ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                  {mold.car_model && (
                    <p className="text-xs text-gray-400 mt-2">차종: {mold.car_model}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchTerm ? '검색 결과가 없습니다' : '해당 상태의 금형이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
