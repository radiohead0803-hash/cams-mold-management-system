// 금형 페이지 메뉴 구조 및 역할별 권한 정의

export type UserRole = 'developer' | 'maker' | 'production' | 'plant' | 'hq';

export interface MoldMenuItem {
  id: string;
  label: string;
  path: string;
  allowedRoles: UserRole[];
}

export interface MoldMenuGroup {
  id: string;
  label: string;
  items: MoldMenuItem[];
  allowedRoles: UserRole[];
}

export const MOLD_MENU_GROUPS: MoldMenuGroup[] = [
  // 1) 금형정보
  {
    id: 'mold-info',
    label: '금형정보',
    allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
    items: [
      {
        id: 'basic',
        label: '금형정보',
        path: 'info/basic',
        allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
      },
      {
        id: 'conditions',
        label: '사출조건 관리',
        path: 'info/conditions',
        allowedRoles: ['developer', 'production', 'plant'],
      },
      {
        id: 'spec',
        label: '금형사양',
        path: 'info/spec',
        allowedRoles: ['developer', 'maker', 'hq'],
      },
      {
        id: 'change-log',
        label: '변경이력 한눈에',
        path: 'info/change-log',
        allowedRoles: ['developer', 'hq'],
      },
    ],
  },

  // 2) 사용정보
  {
    id: 'usage',
    label: '사용정보',
    allowedRoles: ['production', 'plant', 'hq'],
    items: [
      {
        id: 'usage-dashboard',
        label: '사용정보',
        path: 'usage/overview',
        allowedRoles: ['production', 'plant', 'hq'],
      },
      {
        id: 'shot-history',
        label: '샷수/주기 관리',
        path: 'usage/shots',
        allowedRoles: ['production', 'plant'],
      },
      {
        id: 'alarm-history',
        label: '알림 이력',
        path: 'usage/alarms',
        allowedRoles: ['production', 'plant', 'hq'],
      },
    ],
  },

  // 3) 금형수리
  {
    id: 'repair',
    label: '금형수리',
    allowedRoles: ['developer', 'production', 'plant', 'hq'],
    items: [
      {
        id: 'req',
        label: '수리요청',
        path: 'repair/requests',
        allowedRoles: ['production', 'plant'],
      },
      {
        id: 'progress',
        label: '금형수리 진행현황',
        path: 'repair/progress',
        allowedRoles: ['developer', 'production', 'plant', 'hq'],
      },
      {
        id: 'history',
        label: '금형수리 히스토리',
        path: 'repair/history',
        allowedRoles: ['developer', 'production', 'plant', 'hq'],
      },
    ],
  },

  // 4) 금형점검
  {
    id: 'check',
    label: '금형점검',
    allowedRoles: ['maker', 'production', 'plant'],
    items: [
      {
        id: 'daily',
        label: '일상점검',
        path: 'check/daily',
        allowedRoles: ['maker', 'production', 'plant'],
      },
      {
        id: 'regular',
        label: '정기점검',
        path: 'check/regular',
        allowedRoles: ['maker', 'production', 'plant'],
      },
      {
        id: 'move',
        label: '이관점검',
        path: 'check/transfer',
        allowedRoles: ['maker', 'production', 'plant'],
      },
      {
        id: 'checklist',
        label: '이관 체크리스트',
        path: 'check/transfer-checklist',
        allowedRoles: ['maker', 'production', 'plant'],
      },
      {
        id: 'approve',
        label: '승인',
        path: 'check/approval',
        allowedRoles: ['developer', 'hq'],
      },
    ],
  },

  // 5) 금형이력
  {
    id: 'history',
    label: '금형이력',
    allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
    items: [
      {
        id: 'timeline',
        label: '타임라인',
        path: 'history/timeline',
        allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
      },
      {
        id: 'logs',
        label: '로그 상세',
        path: 'history/logs',
        allowedRoles: ['developer', 'hq'],
      },
    ],
  },

  // 6) 내 정보
  {
    id: 'profile',
    label: '내 정보',
    allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
    items: [
      {
        id: 'profile-basic',
        label: '내 정보',
        path: 'profile/basic',
        allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
      },
      {
        id: 'notification',
        label: '알림 설정',
        path: 'profile/notifications',
        allowedRoles: ['developer', 'maker', 'production', 'plant', 'hq'],
      },
    ],
  },
];
