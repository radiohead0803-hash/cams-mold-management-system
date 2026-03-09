import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, CheckCircle, Wrench, TrendingUp, Package, AlertTriangle, QrCode, Calendar } from 'lucide-react';
import api from '../../lib/api';
import DashboardHeader from '../../components/DashboardHeader';
import { MaintenanceWidget, AlertSummaryWidget, InspectionDueWidget } from '../../components/DashboardWidgets';
import { SkeletonDashboard } from '../../components/mobile/Skeleton';

export default function PlantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 대시보드 요약 데이터
      const summaryResponse = await api.get('/plant/dashboard/summary');
      
      if (summaryResponse.data.success) {
        setStats(summaryResponse.data.data);
      }

      // 최근 활동
      const activitiesResponse = await api.get('/plant/dashboard/recent-activities?limit=10');
      
      if (activitiesResponse.data.success) {
        setActivities(activitiesResponse.data.data.activities || []);
      }
    } catch (err) {
      console.error('대시보드 데이터 로딩 에러:', err);
      setError(err.response?.data?.error?.message || '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const headerStats = stats ? [
    { label: '배치 금형', value: stats.totalMolds || 0 },
    { label: '가동 중', value: stats.activeMolds || 0 },
    { label: '오늘 점검', value: stats.todayChecks || 0 }
  ] : [];

  // 로딩 상태 - 스켈레톤 UI 적용
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="생산처 대시보드"
          subtitle="금형 점검 및 생산 현황 관리"
          stats={[]}
        />
        <div className="p-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 로딩 실패</h2>
            <p className="text-gray-600 mb-6">{error || '대시보드 데이터를 불러올 수 없습니다.'}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="생산처 대시보드"
        subtitle="금형 관리 및 생산 현황"
        stats={headerStats}
      />
      
      <div className="p-6 space-y-6">
        {/* 핵심 KPI 카드 - 8개 그리드 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 핵심 지표</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 배치 금형 */}
            <button
              onClick={() => navigate('/molds')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div>
                <p className="text-xs text-gray-500 font-medium">배치 금형</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalMolds || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Total Molds</p>
              </div>
              <Factory className="w-10 h-10 text-gray-400" />
            </button>

            {/* 가동 중 금형 */}
            <button
              onClick={() => navigate('/molds?status=active')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-green-300 transition-all"
            >
              <div>
                <p className="text-xs text-green-600 font-medium">가동 중</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.activeMolds || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Active</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </button>

            {/* 오늘 점검 */}
            <button
              onClick={() => navigate('/plant/select-mold/daily-inspection')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div>
                <p className="text-xs text-blue-600 font-medium">오늘 점검</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.todayChecks || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Today Checks</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-400" />
            </button>

            {/* 수리 대기 */}
            <button
              onClick={() => navigate('/plant/select-mold/repair-request')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all"
            >
              <div>
                <p className="text-xs text-orange-600 font-medium">수리 대기</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">{stats.pendingRepairs || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Pending</p>
              </div>
              <Wrench className="w-10 h-10 text-orange-400" />
            </button>

            {/* 오늘 생산 */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">오늘 생산</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{stats.todayProduction?.toLocaleString() || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Today Production</p>
              </div>
              <Package className="w-10 h-10 text-purple-400" />
            </div>

            {/* 이번 달 생산 */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-medium">이번 달 생산</p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.monthlyProduction?.toLocaleString() || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Monthly</p>
              </div>
              <TrendingUp className="w-10 h-10 text-indigo-400" />
            </div>

            {/* 오늘 QR 스캔 */}
            <button
              onClick={() => navigate('/qr-login')}
              className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md hover:border-green-300 transition-all"
            >
              <div>
                <p className="text-xs text-green-600 font-medium">오늘 QR 스캔</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.todayScans || 0}</p>
                <p className="mt-1 text-xs text-gray-400">Today Scans</p>
              </div>
              <QrCode className="w-10 h-10 text-green-400" />
            </button>

            {/* NG 금형 */}
            {stats.ngMolds > 0 && (
              <button
                onClick={() => navigate('/molds?status=ng')}
                className="rounded-xl bg-red-50 border border-red-200 shadow-sm p-5 text-left flex items-center justify-between hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-xs text-red-600 font-medium">NG 금형</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{stats.ngMolds || 0}</p>
                  <p className="mt-1 text-xs text-red-400">Defective</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </button>
            )}
          </div>
        </section>

        {/* 관리 현황 위젯 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 관리 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MaintenanceWidget />
            <AlertSummaryWidget />
            <InspectionDueWidget />
          </div>
        </section>

        {/* QR 스캔 CTA */}
        <section>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">QR 코드 스캔</h3>
                <p className="text-blue-100">금형 QR 코드를 스캔하여 일상점검을 시작하세요</p>
              </div>
              <button
                onClick={() => navigate('/qr-login')}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                스캔 시작
              </button>
            </div>
          </div>
        </section>

        {/* 최근 활동 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            최근 활동
          </h3>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                최근 활동이 없습니다.
              </div>
            ) : (
              activities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const typeIcons = {
    check: <CheckCircle className="w-5 h-5 text-green-500" />,
    repair: <Wrench className="w-5 h-5 text-orange-500" />,
    production: <Package className="w-5 h-5 text-purple-500" />
  };

  const typeColors = {
    check: 'bg-green-50 border-green-200',
    repair: 'bg-orange-50 border-orange-200',
    production: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${typeColors[activity.type] || 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {typeIcons[activity.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
            <span className="text-xs text-gray-500">
              {activity.time ? new Date(activity.time).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </span>
          </div>
          <p className="text-sm text-gray-700">
            {activity.mold_code && <span className="font-medium">{activity.mold_code}</span>}
            {activity.mold_name && <span className="text-gray-500"> - {activity.mold_name}</span>}
          </p>
          {activity.status && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-white border border-gray-300 text-gray-700">
              {activity.status}
            </span>
          )}
          {activity.quantity && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-white border border-gray-300 text-gray-700">
              수량: {activity.quantity.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
