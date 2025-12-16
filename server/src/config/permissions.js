/**
 * 사용자 유형별 권한 설정
 * 
 * 사용자 유형:
 * - system_admin: 시스템 관리자 (본사)
 * - mold_developer: 금형개발 담당 (본사)
 * - maker: 금형제작처 (협력사)
 * - plant: 생산처 (공장)
 */

const USER_TYPES = {
  SYSTEM_ADMIN: 'system_admin',
  MOLD_DEVELOPER: 'mold_developer',
  MAKER: 'maker',
  PLANT: 'plant'
};

// 모든 사용자 유형
const ALL_USERS = [
  USER_TYPES.SYSTEM_ADMIN,
  USER_TYPES.MOLD_DEVELOPER,
  USER_TYPES.MAKER,
  USER_TYPES.PLANT
];

// 본사 사용자 (시스템 관리자 + 금형개발)
const HQ_USERS = [
  USER_TYPES.SYSTEM_ADMIN,
  USER_TYPES.MOLD_DEVELOPER
];

// 관리자 전용
const ADMIN_ONLY = [
  USER_TYPES.SYSTEM_ADMIN
];

/**
 * API 권한 매핑
 * 각 API 경로에 대해 허용된 사용자 유형을 정의
 */
const API_PERMISSIONS = {
  // 금형 관리
  'GET /molds': ALL_USERS,
  'GET /molds/:id': ALL_USERS,
  'POST /molds': HQ_USERS,
  'PUT /molds/:id': HQ_USERS,
  'DELETE /molds/:id': ADMIN_ONLY,

  // 금형 사양
  'GET /mold-specifications': ALL_USERS,
  'GET /mold-specifications/:id': ALL_USERS,
  'POST /mold-specifications': HQ_USERS,
  'PUT /mold-specifications/:id': HQ_USERS,
  'DELETE /mold-specifications/:id': ADMIN_ONLY,

  // 일상점검
  'GET /daily-checks': ALL_USERS,
  'GET /daily-checks/:id': ALL_USERS,
  'POST /daily-checks': [USER_TYPES.PLANT, USER_TYPES.MAKER],
  'PUT /daily-checks/:id': [USER_TYPES.PLANT, USER_TYPES.MAKER],

  // 정기점검
  'GET /periodic-inspections': ALL_USERS,
  'GET /periodic-inspections/:id': ALL_USERS,
  'POST /periodic-inspections': [USER_TYPES.PLANT, USER_TYPES.MAKER],
  'PUT /periodic-inspections/:id': [USER_TYPES.PLANT, USER_TYPES.MAKER],
  'POST /periodic-inspections/:id/approve': HQ_USERS,
  'POST /periodic-inspections/:id/reject': HQ_USERS,

  // 수리 요청
  'GET /repair-requests': ALL_USERS,
  'GET /repair-requests/:id': ALL_USERS,
  'POST /repair-requests': [USER_TYPES.PLANT],
  'PUT /repair-requests/:id': [USER_TYPES.PLANT, USER_TYPES.MAKER],
  'POST /repair-requests/:id/accept': [USER_TYPES.MAKER],
  'POST /repair-requests/:id/complete': [USER_TYPES.MAKER],
  'POST /repair-requests/:id/confirm': [USER_TYPES.PLANT],

  // 이관 관리
  'GET /transfers': ALL_USERS,
  'GET /transfers/:id': ALL_USERS,
  'POST /transfers': [USER_TYPES.PLANT, USER_TYPES.MOLD_DEVELOPER],
  'POST /transfers/:id/approve': HQ_USERS,
  'POST /transfers/:id/reject': HQ_USERS,

  // 폐기 관리
  'GET /scrapping': ALL_USERS,
  'GET /scrapping/:id': ALL_USERS,
  'POST /scrapping': [USER_TYPES.PLANT, USER_TYPES.MOLD_DEVELOPER],
  'POST /scrapping/:id/first-approve': [USER_TYPES.MOLD_DEVELOPER],
  'POST /scrapping/:id/approve': ADMIN_ONLY,

  // 유지보전
  'GET /maintenance': ALL_USERS,
  'POST /maintenance': [USER_TYPES.PLANT, USER_TYPES.MAKER],

  // 알림
  'GET /alerts': ALL_USERS,
  'GET /notifications': ALL_USERS,
  'PATCH /notifications/:id/read': ALL_USERS,

  // 통계
  'GET /statistics': ALL_USERS,
  'GET /statistics/molds': ALL_USERS,
  'GET /statistics/inspections': ALL_USERS,

  // 대시보드
  'GET /dashboard/system-admin/kpis': ADMIN_ONLY,
  'GET /dashboard/developer/kpis': HQ_USERS,
  'GET /dashboard/plant/kpis': [USER_TYPES.PLANT],
  'GET /dashboard/maker/kpis': [USER_TYPES.MAKER],

  // 사용자 관리
  'GET /users': HQ_USERS,
  'POST /users': ADMIN_ONLY,
  'PUT /users/:id': ADMIN_ONLY,
  'DELETE /users/:id': ADMIN_ONLY,

  // 마스터 데이터
  'GET /master-data': ALL_USERS,
  'POST /master-data': ADMIN_ONLY,
  'PUT /master-data/:id': ADMIN_ONLY,
  'DELETE /master-data/:id': ADMIN_ONLY,

  // 회사 관리
  'GET /companies': ALL_USERS,
  'POST /companies': ADMIN_ONLY,
  'PUT /companies/:id': ADMIN_ONLY,

  // 리포트
  'GET /reports': ALL_USERS,
  'GET /reports/pdf': ALL_USERS,

  // 이메일/푸시
  'POST /email/test': ADMIN_ONLY,
  'POST /push/send': ADMIN_ONLY,

  // 캐시 관리
  'GET /cache/stats': ADMIN_ONLY,
  'POST /cache/clear': ADMIN_ONLY
};

