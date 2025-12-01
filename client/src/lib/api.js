import axios from 'axios'

// Railway 배포 URL (프로덕션)
const PRODUCTION_API_URL = 'https://cams-mold-management-system-production.up.railway.app'
const API_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('cams-auth')
    if (authData) {
      const { token } = JSON.parse(authData)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('cams-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  qrLogin: (data) => api.post('/auth/qr-login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh', { token }),
  me: () => api.get('/auth/me'),
  scanQR: (data) => api.post('/qr/scan', data),
}

// Mold API
export const moldAPI = {
  getAll: (params) => api.get('/molds', { params }),
  getById: (id) => api.get(`/molds/${id}`),
  getByQR: (qrCode) => api.get(`/molds/qr/${qrCode}`),
  create: (data) => api.post('/molds', data),
  update: (id, data) => api.patch(`/molds/${id}`, data),
  getHistory: (id) => api.get(`/molds/${id}/history`),
  getLocations: () => api.get('/hq/mold-locations'), // 금형 위치 조회
}

// Checklist API
export const checklistAPI = {
  startDaily: (data) => api.post('/checklists/daily/start', data),
  updateDaily: (id, data) => api.patch(`/checklists/daily/${id}`, data),
  getDaily: (id) => api.get(`/checklists/daily/${id}`),
  getHistory: (params) => api.get('/checklists/history', { params }),
  uploadPhotos: (formData) => api.post('/checklists/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  markAsRead: (id) => api.patch(`/alerts/${id}/read`),
  trigger: (data) => api.post('/alerts/trigger', data),
}

// Transfer API
export const transferAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  approve: (id, data) => api.patch(`/transfers/${id}/approve`, data),
  reject: (id, data) => api.patch(`/transfers/${id}/reject`, data),
}

// Report API
export const reportAPI = {
  generate: (data) => api.post('/reports/generate', data),
  get: (id) => api.get(`/reports/${id}`),
  getTransfer: (transferId) => api.get(`/reports/transfer/${transferId}`),
  getInspection: (inspectionId) => api.get(`/reports/inspection/${inspectionId}`),
}

// Mold Specification API
export const moldSpecificationAPI = {
  create: (data) => api.post('/mold-specifications', data),
  getAll: (params) => api.get('/mold-specifications', { params }),
  getById: (id) => api.get(`/mold-specifications/${id}`),
  update: (id, data) => api.patch(`/mold-specifications/${id}`, data),
  delete: (id) => api.delete(`/mold-specifications/${id}`),
}

// Maker Specification API
export const makerSpecificationAPI = {
  getAll: (params) => api.get('/maker-specifications', { params }),
  getById: (id) => api.get(`/maker-specifications/${id}`),
  update: (id, data) => api.patch(`/maker-specifications/${id}`, data),
  getDashboardStats: () => api.get('/maker-specifications/dashboard/stats'),
}

// Master Data API
export const masterDataAPI = {
  // 차종
  getCarModels: (params) => api.get('/master-data/car-models', { params }),
  createCarModel: (data) => api.post('/master-data/car-models', data),
  updateCarModel: (id, data) => api.patch(`/master-data/car-models/${id}`, data),
  deleteCarModel: (id) => api.delete(`/master-data/car-models/${id}`),
  
  // 재질
  getMaterials: (params) => api.get('/master-data/materials', { params }),
  createMaterial: (data) => api.post('/master-data/materials', data),
  updateMaterial: (id, data) => api.patch(`/master-data/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/master-data/materials/${id}`),
  
  // 금형타입
  getMoldTypes: (params) => api.get('/master-data/mold-types', { params }),
  createMoldType: (data) => api.post('/master-data/mold-types', data),
  updateMoldType: (id, data) => api.patch(`/master-data/mold-types/${id}`, data),
  deleteMoldType: (id) => api.delete(`/master-data/mold-types/${id}`),
  
  // 톤수
  getTonnages: (params) => api.get('/master-data/tonnages', { params }),
  createTonnage: (data) => api.post('/master-data/tonnages', data),
  updateTonnage: (id, data) => api.patch(`/master-data/tonnages/${id}`, data),
  deleteTonnage: (id) => api.delete(`/master-data/tonnages/${id}`),
}

export default api
