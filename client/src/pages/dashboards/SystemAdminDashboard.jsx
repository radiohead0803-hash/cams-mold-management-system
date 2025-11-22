import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader';

export default function SystemAdminDashboard() {
  const [stats, setStats] = useState({
    totalMolds: 245,
    activeMolds: 198,
    repairMolds: 12,
    idleMolds: 35,
    totalUsers: 156,
    todayQRScans: 1234,
    criticalAlerts: 3,
    majorAlerts: 12,
    minorAlerts: 45,
    gpsRegistered: 198,
    gpsAbnormal: 2
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'critical',
      time: '09:30',
      title: 'Critical NG 발생',
      description: '금형: M2024-001 | 생산처: A공장',
      action: '즉시 생산중단 조치 필요'
    },
    {
      id: 2,
      type: 'warning',
      time: '09:25',
      title: '정기점검 지연',
      description: '금형: M2024-045 | 생산처: B공장',
      action: '예정일 초과 3일'
    },
    {
      id: 3,
      type: 'success',
      time: '09:20',
      title: '수리 완료',
      description: '금형: M2024-023 | 제작처: C제작소',
      action: '품질 확인 후 정상화'
    },
    {
      id: 4,
      type: 'info',
      time: '09:15',
      title: '신규 금형 등록',
      description: '금형: M2024-067 | 차종: K5',
      action: 'QR 코드 발급 완료'
    }
  ]);

  const [systemStatus, setSystemStatus] = useState({
    dbStatus: 'healthy',
    apiStatus: 'healthy',
    qrServiceStatus: 'healthy',
    gpsServiceStatus: 'warning'
  });

  // 헤더 통계
  const headerStats = [
    { label: '전체 금형', value: stats.totalMolds },
    { label: '활성 사용자', value: stats.totalUsers },
    { label: 'Critical 알람', value: stats.criticalAlerts }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="시스템 관리자 대시보드"
        subtitle="전사 통합 현황 모니터링 및 시스템 관리"
        stats={headerStats}
      />
      
      <div className="p-6 space-y-6">
        {/* 금형 현황 요약 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 금형 현황 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="전체 금형" value={stats.totalMolds} icon="🔧" color="blue" unit="개" />
            <StatCard title="양산 중" value={stats.activeMolds} icon="⚙️" color="green" unit="개" />
            <StatCard title="수리 중" value={stats.repairMolds} icon="🔨" color="orange" unit="개" />
            <StatCard title="보관/대기" value={stats.idleMolds} icon="📦" color="gray" unit="개" />
          </div>
        </section>

        {/* 실시간 알람 및 시스템 상태 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 실시간 알람 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 실시간 알람 (최근 24시간)</h3>
            <div className="space-y-3">
              <AlertItem 
                level="critical" 
                count={stats.criticalAlerts} 
                label="Critical" 
                description="즉시 조치 필요"
              />
              <AlertItem 
                level="major" 
                count={stats.majorAlerts} 
                label="Major" 
                description="빠른 대응 필요"
              />
              <AlertItem 
                level="minor" 
                count={stats.minorAlerts} 
                label="Minor" 
                description="모니터링 필요"
              />
            </div>
            <Link 
              to="/alerts" 
              className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 알람 보기 →
            </Link>
          </section>

          {/* GPS 위치 추적 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 GPS 위치 추적</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">등록된 위치</p>
                  <p className="text-2xl font-bold text-green-600">{stats.gpsRegistered}개</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">위치 이탈</p>
                  <p className="text-2xl font-bold text-red-600">{stats.gpsAbnormal}개</p>
                </div>
                <div className="text-3xl">⚠️</div>
              </div>
            </div>
            <button className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              GPS 지도 보기
            </button>
          </section>
        </div>

        {/* 시스템 상태 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 시스템 상태</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SystemStatusCard title="활성 사용자" value={stats.totalUsers} status="healthy" unit="명" />
            <SystemStatusCard title="금일 QR 스캔" value={stats.todayQRScans} status="healthy" unit="회" />
            <SystemStatusCard title="데이터베이스" value="정상" status={systemStatus.dbStatus} />
            <SystemStatusCard title="GPS 서비스" value="주의" status={systemStatus.gpsServiceStatus} />
          </div>
        </section>

        {/* 실시간 활동 피드 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📡 실시간 활동 피드</h3>
          <div className="space-y-3">
            {recentActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </section>

        {/* 빠른 작업 메뉴 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard 
              icon="👥" 
              title="사용자 관리" 
              description="사용자 등록/수정"
              link="/users"
            />
            <QuickActionCard 
              icon="📋" 
              title="점검표 관리" 
              description="체크리스트 설정"
              link="/checklist-master"
            />
            <QuickActionCard 
              icon="🔔" 
              title="알람 기준 설정" 
              description="타수/NG 기준"
              link="/alert-settings"
            />
            <QuickActionCard 
              icon="📊" 
              title="통계 리포트" 
              description="전사 통계 조회"
              link="/reports"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ title, value, icon, color, unit = '' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colors[color]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}{unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// 알람 아이템 컴포넌트
function AlertItem({ level, count, label, description }) {
  const styles = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    major: 'bg-orange-50 border-orange-200 text-orange-700',
    minor: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  };

  const icons = {
    critical: '🔴',
    major: '🟡',
    minor: '🟢'
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${styles[level]}`}>
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icons[level]}</span>
        <div>
          <p className="font-semibold">{label}: {count}건</p>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
      <button className="text-sm font-medium hover:underline">상세보기</button>
    </div>
  );
}

// 시스템 상태 카드
function SystemStatusCard({ title, value, status, unit = '' }) {
  const statusStyles = {
    healthy: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    error: 'bg-red-50 border-red-200 text-red-700'
  };

  const statusIcons = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className={`p-4 border rounded-lg ${statusStyles[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-xl">{statusIcons[status]}</span>
      </div>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString() : value}{unit}
      </p>
    </div>
  );
}

// 활동 아이템 컴포넌트
function ActivityItem({ activity }) {
  const typeStyles = {
    critical: 'bg-red-50 border-l-4 border-red-500',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500',
    success: 'bg-green-50 border-l-4 border-green-500',
    info: 'bg-blue-50 border-l-4 border-blue-500'
  };

  const typeIcons = {
    critical: '🔴',
    warning: '🟡',
    success: '🟢',
    info: '🔵'
  };

  return (
    <div className={`p-4 rounded-lg ${typeStyles[activity.type]}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{typeIcons[activity.type]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">{activity.title}</p>
            <span className="text-sm text-gray-500">[{activity.time}]</span>
          </div>
          <p className="text-sm text-gray-700">{activity.description}</p>
          <p className="text-sm text-gray-600 mt-1">→ {activity.action}</p>
        </div>
      </div>
    </div>
  );
}

// 빠른 작업 카드
function QuickActionCard({ icon, title, description, link }) {
  return (
    <Link 
      to={link}
      className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
