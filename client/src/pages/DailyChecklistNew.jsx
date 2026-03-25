import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Camera, FileText, ChevronRight, ChevronLeft, BookOpen, ArrowLeft, Loader2, Info, Hash, Save, Send, Search, X, User } from 'lucide-react'
import api, { checklistMasterAPI } from '../lib/api'
import InspectionPhotoSection from '../components/InspectionPhotoSection'

// 폴백용 기본 일상점검 항목 (DB 로드 실패 시 사용)
const DEFAULT_CHECK_CATEGORIES = [
  {
    id: 1, name: '금형 외관 점검', icon: '🔍',
    items: [
      { id: 101, name: '금형 외관 상태', description: '금형 외관의 손상, 변형, 부식 여부 확인', required: true, fieldType: 'yes_no',
        checkPoints: ['금형 표면 스크래치 확인', '찌그러짐/변형 여부', '녹/부식 발생 여부', '외관 청결 상태'] },
      { id: 102, name: '금형 명판 상태', description: '명판 식별 가능 여부 확인', required: true, fieldType: 'yes_no',
        checkPoints: ['금형 번호 식별 가능', '제작일자 확인 가능', '명판 손상 여부'] },
      { id: 103, name: '파팅라인 상태', description: '파팅라인 밀착 상태 및 버 발생 여부', required: true, fieldType: 'yes_no',
        checkPoints: ['상/하형 접합부 밀착도', '버(Burr) 발생 여부', '수지 간섭 흔적 확인', '찌꺼기 제거 상태'] }
    ]
  },
  { id: 2, name: '냉각 시스템', icon: '💧', items: [
    { id: 201, name: '냉각수 연결 상태', description: '냉각수 라인 연결 및 누수 여부', required: true, fieldType: 'yes_no', checkPoints: ['입/출구 호스 연결 상태', '누수 여부 확인', '커플링 체결 상태'] },
    { id: 202, name: '냉각수 유량', description: '냉각수 흐름 원활 여부', required: true, fieldType: 'yes_no', checkPoints: ['입구 온도 측정', '출구 온도 측정', '온도차 5℃ 이하 확인'] },
    { id: 203, name: '냉각 채널 막힘', description: '냉각 채널 스케일/이물질 막힘', required: false, fieldType: 'yes_no', checkPoints: ['채널 막힘 여부', '스케일 축적 상태'] }
  ]},
  { id: 3, name: '작동부 점검', icon: '⚙️', items: [
    { id: 301, name: '이젝터 작동 상태', description: '이젝터 핀 작동 원활성', required: true, fieldType: 'yes_no', checkPoints: ['이젝터 핀 걸림 없음', '부드러운 작동 확인', '복귀 동작 정상'] },
    { id: 302, name: '슬라이드 작동 상태', description: '슬라이드 코어 작동 상태', required: false, fieldType: 'yes_no', checkPoints: ['슬라이드 이동 시 걸림 확인', '이상음 발생 여부'] },
    { id: 303, name: '가이드 핀/부시 상태', description: '가이드 핀 마모 및 유격', required: true, fieldType: 'yes_no', checkPoints: ['가이드핀 손상 확인', '마모 상태 점검'] },
    { id: 304, name: '밀핀/제품핀', description: '작동 시 걸림, 파손, 변형 無', required: true, fieldType: 'yes_no', checkPoints: ['밀핀 작동 확인', '파손 여부 점검'] },
    { id: 305, name: '리턴 핀/스프링', description: '리턴 핀 작동 및 스프링 탄성', required: true, fieldType: 'yes_no', checkPoints: ['리턴 핀 복귀 동작', '스프링 탄성 상태'] }
  ]},
  { id: 4, name: '게이트/런너/벤트', icon: '🔄', items: [
    { id: 401, name: '게이트 상태', description: '게이트 마모 및 손상 여부', required: true, fieldType: 'yes_no', checkPoints: ['게이트 마모 확인', '변형/손상 여부'] },
    { id: 402, name: '런너 상태', description: '런너 청결 및 막힘 여부', required: true, fieldType: 'yes_no', checkPoints: ['잔류 수지 확인', '이물질 여부'] },
    { id: 403, name: '벤트 상태', description: '가스 벤트 막힘 여부', required: true, fieldType: 'yes_no', checkPoints: ['벤트 구멍 막힘 확인', '가스 배출 원활성'] }
  ]},
  { id: 5, name: '히터/센서/전기', icon: '🌡️', items: [
    { id: 501, name: '히터/온도센서 상태', description: '히터 작동 및 센서 정상 여부', required: false, fieldType: 'yes_no', checkPoints: ['히터 작동 확인', '온도센서 정상 작동'] },
    { id: 502, name: '배선/커넥터 상태', description: '전기 배선 손상 여부', required: false, fieldType: 'yes_no', checkPoints: ['배선 피복 상태', '커넥터 접촉 상태'] }
  ]},
  { id: 6, name: '체결/취출 계통', icon: '🔧', items: [
    { id: 601, name: '금형 체결볼트', description: '풀림, 균열, 아이마킹 상태', required: true, fieldType: 'yes_no', checkPoints: ['볼트 풀림 확인', '균열 발생 여부'] },
    { id: 602, name: '로케이트링/스프루부', description: '위치이탈, 손상 無', required: true, fieldType: 'yes_no', checkPoints: ['로케이트링 위치', '스프루부 손상 여부'] },
    { id: 603, name: '취출핀/스프링', description: '정상작동, 파손·마모 無', required: true, fieldType: 'yes_no', checkPoints: ['취출핀 작동 확인', '스프링 탄성 상태'] }
  ]},
  { id: 7, name: '윤활/청결 관리', icon: '🧴', items: [
    { id: 701, name: '슬라이드/핀류 윤활', description: '그리스 도포 상태 양호', required: true, fieldType: 'yes_no', checkPoints: ['슬라이드 그리스 상태', '핀류 윤활 상태'] },
    { id: 702, name: '옥글라/리프트핀 윤활', description: '그리스 도포 상태 양호', required: true, fieldType: 'yes_no', checkPoints: ['옥글라 그리스 상태', '리프트핀 윤활 상태'] },
    { id: 703, name: '성형면 청결', description: '캐비티/코어 이물질 제거', required: true, fieldType: 'yes_no', checkPoints: ['캐비티 표면 수지 잔류 확인', '코어 청결 상태'] }
  ]},
  { id: 8, name: '이상/누출 점검', icon: '⚠️', items: [
    { id: 801, name: '누유/누수 여부', description: '냉각수, 오일, 에어라인 이상 無', required: true, fieldType: 'yes_no', checkPoints: ['냉각수 누수 확인', '오일 누유 확인', '에어라인 이상 확인'] }
  ]},
  { id: 9, name: '방청 관리', icon: '🛡️', items: [
    { id: 901, name: '방청유 도포', description: '보관 시 성형면 방청처리 (비가동 시)', required: false, fieldType: 'yes_no', checkPoints: ['방청유 도포 상태', '성형면 처리 확인'] }
  ]},
  { id: 10, name: '생산 정보', icon: '📊', items: [
    { id: 1001, name: '생산수량', description: '금일 생산수량 입력 (숏수 자동 누적)', required: false, fieldType: 'number', isShotLinked: true,
      checkPoints: ['생산수량 정확히 입력', '숏수 자동 누적 확인', '보증숏수 90% 도달 시 경고', '100% 도달 시 긴급 알림'] }
  ]}
]

