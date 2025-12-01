import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * 금형 위치 및 위치 이탈 정보를 가져오는 커스텀 훅
 * @returns {Object} { locations, loading, error, refetch }
 */
export function useMoldLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/hq/mold-locations');
      
      // 응답 형태가 다양할 수 있으므로 유연하게 처리
      const raw = 
        (Array.isArray(response.data) && response.data) ||
        (response.data.success && response.data.data?.items) ||
        (response.data.success && response.data.data?.molds) ||
        (response.data.data?.items) ||
        (response.data.data?.molds) ||
        (response.data.items) ||
        (response.data.molds) ||
        [];

      // 데이터 정규화
      const parsed = raw.map((item) => ({
        id: item.id ?? item.mold_id ?? item.moldId ?? 0,
        moldCode: item.mold_code ?? item.moldCode ?? item.code ?? 'UNKNOWN',
        moldName: item.mold_name ?? item.moldName ?? item.name ?? null,
        plantName: item.current_location ?? item.plantName ?? item.plant ?? '미지정',
        lat: Number(item.latitude ?? item.lat ?? 0),
        lng: Number(item.longitude ?? item.lng ?? 0),
        status: item.has_drift ? 'moved' : 'normal',
        hasDrift: item.has_drift ?? false,
        driftDistance: item.drift_distance ?? 0,
        registeredLocation: item.registered_location ?? null,
        lastUpdated: item.last_updated ?? item.updated_at ?? null,
      }));

      setLocations(parsed);
    } catch (err) {
      console.error('[useMoldLocations] error:', err);
      setError(err.response?.data?.error?.message || err.message || '금형 위치를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { 
    locations, 
    loading, 
    error,
    refetch: fetchData
  };
}
