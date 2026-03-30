/**
 * GPS 수집 유틸리티 — 비차단(non-blocking) GPS 수집
 *
 * 모든 GPS 관련 작업(QR 스캔, 점검, 수리요청 등)에서 사용.
 * GPS 실패 시에도 작업이 정상 진행되도록 설계됨.
 */

import api from '../lib/api';

/**
 * 현재 GPS 위치 가져오기 (비차단)
 * - GPS 실패 시 null 반환 (reject 하지 않음)
 * - timeout 5초, 최대 캐시 60초
 *
 * @param {Object} [options] - Geolocation 옵션 오버라이드
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number} | null>}
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[GPS Collector] Geolocation API not available');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        // GPS 실패해도 null 반환 — 작업은 계속 진행
        console.warn('[GPS Collector] Position unavailable:', err.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
        ...options
      }
    );
  });
}

/**
 * GPS 이벤트를 서버에 기록
 * - 실패해도 예외를 던지지 않음
 *
 * @param {Object} params
 * @param {number} [params.moldId] - 금형 ID
 * @param {string} params.eventType - 이벤트 유형 (qr_scan, daily_check, periodic_check, repair_request, transfer, scrapping)
 * @param {number} params.latitude - 위도
 * @param {number} params.longitude - 경도
 * @param {number} [params.accuracy] - GPS 정확도 (미터)
 * @param {string} [params.locationName] - 장소명
 * @returns {Promise<void>}
 */
export async function logGPSEvent({ moldId, eventType, latitude, longitude, accuracy, locationName }) {
  if (!latitude || !longitude) return;

  try {
    await api.post('/gps/log', {
      moldId,
      eventType,
      latitude,
      longitude,
      accuracy,
      locationName
    });
  } catch (e) {
    console.warn('[GPS Collector] Log failed:', e.message);
  }
}

/**
 * GPS를 수집하고 즉시 서버에 기록 (원스텝 편의 함수)
 * - QR 스캔 등에서 한 줄로 호출 가능
 *
 * @param {Object} params
 * @param {number} [params.moldId] - 금형 ID
 * @param {string} params.eventType - 이벤트 유형
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number} | null>}
 */
export async function collectAndLogGPS({ moldId, eventType }) {
  const pos = await getCurrentPosition();
  if (pos) {
    await logGPSEvent({
      moldId,
      eventType,
      latitude: pos.latitude,
      longitude: pos.longitude,
      accuracy: pos.accuracy
    });
  }
  return pos;
}

/**
 * 금형별 GPS 이력 조회
 *
 * @param {number} moldId - 금형 ID
 * @param {Object} [options]
 * @param {number} [options.limit=20] - 조회 개수
 * @param {string} [options.eventType] - 이벤트 유형 필터
 * @returns {Promise<Array>}
 */
export async function getGPSHistory(moldId, options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit);
    if (options.eventType) params.set('eventType', options.eventType);

    const response = await api.get(`/gps/history/${moldId}?${params.toString()}`);
    return response.data?.data?.logs || [];
  } catch (e) {
    console.warn('[GPS Collector] History fetch failed:', e.message);
    return [];
  }
}
