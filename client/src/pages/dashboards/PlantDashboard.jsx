import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import DashboardHeader from '../../components/DashboardHeader';
import { Package, CheckCircle, Wrench, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export default function PlantDashboard() {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState({
    totalMolds: 0,
    activeMolds: 0,
    todayChecks: 0,
    pendingRepairs: 0,
    todayProduction: 0,
    monthlyProduction: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 데이터 가져오기
      const [moldsRes, checksRes, repairsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/molds?company_id=${user?.company_id}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/daily-checks?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/repairs?status=pending&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const moldsData = await moldsRes.json().catch(() => ({ data: { items: [] } }));
      const checksData = await checksRes.json().catch(() => ({ data: [] }));
      const repairsData = await repairsRes.json().catch(() => ({ data: { items: [] } }));

      const molds = moldsData.data?.items || [];
      const checks = checksData.data || [];
      const repairs = repairsData.data?.items || [];

      // 통계 계산
      const today = new Date().toISOString().split('T')[0];
      const todayChecks = checks.filter(c => c.check_date?.startsWith(today)).length;

      setStats({
        totalMolds: molds.length,
        activeMolds: molds.filter(m => m.status === 'active' || m.status === 'in_production').length,
        todayChecks,
        pendingRepairs: repairs.length,
        todayProduction: 0, // TODO: 생산 수량 API 연동
        monthlyProduction: 0
      });

      // 최근 활동 (점검 + 수리)
      const activities = [
        ...checks.slice(0, 5).map(c => ({
          type: 'check',
          title: `일상점검 완료`,
          mold: c.mold_code,
          time: c.check_date,
          status: c.overall_status
        })),
        ...repairs.slice(0, 5).map(r => ({
          type: 'repair',
          title: `수리 요청`,
          mold: r.mold_code,
          time: r.created_at,
          status: r.status
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

      setRecentActivities(activities);
    } catch (error) {
      console.error('대시보드 데이터 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const headerStats = [
    { label: '전체 금형', value: stats.totalMolds },
    { label: '가동 중', value: stats.activeMolds },
    { label: '오늘 점검', value: stats.todayChecks },
    { label: '수리 대기', value: stats.pendingRepairs }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="생산처 대시보드"
        subtitle={`${user?.company_name || '생산처'} - 금형 관리 현황`}
        stats={headerStats}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* 주요 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard 
                title="관리 금형" 
                value={stats.totalMolds}
                subValue={`가동 중 ${stats.activeMolds}개`}
                icon={Package}
                color="blue"
                trend="+5%"
              />
              <StatCard 
                title="오늘 점검" 
                value={stats.todayChecks}
                subValue="일상점검 완료"
                icon={CheckCircle}
                color="green"
              />
              <StatCard 
                title="수리 대기" 
                value={stats.pendingRepairs}
                subValue="긴급 처리 필요"
                icon={Wrench}
                color="orange"
              />
            </div>

            {/* QR 스캔 섹션 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">QR 코드 스캔</h2>
                  <p className="text-blue-100">금형 QR 코드를 스캔하여 일상점검 시작</p>
                </div>
                <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center space-x-2 shadow-lg">
                  <span className="text-2xl">📷</span>
                  <span>QR 스캔 시작</span>
                </button>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  최근 활동
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentActivities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    최근 활동이 없습니다.
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <ActivityItem key={index} activity={activity} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, color, trend }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' }
  };

  const colorScheme = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorScheme.bg} ${colorScheme.text} p-3 rounded-lg`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'check':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'repair':
        return <Wrench size={20} className="text-orange-600" />;
      default:
        return <AlertCircle size={20} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      normal: { bg: 'bg-green-100', text: 'text-green-800', label: '정상' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '주의' },
      critical: { bg: 'bg-red-100', text: 'text-red-800', label: '위험' },
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', label: '대기' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '완료' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-1">{getIcon()}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            <p className="text-sm text-gray-600 mt-1">금형: {activity.mold}</p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(activity.time)}</p>
          </div>
        </div>
        <div>{getStatusBadge(activity.status)}</div>
      </div>
    </div>
  );
}
