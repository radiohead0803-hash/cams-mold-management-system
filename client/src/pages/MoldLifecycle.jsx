import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Clock, AlertCircle, Filter, Search, ArrowLeft, 
  TrendingUp, BarChart3, PieChart, Calendar, Target, Zap,
  ChevronDown, ChevronRight, Car, Package, Factory, RefreshCw, Eye
} from 'lucide-react';
import { moldSpecificationAPI, developmentPlanAPI } from '../lib/api';

// 14단계 개발 공정 (개발 12단계 + 금형육성 + 양산이관)
const DEVELOPMENT_STAGES = [
  { id: 'drawing_receipt', name: '도면접수', order: 1, category: 'development' },
  { id: 'mold_base_order', name: '몰드베이스 발주', order: 2, category: 'development' },
  { id: 'mold_design', name: '금형설계', order: 3, category: 'development' },
  { id: 'drawing_review', name: '도면검토회', order: 4, category: 'development' },
  { id: 'upper_machining', name: '상형가공', order: 5, category: 'development' },
  { id: 'lower_machining', name: '하형가공', order: 6, category: 'development' },
  { id: 'core_machining', name: '코어가공', order: 7, category: 'development' },
  { id: 'discharge', name: '방전', order: 8, category: 'development' },
  { id: 'surface_finish', name: '격면사상', order: 9, category: 'development' },
  { id: 'mold_assembly', name: '금형조립', order: 10, category: 'development' },
  { id: 'tryout', name: '습합', order: 11, category: 'development' },
  { id: 'initial_to', name: '초도 T/O', order: 12, category: 'development' },
  { id: 'mold_nurturing', name: '초도T/O 이후 금형육성', order: 13, category: 'nurturing' },
  { id: 'mass_production_transfer', name: '양산이관', order: 14, category: 'transfer' }
];

// 카테고리 정의
const CATEGORIES = [
  { code: 'development', name: '개발', color: 'blue' },
  { code: 'nurturing', name: '금형육성', color: 'green' },
  { code: 'transfer', name: '양산이관', color: 'purple' }
];

// 상태별 색상
const STATUS_COLORS = {
  completed: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
  in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
  delayed: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
  pending: { bg: 'bg-gray-300', text: 'text-gray-500', light: 'bg-gray-100' }
};

