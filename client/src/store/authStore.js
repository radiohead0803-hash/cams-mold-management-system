import { create } from 'zustand'

// LocalStorage에서 초기 상태 로드
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('cams-auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state || {}
    }
  } catch (error) {
    console.error('Failed to load auth state:', error)
  }
  return {}
}

// LocalStorage에 저장
const saveToStorage = (state) => {
  try {
    localStorage.setItem('cams-auth-storage', JSON.stringify({ state }))
  } catch (error) {
    console.error('Failed to save auth state:', error)
  }
}

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  ...loadFromStorage()
}

const useAuthStore = create((set) => ({
  ...initialState,

  setAuth: (user, token, refreshToken) => {
    const newState = {
      user,
      token,
      refreshToken,
      isAuthenticated: true,
    }
    set(newState)
    saveToStorage(newState)
  },

  updateUser: (user) => {
    set((state) => {
      const newState = { ...state, user }
      saveToStorage(newState)
      return newState
    })
  },

  logout: () => {
    const newState = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }
    set(newState)
    saveToStorage(newState)
  },
}))

export default useAuthStore
