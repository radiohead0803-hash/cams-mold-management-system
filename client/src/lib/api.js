import axios from 'axios'

// Railway 배포 URL (프로덕션)
const PRODUCTION_API_URL = 'https://cams-mold-management-system-production-b7d0.up.railway.app/api/v1'
// VITE_API_URL이 이미 /api/v1을 포함하면 그대로 사용, 아니면 /api/v1 추가
const API_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL || 'http://localhost:3001/api/v1'

// 백엔드 기본 URL (이미지 등 정적 파일용)
const API_BASE_URL = API_URL.replace('/api/v1', '')

/**
 * 이미지 URL을 전체 URL로 변환
 * - http/https로 시작하면 그대로 반환
 * - /api/v1/mold-images/file/로 시작하면 백엔드 URL 붙임
 * - /uploads/로 시작하면 백엔드 URL 붙임
 * - data:로 시작하면 (Base64) 그대로 반환
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // 이미 전체 URL이면 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Base64 데이터면 그대로 반환
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // 상대 경로면 백엔드 URL 붙임
  return `${API_BASE_URL}${imageUrl}`;
}

const api = axios.create({
  baseURL: API_URL,
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
      // 특정 API는 401이어도 리다이렉트하지 않음 (선택적 데이터 로드)
      const requestUrl = error.config?.url || ''
      const skipRedirectPaths = [
        '/daily-checks',
        '/repair-requests',
        '/mold-images',
        '/notifications'
      ]
      
      const shouldSkipRedirect = skipRedirectPaths.some(path => requestUrl.includes(path))
      
      if (!shouldSkipRedirect) {
        // Token expired or invalid
        localStorage.removeItem('cams-auth')
        
        // 현재 경로에 따라 적절한 로그인 페이지로 이동
        const currentPath = window.location.pathname
        if (currentPath.startsWith('/mobile') || currentPath.startsWith('/m/')) {
          // 모바일 페이지에서는 모바일 QR 로그인으로
          window.location.href = '/mobile/qr-login'
        } else {
          // PC 페이지에서는 일반 로그인으로
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  // 모바일 QR 로그인 및 스캔 엔드포인트는 서버의 /mobile/qr 라우트에 맞춤
  qrLogin: (data) => api.post('/mobile/qr/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh', { token }),
  me: () => api.get('/auth/me'),
  scanQR: (data) => api.post('/mobile/qr/scan', data),
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

// Inspection API (점검 승인 관리)
export const inspectionAPI = {
  // 점검 목록 조회
  getAll: (params) => api.get('/inspections', { params }),
  // 승인 대기 목록
  getPending: (params) => api.get('/inspections/pending', { params }),
  // 점검 상세 조회
  getById: (id, params) => api.get(`/inspections/${id}`, { params }),
  // 일상점검 제출
  createDaily: (data) => api.post('/inspections/daily', data),
  // 정기점검 제출
  createPeriodic: (data) => api.post('/inspections/periodic', data),
  // 점검 수정
  update: (id, data) => api.patch(`/inspections/${id}`, data),
  // 점검 승인
  approve: (id, data) => api.post(`/inspections/${id}/approve`, data),
  // 점검 반려
  reject: (id, data) => api.post(`/inspections/${id}/reject`, data),
}

// Alert/Notification API - 서버의 /notifications 라우트에 맞춤
export const alertAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  trigger: (data) => api.post('/notifications/trigger', data),
}

// Transfer API
export const transferAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  approve: (id, data) => api.patch(`/transfers/${id}/approve`, data),
  reject: (id, data) => api.patch(`/transfers/${id}/reject`, data),
  getChecklistItems: () => api.get('/transfers/checklist/items'),
}

// Repair Request API (수리요청)
export const repairRequestAPI = {
  // 수리요청 목록 조회
  getAll: (params) => api.get('/repair-requests', { params }),
  // 수리요청 상세 조회
  getById: (id) => api.get(`/repair-requests/${id}`),
  // 수리요청 생성
  create: (data) => api.post('/repair-requests', data),
  // 수리요청 수정
  update: (id, data) => api.put(`/repair-requests/${id}`, data),
  // 수리요청 상태 변경
  updateStatus: (id, data) => api.patch(`/repair-requests/${id}/status`, data),
  // 수리요청 삭제
  delete: (id) => api.delete(`/repair-requests/${id}`),
  // 금형별 수리요청 조회
  getByMold: (moldId) => api.get('/repair-requests', { params: { mold_id: moldId } }),
  // 통계 조회
  getStats: (params) => api.get('/repair-requests/stats', { params }),
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

// Mold Image API
// 다양한 연계 항목 지원: 금형정보, 체크리스트, 점검, 수리, 이관 등
export const moldImageAPI = {
  upload: (formData) => api.post('/mold-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // params: mold_id, mold_spec_id, image_type, reference_type, reference_id, checklist_id, repair_id, transfer_id, maker_spec_id
  getAll: (params) => api.get('/mold-images', { params }),
  // 특정 연계 항목의 이미지 조회
  getByReference: (referenceType, referenceId) => api.get('/mold-images', { 
    params: { reference_type: referenceType, reference_id: referenceId } 
  }),
  getByChecklist: (checklistId) => api.get('/mold-images', { params: { checklist_id: checklistId } }),
  getByRepair: (repairId) => api.get('/mold-images', { params: { repair_id: repairId } }),
  getByTransfer: (transferId) => api.get('/mold-images', { params: { transfer_id: transferId } }),
  setPrimary: (id) => api.patch(`/mold-images/${id}/primary`),
  delete: (id) => api.delete(`/mold-images/${id}`),
}

// Maker Specification API
export const makerSpecificationAPI = {
  getAll: (params) => api.get('/maker-specifications', { params }),
  getById: (id) => api.get(`/maker-specifications/${id}`),
  update: (id, data) => api.patch(`/maker-specifications/${id}`, data),
  getDashboardStats: () => api.get('/maker-specifications/dashboard/stats'),
}

// Injection Condition API (사출조건 관리)
export const injectionConditionAPI = {
  // 사출조건 등록 (제작처/생산처)
  create: (data) => api.post('/injection-conditions', data),
  // 사출조건 조회 (금형별)
  get: (params) => api.get('/injection-conditions', { params }),
  // 사출조건 수정
  update: (id, data) => api.put(`/injection-conditions/${id}`, data),
  // 사출조건 승인/반려 (개발담당자)
  approve: (id, data) => api.post(`/injection-conditions/${id}/approve`, data),
  // 이력 조회
  getHistory: (params) => api.get('/injection-conditions/history', { params }),
  // 통계 조회
  getStats: (params) => api.get('/injection-conditions/stats', { params }),
  // 승인 대기 목록
  getPending: () => api.get('/injection-conditions/pending'),
}

// Weight API (설계중량/실중량 이력관리)
export const weightAPI = {
  // 현재 중량 조회
  get: (moldSpecId) => api.get(`/weight/${moldSpecId}`),
  // 중량 업데이트 (이력 자동 기록)
  update: (moldSpecId, data) => api.put(`/weight/${moldSpecId}`, data),
  // 중량 이력 조회
  getHistory: (moldSpecId, params) => api.get(`/weight/${moldSpecId}/history`, { params }),
}

// Material API (원재료 정보 이력관리)
export const materialAPI = {
  // 현재 원재료 정보 조회
  get: (moldSpecId) => api.get(`/material/${moldSpecId}`),
  // 원재료 정보 업데이트 (이력 자동 기록, 개발담당자만)
  update: (moldSpecId, data) => api.put(`/material/${moldSpecId}`, data),
  // 원재료 이력 조회
  getHistory: (moldSpecId, params) => api.get(`/material/${moldSpecId}/history`, { params }),
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
  
  // 원재료
  getRawMaterials: (params) => api.get('/master-data/raw-materials', { params }),
  createRawMaterial: (data) => api.post('/master-data/raw-materials', data),
  updateRawMaterial: (id, data) => api.patch(`/master-data/raw-materials/${id}`, data),
  deleteRawMaterial: (id) => api.delete(`/master-data/raw-materials/${id}`),
}

export default api
