import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()

  // 테스트 계정 빠른 로그인
  const quickLogin = async (testUsername, testPassword) => {
    setUsername(testUsername)
    setPassword(testPassword)
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login({ username: testUsername, password: testPassword })
      const { token, user } = response.data.data
      
      login(user, token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error?.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login({ username, password })
      const { token, user } = response.data.data
      
      login(user, token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error?.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
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
        
        {/* 테스트 계정 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            🔧 개발 테스트 계정 (클릭하여 자동 입력)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('admin', 'admin123')}
              className="text-left px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
            >
              <div className="text-xs font-semibold text-blue-900">시스템 관리</div>
              <div className="text-xs text-blue-700">admin</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('developer', 'dev123')}
              className="text-left px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
            >
              <div className="text-xs font-semibold text-blue-900">금형개발</div>
              <div className="text-xs text-blue-700">developer</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('maker1', 'maker123')}
              className="text-left px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
            >
              <div className="text-xs font-semibold text-blue-900">제작처</div>
              <div className="text-xs text-blue-700">maker1</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('plant1', 'plant123')}
              className="text-left px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
            >
              <div className="text-xs font-semibold text-blue-900">생산처</div>
              <div className="text-xs text-blue-700">plant1</div>
            </button>
          </div>
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
