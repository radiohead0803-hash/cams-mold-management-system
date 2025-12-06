import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Settings, ChevronDown, Upload, Eye, 
  CheckCircle, MapPin, TrendingUp, User, AlertTriangle,
  Thermometer, Gauge, Clock, Box, Wrench, FileText,
  ClipboardCheck, Calendar, Activity, Camera, Shield
} from 'lucide-react';
import { moldSpecificationAPI, moldAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function MoldDetailNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // QR 스캔으로 접속했는지 확인
  const isQRAccess = searchParams.get('qr') === 'true';
  
  const [mold, setMold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  // 드롭다운 메뉴 정의
  const menuItems = {
    moldInfo: { 
      label: '금형정보', 
      color: 'bg-purple-500',
      items: ['금형개발', '금형사양', '러너관리', '변경이력 현황표']
    },
    injection: { 
      label: '사출정보', 
      color: 'bg-red-500',
      items: ['사출조건 관리', '사출조건 수정관리', '러너관리', '변경이력 현황표']
    },
    repair: { 
      label: '금형수리', 
      color: 'bg-orange-500',
      items: ['수리요청', '금형수리 현황표', '금형수리 진행현황']
    },
    inspection: { 
      label: '금형점검', 
      color: 'bg-green-500',
      items: ['일상점검', '정기점검', '숏팅점검', '세척점검', '승인']
    },
    transfer: { 
      label: '금형이관', 
      color: 'bg-cyan-500',
      items: ['이관요청', '이관현황', '이관 체크리스트']
    }
  };

  useEffect(() => {
    loadMoldData();
  }, [id]);

  const loadMoldData = async () => {
    try {
      setLoading(true);
      // mold_specifications에서 데이터 로드
      const response = await moldSpecificationAPI.getById(id);
      setMold(response.data.data);
    } catch (err) {
      console.error('Failed to load mold:', err);
      // molds 테이블에서 시도
      try {
        const moldResponse = await moldAPI.getById(id);
        setMold(moldResponse.data.data);
      } catch (err2) {
        console.error('Failed to load from molds:', err2);
      }
    } finally {
      setLoading(false);
    }
  };

  // 사용자 유형에 따른 표시 항목 결정
  const getVisibleSections = () => {
    const userType = user?.user_type || 'plant';
    
    if (isQRAccess) {
      // QR 스캔 접속: 현장 작업자용 간소화 뷰
      return ['status', 'quickActions', 'alerts'];
    }
    
    switch (userType) {
      case 'system_admin':
      case 'mold_developer':
        // 본사: 모든 정보 표시
        return ['images', 'status', 'alerts', 'quickActions', 'injection', 'specs', 'repair'];
      case 'maker':
        // 제작처: 제작 관련 정보
        return ['images', 'status', 'specs', 'repair'];
      case 'plant':
        // 생산처: 생산 관련 정보
        return ['images', 'status', 'alerts', 'quickActions', 'injection'];
      default:
        return ['status', 'quickActions'];
    }
  };

  const visibleSections = getVisibleSections();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!mold) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-gray-600 mb-4">금형 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const moldCode = mold.mold_code || mold.part_number || `M-${id}`;
  const moldName = mold.mold_name || mold.part_name || '금형';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Settings className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{moldCode}</h1>
                  <p className="text-sm text-gray-500">{moldName}</p>
                </div>
              </div>
            </div>

            {/* Center: Menu Dropdowns */}
            {!isQRAccess && (
              <div className="hidden lg:flex items-center gap-2">
                {Object.entries(menuItems).map(([key, menu]) => (
                  <div key={key} className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === key ? null : key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-1 ${menu.color}`}
                    >
                      {menu.label}
                      <ChevronDown size={14} />
                    </button>
                    {activeMenu === key && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border py-2 min-w-[160px] z-50">
                        {menu.items.map((item, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                            onClick={() => setActiveMenu(null)}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Right: User Info */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <User size={20} className="text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 hidden sm:block">
                {isQRAccess ? 'QR 접속' : user?.name || '사용자'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 금형 이미지 섹션 */}
        {visibleSections.includes('images') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 금형 이미지 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Camera className="text-purple-600" size={20} />
                <h3 className="font-semibold text-gray-800">금형 이미지</h3>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {mold.part_images?.url ? (
                  <img src={mold.part_images.url} alt="금형" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Camera size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">이미지 없음</p>
                  </div>
                )}
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Upload size={16} />
                이미지 업로드
                <Eye size={16} className="ml-4 opacity-70" />
              </button>
            </div>

            {/* 제품 이미지 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Box className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-800">제품 이미지</h3>
              </div>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Box size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">제품 이미지</p>
                </div>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Upload size={16} />
                이미지 업로드
                <Eye size={16} className="ml-4 opacity-70" />
              </button>
            </div>
          </div>
        )}

        {/* 현재 상태 섹션 */}
        {visibleSections.includes('status') && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 현재 상태 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">현재 상태</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {mold.status === 'active' ? '사용중' : mold.status || '대기'}
              </p>
            </div>

            {/* 위치 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin className="text-purple-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">위치</span>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {mold.current_location || mold.location || 'A구역-01'}
              </p>
            </div>

            {/* 보수 진행률 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-yellow-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">보수 진행률</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <span className="text-sm font-bold text-gray-700">95%</span>
              </div>
            </div>

            {/* 담당자 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">담당자</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {mold.manager_name || '김철수'}
              </p>
            </div>
          </div>
        )}

        {/* 알림 & 바로가기 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 금형관리 알림 */}
          {visibleSections.includes('alerts') && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="font-semibold text-gray-800">금형관리 알림</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="text-red-500" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">샷수 임계치 도달</p>
                    <p className="text-xs text-red-600">현재 샷수가 95.2%에 도달했습니다. 교체를 고려하세요.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Thermometer className="text-orange-500" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">작동 온도 주의</p>
                    <p className="text-xs text-orange-600">금형 온도가 설정값보다 5% 높습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 금형점검 바로가기 */}
          {visibleSections.includes('quickActions') && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <ClipboardCheck className="text-green-600" size={20} />
                <h3 className="font-semibold text-gray-800">금형점검 바로가기</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate(`/checklist/daily?moldId=${id}`)}
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow text-center"
                >
                  <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">일상점검</span>
                </button>
                <button 
                  onClick={() => navigate(`/inspection/periodic?moldId=${id}`)}
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow text-center"
                >
                  <Calendar className="mx-auto mb-2 text-blue-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">정기점검</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow text-center">
                  <Activity className="mx-auto mb-2 text-purple-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">숏팅점검</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl hover:shadow-md transition-shadow text-center">
                  <Shield className="mx-auto mb-2 text-cyan-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">세척점검</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 사출조건 관리 */}
        {visibleSections.includes('injection') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="text-red-500" size={20} />
                <h3 className="font-semibold text-gray-800">사출조건 관리</h3>
              </div>
              <button className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors">
                상세보기
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사출온도</p>
                <p className="text-xl font-bold text-red-600">{mold.injection_temp || '220'}°C</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사출압력</p>
                <p className="text-xl font-bold text-orange-600">{mold.injection_pressure || '80'} MPa</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사출속도</p>
                <p className="text-xl font-bold text-blue-600">{mold.injection_speed || '50'} mm/s</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사이클타임</p>
                <p className="text-xl font-bold text-green-600">{mold.cycle_time || '35'} sec</p>
              </div>
            </div>
          </div>
        )}

        {/* 금형사양 */}
        {visibleSections.includes('specs') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="text-green-600" size={20} />
                <h3 className="font-semibold text-gray-800">금형사양</h3>
              </div>
              <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors">
                상세보기
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">재질</p>
                <p className="text-lg font-bold text-gray-700">{mold.material || 'SKD61'}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">중량</p>
                <p className="text-lg font-bold text-gray-700">{mold.weight || '2.5'}kg</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">치수</p>
                <p className="text-lg font-bold text-gray-700">{mold.dimensions || '300x200x150'}mm</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">캐비티</p>
                <p className="text-lg font-bold text-gray-700">{mold.cavity_count || mold.cavity || '4'}개</p>
              </div>
            </div>
          </div>
        )}

        {/* 금형수리 진행현황 */}
        {visibleSections.includes('repair') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">금형수리 진행현황</h3>
              </div>
              <button className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors">
                상세보기
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                {/* 워크플로우 스텝 */}
                {[
                  { label: '요청접수', status: 'completed', icon: FileText },
                  { label: '작업배정', status: 'completed', icon: User },
                  { label: '수리진행', status: 'current', icon: Wrench },
                  { label: '검수완료', status: 'pending', icon: CheckCircle },
                  { label: '최종승인', status: 'pending', icon: Shield }
                ].map((step, idx, arr) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100' :
                        step.status === 'current' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <step.icon className={`${
                          step.status === 'completed' ? 'text-green-600' :
                          step.status === 'current' ? 'text-blue-600' :
                          'text-gray-400'
                        }`} size={20} />
                      </div>
                      <span className={`text-xs mt-2 ${
                        step.status === 'completed' ? 'text-green-600 font-medium' :
                        step.status === 'current' ? 'text-blue-600 font-medium' :
                        'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
