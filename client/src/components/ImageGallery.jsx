import React, { useState, useEffect } from 'react';
import { Image, Plus, Loader2, Camera, FileText } from 'lucide-react';
import api from '../lib/api';
import FileUpload from './FileUpload';
import ImageViewer from './ImageViewer';

/**
 * 이미지 갤러리 컴포넌트
 * 엔티티별 이미지/파일 목록 표시 및 관리
 * 
 * @param {string} entityType - 엔티티 타입
 * @param {number} entityId - 엔티티 ID
 * @param {string} title - 갤러리 제목
 * @param {boolean} allowUpload - 업로드 허용 여부
 * @param {boolean} allowDelete - 삭제 허용 여부
 * @param {number} columns - 그리드 컬럼 수
 * @param {string} emptyMessage - 빈 상태 메시지
 */
const ImageGallery = ({
  entityType,
  entityId,
  title = '첨부 파일',
  allowUpload = true,
  allowDelete = true,
  columns = 4,
  emptyMessage = '첨부된 파일이 없습니다.',
  className = ''
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchFiles = async () => {
    if (!entityType || !entityId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/files/entity/${entityType}/${entityId}`);
      if (response.data.success) {
        setFiles(response.data.data || []);
      }
    } catch (err) {
      console.error('파일 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [entityType, entityId]);

  const handleUploadComplete = (uploadedFiles) => {
    setFiles(prev => [...uploadedFiles, ...prev]);
    setShowUpload(false);
  };

  const handleDelete = (deletedId) => {
    setFiles(prev => prev.filter(f => f.id !== deletedId));
  };

  const openViewer = (index) => {
    const imageFiles = files.filter(f => f.file_type?.startsWith('image/'));
    const imageIndex = imageFiles.findIndex(f => f.id === files[index].id);
    if (imageIndex >= 0) {
      setViewerIndex(imageIndex);
      setViewerOpen(true);
    }
  };

  const imageFiles = files.filter(f => f.file_type?.startsWith('image/'));
  const docFiles = files.filter(f => !f.file_type?.startsWith('image/'));

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-3 md:grid-cols-6'
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Image className="w-5 h-5 text-gray-500" />
          {title}
          {files.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({files.length}개)
            </span>
          )}
        </h3>
        {allowUpload && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {showUpload ? '취소' : <><Plus className="w-4 h-4" /> 추가</>}
          </button>
        )}
      </div>

      {/* 업로드 영역 */}
      {showUpload && (
        <div className="p-4 border-b bg-gray-50">
          <FileUpload
            entityType={entityType}
            entityId={entityId}
            onUploadComplete={handleUploadComplete}
            multiple
          />
        </div>
      )}

      {/* 파일 목록 */}
      <div className="p-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{emptyMessage}</p>
            {allowUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-3 text-blue-600 hover:underline text-sm"
              >
                파일 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 이미지 그리드 */}
            {imageFiles.length > 0 && (
              <div className={`grid ${gridCols[columns] || 'grid-cols-4'} gap-3`}>
                {imageFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setViewerIndex(index);
                      setViewerOpen(true);
                    }}
                  >
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* 문서 목록 */}
            {docFiles.length > 0 && (
              <div className="space-y-2">
                {imageFiles.length > 0 && (
                  <h4 className="text-sm font-medium text-gray-600 mt-4">문서</h4>
                )}
                {docFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 이미지 뷰어 */}
      <ImageViewer
        images={imageFiles}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onDelete={handleDelete}
        allowDelete={allowDelete}
      />
    </div>
  );
};

export default ImageGallery;
