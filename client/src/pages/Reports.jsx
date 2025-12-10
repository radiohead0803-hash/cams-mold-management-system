import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, ArrowLeft, TrendingUp, Package, Wrench, 
  Calendar, FileCheck, Trash2, Users, Factory,
  ChevronDown, Download, RefreshCw
} from 'lucide-react';
import api from '../lib/api';

// 간단한 바 차트 컴포넌트
const SimpleBarChart = ({ data, labelKey, valueKey, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => parseInt(d[valueKey]) || 0), 1);
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 truncate">{item[labelKey]}</div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colorClasses[color]} transition-all duration-500`}
              style={{ width: `${(parseInt(item[valueKey]) / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-semibold text-gray-900 text-right">
            {parseInt(item[valueKey]).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value?.toLocaleString() || 0}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% 전월 대비
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  
  // 통계 데이터
  const [moldStats, setMoldStats] = useState(null);
  const [maintenanceStats, setMaintenanceStats] = useState(null);
  const [scrappingStats, setScrappingStats] = useState(null);
  const [checklistStats, setChecklistStats] = useState(null);

  useEffect(() => {
    loadAllStats();
  }, [year, month]);

  const loadAllStats = async () => {
    try {
      setLoading(true);
      
      // 병렬로 통계 데이터 로드
      const [moldRes, maintenanceRes, scrappingRes, checklistRes] = await Promise.all([
        api.get('/statistics/molds', { params: { year } }).catch(() => ({ data: { data: {} } })),
        api.get('/maintenance/statistics', { params: { year } }).catch(() => ({ data: { data: {} } })),
        api.get('/scrapping/statistics', { params: { year } }).catch(() => ({ data: { data: {} } })),
        api.get('/statistics/checklists', { params: { year } }).catch(() => ({ data: { data: {} } }))
      ]);

      // 금형 통계
      const moldData = moldRes.data.data;
      setMoldStats({
        total: moldData.total || 0,
        active: moldData.active || 0,
        development: moldData.development || 0,
        manufacturing: moldData.manufacturing || 0,
        scrapped: moldData.scrapped || 0,
        byCarModel: moldData.by_car_model || [],
        byMaker: moldData.by_maker || []
      });

      setMaintenanceStats(maintenanceRes.data.data);
      setScrappingStats(scrappingRes.data.data);

      // 체크리스트 통계
      const checklistData = checklistRes.data.data;
      setChecklistStats({
        total: checklistData.total || 0,
        draft: checklistData.draft || 0,
        submitted: checklistData.submitted || 0,
        approved: checklistData.approved || 0,
        rejected: checklistData.rejected || 0,
        completionRate: checklistData.completion_rate || 0
      });

    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '전체 현황', icon: BarChart3 },
    { id: 'molds', label: '금형 통계', icon: Package },
    { id: 'maintenance', label: '유지보전', icon: Wrench },
    { id: 'checklists', label: '체크리스트', icon: FileCheck }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">통계 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">통계 리포트</h1>
            <p className="text-sm text-gray-600 mt-1">금형 관리 현황 및 통계 분석</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 연도 선택 */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <button
            onClick={loadAllStats}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} />
            새로고침
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            리포트 다운로드
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 전체 현황 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="전체 금형" value={moldStats?.total} icon={Package} color="blue" />
            <StatCard title="양산 중" value={moldStats?.active} icon={Factory} color="green" trend={5} />
            <StatCard title="유지보전" value={maintenanceStats?.by_type?.reduce((sum, t) => sum + parseInt(t.count), 0) || 0} icon={Wrench} color="orange" />
            <StatCard title="폐기 요청" value={scrappingStats?.by_status?.reduce((sum, s) => sum + parseInt(s.count), 0) || 0} icon={Trash2} color="red" />
            <StatCard title="체크리스트" value={checklistStats?.total} icon={FileCheck} color="purple" />
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 차종별 금형 현황 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">차종별 금형 현황</h3>
              <SimpleBarChart 
                data={moldStats?.byCarModel || []} 
                labelKey="name" 
                valueKey="count" 
                color="blue" 
              />
            </div>

            {/* 제작처별 금형 현황 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">제작처별 금형 현황</h3>
              <SimpleBarChart 
                data={moldStats?.byMaker || []} 
                labelKey="name" 
                valueKey="count" 
                color="green" 
              />
            </div>

            {/* 유지보전 유형별 현황 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">유지보전 유형별 현황</h3>
              {maintenanceStats?.by_type?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_type} 
                  labelKey="maintenance_type" 
                  valueKey="count" 
                  color="orange" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>

            {/* 월별 유지보전 추이 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 유지보전 추이</h3>
              {maintenanceStats?.by_month?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_month.map(m => ({ ...m, month: `${m.month}월` }))} 
                  labelKey="month" 
                  valueKey="count" 
                  color="purple" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 금형 통계 탭 */}
      {activeTab === 'molds' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="전체 금형" value={moldStats?.total} icon={Package} color="blue" />
            <StatCard title="개발 중" value={moldStats?.development} icon={TrendingUp} color="orange" />
            <StatCard title="양산 중" value={moldStats?.active} icon={Factory} color="green" />
            <StatCard title="폐기" value={moldStats?.scrapped} icon={Trash2} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">차종별 금형 분포</h3>
              <SimpleBarChart 
                data={moldStats?.byCarModel || []} 
                labelKey="name" 
                valueKey="count" 
                color="blue" 
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">제작처별 금형 분포</h3>
              <SimpleBarChart 
                data={moldStats?.byMaker || []} 
                labelKey="name" 
                valueKey="count" 
                color="green" 
              />
            </div>
          </div>
        </div>
      )}

      {/* 유지보전 탭 */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {maintenanceStats?.by_type?.slice(0, 4).map((type, index) => (
              <StatCard 
                key={type.maintenance_type}
                title={type.maintenance_type} 
                value={parseInt(type.count)} 
                subtitle={type.total_cost > 0 ? `${(type.total_cost / 10000).toFixed(0)}만원` : undefined}
                icon={Wrench} 
                color={['blue', 'green', 'orange', 'purple'][index % 4]} 
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">유형별 유지보전 현황</h3>
              {maintenanceStats?.by_type?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_type} 
                  labelKey="maintenance_type" 
                  valueKey="count" 
                  color="orange" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 유지보전 추이</h3>
              {maintenanceStats?.by_month?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_month.map(m => ({ ...m, month: `${m.month}월` }))} 
                  labelKey="month" 
                  valueKey="count" 
                  color="blue" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 체크리스트 탭 */}
      {activeTab === 'checklists' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard title="전체" value={checklistStats?.total} icon={FileCheck} color="blue" />
            <StatCard title="작성중" value={checklistStats?.draft} icon={Calendar} color="orange" />
            <StatCard title="제출됨" value={checklistStats?.submitted} icon={TrendingUp} color="purple" />
            <StatCard title="승인됨" value={checklistStats?.approved} icon={FileCheck} color="green" />
            <StatCard title="반려됨" value={checklistStats?.rejected} icon={Trash2} color="red" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">체크리스트 완료율</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${checklistStats?.completionRate || 0}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-gray-900">{checklistStats?.completionRate || 0}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
