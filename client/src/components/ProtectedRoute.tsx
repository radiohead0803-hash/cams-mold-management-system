// client/src/components/ProtectedRoute.tsx
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface Props {
  children: ReactNode;
  allowedRoles?: string[]; // 특정 역할 제한하고 싶으면 사용
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const location = useLocation();
  const { user, token, restore } = useAuthStore();

  useEffect(() => {
    // 새로고침 시 스토리지에서 복원
    if (!user && token == null) {
      restore();
    }
  }, [user, token, restore]);

  const currentUser = useAuthStore.getState().user;
  const currentToken = useAuthStore.getState().token;

  if (!currentUser || !currentToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // 권한 없는 경우: 나중에 "권한 없음" 페이지로 보내도 됨
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
