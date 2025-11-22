import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { moldAPI } from '../lib/api'
import { AlertCircle, CheckCircle, Camera, FileText } from 'lucide-react'

export default function PeriodicInspection() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const moldId = searchParams.get('mold')
  
  const [mold, setMold] = useState(null)
  const [inspectionType, setInspectionType] = useState('') // 20K, 50K, 100K, 120K+
  const [shotCount, setShotCount] = useState('')
  
  const inspectionTypes = [
    { value: '20K', label: '20K Shot 점검', description: '기본 점검 항목' },
    { value: '50K', label: '50K Shot 점검', description: '중간 점검 + 세척' },
    { value: '100K', label: '100K Shot 점검', description: '전면 점검 + 세척' },
    { value: '120K+', label: '120K+ Shot 점검', description: '전면 점검 + 융착 + 세척' },
  ]

  useEffect(() => {
    if (moldId) {
      loadMold()
    }
  }, [moldId])

  const loadMold = async () => {
    try {
      const response = await moldAPI.getById(moldId)
      setMold(response.data.data)
      setShotCount(response.data.data.total_shots?.toString() || '')
      
      // 자동으로 점검 타입 추천
      const shots = response.data.data.total_shots || 0
      if (shots >= 120000) {
        setInspectionType('120K+')
      } else if (shots >= 100000) {
        setInspectionType('100K')
      } else if (shots >= 50000) {
        setInspectionType('50K')
      } else if (shots >= 20000) {
        setInspectionType('20K')
      }
    } catch (error) {
      console.error('Failed to load mold:', error)
    }
  }

  const getRecommendedType = () => {
    const shots = parseInt(shotCount) || 0
    if (shots >= 120000) return '120K+'
    if (shots >= 100000) return '100K'
    if (shots >= 50000) return '50K'
    if (shots >= 20000) return '20K'
    return null
  }

  const startInspection = () => {
    if (!inspectionType) {
      alert('점검 타입을 선택해주세요.')
      return
    }
    alert(`${inspectionType} 정기점검이 시작됩니다.\n(상세 체크리스트는 추후 구현 예정)`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">정기점검</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* 금형 정보 */}
        {mold && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">금형 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">금형번호</p>
                <p className="font-semibold">{mold.mold_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">금형명</p>
                <p className="font-semibold">{mold.mold_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">제품명</p>
                <p className="font-semibold">{mold.product_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">누적 타수</p>
                <p className="font-semibold text-primary-600">
                  {mold.total_shots?.toLocaleString() || 0} Shot
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 점검 타입 선택 */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">점검 타입 선택</h2>
          
          {getRecommendedType() && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  현재 누적 타수 기준 권장: <span className="font-bold">{getRecommendedType()}</span>
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  누적 타수에 따라 적절한 점검 타입이 자동 선택됩니다.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspectionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setInspectionType(type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  inspectionType === type.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                  {inspectionType === type.value && (
                    <CheckCircle className="text-primary-600" size={20} />
                  )}
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 점검 항목 미리보기 */}
        {inspectionType && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">점검 항목 ({inspectionType})</h2>
            
            <div className="space-y-4">
              {inspectionType === '20K' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>기본 외관 점검</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>작동부 점검</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>냉각 시스템 점검</span>
                  </div>
                </div>
              )}

              {inspectionType === '50K' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>20K 점검 항목 전체</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-yellow-600" />
                    <span>세척 작업 (노즐, 게이트)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>파팅면 상태 점검</span>
                  </div>
                </div>
              )}

              {inspectionType === '100K' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>50K 점검 항목 전체</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-yellow-600" />
                    <span>전면 세척 작업</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>정밀 측정 (치수, 경도)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>유압/전기 시스템 점검</span>
                  </div>
                </div>
              )}

              {inspectionType === '120K+' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>100K 점검 항목 전체</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-red-600" />
                    <span>융착 점검 (필수)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-yellow-600" />
                    <span>전면 세척 + 융착 처리</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>종합 성능 테스트</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <Camera className="inline mr-1" size={16} />
                모든 점검 항목은 사진 첨부가 필요합니다.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <FileText className="inline mr-1" size={16} />
                점검 완료 후 보고서가 자동 생성됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 시작 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/molds')}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button
            onClick={startInspection}
            disabled={!inspectionType}
            className="btn-primary flex-1"
          >
            점검 시작
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">정기점검 안내</p>
              <ul className="text-yellow-800 space-y-1 list-disc list-inside">
                <li>정기점검은 누적 타수에 따라 주기적으로 실시됩니다.</li>
                <li>120K Shot 이상은 융착 점검이 필수입니다.</li>
                <li>모든 점검 항목은 사진 첨부가 권장됩니다.</li>
                <li>점검 완료 후 승인 절차가 진행됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
