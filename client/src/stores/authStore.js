import { create } from 'zustand'
import axios from 'axios'

// API 클라이언트 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: false,
})

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('cams-auth')
  if (stored) {
    try {
      const { token } = JSON.parse(stored)
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // 무시
    }
  }
  return config
})

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
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

// API 클라이언트 export
export { api }
