import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * 금형 위치 및 위치 이탈 정보를 가져오는 커스텀 훅
 * @returns {Object} { data, loading, error, refetch }
 */
export function useMoldLocations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/hq/mold-locations');
      
      if (response.data.success) {
        setData(response.data.data.molds || []);
      } else {
        throw new Error(response.data.error?.message || '금형 위치 조회 실패');
      }
    } catch (err) {
      console.error('Mold locations load error:', err);
      setError(err.response?.data?.error?.message || err.message || '금형 위치를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { 
    data, 
    loading, 
    error,
    refetch: fetchData
  };
}
