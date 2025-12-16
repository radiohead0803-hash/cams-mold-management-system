/**
 * 모바일 통계/리포트 페이지
 * 점검, 수리, NG, 생산 통계 표시
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, BarChart3, TrendingUp, AlertTriangle, Wrench, 
  RefreshCw, Box, Activity, Calendar, Target, Zap
} from 'lucide-react';
import api from '../../lib/api';
import { MobileHeader } from '../../components/mobile/MobileLayout';
import { SkeletonDashboard } from '../../components/mobile/Skeleton';

export default function MobileReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [summary, setSummary] = useState(null);
  const [productionStats, setProductionStats] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      
      // 병렬로 여러 통계 API 호출
      const [summaryRes, productionRes] = await Promise.all([
        api.get(`/api/v1/statistics-report/summary?period=${period}`).catch(() => ({ data: { data: null } })),
        api.get(`/api/v1/production-quantities/stats?period=${period}`).catch(() => ({ data: { data: null } }))
      ]);
      
      if (summaryRes.data?.success || summaryRes.data?.data) {
        setSummary(summaryRes.data.data);
      } else {
        // Mock 데이터 (API 없을 경우)
        setSummary(getMockSummary(period));
      }
      
      if (productionRes.data?.data) {
        setProductionStats(productionRes.data.data);
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
      setSummary(getMockSummary(period));
    } finally {
      setLoading(false);
    }
  };

  // Mock 데이터
  const getMockSummary = (p) => ({
    inspection: {
      total: p === 'weekly' ? 156 : 624,
      completed: p === 'weekly' ? 142 : 598,
      completionRate: p === 'weekly' ? 91 : 96
    },
    repair: {
      total: p === 'weekly' ? 12 : 48,
      completed: p === 'weekly' ? 9 : 42,
      avgDays: p === 'weekly' ? 3.2 : 2.8
    },
    ng: {
      totalNg: p === 'weekly' ? 5 : 18,
      affectedMolds: p === 'weekly' ? 4 : 12
    },
    transfer: {
      total: p === 'weekly' ? 8 : 32,
      completed: p === 'weekly' ? 7 : 30
    },
    production: {
      totalQuantity: p === 'weekly' ? 45000 : 180000,
      totalShots: p === 'weekly' ? 12500 : 50000,
      activeMolds: 65
    }
  });

  const StatCard = ({ icon: Icon, title, value, subValue, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">통계 리포트</h1>
          </div>
          <button onClick={fetchSummary} className="p-2">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Period Tabs */}
        <div className="flex border-b px-4">
          {[
            { key: 'weekly', label: '주간' },
            { key: 'monthly', label: '월간' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                period === tab.key 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : summary ? (
          <>
            {/* 점검 현황 */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">점검 현황</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={BarChart3}
                  title="총 점검"
                  value={summary.inspection?.total || 0}
                  subValue={`완료: ${summary.inspection?.completed || 0}`}
                  color="bg-blue-500"
                />
                <StatCard
                  icon={TrendingUp}
                  title="완료율"
                  value={`${summary.inspection?.completionRate || 0}%`}
                  color="bg-green-500"
                />
              </div>
            </div>

            {/* 수리 현황 */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">수리 현황</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Wrench}
                  title="총 수리"
                  value={summary.repair?.total || 0}
                  subValue={`완료: ${summary.repair?.completed || 0}`}
                  color="bg-orange-500"
                />
                <StatCard
                  icon={TrendingUp}
                  title="평균 처리일"
                  value={`${summary.repair?.avgDays || 0}일`}
                  color="bg-purple-500"
                />
              </div>
            </div>

            {/* NG 현황 */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">NG 현황</h2>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">총 NG 건수</p>
                      <p className="text-xl font-bold">{summary.ng?.totalNg || 0}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">영향 금형</p>
                    <p className="text-lg font-semibold">{summary.ng?.affectedMolds || 0}개</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 이관 현황 */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">이관 현황</h2>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">총 이관</p>
                    <p className="text-xl font-bold">{summary.transfer?.total || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">완료</p>
                    <p className="text-lg font-semibold text-green-600">{summary.transfer?.completed || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 생산 현황 */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">생산 현황</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Zap}
                  title="생산 수량"
                  value={(summary.production?.totalQuantity || 0).toLocaleString()}
                  subValue={period === 'weekly' ? '이번 주' : '이번 달'}
                  color="bg-cyan-500"
                />
                <StatCard
                  icon={Target}
                  title="총 타수"
                  value={(summary.production?.totalShots || 0).toLocaleString()}
                  subValue={`가동 금형: ${summary.production?.activeMolds || 0}개`}
                  color="bg-indigo-500"
                />
              </div>
            </div>

            {/* 완료율 프로그레스 바 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">점검 완료율</h3>
              <div className="space-y-3">
                <ProgressBar 
                  label="일상점검" 
                  value={summary.inspection?.completionRate || 0} 
                  color="bg-blue-500" 
                />
                <ProgressBar 
                  label="수리완료" 
                  value={summary.repair?.total > 0 
                    ? Math.round((summary.repair?.completed / summary.repair?.total) * 100) 
                    : 0
                  } 
                  color="bg-orange-500" 
                />
                <ProgressBar 
                  label="이관완료" 
                  value={summary.transfer?.total > 0 
                    ? Math.round((summary.transfer?.completed / summary.transfer?.total) * 100) 
                    : 0
                  } 
                  color="bg-green-500" 
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>데이터를 불러올 수 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 프로그레스 바 컴포넌트
function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
