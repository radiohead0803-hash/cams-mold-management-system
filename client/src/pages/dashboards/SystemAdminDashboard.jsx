import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Factory, LayoutDashboard, Wrench, QrCode, AlertTriangle, TrendingUp, Eye, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import DashboardHeader from '../../components/DashboardHeader';
import NaverMoldLocationMap from '../../components/NaverMoldLocationMap';
import { ScrappingWidget, RepairWidget, TransferWidget } from '../../components/DashboardWidgets';
import { useDashboardKpi, useDashboardActivities } from '../../hooks/useDashboardKpi';
import { useMoldLocations } from '../../hooks/useMoldLocations';
import { SkeletonDashboard } from '../../components/mobile/Skeleton';

export default function SystemAdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, loading, error, refetch } = useDashboardKpi();
  const { data: activities } = useDashboardActivities(10);
  const { locations, loading: locLoading, error: locError, refetch: refetchLocations } = useMoldLocations();
  const [showMap, setShowMap] = useState(true);
  const [selectedMoldId, setSelectedMoldId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all'); // all | normal | moved
  const [moldPopup, setMoldPopup] = useState(null); // 더블클릭 시 표시할 금형 정보
  const [showKpi, setShowKpi] = useState(true); // KPI 섹션 표시 여부
  const [showManagement, setShowManagement] = useState(true); // 관리 현황 섹션 표시 여부

  // 지도에서 마커 더블클릭 시 금형 정보 팝업 열기
  const handleMoldDoubleClick = useCallback((mold) => {
    setMoldPopup(mold);
  }, []);
  
  // 검색 필터링
  const filteredLocations = locations.filter((loc) => {
    if (!searchTerm) return true;
    const keyword = searchTerm.toLowerCase();
    return (
      loc.moldCode.toLowerCase().includes(keyword) ||
      (loc.moldName || '').toLowerCase().includes(keyword) ||
      loc.plantName.toLowerCase().includes(keyword)
    );
  });

  // 통계 계산
  const total = filteredLocations.length;
  const moved = filteredLocations.filter((l) => l.hasDrift || l.status === 'moved').length;
  const ng = filteredLocations.filter((l) => l.status === 'ng').length;
  const normal = total - moved - ng;

  // 카드 클릭용 필터링
  const statusFilteredLocations = filteredLocations.filter((l) => {
    if (locationFilter === 'normal') return !l.hasDrift && l.status !== 'moved' && l.status !== 'ng';
    if (locationFilter === 'moved') return l.hasDrift || l.status === 'moved';
    return true;
  });
  
  // 시스템 상태는 KPI 기반으로 계산
  const systemStatus = {
    dbStatus: 'healthy',
    gpsServiceStatus: stats?.gpsAbnormal && stats.gpsAbnormal > 0 ? 'warning' : 'healthy'
  };

  // 헤더 통계
  const headerStats = stats ? [
    { label: '전체 금형', value: stats.totalMolds || 0 },
    { label: '양산 중', value: stats.activeMolds || 0 },
    { label: 'Critical 알람', value: stats.criticalAlerts || 0 }
  ] : [];

  // 로딩 상태 - 스켈레톤 UI 적용
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="시스템 관리자 대시보드"
          subtitle="전사 통합 현황 모니터링 및 시스템 관리"
          stats={[]}
        />
        <div className="p-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 로딩 실패</h2>
            <p className="text-gray-600 mb-6">{error || '대시보드 데이터를 불러올 수 없습니다.'}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="시스템 관리자 대시보드"
        subtitle="전사 통합 현황 모니터링 및 시스템 관리"
        stats={headerStats}
      />
      
      <div className="p-6 space-y-6">
        {/* 핵심 KPI 카드 - 6개 그리드 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📊 핵심 지표 (KPI)</h2>
            <button
              onClick={() => setShowKpi(!showKpi)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              {showKpi ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showKpi ? '숨기기' : '펼치기'}
            </button>
          </div>
          {showKpi && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 전체 금형 수 */}
            <button
              onClick={() => navigate('/molds')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs text-gray-500 font-medium">전체 금형 수</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalMolds || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Total Molds</p>
              </div>
              <Factory className="w-10 h-10 text-gray-400" />
            </button>

            {/* 양산 중 금형 */}
            <button
              onClick={() => navigate('/molds?filter=active')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-green-300 transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs text-green-600 font-medium">양산 중 금형</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.activeMolds || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Active Production</p>
              </div>
              <LayoutDashboard className="w-10 h-10 text-green-400" />
            </button>

            {/* 진행 중 수리요청 */}
            <button
              onClick={() => navigate('/molds?filter=repair')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs text-orange-600 font-medium">진행 중 수리</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">{stats.openRepairs || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Open Repairs</p>
              </div>
              <Wrench className="w-10 h-10 text-orange-400" />
            </button>

            {/* 오늘 QR 스캔 */}
            <button
              onClick={() => navigate('/qr-sessions')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs text-purple-600 font-medium">오늘 QR 스캔</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{stats.todayScans || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Today's Scans</p>
              </div>
              <QrCode className="w-10 h-10 text-purple-400" />
            </button>

            {/* 타수 초과 금형 */}
            <button
              onClick={() => navigate('/molds?filter=overshot')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-red-300 transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs text-red-600 font-medium">타수 초과 금형</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{stats.overShotCount || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Over Shot</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </button>

            {/* 정기검사 필요 */}
            <button
              onClick={() => navigate('/molds?filter=inspection')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs text-blue-600 font-medium">정기검사 필요</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.inspectionDueCount || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Inspection Due</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-400" />
            </button>
          </div>
          )}
        </section>

        {/* 신규 기능 위젯 섹션 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 관리 현황</h2>
            <button
              onClick={() => setShowManagement(!showManagement)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              {showManagement ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showManagement ? '숨기기' : '펼치기'}
            </button>
          </div>
          {showManagement && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RepairWidget />
            <TransferWidget />
            <ScrappingWidget />
          </div>
          )}
        </section>

        {/* 금형 위치 현황 카드 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📍 금형 위치 현황</h2>
            <button
              onClick={() => navigate('/mold-location-map')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              title="전체화면 지도 보기"
            >
              <Maximize2 className="w-4 h-4" />
              전체화면
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setLocationFilter('all')}
              className={`rounded-xl bg-white border shadow-sm p-5 text-left w-full transition ${
                locationFilter === 'all' ? 'border-blue-400 shadow-md' : 'border-gray-200'
              }`}
            >
              <p className="text-xs text-gray-500 font-medium">총 금형 수</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{locations.length}</p>
              <p className="mt-1 text-xs text-gray-400">Total Locations</p>
            </button>
            <button
              type="button"
              onClick={() => setLocationFilter('normal')}
              className={`rounded-xl bg-white border shadow-sm p-5 text-left w-full transition ${
                locationFilter === 'normal' ? 'border-green-400 shadow-md' : 'border-green-200'
              }`}
            >
              <p className="text-xs text-green-600 font-medium">정상 위치</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{locations.filter(l => !l.hasDrift).length}</p>
              <p className="mt-1 text-xs text-gray-400">Normal</p>
            </button>
            <button
              type="button"
              onClick={() => setLocationFilter('moved')}
              className={`rounded-xl bg-white border shadow-sm p-5 text-left w-full transition ${
                locationFilter === 'moved' ? 'border-red-400 shadow-md' : 'border-red-200'
              }`}
            >
              <p className="text-xs text-red-600 font-medium">위치 이탈</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{locations.filter(l => l.hasDrift).length}</p>
              <p className="mt-1 text-xs text-gray-400">Moved</p>
            </button>
            <div className="rounded-xl bg-white border border-blue-200 shadow-sm p-5">
              <button
                onClick={() => setShowMap(!showMap)}
                className="w-full text-left"
              >
                <p className="text-xs text-blue-600 font-medium">지도 보기</p>
                <p className="mt-2 text-lg font-bold text-blue-600">{showMap ? '열림' : '닫힘'}</p>
                <p className="mt-1 text-xs text-gray-400">Toggle Map</p>
              </button>
            </div>
          </div>
          {/* 선택된 필터에 따른 금형 목록 */}
          <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-800">
                {locationFilter === 'all' && '전체 금형 목록'}
                {locationFilter === 'normal' && '정상 위치 금형 목록'}
                {locationFilter === 'moved' && '위치 이탈 금형 목록'} ({statusFilteredLocations.length}개)
              </p>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="금형코드 / 이름 / 공장 검색..."
                className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div
              className={`divide-y divide-gray-100 text-sm ${
                statusFilteredLocations.length > 5 ? 'max-h-56 overflow-y-auto' : ''
              }`}
            >
              {statusFilteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedMoldId(selectedMoldId === loc.id ? null : loc.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-blue-50 ${
                    selectedMoldId === loc.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <div className="sm:w-1/3">
                      <p className="font-medium text-gray-900">{loc.moldCode}</p>
                      <p className="text-xs text-gray-500 truncate">{loc.moldName || '-'}</p>
                    </div>
                    <div className="sm:w-1/3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">현재</span>
                      <span className="ml-1">{loc.plantName}</span>
                    </div>
                    <div className="sm:w-1/3 text-[11px] text-gray-400">
                      <span className="font-medium text-gray-600">기본</span>
                      <span className="ml-1">{loc.registeredLocation || '미등록'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        loc.hasDrift || loc.status === 'moved'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {loc.hasDrift || loc.status === 'moved' ? '이탈' : '정상'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/molds/specifications/${loc.id}`);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </button>
              ))}
              {statusFilteredLocations.length === 0 && (
                <p className="text-xs text-gray-400 py-3 text-center">해당 조건의 금형 위치가 없습니다.</p>
              )}
            </div>
          </div>
        </section>

        {/* NG 금형 별도 강조 */}
        {stats.ngMolds > 0 && (
          <section>
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">NG 금형 발생</p>
                    <p className="text-xs text-red-700">즉시 조치가 필요한 금형이 있습니다.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/molds?status=ng')}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                >
                  {stats.ngMolds || 0}개 확인하기
                </button>
              </div>
            </div>
          </section>
        )}


        {/* 금형 위치 지도 */}
        {showMap && (
          <section>
            {locLoading && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">위치 데이터 로딩 중...</p>
                  </div>
                </div>
              </div>
            )}
            {locError && !locLoading && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <p>{locError}</p>
                </div>
              </div>
            )}
            {!locLoading && !locError && (
              <div className="bg-white rounded-xl shadow" style={{ height: '500px' }}>
                <NaverMoldLocationMap 
                  locations={selectedMoldId ? filteredLocations.filter(loc => loc.id === selectedMoldId) : filteredLocations} 
                  selectedMoldId={selectedMoldId}
                  onMoldDoubleClick={handleMoldDoubleClick}
                />
              </div>
            )}
          </section>
        )}

        {/* 시스템 상태 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 시스템 상태</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SystemStatusCard title="활성 사용자" value={stats.totalUsers || 0} status="healthy" unit="명" />
            <SystemStatusCard title="금일 QR 스캔" value={stats.todayQRScans || 0} status="healthy" unit="회" />
            <SystemStatusCard title="데이터베이스" value="정상" status={systemStatus.dbStatus} />
            <SystemStatusCard title="GPS 서비스" value="주의" status={systemStatus.gpsServiceStatus} />
          </div>
        </section>

        {/* 실시간 활동 피드 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📡 실시간 활동 피드</h3>
          <div className="space-y-3">
            {(activities || []).map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </section>

        {/* 빠른 작업 메뉴 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard 
              icon="👥" 
              title="사용자 관리" 
              description="사용자 등록/수정"
              link="/users/internal"
            />
            <QuickActionCard 
              icon="📋" 
              title="점검표 관리" 
              description="체크리스트 설정"
              link="/standard-document-master"
            />
            <QuickActionCard 
              icon="🔔" 
              title="기준값 설정" 
              description="타수/점검 기준"
              link="/dashboard/system-admin/rules"
            />
            <QuickActionCard 
              icon="📊" 
              title="통계 리포트" 
              description="전사 통계 조회"
              link="/reports"
            />
          </div>
        </section>

        {/* 금형 정보 팝업 모달 */}
        {moldPopup && (
          <MoldInfoPopup 
            mold={moldPopup} 
            onClose={() => setMoldPopup(null)}
            onViewDetail={() => {
              navigate(`/molds/specifications/${moldPopup.id}`);
              setMoldPopup(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// 금형 정보 팝업 컴포넌트
function MoldInfoPopup({ mold, onClose, onViewDetail }) {
  const statusColor = mold.status === 'ng' ? 'red' : mold.status === 'moved' ? 'orange' : 'green';
  const statusText = mold.status === 'ng' ? 'NG' : mold.status === 'moved' ? '이탈' : '정상';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{mold.moldCode}</h2>
              <p className="text-blue-100 text-sm mt-1">{mold.moldName || '금형'}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-4">
          {/* 상태 배지 */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-700`}>
              상태: {statusText}
            </span>
            {mold.hasDrift && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                ⚠️ 위치 이탈
              </span>
            )}
          </div>

          {/* 정보 그리드 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">현재 위치</p>
              <p className="font-semibold text-gray-900">{mold.plantName || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">기본 위치</p>
              <p className="font-semibold text-gray-900">{mold.registeredLocation || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">위도</p>
              <p className="font-semibold text-gray-900">{mold.lat?.toFixed(6) || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">경도</p>
              <p className="font-semibold text-gray-900">{mold.lng?.toFixed(6) || '-'}</p>
            </div>
          </div>

          {/* 추가 정보 */}
          {mold.lastUpdated && (
            <div className="text-xs text-gray-500 text-center">
              마지막 업데이트: {new Date(mold.lastUpdated).toLocaleString('ko-KR')}
            </div>
          )}
        </div>

        {/* 푸터 버튼 */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            닫기
          </button>
          <button
            onClick={onViewDetail}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            상세보기
          </button>
        </div>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ title, value, icon, color, unit = '', onClick }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  const Component = onClick ? 'button' : 'div';
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';

  return (
    <Component 
      onClick={onClick}
      className={`bg-white rounded-lg shadow border-l-4 ${colors[color]} p-6 ${clickableClass} w-full text-left`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}{unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </Component>
  );
}

// 알람 아이템 컴포넌트
function AlertItem({ level, count, label, description }) {
  const styles = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    major: 'bg-orange-50 border-orange-200 text-orange-700',
    minor: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  };

  const icons = {
    critical: '🔴',
    major: '🟡',
    minor: '🟢'
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${styles[level]}`}>
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icons[level]}</span>
        <div>
          <p className="font-semibold">{label}: {count}건</p>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
      <button className="text-sm font-medium hover:underline">상세보기</button>
    </div>
  );
}

// 시스템 상태 카드
function SystemStatusCard({ title, value, status, unit = '' }) {
  const statusStyles = {
    healthy: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    error: 'bg-red-50 border-red-200 text-red-700'
  };

  const statusIcons = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className={`p-4 border rounded-lg ${statusStyles[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-xl">{statusIcons[status]}</span>
      </div>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString() : value}{unit}
      </p>
    </div>
  );
}

// 활동 아이템 컴포넌트
function ActivityItem({ activity }) {
  const typeStyles = {
    critical: 'bg-red-50 border-l-4 border-red-500',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500',
    success: 'bg-green-50 border-l-4 border-green-500',
    info: 'bg-blue-50 border-l-4 border-blue-500'
  };

  const typeIcons = {
    critical: '🔴',
    warning: '🟡',
    success: '🟢',
    info: '🔵'
  };

  return (
    <div className={`p-4 rounded-lg ${typeStyles[activity.type]}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{typeIcons[activity.type]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">{activity.title}</p>
            <span className="text-sm text-gray-500">[{activity.time}]</span>
          </div>
          <p className="text-sm text-gray-700">{activity.description}</p>
          <p className="text-sm text-gray-600 mt-1">→ {activity.action}</p>
        </div>
      </div>
    </div>
  );
}

// 빠른 작업 카드
function QuickActionCard({ icon, title, description, link }) {
  return (
    <Link 
      to={link}
      className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
