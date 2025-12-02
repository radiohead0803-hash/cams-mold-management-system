import { useEffect, useRef } from "react";

const NAVER_SCRIPT_ID = "naver-map-sdk";

export default function NaverMoldLocationMap({ locations, selectedMoldId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const infoWindowsRef = useRef({});

  const getMarkerIcon = (status, selected) => {
    const color =
      status === "ng"
        ? "#ef4444"
        : status === "moved"
        ? "#f97316"
        : "#22c55e";

    const size = selected ? 24 : 18;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="${selected ? 9 : 7}" fill="${color}" />
        <circle cx="12" cy="12" r="${selected ? 4 : 3}" fill="white" />
      </svg>
    `;
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encoded}`,
      size: new window.naver.maps.Size(size, size),
      origin: new window.naver.maps.Point(0, 0),
      anchor: new window.naver.maps.Point(size / 2, size / 2),
    };
  };

  // 스크립트 로딩 + 지도/마커 생성
  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      console.error("[NaverMap] VITE_NAVER_MAP_CLIENT_ID 가 없습니다.");
      return;
    }

    const initMapAndMarkers = () => {
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        console.error("[NaverMap] naver.maps 가 없습니다.");
        return;
      }

      if (!mapInstanceRef.current) {
        const center =
          locations && locations.length > 0
            ? new window.naver.maps.LatLng(locations[0].lat, locations[0].lng)
            : new window.naver.maps.LatLng(37.5665, 126.978);

        mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
          center,
          zoom: 10,
        });

        console.log("[NaverMap] 지도 초기화 완료");
      }

      const map = mapInstanceRef.current;

      // 기존 마커 제거
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      markersRef.current = {};
      infoWindowsRef.current = {};

      if (!locations) return;

      locations.forEach((loc) => {
        if (!loc.lat || !loc.lng) return;

        const pos = new window.naver.maps.LatLng(loc.lat, loc.lng);
        const selected = selectedMoldId && loc.id === selectedMoldId;

        const marker = new window.naver.maps.Marker({
          position: pos,
          map,
          icon: getMarkerIcon(loc.status, selected),
        });

        const color =
          loc.status === "ng"
            ? "#ef4444"
            : loc.status === "moved"
            ? "#f97316"
            : "#22c55e";

        const contentHtml = `
          <div style="padding:4px 6px;font-size:11px;">
            <div style="font-weight:600;margin-bottom:2px;">${loc.moldCode}</div>
            <div>${loc.plantName}</div>
            <div style="margin-top:2px;color:${color};">
              상태: ${loc.status.toUpperCase()}
            </div>
          </div>
        `;

        const infoWindow = new window.naver.maps.InfoWindow({
          content: contentHtml,
        });

        window.naver.maps.Event.addListener(marker, "mouseover", () =>
          infoWindow.open(map, marker)
        );
        window.naver.maps.Event.addListener(marker, "mouseout", () =>
          infoWindow.close()
        );

        markersRef.current[loc.id] = marker;
        infoWindowsRef.current[loc.id] = infoWindow;
      });

      console.log("[NaverMap] 마커 생성 완료");
    };

    const existingScript = document.getElementById(NAVER_SCRIPT_ID);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = NAVER_SCRIPT_ID;
      script.async = true;
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;

      script.onload = () => {
        initMapAndMarkers();
      };

      script.onerror = (e) => {
        console.error("[NaverMap] 스크립트 로드 실패", e);
      };

      document.head.appendChild(script);
    } else {
      if (window.naver && window.naver.maps) {
        initMapAndMarkers();
      } else {
        existingScript.addEventListener("load", initMapAndMarkers);
      }
    }

    return () => {
      const script = document.getElementById(NAVER_SCRIPT_ID);
      if (script) {
        script.removeEventListener("load", initMapAndMarkers);
      }
    };
  }, [locations, selectedMoldId]);

  // 선택된 금형이 바뀔 때 지도 이동
  useEffect(() => {
    if (!selectedMoldId || !mapInstanceRef.current || !window.naver) return;

    const marker = markersRef.current[selectedMoldId];
    const infoWindow = infoWindowsRef.current[selectedMoldId];

    if (marker) {
      const map = mapInstanceRef.current;
      const pos = marker.getPosition();

      map.setCenter(pos);
      map.setZoom(11);

      if (infoWindow) {
        infoWindow.open(map, marker);
      }
    }
  }, [selectedMoldId]);

  return (
    <div className="w-full h-80 rounded-xl border border-slate-200 overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