/**
 * DB 마스터 항목을 프론트엔드 카테고리 구조로 변환
 * @param {Array} items - checklist_items_master 레코드 배열
 * @returns {Array} CHECK_CATEGORIES 형태 배열
 */
function convertMasterItemsToCategories(items) {
  const categoryMap = new Map()

  items.forEach(item => {
    const catKey = item.major_category
    if (!categoryMap.has(catKey)) {
      categoryMap.set(catKey, {
        name: catKey,
        icon: item.category_icon || '',
        items: []
      })
    }
    const cat = categoryMap.get(catKey)
    const checkPoints = Array.isArray(item.check_points)
      ? item.check_points
      : (typeof item.check_points === 'string' ? JSON.parse(item.check_points || '[]') : [])

    cat.items.push({
      id: item.id,
      name: item.item_name,
      description: item.description || '',
      required: item.is_required !== false,
      fieldType: item.field_type || 'yes_no',
      checkPoints,
      isShotLinked: item.extra_config?.isShotLinked || item.field_type === 'number'
    })
  })

  return Array.from(categoryMap.values()).map((cat, idx) => ({
    id: idx + 1,
    ...cat
  }))
}

export default function DailyChecklistNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const moldId = searchParams.get('moldId') || searchParams.get('mold')

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [checkResults, setCheckResults] = useState({})
  const [showGuide, setShowGuide] = useState(null)
  const [mold, setMold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [productionQty, setProductionQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [showApproverModal, setShowApproverModal] = useState(false)
  const [approverSearchKeyword, setApproverSearchKeyword] = useState('')
  const [approverSearchResults, setApproverSearchResults] = useState([])
  const [allApprovers, setAllApprovers] = useState([])
  const [approverLoading, setApproverLoading] = useState(false)
  const [selectedApprover, setSelectedApprover] = useState(null)
  const [saveMessage, setSaveMessage] = useState(null)
  const [CHECK_CATEGORIES, setCheckCategories] = useState(DEFAULT_CHECK_CATEGORIES)
  const [masterSource, setMasterSource] = useState('default')

  const currentCategory = CHECK_CATEGORIES[currentCategoryIndex]
  const totalCategories = CHECK_CATEGORIES.length
  const totalItems = CHECK_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0)
  const completedItems = Object.keys(checkResults).filter(key => checkResults[key]?.status || checkResults[key]?.value !== undefined).length
  const progress = Math.round((completedItems / totalItems) * 100)

  // 마스터 항목 로드 (DB → 폴백)
  useEffect(() => {
    const loadMasterItems = async () => {
      try {
        const res = await checklistMasterAPI.getItems({ inspection_type: 'daily', is_active: 'true' })
        if (res.data?.success && res.data.data?.length > 0) {
          const categories = convertMasterItemsToCategories(res.data.data)
          if (categories.length > 0 && categories.reduce((s, c) => s + c.items.length, 0) > 0) {
            setCheckCategories(categories)
            setMasterSource('database')
            console.log(`[DailyChecklist] 마스터 DB에서 ${res.data.data.length}개 항목 로드 완료`)
          }
        }
      } catch (err) {
        console.log('[DailyChecklist] 마스터 DB 로드 실패, 기본값 사용:', err.message)
      }
    }
    loadMasterItems()
  }, [])

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
            // 기본값 설정
            setMold({
              id: moldId,
              mold_code: `MOLD-${moldId}`,
              mold_name: '금형',
              car_model: '-',
              current_shots: 0,
              guarantee_shots: 500000
            })
          }
        } else {
          setMold({
            id: 1,
            mold_code: 'SAMPLE-001',
            mold_name: '샘플 금형',
            car_model: '-',
            current_shots: 0,
            guarantee_shots: 500000
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
          guarantee_shots: 500000
        })
      } finally {
        setLoading(false)
      }
    }
    loadMoldData()
  }, [moldId])

  // Draft 복원 (서버 checklist-instances에서)
  useEffect(() => {
    if (!moldId) return
    ;(async () => {
      try {
        const res = await api.get(`/checklist-instances/mold/${moldId}/status`)
        if (res.data?.success) {
          const dailyLatest = res.data.data?.daily?.latest
          if (dailyLatest && dailyLatest.status === 'draft') {
            const detailRes = await api.get(`/checklist-instances/${dailyLatest.id}`)
            if (detailRes.data?.success && detailRes.data.data) {
              const serverDraft = detailRes.data.data
              const results = typeof serverDraft.results === 'string' ? JSON.parse(serverDraft.results) : serverDraft.results
              if (results && Object.keys(results).length > 0) {
                setCheckResults(results)
                setSaveMessage({ type: 'success', text: `서버 임시저장 복원됨 (${new Date(serverDraft.check_date).toLocaleString()})` })
                setTimeout(() => setSaveMessage(null), 4000)
              }
            }
          }
        }
      } catch (err) {
        console.log('서버 draft 조회 실패:', err)
      }
    })()
  }, [moldId])

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
    if (currentCategoryIndex < totalCategories - 1) {
      setCurrentCategoryIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1)
    }
  }

  const buildPayload = (status, approverId = null) => ({
    mold_id: mold.id,
    check_date: new Date().toISOString(),
    status,
    approver_id: approverId,
    results: checkResults,
    production_quantity: productionQty ? parseInt(productionQty) : 0,
    summary: {
      total: totalItems,
      completed: completedItems,
      good: Object.values(checkResults).filter(r => r.status === '양호').length,
      warning: Object.values(checkResults).filter(r => r.status === '주의').length,
      bad: Object.values(checkResults).filter(r => r.status === '불량').length
    }
  })

  const handleSaveDraft = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const payload = buildPayload('draft')
      await api.post('/checklist-instances/daily/draft', payload)
      setSaveMessage({ type: 'success', text: '임시저장이 완료되었습니다.' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('임시저장 실패:', err)
      setSaveMessage({ type: 'error', text: '임시저장에 실패했습니다.' })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  // 승인자 목록 프리로드 (모달 오픈 시 1회)
  const loadApprovers = async () => {
    if (allApprovers.length > 0) return
    setApproverLoading(true)
    try {
      const res = await api.get('/workflow/approvers/search', { params: { limit: 100 } })
      if (res.data.success) {
        setAllApprovers(res.data.data)
        setApproverSearchResults(res.data.data)
      }
    } catch (err) {
      console.error('승인자 목록 로드 실패:', err)
    } finally {
      setApproverLoading(false)
    }
  }

  // 클라이언트 측 즉시 필터링
  const filterApprovers = (keyword) => {
    const term = (keyword || '').trim().toLowerCase()
    if (!term) {
      setApproverSearchResults(allApprovers)
      return
    }
    setApproverSearchResults(
      allApprovers.filter(u =>
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      )
    )
  }

  const handleSelectApprover = (approver) => {
    setSelectedApprover(approver)
    setShowApproverModal(false)
    setApproverSearchKeyword('')
    setApproverSearchResults(allApprovers)
  }

  const handleRequestApproval = async () => {
    if (!selectedApprover) {
      setShowApproverModal(true)
      loadApprovers()
      return
    }

    const requiredItems = CHECK_CATEGORIES.flatMap(cat =>
      cat.items.filter(item => item.required)
    )
    const completedRequired = requiredItems.filter(item =>
      checkResults[item.id]?.status
    )
    if (completedRequired.length < requiredItems.length) {
      alert(`필수 항목을 모두 완료해주세요. (${completedRequired.length}/${requiredItems.length})`)
      return
    }

    setSaving(true)
    setSaveMessage(null)
    try {
      await api.post('/checklist-instances/daily/request-approval', buildPayload('pending_approval', selectedApprover.id))
      setSaveMessage({ type: 'success', text: `${selectedApprover.name}님께 승인요청이 완료되었습니다.` })
      setTimeout(() => navigate('/molds'), 2000)
    } catch (err) {
      console.error('승인요청 실패:', err)
      setSaveMessage({ type: 'error', text: '승인요청에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    const requiredItems = CHECK_CATEGORIES.flatMap(cat => 
      cat.items.filter(item => item.required)
    )
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
      await api.post('/checklist-instances/daily/complete', payload)
      alert('일상점검이 완료되었습니다!')
      navigate('/molds')
    } catch (err) {
      console.error('일상점검 완료 실패:', err)
      alert(err?.response?.data?.message || '점검 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryProgress = (category) => {
    const completed = category.items.filter(item => checkResults[item.id]?.status || checkResults[item.id]?.value !== undefined).length
    const total = category.items.length
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const handleValueChange = (itemId, value) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        value,
        timestamp: new Date().toISOString()
      }
    }))
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">일상점검</h1>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
              masterSource === 'database' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {masterSource === 'database' ? '마스터 연동' : '기본 항목'}
            </span>
          </div>
        <p className="text-sm text-gray-600 mt-1">
          {mold.mold_code} - {mold.mold_name} ({mold.car_model})
        </p>
          <p className="text-xs text-gray-500 mt-1">
            누적 타수: {mold.current_shots?.toLocaleString()} / {mold.target_shots?.toLocaleString()} Shot
          </p>
        </div>
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
          {completedItems} / {totalItems} 항목 완료
        </p>
      </div>

      {/* 카테고리 진행 상황 - 5열 그리드 */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold mb-3">카테고리별 진행 현황</h3>
        <div className="grid grid-cols-5 gap-3">
          {CHECK_CATEGORIES.map((category, index) => {
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
                        onChange={(e) => handleValueChange(item.id, e.target.value)}
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
                  /* 상태 선택 (양호/주의/불량) */
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상태 선택 {item.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex gap-3">
                      {['양호', '주의', '불량'].map((status) => (
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
                            status === '주의' ? 'text-yellow-700' :
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
                  inspectionType="daily"
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
          saveMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* 승인자 선택 표시 */}
      {selectedApprover && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={16} className="text-blue-600" />
            <span className="text-sm text-blue-800">
              승인자: <strong>{selectedApprover.name}</strong> ({selectedApprover.email})
            </span>
          </div>
          <button 
            onClick={() => setSelectedApprover(null)}
            className="text-blue-400 hover:text-blue-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 임시저장 / 승인요청 버튼 */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? '저장 중...' : '임시저장'}
        </button>

        <button
          onClick={handleRequestApproval}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            selectedApprover
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          <Send size={18} />
          {selectedApprover ? `${selectedApprover.name}님께 승인요청` : '승인자 선택'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">승인자(금형개발 담당자) 선택</h2>
              <button onClick={() => setShowApproverModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="input flex-1"
                placeholder="이름 또는 이메일로 검색"
                value={approverSearchKeyword}
                onChange={(e) => { const v = e.target.value; setApproverSearchKeyword(v); filterApprovers(v) }}
                autoFocus
              />
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
              {approverLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">승인자 목록 로딩 중...</span>
                </div>
              ) : approverSearchResults.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">검색 결과가 없습니다.</p>
              ) : (
                approverSearchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectApprover(user)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {user.name}
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${user.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.user_type === 'system_admin' ? '관리자' : '금형개발'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{user.email} {user.company_name && `| ${user.company_name}`}</div>
                  </button>
                ))
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{approverSearchResults.length}명 표시</p>
          </div>
        </div>
      )}

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen size={24} className="text-primary-600" />
              점검 가이드 - {showGuide.name}
            </h2>

            <div className="space-y-4">
              {/* 점검 포인트 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 점검 포인트</h3>
                <ul className="space-y-1">
                  {showGuide.checkPoints?.map((point, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 참고 사진 (임시) */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📷 참고 사진</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                    양호 예시
                  </div>
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                    불량 예시
                  </div>
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                    점검 방법
                  </div>
                </div>
              </div>

              {/* 점검 매뉴얼 (임시) */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📄 점검 매뉴얼</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <FileText size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-700">점검 매뉴얼.pdf</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(null)}
              className="mt-6 w-full btn-secondary"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
