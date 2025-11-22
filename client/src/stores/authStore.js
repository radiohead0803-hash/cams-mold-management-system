import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (user, token) => {
    set({ user, token, isAuthenticated: true })
    localStorage.setItem('cams-auth', JSON.stringify({ user, token }))
  },
  
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
    localStorage.removeItem('cams-auth')
  },
  
  updateUser: (userData) => {
    set((state) => ({ user: { ...state.user, ...userData } }))
  },
  
  // Initialize from localStorage
  initialize: () => {
    const stored = localStorage.getItem('cams-auth')
    if (stored) {
      const { user, token } = JSON.parse(stored)
      set({ user, token, isAuthenticated: true })
    }
  }
}))
