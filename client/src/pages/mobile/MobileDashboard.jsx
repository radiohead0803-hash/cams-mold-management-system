/**
 * 모바일 대시보드 페이지
 * 금형 현황, 점검 통계, 알림 요약 등 핵심 KPI 표시
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, ClipboardCheck, Wrench, AlertTriangle, TrendingUp, 
  Calendar, ChevronRight, RefreshCw, BarChart3, Activity,
  CheckCircle, Clock, XCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { MobileHeader } from '../../components/mobile/MobileLayout';
import { SkeletonDashboard } from '../../components/mobile/Skeleton';

export default function MobileDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMolds: 0,
    activeMolds: 0,
    pendingInspections: 0,
    overdueInspections: 0,
    pendingRepairs: 0,
    completedToday: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 사용자 역할 결정
      const role = user?.role || 'plant';
      
      // 역할별 모바일 대시보드 API 호출
      const [dashboardRes, alertsRes] = await Promise.all([
        api.get(`/api/v1/mobile/dashboard/${role}`).catch(() => ({ data: { data: {} } })),
        api.get('/api/v1/notifications?unread=true&limit=5').catch(() => ({ data: { data: [] } }))
      ]);

      const summary = dashboardRes.data?.data?.summary || {};
      
      // 역할별 통계 매핑
      if (role === 'plant' || role === 'production') {
        setStats({
          totalMolds: summary.totalMolds || 0,
          activeMolds: summary.activeMolds || 0,
          pendingInspections: summary.needsCheck || 0,
          overdueInspections: summary.ngMolds || 0,
          pendingRepairs: summary.pendingRepairs || 0,
          completedToday: summary.todayChecks || 0,
          todayProduction: summary.todayProduction || 0,
          monthlyProduction: summary.monthlyProduction || 0,
          todayScans: summary.todayScans || 0
        });
        setRecentActivities(dashboardRes.data?.data?.recentChecks || []);
      } else if (role === 'maker') {
        setStats({
          totalMolds: summary.assignedMolds || 0,
          activeMolds: summary.inProduction || 0,
          pendingInspections: summary.pendingInspection || 0,
          overdueInspections: 0,
          pendingRepairs: summary.repairRequests || 0,
          completedToday: summary.todayCompleted || 0
        });
        setRecentActivities(dashboardRes.data?.data?.recentWorks || []);
      } else {
        // developer, system_admin
        setStats({
          totalMolds: summary.totalMolds || 0,
          activeMolds: summary.activeMolds || 0,
          pendingInspections: summary.inspectionDue || 0,
          overdueInspections: summary.ngMolds || 0,
          pendingRepairs: summary.pendingRepairs || 0,
          completedToday: summary.todayScans || 0,
          developingMolds: summary.developingMolds || 0,
          pendingApprovals: summary.pendingApprovals || 0
        });
        setRecentActivities(dashboardRes.data?.data?.recentMolds || []);
      }

      setAlerts(alertsRes.data?.data?.items || alertsRes.data?.data || dashboardRes.data?.data?.recentAlerts || []);

    } catch (error) {
      console.error('[Dashboard] 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="대시보드" />
        <SkeletonDashboard className="p-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="대시보드" 
        rightAction={
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Box}
            label="전체 금형"
            value={stats.totalMolds}
            color="blue"
            onClick={() => navigate('/mobile/molds')}
          />
          <StatCard
            icon={ClipboardCheck}
            label="점검 대기"
            value={stats.pendingInspections}
            color="green"
            onClick={() => navigate('/mobile/alerts?type=inspection')}
          />
          <StatCard
            icon={AlertTriangle}
            label="점검 지연"
            value={stats.overdueInspections}
            color="red"
            highlight={stats.overdueInspections > 0}
            onClick={() => navigate('/mobile/alerts?type=overdue')}
          />
          <StatCard
            icon={Wrench}
            label="수리 대기"
            value={stats.pendingRepairs}
            color="orange"
            onClick={() => navigate('/mobile/alerts?type=repair')}
          />
        </div>

        {/* 오늘의 현황 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">오늘의 현황</h3>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.completedToday}</p>
              <p className="text-xs text-gray-500">완료</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.pendingInspections}</p>
              <p className="text-xs text-gray-500">대기</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.overdueInspections}</p>
              <p className="text-xs text-gray-500">지연</p>
            </div>
          </div>
        </div>

        {/* 알림 */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">알림</h3>
              <button 
                onClick={() => navigate('/mobile/alerts')}
                className="text-sm text-blue-600 flex items-center"
              >
                전체보기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y">
              {alerts.slice(0, 3).map((alert, idx) => (
                <AlertItem key={idx} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* 최근 활동 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">최근 활동</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {recentActivities.length > 0 ? (
            <div className="divide-y">
              {recentActivities.map((activity, idx) => (
                <ActivityItem key={idx} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">최근 활동이 없습니다</p>
            </div>
          )}
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            icon={ClipboardCheck}
            label="QR 스캔"
            color="blue"
            onClick={() => navigate('/qr/scan')}
          />
          <QuickAction
            icon={BarChart3}
            label="통계"
            color="purple"
            onClick={() => navigate('/mobile/reports')}
          />
          <QuickAction
            icon={Box}
            label="금형 목록"
            color="green"
            onClick={() => navigate('/mobile/molds')}
          />
        </div>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ icon: Icon, label, value, color, highlight, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm text-left transition-transform active:scale-95 ${
        highlight ? 'ring-2 ring-red-400' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </button>
  );
}

// 알림 아이템 컴포넌트
function AlertItem({ alert }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'inspection': return <ClipboardCheck className="w-4 h-4 text-blue-500" />;
      case 'repair': return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{alert.title || alert.message}</p>
        <p className="text-xs text-gray-500">{alert.created_at ? new Date(alert.created_at).toLocaleString('ko-KR') : ''}</p>
      </div>
    </div>
  );
}

// 활동 아이템 컴포넌트
function ActivityItem({ activity }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Activity className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{activity.description || activity.action}</p>
        <p className="text-xs text-gray-500">
          {activity.mold_code && <span className="font-medium">{activity.mold_code} · </span>}
          {activity.created_at ? new Date(activity.created_at).toLocaleString('ko-KR') : ''}
        </p>
      </div>
    </div>
  );
}

// 빠른 액션 버튼
function QuickAction({ icon: Icon, label, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center transition-transform active:scale-95"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );
}
