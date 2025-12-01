import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

export default function KakaoMap({ locations = [], selectedMold, onSelectMold }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 카카오맵 스크립트 동적 로드
  useEffect(() => {
    // ✅ Vite 환경변수 사용
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!appKey) {
      setError('카카오맵 API 키가 설정되지 않았습니다. (.env 파일 확인 필요)');
      console.error('❌ VITE_KAKAO_MAP_KEY not found in environment variables');
      console.log('💡 Check: import.meta.env.VITE_KAKAO_MAP_KEY =', appKey);
      return;
    }

    console.log('✅ Kakao Map API Key loaded:', appKey.substring(0, 10) + '...');

    // 이미 스크립트가 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      setScriptLoaded(true);
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Kakao Maps script loaded');
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      setError('카카오맵 스크립트 로드 실패. API 키 또는 도메인을 확인하세요.');
      console.error('❌ Failed to load Kakao Maps script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 카카오맵 초기화
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;

    // 카카오맵 API 로드 확인
    if (!window.kakao || !window.kakao.maps) {
      setError('카카오맵 API를 로드할 수 없습니다.');
      console.error('❌ Kakao Maps API not loaded');
      return;
    }

    // kakao.maps.load 사용
    window.kakao.maps.load(() => {
      try {
        // 한국 중심 좌표 (대한민국 중앙)
        const center = new window.kakao.maps.LatLng(36.5, 127.5);

        // 지도 옵션
        const mapOptions = {
          center: center,
          level: 13, // 확대 레벨 (1-14, 숫자가 작을수록 확대)
        };

        // 지도 생성
        const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // 지도 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        setMapReady(true);
        console.log('✅ Kakao Map initialized');
      } catch (err) {
        console.error('❌ Kakao Map initialization error:', err);
        setError('지도 초기화 중 오류가 발생했습니다.');
      }
    });
  }, [scriptLoaded]);

  // 마커 업데이트
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || locations.length === 0) {
      return;
    }

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 지도 범위 계산을 위한 bounds
    const bounds = new window.kakao.maps.LatLngBounds();

    locations.forEach((location) => {
      if (!location.latitude || !location.longitude) return;

      const position = new window.kakao.maps.LatLng(
        location.latitude,
        location.longitude
      );

      // 커스텀 마커 이미지 생성
      const markerImageSrc = location.has_drift 
        ? 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="40" viewBox="0 0 24 24" fill="#dc2626" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `)
        : 'data:image/svg+xml;base64,' + btoa(`
          <svg width="32" height="40" viewBox="0 0 24 24" fill="#16a34a" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `);

      const imageSize = new window.kakao.maps.Size(32, 40);
      const imageOption = { offset: new window.kakao.maps.Point(16, 40) };
      
      const markerImage = new window.kakao.maps.MarkerImage(
        markerImageSrc,
        imageSize,
        imageOption
      );

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        title: location.mold_code,
      });

      marker.setMap(mapInstanceRef.current);

      // 인포윈도우 생성
      const infoWindowContent = `
        <div style="
          padding: 12px;
          min-width: 200px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ">
          <div style="font-weight: bold; color: #1f2937; margin-bottom: 4px; font-size: 14px;">
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
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoWindowContent,
        removable: false,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 다른 인포윈도우 닫기
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });

        // 현재 인포윈도우 열기
        infoWindow.open(mapInstanceRef.current, marker);

        // 선택된 금형 업데이트
        if (onSelectMold) {
          onSelectMold(location);
        }

        // 지도 중심 이동 (부드럽게)
        mapInstanceRef.current.panTo(position);
      });

      // 마커에 인포윈도우 참조 저장
      marker.infoWindow = infoWindow;
      marker.location = location;
      markersRef.current.push(marker);

      // 바운드에 추가
      bounds.extend(position);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (locations.length > 0) {
      mapInstanceRef.current.setBounds(bounds);
    }

    console.log(`✅ ${locations.length} markers added to Kakao Map`);
  }, [mapReady, locations, onSelectMold]);

  // 선택된 금형 하이라이트
  useEffect(() => {
    if (!selectedMold || !mapReady) return;

    const marker = markersRef.current.find(
      m => m.getTitle() === selectedMold.mold_code
    );

    if (marker && marker.infoWindow) {
      // 다른 인포윈도우 닫기
      markersRef.current.forEach(m => {
        if (m.infoWindow && m !== marker) {
          m.infoWindow.close();
        }
      });

      // 선택된 마커의 인포윈도우 열기
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
