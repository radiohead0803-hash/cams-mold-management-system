import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * 제작처 수리요청 목록을 가져오는 커스텀 훅
 * @param {string} status - 필터링할 상태 (선택사항)
 * @returns {Object} { data, loading, error, refetch, updateStatus }
 */
export function useMakerRepairs(status) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (status) params.status = status;
      
      const response = await api.get('/maker/repair-requests', { params });
      
      if (response.data.success) {
        setData(response.data.data.repairs || []);
      } else {
        throw new Error(response.data.error?.message || '수리요청 목록 조회 실패');
      }
    } catch (err) {
      console.error('Maker repairs load error:', err);
      setError(err.response?.data?.error?.message || err.message || '수리요청 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.patch(`/maker/repair-requests/${id}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        // 로컬 상태 업데이트
        setData(prevData =>
          prevData.map(repair =>
            repair.id === id ? { ...repair, status: newStatus } : repair
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update status error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  return { 
    data, 
    loading, 
    error,
    refetch: fetchData,
    updateStatus
  };
}
