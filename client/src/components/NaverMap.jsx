import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

export default function NaverMap({ locations = [], selectedMold, onSelectMold }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  // 네이버 지도 초기화
  useEffect(() => {
    // 네이버 지도 API 로드 확인
    if (!window.naver || !window.naver.maps) {
      setError('네이버 지도 API를 로드할 수 없습니다.');
      console.error('Naver Maps API not loaded');
      return;
    }

    try {
      // 한국 중심 좌표 (대한민국 중앙)
      const center = new window.naver.maps.LatLng(36.5, 127.5);

      // 지도 옵션
      const mapOptions = {
        center: center,
        zoom: 7,
        minZoom: 6,
        maxZoom: 18,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: window.naver.maps.Position.TOP_LEFT,
        },
        scaleControl: true,
        logoControl: false,
        mapDataControl: false,
      };

      // 지도 생성
      const map = new window.naver.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      setMapReady(true);

      console.log('✅ Naver Map initialized');
    } catch (err) {
      console.error('❌ Naver Map initialization error:', err);
      setError('지도 초기화 중 오류가 발생했습니다.');
    }
  }, []);

  // 마커 업데이트
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || locations.length === 0) {
      return;
    }

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 생성
    const bounds = new window.naver.maps.LatLngBounds();

    locations.forEach((location) => {
      if (!location.latitude || !location.longitude) return;

      const position = new window.naver.maps.LatLng(
        location.latitude,
        location.longitude
      );

      // 마커 아이콘 설정
      const markerIcon = {
        content: `
          <div style="
            position: relative;
            width: 32px;
            height: 40px;
            cursor: pointer;
          ">
            <svg width="32" height="40" viewBox="0 0 24 24" fill="${location.has_drift ? '#dc2626' : '#16a34a'}" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            ${location.has_drift ? `
              <div style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 16px;
                height: 16px;
                background: #dc2626;
                border-radius: 50%;
                border: 2px solid white;
                animation: pulse 2s infinite;
              "></div>
            ` : ''}
          </div>
        `,
        anchor: new window.naver.maps.Point(16, 40),
      };

      // 마커 생성
      const marker = new window.naver.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        icon: markerIcon,
        title: location.mold_code,
      });

      // 정보창 생성
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 12px;
            min-width: 200px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          ">
            <div style="font-weight: bold; color: #1f2937; margin-bottom: 4px;">
              ${location.mold_code}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              ${location.mold_name || '-'}
            </div>
            <div style="font-size: 11px; color: #9ca3af;">
              📍 ${location.current_location || '위치 미등록'}
            </div>
            ${location.has_drift ? `
              <div style="
                margin-top: 8px;
                padding: 4px 8px;
                background: #fee2e2;
                color: #dc2626;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
              ">
                ⚠️ 위치 이탈 감지
              </div>
            ` : ''}
          </div>
        `,
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        // 다른 정보창 닫기
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });

        // 현재 정보창 열기
        infoWindow.open(mapInstanceRef.current, marker);
        
        // 선택된 금형 업데이트
        if (onSelectMold) {
          onSelectMold(location);
        }

        // 지도 중심 이동
        mapInstanceRef.current.panTo(position);
      });

      // 마커에 정보창 참조 저장
      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);

      // 바운드에 추가
      bounds.extend(position);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (locations.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }

    console.log(`✅ ${locations.length} markers added to map`);
  }, [mapReady, locations, onSelectMold]);

  // 선택된 금형 하이라이트
  useEffect(() => {
    if (!selectedMold || !mapReady) return;

    const marker = markersRef.current.find(
      m => m.getTitle() === selectedMold.mold_code
    );

    if (marker && marker.infoWindow) {
      // 다른 정보창 닫기
      markersRef.current.forEach(m => {
        if (m.infoWindow && m !== marker) {
          m.infoWindow.close();
        }
      });

      // 선택된 마커의 정보창 열기
      marker.infoWindow.open(mapInstanceRef.current, marker);

      // 지도 중심 이동
      mapInstanceRef.current.panTo(marker.getPosition());
    }
  }, [selectedMold, mapReady]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">지도 로딩 실패</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 범례 */}
      {mapReady && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" fill="#16a34a" />
            <span className="text-xs text-gray-700">정상 위치</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" fill="#dc2626" />
            <span className="text-xs text-gray-700">위치 이탈</span>
          </div>
        </div>
      )}
    </div>
  );
}
