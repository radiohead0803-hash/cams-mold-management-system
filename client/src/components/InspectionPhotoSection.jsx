import { useState, useRef, useCallback } from 'react'
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn, Trash2, Image, Plus } from 'lucide-react'
import api from '../lib/api'

/**
 * 점검 사진 섹션 (다중 업로드 + 풀스크린 뷰어)
 * PC/모바일 반응형 자동 대응
 *
 * Props:
 *   photos: Array<{ id, url, name, thumbnail_url?, file_url? }>
 *   onPhotosChange: (photos) => void
 *   moldId: string|number
 *   itemId: string|number
 *   inspectionType: 'daily' | 'periodic'
 *   maxPhotos?: number (기본 10)
 *   disabled?: boolean
 */
export default function InspectionPhotoSection({
  photos = [],
  onPhotosChange,
  moldId,
  itemId,
  inspectionType = 'daily',
  maxPhotos = 10,
  disabled = false
}) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const getPhotoUrl = (photo) => {
    return photo.url || photo.file_url || photo.thumbnail_url || ''
  }

  const handleAddClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    if (disabled || uploading) return
    cameraInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const remaining = maxPhotos - photos.length
    const toUpload = files.slice(0, remaining).filter(f => f.type.startsWith('image/'))
    if (!toUpload.length) return

    setUploading(true)
    const newPhotos = [...photos]

    for (const file of toUpload) {
      try {
        const fd = new FormData()
        fd.append('photo', file)
        fd.append('mold_id', String(moldId || ''))
        fd.append('inspection_type', inspectionType)
        fd.append('item_id', String(itemId || ''))
        const res = await api.post('/inspection-photos/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res.data?.success) {
          newPhotos.push({
            id: res.data.data.id,
            url: res.data.data.file_url,
            name: file.name,
            file_url: res.data.data.file_url,
            thumbnail_url: res.data.data.thumbnail_url
          })
        }
      } catch (err) {
        console.error('사진 업로드 실패:', err)
        // 서버 실패 시 로컬 프리뷰로 폴백
        try {
          const dataUrl = await readFileAsDataURL(file)
          newPhotos.push({
            id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            url: dataUrl,
            name: file.name,
            local: true
          })
        } catch (_) {}
      }
    }

    onPhotosChange(newPhotos)
    setUploading(false)
    e.target.value = ''
  }

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleRemove = (photoId) => {
    onPhotosChange(photos.filter(p => p.id !== photoId))
  }

  const openViewer = (index) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const closeViewer = () => setViewerOpen(false)

  const goNext = useCallback(() => {
    setViewerIndex(prev => (prev + 1) % photos.length)
  }, [photos.length])

  const goPrev = useCallback(() => {
    setViewerIndex(prev => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') closeViewer()
    if (e.key === 'ArrowRight') goNext()
    if (e.key === 'ArrowLeft') goPrev()
  }, [goNext, goPrev])

  return (
    <div className="mt-2">
      {/* 사진 그리드 */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group aspect-square">
              <img
                src={getPhotoUrl(photo)}
                alt={photo.name || '점검 사진'}
                className="w-full h-full object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openViewer(idx)}
              />
              {/* 확대 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-all pointer-events-none">
                <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              {/* 삭제 버튼 */}
              {!disabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(photo.id); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  style={{ opacity: undefined }}
                >
                  <X size={12} />
                </button>
              )}
              {/* 로컬 표시 */}
              {photo.local && (
                <div className="absolute bottom-0.5 left-0.5 bg-yellow-500 text-white text-[8px] px-1 rounded">로컬</div>
              )}
            </div>
          ))}

          {/* 추가 버튼 (그리드 안) */}
          {!disabled && photos.length < maxPhotos && (
            <>
              {isMobile && (
                <button
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="aspect-square border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50/50 rounded-lg flex flex-col items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {uploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Camera size={20} />
                      <span className="text-[10px] mt-0.5">촬영</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleAddClick}
                disabled={uploading}
                className="aspect-square border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Image size={20} />
                    <span className="text-[10px] mt-0.5">{isMobile ? '갤러리' : '추가'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* 사진 없을 때 추가 버튼 */}
      {photos.length === 0 && !disabled && (
        <div className={isMobile ? 'flex gap-2' : ''}>
          {isMobile && (
            <button
              onClick={handleCameraClick}
              disabled={uploading}
              className="flex-1 py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50/50 rounded-lg flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm transition-colors"
            >
              {uploading ? (
                <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Camera size={16} />
                  카메라 촬영
                </>
              )}
            </button>
          )}
          <button
            onClick={handleAddClick}
            disabled={uploading}
            className={`${isMobile ? 'flex-1' : 'w-full'} py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg flex items-center justify-center gap-2 text-slate-500 hover:text-blue-500 text-sm transition-colors`}
          >
            {uploading ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
            ) : (
              <>
                <Image size={16} />
                {isMobile ? '갤러리 선택' : '점검 사진 추가'}
              </>
            )}
          </button>
        </div>
      )}

      {/* 사진 수 표시 */}
      {photos.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
          <Image size={12} />
          <span>{photos.length}/{maxPhotos}장</span>
        </div>
      )}

      {/* Hidden file input - 갤러리 (multiple) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Hidden file input - 카메라 촬영 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 풀스크린 사진 뷰어 */}
      {viewerOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          {/* 상단 바 */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50">
            <div className="text-white text-sm font-medium">
              {viewerIndex + 1} / {photos.length}
              {photos[viewerIndex]?.name && (
                <span className="ml-2 text-white/60 text-xs hidden sm:inline">
                  {photos[viewerIndex].name}
                </span>
              )}
            </div>
            <button
              onClick={closeViewer}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* 메인 이미지 영역 */}
          <div className="flex-1 flex items-center justify-center relative px-2 overflow-hidden">
            {/* 좌측 네비 */}
            {photos.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* 이미지 */}
            <img
              src={getPhotoUrl(photos[viewerIndex])}
              alt={photos[viewerIndex]?.name || '점검 사진'}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            />

            {/* 우측 네비 */}
            {photos.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* 하단 썸네일 스트립 */}
          {photos.length > 1 && (
            <div className="bg-black/50 px-4 py-2 overflow-x-auto">
              <div className="flex gap-2 justify-center">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={() => setViewerIndex(idx)}
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === viewerIndex
                        ? 'border-blue-400 ring-1 ring-blue-400 scale-105'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getPhotoUrl(photo)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
