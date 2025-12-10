import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Home, Package, ClipboardList, Bell, LogOut, Settings, FileText, Wrench, Users, BarChart3, CheckSquare, Truck, QrCode, ChevronDown, Building2, Trash2, Cog, FileCheck, Keyboard } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showShortcuts, setShowShortcuts] = useState(false)

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + 키 조합
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h':
            e.preventDefault()
            navigate('/')
            break
          case 'm':
            e.preventDefault()
            navigate('/molds')
            break
          case 'r':
            e.preventDefault()
            navigate('/reports')
            break
          case 'k':
            e.preventDefault()
            setShowShortcuts(prev => !prev)
            break
        }
      }
      // ESC로 단축키 도움말 닫기
      if (e.key === 'Escape') {
        setShowShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 사용자 유형별 메뉴 구성 (서브메뉴 포함)
  const getMenuItems = () => {
    const userType = user?.user_type

    // 시스템 관리자 메뉴
    if (userType === 'system_admin') {
      return [
        { 
          to: '/', 
          icon: Home, 
          label: '대시보드',
          subMenus: []
        },
        { 
          to: '/molds', 
          icon: Package, 
          label: '금형개발',
          subMenus: [
            { to: '/molds', label: '개발금형현황' },
            { to: '/molds/new', label: '금형 등록' },
            { to: '/molds/bulk-upload', label: '금형 일괄등록' },
            { to: '/molds/lifecycle', label: '개발진행현황' },
            { to: '/master-data', label: '기초정보 관리' }
          ]
        },
        { 
          to: '/molds/master', 
          icon: Settings, 
          label: '금형관리',
          subMenus: [
            { to: '/molds/master', label: '금형관리 마스터' }
          ]
        },
        { 
          to: '/approvals', 
          icon: CheckSquare, 
          label: '승인 및 검토',
          subMenus: [
            { to: '/approvals/design', label: '설계 승인' },
            { to: '/approvals/trial', label: '시운전 승인' },
            { to: '/approvals/repair', label: '수리 귀책' }
          ]
        },
        { 
          to: '/repairs', 
          icon: Wrench, 
          label: '수리 관리',
          subMenus: [
            { to: '/repairs', label: '수리 현황' },
            { to: '/repairs/new', label: '수리 요청' }
          ]
        },
        { 
          to: '/companies', 
          icon: Building2, 
          label: '업체 관리',
          subMenus: [
            { to: '/companies', label: '업체 목록' },
            { to: '/companies?type=maker', label: '제작처 관리' },
            { to: '/companies?type=plant', label: '생산처 관리' }
          ]
        },
        { 
          to: '/user-requests', 
          icon: Users, 
          label: '사용자 관리',
          subMenus: [
            { to: '/user-requests', label: '계정 요청 관리' }
          ]
        },
        { 
          to: '/alerts', 
          icon: Bell, 
          label: '알림',
          subMenus: [
            { to: '/alerts', label: '알림 목록' },
            { to: '/notification-settings', label: '알림 설정' }
          ]
        },
        { 
          to: '/reports', 
          icon: BarChart3, 
          label: '통계 리포트',
          subMenus: [
            { to: '/reports', label: '전체 현황' },
            { to: '/reports/molds', label: '금형 통계' },
            { to: '/reports/maintenance', label: '유지보전 통계' }
          ]
        },
        { 
          to: '/pre-production-checklist', 
          icon: FileCheck, 
          label: '제작전 체크리스트',
          subMenus: [
            { to: '/pre-production-checklist', label: '체크리스트 목록' },
            { to: '/pre-production-checklist/new', label: '새 체크리스트' }
          ]
        },
        { 
          to: '/maintenance', 
          icon: Cog, 
          label: '유지보전',
          subMenus: [
            { to: '/maintenance', label: '유지보전 기록' },
            { to: '/maintenance/new', label: '기록 등록' }
          ]
        },
        { 
          to: '/scrapping', 
          icon: Trash2, 
          label: '금형 폐기',
          subMenus: [
            { to: '/scrapping', label: '폐기 요청 목록' },
            { to: '/scrapping/new', label: '폐기 요청' }
          ]
        },
        { 
          to: '/transfers', 
          icon: Truck, 
          label: '금형 이관',
          subMenus: [
            { to: '/transfers', label: '이관 현황' },
            { to: '/transfers/new', label: '이관 요청' }
          ]
        }
      ]
    }

    // 금형개발 담당 메뉴
    if (userType === 'mold_developer') {
      return [
        { 
          to: '/', 
          icon: Home, 
          label: '대시보드',
          subMenus: []
        },
        { 
          to: '/molds', 
          icon: Package, 
          label: '금형개발',
          subMenus: [
            { to: '/molds', label: '개발금형현황' },
            { to: '/molds/new', label: '금형 등록' },
            { to: '/molds/bulk-upload', label: '금형 일괄등록' },
            { to: '/molds/lifecycle', label: '개발진행현황' }
          ]
        },
        { 
          to: '/molds/master', 
          icon: Settings, 
          label: '금형관리',
          subMenus: [
            { to: '/molds/master', label: '금형관리 마스터' }
          ]
        },
        { 
          to: '/approvals', 
          icon: CheckSquare, 
          label: '승인 및 검토',
          subMenus: [
            { to: '/approvals/design', label: '설계 승인' },
            { to: '/approvals/trial', label: '시운전 승인' },
            { to: '/approvals/repair', label: '수리 귀책 협의' }
          ]
        },
        { 
          to: '/repairs', 
          icon: Wrench, 
          label: '수리 관리',
          subMenus: [
            { to: '/repairs', label: '수리 현황' },
            { to: '/repairs/new', label: '수리 요청' }
          ]
        },
        { 
          to: '/companies', 
          icon: Building2, 
          label: '업체 관리',
          subMenus: [
            { to: '/companies', label: '업체 목록' },
            { to: '/companies?type=maker', label: '제작처 관리' },
            { to: '/companies?type=plant', label: '생산처 관리' }
          ]
        },
        { 
          to: '/user-requests', 
          icon: Users, 
          label: '사용자 관리',
          subMenus: [
            { to: '/user-requests', label: '계정 요청 관리' }
          ]
        },
        { 
          to: '/alerts', 
          icon: Bell, 
          label: '알림',
          subMenus: [
            { to: '/alerts', label: '알림 목록' },
            { to: '/notification-settings', label: '알림 설정' }
          ]
        },
        { 
          to: '/reports', 
          icon: BarChart3, 
          label: '통계 리포트',
          subMenus: [
            { to: '/reports', label: '전체 현황' },
            { to: '/reports/molds', label: '금형 통계' },
            { to: '/reports/maintenance', label: '유지보전 통계' }
          ]
        },
        { 
          to: '/pre-production-checklist', 
          icon: FileCheck, 
          label: '제작전 체크리스트',
          subMenus: [
            { to: '/pre-production-checklist', label: '체크리스트 목록' }
          ]
        },
        { 
          to: '/maintenance', 
          icon: Cog, 
          label: '유지보전',
          subMenus: [
            { to: '/maintenance', label: '유지보전 기록' }
          ]
        },
        { 
          to: '/scrapping', 
          icon: Trash2, 
          label: '금형 폐기',
          subMenus: [
            { to: '/scrapping', label: '폐기 요청 목록' }
          ]
        },
        { 
          to: '/transfers', 
          icon: Truck, 
          label: '금형 이관',
          subMenus: [
            { to: '/transfers', label: '이관 현황' },
            { to: '/transfers/new', label: '이관 요청' }
          ]
        }
      ]
    }

    // 제작처 메뉴
    if (userType === 'maker') {
      return [
        { 
          to: '/', 
          icon: Home, 
          label: '대시보드',
          subMenus: []
        },
        { 
          to: '/projects', 
          icon: Package, 
          label: '담당 금형',
          subMenus: [
            { to: '/projects', label: '진행 중인 프로젝트' },
            { to: '/projects/completed', label: '완료된 프로젝트' },
            { to: '/molds/master', label: '금형관리 마스터' }
          ]
        },
        { 
          to: '/qr-codes', 
          icon: QrCode, 
          label: 'QR 코드 관리',
          subMenus: [
            { to: '/qr-codes', label: 'QR 코드 출력' },
            { to: '/qr-codes/status', label: '부착 현황' }
          ]
        },
        { 
          to: '/repairs', 
          icon: Wrench, 
          label: '수리 관리',
          subMenus: [
            { to: '/repairs', label: '수리 요청' },
            { to: '/repairs/history', label: '수리 이력' }
          ]
        },
        { 
          to: '/alerts', 
          icon: Bell, 
          label: '알림',
          subMenus: []
        }
      ]
    }

    // 생산처 메뉴
    if (userType === 'plant') {
      return [
        { 
          to: '/', 
          icon: Home, 
          label: '대시보드',
          subMenus: []
        },
        { 
          to: '/molds', 
          icon: Package, 
          label: '보유 금형',
          subMenus: [
            { to: '/molds', label: '개발금형현황' },
            { to: '/molds/master', label: '금형관리 마스터' },
            { to: '/molds/status', label: '상태 관리' }
          ]
        },
        { 
          to: '/checklist/daily', 
          icon: ClipboardList, 
          label: '일상점검',
          subMenus: [
            { to: '/checklist/daily', label: '점검 입력' },
            { to: '/checklist/daily/history', label: '점검 이력' }
          ]
        },
        { 
          to: '/inspection/periodic', 
          icon: CheckSquare, 
          label: '정기점검',
          subMenus: [
            { to: '/inspection/periodic', label: '정기점검 실시' },
            { to: '/inspection/periodic/schedule', label: '점검 일정' }
          ]
        },
        { 
          to: '/repairs', 
          icon: Wrench, 
          label: '수리 요청',
          subMenus: [
            { to: '/repairs/new', label: '수리 요청' },
            { to: '/repairs', label: '요청 현황' }
          ]
        },
        { 
          to: '/alerts', 
          icon: Bell, 
          label: '알림',
          subMenus: []
        },
        { 
          to: '/transfers', 
          icon: Truck, 
          label: '금형 이관',
          subMenus: [
            { to: '/transfers', label: '이관 현황' }
          ]
        }
      ]
    }

    // 기본 메뉴
    return [
      { to: '/', icon: Home, label: '대시보드', subMenus: [] },
      { to: '/molds', icon: Package, label: '금형 목록', subMenus: [] },
      { to: '/alerts', icon: Bell, label: '알림', subMenus: [] }
    ]
  }

  const menuItems = getMenuItems()
  const [openSubmenu, setOpenSubmenu] = useState(null)

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
          <div className="flex flex-wrap">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.to)
              const hasSubmenu = item.subMenus && item.subMenus.length > 0
              const isOpen = openSubmenu === index
              
              return (
                <div 
                  key={item.to} 
                  className="relative"
                  onMouseEnter={() => hasSubmenu && setOpenSubmenu(index)}
                  onMouseLeave={() => hasSubmenu && setOpenSubmenu(null)}
                >
                  <button
                    onClick={() => {
                      if (!hasSubmenu) {
                        navigate(item.to)
                      }
                    }}
                    className={`flex items-center px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      active
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-700 border-transparent hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    <Icon size={18} className="mr-2" />
                    {item.label}
                    {hasSubmenu && (
                      <ChevronDown 
                        size={16} 
                        className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  
                  {/* Submenu Dropdown */}
                  {hasSubmenu && isOpen && (
                    <div className="absolute top-full left-0 mt-0 w-56 bg-white border border-gray-200 rounded-b-lg shadow-xl z-50">
                      {item.subMenus.map((subItem) => (
                        <Link
                          key={subItem.to}
                          to={subItem.to}
                          onClick={() => setOpenSubmenu(null)}
                          className={`block px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            location.pathname === subItem.to
                              ? 'text-blue-600 bg-blue-50 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                            {subItem.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 키보드 단축키 도움말 모달 */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Keyboard size={20} className="text-blue-600" />
                키보드 단축키
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">대시보드</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl + H</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">금형 목록</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl + M</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">리포트</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl + R</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">단축키 도움말</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">닫기</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">ESC</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
