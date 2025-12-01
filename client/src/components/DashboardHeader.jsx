import { useAuthStore } from '../stores/authStore';
import { Settings, RefreshCw } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function DashboardHeader({ title, subtitle, actions, stats }) {
  const { user } = useAuthStore();

  // 현재 시간 표시
  const currentTime = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  });

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="px-6 py-6">
        {/* 상단 정보 바 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-blue-100">{user?.company_name}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-blue-400"></div>
            <div>
              <p className="text-xs text-blue-100">현재 시간</p>
              <p className="text-sm font-medium">{currentTime}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
              <NotificationBell />
            </div>
            <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
              <RefreshCw size={20} />
            </button>
            <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* 제목 영역 */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">{title}</h1>
            {subtitle && (
              <p className="text-blue-100 text-sm">{subtitle}</p>
            )}
          </div>

          {/* 빠른 통계 (선택적) */}
          {stats && (
            <div className="flex items-center space-x-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-right">
                  <p className="text-xs text-blue-100">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-xs text-blue-200 mt-0.5">{stat.subtext}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 액션 버튼 (선택적) */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* 하단 탭/네비게이션 (선택적) */}
      {/* 추후 필요시 추가 가능 */}
    </div>
  );
}
