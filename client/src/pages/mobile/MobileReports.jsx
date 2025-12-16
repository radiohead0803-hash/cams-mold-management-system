/**
 * 모바일 통계/리포트 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, TrendingUp, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export default function MobileReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/statistics-report/summary?period=${period}`);
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('통계 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

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
