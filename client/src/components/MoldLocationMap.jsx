import { useState } from 'react';
import { MapPin } from 'lucide-react';
import KakaoMap from './KakaoMap';

/**
 * 금형 위치 지도 컴포넌트 (데이터 주입 방식)
 * @param {Array} locations - 금형 위치 데이터 배열
 * @param {Function} onRefresh - 새로고침 콜백
 */
export default function MoldLocationMap({ locations = [], onRefresh }) {
  const [selectedMold, setSelectedMold] = useState(null);

  // GPS 상태별 색상
  const getStatusColor = (hasDrift) => {
    return hasDrift ? 'bg-red-500' : 'bg-green-500';
  };

  const getStatusText = (hasDrift) => {
    return hasDrift ? '위치 이탈' : '정상';
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">금형 위치 현황</h3>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              새로고침
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* 카카오맵 영역 */}
        <div className="lg:col-span-2 bg-gray-100 h-96 lg:h-[600px] relative">
          <KakaoMap 
            locations={locations}
            selectedMold={selectedMold}
            onSelectMold={setSelectedMold}
          />
          
          {/* 지도 정보 오버레이 */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
            <p className="text-xs font-semibold text-gray-700 mb-1">📍 금형 위치 현황</p>
            <p className="text-xs text-gray-500">총 {locations.length}개</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">정상 {locations.filter(l => !l.hasDrift).length}</span>
              <span className="text-red-600">이탈 {locations.filter(l => l.hasDrift).length}</span>
            </div>
          </div>

          {/* 카카오맵 안내 */}
          <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-2 z-[1000]">
            <p className="text-xs text-yellow-700">✅ 카카오맵 연동</p>
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
                  key={location.id}
                  onClick={() => setSelectedMold(location)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedMold?.id === location.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(location.hasDrift)}`}></div>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {location.moldCode}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {location.moldName || '-'}
                      </p>
                      {location.plantName && (
                        <p className="text-xs text-gray-500">
                          📍 {location.plantName}
                        </p>
                      )}
                      {location.hasDrift && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                          <span>⚠️ 위치 이탈 감지</span>
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
                {selectedMold.moldCode} - {selectedMold.moldName}
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>📍 위치: {selectedMold.plantName || '미등록'}</p>
                <p>📊 상태: {getStatusText(selectedMold.hasDrift)}</p>
                {selectedMold.lastUpdated && (
                  <p>🕐 최근 GPS: {new Date(selectedMold.lastUpdated).toLocaleString('ko-KR')}</p>
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
