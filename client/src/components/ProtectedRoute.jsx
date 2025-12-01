import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * ProtectedRoute - 인증된 사용자만 접근 가능한 라우트
 * @param {Object} props
 * @param {React.ReactElement} props.children - 보호할 컴포넌트
 * @param {string[]} props.allowedRoles - 허용된 사용자 유형 (선택사항)
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore()

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 특정 역할만 허용하는 경우 권한 체크
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.user_type)) {
      // 권한이 없는 경우 대시보드로 리다이렉트
      return <Navigate to="/" replace />
    }
  }

  return children
}
