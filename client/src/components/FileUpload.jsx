import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Image, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import api from '../lib/api';

/**
 * 파일 업로드 컴포넌트
 * 사진 촬영 및 파일 첨부 기능 지원
 * 
 * @param {string} entityType - 엔티티 타입 (mold, checklist, inspection, repair, transfer, tryout_issue)
 * @param {number} entityId - 엔티티 ID
 * @param {string} category - 카테고리 (선택)
 * @param {function} onUploadComplete - 업로드 완료 콜백
 * @param {function} onError - 에러 콜백
 * @param {boolean} multiple - 다중 파일 업로드 허용 여부
 * @param {string} accept - 허용 파일 타입
 * @param {number} maxSize - 최대 파일 크기 (MB)
 * @param {boolean} showCamera - 카메라 버튼 표시 여부
 * @param {boolean} compact - 컴팩트 모드
 */
const FileUpload = ({
  entityType,
  entityId,
  category = '',
  onUploadComplete,
  onError,
  multiple = false,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  maxSize = 20,
  showCamera = true,
  compact = false,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // 파일 크기 검증
    const oversizedFiles = fileArray.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const errorMsg = `파일 크기가 ${maxSize}MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const results = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', entityType);
        formData.append('entity_id', entityId);
        if (category) formData.append('category', category);

        const response = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          results.push(response.data.data);
        }

        setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
      }

      setUploadedFiles(prev => [...prev, ...results]);
      onUploadComplete?.(results);
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || '파일 업로드에 실패했습니다.';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [entityType, entityId, category, maxSize, onUploadComplete, onError]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openFileDialog = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        {showCamera && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        )}
        
        <button
          type="button"
          onClick={openFileDialog}
          disabled={uploading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          파일
        </button>
        
        {showCamera && (
          <button
            type="button"
            onClick={openCamera}
            disabled={uploading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            촬영
          </button>
        )}

        {uploadedFiles.length > 0 && (
          <span className="text-sm text-gray-500">
            {uploadedFiles.length}개 업로드됨
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      )}

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openFileDialog}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              파일 선택
            </button>
            
            {showCamera && (
              <button
                type="button"
                onClick={openCamera}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Camera className="w-5 h-5" />
                사진 촬영
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            또는 파일을 여기에 드래그하세요
          </p>
          <p className="text-xs text-gray-400">
            최대 {maxSize}MB • 이미지, PDF, Word, Excel 지원
          </p>
        </div>

        {/* 업로드 진행률 */}
        {uploading && uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">{uploadProgress}% 업로드 중...</p>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">업로드된 파일</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.id || index}
                className="relative group bg-gray-50 rounded-lg p-3 border"
              >
                {file.is_image ? (
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <p className="text-xs text-gray-600 truncate">{file.file_name}</p>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="p-1 bg-green-500 text-white rounded-full">
                    <Check className="w-3 h-3" />
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
