import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Camera, FileText, ChevronRight, ChevronLeft, BookOpen, MapPin, ArrowLeft, Loader2, Info, Hash, Save, Send, Search, X, User } from 'lucide-react'
import api from '../lib/api'
import { saveDraft as saveDraftLocal, loadDraft, clearDraft } from '../lib/draftStorage'
import InspectionPhotoSection from '../components/InspectionPhotoSection'

// 정기점검 대항목/소항목 구조 (템플릿 마스터 + 기존 항목 통합)
const INSPECTION_TYPES = [
  {
    id: '20k',
    name: '20,000 SHOT 점검',
    period: '3개월',
    shotThreshold: 20000,
    categories: [
      {
        id: 1,
        name: '파팅면/성형면',
        items: [
          { id: 1, name: '파팅면 단차', description: '±0.02mm 이내', required: true, checkPoints: ['파팅면 단차 측정', '기준치 ±0.02mm 이내 확인', '단차 발생 부위 표시'] },
          { id: 2, name: '성형면 손상', description: '표면 이상 여부', required: true, checkPoints: ['성형면 스크래치 확인', '부식/마모 흔적 점검', '표면 광택 상태 확인'] }
        ]
      },
      {
        id: 2,
        name: '벤트/게이트',
        items: [
          { id: 3, name: '벤트홀 막힘', description: '막힘 여부 확인', required: true, checkPoints: ['벤트홀 개방 상태 확인', '가스 배출 원활성 점검', '이물질 제거 상태'] },
          { id: 4, name: '게이트 청결', description: '0.03mm 이상 마모시 재가공', required: true, checkPoints: ['게이트 마모 측정', '0.03mm 이상 마모시 재가공 필요', '게이트 청결 상태 확인'] }
        ]
      },
      {
        id: 3,
        name: '작동부',
        items: [
          { id: 5, name: '슬라이드 작동', description: '이상음/걸림/누유 여부', required: true, checkPoints: ['슬라이드 이동 시 이상음 확인', '걸림 현상 점검', '누유 여부 확인'] },
          { id: 6, name: '작동 원활성', description: '원활한 작동 확인', required: true, checkPoints: ['전체 작동부 원활성 점검', '작동 속도 정상 여부', '반복 작동 테스트'] }
        ]
      },
      {
        id: 4,
        name: '습합(접합)',
        items: [
          { id: 7, name: '금형 간극', description: '±0.02mm 이내 유지', required: true, checkPoints: ['금형 간극 측정', '기준치 ±0.02mm 이내 확인', '간극 불량 부위 표시'] },
          { id: 8, name: '접합 정렬', description: '정렬 상태 확인', required: true, checkPoints: ['상/하형 정렬 상태 확인', '가이드핀 정렬 점검', '접합면 밀착 상태'] }
        ]
      },
      {
        id: 5,
        name: '취출계통',
        items: [
          { id: 9, name: '밀핀/스프링', description: '박힘/변형/마모 없음', required: true, checkPoints: ['밀핀 박힘 여부 확인', '스프링 변형 점검', '마모 상태 측정'] }
        ]
      },
      {
        id: 6,
        name: '냉각/유압 연결부',
        items: [
          { id: 10, name: '누유/누수', description: '누유/누수 여부', required: true, checkPoints: ['유압 라인 누유 확인', '냉각수 누수 점검', '연결부 조임 상태'] },
          { id: 11, name: '조인트/호스', description: '커넥터·호스 상태', required: true, checkPoints: ['커넥터 체결 상태 확인', '호스 균열/노화 점검', '연결부 밀봉 상태'] }
        ]
      }
    ]
  },
  {
    id: '50k',
    name: '50,000 SHOT 점검',
    period: '6개월',
    shotThreshold: 50000,
    categories: [
      {
        id: 1,
        name: '벤트·게이트부 마모',
        items: [
          { id: 12, name: '핀/인서트 마모', description: '0.05mm 이상이면 교체', required: true, checkPoints: ['핀 마모량 측정', '인서트 마모 상태 확인', '0.05mm 이상시 교체 진행'] }
        ]
      },
      {
        id: 2,
        name: '가이드핀/리테이너',
        items: [
          { id: 13, name: '마모/유격', description: '±0.02mm, 변형·이상음 없음', required: true, checkPoints: ['가이드핀 마모 측정', '유격 ±0.02mm 이내 확인', '변형/이상음 점검'] },
          { id: 14, name: '리프트핀/엘글라', description: '마모/유격 확인', required: true, checkPoints: ['리프트핀 마모 상태', '엘글라 유격 측정', '작동 원활성 확인'] }
        ]
      },
      {
        id: 3,
        name: '냉각라인',
        items: [
          { id: 15, name: '유량/온도', description: '온도 편차 ±10% 이내', required: true, checkPoints: ['냉각수 유량 측정', '입/출구 온도 측정', '온도 편차 ±10% 이내 확인'] },
          { id: 16, name: '누수 확인', description: '누수 없음', required: true, checkPoints: ['냉각라인 전체 누수 점검', '연결부 누수 확인', '호스 상태 점검'] }
        ]
      },
      {
        id: 4,
        name: '히터·센서·배선',
        items: [
          { id: 17, name: '히터 저항', description: '±10% 이내', required: true, checkPoints: ['히터 저항값 측정', '기준치 ±10% 이내 확인', '이상 히터 표시'] },
          { id: 18, name: '센서/배선', description: '손상·접촉불량 확인', required: true, checkPoints: ['센서 작동 상태 확인', '배선 손상 점검', '접촉불량 부위 확인'] }
        ]
      },
      {
        id: 5,
        name: '표면처리',
        items: [
          { id: 19, name: '코팅/크롬층', description: '박리, 변색, 두께 이상 확인', required: true, checkPoints: ['코팅 박리 여부 확인', '크롬층 변색 점검', '두께 측정 및 기록'] }
        ]
      },
      {
        id: 6,
        name: '습합 정확도',
        items: [
          { id: 20, name: '수평각', description: '±0.02mm, 간극/접합력 확인', required: true, checkPoints: ['수평각 측정', '간극 ±0.02mm 이내 확인', '접합력 테스트'] }
        ]
      },
      {
        id: 7,
        name: '취출핀/볼트너트',
        items: [
          { id: 21, name: '핀 마모', description: '마모·손상 여부', required: true, checkPoints: ['취출핀 마모 측정', '손상 부위 확인', '교체 필요 여부 판단'] },
          { id: 22, name: '볼트너트 작동', description: '작동 상태와 배선 접점', required: true, checkPoints: ['볼트너트 작동 확인', '배선 접점 상태 점검', '조임 토크 확인'] }
        ]
      }
    ]
  },
  {
    id: '80k',
    name: '80,000 SHOT 점검',
    period: '청소/습합 집중',
    shotThreshold: 80000,
    categories: [
      {
        id: 1,
        name: '세척',
        items: [
          { id: 23, name: '금형 외곽 세척', description: '코어/캐비티 내 이물 제거', required: true, checkPoints: ['금형 외곽 세척 완료', '코어 내 이물 제거', '캐비티 내 이물 제거'] },
          { id: 24, name: '벤트·게이트 세척', description: '촉촉 상태 확인', required: true, checkPoints: ['벤트홀 세척 완료', '게이트 세척 상태', '세척 후 건조 상태 확인'] }
        ]
      },
      {
        id: 2,
        name: '습합',
        items: [
          { id: 25, name: '습합 면 정렬', description: '간극 재측정', required: true, checkPoints: ['습합면 정렬 상태 확인', '간극 재측정 실시', '측정값 기록'] },
          { id: 26, name: '런너/가이드', description: '클리닝 상태', required: true, checkPoints: ['런너 클리닝 완료', '가이드 클리닝 상태', '잔류물 제거 확인'] }
        ]
      },
      {
        id: 3,
        name: '냉각수/유압',
        items: [
          { id: 27, name: '필터/밸브', description: '필터 교체 권고', required: true, checkPoints: ['필터 상태 점검', '필터 교체 필요 여부', '밸브 작동 확인'] }
        ]
      },
      {
        id: 4,
        name: '히터/센서',
        items: [
          { id: 28, name: '감지기/배선', description: '접점 청소', required: true, checkPoints: ['감지기 접점 청소', '배선 접점 청소', '청소 후 작동 확인'] }
        ]
      },
      {
        id: 5,
        name: '윤활',
        items: [
          { id: 29, name: '정밀 윤활', description: '기록 및 마모 트래킹', required: true, checkPoints: ['윤활 부위 확인', '윤활유 도포', '마모 상태 기록'] }
        ]
      }
    ]
  },
  {
    id: '100k',
    name: '100,000 SHOT 점검',
    period: '1년',
    shotThreshold: 100000,
    categories: [
      {
        id: 1,
        name: '냉각라인',
        items: [
          { id: 30, name: '스케일 제거', description: '이물 세척, 냉각수흐름 확보', required: true, checkPoints: ['스케일 제거 작업', '이물 세척 완료', '냉각수 흐름 확인'] }
        ]
      },
      {
        id: 2,
        name: '치수 확인',
        items: [
          { id: 31, name: '표준/인서트 치수', description: '±0.05mm 이내', required: true, checkPoints: ['표준 치수 측정', '인서트 치수 측정', '±0.05mm 이내 확인'] }
        ]
      },
      {
        id: 3,
        name: '표면/코팅',
        items: [
          { id: 32, name: '코팅 박리', description: '크롬층 불균일, 변색 확인', required: true, checkPoints: ['코팅 박리 여부 확인', '크롬층 균일성 점검', '변색 부위 확인'] }
        ]
      },
      {
        id: 4,
        name: '볼트너트/게이트',
        items: [
          { id: 33, name: '작동 확인', description: '판탈림 여부, 배선 절연', required: true, checkPoints: ['볼트너트 판탈림 확인', '배선 절연 상태 점검', '작동 테스트'] }
        ]
      },
      {
        id: 5,
        name: '냉각수/공기',
        items: [
          { id: 34, name: '유량계/밸브', description: '필터/세척 상태, 누수 확인', required: true, checkPoints: ['유량계 작동 확인', '밸브 상태 점검', '필터 세척/교체'] }
        ]
      },
      {
        id: 6,
        name: '마모 분석',
        items: [
          { id: 35, name: '정밀 윤활', description: '마모 예측치, 교체 시점 산정', required: true, checkPoints: ['마모 예측치 분석', '교체 시점 산정', '윤활 상태 기록'] }
        ]
      },
      {
        id: 7,
        name: '생산 정보',
        icon: '📊',
        items: [
          { id: 36, name: '생산수량', description: '금일 생산수량 입력 (숏수 자동 누적)', required: false, fieldType: 'number', isShotLinked: true, checkPoints: ['생산수량 정확히 입력', '숏수 자동 누적 확인', '보증숏수 90% 도달 시 경고', '100% 도달 시 긴급 알림'] }
        ]
      }
    ]
  }
]

