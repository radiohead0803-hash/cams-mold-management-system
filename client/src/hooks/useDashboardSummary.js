/**
 * 대시보드 요약 데이터 훅
 * 역할별 KPI + Action + Trends API 활용
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

/**
 * 생산처 대시보드 요약 훅
 */
export function usePlantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard-summary/plant');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('[usePlantDashboard] Error:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 제작처 대시보드 요약 훅
 */
export function useMakerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard-summary/maker');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('[useMakerDashboard] Error:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 개발담당 대시보드 요약 훅
 */
export function useDeveloperDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard-summary/developer');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('[useDeveloperDashboard] Error:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 시스템 관리자 대시보드 요약 훅
 */
export function useAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard-summary/admin');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('[useAdminDashboard] Error:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 통계 리포트 훅
 */
export function useStatisticsReport(reportType = 'summary', period = 'weekly') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/statistics-report/${reportType}?period=${period}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('[useStatisticsReport] Error:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [reportType, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 오늘 점검 현황 훅
 */
export function useTodayInspectionStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/inspection-flow/today-status');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('[useTodayInspectionStatus] Error:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
