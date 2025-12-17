import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { getDashboardPath } from '../config/menuRegistry'

/**
 * Dashboard Router
 * 사용자 유형에 따라 적절한 대시보드로 리다이렉트
 * 문서 기준 경로: /dashboard/system-admin, /dashboard/mold-developer, /dashboard/maker, /dashboard/plant
 */
export default function Dashboard() {
  const { user } = useAuthStore()

  const dashboardPath = getDashboardPath(user?.user_type) || '/dashboard/system-admin'

  return <Navigate to={dashboardPath} replace />
}
