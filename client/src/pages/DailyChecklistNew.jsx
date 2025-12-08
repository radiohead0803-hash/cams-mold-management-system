import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Camera, FileText, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react'

// DAILY_CHECK_ITEMS.md 기준 10개 카테고리, 17개 항목
const CHECK_CATEGORIES = [
  {
    id: 1,
    name: '정결관리',
    items: [
      {
        id: 1,
        name: '성형물 청결',
        description: '캐비티, 코어, 파팅면, 게이트, 벤트부 이물(수지, 가스, 오일 등) 확인',
        required: true,
        checkPoints: [
          '캐비티 표면에 수지 잔류 확인',
          '게이트 부위 막힘 여부',
          '벤트 구멍 막힘 확인',
          '파팅면 이물질 제거 상태'
        ]
      },
      {
        id: 2,
        name: '파팅면 상태',
        description: '파팅면이 수지간섭, 찌꺼기 등 無',
        required: true,
        checkPoints: [
          '파팅면 청결 상태 확인',
          '수지 간섭 흔적 확인',
          '찌꺼기 제거 상태'
        ]
      }
    ]
  },
  {
    id: 2,
    name: '작동부 점검',
    items: [
      {
        id: 3,
        name: '슬라이드 작동상태',
        description: '슬라이드 이동 시 걸림/이상음 無',
        required: true,
        checkPoints: [
          '슬라이드 이동 시 걸림 확인',
          '이상음 발생 여부',
          '작동 속도 정상 여부'
        ]
      },
      {
        id: 4,
        name: '가이드핀/리테이너',
        description: '핀손, 마모, 운동상태 확인',
        required: true,
        checkPoints: [
          '가이드핀 손상 확인',
          '마모 상태 점검',
          '운동 상태 확인'
        ]
      },
      {
        id: 5,
        name: '밀핀/제품핀',
        description: '작동 시 걸림, 파손, 변형 無',
        required: true,
        checkPoints: [
          '밀핀 작동 확인',
          '파손 여부 점검',
          '변형 상태 확인'
        ]
      }
    ]
  },
  {
    id: 3,
    name: '냉각관리',
    items: [
      {
        id: 6,
        name: '냉각라인 상태',
        description: '입출수 라인 연결불 누수/막힘 無',
        required: true,
        checkPoints: [
          '입출수 라인 연결 상태',
          '누수 여부 확인',
          '막힘 상태 점검'
        ]
      },
      {
        id: 7,
        name: '냉각수 유량',
        description: '적/우 온도차 5℃ 이하',
        required: true,
        checkPoints: [
          '입구 온도 측정',
          '출구 온도 측정',
          '온도차 5℃ 이하 확인'
        ]
      }
    ]
  },
  {
    id: 4,
    name: '온도·전기·계통',
    items: [
      {
        id: 8,
        name: '히터/온도센서 작동',
        description: '단선, 접촉불량, 과열 無',
        required: true,
        checkPoints: [
          '히터 작동 확인',
          '온도센서 정상 작동',
          '과열 여부 점검'
        ]
      },
      {
        id: 9,
        name: '배선/커넥터',
        description: '피복 손상, 접촉불량 無',
        required: true,
        checkPoints: [
          '배선 피복 상태',
          '커넥터 접촉 상태',
          '단선 여부 확인'
        ]
      }
    ]
  },
  {
    id: 5,
    name: '재결상태',
    items: [
      {
        id: 10,
        name: '금형 체결볼트',
        description: '풀림, 균열, 아이마킹 틀어짐 유무 無',
        required: true,
        checkPoints: [
          '볼트 풀림 확인',
          '균열 발생 여부',
          '아이마킹 상태'
        ]
      },
      {
        id: 11,
        name: '로케이트링/스프루부',
        description: '위치이탈, 손상 無',
        required: true,
        checkPoints: [
          '로케이트링 위치',
          '스프루부 손상 여부',
          '고정 상태 확인'
        ]
      }
    ]
  },
  {
    id: 6,
    name: '취출계통',
    items: [
      {
        id: 12,
        name: '취출핀/스프링',
        description: '정상작동, 파손·마모 無',
        required: true,
        checkPoints: [
          '취출핀 작동 확인',
          '스프링 탄성 상태',
          '파손/마모 여부'
        ]
      }
    ]
  },
  {
    id: 7,
    name: '윤활관리',
    items: [
      {
        id: 13,
        name: '슬라이드, 핀류',
        description: '그리스 도포 상태 양호',
        required: true,
        checkPoints: [
          '슬라이드 그리스 상태',
          '핀류 윤활 상태',
          '그리스 도포량 적정'
        ]
      },
      {
        id: 14,
        name: '엘글라/리프트핀',
        description: '그리스 도포 상태 양호',
        required: true,
        checkPoints: [
          '엘글라 그리스 상태',
          '리프트핀 윤활 상태',
          '도포 상태 확인'
        ]
      }
    ]
  },
  {
    id: 8,
    name: '이상유무',
    items: [
      {
        id: 15,
        name: '누유/누수 여부',
        description: '냉각수, 오일, 에어라인 이상 無',
        required: true,
        checkPoints: [
          '냉각수 누수 확인',
          '오일 누유 확인',
          '에어라인 이상 확인'
        ]
      }
    ]
  },
  {
    id: 9,
    name: '외관상태',
    items: [
      {
        id: 16,
        name: '금형 외관/명판',
        description: '찌손, 식별불가 無',
        required: true,
        checkPoints: [
          '외관 손상 확인',
          '명판 식별 가능 여부',
          '찌손 상태 점검'
        ]
      }
    ]
  },
  {
    id: 10,
    name: '방청관리(비가동 시)',
    items: [
      {
        id: 17,
        name: '방청유 도포',
        description: '보관 시 성형면 방청처리',
        required: false,
        checkPoints: [
          '방청유 도포 상태',
          '성형면 처리 확인',
          '보관 환경 적정'
        ]
      }
    ]
  }
]

