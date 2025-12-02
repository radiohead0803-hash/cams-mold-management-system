// client/src/api/dashboardApi.ts
import api from './httpClient';
import { UserRole } from '../stores/authStore';

export function getDashboardEndpoint(role: UserRole): string {
  switch (role) {
    case 'system_admin':
      return '/dashboard/system-admin/kpis';
    case 'plant':
      return '/dashboard/plant/kpis';
    case 'maker':
      return '/dashboard/maker/kpis';
    case 'mold_developer':
      return '/dashboard/developer/kpis';
    default:
      return '/dashboard/system-admin/kpis';
  }
}

export async function fetchDashboardKpi(role: UserRole) {
  const endpoint = getDashboardEndpoint(role);
  const res = await api.get(endpoint);
  return res.data.data; // 백엔드 응답 구조: { success: true, data: {...} }
}
