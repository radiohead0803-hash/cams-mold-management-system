import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import api from '../lib/api';

/**
 * 이미지 뷰어 컴포넌트
 * 이미지 갤러리 및 상세 보기 기능
 * 
 * @param {Array} images - 이미지 배열 [{id, file_url, file_name, ...}]
 * @param {number} initialIndex - 초기 표시할 이미지 인덱스
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {function} onClose - 닫기 콜백
 * @param {function} onDelete - 삭제 콜백
 * @param {boolean} allowDelete - 삭제 허용 여부
 */
const ImageViewer = ({
  images = [],
  initialIndex = 0,
  isOpen,
  onClose,
  onDelete,
  allowDelete = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setRotation(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.file_url;
    link.download = currentImage.file_name || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!window.confirm('이 이미지를 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/files/${currentImage.id}`);
      onDelete?.(currentImage.id);
      
      if (images.length === 1) {
        onClose?.();
      } else if (currentIndex >= images.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err) {
      console.error('이미지 삭제 실패:', err);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <span className="text-sm opacity-75">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage.file_name && (
            <p className="text-sm truncate max-w-xs">{currentImage.file_name}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="축소"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white/75 text-sm min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="확대"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="회전"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="다운로드"
          >
            <Download className="w-5 h-5" />
          </button>
          {allowDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
            title="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 이미지 */}
      <div className="flex-1 flex items-center justify-center p-16 overflow-hidden">
        <img
          src={currentImage.file_url}
          alt={currentImage.file_name || '이미지'}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 이전/다음 버튼 */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* 썸네일 */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <button
                key={img.id || index}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`
                  w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0
                  ${index === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}
                `}
              >
                <img
                  src={img.file_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 배경 클릭으로 닫기 */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default ImageViewer;
