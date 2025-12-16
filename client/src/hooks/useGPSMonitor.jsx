/**
 * GPS 모니터링 훅
 * - 위치 추적
 * - 허용 범위 이탈 감지
 * - 이탈 알림
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, MapPin, X } from 'lucide-react';

// 두 좌표 간 거리 계산 (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
}

export default function useGPSMonitor({
  allowedLocation = null, // { latitude, longitude }
  allowedRadius = 500, // 허용 반경 (미터)
  onOutOfRange = null, // 이탈 시 콜백
  onBackInRange = null, // 복귀 시 콜백
  watchInterval = 30000, // 감시 간격 (ms)
  enabled = true
}) {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [distance, setDistance] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  
  const watchIdRef = useRef(null);
  const wasOutOfRangeRef = useRef(false);

  // 위치 업데이트 처리
  const handlePositionUpdate = useCallback((position) => {
    const { latitude, longitude, accuracy: posAccuracy } = position.coords;
    
    setCurrentPosition({ latitude, longitude });
    setAccuracy(posAccuracy);
    setError(null);

    // 허용 위치가 설정된 경우 거리 계산
    if (allowedLocation) {
      const dist = calculateDistance(
        latitude,
        longitude,
        allowedLocation.latitude,
        allowedLocation.longitude
      );
      setDistance(dist);

      const outOfRange = dist > allowedRadius;
      setIsOutOfRange(outOfRange);

      // 이탈 상태 변경 시 콜백 호출
      if (outOfRange && !wasOutOfRangeRef.current) {
        wasOutOfRangeRef.current = true;
        onOutOfRange?.({
          currentPosition: { latitude, longitude },
          allowedLocation,
          distance: dist,
          allowedRadius
        });
      } else if (!outOfRange && wasOutOfRangeRef.current) {
        wasOutOfRangeRef.current = false;
        onBackInRange?.({
          currentPosition: { latitude, longitude },
          allowedLocation,
          distance: dist
        });
      }
    }
  }, [allowedLocation, allowedRadius, onOutOfRange, onBackInRange]);

  // 위치 오류 처리
  const handlePositionError = useCallback((err) => {
    setError(err.message);
    console.error('GPS Error:', err);
  }, []);

  // 위치 감시 시작
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 기기입니다.');
      return;
    }

    if (watchIdRef.current !== null) return;

    setWatching(true);
    
    // 즉시 한 번 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 주기적 감시
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: watchInterval }
    );
  }, [handlePositionUpdate, handlePositionError, watchInterval]);

  // 위치 감시 중지
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  }, []);

  // 수동 위치 새로고침
  const refreshPosition = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handlePositionUpdate, handlePositionError]);

  // enabled 상태에 따라 감시 시작/중지
  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => stopWatching();
  }, [enabled, startWatching, stopWatching]);

  return {
    currentPosition,
    isOutOfRange,
    distance,
    accuracy,
    error,
    watching,
    startWatching,
    stopWatching,
    refreshPosition
  };
}

// GPS 이탈 알림 컴포넌트
export function GPSOutOfRangeAlert({ 
  isOutOfRange, 
  distance, 
  allowedRadius,
  onDismiss,
  onRequestReturn 
}) {
  const [dismissed, setDismissed] = useState(false);

  // 이탈 상태가 변경되면 dismissed 초기화
  useEffect(() => {
    if (isOutOfRange) {
      setDismissed(false);
    }
  }, [isOutOfRange]);

  if (!isOutOfRange || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-bounce-in">
        <div className="flex justify-end">
          <button onClick={handleDismiss} className="p-1 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            허용 범위 이탈
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            현재 위치가 허용된 작업 범위를 벗어났습니다.
          </p>
          
          <div className="bg-red-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {distance ? `${Math.round(distance)}m` : '-'} / {allowedRadius}m
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              허용 범위를 {distance ? Math.round(distance - allowedRadius) : 0}m 초과했습니다
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={onRequestReturn}
              className="w-full py-3 bg-red-500 text-white rounded-lg font-medium"
            >
              작업 위치로 복귀
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
            >
              나중에 알림
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// GPS 상태 배너 (상단 고정)
export function GPSStatusBanner({ 
  isOutOfRange, 
  distance, 
  accuracy,
  watching 
}) {
  if (!watching) return null;
  
  if (isOutOfRange) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>허용 범위 이탈 ({distance ? `${Math.round(distance)}m` : '-'})</span>
        </div>
      </div>
    );
  }

  return null;
}
