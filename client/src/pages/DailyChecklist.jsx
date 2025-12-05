import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { moldAPI, checklistAPI, moldSpecificationAPI } from '../lib/api'
import { MapPin, Camera, CheckCircle, XCircle, AlertCircle, Save, Upload, X, Image } from 'lucide-react'

export default function DailyChecklist() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const moldId = searchParams.get('mold')
  
  const [step, setStep] = useState(1) // 1: 기본정보, 2: 체크리스트, 3: 완료
  const [mold, setMold] = useState(null)
  const [spec, setSpec] = useState(null)
  const [realMoldId, setRealMoldId] = useState(null)
  const [checklistId, setChecklistId] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // 기본 정보
  const [shotCount, setShotCount] = useState('')
  const [location, setLocation] = useState({ lat: null, lng: null })
  const [gpsLoading, setGpsLoading] = useState(false)
  
  // 체크리스트 항목
  const [checkItems, setCheckItems] = useState([
    { id: 1, category: '정결관리', name: '성형물 청결', status: null, notes: '', photos: [] },
    { id: 2, category: '정결관리', name: '파팅면 상태', status: null, notes: '', photos: [] },
    { id: 3, category: '작동부 점검', name: '이젝터 핀 작동', status: null, notes: '', photos: [] },
    { id: 4, category: '작동부 점검', name: '슬라이드 작동', status: null, notes: '', photos: [] },
    { id: 5, category: '냉각 시스템', name: '냉각수 누수', status: null, notes: '', photos: [] },
    { id: 6, category: '냉각 시스템', name: '냉각 효율', status: null, notes: '', photos: [] },
  ])

  useEffect(() => {
    if (moldId) {
      loadMoldFromSpecOrMold()
    }
  }, [moldId])

  const loadMoldFromSpecOrMold = async () => {
    try {
      let targetMoldId = null
      try {
        const specRes = await moldSpecificationAPI.getById(moldId)
        const s = specRes.data?.data
        setSpec(s)
        targetMoldId = s?.mold_id || s?.Mold?.id || null
      } catch (_) {
        targetMoldId = null
      }
      if (!targetMoldId) {
        targetMoldId = moldId
      }
      setRealMoldId(targetMoldId)
      const response = await moldAPI.getById(targetMoldId)
      setMold(response.data.data)
      setShotCount(response.data.data.total_shots?.toString() || '')
    } catch (error) {
      console.error('Failed to load mold:', error)
    }
  }

  const getGPSLocation = () => {
    setGpsLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setGpsLoading(false)
        },
        (error) => {
          console.error('GPS error:', error)
          alert('GPS 위치를 가져올 수 없습니다.')
          setGpsLoading(false)
        }
      )
    } else {
      alert('이 브라우저는 GPS를 지원하지 않습니다.')
      setGpsLoading(false)
    }
  }

  const startChecklist = async () => {
    if (!shotCount) {
      alert('누적 타수를 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const response = await checklistAPI.startDaily({
        mold_id: realMoldId || mold?.id || moldId,
        shot_count: parseInt(shotCount),
        location: location.lat ? location : null,
        check_type: 'daily'
      })
      setChecklistId(response.data.data.checklist_id)
      setStep(2)
    } catch (error) {
      console.error('Failed to start checklist:', error)
      alert('점검을 시작할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateItemStatus = (itemId, status) => {
    setCheckItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status } : item
    ))
  }

  const updateItemNotes = (itemId, notes) => {
    setCheckItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ))
  }

  const handlePhotoUpload = (itemId, event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // 파일을 미리보기 URL로 변환
    const photoUrls = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }))

    setCheckItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, photos: [...item.photos, ...photoUrls] }
        : item
    ))
  }

  const removePhoto = (itemId, photoIndex) => {
    setCheckItems(prev => prev.map(item =>
      item.id === itemId
        ? {
            ...item,
            photos: item.photos.filter((_, index) => index !== photoIndex)
          }
        : item
    ))
  }

  const saveChecklist = async () => {
    const incompleteItems = checkItems.filter(item => item.status === null)
    if (incompleteItems.length > 0) {
      if (!confirm(`${incompleteItems.length}개 항목이 미완료 상태입니다. 저장하시겠습니까?`)) {
        return
      }
    }

    try {
      setLoading(true)
      await checklistAPI.updateDaily(checklistId, {
        item_status: checkItems.map(item => ({
          item_id: item.id,
          status: item.status || 'pending',
          notes: item.notes
        })),
        status: 'completed'
      })
      setStep(3)
    } catch (error) {
      console.error('Failed to save checklist:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="text-green-600" size={24} />
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={24} />
      case 'fail':
        return <XCircle className="text-red-600" size={24} />
      default:
        return <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
    }
  }

  const getStatusButtonClass = (currentStatus, buttonStatus) => {
    const baseClass = "px-4 py-2 rounded-md text-sm font-medium transition-colors"
    if (currentStatus === buttonStatus) {
      const activeColors = {
        pass: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        fail: 'bg-red-600 text-white'
      }
      return `${baseClass} ${activeColors[buttonStatus]}`
    }
    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`
  }

  // Step 1: 기본 정보
  if (step === 1) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">일상점검 시작</h1>
        
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          
          {mold && (
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-600 mb-1">선택된 금형</p>
              <p className="font-semibold">{mold.mold_number} - {mold.mold_name}</p>
              <p className="text-sm text-gray-600 mt-1">{mold.product_name}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                누적 타수 (필수)
              </label>
              <input
                type="number"
                value={shotCount}
                onChange={(e) => setShotCount(e.target.value)}
                className="input"
                placeholder="예: 152238"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPS 위치 (선택)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={getGPSLocation}
                  disabled={gpsLoading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <MapPin size={16} />
                  {gpsLoading ? '위치 확인 중...' : 'GPS 위치 가져오기'}
                </button>
                {location.lat && (
                  <span className="text-sm text-green-600 flex items-center">
                    <CheckCircle size={16} className="mr-1" />
                    위치 확인됨
                  </span>
                )}
              </div>
              {location.lat && (
                <p className="text-xs text-gray-500 mt-1">
                  위도: {location.lat.toFixed(6)}, 경도: {location.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => navigate('/molds')}
              className="btn-secondary flex-1"
            >
              취소
            </button>
            <button
              onClick={startChecklist}
              disabled={loading || !shotCount}
              className="btn-primary flex-1"
            >
              {loading ? '시작 중...' : '점검 시작'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: 체크리스트
  if (step === 2) {
    const categories = [...new Set(checkItems.map(item => item.category))]
    
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">일상점검 진행 중</h1>
          <p className="text-sm text-gray-600 mt-1">
            {mold?.mold_number} - Shot: {shotCount}
          </p>
        </div>

        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="card">
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <div className="space-y-4">
                {checkItems.filter(item => item.category === category).map(item => (
                  <div key={item.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => updateItemStatus(item.id, 'pass')}
                        className={getStatusButtonClass(item.status, 'pass')}
                      >
                        양호
                      </button>
                      <button
                        onClick={() => updateItemStatus(item.id, 'warning')}
                        className={getStatusButtonClass(item.status, 'warning')}
                      >
                        주의
                      </button>
                      <button
                        onClick={() => updateItemStatus(item.id, 'fail')}
                        className={getStatusButtonClass(item.status, 'fail')}
                      >
                        불량
                      </button>
                    </div>

                    {item.status && (
                      <div className="space-y-3">
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          placeholder="비고 입력 (선택사항)"
                          className="input text-sm"
                          rows="2"
                        />

                        {/* 사진 업로드 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            사진 첨부 (선택사항)
                          </label>
                          
                          {/* 사진 미리보기 */}
                          {item.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              {item.photos.map((photo, photoIndex) => (
                                <div key={photoIndex} className="relative group">
                                  <img
                                    src={photo.preview}
                                    alt={`사진 ${photoIndex + 1}`}
                                    className="w-full h-24 object-cover rounded border"
                                  />
                                  <button
                                    onClick={() => removePhoto(item.id, photoIndex)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 업로드 버튼 */}
                          <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                            <Camera size={20} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              사진 추가 ({item.photos.length})
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2 sticky bottom-4">
          <button
            onClick={() => setStep(1)}
            className="btn-secondary flex-1"
          >
            이전
          </button>
          <button
            onClick={saveChecklist}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {loading ? '저장 중...' : '점검 완료'}
          </button>
        </div>
      </div>
    )
  }

  // Step 3: 완료
  return (
    <div className="card max-w-2xl mx-auto text-center py-12">
      <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
      <h2 className="text-2xl font-bold mb-2">점검이 완료되었습니다</h2>
      <p className="text-gray-600 mb-6">
        점검 결과가 저장되었습니다.
      </p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => navigate('/molds')}
          className="btn-secondary"
        >
          금형 목록
        </button>
        <button
          onClick={() => {
            setStep(1)
            setCheckItems(prev => prev.map(item => ({ ...item, status: null, notes: '', photos: [] })))
          }}
          className="btn-primary"
        >
          새 점검 시작
        </button>
      </div>
    </div>
  )
}
