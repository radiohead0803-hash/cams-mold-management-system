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

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 px-6 py-10">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {/* 로고/타이틀 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Smartphone className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">CAMS</h1>
            <p className="text-sm text-slate-400 mt-1">금형관리 시스템</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-3 mb-4">
              <p className="text-sm text-red-300 text-center">{error}</p>
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <input
              type="text" required placeholder="사용자명"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <input
              type="password" required placeholder="비밀번호"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors text-base">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/mobile/qr-login" className="text-sm text-blue-400 hover:text-blue-300">
              QR 코드로 로그인
            </Link>
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
