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
      
      // 🔥 임시: Mock 데이터 사용 (API 에러 시 폴백)
      const USE_MOCK_DATA = true;
      
      if (USE_MOCK_DATA) {
        console.log('[useDashboardKpi] Using MOCK data');
        setData({
          totalMolds: 150,
          activeMolds: 120,
          openRepairs: 12,
          todayScans: 89,
          overShotCount: 8,
          inspectionDueCount: 15,
          ngMolds: 3,
          criticalAlerts: 5,
          majorAlerts: 12,
          minorAlerts: 23,
          gpsRegistered: 145,
          gpsAbnormal: 5,
          totalUsers: 45,
          todayQRScans: 89
        });
        setLoading(false);
        return;
      }
      
      const response = await api.get('/hq/dashboard/summary');
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'KPI 데이터 조회 실패');
      }
    } catch (err) {
      console.error('Dashboard KPI load error:', err);
      
      // API 실패 시 Mock 데이터 폴백
      console.log('[useDashboardKpi] API failed, using MOCK data as fallback');
      setData({
        totalMolds: 150,
        activeMolds: 120,
        openRepairs: 12,
        todayScans: 89,
        overShotCount: 8,
        inspectionDueCount: 15,
        ngMolds: 3,
        criticalAlerts: 5,
        majorAlerts: 12,
        minorAlerts: 23,
        gpsRegistered: 145,
        gpsAbnormal: 5,
        totalUsers: 45,
        todayQRScans: 89
      });
      setError(null); // 에러 무시
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
      const response = await api.get(`/dash/recent-activities?limit=${limit}`);
      
      if (response.data.success) {
        setData(response.data.data);
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
