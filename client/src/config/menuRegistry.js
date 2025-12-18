/**
 * 메뉴 레지스트리 - 단일 소스 관리
 * 모든 메뉴 항목과 라우트를 중앙에서 관리
 */
import { 
  Home, Package, ClipboardList, Bell, Settings, FileText, 
  Wrench, Users, BarChart3, CheckSquare, Truck, QrCode, 
  Building2, Trash2, Cog, FileCheck, MapPin, Shield,
  AlertTriangle, Activity, Search, Inbox
} from 'lucide-react';

/**
 * 사용자 역할 정의
 */
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  MOLD_DEVELOPER: 'mold_developer',
  MAKER: 'maker',
  PLANT: 'plant'
};

/**
 * 대시보드 경로 매핑 (문서 기준 통일)
 */
export const DASHBOARD_ROUTES = {
  [USER_ROLES.SYSTEM_ADMIN]: '/dashboard/system-admin',
  [USER_ROLES.MOLD_DEVELOPER]: '/dashboard/mold-developer',
  [USER_ROLES.MAKER]: '/dashboard/maker',
  [USER_ROLES.PLANT]: '/dashboard/plant'
};

/**
 * 시스템 관리자 메뉴 구성
 */
export const SYSTEM_ADMIN_MENU = [
  {
    key: 'dashboard',
    label: '대시보드',
    path: '/dashboard/system-admin',
    icon: Home,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    subMenus: []
  },
  {
    key: 'approvals',
    label: '승인함',
    path: '/dashboard/system-admin/approvals',
    icon: Inbox,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    badge: 'pendingApprovals',
    subMenus: [
      { key: 'approvals-all', label: '전체 승인 대기', path: '/dashboard/system-admin/approvals' },
      { key: 'approvals-checklist', label: '체크리스트 승인', path: '/dashboard/system-admin/approvals?type=checklist' },
      { key: 'approvals-document', label: '문서 배포 승인', path: '/dashboard/system-admin/approvals?type=document' },
      { key: 'approvals-transfer', label: '이관 승인', path: '/dashboard/system-admin/approvals?type=transfer' },
      { key: 'approvals-scrapping', label: '폐기 승인', path: '/dashboard/system-admin/approvals?type=scrapping' }
    ]
  },
  {
    key: 'risk-monitor',
    label: '운영 모니터링',
    path: '/dashboard/system-admin/risk-monitor',
    icon: AlertTriangle,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    subMenus: [
      { key: 'risk-overview', label: '리스크 현황', path: '/dashboard/system-admin/risk-monitor' },
      { key: 'gps-tracking', label: 'GPS 추적', path: '/mold-location-map' },
      { key: 'activity-log', label: '감사 로그', path: '/dashboard/system-admin/audit-logs' }
    ]
  },
  {
    key: 'molds',
    label: '금형 관리',
    path: '/molds',
    icon: Package,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'molds-list', label: '금형 현황', path: '/molds' },
      { key: 'molds-new', label: '금형 등록', path: '/molds/new' },
      { key: 'molds-bulk', label: '일괄 등록', path: '/molds/bulk-upload' },
      { key: 'molds-lifecycle', label: '개발 진행현황', path: '/molds/lifecycle' },
      { key: 'molds-history', label: '금형 이력', path: '/mold-history' }
    ]
  },
  {
    key: 'masters',
    label: '마스터 관리',
    path: '/dashboard/system-admin/masters',
    icon: Settings,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    subMenus: [
      { key: 'masters-checklist', label: '점검표 템플릿', path: '/checklist-master' },
      { key: 'masters-document', label: '표준문서 마스터', path: '/pre-production-checklist' },
      { key: 'masters-transfer', label: '이관 체크리스트', path: '/production-transfer/checklist-master' },
      { key: 'master-data', label: '기초정보 관리', path: '/master-data' }
    ]
  },
  {
    key: 'rules',
    label: '규칙/기준값',
    path: '/dashboard/system-admin/rules',
    icon: Shield,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    subMenus: [
      { key: 'rules-threshold', label: '기준값 관리', path: '/dashboard/system-admin/rules' },
      { key: 'rules-notification', label: '알림 규칙', path: '/dashboard/system-admin/rules/notifications' }
    ]
  },
  {
    key: 'workflow',
    label: '통합관리',
    path: '/workflow',
    icon: Wrench,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'workflow-all', label: '전체 현황', path: '/workflow' },
      { key: 'workflow-repair', label: '수리 관리', path: '/workflow?tab=repair' },
      { key: 'workflow-transfer', label: '이관 관리', path: '/workflow?tab=transfer' },
      { key: 'workflow-scrapping', label: '금형 폐기', path: '/workflow?tab=scrapping' }
    ]
  },
  {
    key: 'maintenance',
    label: '유지보전',
    path: '/maintenance',
    icon: Cog,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'maintenance-list', label: '유지보전 기록', path: '/maintenance' }
    ]
  },
  {
    key: 'users',
    label: '사용자 관리',
    path: '/dashboard/system-admin/users',
    icon: Users,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    subMenus: [
      { key: 'users-internal', label: '사내 사용자', path: '/users/internal' },
      { key: 'users-partner', label: '협력사 사용자', path: '/users/partner' },
      { key: 'users-requests', label: '계정 요청', path: '/user-requests' },
      { key: 'companies-list', label: '업체 목록', path: '/companies' },
      { key: 'companies-maker', label: '제작처 관리', path: '/companies?type=maker' },
      { key: 'companies-plant', label: '생산처 관리', path: '/companies?type=plant' }
    ]
  },
  {
    key: 'reports',
    label: '통계 리포트',
    path: '/reports',
    icon: BarChart3,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'reports-overview', label: '전체 현황', path: '/reports' },
      { key: 'reports-molds', label: '금형 통계', path: '/reports/molds' }
    ]
  },
  {
    key: 'audit',
    label: '감사 로그',
    path: '/dashboard/system-admin/audit-logs',
    icon: Activity,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    subMenus: []
  },
  {
    key: 'notifications',
    label: '알림',
    path: '/dashboard/system-admin/notifications',
    icon: Bell,
    allowedRoles: [USER_ROLES.SYSTEM_ADMIN],
    badge: 'unreadNotifications',
    subMenus: [
      { key: 'notifications-center', label: '알림 센터', path: '/dashboard/system-admin/notifications' },
      { key: 'notifications-list', label: '알림 목록', path: '/alerts' },
      { key: 'notifications-settings', label: '알림 설정', path: '/notification-settings' }
    ]
  }
];