export default function PeriodicInspectionNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const moldId = searchParams.get('moldId') || searchParams.get('mold')

  const [selectedType, setSelectedType] = useState(null)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [checkResults, setCheckResults] = useState({})
  const [cleaningMethod, setCleaningMethod] = useState('')
  const [cleaningRatio, setCleaningRatio] = useState('')
  const [gpsLocation, setGpsLocation] = useState(null)
  const [mold, setMold] = useState(null)
  const [showGuide, setShowGuide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [showApproverModal, setShowApproverModal] = useState(false)
  const [approverKeyword, setApproverKeyword] = useState('')
  const [approverResults, setApproverResults] = useState([])
  const [selectedApprover, setSelectedApprover] = useState(null)

  // 금형 정보 로드
  useEffect(() => {
    const loadMoldData = async () => {
      setLoading(true)
      try {
        if (moldId) {
          const res = await api.get(`/mold-specifications/${moldId}`)
          if (res.data.success && res.data.data) {
            setMold(res.data.data)
          } else {
            setMold({
              id: moldId,
              mold_code: `MOLD-${moldId}`,
              mold_name: '금형',
              car_model: '-',
              current_shots: 0,
              guarantee_shots: 500000,
              location: '-'
            })
          }
        } else {
          setMold({
            id: 1,
            mold_code: 'SAMPLE-001',
            mold_name: '샘플 금형',
            car_model: '-',
            current_shots: 0,
            guarantee_shots: 500000,
            location: '-'
          })
        }
      } catch (error) {
        console.error('금형 정보 로드 실패:', error)
        setMold({
          id: moldId || 1,
          mold_code: 'UNKNOWN',
          mold_name: '알 수 없음',
          car_model: '-',
          current_shots: 0,
          guarantee_shots: 500000,
          location: '-'
        })
      } finally {
        setLoading(false)
      }
    }
    loadMoldData()

    // GPS 위치 캡처
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('GPS 오류:', error)
        }
      )
    }
  }, [moldId])

  // Draft 복원
  useEffect(() => {
    (async () => {
      const draft = await loadDraft('periodic_inspection', moldId || 'new')
      if (draft && draft.data) {
        const d = draft.data
        if (d.selectedTypeId) {
          const foundType = INSPECTION_TYPES.find(t => t.id === d.selectedTypeId)
          if (foundType) setSelectedType(foundType)
        }
        if (d.currentCategoryIndex != null) setCurrentCategoryIndex(d.currentCategoryIndex)
        if (d.checkResults) setCheckResults(d.checkResults)
        if (d.cleaningMethod) setCleaningMethod(d.cleaningMethod)
        if (d.cleaningRatio) setCleaningRatio(d.cleaningRatio)
        if (d.selectedApprover) setSelectedApprover(d.selectedApprover)
        setSaveMessage({ type: 'success', text: `임시저장 복원됨 (${new Date(draft.savedAt).toLocaleString()})` })
        setTimeout(() => setSaveMessage(null), 4000)
      }
    })()
  }, [moldId])

  const handleTypeSelect = (type) => {
    setSelectedType(type)
    setCurrentCategoryIndex(0)
    setCheckResults({})
  }

  const handleStatusChange = (itemId, status) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
        timestamp: new Date().toISOString()
      }
    }))
  }

  const handleNotesChange = (itemId, notes) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }))
  }

  const handlePhotosChange = (itemId, photos) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos
      }
    }))
  }

  const handleNext = () => {
    if (currentCategoryIndex < selectedType.categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1)
    }
  }

  const buildPayload = (status, approverId = null) => {
    const allItems = selectedType.categories.flatMap(cat => cat.items)
    return {
      mold_id: mold.id,
      category: 'periodic',
      status,
      approver_id: approverId,
      check_date: new Date().toISOString(),
      results: { ...checkResults, inspection_type: selectedType.id, cleaning_method: cleaningMethod, cleaning_ratio: cleaningRatio, gps_location: gpsLocation },
      summary: {
        total: allItems.length,
        completed: Object.keys(checkResults).length,
        good: Object.values(checkResults).filter(r => r.status === '양호').length,
        warning: Object.values(checkResults).filter(r => r.status === '정비 필요').length,
        bad: Object.values(checkResults).filter(r => r.status === '수리 필요').length
      }
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const payload = buildPayload('draft')
      await api.post('/checklist-instances/daily/draft', payload)
      await saveDraftLocal('periodic_inspection', moldId || 'new', {
        selectedTypeId: selectedType?.id,
        currentCategoryIndex,
        checkResults,
        cleaningMethod,
        cleaningRatio,
        selectedApprover
      })
      setSaveMessage({ type: 'success', text: '임시저장이 완료되었습니다.' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('임시저장 실패:', err)
      await saveDraftLocal('periodic_inspection', moldId || 'new', {
        selectedTypeId: selectedType?.id,
        currentCategoryIndex,
        checkResults,
        cleaningMethod,
        cleaningRatio,
        selectedApprover
      })
      setSaveMessage({ type: 'success', text: '로컬 임시저장 완료 (서버 저장 실패)' })
    } finally {
      setSaving(false)
    }
  }

  const handleSearchApprover = async () => {
    if (!approverKeyword.trim()) return
    try {
      const res = await api.get('/workflow/approvers/search', { params: { name: approverKeyword } })
      if (res.data.success) setApproverResults(res.data.data)
    } catch (err) {
      console.error('관리자 검색 실패:', err)
    }
  }

  const handleRequestApproval = async () => {
    if (!selectedApprover) { setShowApproverModal(true); return }
    const allItems = selectedType.categories.flatMap(cat => cat.items)
    const requiredItems = allItems.filter(item => item.required)
    const completedRequired = requiredItems.filter(item => checkResults[item.id]?.status)
    if (completedRequired.length < requiredItems.length) {
      alert(`필수 항목을 모두 완료해주세요. (${completedRequired.length}/${requiredItems.length})`)
      return
    }
    setSaving(true)
    try {
      await api.post('/checklist-instances/daily/request-approval', buildPayload('pending_approval', selectedApprover.id))
      setSaveMessage({ type: 'success', text: `${selectedApprover.name}님께 승인요청 완료` })
      setTimeout(() => navigate('/molds'), 2000)
    } catch (err) {
      console.error('승인요청 실패:', err)
      setSaveMessage({ type: 'error', text: '승인요청에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    const allItems = selectedType.categories.flatMap(cat => cat.items)
    const requiredItems = allItems.filter(item => item.required)
    const completedRequired = requiredItems.filter(item => 
      checkResults[item.id]?.status
    )

    if (completedRequired.length < requiredItems.length) {
      alert(`필수 항목을 모두 완료해주세요. (${completedRequired.length}/${requiredItems.length})`)
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload('completed')
      await api.post('/checklist-instances/periodic/complete', payload)
      await clearDraft('periodic_inspection', moldId || 'new')
      alert('정기점검이 완료되었습니다!')
      navigate('/molds')
    } catch (err) {
      console.error('정기점검 완료 실패:', err)
      alert(err?.response?.data?.message || '점검 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryProgress = (category) => {
    const completed = category.items.filter(item => checkResults[item.id]?.status).length
    const total = category.items.length
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const getRecommendedType = () => {
    if (!mold) return null
    const shots = mold.current_shots
    
    if (shots >= 100000) return INSPECTION_TYPES.find(t => t.id === '100k')
    if (shots >= 80000) return INSPECTION_TYPES.find(t => t.id === '80k')
    if (shots >= 50000) return INSPECTION_TYPES.find(t => t.id === '50k')
    if (shots >= 20000) return INSPECTION_TYPES.find(t => t.id === '20k')
    return null
  }

  // 숏수 비율 계산
  const getShotPercentage = () => {
    if (!mold) return 0
    const guarantee = mold.guarantee_shots || mold.target_shots || 500000
    const current = mold.current_shots || 0
    return Math.round((current / guarantee) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    )
  }

  if (!mold) {
    return <div className="card text-center py-12">금형 정보를 불러올 수 없습니다.</div>
  }

  // 점검 유형 선택 화면
  if (!selectedType) {
    const recommendedType = getRecommendedType()
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">정기점검</h1>
            <p className="text-sm text-gray-600 mt-1">
              {mold.mold_code} - {mold.mold_name} ({mold.car_model})
            </p>
          </div>
        </div>

        {/* 금형 정보 카드 */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold mb-3">금형 정보</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">품번:</span>
              <span className="ml-2 font-medium">{mold.mold_code}</span>
            </div>
            <div>
              <span className="text-gray-600">품명:</span>
              <span className="ml-2 font-medium">{mold.mold_name}</span>
            </div>
            <div>
              <span className="text-gray-600">위치:</span>
              <span className="ml-2 font-medium">{mold.location}</span>
            </div>
            <div>
              <span className="text-gray-600">누적 타수:</span>
              <span className="ml-2 font-medium">{mold.current_shots?.toLocaleString()} Shot</span>
            </div>
            {gpsLocation && (
              <div className="col-span-2 flex items-center gap-2">
                <MapPin size={16} className="text-primary-600" />
                <span className="text-gray-600">GPS:</span>
                <span className="ml-2 font-medium text-xs">
                  {gpsLocation.latitude.toFixed(4)}° N / {gpsLocation.longitude.toFixed(4)}° E
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 점검 주기 안내 */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 정기점검 주기 구분표</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>20,000 SHOT</strong> (3개월): 기본 항목 점검</p>
            <p>• <strong>50,000 SHOT</strong> (6개월): 20K + 추가 정밀 점검</p>
            <p>• <strong>80,000 SHOT</strong>: 50K + 청소/습합 집중</p>
            <p>• <strong>100,000 SHOT</strong> (1년): 전체 종합 점검</p>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            ※ 자동 알림: 각 단계 주기의 90% 도달 시 경고 발송
          </p>
        </div>

        {/* 점검 유형 선택 */}
        <div className="card mb-6">
          <h3 className="text-sm font-semibold mb-4">점검 유형 선택</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSPECTION_TYPES.map((type) => {
              const isRecommended = recommendedType?.id === type.id
              const totalItems = type.categories.reduce((sum, cat) => sum + cat.items.length, 0)
              
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isRecommended
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {isRecommended && (
                    <span className="inline-block px-2 py-1 bg-primary-600 text-white text-xs rounded mb-2">
                      권장
                    </span>
                  )}
                  <h4 className="font-semibold text-gray-900">{type.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{type.period}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {type.categories.length}개 카테고리 · {totalItems}개 항목
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // 점검 진행 화면
  const currentCategory = selectedType.categories[currentCategoryIndex]
  const totalCategories = selectedType.categories.length
  const allItems = selectedType.categories.flatMap(cat => cat.items)
  const completedItems = Object.keys(checkResults).filter(key => checkResults[key]?.status).length
  const progress = Math.round((completedItems / allItems.length) * 100)

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => setSelectedType(null)}
          className="text-sm text-primary-600 hover:text-primary-700 mb-2"
        >
          ← 점검 유형 변경
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{selectedType.name}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {mold.mold_code} - {mold.mold_name}
        </p>
      </div>

      {/* 전체 진행률 */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">전체 진행률</span>
          <span className="text-sm font-bold text-primary-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {completedItems} / {allItems.length} 항목 완료
        </p>
      </div>

      {/* 세척제 정보 (80K, 100K) */}
      {(selectedType.id === '80k' || selectedType.id === '100k') && (
        <div className="card mb-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-900 mb-3">🧼 세척 정보</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세척제 선택
              </label>
              <select
                value={cleaningMethod}
                onChange={(e) => setCleaningMethod(e.target.value)}
                className="input"
              >
                <option value="">선택하세요</option>
                <option value="드라이아이스">드라이아이스</option>
                <option value="초음파">초음파 세척</option>
                <option value="특수케미컬">특수 케미컬</option>
                <option value="브러시">브러시</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희석 비율 / 온도
              </label>
              <input
                type="text"
                value={cleaningRatio}
                onChange={(e) => setCleaningRatio(e.target.value)}
                className="input"
                placeholder="예: 1:10, 60°C"
              />
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 진행 상황 - 5열 그리드 */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold mb-3">카테고리별 진행 현황</h3>
        <div className="grid grid-cols-5 gap-3">
          {selectedType.categories.map((category, index) => {
            const { completed, total, percentage } = getCategoryProgress(category)
            const isActive = index === currentCategoryIndex
            
            return (
              <div 
                key={category.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  isActive 
                    ? 'bg-primary-50 border-primary-400 shadow-sm' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
                onClick={() => setCurrentCategoryIndex(index)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {completed === total ? '✅' : percentage > 0 ? '🔄' : '⏸️'}
                  </span>
                  <span className={`text-sm font-medium truncate ${isActive ? 'text-primary-900' : 'text-gray-700'}`}>
                    {category.name}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      completed === total ? 'bg-green-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-600">
                    {completed}/{total} ({percentage}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 현재 카테고리 점검 항목 */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {currentCategoryIndex + 1}. {currentCategory.name}
          </h2>
          <span className="text-sm text-gray-600">
            {currentCategoryIndex + 1} / {totalCategories}
          </span>
        </div>

        <div className="space-y-6">
          {currentCategory.items.map((item) => {
            const result = checkResults[item.id] || {}
            const isNumberField = item.fieldType === 'number'
            
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                {/* 항목 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {currentCategory.icon && <span>{currentCategory.icon}</span>}
                      {item.name}
                      {item.required && <span className="text-red-500 text-sm">*</span>}
                      {item.isShotLinked && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                          <Hash size={10} /> 숏수연동
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setShowGuide(item)}
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                  >
                    <BookOpen size={16} />
                    가이드
                  </button>
                </div>

                {/* 점검 포인트 */}
                {item.checkPoints && (
                  <div className="bg-blue-50 rounded p-3 mb-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">📋 점검 포인트:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {item.checkPoints.map((point, idx) => (
                        <li key={idx}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 숫자 입력 필드 (생산수량 등) */}
                {isNumberField ? (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.name} 입력 {item.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={result.value || ''}
                        onChange={(e) => setCheckResults(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], value: e.target.value, timestamp: new Date().toISOString() }
                        }))}
                        className="input w-40"
                        placeholder="수량 입력"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">개</span>
                      {item.isShotLinked && mold && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-600">현재 숏수:</span>
                          <span className="font-semibold text-primary-600">
                            {(mold.current_shots || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-500">/</span>
                          <span className="text-gray-600">
                            {(mold.guarantee_shots || mold.target_shots || 500000).toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            getShotPercentage() >= 100 ? 'bg-red-100 text-red-700' :
                            getShotPercentage() >= 90 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {getShotPercentage()}%
                          </span>
                        </div>
                      )}
                    </div>
                    {item.isShotLinked && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Info size={12} />
                        생산수량 입력 시 숏수가 자동으로 누적됩니다. 보증숏수 90% 도달 시 경고, 100% 도달 시 긴급 알림이 발송됩니다.
                      </p>
                    )}
                  </div>
                ) : (
                  /* 상태 선택 (양호/정비 필요/수리 필요) */
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상태 선택 {item.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex gap-3">
                      {['양호', '정비 필요', '수리 필요'].map((status) => (
                        <label key={status} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${item.id}`}
                            value={status}
                            checked={result.status === status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="mr-2"
                          />
                          <span className={`text-sm ${
                            status === '양호' ? 'text-green-700' :
                            status === '정비 필요' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {status}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 비고란 (체크포인트 기반 placeholder) */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비고 (선택)
                  </label>
                  <textarea
                    value={result.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="input resize-none"
                    rows="2"
                    placeholder={item.checkPoints ? `점검 포인트: ${item.checkPoints.join(', ')}` : '특이사항을 입력하세요'}
                  />
                </div>

                {/* 사진 추가 */}
                <InspectionPhotoSection
                  photos={result.photos || []}
                  onPhotosChange={(photos) => handlePhotosChange(item.id, photos)}
                  moldId={mold?.id || moldId}
                  itemId={item.id}
                  inspectionType="periodic"
                  maxPhotos={10}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* 저장 메시지 */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{saveMessage.text}</div>
      )}

      {/* 승인자 표시 */}
      {selectedApprover && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={16} className="text-blue-600" />
            <span className="text-sm text-blue-800">승인자: <strong>{selectedApprover.name}</strong> ({selectedApprover.email})</span>
          </div>
          <button onClick={() => setSelectedApprover(null)} className="text-blue-400 hover:text-blue-600"><X size={16} /></button>
        </div>
      )}

      {/* 임시저장 / 승인요청 버튼 */}
      <div className="flex gap-3 mb-4">
        <button onClick={handleSaveDraft} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
          <Save size={16} />{saving ? '저장중...' : '임시저장'}
        </button>
        <button onClick={handleRequestApproval} disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
            selectedApprover ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
          }`}>
          <Send size={16} />{selectedApprover ? `${selectedApprover.name}님 승인요청` : '승인자 선택'}
        </button>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <ChevronLeft size={20} />
          이전
        </button>
        
        {currentCategoryIndex === totalCategories - 1 ? (
          <button
            onClick={handleComplete}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            점검 완료
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            다음
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* 승인자 검색 모달 */}
      {showApproverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[70vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">승인자(금형개발 담당자) 선택</h3>
              <button onClick={() => setShowApproverModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input type="text" className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="이름 또는 이메일 검색" value={approverKeyword} onChange={(e) => setApproverKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchApprover()} />
                <button onClick={() => handleSearchApprover()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"><Search size={16} /></button>
              </div>
              <div className="space-y-2">
                {approverResults.length === 0 && approverKeyword && <p className="text-xs text-gray-500 text-center py-4">검색 결과가 없습니다.</p>}
                {approverResults.map(u => (
                  <button key={u.id} onClick={() => { setSelectedApprover(u); setShowApproverModal(false); setApproverKeyword(''); setApproverResults([]); }} className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition">
                    <div className="text-sm font-medium">
                      {u.name}
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${u.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.user_type === 'system_admin' ? '관리자' : '금형개발'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{u.email} {u.company_name && `| ${u.company_name}`}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="text-primary-600" size={20} />
                  점검 가이드
                </h3>
                <button
                  onClick={() => setShowGuide(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{showGuide.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{showGuide.description}</p>
                </div>
                
                {showGuide.checkPoints && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-900 mb-2">📋 점검 포인트</h5>
                    <ul className="space-y-2">
                      {showGuide.checkPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                          <span className="text-blue-500 mt-0.5">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h5 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h5>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• 점검 전 안전장비 착용 필수</li>
                    <li>• 이상 발견 시 즉시 보고</li>
                    <li>• 사진 촬영으로 기록 남기기</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => setShowGuide(null)}
                className="w-full mt-6 btn-primary"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
