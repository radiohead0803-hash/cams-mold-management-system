import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader';

export default function SystemAdminDashboard() {
  const [stats] = useState({
    totalUsers: 45,
    totalMolds: 128,
    activeSessions: 12,
    pendingApprovals: 5
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="시스템 관리자 대시보드"
        subtitle="전체 시스템 현황 및 관리"
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="전체 사용자" value={stats.totalUsers} icon="👥" color="blue" />
          <StatCard title="등록 금형" value={stats.totalMolds} icon="🔧" color="green" />
          <StatCard title="활성 세션" value={stats.activeSessions} icon="📱" color="purple" />
          <StatCard title="승인 대기" value={stats.pendingApprovals} icon="⏳" color="orange" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
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