export default function MoldLifecycle() {
  const navigate = useNavigate();
  const [molds, setMolds] = useState([]);
  const [developmentPlans, setDevelopmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCarModel, setSelectedCarModel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCarModel, setExpandedCarModel] = useState(null);
  const [expandedMold, setExpandedMold] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table' | 'gantt'
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // 금형사양 및 개발계획 데이터 병렬 로드
      const [specResponse, plansResponse] = await Promise.all([
        moldSpecificationAPI.getAll({ limit: 100 }),
        developmentPlanAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: { plans: [] } } }))
      ]);
      
      const specifications = specResponse.data.data.items || [];
      const plans = plansResponse.data?.data?.plans || [];
      setDevelopmentPlans(plans);
      
      // 개발계획 데이터를 mold_specification_id로 매핑
      const plansBySpecId = {};
      plans.forEach(plan => {
        if (plan.mold_specification_id) {
          plansBySpecId[plan.mold_specification_id] = plan;
        }
      });
      
      // DB 데이터를 개발진행현황 형식으로 변환 (개발계획 연동)
      const transformedMolds = specifications.map(spec => {
        const plan = plansBySpecId[spec.id];
        const processSteps = plan?.processSteps || [];
        
        // 개발계획이 있으면 실제 진행률 계산
        let progress = 0;
        let completedSteps = 0;
        let inProgressSteps = 0;
        let delayedSteps = 0;
        let pendingSteps = 0;
        
        if (processSteps.length > 0) {
          processSteps.forEach(step => {
            if (step.status === 'completed') completedSteps++;
            else if (step.status === 'in_progress') inProgressSteps++;
            else if (step.status === 'delayed') delayedSteps++;
            else pendingSteps++;
          });
          progress = Math.round((completedSteps / processSteps.length) * 100);
        } else {
          // 개발계획이 없으면 상태 기반 진행률
          const statusProgress = {
            'draft': 5,
            'planning': 15,
            'design': 25,
            'manufacturing': 50,
            'trial': 75,
            'production': 100,
            'maintenance': 100,
            'retired': 100
          };
          progress = statusProgress[spec.status] || 0;
        }
        
        const isDelayed = delayedSteps > 0 || (spec.status === 'manufacturing' && progress < 60);
        
        // 현재 진행 단계 찾기
        const currentStep = processSteps.find(s => s.status === 'in_progress') || 
                           processSteps.find(s => s.status === 'pending');
        
        return {
          id: spec.id,
          mold_code: spec.mold?.mold_code || `M-${spec.id}`,
          part_number: spec.part_number,
          part_name: spec.part_name,
          car_model: spec.car_model || '미지정',
          car_year: spec.car_year || new Date().getFullYear().toString(),
          maker_name: spec.makerCompany?.company_name || spec.MakerCompany?.company_name || '미지정',
          status: spec.status || 'draft',
          mold_type: spec.mold_type,
          cavity_count: spec.cavity_count,
          tonnage: spec.tonnage,
          material: spec.material,
          overall_progress: progress,
          is_delayed: isDelayed,
          delay_days: delayedSteps > 0 ? delayedSteps : 0,
          created_at: spec.created_at,
          updated_at: spec.updated_at,
          // 개발계획 연동 데이터
          development_plan: plan,
          process_steps: processSteps,
          completed_steps: completedSteps,
          in_progress_steps: inProgressSteps,
          delayed_steps: delayedSteps,
          pending_steps: pendingSteps,
          total_steps: processSteps.length,
          current_step: currentStep?.step_name || null,
          current_step_number: currentStep?.step_number || 0
        };
      });
      
      setMolds(transformedMolds);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load molds:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadMolds(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 차종별 그룹화 및 통계
  const carModelStats = useMemo(() => {
    const grouped = {};
    molds.forEach(mold => {
      const carModel = mold.car_model || '미지정';
      if (!grouped[carModel]) {
        grouped[carModel] = {
          name: carModel,
          molds: [],
          total: 0,
          completed: 0,
          inProgress: 0,
          delayed: 0,
          avgProgress: 0
        };
      }
      grouped[carModel].molds.push(mold);
      grouped[carModel].total++;
      if (mold.overall_progress === 100) grouped[carModel].completed++;
      else if (mold.overall_progress > 0) grouped[carModel].inProgress++;
      if (mold.is_delayed) grouped[carModel].delayed++;
    });

    // 평균 진행률 계산
    Object.values(grouped).forEach(group => {
      group.avgProgress = group.molds.length > 0
        ? Math.round(group.molds.reduce((sum, m) => sum + m.overall_progress, 0) / group.molds.length)
        : 0;
    });

    return grouped;
  }, [molds]);

  // 전체 통계
  const stats = useMemo(() => ({
    total: molds.length,
    completed: molds.filter(m => m.overall_progress === 100).length,
    inProgress: molds.filter(m => m.overall_progress > 0 && m.overall_progress < 100).length,
    delayed: molds.filter(m => m.is_delayed).length,
    avgProgress: molds.length > 0 
      ? Math.round(molds.reduce((sum, m) => sum + m.overall_progress, 0) / molds.length) 
      : 0,
    carModelCount: Object.keys(carModelStats).length
  }), [molds, carModelStats]);

  // 필터링
  const filteredMolds = useMemo(() => {
    return molds.filter(mold => {
      const matchesCarModel = selectedCarModel === 'all' || mold.car_model === selectedCarModel;
      const matchesSearch = 
        mold.mold_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mold.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mold.part_number?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCarModel && matchesSearch;
    });
  }, [molds, selectedCarModel, searchTerm]);

  const carModels = ['all', ...Object.keys(carModelStats)];

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: '초안', color: 'bg-gray-100 text-gray-700' },
      planning: { label: '계획', color: 'bg-indigo-100 text-indigo-700' },
      design: { label: '설계', color: 'bg-purple-100 text-purple-700' },
      manufacturing: { label: '제작', color: 'bg-blue-100 text-blue-700' },
      trial: { label: '시운전', color: 'bg-yellow-100 text-yellow-700' },
      production: { label: '양산', color: 'bg-green-100 text-green-700' },
      maintenance: { label: '정비', color: 'bg-orange-100 text-orange-700' },
      retired: { label: '폐기', color: 'bg-red-100 text-red-700' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getProgressGradient = (progress) => {
    if (progress === 100) return 'from-green-400 to-green-600';
    if (progress >= 70) return 'from-blue-400 to-blue-600';
    if (progress >= 40) return 'from-yellow-400 to-yellow-600';
    if (progress > 0) return 'from-orange-400 to-orange-600';
    return 'from-gray-300 to-gray-400';
  };

  // 원형 진행률 컴포넌트
  const CircularProgress = ({ progress, size = 120, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-gray-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={progress === 100 ? 'text-green-500' : progress >= 50 ? 'text-blue-500' : 'text-orange-500'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{progress}%</span>
        </div>
      </div>
    );
  };

  // 바 차트 컴포넌트
  const BarChart = ({ data, maxValue }) => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm font-medium text-gray-700 truncate">{item.label}</div>
            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressGradient(item.value)} rounded-lg transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                {item.value}%
              </span>
            </div>
            <div className="w-12 text-right text-sm text-gray-500">{item.count}건</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">개발진행현황</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  차종별 금형 개발 진도율 및 현황 모니터링
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 마지막 업데이트 시간 */}
              {lastUpdated && (
                <div className="text-xs text-gray-500 hidden md:block">
                  마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                </div>
              )}
              {/* 새로고침 버튼 */}
              <button
                onClick={() => loadMolds(true)}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="새로고침"
              >
                <RefreshCw size={18} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {/* 뷰 모드 전환 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'card' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  카드뷰
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  테이블
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">전체 금형</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">개발완료</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">진행중</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">지연</p>
                <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">평균 진도율</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Car className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">차종 수</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.carModelCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 차종별 진도율 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 차종별 진도율 바 차트 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">차종별 평균 진도율</h3>
              </div>
            </div>
            {Object.keys(carModelStats).length > 0 ? (
              <BarChart 
                data={Object.values(carModelStats).map(stat => ({
                  label: stat.name,
                  value: stat.avgProgress,
                  count: stat.total
                }))}
                maxValue={100}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">데이터가 없습니다</div>
            )}
          </div>

          {/* 전체 진도율 원형 차트 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <PieChart className="text-purple-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">전체 개발 현황</h3>
              </div>
            </div>
            <div className="flex items-center justify-around">
              <CircularProgress progress={stats.avgProgress} size={140} strokeWidth={12} />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">완료</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.completed}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">진행중</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.inProgress}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">지연</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.delayed}건</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                  <span className="text-sm text-gray-600">대기</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.total - stats.completed - stats.inProgress}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="금형코드, 품명, 품번으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {carModels.map(model => (
                <button
                  key={model}
                  onClick={() => setSelectedCarModel(model)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCarModel === model
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {model === 'all' ? '전체' : model}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 차종별 상세 현황 */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="space-y-4">
            {Object.entries(carModelStats)
              .filter(([model]) => selectedCarModel === 'all' || model === selectedCarModel)
              .map(([carModel, stat]) => (
              <div key={carModel} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedCarModel(expandedCarModel === carModel ? null : carModel)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Car className="text-indigo-600" size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{carModel}</h3>
                      <p className="text-sm text-gray-500">{stat.total}개 금형</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block w-48">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>진도율</span>
                        <span className="font-semibold text-gray-900">{stat.avgProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${getProgressGradient(stat.avgProgress)} rounded-full transition-all duration-500`}
                          style={{ width: `${stat.avgProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">완료 {stat.completed}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">진행 {stat.inProgress}</span>
                      {stat.delayed > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">지연 {stat.delayed}</span>
                      )}
                    </div>
                    <ChevronDown className={`text-gray-400 transition-transform ${expandedCarModel === carModel ? 'rotate-180' : ''}`} size={20} />
                  </div>
                </button>

                {expandedCarModel === carModel && (
                  <div className="border-t border-gray-100">
                    <div className="divide-y divide-gray-50">
                      {stat.molds
                        .filter(mold => 
                          mold.mold_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mold.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mold.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(mold => (
                        <div key={mold.id} className="border-b border-gray-50 last:border-b-0">
                          <div 
                            className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setExpandedMold(expandedMold === mold.id ? null : mold.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                  <Package className="text-blue-600" size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900">{mold.mold_code}</h4>
                                    {getStatusBadge(mold.status)}
                                    {mold.is_delayed && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{mold.delayed_steps}단계 지연</span>}
                                    {mold.current_step && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">현재: {mold.current_step}</span>}
                                  </div>
                                  <p className="text-sm text-gray-500">{mold.part_name} ({mold.part_number})</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {mold.mold_type} | {mold.cavity_count}CAV | {mold.tonnage}T | {mold.maker_name}
                                    {mold.total_steps > 0 && <span className="ml-2 text-blue-500">| {mold.completed_steps}/{mold.total_steps}단계 완료</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-gray-900">{mold.overall_progress}%</p>
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                                    <div className={`h-full ${getProgressColor(mold.overall_progress)} rounded-full transition-all duration-500`} style={{ width: `${mold.overall_progress}%` }} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); setExpandedMold(expandedMold === mold.id ? null : mold.id); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="14단계 상세보기">
                                    <Eye className={`${expandedMold === mold.id ? 'text-blue-600' : 'text-gray-400'}`} size={18} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); navigate(`/molds/${mold.id}`); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ChevronRight className="text-gray-400" size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {expandedMold === mold.id && (
                            <div className="px-6 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                              <div className="pt-4 pb-2">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-600" />
                                    추진계획 ({mold.total_steps || 14}단계)
                                  </h5>
                                  <div className="flex gap-2 text-xs">
                                    <span className="flex items-center gap-1"><div className="w-3 h-1 bg-green-500 rounded"></div> 완료 {mold.completed_steps || 0}</span>
                                    <span className="flex items-center gap-1"><div className="w-3 h-1 bg-yellow-500 rounded"></div> 진행 {mold.in_progress_steps || 0}</span>
                                    <span className="flex items-center gap-1"><div className="w-3 h-1 bg-red-500 rounded"></div> 지연 {mold.delayed_steps || 0}</span>
                                    <span className="flex items-center gap-1"><div className="w-3 h-1 bg-gray-300 rounded"></div> 대기 {mold.pending_steps || 0}</span>
                                  </div>
                                </div>
                                
                                <div className="overflow-x-auto pb-2">
                                  <div className="flex items-center gap-1 min-w-max">
                                    {(mold.process_steps?.length > 0 ? mold.process_steps : DEVELOPMENT_STAGES).map((step, idx) => {
                                      const stepStatus = step.status || 'pending';
                                      const stepName = step.step_name || step.name;
                                      const stepNumber = step.step_number || step.order;
                                      const category = step.category || 'development';
                                      const statusColors = { completed: 'bg-green-500 text-white', in_progress: 'bg-blue-500 text-white animate-pulse', delayed: 'bg-red-500 text-white', pending: 'bg-gray-200 text-gray-500' };
                                      const categoryColors = { development: 'border-blue-300', nurturing: 'border-green-300', transfer: 'border-purple-300' };
                                      return (
                                        <div key={idx} className="flex items-center">
                                          <div className={`flex flex-col items-center min-w-[60px] border-b-2 ${categoryColors[category] || 'border-gray-300'} pb-1`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${statusColors[stepStatus]}`} title={`${stepName} - ${stepStatus === 'completed' ? '완료' : stepStatus === 'in_progress' ? '진행중' : stepStatus === 'delayed' ? '지연' : '대기'}`}>
                                              {stepStatus === 'completed' ? '✓' : stepNumber}
                                            </div>
                                            <span className="text-[10px] text-gray-600 mt-1 text-center leading-tight max-w-[56px] truncate" title={stepName}>{stepName}</span>
                                          </div>
                                          {idx < (mold.process_steps?.length || DEVELOPMENT_STAGES.length) - 1 && <div className={`w-4 h-0.5 ${stepStatus === 'completed' ? 'bg-green-400' : 'bg-gray-200'}`} />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><div className="w-3 h-1 bg-blue-300 rounded"></div> 개발 (12단계)</span>
                                  <span className="flex items-center gap-1"><div className="w-3 h-1 bg-green-300 rounded"></div> 금형육성</span>
                                  <span className="flex items-center gap-1"><div className="w-3 h-1 bg-purple-300 rounded"></div> 양산이관</span>
                                </div>
                                
                                <div className="mt-3 flex justify-end">
                                  <button onClick={() => navigate(`/mold-development-plan?moldId=${mold.id}`)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                    <Eye size={12} /> 개발계획 상세보기
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금형코드</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">품명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차종</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제작처</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">진도율</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지연</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMolds.map(mold => (
                    <tr key={mold.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/molds/${mold.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium text-gray-900">{mold.mold_code}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-900">{mold.part_name}</p>
                          <p className="text-xs text-gray-500">{mold.part_number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mold.car_model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mold.maker_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(mold.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${getProgressColor(mold.overall_progress)} rounded-full`} style={{ width: `${mold.overall_progress}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{mold.overall_progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mold.is_delayed ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{mold.delay_days}일</span> : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filteredMolds.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Package className="mx-auto text-gray-300" size={48} />
            <p className="mt-4 text-gray-500">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}