import { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function MoldLocationMap() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMold, setSelectedMold] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/hq/mold-locations');
      
      if (response.data.success) {
        setLocations(response.data.data.items || []);
      }
    } catch (err) {
      console.error('Location fetch error:', err);
      setError(err.response?.data?.error?.message || '위치 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // GPS 상태별 색상
  const getStatusColor = (hasDrift) => {
    return hasDrift ? 'bg-red-500' : 'bg-green-500';
  };

  const getStatusText = (hasDrift) => {
    return hasDrift ? '위치 이탈' : '정상';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">지도 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">금형 위치 현황</h3>
          </div>
          <button
            onClick={fetchLocations}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* 지도 영역 */}
        <div className="lg:col-span-2 bg-gray-100 h-96 lg:h-[600px] relative">
          {/* 간단한 좌표 기반 맵 시각화 */}
          <div className="absolute inset-0 p-4">
            <div className="w-full h-full bg-white rounded-lg border-2 border-gray-300 relative overflow-hidden">
              {/* 한국 지도 배경 (간단한 그리드) */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
                {/* 그리드 라인 */}
                {[...Array(10)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full border-t border-gray-200" style={{ top: `${i * 10}%` }}></div>
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full border-l border-gray-200" style={{ left: `${i * 10}%` }}></div>
                ))}
              </div>

              {/* 금형 위치 마커 */}
              {locations.map((location) => {
                // 한국 좌표를 화면 좌표로 변환 (간단한 매핑)
                // 한국: 위도 33-38, 경도 124-132
                const latPercent = ((location.latitude - 33) / 5) * 100;
                const lngPercent = ((location.longitude - 124) / 8) * 100;
                
                return (
                  <div
                    key={location.mold_id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 ${
                      selectedMold?.mold_id === location.mold_id ? 'scale-150 z-10' : ''
                    }`}
                    style={{
                      left: `${lngPercent}%`,
                      bottom: `${latPercent}%`,
                    }}
                    onClick={() => setSelectedMold(location)}
                  >
                    <div className={`relative ${location.has_drift ? 'animate-pulse' : ''}`}>
                      <MapPin 
                        className={`w-6 h-6 ${
                          location.has_drift ? 'text-red-600' : 'text-green-600'
                        }`}
                        fill={location.has_drift ? '#dc2626' : '#16a34a'}
                      />
                      {selectedMold?.mold_id === location.mold_id && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                          {location.mold_code}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 지도 정보 */}
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">📍 금형 위치 현황</p>
                <p className="text-xs text-gray-500">총 {locations.length}개</p>
              </div>

              {/* 지도 범례 */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-700">정상 위치 ({locations.filter(l => !l.has_drift).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-700">위치 이탈 ({locations.filter(l => l.has_drift).length})</span>
                </div>
              </div>

              {/* 카카오맵 연동 안내 */}
              <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-700">💡 카카오맵 API 연동 준비 완료</p>
              </div>
            </div>
          </div>
        </div>

        {/* 금형 목록 */}
        <div className="bg-gray-50 h-96 lg:h-[600px] overflow-y-auto">
          <div className="p-4 space-y-2">
            {locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">위치 데이터가 없습니다</p>
              </div>
            ) : (
              locations.map((location) => (
                <button
                  key={location.mold_id}
                  onClick={() => setSelectedMold(location)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedMold?.mold_id === location.mold_id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(location.has_drift)}`}></div>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {location.mold_code}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {location.mold_name || '-'}
                      </p>
                      {location.current_location && (
                        <p className="text-xs text-gray-500">
                          📍 {location.current_location}
                        </p>
                      )}
                      {location.has_drift && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>위치 이탈 감지</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 선택된 금형 상세 정보 */}
      {selectedMold && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {selectedMold.mold_code} - {selectedMold.mold_name}
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>📍 위치: {selectedMold.current_location || '미등록'}</p>
                <p>📊 상태: {getStatusText(selectedMold.has_drift)}</p>
                {selectedMold.last_gps_time && (
                  <p>🕐 최근 GPS: {new Date(selectedMold.last_gps_time).toLocaleString('ko-KR')}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedMold(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
