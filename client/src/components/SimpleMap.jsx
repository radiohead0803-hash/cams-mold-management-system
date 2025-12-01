import { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function SimpleMap({ locations = [], selectedMold, onSelectMold }) {
  const [hoveredMold, setHoveredMold] = useState(null);

  // 한국 좌표를 화면 좌표로 변환
  const coordToPercent = (lat, lng) => {
    // 한국 좌표 범위: 위도 33-38, 경도 124-132
    const latPercent = ((lat - 33) / 5) * 100;
    const lngPercent = ((lng - 124) / 8) * 100;
    return { x: lngPercent, y: 100 - latPercent }; // y축 반전
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      {/* 그리드 배경 */}
      <div className="absolute inset-0">
        {/* 세로 그리드 */}
        {[...Array(9)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full border-l border-gray-200"
            style={{ left: `${(i + 1) * 10}%` }}
          />
        ))}
        {/* 가로 그리드 */}
        {[...Array(9)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full border-t border-gray-200"
            style={{ top: `${(i + 1) * 10}%` }}
          />
        ))}
      </div>

      {/* 한국 지도 윤곽선 (간단한 표현) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="relative" style={{ width: '60%', height: '80%' }}>
          <div className="absolute inset-0 bg-green-200 rounded-tl-3xl rounded-br-3xl" 
               style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
          />
        </div>
      </div>

      {/* 주요 도시 라벨 */}
      <div className="absolute top-[15%] left-[45%] text-xs text-gray-400 font-medium">서울</div>
      <div className="absolute top-[35%] left-[25%] text-xs text-gray-400 font-medium">인천</div>
      <div className="absolute top-[55%] left-[50%] text-xs text-gray-400 font-medium">대전</div>
      <div className="absolute top-[75%] left-[35%] text-xs text-gray-400 font-medium">광주</div>
      <div className="absolute top-[70%] left-[65%] text-xs text-gray-400 font-medium">부산</div>
      <div className="absolute top-[45%] left-[75%] text-xs text-gray-400 font-medium">울산</div>
      <div className="absolute bottom-[5%] left-[15%] text-xs text-gray-400 font-medium">제주</div>

      {/* 금형 위치 마커 */}
      {locations.map((location) => {
        if (!location.latitude || !location.longitude) return null;

        const { x, y } = coordToPercent(location.latitude, location.longitude);
        const isSelected = selectedMold?.mold_id === location.mold_id;
        const isHovered = hoveredMold === location.mold_id;

        return (
          <div
            key={location.mold_id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
              isSelected ? 'scale-150 z-20' : isHovered ? 'scale-125 z-10' : 'z-0'
            }`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            onClick={() => onSelectMold && onSelectMold(location)}
            onMouseEnter={() => setHoveredMold(location.mold_id)}
            onMouseLeave={() => setHoveredMold(null)}
          >
            {/* 마커 */}
            <div className={`relative ${location.has_drift ? 'animate-pulse' : ''}`}>
              <MapPin
                className={`w-8 h-8 drop-shadow-lg ${
                  location.has_drift ? 'text-red-600' : 'text-green-600'
                }`}
                fill={location.has_drift ? '#dc2626' : '#16a34a'}
              />
              
              {/* 위치 이탈 경고 배지 */}
              {location.has_drift && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-ping" />
              )}
            </div>

            {/* 툴팁 */}
            {(isSelected || isHovered) && (
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 min-w-[200px] border border-gray-200 z-30">
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {location.mold_code}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {location.mold_name || '-'}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {location.current_location || '위치 미등록'}
                </div>
                {location.has_drift && (
                  <div className="mt-2 px-2 py-1 bg-red-50 text-red-700 text-xs rounded font-medium">
                    ⚠️ 위치 이탈 감지
                  </div>
                )}
                {/* 툴팁 화살표 */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-xs font-semibold text-gray-700 mb-2">범례</div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" fill="#16a34a" />
          <span className="text-xs text-gray-700">정상 위치</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600" fill="#dc2626" />
          <span className="text-xs text-gray-700">위치 이탈</span>
        </div>
      </div>

      {/* 지도 정보 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-gray-700">간편 지도 (무료)</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          총 {locations.length}개 금형
        </div>
      </div>

      {/* 사용 안내 */}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">위치 데이터가 없습니다</p>
            <p className="text-xs text-gray-500">GPS 데이터를 추가해주세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
