import axios from 'axios'

// Railway 배포 URL (프로덕션)
const PRODUCTION_API_URL = 'https://cams-mold-management-system-production-b7d0.up.railway.app/api/v1'
// VITE_API_URL이 이미 /api/v1을 포함하면 그대로 사용, 아니면 /api/v1 추가
const API_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL || 'http://localhost:3001/api/v1'

// 백엔드 기본 URL (이미지 등 정적 파일용) - 항상 프로덕션 백엔드 URL 사용
const BACKEND_BASE_URL = 'https://cams-mold-management-system-production-b7d0.up.railway.app'
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
  
  // 상대 경로면 백엔드 URL 붙임 (항상 프로덕션 백엔드 사용)
  return `${BACKEND_BASE_URL}${imageUrl}`;
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

// 401 리다이렉트 디바운스 (중복 리다이렉트 방지)
let isRedirecting = false
// 재로그인 직후 401 무시 구간 (ms)
let authRestoredUntil = 0

// 재로그인 성공 시 일정 시간 401 무시 (데이터 재로드 중 이전 요청의 401 방지)
window.addEventListener('cams:auth-restored', () => {
  authRestoredUntil = Date.now() + 3000
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      // 인증 관련 API(로그인 시도 등)는 리다이렉트 제외
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')
      if (isAuthRequest) return Promise.reject(error)

      // 재로그인 직후 유예 구간이면 무시
      if (Date.now() < authRestoredUntil) return Promise.reject(error)

      const currentPath = window.location.pathname
      const isMobile = currentPath.startsWith('/mobile') || currentPath.startsWith('/m/')

      if (isMobile) {
        // ★ 모바일: 토큰이 있었을 때만 세션만료 모달 표시
        // 토큰이 처음부터 없으면(미로그인) 세션만료가 아니므로 무시
        const authData = localStorage.getItem('cams-auth')
        const hadToken = !!authData
        if (hadToken && !isRedirecting) {
          isRedirecting = true
          window.dispatchEvent(new CustomEvent('cams:auth-expired', {
            detail: { path: currentPath, url: requestUrl }
          }))
          setTimeout(() => { isRedirecting = false }, 2000)
        }
      } else {
        // PC: 기존 방식 유지 (로그인 페이지로 이동)
        if (!isRedirecting) {
          isRedirecting = true
          localStorage.removeItem('cams-auth')
          setTimeout(() => {
            window.location.replace('/login')
            isRedirecting = false
          }, 100)
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

// Periodic Inspection API (정기점검 관리)
export const periodicInspectionAPI = {
  // 정기점검 목록 조회
  getAll: (params) => api.get('/periodic-inspections', { params }),
  // 정기점검 상세 조회
  getById: (id) => api.get(`/periodic-inspections/${id}`),
  // 정기점검 생성
  create: (data) => api.post('/periodic-inspections', data),
  // 정기점검 수정
  update: (id, data) => api.put(`/periodic-inspections/${id}`, data),
  // 다음 정기점검 정보 조회
  getNextInspection: (moldId) => api.get(`/periodic-inspections/mold/${moldId}/next`),
  // 점검 유형별 체크리스트 항목 조회 (세척 항목 포함)
  getChecklistItems: (inspectionType) => api.get(`/periodic-inspections/checklist-items/${inspectionType}`),
  // 사진 업로드
  uploadPhotos: (inspectionId, formData) => api.post(`/periodic-inspections/${inspectionId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // 사진 목록 조회
  getPhotos: (inspectionId, params) => api.get(`/periodic-inspections/${inspectionId}/photos`, { params }),
  // 사진 삭제
  deletePhoto: (inspectionId, photoId) => api.delete(`/periodic-inspections/${inspectionId}/photos/${photoId}`),
}

// Transfer API
export const transferAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  update: (id, data) => api.patch(`/transfers/${id}`, data),
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
  // 알림 발송
  sendNotification: (data) => api.post('/workflow/notifications/send', data),
}

// Repair Step Workflow API (단계별 임시저장/승인요청/순차승인)
export const repairStepWorkflowAPI = {
  create: (data) => api.post('/repair-step-workflow', data),
  getById: (id) => api.get(`/repair-step-workflow/${id}`),
  saveDraft: (id, step, data) => api.put(`/repair-step-workflow/${id}/steps/${step}/draft`, data),
  submit: (id, step, data) => api.post(`/repair-step-workflow/${id}/steps/${step}/submit`, data),
  requestApproval: (id, step, data) => api.post(`/repair-step-workflow/${id}/steps/${step}/request-approval`, data),
  approve: (id, step, data) => api.post(`/repair-step-workflow/${id}/steps/${step}/approve`, data),
  reject: (id, step, data) => api.post(`/repair-step-workflow/${id}/steps/${step}/reject`, data),
  getHistory: (id) => api.get(`/repair-step-workflow/${id}/history`),
  getPendingApprovals: () => api.get('/repair-step-workflow/my/pending-approvals'),
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
  // 사출조건 임시저장
  saveDraft: (data) => api.post('/injection-conditions/draft', data),
  // 사출조건 승인요청
  requestApproval: (data) => api.post('/injection-conditions/request-approval', data),
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
  
  // 톤수 (사출기 사양)
  getTonnages: (params) => api.get('/master-data/tonnages', { params }),
  createTonnage: (data) => api.post('/master-data/tonnages', data),
  updateTonnage: (id, data) => api.patch(`/master-data/tonnages/${id}`, data),
  deleteTonnage: (id) => api.delete(`/master-data/tonnages/${id}`),
  // 금형사이즈/형체력 기반 사출기 추천
  recommendTonnages: (params) => api.get('/master-data/tonnages/recommend', { params }),
  // 제작처 사출기 자동 수집
  syncTonnagesFromMakers: () => api.post('/master-data/tonnages/sync-from-makers'),
  
  // 원재료
  getRawMaterials: (params) => api.get('/master-data/raw-materials', { params }),
  createRawMaterial: (data) => api.post('/master-data/raw-materials', data),
  updateRawMaterial: (id, data) => api.patch(`/master-data/raw-materials/${id}`, data),
  deleteRawMaterial: (id) => api.delete(`/master-data/raw-materials/${id}`),
  
  // 회사 (제작처/생산처)
  getCompanies: (params) => api.get('/companies', { params }),
  // 내 업체 프로필
  getMyProfile: () => api.get('/companies/my-profile'),
  updateMyProfile: (data) => api.patch('/companies/my-profile', data),
  // 전체 등록 사출기 목록 (기초정보에서 불러오기용)
  getAllInjectionMachines: () => api.get('/companies/injection-machines/all'),
}

// Equipment API (장비 마스터 + 업체별 보유장비 + 캐파 분석)
export const equipmentAPI = {
  // 장비 마스터 (기초정보)
  getMasters: (params) => api.get('/equipment/masters', { params }),
  getMasterById: (id) => api.get(`/equipment/masters/${id}`),
  createMaster: (data) => api.post('/equipment/masters', data),
  updateMaster: (id, data) => api.patch(`/equipment/masters/${id}`, data),
  deleteMaster: (id) => api.delete(`/equipment/masters/${id}`),
  getManufacturers: (params) => api.get('/equipment/masters/manufacturers', { params }),
  // 내 업체 보유장비
  getMyEquipments: (params) => api.get('/equipment/my', { params }),
  addMyEquipment: (data) => api.post('/equipment/my', data),
  bulkAddMyEquipments: (data) => api.post('/equipment/my/bulk', data),
  // 특정 업체 보유장비
  getCompanyEquipments: (companyId, params) => api.get(`/equipment/company/${companyId}`, { params }),
  addCompanyEquipment: (companyId, data) => api.post(`/equipment/company/${companyId}`, data),
  bulkAddCompanyEquipments: (companyId, data) => api.post(`/equipment/company/${companyId}/bulk`, data),
  // 보유장비 수정/삭제
  updateEquipment: (id, data) => api.patch(`/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),
  // 분석
  getAnalytics: (params) => api.get('/equipment/analytics', { params }),
}

// General Equipment API (협력사 보유 장비현황 - 카테고리별)
export const generalEquipmentAPI = {
  // 카테고리
  getCategories: (params) => api.get('/general-equipment/categories', { params }),
  createCategory: (data) => api.post('/general-equipment/categories', data),
  updateCategory: (id, data) => api.patch(`/general-equipment/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/general-equipment/categories/${id}`),
  // 장비 마스터
  getMasters: (params) => api.get('/general-equipment/masters', { params }),
  createMaster: (data) => api.post('/general-equipment/masters', data),
  updateMaster: (id, data) => api.patch(`/general-equipment/masters/${id}`, data),
  deleteMaster: (id) => api.delete(`/general-equipment/masters/${id}`),
  // 내 업체 보유장비
  getMyEquipments: (params) => api.get('/general-equipment/my', { params }),
  addMyEquipment: (data) => api.post('/general-equipment/my', data),
  // 특정 업체 보유장비
  getCompanyEquipments: (companyId, params) => api.get(`/general-equipment/company/${companyId}`, { params }),
  addCompanyEquipment: (companyId, data) => api.post(`/general-equipment/company/${companyId}`, data),
  // 보유장비 수정/삭제
  updateEquipment: (id, data) => api.patch(`/general-equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/general-equipment/${id}`),
  // 분석
  getAnalytics: (params) => api.get('/general-equipment/analytics', { params }),
}

// Company Profile API (협력사 프로필 관리)
export const companyProfileAPI = {
  // 비밀번호 변경
  changePassword: (data) => api.post('/company-profile/change-password', data),
  // GPS 좌표
  updateGPS: (data) => api.post('/company-profile/gps', data),
  // 담당자
  getContacts: () => api.get('/company-profile/contacts'),
  getCompanyContacts: (companyId) => api.get(`/company-profile/contacts/company/${companyId}`),
  addContact: (data) => api.post('/company-profile/contacts', data),
  updateContact: (id, data) => api.patch(`/company-profile/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/company-profile/contacts/${id}`),
  // 인증현황
  getCertifications: () => api.get('/company-profile/certifications'),
  getCompanyCertifications: (companyId) => api.get(`/company-profile/certifications/company/${companyId}`),
  addCertification: (data) => api.post('/company-profile/certifications', data),
  updateCertification: (id, data) => api.patch(`/company-profile/certifications/${id}`, data),
  deleteCertification: (id) => api.delete(`/company-profile/certifications/${id}`),
  // 임시저장 / 승인요청
  saveDraft: (data) => api.post('/company-profile/draft', data),
  submitForApproval: (data) => api.post('/company-profile/submit', data),
  // 관리자 승인/반려
  approveProfile: (companyId) => api.post(`/company-profile/approve/${companyId}`),
  rejectProfile: (companyId, data) => api.post(`/company-profile/reject/${companyId}`, data),
  // 사출기 톤수별 집계
  getTonnageSummary: () => api.get('/company-profile/tonnage-summary'),
  getCompanyTonnageSummary: (companyId) => api.get(`/company-profile/tonnage-summary/${companyId}`),
  // 장비 승인 (관리자)
  getPendingEquipments: () => api.get('/company-profile/pending-equipments'),
  approveEquipment: (id, data) => api.post(`/company-profile/approve-equipment/${id}`, data),
}

// Inspection Photo API (점검 사진 업로드/관리)
export const inspectionPhotoAPI = {
  // 사진 업로드 (카메라/갤러리)
  upload: (formData) => api.post('/inspection-photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // 금형별 사진 조회
  getByMold: (moldId, params) => api.get(`/inspection-photos/mold/${moldId}`, { params }),
  // 점검 항목별 사진 조회
  getByItem: (itemId, params) => api.get(`/inspection-photos/item/${itemId}`, { params }),
  // 점검 유형별 사진 조회
  getByType: (inspectionType, params) => api.get(`/inspection-photos/by-type/${inspectionType}`, { params }),
  // 수리요청 관련 사진 조회
  getByRepair: (repairRequestId) => api.get(`/inspection-photos/repair/${repairRequestId}`),
  // 엔티티별 사진 조회 (범용)
  getByEntity: (entityType, entityId) => api.get(`/inspection-photos/entity/${entityType}/${entityId}`),
  // 사진 상세 조회
  getById: (photoId) => api.get(`/inspection-photos/${photoId}`),
  // BYTEA 이미지 파일 URL
  getFileUrl: (photoId) => `/api/v1/inspection-photos/file/${photoId}`,
  // 사진 삭제 (soft delete)
  delete: (photoId) => api.delete(`/inspection-photos/${photoId}`),
  // 통계
  getStats: (params) => api.get('/inspection-photos/stats/summary', { params }),
}

// Mold Location API (금형 GPS 위치 추적/이력)
export const moldLocationAPI = {
  // 전체 금형 실시간 위치 조회
  getRealtime: (params) => api.get('/mold-locations/realtime', { params }),
  // 특정 금형 위치 이력
  getHistory: (moldId, params) => api.get(`/mold-locations/history/${moldId}`, { params }),
  // GPS 위치 수동 기록
  record: (data) => api.post('/mold-locations/record', data),
  // 기준 위치 설정 (관리자)
  setBase: (moldId, data) => api.put(`/mold-locations/base/${moldId}`, data),
  // 위치 이탈 금형 목록
  getDriftAlerts: () => api.get('/mold-locations/drift-alerts'),
  // GPS 위치 통계
  getStats: () => api.get('/mold-locations/stats'),
}

// User API (사용자 조회)
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getDevelopers: () => api.get('/users', { params: { role: 'developer' } }),
}

// User Management API (사용자 관리)
export const userManagementAPI = {
  // 사내 사용자
  getInternalUsers: (params) => api.get('/user-management/internal', { params }),
  createInternalUser: (data) => api.post('/user-management/internal', data),
  updateInternalUser: (id, data) => api.put(`/user-management/internal/${id}`, data),
  resetInternalPassword: (id) => api.post(`/user-management/internal/${id}/reset-password`),
  
  // 협력사 사용자
  getPartnerUsers: (params) => api.get('/user-management/partner', { params }),
  createPartnerUser: (data) => api.post('/user-management/partner', data),
  updatePartnerUser: (id, data) => api.put(`/user-management/partner/${id}`, data),
  resetPartnerPassword: (id) => api.post(`/user-management/partner/${id}/reset-password`),
  
  // 승인 관리
  getPendingApprovals: () => api.get('/user-management/approvals/pending'),
  approveUser: (id) => api.post(`/user-management/approvals/${id}/approve`),
  rejectUser: (id, reason) => api.post(`/user-management/approvals/${id}/reject`, { reason }),
  
  // 공통
  getPermissionClasses: () => api.get('/user-management/permission-classes'),
  getDepartments: () => api.get('/user-management/departments'),
  deleteUser: (id) => api.delete(`/user-management/${id}`),
}

// Checklist Master API (체크리스트 마스터 관리)
export const checklistMasterAPI = {
  // 마스터 버전
  getVersions: (params) => api.get('/checklist-masters', { params }),
  getVersionById: (id) => api.get(`/checklist-masters/${id}`),
  createVersion: (data) => api.post('/checklist-masters', data),
  updateVersion: (id, data) => api.patch(`/checklist-masters/${id}`, data),
  deleteVersion: (id) => api.delete(`/checklist-masters/${id}`),
  submitForReview: (id) => api.post(`/checklist-masters/${id}/submit-review`),
  approve: (id) => api.post(`/checklist-masters/${id}/approve`),
  deploy: (id) => api.post(`/checklist-masters/${id}/deploy`),
  clone: (id) => api.post(`/checklist-masters/${id}/clone`),
  getDeployed: (params) => api.get('/checklist-masters/deployed', { params }),
  
  // 점검항목
  getItems: (params) => api.get('/checklist-masters/items', { params }),
  createItem: (data) => api.post('/checklist-masters/items', data),
  updateItem: (id, data) => api.patch(`/checklist-masters/items/${id}`, data),
  deleteItem: (id) => api.delete(`/checklist-masters/items/${id}`),
  
  // 주기 코드
  getCycles: () => api.get('/checklist-masters/cycles'),
}

// Standard Document Template API (표준문서 마스터 관리)
export const standardDocumentAPI = {
  getAll: (params) => api.get('/standard-document-templates', { params }),
  getById: (id) => api.get(`/standard-document-templates/${id}`),
  create: (data) => api.post('/standard-document-templates', data),
  update: (id, data) => api.patch(`/standard-document-templates/${id}`, data),
  approve: (id) => api.post(`/standard-document-templates/${id}/approve`),
  deploy: (id, data) => api.post(`/standard-document-templates/${id}/deploy`, data),
  duplicate: (id, data) => api.post(`/standard-document-templates/${id}/duplicate`, data),
  delete: (id) => api.delete(`/standard-document-templates/${id}`),
}

// Development Plan API (금형개발계획 관리)
export const developmentPlanAPI = {
  // 개발계획 목록 조회
  getAll: (params) => api.get('/development/plans', { params }),
  // 개발계획 상세 조회
  getById: (planId) => api.get(`/development/plans/${planId}`),
  // 금형별 개발계획 조회
  getByMoldSpec: (moldSpecId) => api.get(`/development/mold-spec/${moldSpecId}`),
  // 개발계획 생성
  create: (data) => api.post('/development/plans', data),
  // 공정 단계 업데이트
  updateStep: (stepId, data) => api.patch(`/development/steps/${stepId}`, data),
  // 추진계획 항목 추가
  addStep: (planId, data) => api.post(`/development/plans/${planId}/steps`, data),
  // 추진계획 항목 삭제
  deleteStep: (planId, stepId) => api.delete(`/development/plans/${planId}/steps/${stepId}`),
  // 추진계획 항목 순서 변경
  reorderSteps: (planId, data) => api.put(`/development/plans/${planId}/steps/reorder`, data),
  // 기본 단계 마스터 목록 조회
  getDefaultSteps: () => api.get('/development/default-steps'),
  // 진행률 통계
  getProgressStatistics: () => api.get('/development/statistics/progress'),
}

// Inspection New API (통합 점검 시스템)
export const inspectionNewAPI = {
  // 점검 수행
  start: (data) => api.post('/inspections-new/start', data),
  getById: (id) => api.get(`/inspections-new/${id}`),
  saveDraft: (id, data) => api.patch(`/inspections-new/${id}/save-draft`, data),
  submit: (id, data) => api.post(`/inspections-new/${id}/submit`, data),
  
  // 점검 이력
  getHistory: (params) => api.get('/inspections-new', { params }),
  
  // 스케줄
  getDueSchedules: (params) => api.get('/inspections-new/schedules/due', { params }),
  getSchedules: (params) => api.get('/inspections-new/schedules', { params }),
  recalcSchedules: (params) => api.post('/inspections-new/schedules/recalc', null, { params }),
}

// Workflow API (승인 워크플로우)
export const workflowAPI = {
  // 금형개발 담당자 검색
  searchDevelopers: (params) => api.get('/workflow/developers/search', { params }),
  // 관리자(CAMS) 검색
  searchAdmins: (params) => api.get('/workflow/admins/search', { params }),
  // 제작처 검색
  searchMakers: (params) => api.get('/workflow/makers/search', { params }),
  // 생산처 검색
  searchPlants: (params) => api.get('/workflow/plants/search', { params }),
  // 수리요청 워크플로우
  createRepairRequest: (data) => api.post('/workflow/repair-requests', data),
  firstApprove: (id, data) => api.post(`/workflow/repair-requests/${id}/first-approve`, data),
  startRepair: (id, data) => api.post(`/workflow/repair-requests/${id}/start-repair`, data),
  completeRepair: (id, data) => api.post(`/workflow/repair-requests/${id}/complete-repair`, data),
  finalApprove: (id, data) => api.post(`/workflow/repair-requests/${id}/final-approve`, data),
  plantConfirm: (id, data) => api.post(`/workflow/repair-requests/${id}/plant-confirm`, data),
  reject: (id, data) => api.post(`/workflow/repair-requests/${id}/reject`, data),
  getRequests: (params) => api.get('/workflow/repair-requests', { params }),
}

// Notification API (알림) - alertAPI 통합
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  send: (data) => api.post('/notifications', data),
  trigger: (data) => api.post('/notifications/trigger', data),
}

// 하위호환: alertAPI → notificationAPI alias
export const alertAPI = notificationAPI

export default api
