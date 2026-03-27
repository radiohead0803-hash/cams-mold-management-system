import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, ClipboardCheck, Wrench, Trash2, FileCheck,
  Bell, QrCode, Settings, ChevronRight, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, Cog, BarChart3, MapPin, History, List,
  Clock, RefreshCw, Building2, FileText, GitBranch, Users, Inbox, LifeBuoy,
  Factory, Shield, Hammer, Eye, Truck, Activity, Layers, Box,
  PlayCircle, PauseCircle, CheckSquare, XCircle, ArrowRightCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { BottomNav } from '../../components/mobile/MobileLayout';
import { recentActions } from '../../utils/mobileStorage';
import useOfflineSync, { SyncStatus } from '../../hooks/useOfflineSync.jsx';
import MoldLocationLookup from '../../components/mobile/MoldLocationLookup';
import useAuthRestore from '../../hooks/useAuthRestore';

// ─── Skeleton Loader ───
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[120px] bg-white rounded-2xl shadow-sm border border-gray-100 p-3 animate-pulse">
    <div className="w-10 h-10 bg-gray-200 rounded-xl mx-auto mb-2" />
    <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1" />
    <div className="h-3 bg-gray-100 rounded w-16 mx-auto" />
  </div>
);

const SkeletonRow = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    ))}
  </div>
);

// ─── KPI Card ───
const KpiCard = ({ icon: Icon, value, label, color, onClick }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    cyan: 'text-cyan-600 bg-cyan-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[120px] bg-white rounded-2xl shadow-sm border border-gray-100 p-3 active:scale-95 transition-transform"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${colors[color] || colors.blue}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-gray-900 text-center">{value ?? '-'}</div>
      <div className="text-[11px] text-gray-500 text-center mt-0.5 leading-tight">{label}</div>
    </button>
  );
};

