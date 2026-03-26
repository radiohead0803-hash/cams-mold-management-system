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

  // 모바일 레이아웃 — 화면 꽉 채움, 큰 터치 타겟
  if (isMobile) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
        {/* 상단 로고 영역 — 화면 40% */}
        <div className="flex-[2] flex flex-col items-center justify-center px-8">
          <div className="w-24 h-24 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center mb-5 shadow-2xl">
            <Smartphone className="text-white" size={44} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">CAMS</h1>
          <p className="text-blue-100 mt-2 text-base">금형관리 시스템</p>
        </div>

        {/* 하단 로그인 폼 — 화면 60%, 흰색 라운드 카드 */}
        <div className="flex-[3] bg-white rounded-t-[2.5rem] px-7 pt-10 pb-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">로그인</h2>
          <p className="text-base text-gray-500 mb-8">아이디와 비밀번호를 입력하세요</p>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 mb-5">
              <p className="text-base text-red-600 text-center font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 flex-1">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">아이디</label>
              <input
                type="text" required placeholder="사번 또는 업체코드"
                value={username} onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">비밀번호</label>
              <input
                type="password" required placeholder="비밀번호 입력"
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl active:bg-blue-800 disabled:opacity-50 transition-all text-lg shadow-xl shadow-blue-600/30 active:scale-[0.97]">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          {/* QR 로그인 */}
          <div className="text-center mt-6">
            <Link to="/mobile/qr-login" className="inline-flex items-center gap-2 text-base text-blue-600 font-semibold active:text-blue-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              QR 코드로 로그인
            </Link>
          </div>

          {/* 하단 */}
          <p className="text-center text-sm text-gray-400 mt-auto pt-4">CAMS v2.0</p>
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
