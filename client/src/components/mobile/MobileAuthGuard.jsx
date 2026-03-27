import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import MobileErrorBoundary from './MobileErrorBoundary'

/**
 * MobileAuthGuard - 모바일 라우트 인증 보호 레이아웃
 *
 * 인증되지 않은 사용자가 /mobile/* 경로 접근 시 /login으로 리다이렉트
 * Outlet으로 하위 라우트를 렌더링하는 레이아웃 라우트 패턴
 *
 * @param {string[]} allowedRoles - 허용된 역할 (빈 배열이면 인증만 체크)
 */
export default function MobileAuthGuard({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // 미인증 → 로그인 (현재 경로를 state로 전달하여 로그인 후 복귀)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 역할 제한이 있으면 체크
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.user_type)) {
      return <Navigate to="/mobile/home" replace />
    }
  }

  return <MobileErrorBoundary><Outlet /></MobileErrorBoundary>
}
