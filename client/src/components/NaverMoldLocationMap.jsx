import { useEffect, useRef, useState } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';

const NAVER_SCRIPT_ID = 'naver-map-sdk';

/**
 * 네이버 지도 기반 금형 위치 지도 컴포넌트
 * @param {Object} props
 * @param {Array} props.locations - 금형 위치 데이터 배열
 * @param {Function} props.onRefresh - 새로고침 콜백
 */
export default function NaverMoldLocationMap({ locations = [], onRefresh }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedMold, setSelectedMold] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  // 네이버 지도 SDK 로드 및 초기화
  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;

    if (!clientId || clientId === 'your_naver_client_id_here') {
      setError('네이버 지도 Client ID가 설정되지 않았습니다.');
      console.error('[NaverMap] VITE_NAVER_MAP_CLIENT_ID가 없습니다.');
      return;
    }

    const initMap = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        setError('네이버 지도 SDK를 불러올 수 없습니다.');
        console.error('[NaverMap] naver.maps가 없습니다.');
        return;
      }

      try {
        // 지도 중심점 설정 (첫 번째 위치 또는 서울 시청)
        const center =
          locations.length > 0 && locations[0].lat && locations[0].lng
            ? new window.naver.maps.LatLng(locations[0].lat, locations[0].lng)
            : new window.naver.maps.LatLng(37.5665, 126.978);

        // 지도 생성
        const map = new window.naver.maps.Map(mapRef.current, {
          center,
          zoom: 10,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT
          },
          mapTypeControl: true
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setError(null);

        console.log('[NaverMap] 지도 초기화 완료');
      } catch (err) {
        console.error('[NaverMap] 지도 초기화 실패:', err);
        setError('지도 초기화에 실패했습니다.');
      }
    };

    const existingScript = document.getElementById(NAVER_SCRIPT_ID);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = NAVER_SCRIPT_ID;
      script.async = true;
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;

      script.onload = () => {
        console.log('[NaverMap] SDK 로드 완료');
        initMap();
      };

      script.onerror = (e) => {
        console.error('[NaverMap] SDK 로드 실패:', e);
        console.error('[NaverMap] URL:', script.src);
        setError('네이버 지도 SDK 로드에 실패했습니다. Client ID를 확인해주세요.');
      };

      document.head.appendChild(script);
    } else {
      if (window.naver && window.naver.maps) {
        initMap();
      } else {
        existingScript.addEventListener('load', initMap);
      }
    }

    return () => {
      const script = document.getElementById(NAVER_SCRIPT_ID);
      if (script) {
        script.removeEventListener('load', initMap);
      }
    };
  }, []);

  // 마커 업데이트
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.naver) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 생성
    locations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return;

      const pos = new window.naver.maps.LatLng(loc.lat, loc.lng);

      // 상태별 색상
      const getColor = () => {
        if (loc.status === 'ng') return '#ef4444';
        if (loc.status === 'moved' || loc.hasDrift) return '#f97316';
        return '#22c55e';
      };

      const color = getColor();

      // 마커 생성
      const marker = new window.naver.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        title: loc.moldCode,
        icon: {
          content: `
            <div style="
              background: ${color};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          `,
          anchor: new window.naver.maps.Point(12, 12)
        }
      });

      // 정보창 내용
      const contentHtml = `
        <div style="padding: 8px 12px; min-width: 180px; font-family: sans-serif;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #1f2937;">
            ${loc.moldCode}
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            ${loc.moldName || '이름 없음'}
          </div>
          <div style="font-size: 11px; color: #9ca3af; margin-bottom: 6px;">
            📍 ${loc.plantName || '위치 미지정'}
          </div>
          <div style="
            display: inline-block;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 600;
            border-radius: 12px;
            background: ${color}20;
            color: ${color};
          ">
            ${loc.hasDrift ? '위치 이탈' : '정상'}
          </div>
          ${loc.hasDrift && loc.driftDistance ? `
            <div style="font-size: 10px; color: #ef4444; margin-top: 4px;">
              ⚠️ ${Math.round(loc.driftDistance)}m 이탈
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new window.naver.maps.InfoWindow({
        content: contentHtml,
        borderWidth: 0,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      });

      // 마커 이벤트
      window.naver.maps.Event.addListener(marker, 'mouseover', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      window.naver.maps.Event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedMold(loc);
      });

      markersRef.current.push(marker);
    });

    console.log(`[NaverMap] ${locations.length}개 마커 생성 완료`);

    // 모든 마커가 보이도록 지도 범위 조정
    if (locations.length > 0 && markersRef.current.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      locations.forEach(loc => {
        if (loc.lat && loc.lng) {
          bounds.extend(new window.naver.maps.LatLng(loc.lat, loc.lng));
        }
      });
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locations, mapLoaded]);

  // 통계 계산
  const stats = {
    total: locations.length,
    normal: locations.filter(l => !l.hasDrift).length,
    moved: locations.filter(l => l.hasDrift).length
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">네이버 지도 - 금형 위치 현황</h3>
            <p className="text-xs text-gray-500">
              총 {stats.total}개 | 정상 {stats.normal}개 | 이탈 {stats.moved}개
            </p>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            새로고침
          </button>
        )}
      </div>

      {/* 지도 영역 */}
      <div className="relative">
        {error ? (
          <div className="h-[500px] flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <p className="text-sm text-gray-600">{error}</p>
              <p className="text-xs text-gray-400 mt-2">
                네이버 클라우드 플랫폼에서 Client ID를 발급받아 환경 변수에 설정해주세요.
              </p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-[500px]" />
        )}

        {/* 범례 */}
        {!error && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
            <div className="font-semibold text-gray-900 mb-2">범례</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">정상 위치</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">위치 이탈</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">NG 상태</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 선택된 금형 상세 정보 */}
      {selectedMold && (
        <div className="px-4 py-3 border-t border-gray-100 bg-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{selectedMold.moldCode}</h4>
              <p className="text-xs text-gray-600 mt-1">{selectedMold.moldName || '이름 없음'}</p>
              <p className="text-xs text-gray-500 mt-1">📍 {selectedMold.plantName || '위치 미지정'}</p>
              {selectedMold.hasDrift && selectedMold.driftDistance && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ 기준 위치에서 {Math.round(selectedMold.driftDistance)}m 이탈
                </p>
              )}
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
