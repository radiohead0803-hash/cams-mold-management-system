import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * 대시보드 KPI 데이터를 가져오는 커스텀 훅
 * @returns {Object} { data, loading, error, refetch }
 */
export function useDashboardKpi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/hq/dashboard/summary');
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'KPI 데이터 조회 실패');
      }
    } catch (err) {
      console.error('Dashboard KPI load error:', err);
      setError(err.response?.data?.error?.message || err.message || 'KPI 데이터를 불러올 수 없습니다.');
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

/**
 * 대시보드 차트 데이터를 가져오는 커스텀 훅
 * @returns {Object} { data, loading, error, refetch }
 */
export function useDashboardCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dash/charts');
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error?.message || '차트 데이터 조회 실패');
      }
    } catch (err) {
      console.error('Dashboard charts load error:', err);
      setError(err.response?.data?.error?.message || err.message || '차트 데이터를 불러올 수 없습니다.');
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

/**
 * 대시보드 최근 활동 데이터를 가져오는 커스텀 훅
 * @param {number} limit - 가져올 항목 수
 * @returns {Object} { data, loading, error, refetch }
 */
export function useDashboardActivities(limit = 10) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/hq/dashboard/recent-activities?limit=${limit}`);
      
      if (response.data.success) {
        const raw = response.data.data || {};
        const recentScans = raw.recentScans || [];
        const recentRepairs = raw.recentRepairs || [];

        const normalized = [
          ...recentScans.map((item) => ({
            id: `scan-${item.id}`,
            type: 'scan',
            time: item.created_at,
            title: 'QR 스캔',
            description: `${item.mold?.mold_name || '금형'} - ${item.user?.name || item.user?.username || '사용자'}`,
            action: '스캔 내역 확인'
          })),
          ...recentRepairs.map((item) => ({
            id: `repair-${item.id}`,
            type: 'repair',
            time: item.created_at,
            title: '수리 요청',
            description: `${item.issue_type || '수리요청'} (${item.severity || 'normal'})`,
            action: '수리 요청 상세 보기'
          }))
        ].slice(0, limit);

        setData(normalized);
      } else {
        throw new Error(response.data.error?.message || '활동 데이터 조회 실패');
      }
    } catch (err) {
      console.error('Dashboard activities load error:', err);
      setError(err.response?.data?.error?.message || err.message || '활동 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { 
    data, 
    loading, 
    error,
    refetch: fetchData
  };
}