// ─── Quick Action Button ───
const QuickActionBtn = ({ icon: Icon, label, color, onClick, badge }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center relative active:scale-95 transition-transform"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1.5 ${colors[color] || colors.blue}`}>
        <Icon size={22} />
      </div>
      <span className="text-xs text-gray-700 font-medium leading-tight text-center">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

// ─── Mini Status Card ───
const MiniStatusCard = ({ icon: Icon, title, value, color, onClick }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <button
      onClick={onClick}
      className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color] || colors.blue}`}>
        <Icon size={18} />
      </div>
      <div className="text-xl font-bold text-gray-900">{value ?? 0}</div>
      <div className="text-xs text-gray-500 mt-0.5">{title}</div>
    </button>
  );
};

// ─── Progress Item (for maker) ───
const ProgressItem = ({ name, code, status, progress }) => {
  const statusColors = {
    design: 'bg-blue-100 text-blue-700',
    manufacturing: 'bg-orange-100 text-orange-700',
    assembly: 'bg-purple-100 text-purple-700',
    inspection_pending: 'bg-green-100 text-green-700',
    in_development: 'bg-cyan-100 text-cyan-700',
  };
  const statusLabels = {
    design: '설계',
    manufacturing: '가공',
    assembly: '조립',
    inspection_pending: '시운전대기',
    in_development: '개발중',
    draft: '초안',
    planning: '기획',
  };

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">{name || code}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabels[status] || status}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{code}</div>
      </div>
      <div className="w-20">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-400 text-right mt-0.5">{progress || 0}%</div>
      </div>
    </div>
  );
};

// ─── Activity Item ───
const ActivityItem = ({ icon: Icon, title, description, time, color }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color] || colors.blue}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 truncate">{description}</div>
      </div>
      <span className="text-[11px] text-gray-400 flex-shrink-0">{getRelativeTime(time)}</span>
    </div>
  );
};

// ─── Role-based Config ───
function getKpiConfig(role, summary) {
  switch (role) {
    case 'system_admin':
      return [
        { icon: Package, label: '전체 금형', value: summary?.totalMolds, color: 'blue', path: '/mobile/molds' },
        { icon: Factory, label: '양산 중', value: summary?.activeMolds, color: 'green', path: '/mobile/molds?status=active' },
        { icon: Wrench, label: '진행 수리', value: summary?.pendingRepairs, color: 'orange', path: '/mobile/repair-request' },
        { icon: QrCode, label: '오늘 스캔', value: summary?.todayScans, color: 'cyan', path: '/mobile/qr-sessions' },
        { icon: AlertTriangle, label: '타수 초과', value: summary?.ngMolds, color: 'red', path: '/mobile/molds?status=ng' },
        { icon: Calendar, label: '정기검사', value: summary?.inspectionDue, color: 'purple', path: '/mobile/periodic-check' },
      ];
    case 'mold_developer':
      return [
        { icon: Layers, label: '개발', value: summary?.developingMolds, color: 'blue', path: '/mobile/molds?status=developing' },
        { icon: Hammer, label: '제작', value: summary?.totalMolds, color: 'orange', path: '/mobile/molds' },
        { icon: Factory, label: '양산', value: summary?.activeMolds, color: 'green', path: '/mobile/molds?status=active' },
        { icon: Trash2, label: '폐기대상', value: summary?.ngMolds, color: 'red', path: '/mobile/scrapping' },
        { icon: FileCheck, label: '설계승인 대기', value: summary?.pendingApprovals, color: 'purple', path: '/mobile/approval-inbox' },
        { icon: Shield, label: '수리귀책 대기', value: summary?.pendingRepairs, color: 'amber', path: '/mobile/repair-request' },
      ];
    case 'maker':
      return [
        { icon: PlayCircle, label: '진행 중', value: summary?.inProduction, color: 'blue', path: '/mobile/maker/repair-requests' },
        { icon: FileText, label: '설계', value: summary?.assignedMolds, color: 'indigo', path: '/mobile/molds' },
        { icon: Cog, label: '가공', value: summary?.repairRequests, color: 'orange', path: '/mobile/maker/repair-requests' },
        { icon: Box, label: '조립', value: summary?.repairInProgress, color: 'purple', path: '/mobile/maker/repair-requests' },
        { icon: Eye, label: '시운전대기', value: summary?.pendingInspection, color: 'cyan', path: '/mobile/maker/repair-requests' },
        { icon: CheckCircle, label: '완료', value: summary?.todayCompleted, color: 'green', path: '/mobile/maker/repair-requests' },
      ];
    case 'plant':
      return [
        { icon: Package, label: '배치 금형', value: summary?.totalMolds, color: 'blue', path: '/mobile/molds' },
        { icon: Factory, label: '가동 중', value: summary?.activeMolds, color: 'green', path: '/mobile/molds?status=active' },
        { icon: ClipboardCheck, label: '오늘 점검', value: summary?.todayChecks, color: 'cyan', path: '/mobile/plant/select-mold/daily-check' },
        { icon: Wrench, label: '수리 대기', value: summary?.pendingRepairs, color: 'orange', path: '/mobile/plant/select-mold/repair-request' },
        { icon: TrendingUp, label: '오늘 생산', value: summary?.todayProduction, color: 'purple', path: '/mobile/reports' },
        { icon: QrCode, label: 'QR 스캔', value: summary?.todayScans, color: 'indigo', path: '/mobile/qr-login' },
      ];
    default:
      return [];
  }
}

function getQuickActions(role, unreadAlerts) {
  const actions = {
    system_admin: [
      { icon: Users, label: '사용자관리', color: 'blue', path: '/mobile/user-requests' },
      { icon: List, label: '금형목록', color: 'blue', path: '/mobile/molds' },
      { icon: Inbox, label: '승인처리', color: 'red', path: '/mobile/approval-inbox' },
      { icon: BarChart3, label: '통계리포트', color: 'purple', path: '/mobile/reports' },
      { icon: MapPin, label: '금형위치', color: 'cyan', action: 'locationLookup' },
      { icon: Building2, label: '업체관리', color: 'orange', path: '/mobile/companies' },
      { icon: Settings, label: '시스템설정', color: 'gray', path: '/mobile/settings/notifications' },
      { icon: Bell, label: '알림', color: 'orange', path: '/mobile/alerts', badge: unreadAlerts },
    ],
    mold_developer: [
      { icon: Package, label: '금형등록', color: 'blue', path: '/mobile/molds' },
      { icon: Inbox, label: '승인처리', color: 'red', path: '/mobile/approval-inbox' },
      { icon: Building2, label: '업체관리', color: 'orange', path: '/mobile/companies' },
      { icon: BarChart3, label: '통계리포트', color: 'purple', path: '/mobile/reports' },
      { icon: MapPin, label: '금형위치', color: 'cyan', action: 'locationLookup' },
      { icon: ClipboardCheck, label: '체크리스트', color: 'green', path: '/mobile/pre-production-checklist' },
      { icon: GitBranch, label: '워크플로우', color: 'indigo', path: '/mobile/workflow' },
      { icon: Bell, label: '알림', color: 'orange', path: '/mobile/alerts', badge: unreadAlerts },
    ],
    maker: [
      { icon: QrCode, label: 'QR스캔', color: 'blue', path: '/mobile/qr-login' },
      { icon: List, label: '금형목록', color: 'blue', path: '/mobile/molds' },
      { icon: Wrench, label: '수리요청', color: 'red', path: '/mobile/plant/select-mold/repair-request' },
      { icon: Truck, label: '출하체크', color: 'green', path: '/mobile/pre-production-checklist' },
      { icon: ClipboardCheck, label: '일상점검', color: 'green', path: '/mobile/plant/select-mold/daily-check' },
      { icon: Calendar, label: '정기점검', color: 'purple', path: '/mobile/plant/select-mold/periodic-check' },
      { icon: BarChart3, label: '통계', color: 'cyan', path: '/mobile/reports' },
      { icon: Bell, label: '알림', color: 'orange', path: '/mobile/alerts', badge: unreadAlerts },
    ],
    plant: [
      { icon: QrCode, label: 'QR스캔', color: 'blue', path: '/mobile/qr-login' },
      { icon: ClipboardCheck, label: '일상점검', color: 'green', path: '/mobile/plant/select-mold/daily-check' },
      { icon: Calendar, label: '정기점검', color: 'purple', path: '/mobile/plant/select-mold/periodic-check' },
      { icon: Wrench, label: '수리요청', color: 'red', path: '/mobile/plant/select-mold/repair-request' },
      { icon: Cog, label: '유지보전', color: 'orange', path: '/mobile/maintenance' },
      { icon: List, label: '금형목록', color: 'blue', path: '/mobile/molds' },
      { icon: BarChart3, label: '통계', color: 'cyan', path: '/mobile/reports' },
      { icon: Bell, label: '알림', color: 'orange', path: '/mobile/alerts', badge: unreadAlerts },
    ],
  };
  return actions[role] || actions.plant;
}

function getManagementConfig(role) {
  switch (role) {
    case 'system_admin':
      return {
        title: '관리 현황',
        cards: [
          { key: 'repairs', icon: Wrench, title: '수리현황', color: 'orange' },
          { key: 'transfers', icon: ArrowRightCircle, title: '이관현황', color: 'blue' },
          { key: 'scrapping', icon: Trash2, title: '폐기현황', color: 'red' },
        ],
      };
    case 'mold_developer':
      return {
        title: '관리 현황',
        cards: [
          { key: 'checklist', icon: ClipboardCheck, title: '제작전 체크리스트', color: 'green' },
          { key: 'maintenance', icon: Cog, title: '유지보전', color: 'orange' },
          { key: 'scrapping', icon: Trash2, title: '폐기관리', color: 'red' },
        ],
      };
    case 'maker':
      return { title: '제작 진행현황', type: 'progress' };
    case 'plant':
      return { title: '오늘의 점검 현황', type: 'inspection' };
    default:
      return { title: '현황', cards: [] };
  }
}

function mapRoleToApiParam(role) {
  const roleMap = {
    system_admin: 'system_admin',
    mold_developer: 'developer',
    maker: 'maker',
    plant: 'plant',
  };
  return roleMap[role] || role;
}

/**
 * Transform role-specific API lists into a unified recentActivities array.
 */
function mapApiToActivities(data, role) {
  if (!data) return [];
  const activities = [];

  // Developer / system_admin: recentAlerts + recentMolds
  if (data.recentAlerts?.length) {
    data.recentAlerts.forEach((a) => {
      activities.push({
        id: `alert-${a.id}`,
        type: a.priority === 'high' ? 'repair' : 'default',
        description: a.message || a.title || '알림',
        moldNumber: a.title || '',
        timestamp: a.created_at,
      });
    });
  }
  if (data.recentMolds?.length) {
    data.recentMolds.forEach((m) => {
      activities.push({
        id: `mold-${m.id}`,
        type: 'default',
        description: `${m.part_name || m.mold_code} ${m.status || ''}`,
        moldNumber: m.mold_code || '',
        timestamp: m.updated_at,
      });
    });
  }

  // Maker: recentWorks
  if (data.recentWorks?.length) {
    data.recentWorks.forEach((w) => {
      activities.push({
        id: `work-${w.id}`,
        type: 'repair',
        description: `${w.mold?.mold_name || w.mold?.mold_code || ''} 수리 ${w.status || ''}`,
        moldNumber: w.mold?.mold_code || '',
        timestamp: w.updated_at,
      });
    });
  }

  // Plant: recentChecks
  if (data.recentChecks?.length) {
    data.recentChecks.forEach((c) => {
      activities.push({
        id: `check-${c.id}`,
        type: 'check',
        description: `${c.mold?.mold_name || c.mold?.mold_code || ''} 일상점검`,
        moldNumber: c.mold?.mold_code || '',
        timestamp: c.created_at,
      });
    });
  }

  // Sort by timestamp descending and take top 5
  return activities
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 5);
}

// ─── Main Component ───
export default function MobileHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role || 'plant';

  const [dashboardData, setDashboardData] = useState(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLocationLookup, setShowLocationLookup] = useState(false);

  // Pull-to-refresh
  const scrollRef = useRef(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 80;

  const { online, syncing, pendingCount, processQueue } = useOfflineSync();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const apiRole = mapRoleToApiParam(role);

      const [dashRes, alertsRes] = await Promise.all([
        api.get(`/mobile/dashboard/${apiRole}`).catch((err) => {
          console.error('Dashboard API failed:', err);
          return { data: { success: false } };
        }),
        api.get('/alerts', { params: { is_read: false, limit: 1 } }).catch(() => ({
          data: { data: { total: 0 } },
        })),
      ]);

      if (dashRes.data?.success && dashRes.data.data) {
        const apiData = dashRes.data.data;
        setDashboardData(apiData);

        // Build recent activities from API response, then supplement with local storage
        const apiActivities = mapApiToActivities(apiData, role);
        try {
          const localActions = await recentActions.getAll(5).catch(() => []);
          // Merge: API activities first, then local, deduplicate by id, cap at 5
          const seen = new Set();
          const merged = [];
          [...apiActivities, ...localActions].forEach((a) => {
            const key = a.id || `${a.timestamp}-${a.description}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(a);
            }
          });
          setRecentActivities(merged.slice(0, 5));
        } catch {
          setRecentActivities(apiActivities);
        }
      } else {
        // API failed — use local storage activities as fallback
        try {
          const localActions = await recentActions.getAll(5).catch(() => []);
          setRecentActivities(localActions);
        } catch { /* ignore */ }
      }

      setUnreadAlerts(alertsRes.data?.data?.total || 0);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Fallback: try local storage for activities
      try {
        const localActions = await recentActions.getAll(5).catch(() => []);
        setRecentActivities(localActions);
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAuthRestore(() => {
    loadData();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Pull-to-refresh handlers
  const onTouchStart = (e) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e) => {
    if (scrollRef.current?.scrollTop > 0) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, 120));
    }
  };

  const onTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  const summary = dashboardData?.kpi || dashboardData?.summary || {};
  const kpiItems = getKpiConfig(role, summary);
  const quickActions = getQuickActions(role, unreadAlerts);
  const mgmtConfig = getManagementConfig(role);

  // Management section values from API managementStatus + kpi
  const mgmt = dashboardData?.managementStatus || {};
  const inspStatus = dashboardData?.inspectionStatus || {};
  const getManagementValues = () => {
    switch (role) {
      case 'system_admin':
        return {
          repairs: mgmt.repairs?.total ?? summary.openRepairs ?? 0,
          transfers: mgmt.transfers?.total ?? 0,
          scrapping: mgmt.scrapping?.total ?? 0,
        };
      case 'mold_developer':
        return {
          checklist: dashboardData?.approvals?.designApproval ?? 0,
          maintenance: summary.inspectionDueCount ?? 0,
          scrapping: mgmt.scrapping?.total ?? summary.ngMolds ?? 0,
        };
      default:
        return {};
    }
  };

  const mgmtValues = getManagementValues();

  // Maker progress list from API
  const makerProgressList = dashboardData?.assignedMolds || dashboardData?.assignedMoldList || [];

  // Plant inspection summary from API
  const plantInspection = {
    completed: inspStatus.completed ?? summary.todayChecks ?? 0,
    pending: inspStatus.pending ?? 0,
    overdue: inspStatus.overdue ?? summary.overdueChecks ?? 0,
  };

  // Activity icon mapping
  const getActivityIcon = (type) => {
    const map = {
      scan: { icon: QrCode, color: 'blue' },
      repair: { icon: Wrench, color: 'orange' },
      check: { icon: ClipboardCheck, color: 'green' },
      default: { icon: Activity, color: 'purple' },
    };
    return map[type] || map.default;
  };

  const roleLabels = {
    system_admin: '시스템 관리자',
    mold_developer: '금형개발 담당',
    maker: '제작처',
    plant: '생산처',
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw
            size={20}
            className={`text-blue-600 transition-transform ${pullDistance >= PULL_THRESHOLD ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      <div
        ref={scrollRef}
        className="overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ═══ 1. Header ═══ */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-5 pt-12 pb-16 rounded-b-[1.5rem]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {(user?.name || '?')[0]}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{user?.name || '사용자'}님</h1>
                <p className="text-blue-100 text-xs">
                  {user?.company_name || 'CAMS'}
                  {user?.department ? ` · ${user.department}` : ''}
                  {' · '}
                  <span className="text-blue-200">{roleLabels[role] || role}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bell with badge */}
              <button
                onClick={() => navigate('/mobile/alerts')}
                className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-white/25 relative"
              >
                <Bell size={20} className="text-white" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-blue-600">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </button>
              {/* Settings */}
              <button
                onClick={() => navigate('/mobile/settings/notifications')}
                className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-white/25"
              >
                <Settings size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Refreshing indicator in header */}
          {refreshing && (
            <div className="flex items-center justify-center gap-2 text-blue-100 text-xs py-1">
              <RefreshCw size={14} className="animate-spin" />
              <span>새로고침 중...</span>
            </div>
          )}
        </div>

        {/* ═══ 2. KPI Summary Cards (horizontal scroll) ═══ */}
        <div className="px-4 -mt-8">
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              kpiItems.map((item, idx) => (
                <KpiCard
                  key={idx}
                  icon={item.icon}
                  value={item.value}
                  label={item.label}
                  color={item.color}
                  onClick={() => navigate(item.path)}
                />
              ))
            )}
          </div>
        </div>

        {/* ═══ 3. Quick Actions Grid (4x2) ═══ */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">빠른 작업</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            {loading ? (
              <div className="grid grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl mb-1.5" />
                    <div className="w-10 h-3 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {quickActions.map((act, idx) => (
                  <QuickActionBtn
                    key={idx}
                    icon={act.icon}
                    label={act.label}
                    color={act.color}
                    badge={act.badge}
                    onClick={() => {
                      if (act.action === 'locationLookup') {
                        setShowLocationLookup(true);
                      } else {
                        navigate(act.path);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 4. Management Status Section ═══ */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">{mgmtConfig.title}</h2>
            <button onClick={() => navigate('/mobile/reports')} className="text-sm text-blue-600 font-medium">더보기</button>
          </div>

          {loading ? (
            <SkeletonRow />
          ) : mgmtConfig.type === 'progress' ? (
            /* Maker: progress list */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              {makerProgressList.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {makerProgressList.map((mold, idx) => {
                    const statusProgress = {
                      draft: 10, planning: 20, in_development: 40,
                      manufacturing: 60, assembly: 75, inspection_pending: 90,
                    };
                    return (
                      <ProgressItem
                        key={mold.id || idx}
                        name={mold.part_name}
                        code={mold.mold_code}
                        status={mold.status}
                        progress={statusProgress[mold.status] || 50}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-400 text-sm">
                  <Hammer size={28} className="mx-auto mb-2 opacity-30" />
                  진행 중인 제작 건이 없습니다
                </div>
              )}
            </div>
          ) : mgmtConfig.type === 'inspection' ? (
            /* Plant: inspection summary */
            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{plantInspection.completed}</div>
                <div className="text-xs text-gray-500 mt-0.5">완료</div>
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mx-auto mb-2">
                  <PauseCircle size={18} className="text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{plantInspection.pending}</div>
                <div className="text-xs text-gray-500 mt-0.5">미완료</div>
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2">
                  <XCircle size={18} className="text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{plantInspection.overdue}</div>
                <div className="text-xs text-gray-500 mt-0.5">지연</div>
              </div>
            </div>
          ) : (
            /* system_admin / mold_developer: 3 mini-cards */
            <div className="flex gap-3">
              {mgmtConfig.cards?.map((card) => (
                <MiniStatusCard
                  key={card.key}
                  icon={card.icon}
                  title={card.title}
                  value={mgmtValues[card.key]}
                  color={card.color}
                  onClick={() => navigate('/mobile/reports')}
                />
              ))}
            </div>
          )}
        </div>

        {/* ═══ 5. Recent Activity Feed ═══ */}
        <div className="px-4 mt-6 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">최근 활동</h2>
            <button onClick={() => navigate('/mobile/molds')} className="text-sm text-blue-600 font-medium">전체보기</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4">
            {loading ? (
              <div className="animate-pulse py-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentActivities.map((action) => {
                  const actIcon = getActivityIcon(action.type);
                  return (
                    <ActivityItem
                      key={action.id}
                      icon={actIcon.icon}
                      title={action.moldNumber || action.description || '활동'}
                      description={action.description || ''}
                      time={action.timestamp}
                      color={actIcon.color}
                    />
                  );
                })}
              </div>
            ) : (
              /* Also try server-side recent data */
              dashboardData?.recentAlerts?.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {dashboardData.recentAlerts.map((alert) => (
                    <ActivityItem
                      key={alert.id}
                      icon={Bell}
                      title={alert.title || '알림'}
                      description={alert.message || ''}
                      time={alert.created_at}
                      color={alert.priority === 'high' ? 'red' : 'blue'}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <History size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">최근 활동 기록이 없습니다</p>
                  <p className="text-xs mt-1">QR 스캔으로 금형 작업을 시작하세요</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Offline / Sync status */}
      <SyncStatus
        online={online}
        syncing={syncing}
        pendingCount={pendingCount}
        onSync={processQueue}
      />

      {/* ═══ 6. Bottom Navigation ═══ */}
      <BottomNav />

      {/* ═══ 7. 금형 위치 조회 모달 ═══ */}
      {showLocationLookup && (
        <MoldLocationLookup onClose={() => setShowLocationLookup(false)} />
      )}
    </div>
  );
}
