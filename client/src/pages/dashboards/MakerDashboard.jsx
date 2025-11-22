import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import DashboardHeader from '../../components/DashboardHeader';

export default function MakerDashboard() {
  const { user } = useAuthStore();
  const [stats] = useState({
    myProjects: 6,
    inProgress: 3,
    pendingChecklist: 2,
    completed: 1
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="제작처 대시보드"
        subtitle={`${user?.company_name || '제작처'} - 금형 제작 현황`}
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="내 프로젝트" value={stats.myProjects} icon="🔧" color="blue" />
          <StatCard title="제작중" value={stats.inProgress} icon="⚙️" color="orange" />
          <StatCard title="체크리스트 작성" value={stats.pendingChecklist} icon="📝" color="purple" />
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
