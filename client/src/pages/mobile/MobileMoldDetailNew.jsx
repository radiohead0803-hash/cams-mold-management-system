import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { moldSpecificationAPI, moldImageAPI } from '../../lib/api'
import api from '../../lib/api'
import {
  ArrowLeft, Settings, ChevronDown, ChevronRight, Upload, Eye,
  CheckCircle, MapPin, TrendingUp, User, AlertTriangle,
  Thermometer, Gauge, Clock, Box, Wrench, FileText,
  ClipboardCheck, Calendar, Activity, Camera, Shield, X,
  QrCode, Menu, Home, History, MoreHorizontal, Loader2
} from 'lucide-react'

/**
 * 모바일 금형 상세 페이지
 * PC 버전(MoldDetailNew.jsx)과 동일한 내용, 모바일 레이아웃
 */
export default function MobileMoldDetailNew() {
  const { moldId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  // location.state에서 데이터 가져오기
  const stateData = location.state || {}
  const role = stateData.role || user?.user_type || 'plant'

  const [mold, setMold] = useState(stateData.mold || null)
  const [loading, setLoading] = useState(!stateData.mold)
  const [activeTab, setActiveTab] = useState('info')
  const [showQRCode, setShowQRCode] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [moldImages, setMoldImages] = useState({ mold: null, product: null })
  const [activities, setActivities] = useState([])

  // 역할별 색상 설정
  const roleConfig = {
    mold_developer: { color: 'blue', bgColor: 'bg-blue-600', label: '금형개발' },
    maker: { color: 'orange', bgColor: 'bg-orange-500', label: '제작처' },
    plant: { color: 'green', bgColor: 'bg-green-600', label: '생산처' },
    system_admin: { color: 'purple', bgColor: 'bg-purple-600', label: '관리자' }
  }[role] || { color: 'gray', bgColor: 'bg-gray-600', label: '사용자' }

  // 역할별 표시 섹션
  const getVisibleSections = () => {
    switch (role) {
      case 'system_admin':
      case 'mold_developer':
        return ['images', 'status', 'alerts', 'quickActions', 'injection', 'specs', 'repair']
      case 'maker':
        return ['images', 'status', 'specs', 'repair']
      case 'plant':
        return ['images', 'status', 'alerts', 'quickActions', 'injection']
      default:
        return ['status', 'quickActions']
    }
  }

  const visibleSections = getVisibleSections()

  // 금형 데이터 로드
  useEffect(() => {
    if (!mold && moldId) {
      loadMoldData()
    }
  }, [moldId])

  // 이미지 및 활동 이력 로드
  useEffect(() => {
    if (mold) {
      loadMoldImages()
      loadActivities()
    }
  }, [mold])

  const loadMoldData = async () => {
    try {
      setLoading(true)
      
      // 1. 모바일 API로 시도
      try {
        const res = await api.get(`/api/v1/mobile/molds/${moldId}`)
        if (res.data.success && res.data.data) {
          setMold(res.data.data)
          return
        }
      } catch (e) {}

      // 2. mold-specifications API로 시도
      try {
        const res = await moldSpecificationAPI.getById(moldId)
        if (res.data?.data) {
          setMold(res.data.data)
          return
        }
      } catch (e) {}

    } catch (err) {
      console.error('Failed to load mold:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoldImages = async () => {
    try {
      const response = await moldImageAPI.getAll({ mold_spec_id: moldId })
      if (response.data.success) {
        const images = response.data.data
        const moldImg = images.find(img => img.image_type === 'mold' && img.is_primary)
        const productImg = images.find(img => img.image_type === 'product' && img.is_primary)
        setMoldImages({
          mold: moldImg?.image_url || mold?.mold_image_url,
          product: productImg?.image_url || mold?.product_image_url
        })
      }
    } catch (error) {
      setMoldImages({
        mold: mold?.mold_image_url,
        product: mold?.product_image_url
      })
    }
  }

  const loadActivities = async () => {
    try {
      const [checksRes, repairsRes] = await Promise.all([
        api.get(`/api/v1/daily-checks?mold_id=${moldId}&limit=5`).catch(() => ({ data: { data: [] } })),
        api.get(`/api/v1/repair-requests?mold_id=${moldId}&limit=5`).catch(() => ({ data: { data: [] } }))
      ])

      const checks = (checksRes.data?.data || []).map(c => ({
        type: 'check',
        title: `일상점검 ${c.status === 'completed' ? '완료' : '진행중'}`,
        time: c.created_at,
        status: c.result || c.status
      }))

      const repairs = (repairsRes.data?.data || []).map(r => ({
        type: 'repair',
        title: r.title || '수리요청',
        time: r.created_at,
        status: r.status
      }))

      const combined = [...checks, ...repairs]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10)

      setActivities(combined)
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
  }

  // 메뉴 항목
  const menuItems = {
    moldInfo: {
      label: '금형정보',
      icon: Settings,
      items: ['금형사양', '변경이력']
    },
    injection: {
      label: '사출정보',
      icon: Thermometer,
      items: ['사출조건 관리', '러너관리']
    },
    repair: {
      label: '금형수리',
      icon: Wrench,
      items: ['수리요청', '수리현황']
    },
    inspection: {
      label: '금형점검',
      icon: ClipboardCheck,
      items: ['일상점검', '정기점검']
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">금형 정보 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!mold) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">금형 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/mobile/qr-login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            QR 스캔으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const moldCode = mold.mold_code || mold.qr_code || `MOLD-${moldId}`
  const moldName = mold.part_name || mold.mold_name || '금형'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className={`${roleConfig.bgColor} text-white sticky top-0 z-40`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1">
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 className="font-bold text-lg">{moldCode}</h1>
                <p className="text-sm opacity-80">{moldName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {roleConfig.label}
              </span>
              <button onClick={() => setShowMenu(true)} className="p-1">
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-t border-white/20">
          {[
            { id: 'info', label: '정보', icon: Home },
            { id: 'history', label: '이력', icon: History },
            { id: 'menu', label: '메뉴', icon: MoreHorizontal }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-center text-sm flex flex-col items-center gap-1 ${
                activeTab === tab.id ? 'bg-white/20' : ''
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-4 space-y-4">
        {/* 정보 탭 */}
        {activeTab === 'info' && (
          <>
            {/* 이미지 섹션 */}
            {visibleSections.includes('images') && (
              <div className="grid grid-cols-2 gap-3">
                {/* 금형 이미지 */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-2 border-b flex items-center gap-1">
                    <Camera size={14} className="text-purple-600" />
                    <span className="text-xs font-medium">금형</span>
                  </div>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {moldImages.mold ? (
                      <img src={moldImages.mold} alt="금형" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-gray-300" />
                    )}
                  </div>
                </div>

                {/* 제품 이미지 */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-2 border-b flex items-center gap-1">
                    <Box size={14} className="text-blue-600" />
                    <span className="text-xs font-medium">제품</span>
                  </div>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {moldImages.product ? (
                      <img src={moldImages.product} alt="제품" className="w-full h-full object-cover" />
                    ) : (
                      <Box size={32} className="text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 현재 상태 */}
            {visibleSections.includes('status') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={14} className="text-green-600" />
                    </div>
                    <span className="text-xs text-gray-500">상태</span>
                  </div>
                  <p className="font-bold text-green-600">
                    {mold.status === 'active' ? '사용중' : mold.status || '대기'}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                      <MapPin size={14} className="text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-500">위치</span>
                  </div>
                  <p className="font-bold text-purple-600 text-sm truncate">
                    {mold.current_location || mold.location || '-'}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center">
                      <TrendingUp size={14} className="text-yellow-600" />
                    </div>
                    <span className="text-xs text-gray-500">진행률</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <span className="text-xs font-bold">95%</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500">담당자</span>
                  </div>
                  <p className="font-bold text-blue-600 text-sm">
                    {mold.manager_name || user?.name || '-'}
                  </p>
                </div>
              </div>
            )}

            {/* 알림 */}
            {visibleSections.includes('alerts') && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="font-semibold text-sm">금형관리 알림</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle size={14} className="text-red-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-800">샷수 임계치 도달</p>
                      <p className="text-xs text-red-600">현재 샷수가 95.2%에 도달</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                    <Thermometer size={14} className="text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-orange-800">작동 온도 주의</p>
                      <p className="text-xs text-orange-600">금형 온도가 설정값보다 5% 높음</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 점검 바로가기 */}
            {visibleSections.includes('quickActions') && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-green-600" />
                  <span className="font-semibold text-sm">금형점검 바로가기</span>
                </div>
                <div className="p-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => navigate(`/mobile/mold/${moldId}/daily-check`)}
                    className="p-3 bg-green-50 rounded-xl text-center"
                  >
                    <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">일상점검</span>
                  </button>
                  <button
                    onClick={() => navigate(`/mobile/mold/${moldId}/periodic-check`)}
                    className="p-3 bg-blue-50 rounded-xl text-center"
                  >
                    <Calendar size={20} className="mx-auto mb-1 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">정기점검</span>
                  </button>
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="p-3 bg-gray-50 rounded-xl text-center"
                  >
                    <QrCode size={20} className="mx-auto mb-1 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">QR코드</span>
                  </button>
                </div>
              </div>
            )}

            {/* 사출조건 */}
            {visibleSections.includes('injection') && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-red-500" />
                    <span className="font-semibold text-sm">사출조건</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">사출온도</p>
                    <p className="font-bold text-red-600">{mold.injection_temp || '-'}°C</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">사출압력</p>
                    <p className="font-bold text-orange-600">{mold.injection_pressure || '-'} MPa</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">사출속도</p>
                    <p className="font-bold text-blue-600">{mold.injection_speed || '-'} mm/s</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">사이클타임</p>
                    <p className="font-bold text-green-600">{mold.cycle_time || '-'} sec</p>
                  </div>
                </div>
              </div>
            )}

            {/* 금형사양 */}
            {visibleSections.includes('specs') && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-green-600" />
                    <span className="font-semibold text-sm">금형사양</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">재질</p>
                    <p className="font-bold text-gray-700">{mold.material || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">중량</p>
                    <p className="font-bold text-gray-700">{mold.weight || '-'}kg</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">치수</p>
                    <p className="font-bold text-gray-700 text-sm">{mold.dimensions || mold.size || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">캐비티</p>
                    <p className="font-bold text-gray-700">{mold.cavity_count || mold.cavity || '-'}개</p>
                  </div>
                </div>
              </div>
            )}

            {/* 수리현황 */}
            {visibleSections.includes('repair') && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-orange-500" />
                    <span className="font-semibold text-sm">금형수리 진행현황</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between overflow-x-auto pb-2">
                    {[
                      { label: '요청', status: 'completed', icon: FileText },
                      { label: '배정', status: 'completed', icon: User },
                      { label: '수리', status: 'current', icon: Wrench },
                      { label: '검수', status: 'pending', icon: CheckCircle },
                      { label: '승인', status: 'pending', icon: Shield }
                    ].map((step, idx, arr) => (
                      <div key={idx} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === 'completed' ? 'bg-green-100' :
                            step.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <step.icon size={14} className={
                              step.status === 'completed' ? 'text-green-600' :
                              step.status === 'current' ? 'text-blue-600' : 'text-gray-400'
                            } />
                          </div>
                          <span className={`text-xs mt-1 ${
                            step.status === 'completed' ? 'text-green-600' :
                            step.status === 'current' ? 'text-blue-600' : 'text-gray-400'
                          }`}>{step.label}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`w-6 h-0.5 mx-1 ${
                            step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 이력 탭 */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3">최근 활동</h3>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'check' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {activity.type === 'check' ? (
                        <CheckCircle size={14} className="text-green-600" />
                      ) : (
                        <Wrench size={14} className="text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.title}</p>
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
              <p className="text-center text-gray-400 text-sm py-8">이력이 없습니다</p>
            )}
          </div>
        )}

        {/* 메뉴 탭 */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            {Object.entries(menuItems).map(([key, menu]) => (
              <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 border-b flex items-center gap-2">
                  <menu.icon size={16} className={roleConfig.bgColor.replace('bg-', 'text-').replace('-600', '-500').replace('-500', '-600')} />
                  <span className="font-semibold text-sm">{menu.label}</span>
                </div>
                <div className="divide-y">
                  {menu.items.map((item, idx) => (
                    <button
                      key={idx}
                      className="w-full p-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => {
                        if (item === '일상점검') navigate(`/mobile/mold/${moldId}/daily-check`)
                        else if (item === '정기점검') navigate(`/mobile/mold/${moldId}/periodic-check`)
                        else if (item === '수리요청') navigate(`/mobile/mold/${moldId}/repair-request`)
                      }}
                    >
                      {item}
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t flex gap-2">
        <button
          onClick={() => setShowQRCode(true)}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
        >
          <QrCode size={18} />
          QR 코드
        </button>
        <button
          onClick={() => navigate('/mobile/qr-login')}
          className={`flex-1 py-3 ${roleConfig.bgColor} text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium`}
        >
          <Camera size={18} />
          다른 금형 스캔
        </button>
      </div>

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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `https://spirited-liberation-production-1a4d.up.railway.app/m/qr/${mold.qr_code || `MOLD-${mold.id || moldId}`}`
                )}`}
                alt="QR Code"
                className="w-48 h-48 rounded-lg shadow"
              />
            </div>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">QR 코드</p>
              <p className="font-bold text-lg">{mold.qr_code || `MOLD-${mold.id || moldId}`}</p>
              <p className="text-sm text-gray-600 mt-1">{moldName}</p>
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

      {/* 사이드 메뉴 */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${roleConfig.bgColor} text-white p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">메뉴</h2>
                <button onClick={() => setShowMenu(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="text-sm opacity-80">
                <p>{user?.name || '사용자'}</p>
                <p>{roleConfig.label}</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(menuItems).map(([key, menu]) => (
                <div key={key}>
                  <p className="text-xs text-gray-400 uppercase mb-1">{menu.label}</p>
                  {menu.items.map((item, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => {
                        setShowMenu(false)
                        if (item === '일상점검') navigate(`/mobile/mold/${moldId}/daily-check`)
                        else if (item === '정기점검') navigate(`/mobile/mold/${moldId}/periodic-check`)
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
