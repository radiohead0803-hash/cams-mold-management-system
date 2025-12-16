/**
 * 모바일 금형 위치 지도 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Package, RefreshCw, Navigation } from 'lucide-react';
import api from '../../lib/api';

export default function MobileLocationMap() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMold, setSelectedMold] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mold-specifications', { 
        params: { has_location: true, limit: 100 } 
      });
      if (response.data.success) {
        const moldsWithLocation = (response.data.data || []).filter(
          m => m.gps_latitude && m.gps_longitude
        );
        setLocations(moldsWithLocation);
      }
    } catch (error) {
      console.error('위치 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (lat, lng, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      maintenance: 'bg-yellow-500',
      repair: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">금형 위치</h1>
          </div>
          <button onClick={fetchLocations} className="p-2">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Map Placeholder - 실제 지도 라이브러리 연동 필요 */}
      <div className="h-64 bg-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">지도 영역</p>
          <p className="text-xs">(Google Maps / Kakao Maps 연동 필요)</p>
        </div>
      </div>

      {/* Location List */}
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          위치 등록 금형 ({locations.length}개)
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>위치 정보가 등록된 금형이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map(mold => (
              <div
                key={mold.id}
                className={`bg-white rounded-lg shadow-sm p-4 ${
                  selectedMold?.id === mold.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedMold(mold)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(mold.status)}`}></div>
                      <span className="font-semibold text-blue-600">{mold.mold_number}</span>
                    </div>
                    <p className="text-sm text-gray-600">{mold.part_name || '-'}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {mold.gps_latitude?.toFixed(4)}, {mold.gps_longitude?.toFixed(4)}
                      </span>
                    </div>
                    {mold.location_name && (
                      <p className="text-xs text-gray-500 mt-1">{mold.location_name}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInMaps(mold.gps_latitude, mold.gps_longitude, mold.mold_number);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
