import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * Dashboard Router
 * 사용자 유형에 따라 적절한 대시보드로 리다이렉트
 */
export default function Dashboard() {
  const { user } = useAuthStore()

  // 사용자 유형에 따라 대시보드 경로 결정
  const getDashboardPath = () => {
    if (!user || !user.user_type) return '/dashboard/admin'

    switch (user.user_type) {
      case 'system_admin':
        return '/dashboard/admin'
      case 'mold_developer':
        return '/dashboard/developer'
      case 'maker':
        return '/dashboard/maker'
      case 'plant':
        return '/dashboard/plant'
      default:
        return '/dashboard/admin'
    }
  }

  return <Navigate to={getDashboardPath()} replace />
}
