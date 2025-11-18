import { Package, QrCode, ClipboardCheck, TrendingUp } from 'lucide-react'
import useAuthStore from '../store/authStore'

function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  const stats = [
    {
      name: '전체 금형',
      value: '150',
      change: '+12',
      changeType: 'positive',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'QR 스캔',
      value: '1,234',
      change: '+23%',
      changeType: 'positive',
      icon: QrCode,
      color: 'bg-green-500'
    },
    {
      name: '일일 점검',
      value: '89',
      change: '+5',
      changeType: 'positive',
      icon: ClipboardCheck,
      color: 'bg-purple-500'
    },
    {
      name: '가동률',
      value: '94%',
      change: '+2%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          안녕하세요, {user?.name}님 👋
        </h1>
        <p className="text-gray-600 mt-2">
          오늘도 안전한 하루 되세요!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className={`text-sm mt-2 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">금형 MD-2024-001 점검 완료</p>
                <p className="text-xs text-gray-500">2시간 전</p>
              </div>
              <span className="badge badge-success">완료</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">QR 스캔 세션 시작</p>
                <p className="text-xs text-gray-500">3시간 전</p>
              </div>
              <span className="badge badge-info">진행중</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">정기 점검 예정</p>
                <p className="text-xs text-gray-500">5시간 전</p>
              </div>
              <span className="badge badge-warning">예정</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">알림</h2>
          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <p className="text-sm font-medium text-yellow-800">정기 점검 알림</p>
              <p className="text-xs text-yellow-700 mt-1">
                금형 MD-2024-002의 정기 점검이 내일 예정되어 있습니다.
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <p className="text-sm font-medium text-blue-800">시스템 업데이트</p>
              <p className="text-xs text-blue-700 mt-1">
                새로운 기능이 추가되었습니다. 확인해보세요!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