/**
 * 금형개발 담당 메뉴 구성
 */
export const MOLD_DEVELOPER_MENU = [
  {
    key: 'dashboard',
    label: '대시보드',
    path: '/dashboard/mold-developer',
    icon: Home,
    allowedRoles: [USER_ROLES.MOLD_DEVELOPER],
    subMenus: []
  },
  {
    key: 'molds',
    label: '금형 관리',
    path: '/molds',
    icon: Package,
    allowedRoles: [USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'molds-list', label: '금형 현황', path: '/molds' },
      { key: 'molds-new', label: '금형 등록', path: '/molds/new' },
      { key: 'molds-lifecycle', label: '개발 진행현황', path: '/molds/lifecycle' }
    ]
  },
  {
    key: 'approvals',
    label: '승인 및 검토',
    path: '/inspection-approval',
    icon: CheckSquare,
    allowedRoles: [USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'approvals-inspection', label: '점검 승인', path: '/inspection-approval' }
    ]
  },
  {
    key: 'workflow',
    label: '통합관리',
    path: '/workflow',
    icon: Wrench,
    allowedRoles: [USER_ROLES.MOLD_DEVELOPER],
    subMenus: [
      { key: 'workflow-all', label: '전체 현황', path: '/workflow' },
      { key: 'workflow-repair', label: '수리 관리', path: '/workflow?tab=repair' },
      { key: 'workflow-transfer', label: '이관 관리', path: '/workflow?tab=transfer' },
      { key: 'workflow-scrapping', label: '금형 폐기', path: '/workflow?tab=scrapping' }
    ]
  },
  {
    key: 'reports',
    label: '통계 리포트',
    path: '/reports',
    icon: BarChart3,
    allowedRoles: [USER_ROLES.MOLD_DEVELOPER],
    subMenus: []
  },
  {
    key: 'notifications',
    label: '알림',
    path: '/alerts',
    icon: Bell,
    allowedRoles: [USER_ROLES.MOLD_DEVELOPER],
    subMenus: []
  }
];

/**
 * 제작처 메뉴 구성
 */
export const MAKER_MENU = [
  {
    key: 'dashboard',
    label: '대시보드',
    path: '/dashboard/maker',
    icon: Home,
    allowedRoles: [USER_ROLES.MAKER],
    subMenus: []
  },
  {
    key: 'molds',
    label: '금형 현황',
    path: '/molds',
    icon: Package,
    allowedRoles: [USER_ROLES.MAKER],
    subMenus: []
  },
  {
    key: 'repairs',
    label: '수리 관리',
    path: '/maker/repair-requests',
    icon: Wrench,
    allowedRoles: [USER_ROLES.MAKER],
    subMenus: []
  },
  {
    key: 'checklist',
    label: '체크리스트',
    path: '/pre-production-checklist',
    icon: FileCheck,
    allowedRoles: [USER_ROLES.MAKER],
    subMenus: []
  },
  {
    key: 'notifications',
    label: '알림',
    path: '/alerts',
    icon: Bell,
    allowedRoles: [USER_ROLES.MAKER],
    subMenus: []
  }
];

