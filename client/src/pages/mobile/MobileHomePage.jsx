import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, ClipboardCheck, Wrench, Trash2, FileCheck, 
  Bell, QrCode, Settings, ChevronRight, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, Cog, BarChart3, MapPin, History, List,
  Clock, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { BottomNav } from '../../components/mobile/MobileLayout';
import { recentActions } from '../../utils/mobileStorage';
import useOfflineSync, { SyncStatus } from '../../hooks/useOfflineSync';

// 빠른 액션 버튼
const QuickAction = ({ icon: Icon, label, color, onClick, badge }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 relative"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-medium text-gray-700 mt-2">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};

// 통계 카드
const StatCard = ({ label, value, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${colorClasses[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
      <ChevronRight size={20} className="text-gray-400" />
    </button>
  );
};

export default function MobileHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    unreadAlerts: 0,
    pendingChecks: 0,
    openRepairs: 0,
    maintenanceDue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentMolds, setRecentMolds] = useState([]);
  
  // 오프라인 동기화 훅
  const { online, syncing, pendingCount, processQueue } = useOfflineSync();

  useEffect(() => {
    loadStats();
    loadRecentActions();
  }, []);

  const loadRecentActions = async () => {
    try {
      const actions = await recentActions.getAll(5);
      setRecentMolds(actions);
    } catch (error) {
      console.error('Failed to load recent actions:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // 읽지 않은 알림 수
      const alertsRes = await api.get('/alerts', { params: { is_read: false, limit: 1 } }).catch(() => ({ data: { data: { total: 0 } } }));
      
      setStats({
        unreadAlerts: alertsRes.data.data.total || 0,
        pendingChecks: 3,
        openRepairs: 2,
        maintenanceDue: 5
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: QrCode, label: 'QR 스캔', color: 'blue', path: '/qr/scan' },
    { icon: List, label: '금형목록', color: 'blue', path: '/mobile/molds' },
    { icon: ClipboardCheck, label: '일상점검', color: 'green', path: '/mobile/daily-check' },
    { icon: Calendar, label: '정기점검', color: 'purple', path: '/mobile/periodic-check' },
    { icon: Cog, label: '유지보전', color: 'orange', path: '/mobile/maintenance' },
    { icon: Wrench, label: '수리요청', color: 'red', path: '/mobile/repair-request' },
    { icon: BarChart3, label: '통계', color: 'purple', path: '/mobile/reports' },
    { icon: Bell, label: '알림', color: 'orange', path: '/mobile/alerts', badge: stats.unreadAlerts }
  ];
  
  const moreActions = [
    { icon: Trash2, label: '폐기관리', color: 'gray', path: '/mobile/scrapping' },
    { icon: FileCheck, label: '체크리스트', color: 'blue', path: '/mobile/pre-production-checklist' },
    { icon: MapPin, label: '위치지도', color: 'green', path: '/mobile/location-map' },
    { icon: QrCode, label: 'QR세션', color: 'blue', path: '/mobile/qr-sessions' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">안녕하세요, {user?.name || '사용자'}님</h1>
            <p className="text-blue-100 text-sm">{user?.company_name || 'CAMS 금형관리 시스템'}</p>
          </div>
          <button
            onClick={() => navigate('/notification-settings')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <Settings size={20} className="text-white" />
          </button>
        </div>

        {/* 알림 배너 */}
        {stats.unreadAlerts > 0 && (
          <button
            onClick={() => navigate('/alerts')}
            className="w-full bg-white/20 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Bell size={16} className="text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-medium text-sm">읽지 않은 알림 {stats.unreadAlerts}건</div>
              <div className="text-blue-100 text-xs">탭하여 확인하세요</div>
            </div>
            <ChevronRight size={20} className="text-white" />
          </button>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">빠른 작업</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <QuickAction
                key={action.label}
                icon={action.icon}
                label={action.label}
                color={action.color}
                badge={action.badge}
                onClick={() => navigate(action.path)}
              />
            ))}
          </div>
          
          {/* 추가 메뉴 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs text-gray-500 mb-3">더보기</h3>
            <div className="grid grid-cols-4 gap-3">
              {moreActions.map((action) => (
                <QuickAction
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  color={action.color}
                  onClick={() => navigate(action.path)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 현황 요약 */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">현황 요약</h2>
        <div className="space-y-3">
          <StatCard
            label="점검 예정"
            value={stats.pendingChecks}
            icon={Calendar}
            color="blue"
            onClick={() => navigate('/mobile/periodic-check')}
          />
          <StatCard
            label="진행 중 수리"
            value={stats.openRepairs}
            icon={Wrench}
            color="orange"
            onClick={() => navigate('/mobile/repair-request')}
          />
          <StatCard
            label="유지보전 예정"
            value={stats.maintenanceDue}
            icon={Cog}
            color="green"
            onClick={() => navigate('/mobile/maintenance')}
          />
        </div>
      </div>

      {/* 최근 작업 금형 */}
      <div className="px-4 mt-6 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">최근 작업 금형</h2>
          <button
            onClick={() => navigate('/mobile/molds')}
            className="text-xs text-blue-600 font-medium"
          >
            전체보기
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {recentMolds.length > 0 ? (
            recentMolds.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(`/mobile/mold/${action.moldId}`)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{action.moldNumber}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(action.timestamp).toLocaleDateString('ko-KR')}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <History size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">최근 작업 기록이 없습니다</p>
              <p className="text-xs mt-1">QR 스캔으로 금형 작업을 시작하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 오프라인/동기화 상태 표시 */}
      <SyncStatus 
        online={online} 
        syncing={syncing} 
        pendingCount={pendingCount} 
        onSync={processQueue} 
      />

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
}
