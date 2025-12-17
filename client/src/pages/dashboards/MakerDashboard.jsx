import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { makerSpecificationAPI } from '../../lib/api';
import { 
  Package, Settings, Wrench, CheckCircle, Clock, AlertTriangle,
  Search, Filter, ChevronRight, Edit3, Eye, RefreshCw
} from 'lucide-react';

export default function MakerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [molds, setMolds] = useState([]);
  const [stats, setStats] = useState({
    design: 0,
    machining: 0,
    assembly: 0,
    trialWaiting: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    weekCompleted: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 대시보드 통계 로드
      const statsResponse = await makerSpecificationAPI.getDashboardStats().catch(() => null);
      if (statsResponse?.data?.data) {
        setStats(statsResponse.data.data);
      }
      
      // 금형 목록 로드
      const moldsResponse = await makerSpecificationAPI.getAll().catch(() => null);
      if (moldsResponse?.data?.data) {
        setMolds(moldsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load maker dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 금형 목록
  const filteredMolds = molds.filter(mold => {
    const matchesFilter = filter === 'all' || mold.status === filter || mold.current_stage === filter;
    const matchesSearch = !searchTerm || 
      mold.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.car_model?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 헤더 통계
  const headerStats = [
    { label: '진행 중', value: stats.inProgress || 0 },
    { label: '완료', value: stats.completed || 0 },
    { label: '이번 주 완료', value: stats.weekCompleted || 0 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">제작처 금형 관리</h1>
              <p className="text-blue-100 mt-1">{user?.company_name || '제작처'} - 담당 금형 현황</p>
            </div>
            <div className="flex items-center space-x-4">
              {headerStats.map((stat, idx) => (
                <div key={idx} className="text-center px-4 py-2 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-blue-100">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 제작 단계별 현황 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            제작 단계별 현황
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StageCard 
              title="설계" 
              count={stats.design} 
              color="blue" 
              icon={<Settings className="w-6 h-6" />}
              onClick={() => setFilter('설계')}
              active={filter === '설계'}
            />
            <StageCard 
              title="가공" 
              count={stats.machining} 
              color="orange" 
              icon={<Wrench className="w-6 h-6" />}
              onClick={() => setFilter('가공')}
              active={filter === '가공'}
            />
            <StageCard 
              title="조립" 
              count={stats.assembly} 
              color="purple" 
              icon={<Package className="w-6 h-6" />}
              onClick={() => setFilter('조립')}
              active={filter === '조립'}
            />
            <StageCard 
              title="시운전대기" 
              count={stats.trialWaiting} 
              color="green" 
              icon={<Clock className="w-6 h-6" />}
              onClick={() => setFilter('시운전대기')}
              active={filter === '시운전대기'}
            />
          </div>
        </section>

        {/* 검색 및 필터 */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="품번, 품명, 차종 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </button>
              <span className="text-sm text-gray-500">
                총 {filteredMolds.length}건
              </span>
            </div>
          </div>
        </section>

        {/* 금형 목록 */}
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">담당 금형 목록</h3>
          </div>
          
          {filteredMolds.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' ? '검색 결과가 없습니다.' : '담당 금형이 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMolds.map(mold => (
                <MoldRow key={mold.id} mold={mold} onView={() => navigate(`/maker/mold/${mold.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// 단계별 카드
function StageCard({ title, count, color, icon, onClick, active }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    green: 'bg-green-50 border-green-200 text-green-600'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all ${
        active 
          ? 'ring-2 ring-offset-2 ring-blue-500 ' + colorClasses[color]
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{count}개</p>
        </div>
        <div className={active ? colorClasses[color] : 'text-gray-400'}>
          {icon}
        </div>
      </div>
    </button>
  );
}

// 금형 목록 행
function MoldRow({ mold, onView }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const statusLabels = {
    pending: '대기',
    in_progress: '진행중',
    completed: '완료'
  };

  const stageColors = {
    '설계': 'bg-blue-50 text-blue-700',
    '가공': 'bg-orange-50 text-orange-700',
    '조립': 'bg-purple-50 text-purple-700',
    '시운전대기': 'bg-green-50 text-green-700'
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-semibold text-gray-900">
                {mold.part_number || mold.specification?.part_number || '-'}
              </p>
              <p className="text-sm text-gray-600">
                {mold.part_name || mold.specification?.part_name || '-'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">차종</p>
            <p className="font-medium text-gray-900">
              {mold.car_model || mold.specification?.car_model || '-'}
            </p>
          </div>
          
          <div className="text-center w-20">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[mold.current_stage] || 'bg-gray-100 text-gray-700'}`}>
              {mold.current_stage || '-'}
            </span>
          </div>
          
          <div className="text-center w-24">
            <div className="flex items-center space-x-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${mold.production_progress || 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-8">{mold.production_progress || 0}%</span>
            </div>
          </div>
          
          <div className="text-center w-16">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[mold.status] || 'bg-gray-100 text-gray-700'}`}>
              {statusLabels[mold.status] || mold.status || '-'}
            </span>
          </div>
          
          <div className="text-right w-24">
            <p className="text-xs text-gray-500">납기</p>
            <p className="text-sm font-medium text-gray-900">
              {mold.specification?.target_delivery_date 
                ? new Date(mold.specification.target_delivery_date).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
          
          <button
            onClick={onView}
            className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium mr-1">상세</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