export default function DailyChecklistNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const moldId = searchParams.get('mold')

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [checkResults, setCheckResults] = useState({})
  const [showGuide, setShowGuide] = useState(null)
  const [mold, setMold] = useState(null)

  const currentCategory = CHECK_CATEGORIES[currentCategoryIndex]
  const totalCategories = CHECK_CATEGORIES.length
  const totalItems = CHECK_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0)
  const completedItems = Object.keys(checkResults).filter(key => checkResults[key]?.status).length
  const progress = Math.round((completedItems / totalItems) * 100)

  useEffect(() => {
    // 금형 정보 로드 (임시 데이터)
    setMold({
      id: moldId || 1,
      mold_code: 'M-2024-001',
      mold_name: '도어 트림 금형',
      car_model: 'K5',
      current_shots: 152238,
      target_shots: 500000
    })
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

  const handlePhotoAdd = (itemId) => {
    alert('사진 추가 기능은 추후 구현됩니다.')
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

  const handleComplete = () => {
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

    const summary = {
      mold_id: mold.id,
      check_date: new Date().toISOString(),
      results: checkResults,
      summary: {
        total: totalItems,
        completed: completedItems,
        good: Object.values(checkResults).filter(r => r.status === '양호').length,
        warning: Object.values(checkResults).filter(r => r.status === '주의').length,
        bad: Object.values(checkResults).filter(r => r.status === '불량').length
      }
    }

    console.log('일상점검 완료:', summary)
    alert('일상점검이 완료되었습니다!')
    navigate('/molds')
  }

  const getCategoryProgress = (category) => {
    const completed = category.items.filter(item => checkResults[item.id]?.status).length
    const total = category.items.length
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  if (!mold) {
    return <div className="card text-center py-12">로딩 중...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">일상점검</h1>
        <p className="text-sm text-gray-600 mt-1">
          {mold.mold_code} - {mold.mold_name} ({mold.car_model})
        </p>
        <p className="text-xs text-gray-500 mt-1">
          누적 타수: {mold.current_shots?.toLocaleString()} / {mold.target_shots?.toLocaleString()} Shot
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
            
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                {/* 항목 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {item.name}
                      {item.required && <span className="text-red-500 text-sm">*</span>}
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

                {/* 상태 선택 */}
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

                {/* 특이사항 */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    특이사항 (선택)
                  </label>
                  <textarea
                    value={result.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="input resize-none"
                    rows="2"
                    placeholder="특이사항을 입력하세요"
                  />
                </div>

                {/* 사진 추가 */}
                <div>
                  <button
                    onClick={() => handlePhotoAdd(item.id)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} />
                    점검 사진 추가
                  </button>
                </div>
              </div>
            )
          })}
        </div>
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
