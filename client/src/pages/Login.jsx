import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'
import { Smartphone } from 'lucide-react'
import { isMobileDevice } from '../utils/deviceDetect'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()
  
  // 모바일 감지 (다중 신호 기반 — 터치, 화면크기, UA, Client Hints)
  const isMobile = isMobileDevice()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)
      if (result.success) {
        const role = result.user.role || result.user.user_type
        navigate(isMobile ? '/mobile/home' : getDashboardPath(role))
      } else {
        setError(result.error || '로그인에 실패했습니다')
      }
    } catch (err) {
      setError(err?.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 모바일 레이아웃 (밝은 테마, 가독성 향상)
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* 상단 그라디언트 헤더 */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 pt-16 pb-12 px-6 rounded-b-[2rem]">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Smartphone className="text-white" size={36} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">CAMS</h1>
            <p className="text-blue-100 mt-1 text-sm">금형관리 시스템</p>
          </div>
        </div>

        {/* 로그인 폼 영역 */}
        <div className="flex-1 px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">로그인</h2>
            <p className="text-sm text-gray-500 mb-5">아이디와 비밀번호를 입력하세요</p>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4">
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
                <input
                  type="text" required placeholder="사번 또는 업체코드 입력"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-base transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
                <input
                  type="password" required placeholder="비밀번호 입력"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white text-base transition-colors"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all text-base shadow-lg shadow-blue-600/30 active:scale-[0.98]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    로그인 중...
                  </span>
                ) : '로그인'}
              </button>
            </form>
          </div>

          {/* QR 로그인 */}
          <div className="text-center mt-6">
            <Link to="/mobile/qr-login" className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 active:text-blue-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              QR 코드로 로그인
            </Link>
          </div>

          {/* 하단 안내 */}
          <div className="text-center mt-8 mb-6">
            <p className="text-xs text-gray-400">CAMS v2.0 | 금형관리 전산시스템</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            CAMS 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            금형관리 시스템
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input"
                placeholder="사용자명"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/qr-login"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              QR 코드로 로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// 역할별 대시보드 경로 결정
function getDashboardPath(role) {
  switch (role) {
    case 'system_admin':
      return '/dashboard/admin'
    case 'mold_developer':
      return '/dashboard/developer'
    case 'staff':
      return '/dashboard/developer'
    case 'maker':
      return '/dashboard/maker'
    case 'plant':
      return '/dashboard/plant'
    default:
      return '/'
  }
}
