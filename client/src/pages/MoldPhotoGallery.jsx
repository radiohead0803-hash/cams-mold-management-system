import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Image as ImageIcon, Upload, X, ZoomIn, Download, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function MoldPhotoGallery() {
  const { id } = useParams()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // 임시 데이터
  useEffect(() => {
    setPhotos([
      {
        id: 1,
        photo_type: 'overview',
        photo_path: 'https://via.placeholder.com/800x600/0ea5e9/ffffff?text=Mold+Overview',
        thumbnail_path: 'https://via.placeholder.com/200x150/0ea5e9/ffffff?text=Mold+Overview',
        file_size: 1024000,
        taken_by: 'admin',
        taken_at: '2025-11-20T10:00:00',
        description: '금형 전체 사진',
        tags: '전체,외관,정면',
        is_primary: true
      },
      {
        id: 2,
        photo_type: 'detail',
        photo_path: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Core+Detail',
        thumbnail_path: 'https://via.placeholder.com/200x150/10b981/ffffff?text=Core+Detail',
        file_size: 856000,
        taken_by: 'maker1',
        taken_at: '2025-11-19T14:30:00',
        description: '코어 상세',
        tags: '코어,상세,부품',
        is_primary: false
      },
      {
        id: 3,
        photo_type: 'defect',
        photo_path: 'https://via.placeholder.com/800x600/ef4444/ffffff?text=Defect+Found',
        thumbnail_path: 'https://via.placeholder.com/200x150/ef4444/ffffff?text=Defect+Found',
        file_size: 720000,
        taken_by: 'plant1',
        taken_at: '2025-11-18T09:15:00',
        description: '파팅면 손상',
        tags: '불량,손상,파팅면',
        is_primary: false
      },
      {
        id: 4,
        photo_type: 'repair',
        photo_path: 'https://via.placeholder.com/800x600/f59e0b/ffffff?text=After+Repair',
        thumbnail_path: 'https://via.placeholder.com/200x150/f59e0b/ffffff?text=After+Repair',
        file_size: 980000,
        taken_by: 'maker1',
        taken_at: '2025-11-17T16:45:00',
        description: '수리 완료 후',
        tags: '수리,완료,복구',
        is_primary: false
      },
      {
        id: 5,
        photo_type: 'inspection',
        photo_path: 'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Inspection',
        thumbnail_path: 'https://via.placeholder.com/200x150/8b5cf6/ffffff?text=Inspection',
        file_size: 640000,
        taken_by: 'hq_manager',
        taken_at: '2025-11-16T11:00:00',
        description: '정기점검 사진',
        tags: '점검,정기,확인',
        is_primary: false
      },
      {
        id: 6,
        photo_type: 'detail',
        photo_path: 'https://via.placeholder.com/800x600/06b6d4/ffffff?text=Cavity+Detail',
        thumbnail_path: 'https://via.placeholder.com/200x150/06b6d4/ffffff?text=Cavity+Detail',
        file_size: 890000,
        taken_by: 'admin',
        taken_at: '2025-11-15T13:20:00',
        description: '캐비티 상세',
        tags: '캐비티,상세,내부',
        is_primary: false
      }
    ])
    setLoading(false)
  }, [id])

  const photoTypes = {
    all: { label: '전체', color: 'bg-gray-100 text-gray-800' },
    overview: { label: '전체', color: 'bg-blue-100 text-blue-800' },
    detail: { label: '상세', color: 'bg-green-100 text-green-800' },
    defect: { label: '불량', color: 'bg-red-100 text-red-800' },
    repair: { label: '수리', color: 'bg-orange-100 text-orange-800' },
    inspection: { label: '점검', color: 'bg-purple-100 text-purple-800' }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredPhotos = filter === 'all' 
    ? photos 
    : photos.filter(photo => photo.photo_type === filter)

  const handleDelete = (photoId) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setPhotos(photos.filter(p => p.id !== photoId))
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null)
      }
    }
  }

  const handleSetPrimary = (photoId) => {
    setPhotos(photos.map(p => ({
      ...p,
      is_primary: p.id === photoId
    })))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형 사진 갤러리</h1>
          <p className="text-sm text-gray-600 mt-1">
            금형 사진 및 이미지 관리
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={20} />
          사진 업로드
        </button>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(photoTypes).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
              <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                {key === 'all' ? photos.length : photos.filter(p => p.photo_type === key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 사진 그리드 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="card text-center py-12">
          <ImageIcon className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">사진이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="group relative">
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.thumbnail_path}
                  alt={photo.description}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* 오버레이 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                </div>

                {/* 배지 */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {photo.is_primary && (
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded">
                      대표
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded ${photoTypes[photo.photo_type].color}`}>
                    {photoTypes[photo.photo_type].label}
                  </span>
                </div>
              </div>

              {/* 정보 */}
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {photo.description}
                </p>
                <p className="text-xs text-gray-600">
                  {format(new Date(photo.taken_at), 'yyyy-MM-dd')} • {photo.taken_by}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 사진 상세 모달 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="text-white">
                <h3 className="text-xl font-bold">{selectedPhoto.description}</h3>
                <p className="text-sm text-gray-300 mt-1">
                  {format(new Date(selectedPhoto.taken_at), 'yyyy-MM-dd HH:mm')} • {selectedPhoto.taken_by}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-white hover:text-gray-300"
              >
                <X size={32} />
              </button>
            </div>

            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <img
                src={selectedPhoto.photo_path}
                alt={selectedPhoto.description}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            <div className="flex gap-2 justify-between items-center">
              <div className="text-white text-sm">
                <p>크기: {formatFileSize(selectedPhoto.file_size)}</p>
                {selectedPhoto.tags && (
                  <p className="mt-1">
                    태그: {selectedPhoto.tags.split(',').map(tag => (
                      <span key={tag} className="inline-block px-2 py-0.5 bg-gray-700 rounded mr-1 mt-1">
                        {tag}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {!selectedPhoto.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(selectedPhoto.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    대표 사진으로 설정
                  </button>
                )}
                <button
                  onClick={() => alert('다운로드: ' + selectedPhoto.description)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <Download size={16} />
                  다운로드
                </button>
                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 모달 */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">사진 업로드</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사진 유형
                </label>
                <select className="input">
                  <option value="">선택하세요</option>
                  <option value="overview">전체</option>
                  <option value="detail">상세</option>
                  <option value="defect">불량</option>
                  <option value="repair">수리</option>
                  <option value="inspection">점검</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <input type="text" className="input" placeholder="사진 설명 입력" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그 (쉼표로 구분)
                </label>
                <input type="text" className="input" placeholder="예: 외관,정면,전체" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사진 선택
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 cursor-pointer">
                  <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-sm text-gray-600">
                    클릭하여 사진 선택 또는 드래그 앤 드롭
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG (최대 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="flex-1 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={() => {
                  alert('업로드 기능은 추후 구현됩니다.')
                  setUploadModalOpen(false)
                }}
                className="flex-1 btn-primary"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
