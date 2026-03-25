import { useState, useRef } from 'react'
import { Camera, X, Image as ImageIcon } from 'lucide-react'
import api from '../lib/api'

/**
 * 인라인 사진 버튼 - 테이블 셀 안에서 사용
 * 확인 체크 옆에 사진 미리보기/추가 버튼을 표시
 *
 * Props:
 *   photos: Array<{ id, url, name, file_url?, thumbnail_url? }>
 *   onPhotosChange: (photos) => void
 *   moldId: string|number
 *   itemId: string|number
 *   inspectionType: string
 *   maxPhotos?: number (기본 3)
 *   disabled?: boolean
 */
export default function InlinePhotoButton({
  photos = [],
  onPhotosChange,
  moldId,
  itemId,
  inspectionType = 'daily',
  maxPhotos = 3,
  disabled = false
}) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const getUrl = (p) => p.url || p.file_url || p.thumbnail_url || ''

  const handleClick = () => {
    if (disabled || uploading) return
    if (photos.length > 0) {
      setShowPreview(!showPreview)
    } else {
      fileRef.current?.click()
    }
  }

  const handleAdd = (e) => {
    e.stopPropagation()
    if (disabled || uploading) return
    fileRef.current?.click()
  }

  const handleFile = async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return

    const remaining = maxPhotos - photos.length
    const toUpload = files.slice(0, remaining)
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
        fd.append('source_page', 'InlinePhotoButton')
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
      } catch {
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          newPhotos.push({ id: `local_${Date.now()}`, url: dataUrl, name: file.name, local: true })
        } catch (_) {}
      }
    }

    onPhotosChange(newPhotos)
    setUploading(false)
    e.target.value = ''
  }

  const handleRemove = (photoId, e) => {
    e.stopPropagation()
    onPhotosChange(photos.filter(p => p.id !== photoId))
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className={`relative w-10 h-10 rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
          photos.length > 0
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={photos.length > 0 ? `사진 ${photos.length}장` : '사진 추가'}
      >
        {uploading ? (
          <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
        ) : photos.length > 0 ? (
          <>
            <img src={getUrl(photos[0])} alt="" className="w-full h-full object-cover rounded-md" />
            {photos.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {photos.length}
              </span>
            )}
          </>
        ) : (
          <Camera size={16} className="text-gray-400" />
        )}
      </button>

      {/* 미리보기 팝업 */}
      {showPreview && photos.length > 0 && (
        <div className="absolute z-30 top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 min-w-[200px]">
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map(p => (
              <div key={p.id} className="relative w-14 h-14 group">
                <img src={getUrl(p)} alt="" className="w-full h-full object-cover rounded-lg border" />
                {!disabled && (
                  <button
                    onClick={(e) => handleRemove(p.id, e)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{photos.length}/{maxPhotos}장</span>
            {!disabled && photos.length < maxPhotos && (
              <button
                type="button"
                onClick={handleAdd}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <ImageIcon size={12} /> 추가
              </button>
            )}
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
    </div>
  )
}
