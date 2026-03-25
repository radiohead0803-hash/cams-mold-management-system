import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Camera, X, Image, ZoomIn, User, Calendar
} from 'lucide-react';
import api, { getImageUrl } from '../../lib/api';

export default function MobilePhotoGallery() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, [moldId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/mold-photos`, { params: { moldId } });
      const data = response.data?.data || response.data || [];
      setPhotos(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('사진 로드 실패:', err);
      setError('사진을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  const resolveImageUrl = (photo) => {
    const url = photo.image_url || photo.url || photo.file_path || photo.thumbnail_url;
    if (typeof getImageUrl === 'function') return getImageUrl(url);
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">사진 갤러리</h1>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">{photos.length}장</span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm mt-3">사진을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Image size={48} className="mx-auto text-red-300 mb-3" />
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Image size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">등록된 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={photo.id || index} className="relative">
                <button
                  onClick={() => setSelectedPhoto(photo)}
                  className="w-full aspect-square rounded-lg overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <img
                    src={resolveImageUrl(photo)}
                    alt={photo.description || `사진 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center bg-gray-100">
                    <Image size={24} className="text-gray-400" />
                  </div>
                </button>
                <div className="mt-1 px-0.5">
                  <p className="text-[10px] text-gray-500 truncate">
                    {formatDate(photo.created_at || photo.taken_date)}
                  </p>
                  {photo.uploader_name && (
                    <p className="text-[10px] text-gray-400 truncate">
                      {photo.uploader_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 라이트박스 모달 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-50"
          >
            <X size={28} />
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveImageUrl(selectedPhoto)}
              alt={selectedPhoto.description || '사진'}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              {selectedPhoto.description && (
                <p className="text-white text-sm mb-1">{selectedPhoto.description}</p>
              )}
              <div className="flex items-center justify-center gap-4 text-white/70 text-xs">
                {selectedPhoto.uploader_name && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {selectedPhoto.uploader_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(selectedPhoto.created_at || selectedPhoto.taken_date)}
                </span>
              </div>
            </div>
          </div>
          {/* 배경 클릭으로 닫기 */}
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedPhoto(null)} />
        </div>
      )}

      {/* 카메라 플로팅 버튼 */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
        onClick={() => {/* Camera action placeholder */}}
      >
        <Camera size={24} />
      </button>
    </div>
  );
}
