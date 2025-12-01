import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * HQ 수리요청 목록을 가져오는 커스텀 훅
 * @param {string} status - 필터링할 상태 (선택사항)
 * @returns {Object} { data, loading, error, refetch }
 */
export function useHqRepairs(status) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (status) params.status = status;
      
      const response = await api.get('/hq/repair-requests', { params });
      
      if (response.data.success) {
        setData(response.data.data.repairs || []);
      } else {
        throw new Error(response.data.error?.message || '수리요청 목록 조회 실패');
      }
    } catch (err) {
      console.error('HQ repairs load error:', err);
      setError(err.response?.data?.error?.message || err.message || '수리요청 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  return { 
    data, 
    loading, 
    error,
    refetch: fetchData
  };
}
