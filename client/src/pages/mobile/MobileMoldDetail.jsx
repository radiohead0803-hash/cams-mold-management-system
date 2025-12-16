import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'
import { moldSpecificationAPI } from '../../lib/api'
import { 
  ArrowLeft, QrCode, Settings, Wrench, ClipboardCheck, 
  Truck, BarChart3, AlertTriangle, CheckCircle, Clock,
  Camera, FileText, MapPin, Activity, Box, Thermometer,
  User, Shield, Calendar, ChevronRight, Upload, Eye,
  Navigation, Gauge
} from 'lucide-react'
import { BottomCTA, GPSStatus, SessionTimer } from '../../components/mobile/MobileLayout'
import { recentActions } from '../../utils/mobileStorage'
import useGPSMonitor, { GPSOutOfRangeAlert } from '../../hooks/useGPSMonitor'

/**
 * 모바일 금형 상세 페이지
 * 역할별로 다른 정보와 기능 제공
 */
export default function MobileMoldDetail() {
  const { moldId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [mold, setMold] = useState(location.state?.mold || null)
  const [loading, setLoading] = useState(!mold)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'work' | 'history'
  const [showQRCode, setShowQRCode] = useState(false)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [sessionExpires, setSessionExpires] = useState(null)
  
  // 사용자 역할
  const role = user?.user_type || user?.role || location.state?.role || 'plant'

  // GPS 모니터링 (금형 위치 기준 500m 허용)
  const allowedLocation = mold?.gps_latitude && mold?.gps_longitude 
    ? { latitude: mold.gps_latitude, longitude: mold.gps_longitude }
    : null
  
  const { 
    currentPosition, 
    isOutOfRange, 
    distance, 
    accuracy: gpsAccuracy 
  } = useGPSMonitor({
    allowedLocation,
    allowedRadius: 500,
    enabled: !!allowedLocation,
    onOutOfRange: (data) => {
      console.log('[GPS] Out of range:', data)
    }
  })

  useEffect(() => {
    if (!mold && moldId) {
      fetchMoldDetail()
    }
    
    // 세션 만료 시간 (8시간 후)
    const expires = new Date()
    expires.setHours(expires.getHours() + 8)
    setSessionExpires(expires.toISOString())
  }, [moldId])

  // 활동 이력 가져오기
  useEffect(() => {
    if (activeTab === 'history' && moldId) {
      fetchActivities()
    }
  }, [activeTab, moldId])

  const fetchActivities = async () => {
    setLoadingActivities(true)
    try {
      // 점검 이력 조회
      const checksRes = await api.get(`/api/daily-checks?mold_id=${moldId}&limit=5`).catch(() => ({ data: { data: [] } }))
      // 수리 이력 조회
      const repairsRes = await api.get(`/api/v1/repair-requests?mold_id=${moldId}&limit=5`).catch(() => ({ data: { data: [] } }))
      
      const checks = (checksRes.data?.data || []).map(c => ({
        type: 'check',
        title: '일상점검 완료',
        status: c.overall_status || c.status,
        time: c.created_at || c.check_date
      }))
      
      const repairs = (repairsRes.data?.data || []).map(r => ({
        type: 'repair',
        title: r.status === 'completed' ? '수리 완료' : '수리요청 접수',
        status: r.status,
        time: r.created_at || r.request_date
      }))
      
      // 시간순 정렬
      const combined = [...checks, ...repairs].sort((a, b) => 
        new Date(b.time) - new Date(a.time)
      ).slice(0, 10)
      
      setActivities(combined)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setLoadingActivities(false)
    }
  }

  const fetchMoldDetail = async () => {
    try {
      setLoading(true)
      // mold_specifications에서 먼저 시도
      try {
        const specResponse = await moldSpecificationAPI.getById(moldId)
        if (specResponse.data?.data) {
          setMold(specResponse.data.data)
          return
        }
      } catch (e) {
        console.log('Not in specifications, trying molds...')
      }
      // molds 테이블에서 시도
      const response = await api.get(`/api/v1/molds/${moldId}`)
      if (response.data.success) {
        setMold(response.data.data)
      }
    } catch (err) {
      setError('금형 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !mold) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error || '금형을 찾을 수 없습니다.'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            뒤로가기
          </button>
        </div>
      </div>
    )
  }

  // 역할별 메뉴 및 정보 섹션 정의
  const getRoleConfig = () => {
    switch (role) {
      case 'system_admin':
      case 'mold_developer':
      case 'developer':
        return {
          title: '금형개발 담당',
          color: 'blue',
          bgColor: 'bg-blue-600',
          sections: ['images', 'basicInfo', 'moldSpec', 'injectionInfo', 'repairStatus', 'developmentInfo'],
          menus: [
            { icon: BarChart3, label: '금형 현황', desc: '전체 정보 조회', action: 'overview' },
            { icon: CheckCircle, label: '승인/검토', desc: '설계 및 시운전 승인', action: 'approval' },
            { icon: Wrench, label: '수리 귀책', desc: '귀책 판정 및 협의', action: 'repair-liability' },
            { icon: FileText, label: '이력 조회', desc: '전체 이력 확인', action: 'history' },
          ]
        }
      case 'maker':
        return {
          title: '제작처 담당',
          color: 'orange',
          bgColor: 'bg-orange-600',
          sections: ['images', 'basicInfo', 'moldSpec', 'developmentInfo', 'repairStatus'],
          menus: [
            { icon: Settings, label: '개발계획', desc: '금형 개발계획 확인', action: 'development-plan' },
            { icon: ClipboardCheck, label: '체크리스트', desc: '금형 체크리스트', action: 'checklist' },
            { icon: Wrench, label: '수리 작업', desc: '수리 요청 확인/진행', action: 'repair' },
            { icon: Camera, label: '사진 등록', desc: '제작/수리 사진', action: 'photos' },
            { icon: QrCode, label: 'QR 코드', desc: 'QR 확인 및 출력', action: 'qr-code' },
          ]
        }
      case 'plant':
      case 'production':
      default:
        return {
          title: '생산처 담당',
          color: 'green',
          bgColor: 'bg-green-600',
          sections: ['images', 'basicInfo', 'injectionInfo', 'transferInfo', 'alerts'],
          menus: [
            { icon: ClipboardCheck, label: '일상점검', desc: '일일 점검 수행', action: 'daily-check' },
            { icon: Activity, label: '정기점검', desc: '타수별 정기점검', action: 'periodic-check' },
            { icon: Wrench, label: '수리요청', desc: 'NG 발생 시 수리요청', action: 'repair-request' },
            { icon: Truck, label: '이관요청', desc: '금형 이관 요청', action: 'transfer' },
            { icon: MapPin, label: '이관현황', desc: '금형 이관 이력', action: 'transfer-history' },
          ]
        }
    }
  }

  const roleConfig = getRoleConfig()

  // 메뉴 클릭 핸들러
  const handleMenuClick = (action) => {
    switch (action) {
      case 'daily-check':
        navigate(`/mobile/mold/${moldId}/daily-check`, { state: { mold, role } })
        break
      case 'periodic-check':
        navigate(`/mobile/mold/${moldId}/periodic-check`, { state: { mold, role } })
        break
      case 'repair-request':
        navigate(`/mobile/mold/${moldId}/repair-request`, { state: { mold, role } })
        break
      case 'transfer':
        navigate(`/mobile/mold/${moldId}/transfer`, { state: { mold, role } })
        break
      case 'repair':
        navigate(`/mobile/mold/${moldId}/repair`, { state: { mold, role } })
        break
      case 'production':
        navigate(`/mobile/mold/${moldId}/production`, { state: { mold, role } })
        break
      case 'qr-code':
        navigate(`/mobile/mold/${moldId}/qr-code`, { state: { mold, role } })
        break
      case 'photos':
        navigate(`/mobile/mold/${moldId}/photos`, { state: { mold, role } })
        break
      case 'overview':
        navigate(`/mobile/mold/${moldId}/overview`, { state: { mold, role } })
        break
      case 'approval':
        navigate(`/mobile/mold/${moldId}/approval`, { state: { mold, role } })
        break
      case 'repair-liability':
        navigate(`/mobile/mold/${moldId}/repair-liability`, { state: { mold, role } })
        break
      case 'history':
        navigate(`/mobile/mold/${moldId}/history`, { state: { mold, role } })
        break
      case 'development-plan':
        navigate(`/mold-development/plan?moldId=${moldId}`)
        break
      case 'checklist':
        navigate(`/checklist/master?moldId=${moldId}`)
        break
      case 'transfer-history':
        navigate(`/mobile/mold/${moldId}/transfer-history`, { state: { mold, role } })
        break
      default:
        alert('준비 중인 기능입니다.')
    }
  }

  // 역할별 정보 섹션 렌더링
  const renderInfoSection = (sectionId) => {
    switch (sectionId) {
      case 'images':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 gap-0.5">
              {/* 금형 이미지 */}
              <div className="aspect-square bg-gray-100 relative">
                {mold.mold_image_url || mold.part_images?.url ? (
                  <img 
                    src={mold.mold_image_url || mold.part_images?.url} 
                    alt="금형" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">금형 이미지</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">금형</div>
              </div>
              {/* 제품 이미지 */}
              <div className="aspect-square bg-gray-100 relative">
                {mold.product_image_url ? (
                  <img 
                    src={mold.product_image_url} 
                    alt="제품" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Box className="w-8 h-8 mb-1" />
                    <span className="text-xs">제품 이미지</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">제품</div>
              </div>
            </div>
          </div>
        )
      
      case 'basicInfo':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4" /> 기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">금형코드</p>
                <p className="font-medium">{mold.mold_code || mold.part_number || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">차종</p>
                <p className="font-medium">{mold.car_model || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">부품명</p>
                <p className="font-medium">{mold.part_name || mold.mold_name || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">위치</p>
                <p className="font-medium">{mold.location || mold.current_location || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">담당자</p>
                <p className="font-medium">{mold.manager_name || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">상태</p>
                <p className={`font-medium ${mold.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {mold.status === 'active' ? '사용중' : mold.status || '-'}
                </p>
              </div>
            </div>
          </div>
        )
      
      case 'moldSpec':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" /> 금형 사양
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-gray-500">재질</p>
                <p className="font-medium text-purple-700">{mold.material || mold.maker_info?.material || '-'}</p>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-gray-500">캐비티</p>
                <p className="font-medium text-purple-700">{mold.cavity_count || mold.cavity || '-'}개</p>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-gray-500">중량</p>
                <p className="font-medium text-purple-700">{mold.weight || mold.maker_info?.weight || '-'}kg</p>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <p className="text-xs text-gray-500">톤수</p>
                <p className="font-medium text-purple-700">{mold.tonnage || '-'}T</p>
              </div>
            </div>
          </div>
        )
      
      case 'injectionInfo':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> 사출 조건
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-red-50 rounded p-2">
                <p className="text-xs text-gray-500">사출온도</p>
                <p className="font-medium text-red-700">{mold.injection_temp || mold.plant_info?.injection_temp || '-'}°C</p>
              </div>
              <div className="bg-orange-50 rounded p-2">
                <p className="text-xs text-gray-500">사출압력</p>
                <p className="font-medium text-orange-700">{mold.injection_pressure || mold.plant_info?.injection_pressure || '-'}MPa</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500">사출속도</p>
                <p className="font-medium text-blue-700">{mold.injection_speed || mold.plant_info?.injection_speed || '-'}mm/s</p>
              </div>
              <div className="bg-green-50 rounded p-2">
                <p className="text-xs text-gray-500">사이클타임</p>
                <p className="font-medium text-green-700">{mold.cycle_time || mold.plant_info?.cycle_time || '-'}sec</p>
              </div>
            </div>
          </div>
        )
      
      case 'developmentInfo':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 개발 정보
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500">개발단계</p>
                <p className="font-medium text-blue-700">{mold.development_stage || '양산'}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500">제작처</p>
                <p className="font-medium text-blue-700">{mold.maker_company_name || mold.target_maker_name || '-'}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500">발주일</p>
                <p className="font-medium text-blue-700">{mold.order_date || '-'}</p>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs text-gray-500">납품예정</p>
                <p className="font-medium text-blue-700">{mold.target_delivery_date || '-'}</p>
              </div>
            </div>
          </div>
        )
      
      case 'repairStatus':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> 수리 현황
            </h3>
            <div className="flex items-center justify-between text-sm">
              {[
                { label: '요청', status: 'completed' },
                { label: '접수', status: 'completed' },
                { label: '진행', status: 'current' },
                { label: '완료', status: 'pending' },
              ].map((step, idx, arr) => (
                <div key={idx} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                      step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-xs mt-1">{step.label}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'transferInfo':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> 이관 정보
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-cyan-50 rounded">
                <span className="text-gray-600">현재 위치</span>
                <span className="font-medium text-cyan-700">{mold.location || mold.current_location || '생산1공장'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-cyan-50 rounded">
                <span className="text-gray-600">생산처</span>
                <span className="font-medium text-cyan-700">{mold.plant_company_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-cyan-50 rounded">
                <span className="text-gray-600">최근 이관일</span>
                <span className="font-medium text-cyan-700">{mold.last_transfer_date || '-'}</span>
              </div>
            </div>
          </div>
        )
      
      case 'alerts':
        return (
          <div key={sectionId} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> 알림
            </h3>
            <div className="space-y-2">
              {shotProgress >= 80 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">샷수 임계치 도달</p>
                    <p className="text-xs text-red-600">현재 {shotProgress}% - 점검이 필요합니다</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded text-sm">
                <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700">정기점검 예정</p>
                  <p className="text-xs text-yellow-600">다음 점검까지 1,000샷 남음</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // 타수 진행률 계산
  const shotProgress = mold.target_shots || mold.targetShots
    ? Math.round(((mold.current_shots || mold.currentShots || 0) / (mold.target_shots || mold.targetShots)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className={`${roleConfig.bgColor} text-white p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-sm opacity-80">{roleConfig.title}</p>
            <h1 className="text-lg font-bold">{mold.mold_name || mold.name || mold.mold_code || mold.code}</h1>
          </div>
        </div>
        
        {/* 금형 기본 정보 */}
        <div className="bg-white/10 rounded-lg p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="opacity-70">코드:</span>
              <span className="ml-1 font-medium">{mold.mold_code || mold.code}</span>
            </div>
            <div>
              <span className="opacity-70">상태:</span>
              <span className={`ml-1 font-medium ${mold.status === 'active' ? 'text-green-300' : 'text-yellow-300'}`}>
                {mold.status === 'active' ? '정상' : mold.status}
              </span>
            </div>
            <div>
              <span className="opacity-70">차종:</span>
              <span className="ml-1">{mold.car_model || mold.carModel || '-'}</span>
            </div>
            <div>
              <span className="opacity-70">부품:</span>
              <span className="ml-1">{mold.part_name || mold.partName || '-'}</span>
            </div>
          </div>
        </div>
        
        {/* GPS 및 세션 상태 */}
        <div className="flex items-center gap-2 mt-3">
          <GPSStatus accuracy={gpsAccuracy} />
          {sessionExpires && <SessionTimer expiresAt={sessionExpires} />}
        </div>
      </div>

      {/* 타수 현황 */}
      <div className="mx-4 mt-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">타수 현황</span>
          <span className="text-sm text-gray-500">
            {(mold.current_shots || mold.currentShots || 0).toLocaleString()} / {(mold.target_shots || mold.targetShots || 0).toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${shotProgress >= 80 ? 'bg-red-500' : shotProgress >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(shotProgress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{shotProgress}% 사용</span>
          {shotProgress >= 80 && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              점검 필요
            </span>
          )}
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="mx-4 mt-4 flex bg-white rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'info' ? `${roleConfig.bgColor} text-white` : 'text-gray-600'}`}
        >
          금형정보
        </button>
        <button
          onClick={() => setActiveTab('work')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'work' ? `${roleConfig.bgColor} text-white` : 'text-gray-600'}`}
        >
          작업메뉴
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'history' ? `${roleConfig.bgColor} text-white` : 'text-gray-600'}`}
        >
          이력
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mx-4 mt-4 space-y-4">
        {activeTab === 'info' && (
          <>
            {/* 역할별 정보 섹션 */}
            {roleConfig.sections.map(sectionId => renderInfoSection(sectionId))}
          </>
        )}

        {activeTab === 'work' && (
          <>
            {/* 작업 메뉴 */}
            <div className="grid grid-cols-2 gap-3">
              {roleConfig.menus.map((menu, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuClick(menu.action)}
                  className="p-4 bg-white rounded-lg shadow-sm text-left hover:shadow-md transition-shadow"
                >
                  <menu.icon className={`w-8 h-8 mb-2 text-${roleConfig.color}-600`} />
                  <div className="font-medium text-gray-900">{menu.label}</div>
                  <div className="text-xs text-gray-500">{menu.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 활동</h3>
            {loadingActivities ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                이력 로딩 중...
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'check' ? 'bg-green-100' :
                      activity.type === 'repair' ? 'bg-orange-100' :
                      activity.type === 'transfer' ? 'bg-cyan-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.type === 'check' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                       activity.type === 'repair' ? <Wrench className="w-4 h-4 text-orange-600" /> :
                       activity.type === 'transfer' ? <Truck className="w-4 h-4 text-cyan-600" /> :
                       <Activity className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.time ? new Date(activity.time).toLocaleDateString('ko-KR', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '-'}
                        {activity.status && ` • ${activity.status}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* 기본 샘플 데이터 */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">일상점검 완료</p>
                    <p className="text-xs text-gray-500">최근 점검 기록 없음</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">수리 이력</p>
                    <p className="text-xs text-gray-500">최근 수리 기록 없음</p>
                  </div>
                </div>
                <div className="text-center py-2 text-gray-400 text-xs">
                  이력 데이터가 없습니다
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <BottomCTA>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQRCode(true)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            QR 코드
          </button>
          <button
            onClick={async () => {
              // 최근 작업 기록 저장
              await recentActions.add(
                mold.id || moldId,
                mold.mold_code || mold.code,
                'view',
                mold.part_name || mold.mold_name || '금형 조회'
              )
              navigate('/qr/scan')
            }}
            className={`flex-1 py-3 ${roleConfig.bgColor} text-white rounded-lg flex items-center justify-center gap-2`}
          >
            <Camera className="w-5 h-5" />
            다른 금형 스캔
          </button>
        </div>
      </BottomCTA>

      {/* QR 코드 모달 */}
      {showQRCode && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-center mb-4">금형 QR 코드</h3>
            <div className="flex justify-center mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mold.qr_code || `MOLD-${mold.id || moldId}`)}`}
                alt="QR Code"
                className="w-48 h-48 rounded-lg shadow"
              />
            </div>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">QR 코드</p>
              <p className="font-bold text-lg">{mold.qr_code || `MOLD-${mold.id || moldId}`}</p>
              <p className="text-sm text-gray-600 mt-1">{mold.part_name || mold.mold_name}</p>
              {mold.mold_code && <p className="text-xs text-gray-400">금형코드: {mold.mold_code}</p>}
            </div>
            <button
              onClick={() => setShowQRCode(false)}
              className={`w-full py-3 ${roleConfig.bgColor} text-white rounded-lg font-medium`}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* GPS 이탈 알림 */}
      <GPSOutOfRangeAlert
        isOutOfRange={isOutOfRange}
        distance={distance}
        allowedRadius={500}
        onRequestReturn={() => {
          // 금형 위치로 이동 안내
          if (allowedLocation) {
            window.open(
              `https://maps.google.com/maps?daddr=${allowedLocation.latitude},${allowedLocation.longitude}`,
              '_blank'
            )
          }
        }}
      />
    </div>
  )
}
