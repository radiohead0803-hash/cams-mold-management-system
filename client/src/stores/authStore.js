import { create } from 'zustand'
import api from '../lib/api'

// 스토어 생성 시점에 즉시 localStorage에서 복원 (새로고침 시 깜빡임 방지)
const getInitialState = () => {
  try {
    const stored = localStorage.getItem('cams-auth')
    if (stored) {
      const { user, token } = JSON.parse(stored)
      if (user && token) {
        return { user, token, isAuthenticated: true }
      }
    }
  } catch (e) {
    localStorage.removeItem('cams-auth')
  }
  return { user: null, token: null, isAuthenticated: false }
}

const initial = getInitialState()

export const useAuthStore = create((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: initial.isAuthenticated,
  loading: false,
  error: null,

  // 백엔드 API를 통한 로그인
  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      // POST /api/v1/auth/login
      const res = await api.post('/auth/login', { username, password })

      const { token, user } = res.data.data

      // user_type을 role로 매핑
      const mappedUser = {
        ...user,
        role: user.user_type || user.role
      }

      localStorage.setItem('cams-auth', JSON.stringify({ user: mappedUser, token }))
      set({ user: mappedUser, token, isAuthenticated: true, loading: false, error: null })

      return { success: true, user: mappedUser }
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || '로그인 중 오류가 발생했습니다.'
      set({ loading: false, error: message, isAuthenticated: false })
      return { success: false, error: message }
    }
  },

  // 외부에서 이미 받은 user/token으로 인증 상태 직접 세팅 (QR 로그인 등)
  setAuth: (user, token) => {
    const mappedUser = { ...user, role: user.user_type || user.role }
    localStorage.setItem('cams-auth', JSON.stringify({ user: mappedUser, token }))
    set({ user: mappedUser, token, isAuthenticated: true, loading: false, error: null })
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, error: null })
    localStorage.removeItem('cams-auth')
  },

  updateUser: (userData) => {
    set((state) => ({ user: { ...state.user, ...userData } }))
  },

  // Initialize from localStorage
  initialize: () => {
    const stored = localStorage.getItem('cams-auth')
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored)
        set({ user, token, isAuthenticated: true })
      } catch (e) {
        localStorage.removeItem('cams-auth')
      }
    }
  }
}))
