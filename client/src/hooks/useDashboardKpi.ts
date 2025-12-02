// client/src/hooks/useDashboardKpi.ts
import { useEffect, useState } from 'react';
import { fetchDashboardKpi } from '../api/dashboardApi';
import { useAuthStore } from '../stores/authStore';

export function useDashboardKpi() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role;

  const refetch = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardKpi(role);
      setData(result);
    } catch (err: any) {
      setError(err?.message || '대시보드 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return { data, loading, error, refetch };
}
