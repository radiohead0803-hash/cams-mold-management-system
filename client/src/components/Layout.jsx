import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Home, Package, ClipboardList, Bell, LogOut, Settings, FileText, Wrench, Users, BarChart3, CheckSquare, Truck, QrCode } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 사용자 유형별 메뉴 구성
  const getMenuItems = () => {
    const userType = user?.user_type

    // 공통 메뉴
    const commonMenus = [
      { to: '/', icon: Home, label: '대시보드' }
    ]

    // 시스템 관리자 메뉴
    if (userType === 'system_admin') {
      return [
        ...commonMenus,
        { to: '/molds', icon: Package, label: '금형 목록' },
        { to: '/users', icon: Users, label: '사용자 관리' },
        { to: '/checklist-master', icon: FileText, label: '점검표 관리' },
        { to: '/alerts', icon: Bell, label: '알림 관리' },
        { to: '/reports', icon: BarChart3, label: '통계 리포트' }
      ]
    }

    // 금형개발 담당 메뉴
    if (userType === 'mold_developer') {
      return [
        ...commonMenus,
        { to: '/molds', icon: Package, label: '금형 관리' },
        { to: '/approvals', icon: CheckSquare, label: '승인 및 검토' },
        { to: '/makers', icon: Settings, label: '제작처 관리' },
        { to: '/alerts', icon: Bell, label: '알림' },
        { to: '/reports', icon: BarChart3, label: '통계 리포트' }
      ]
    }

    // 제작처 메뉴
    if (userType === 'maker') {
      return [
        ...commonMenus,
        { to: '/molds', icon: Package, label: '담당 금형' },
        { to: '/qr-codes', icon: QrCode, label: 'QR 코드 관리' },
        { to: '/repairs', icon: Wrench, label: '수리 관리' },
        { to: '/alerts', icon: Bell, label: '알림' }
      ]
    }

    // 생산처 메뉴
    if (userType === 'plant') {
      return [
        ...commonMenus,
        { to: '/molds', icon: Package, label: '보유 금형' },
        { to: '/checklist/daily', icon: ClipboardList, label: '일상점검' },
        { to: '/inspection/periodic', icon: CheckSquare, label: '정기점검' },
        { to: '/repairs', icon: Wrench, label: '수리 요청' },
        { to: '/transfers', icon: Truck, label: '금형 이관' },
        { to: '/alerts', icon: Bell, label: '알림' }
      ]
    }

    // 기본 메뉴
    return [
      ...commonMenus,
      { to: '/molds', icon: Package, label: '금형 목록' },
      { to: '/alerts', icon: Bell, label: '알림' }
    ]
  }

  const menuItems = getMenuItems()

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/dashboard')
    }
    return location.pathname.startsWith(path)
  }

  // 사용자 유형별 표시 이름
  const getUserTypeLabel = () => {
    const labels = {
      'system_admin': '시스템 관리자',
      'mold_developer': '금형개발 담당',
      'maker': '제작처',
      'plant': '생산처'
    }
    return labels[user?.user_type] || '사용자'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">CAMS</h1>
                <span className="text-xs text-gray-500">금형관리 시스템</span>
              </div>
              <div className="hidden md:block">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {getUserTypeLabel()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.company_name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="로그아웃"
              >
                <LogOut size={18} />
                <span className="text-sm hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-700 border-transparent hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