/**
 * 메뉴 권한 매핑 (프론트엔드용)
 */
const MENU_PERMISSIONS = {
  // 대시보드
  dashboard: ALL_USERS,
  
  // 금형 관리
  molds: ALL_USERS,
  moldRegistration: HQ_USERS,
  moldSpecifications: ALL_USERS,
  
  // 점검 관리
  dailyChecks: ALL_USERS,
  periodicInspections: ALL_USERS,
  inspectionApproval: HQ_USERS,
  
  // 수리 관리
  repairRequests: ALL_USERS,
  repairManagement: [USER_TYPES.MAKER, ...HQ_USERS],
  
  // 이관/폐기
  transfers: ALL_USERS,
  scrapping: ALL_USERS,
  
  // 유지보전
  maintenance: ALL_USERS,
  
  // 알림
  alerts: ALL_USERS,
  notificationSettings: ALL_USERS,
  
  // 통계/리포트
  statistics: ALL_USERS,
  reports: ALL_USERS,
  
  // 관리자 메뉴
  userManagement: ADMIN_ONLY,
  masterData: ADMIN_ONLY,
  companyManagement: ADMIN_ONLY,
  systemSettings: ADMIN_ONLY
};

/**
 * 사용자 유형에 따른 허용 메뉴 목록 반환
 */
const getMenusForUserType = (userType) => {
  const allowedMenus = [];
  
  for (const [menu, allowedTypes] of Object.entries(MENU_PERMISSIONS)) {
    if (allowedTypes.includes(userType)) {
      allowedMenus.push(menu);
    }
  }
  
  return allowedMenus;
};

/**
 * API 권한 체크
 */
const checkApiPermission = (method, path, userType) => {
  const key = `${method} ${path}`;
  const allowedTypes = API_PERMISSIONS[key];
  
  if (!allowedTypes) {
    // 권한 정의가 없으면 기본적으로 허용 (개발 중)
    return true;
  }
  
  return allowedTypes.includes(userType);
};

module.exports = {
  USER_TYPES,
  ALL_USERS,
  HQ_USERS,
  ADMIN_ONLY,
  API_PERMISSIONS,
  MENU_PERMISSIONS,
  getMenusForUserType,
  checkApiPermission
};
