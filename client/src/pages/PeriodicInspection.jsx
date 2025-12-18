import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { moldAPI, periodicInspectionAPI } from '../lib/api'
import { AlertCircle, CheckCircle, Camera, FileText, X, Upload, Image, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function PeriodicInspection() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const moldId = searchParams.get('mold')
  
  const [mold, setMold] = useState(null)
  const [inspectionType, setInspectionType] = useState('') // 20K, 50K, 80K, 100K
  const [shotCount, setShotCount] = useState('')
  const [step, setStep] = useState(1) // 1: 타입선택, 2: 체크리스트, 3: 완료
  const [checklistItems, setChecklistItems] = useState([])
  const [itemResults, setItemResults] = useState({}) // { itemId: { status: 'good'|'warning'|'bad', note: '', photos: [] } }
  const [photos, setPhotos] = useState([]) // 전체 사진
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const fileInputRef = useRef(null)
  const [currentItemId, setCurrentItemId] = useState(null)
  
  const inspectionTypes = [
    { value: '20000', label: '20,000 SHOT 점검', description: '기본 점검 + 세척 항목' },
    { value: '50000', label: '50,000 SHOT 점검', description: '중간 점검 + 세척 항목' },
    { value: '80000', label: '80,000 SHOT 점검', description: '전면 점검 + 세척' },
    { value: '100000', label: '100,000 SHOT 점검', description: '전면 점검 + 융착 + 세척' },
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
      if (shots >= 100000) {
        setInspectionType('100000')
      } else if (shots >= 80000) {
        setInspectionType('80000')
      } else if (shots >= 50000) {
        setInspectionType('50000')
      } else if (shots >= 20000) {
        setInspectionType('20000')
      }
    } catch (error) {
      console.error('Failed to load mold:', error)
    }
  }

  const getRecommendedType = () => {
    const shots = parseInt(shotCount) || 0
    if (shots >= 100000) return '100000'
    if (shots >= 80000) return '80000'
    if (shots >= 50000) return '50000'
    if (shots >= 20000) return '20000'
    return null
  }

  const loadChecklistItems = async (type) => {
    try {
      const response = await periodicInspectionAPI.getChecklistItems(type)
      if (response.data.success) {
        setChecklistItems(response.data.data || [])
        // 초기 결과 상태 설정
        const initialResults = {}
        response.data.data.forEach(item => {
          initialResults[item.id] = { status: '', note: '', photos: [] }
        })
        setItemResults(initialResults)
        // 카테고리 펼침 상태 초기화
        const categories = [...new Set(response.data.data.map(item => item.major_category))]
        const expandedState = {}
        categories.forEach(cat => { expandedState[cat] = true })
        setExpandedCategories(expandedState)
      }
    } catch (error) {
      console.error('Failed to load checklist items:', error)
      // 기본 항목 사용
      setChecklistItems(getDefaultItems(type))
    }
  }

  const getDefaultItems = (type) => {
    const baseItems = [
      { id: 1, major_category: '외관점검', item_name: '금형 외관 상태', description: '금형 외관 손상 여부 확인', required_photo: true },
      { id: 2, major_category: '외관점검', item_name: '파팅면 상태', description: '파팅면 마모/손상 확인', required_photo: true },
      { id: 3, major_category: '작동부점검', item_name: '가이드핀 상태', description: '가이드핀 마모 확인', required_photo: false },
      { id: 4, major_category: '작동부점검', item_name: '이젝터 작동', description: '이젝터 작동 상태 확인', required_photo: false },
      { id: 5, major_category: '냉각시스템', item_name: '냉각수 누수', description: '냉각수 누수 여부 확인', required_photo: false },
    ]
    
    const cleaningItems = [
      { id: 101, major_category: '세척점검', item_name: '금형 외곽 세척', description: '금형 외곽 세척 상태 확인', required_photo: true },
      { id: 102, major_category: '세척점검', item_name: '코어/캐비티 이물', description: '코어/캐비티 내 이물 제거 상태', required_photo: true },
      { id: 103, major_category: '세척점검', item_name: '벤트·게이트 세척', description: '벤트·게이트 세척 상태', required_photo: false },
      { id: 104, major_category: '세척점검', item_name: '세척제 사용', description: '사용 세척제 및 희석 비율 기록', required_photo: false },
      { id: 105, major_category: '세척점검', item_name: '세척 완료 확인', description: '세척 완료 시간/담당자 기록', required_photo: false },
    ]
    
    // 20K, 50K, 80K, 100K 모두 세척 항목 포함
    return [...baseItems, ...cleaningItems]
  }

  const handleItemStatusChange = (itemId, status) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status }
    }))
  }

  const handleItemNoteChange = (itemId, note) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], note }
    }))
  }

  const handlePhotoUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newPhotos = []
      for (const file of files) {
        const reader = new FileReader()
        const photoData = await new Promise((resolve) => {
          reader.onload = (e) => resolve({
            id: Date.now() + Math.random(),
            file,
            preview: e.target.result,
            itemId: currentItemId,
            name: file.name
          })
          reader.readAsDataURL(file)
        })
        newPhotos.push(photoData)
      }
      
      if (currentItemId) {
        setItemResults(prev => ({
          ...prev,
          [currentItemId]: {
            ...prev[currentItemId],
            photos: [...(prev[currentItemId]?.photos || []), ...newPhotos]
          }
        }))
      } else {
        setPhotos(prev => [...prev, ...newPhotos])
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('사진 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setCurrentItemId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removePhoto = (photoId, itemId) => {
    if (itemId) {
      setItemResults(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photos: prev[itemId].photos.filter(p => p.id !== photoId)
        }
      }))
    } else {
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    }
  }

  const openFileDialog = (itemId = null) => {
    setCurrentItemId(itemId)
    fileInputRef.current?.click()
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getItemsByCategory = () => {
    const grouped = {}
    checklistItems.forEach(item => {
      const cat = item.major_category || '기타'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(item)
    })
    return grouped
  }

  const getCompletionRate = () => {
    const total = checklistItems.length
    if (total === 0) return 0
    const completed = Object.values(itemResults).filter(r => r.status).length
    return Math.round((completed / total) * 100)
  }

  const startInspection = async () => {
    if (!inspectionType) {
      alert('점검 타입을 선택해주세요.')
      return
    }
    await loadChecklistItems(inspectionType)
    setStep(2)
  }

  const handleSubmitInspection = async () => {
    // 필수 항목 체크
    const requiredItems = checklistItems.filter(item => item.required_photo)
    const missingPhotos = requiredItems.filter(item => 
      !itemResults[item.id]?.photos?.length && !itemResults[item.id]?.status
    )
    
    if (missingPhotos.length > 0) {
      const confirm = window.confirm(
        `${missingPhotos.length}개의 필수 사진 항목이 누락되었습니다. 계속 진행하시겠습니까?`
      )
      if (!confirm) return
    }

    setSaving(true)
    try {
      // 정기점검 생성
      const inspectionData = {
        mold_id: parseInt(moldId),
        inspection_type: inspectionType,
        inspection_date: new Date().toISOString(),
        current_shots: parseInt(shotCount) || 0,
        items: checklistItems.map(item => ({
          checklist_item_id: item.id,
          item_name: item.item_name,
          status: itemResults[item.id]?.status || 'pending',
          note: itemResults[item.id]?.note || '',
          photo_count: itemResults[item.id]?.photos?.length || 0
        }))
      }

      const response = await periodicInspectionAPI.create(inspectionData)
      
      if (response.data.success) {
        // 사진 업로드 (있는 경우)
        const inspectionId = response.data.data.id
        const allPhotos = [
          ...photos,
          ...Object.entries(itemResults).flatMap(([itemId, result]) => 
            (result.photos || []).map(p => ({ ...p, itemId }))
          )
        ]

        if (allPhotos.length > 0 && inspectionId) {
          const formData = new FormData()
          allPhotos.forEach(photo => {
            if (photo.file) {
              formData.append('photos', photo.file)
            }
          })
          formData.append('category', '정기점검')
          formData.append('inspection_type', inspectionType)
          
          try {
            await periodicInspectionAPI.uploadPhotos(inspectionId, formData)
          } catch (uploadError) {
            console.error('Photo upload failed:', uploadError)
          }
        }

        setStep(3)
        setTimeout(() => {
          navigate('/molds')
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit inspection:', error)
      alert('점검 저장 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = () => {
    const type = inspectionTypes.find(t => t.value === inspectionType)
    return type?.label || inspectionType
  }

  return (
    <div>
      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      <h1 className="text-2xl font-bold mb-6">정기점검</h1>

      {/* 진행률 표시 */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">진행 단계</span>
          <span className="text-sm font-medium">{step}/3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

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

        {/* Step 1: 점검 타입 선택 */}
        {step === 1 && (
          <>
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">점검 타입 선택</h2>
              
              {getRecommendedType() && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      현재 누적 타수 기준 권장: <span className="font-bold">{getRecommendedType()?.toLocaleString()} SHOT</span>
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
                    <li>20K/50K/80K/100K SHOT 점검에 세척 항목이 포함됩니다.</li>
                    <li>모든 점검 항목은 사진 첨부가 권장됩니다.</li>
                    <li>점검 완료 후 승인 절차가 진행됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: 체크리스트 작성 */}
        {step === 2 && (
          <>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{getTypeLabel()} 체크리스트</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">완료율:</span>
                  <span className="text-sm font-bold text-primary-600">{getCompletionRate()}%</span>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${getCompletionRate()}%` }}
                />
              </div>

              {/* 카테고리별 체크리스트 */}
              {Object.entries(getItemsByCategory()).map(([category, items]) => (
                <div key={category} className="mb-4 border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category}</span>
                      <span className="text-xs text-gray-500">({items.length}개 항목)</span>
                    </div>
                    {expandedCategories[category] ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                  </button>

                  {expandedCategories[category] && (
                    <div className="divide-y">
                      {items.map((item) => (
                        <div key={item.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.item_name}
                                {item.required_photo && (
                                  <span className="ml-2 text-xs text-red-500">(사진 필수)</span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>

                          {/* 상태 선택 버튼 */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => handleItemStatusChange(item.id, 'good')}
                              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                                itemResults[item.id]?.status === 'good'
                                  ? 'bg-green-100 border-green-500 text-green-700'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              ✓ 양호
                            </button>
                            <button
                              onClick={() => handleItemStatusChange(item.id, 'warning')}
                              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                                itemResults[item.id]?.status === 'warning'
                                  ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              ⚠ 주의
                            </button>
                            <button
                              onClick={() => handleItemStatusChange(item.id, 'bad')}
                              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                                itemResults[item.id]?.status === 'bad'
                                  ? 'bg-red-100 border-red-500 text-red-700'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              ✕ 불량
                            </button>
                          </div>

                          {/* 특이사항 입력 */}
                          <input
                            type="text"
                            placeholder="특이사항 입력..."
                            value={itemResults[item.id]?.note || ''}
                            onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md mb-3"
                          />

                          {/* 사진 업로드 */}
                          <div className="flex flex-wrap gap-2">
                            {(itemResults[item.id]?.photos || []).map((photo) => (
                              <div key={photo.id} className="relative w-16 h-16">
                                <img
                                  src={photo.preview}
                                  alt="점검 사진"
                                  className="w-full h-full object-cover rounded-md"
                                />
                                <button
                                  onClick={() => removePhoto(photo.id, item.id)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => openFileDialog(item.id)}
                              disabled={uploading}
                              className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 transition"
                            >
                              <Camera size={20} />
                              <span className="text-xs mt-1">추가</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 전체 사진 추가 */}
            <div className="card">
              <h3 className="font-semibold mb-3">추가 사진</h3>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative w-20 h-20">
                    <img
                      src={photo.preview}
                      alt="추가 사진"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      onClick={() => removePhoto(photo.id, null)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => openFileDialog(null)}
                  disabled={uploading}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 transition"
                >
                  <Upload size={24} />
                  <span className="text-xs mt-1">사진 추가</span>
                </button>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                이전
              </button>
              <button
                onClick={handleSubmitInspection}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? '저장 중...' : '점검 완료'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: 완료 */}
        {step === 3 && (
          <div className="card text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">점검이 완료되었습니다!</h2>
            <p className="text-gray-600 mb-4">
              {getTypeLabel()} 점검 결과가 저장되었습니다.<br />
              잠시 후 금형 목록으로 이동합니다.
            </p>
            <button
              onClick={() => navigate('/molds')}
              className="btn-primary"
            >
              금형 목록으로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
