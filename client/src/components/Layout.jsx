import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Home, Package, ClipboardList, Bell, LogOut, Settings, FileText, Wrench } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CAMS</h1>
              <span className="ml-2 text-sm text-gray-500">금형관리 시스템</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
            >
              <Home size={18} className="mr-2" />
              대시보드
            </Link>
            <Link
              to="/molds"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
            >
              <Package size={18} className="mr-2" />
              금형 목록
            </Link>
            <Link
              to="/checklist/daily"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
            >
              <ClipboardList size={18} className="mr-2" />
              일상점검
            </Link>
            <Link
              to="/repairs"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
            >
              <Wrench size={18} className="mr-2" />
              수리 관리
            </Link>
            <Link
              to="/alerts"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
            >
              <Bell size={18} className="mr-2" />
              알림
            </Link>
            {(user?.role === 'system_admin' || user?.role === 'hq_manager') && (
              <Link
                to="/checklist-master"
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
              >
                <FileText size={18} className="mr-2" />
                체크리스트 관리
              </Link>
            )}
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
