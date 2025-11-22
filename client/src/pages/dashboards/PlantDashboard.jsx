import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import DashboardHeader from '../../components/DashboardHeader';

export default function PlantDashboard() {
  const { user } = useAuthStore();
  const [stats] = useState({
    myMolds: 15,
    todayChecks: 8,
    pendingRepairs: 2,
    totalProduction: 2450
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="생산처 대시보드"
        subtitle={`${user?.company_name || '생산처'} - 금형 관리 현황`}
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="관리 금형" value={stats.myMolds} icon="🔧" color="blue" />
          <StatCard title="오늘 점검" value={stats.todayChecks} icon="✅" color="green" />
          <StatCard title="수리 대기" value={stats.pendingRepairs} icon="🔨" color="orange" />
          <StatCard title="오늘 생산" value={stats.totalProduction} icon="📦" color="purple" />
        </div>

        {/* QR 스캔 버튼 */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">QR 코드 스캔</h2>
              <p className="text-blue-100">금형 QR 코드를 스캔하여 일상점검 시작</p>
            </div>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center space-x-2">
              <span className="text-2xl">📷</span>
              <span>QR 스캔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-4xl ${colors[color]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
