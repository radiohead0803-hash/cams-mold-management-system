import { useState } from 'react';
import DashboardHeader from '../../components/DashboardHeader';

export default function MoldDeveloperDashboard() {
  const [stats] = useState({
    totalProjects: 24,
    inProgress: 8,
    pendingApprovals: 5,
    completed: 11
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="금형개발 대시보드"
        subtitle="금형개발 프로젝트 관리 및 승인"
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="전체 프로젝트" value={stats.totalProjects} icon="📋" color="blue" />
          <StatCard title="진행중" value={stats.inProgress} icon="⚙️" color="orange" />
          <StatCard title="승인 대기" value={stats.pendingApprovals} icon="⏳" color="red" />
          <StatCard title="완료" value={stats.completed} icon="✅" color="green" />
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
    red: 'bg-red-50 text-red-600'
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
