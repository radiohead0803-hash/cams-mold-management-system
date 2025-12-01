/**
 * GPS 위치 헬퍼 유틸리티
 * 모바일 기기에서 GPS 좌표를 가져오고 서버에 전송
 */

import api from '../lib/api';

/**
 * 현재 GPS 위치 가져오기
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 기기에서는 GPS를 사용할 수 없습니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'GPS 정보를 가져올 수 없습니다.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'GPS 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'GPS 위치를 확인할 수 없습니다.';
            break;
          case error.TIMEOUT:
            message = 'GPS 요청 시간이 초과되었습니다.';
            break;
        }
        
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * QR 스캔 후 금형 위치 업데이트
 * @param {number} moldId - 금형 ID
 * @param {string} source - 소스 ('qr_scan', 'manual', 'auto')
 * @param {string} notes - 메모 (선택)
 * @returns {Promise<Object>}
 */
export const updateMoldLocation = async (moldId, source = 'qr_scan', notes = '') => {
  try {
    // 1. GPS 위치 가져오기
    const position = await getCurrentPosition();
    
    console.log('[GPS] 위치 획득:', position);

    // 2. 서버에 위치 전송
    const response = await api.post(`/api/v1/mobile/molds/${moldId}/location`, {
      gpsLat: position.latitude,
      gpsLng: position.longitude,
      source,
      notes
    });

    console.log('[GPS] 서버 응답:', response.data);

    return {
      success: true,
      data: response.data.data,
      position
    };

  } catch (error) {
    console.error('[GPS] 위치 업데이트 실패:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || '위치 업데이트에 실패했습니다.'
    };
  }
};

/**
 * 금형 위치 로그 조회
 * @param {number} moldId - 금형 ID
 * @param {number} limit - 조회 개수
 * @returns {Promise<Object>}
 */
export const getMoldLocationLogs = async (moldId, limit = 50) => {
  try {
    const response = await api.get(`/api/v1/mobile/molds/${moldId}/location-logs`, {
      params: { limit }
    });

    return {
      success: true,
      logs: response.data.data.logs
    };

  } catch (error) {
    console.error('[GPS] 로그 조회 실패:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || '로그 조회에 실패했습니다.'
    };
  }
};

/**
 * GPS 권한 확인
 * @returns {Promise<boolean>}
 */
export const checkGPSPermission = async () => {
  if (!navigator.permissions) {
    return true; // 권한 API 미지원 브라우저는 true 반환
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted';
  } catch (error) {
    console.warn('[GPS] 권한 확인 실패:', error);
    return true;
  }
};

/**
 * GPS 사용 가능 여부 확인
 * @returns {boolean}
 */
export const isGPSAvailable = () => {
  return 'geolocation' in navigator;
};
