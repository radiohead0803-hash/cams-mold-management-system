import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, MapPin, Factory, 
  AlertTriangle, CheckCircle, RefreshCw, List,
  ChevronDown, ChevronUp, Eye, X
} from 'lucide-react';
import NaverMoldLocationMap from '../components/NaverMoldLocationMap';
import { useMoldLocations } from '../hooks/useMoldLocations';

export default function MoldLocationMapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locations, loading, error, refetch } = useMoldLocations();
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [plantFilter, setPlantFilter] = useState(searchParams.get('plant') || 'all');
  const [selectedMoldId, setSelectedMoldId] = useState(null);
  const [showList, setShowList] = useState(true);
  const [selectedMold, setSelectedMold] = useState(null);

  // 공장 목록 추출
  const plants = [...new Set(locations.map(loc => loc.plantName).filter(Boolean))];

  // 필터링된 금형 목록
  const filteredLocations = locations.filter(loc => {
    // 검색어 필터
    if (searchTerm) {
      const keyword = searchTerm.toLowerCase();
      const matchCode = loc.moldCode?.toLowerCase().includes(keyword);
      const matchName = loc.moldName?.toLowerCase().includes(keyword);
      const matchPlant = loc.plantName?.toLowerCase().includes(keyword);
      if (!matchCode && !matchName && !matchPlant) return false;
    }
    
    // 상태 필터
    if (statusFilter === 'normal' && (loc.hasDrift || loc.status === 'moved')) return false;
    if (statusFilter === 'moved' && !loc.hasDrift && loc.status !== 'moved') return false;
    
    // 공장 필터
    if (plantFilter !== 'all' && loc.plantName !== plantFilter) return false;
    
    return true;
  });

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (plantFilter !== 'all') params.set('plant', plantFilter);
    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, plantFilter, setSearchParams]);

  // 금형 선택 시 상세 정보 로드
  useEffect(() => {
    if (selectedMoldId) {
      const mold = locations.find(loc => loc.id === selectedMoldId);
      setSelectedMold(mold);
    } else {
      setSelectedMold(null);
    }
  }, [selectedMoldId, locations]);

  // 금형 더블클릭 시 상세 페이지로 이동
  const handleMoldDoubleClick = useCallback((mold) => {
    navigate(`/molds/specifications/${mold.id}`);
  }, [navigate]);

  // 통계
  const stats = {
    total: locations.length,
    normal: locations.filter(l => !l.hasDrift && l.status !== 'moved').length,
    moved: locations.filter(l => l.hasDrift || l.status === 'moved').length,
    filtered: filteredLocations.length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">금형 위치 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                금형 위치 지도
              </h1>
              <p className="text-sm text-gray-500">전체 금형의 실시간 위치를 확인합니다</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 통계 배지 */}
            <div className="hidden md:flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                전체 {stats.total}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                정상 {stats.normal}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                이탈 {stats.moved}
              </span>
            </div>
            
            <button
              onClick={refetch}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => setShowList(!showList)}
              className={`p-2 rounded-lg transition ${showList ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="목록 표시/숨기기"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex min-h-0">
        {/* 왼쪽 패널 - 금형 목록 */}
        {showList && (
          <div className="w-96 bg-white border-r border-gray-200 flex flex-col min-h-0">
            {/* 검색 및 필터 */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-3">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="금형코드, 이름, 공장 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* 필터 */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 상태</option>
                  <option value="normal">정상 위치</option>
                  <option value="moved">위치 이탈</option>
                </select>
                
                <select
                  value={plantFilter}
                  onChange={(e) => setPlantFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 공장</option>
                  {plants.map(plant => (
                    <option key={plant} value={plant}>{plant}</option>
                  ))}
                </select>
              </div>
              
              {/* 필터 결과 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  검색 결과: <span className="font-medium text-gray-900">{filteredLocations.length}</span>개
                </span>
                {(searchTerm || statusFilter !== 'all' || plantFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPlantFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>
            
            {/* 금형 목록 - 최대 10개만 표시 */}
            <div className="flex-1 overflow-y-auto max-h-[400px]">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredLocations.slice(0, 10).map((loc) => {
                    const isSelected = selectedMoldId === loc.id;
                    const isMoved = loc.hasDrift || loc.status === 'moved';
                    
                    return (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedMoldId(isSelected ? null : loc.id)}
                        onDoubleClick={() => handleMoldDoubleClick(loc)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {loc.moldCode}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isMoved 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {isMoved ? '이탈' : '정상'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {loc.moldName || '-'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <Factory className="w-3 h-3" />
                              <span>{loc.plantName || '미지정'}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/molds/specifications/${loc.id}`);
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        
                        {/* 선택된 금형 상세 정보 */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">현재 위치</span>
                              <span className="text-gray-900">{loc.plantName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">기본 위치</span>
                              <span className="text-gray-900">{loc.registeredLocation || '미등록'}</span>
                            </div>
                            {loc.latitude && loc.longitude && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">GPS 좌표</span>
                                <span className="text-gray-900 text-xs">
                                  {Number(loc.latitude).toFixed(6)}, {Number(loc.longitude).toFixed(6)}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/molds/specifications/${loc.id}`);
                              }}
                              className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                              상세 정보 보기
                            </button>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {filteredLocations.length > 10 && (
                <div className="p-3 text-center text-sm text-gray-500 border-t">
                  외 {filteredLocations.length - 10}개 더 (검색으로 필터링 가능)
                </div>
              )}
            </div>
          </div>
        )}

        {/* 오른쪽 - 지도 */}
        <div className="flex-1 relative min-h-[400px]">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">위치 데이터를 불러올 수 없습니다</p>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : (
            <NaverMoldLocationMap 
              locations={filteredLocations}
              selectedMoldId={selectedMoldId}
              onMoldDoubleClick={handleMoldDoubleClick}
              className="w-full h-full"
            />
          )}
          
          {/* 지도 위 범례 */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
            <p className="font-medium text-gray-700 mb-2">범례</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">정상 위치</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">위치 이탈</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-300"></div>
                <span className="text-gray-600">선택된 금형</span>
              </div>
            </div>
          </div>
          
          {/* 선택된 금형 정보 (모바일용) */}
          {selectedMold && !showList && (
            <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedMold.moldCode}</h3>
                  <p className="text-sm text-gray-500">{selectedMold.moldName}</p>
                </div>
                <button
                  onClick={() => setSelectedMoldId(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedMold.hasDrift || selectedMold.status === 'moved'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {selectedMold.hasDrift || selectedMold.status === 'moved' ? '위치 이탈' : '정상'}
                </span>
                <span className="text-sm text-gray-500">{selectedMold.plantName}</span>
              </div>
              <button
                onClick={() => navigate(`/molds/specifications/${selectedMold.id}`)}
                className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                상세 정보 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
