import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { 
  Search, Package, ArrowLeft, ClipboardList, Wrench, Truck, 
  ChevronRight, Factory, Calendar, Hash, RefreshCw, X, Filter
} from 'lucide-react';

const TASK_CONFIG = {
  'daily-inspection': {
    label: '일상점검',
    icon: ClipboardList,
    color: 'blue',
    description: '금형을 선택하여 일상점검을 시작합니다',
    getTargetPath: (moldId) => `/checklist/daily?moldId=${moldId}`
  },
  'periodic-inspection': {
    label: '정기점검',
    icon: ClipboardList,
    color: 'purple',
    description: '금형을 선택하여 정기점검을 시작합니다',
    getTargetPath: (moldId) => `/inspection/periodic?moldId=${moldId}`
  },
  'repair-request': {
    label: '수리 요청',
    icon: Wrench,
    color: 'orange',
    description: '수리가 필요한 금형을 선택하세요',
    getTargetPath: (moldId) => `/repair-request-form?moldId=${moldId}`
  },
  'transfer': {
    label: '이관 관리',
    icon: Truck,
    color: 'green',
    description: '이관할 금형을 선택하세요',
    getTargetPath: (moldId) => `/transfers/new?moldId=${moldId}`
  }
};

export default function PlantMoldSelect() {
  const { task } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const config = TASK_CONFIG[task];

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mold-specifications', {
        params: { limit: 500 }
      });
      if (response.data.success) {
        const data = response.data.data;
        // API는 { total, items } 형식으로 반환
        const items = Array.isArray(data) ? data : (data?.items || []);
        setMolds(items);
      }
    } catch (error) {
      console.error('Failed to load molds:', error);
      // fallback: molds API
      try {
        const res2 = await api.get('/molds', { params: { limit: 500 } });
        if (res2.data?.data) {
          const items = Array.isArray(res2.data.data) ? res2.data.data : (res2.data.data.items || []);
          setMolds(items);
        }
      } catch (e2) {
        console.error('Fallback molds load also failed:', e2);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      (mold.part_number || mold.mold_code || '').toLowerCase().includes(term) ||
      (mold.part_name || mold.mold_name || '').toLowerCase().includes(term) ||
      (mold.car_model || '').toLowerCase().includes(term);
    
    const matchStatus = statusFilter === 'all' || 
      mold.status === statusFilter ||
      (statusFilter === 'active' && ['active', 'in_production', 'production'].includes(mold.status));
    
    return matchSearch && matchStatus;
  });

  const handleSelectMold = (mold) => {
    if (!config) return;
    const moldId = mold.id;
    navigate(config.getTargetPath(moldId));
  };

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-500">알 수 없는 업무 유형입니다.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline">뒤로 가기</button>
      </div>
    );
  }

  const IconComponent = config.icon;
  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600', btnBg: 'bg-blue-600 hover:bg-blue-700', headerBg: 'from-blue-600 to-blue-800' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600', btnBg: 'bg-purple-600 hover:bg-purple-700', headerBg: 'from-purple-600 to-purple-800' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600', btnBg: 'bg-orange-600 hover:bg-orange-700', headerBg: 'from-orange-600 to-orange-800' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600', btnBg: 'bg-green-600 hover:bg-green-700', headerBg: 'from-green-600 to-green-800' }
  };
  const c = colorMap[config.color] || colorMap.blue;

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className={`bg-gradient-to-r ${c.headerBg} text-white rounded-xl p-6 mb-6`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/plant')} className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <IconComponent size={28} />
              <h1 className="text-2xl font-bold">{config.label}</h1>
            </div>
            <p className="text-white/80 mt-1">{config.description}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">검색 결과</p>
            <p className="text-3xl font-bold">{filteredMolds.length}</p>
          </div>
        </div>
      </div>

      {/* 검색/필터 바 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="품번, 품명, 차종으로 검색..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="active">가동 중</option>
              <option value="maintenance">정비 중</option>
              <option value="idle">유휴</option>
            </select>
          </div>

          {/* 새로고침 */}
          <button 
            onClick={loadMolds} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>
      </div>

      {/* 금형 목록 */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <RefreshCw size={32} className="animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">금형 목록을 불러오는 중...</p>
        </div>
      ) : filteredMolds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
          <p className="text-gray-400 text-sm mt-1">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMolds.map((mold) => (
            <MoldCard 
              key={mold.id} 
              mold={mold} 
              onSelect={handleSelectMold}
              colorConfig={c}
              taskLabel={config.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MoldCard({ mold, onSelect, colorConfig, taskLabel }) {
  const c = colorConfig;
  const statusLabels = {
    active: '가동 중', in_production: '생산 중', production: '생산 중',
    maintenance: '정비 중', idle: '유휴', ng: 'NG', 
    development: '개발', trial: '시운전', pending: '대기'
  };
  const statusColors = {
    active: 'bg-green-100 text-green-700', in_production: 'bg-green-100 text-green-700', production: 'bg-green-100 text-green-700',
    maintenance: 'bg-yellow-100 text-yellow-700', idle: 'bg-gray-100 text-gray-600',
    ng: 'bg-red-100 text-red-700', development: 'bg-blue-100 text-blue-700',
    trial: 'bg-purple-100 text-purple-700', pending: 'bg-gray-100 text-gray-600'
  };

  const partNumber = mold.part_number || mold.mold_code || '-';
  const partName = mold.part_name || mold.mold_name || '-';
  const carModel = mold.car_model || '-';
  const status = mold.status || 'active';
  const tonnage = mold.tonnage || '-';
  const currentShots = mold.current_shots || mold.total_shots || 0;
  const material = mold.material || mold.ms_spec || '-';

  return (
    <button
      onClick={() => onSelect(mold)}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 text-left group"
    >
      <div className="flex items-center gap-4">
        {/* 좌측: 금형 아이콘 */}
        <div className={`w-12 h-12 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Package size={24} className={c.icon} />
        </div>

        {/* 중앙: 금형 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900 text-sm">{partNumber}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
              {statusLabels[status] || status}
            </span>
          </div>
          <p className="text-sm text-gray-700 truncate">{partName}</p>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Factory size={12} />
              {carModel}
            </span>
            {tonnage !== '-' && (
              <span className="flex items-center gap-1">
                <Hash size={12} />
                {tonnage}T
              </span>
            )}
            {currentShots > 0 && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {currentShots.toLocaleString()}타
              </span>
            )}
            {material !== '-' && (
              <span className="text-purple-500">{material}</span>
            )}
          </div>
        </div>

        {/* 우측: 업무 시작 버튼 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`hidden md:inline-block px-3 py-1.5 text-xs font-medium rounded-lg ${c.bg} ${c.text} group-hover:${c.btnBg} group-hover:text-white transition`}>
            {taskLabel} 시작
          </span>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition" />
        </div>
      </div>
    </button>
  );
}
