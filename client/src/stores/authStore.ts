// client/src/stores/authStore.ts
import { create } from 'zustand';
import api from '../api/httpClient';

export type UserRole = 'system_admin' | 'mold_developer' | 'maker' | 'plant';

export interface AuthUser {
  id: number;
  username: string;
  name?: string;
  role: UserRole;
  companyId?: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  restore: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  restore: () => {
    try {
      const token = localStorage.getItem('cams_token');
      const userRaw = localStorage.getItem('cams_user');
      if (token && userRaw) {
        const user = JSON.parse(userRaw) as AuthUser;
        set({ token, user });
      }
    } catch {
      // 그냥 무시
    }
  },

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // 백엔드: POST /api/v1/auth/login
      const res = await api.post('/auth/login', { username, password });

      const { token, user } = res.data.data as {
        token: string;
        user: AuthUser;
      };

      localStorage.setItem('cams_token', token);
      localStorage.setItem('cams_user', JSON.stringify(user));

      set({ token, user, loading: false, error: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        '로그인 중 오류가 발생했습니다.';
      set({ loading: false, error: message });
    }
  },

  logout: () => {
    localStorage.removeItem('cams_token');
    localStorage.removeItem('cams_user');
    set({ token: null, user: null, error: null });
  },
}));