/**
 * 생산처 메뉴 구성
 */
export const PLANT_MENU = [
  {
    key: 'dashboard',
    label: '대시보드',
    path: '/dashboard/plant',
    icon: Home,
    allowedRoles: [USER_ROLES.PLANT],
    subMenus: []
  },
  {
    key: 'molds',
    label: '금형 현황',
    path: '/molds',
    icon: Package,
    allowedRoles: [USER_ROLES.PLANT],
    subMenus: []
  },
  {
    key: 'inspections',
    label: '점검 관리',
    path: '/checklist/daily',
    icon: ClipboardList,
    allowedRoles: [USER_ROLES.PLANT],
    subMenus: [
      { key: 'inspection-daily', label: '일상점검', path: '/checklist/daily' },
      { key: 'inspection-periodic', label: '정기점검', path: '/inspection/periodic' }
    ]
  },
  {
    key: 'repairs',
    label: '수리 요청',
    path: '/repair-request-form',
    icon: Wrench,
    allowedRoles: [USER_ROLES.PLANT],
    subMenus: []
  },
  {
    key: 'transfers',
    label: '이관 관리',
    path: '/transfers',
    icon: Truck,
    allowedRoles: [USER_ROLES.PLANT],
    subMenus: []
  },
  {
    key: 'notifications',
    label: '알림',
    path: '/alerts',
    icon: Bell,
    allowedRoles: [USER_ROLES.PLANT],
    subMenus: []
  }
];

/**
 * 역할별 메뉴 가져오기
 */
export function getMenuByRole(userType) {
  switch (userType) {
    case USER_ROLES.SYSTEM_ADMIN:
      return SYSTEM_ADMIN_MENU;
    case USER_ROLES.MOLD_DEVELOPER:
      return MOLD_DEVELOPER_MENU;
    case USER_ROLES.MAKER:
      return MAKER_MENU;
    case USER_ROLES.PLANT:
      return PLANT_MENU;
    default:
      return [];
  }
}

/**
 * 역할별 대시보드 경로 가져오기
 */
export function getDashboardPath(userType) {
  return DASHBOARD_ROUTES[userType] || '/';
}

/**
 * 헤더 메뉴 (전역 - 모든 역할 공통)
 */
export const HEADER_MENU = {
  search: { key: 'search', label: '검색', icon: Search },
  notifications: { key: 'notifications', label: '알림', icon: Bell, path: '/alerts' },
  settings: { key: 'settings', label: '설정', icon: Settings }
};

/**
 * 등록된 모든 라우트 목록 (검증용)
 */
export const REGISTERED_ROUTES = [
  '/',
  '/dashboard/system-admin',
  '/dashboard/system-admin/approvals',
  '/dashboard/system-admin/risk-monitor',
  '/dashboard/system-admin/notifications',
  '/dashboard/system-admin/rules',
  '/dashboard/system-admin/users',
  '/dashboard/system-admin/audit-logs',
  '/dashboard/mold-developer',
  '/dashboard/maker',
  '/dashboard/plant',
  '/molds',
  '/molds/new',
  '/molds/bulk-upload',
  '/molds/lifecycle',
  '/molds/master',
  '/mold-history',
  '/checklist/daily',
  '/inspection/periodic',
  '/checklist-master',
  '/pre-production-checklist',
  '/production-transfer/checklist-master',
  '/master-data',
  '/repairs',
  '/hq/repair-requests',
  '/maker/repair-requests',
  '/maker/mold',
  '/repair-request-form',
  '/transfers',
  '/transfers/new',
  '/maintenance',
  '/scrapping',
  '/workflow',
  '/companies',
  '/users/internal',
  '/users/partner',
  '/user-requests',
  '/reports',
  '/alerts',
  '/notification-settings',
  '/inspection-approval',
  '/qr-sessions',
  '/mold-location-map'
];

/**
 * 라우트 존재 여부 검증
 */
export function isRouteRegistered(path) {
  const basePath = path.split('?')[0];
  return REGISTERED_ROUTES.some(route => 
    basePath === route || basePath.startsWith(route + '/')
  );
}
