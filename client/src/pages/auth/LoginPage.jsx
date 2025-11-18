import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../lib/api'

function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/auth/login', formData)
      const { token, refreshToken, user } = response.data.data

      setAuth(user, token, refreshToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error?.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary-600 mb-2">CAMS</h1>
        <p className="text-gray-600">Creative Auto Module System</p>
        <p className="text-sm text-gray-500 mt-1">금형 관리 시스템</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            사용자 ID
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="input"
            placeholder="사용자 ID를 입력하세요"
            required
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            placeholder="비밀번호를 입력하세요"
            required
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              로그인 중...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              로그인
            </>
          )}
        </button>
      </form>

      {/* Test Accounts */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center mb-3">테스트 계정</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <p className="font-medium text-gray-700">관리자</p>
            <p className="text-gray-500">admin / password123</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="font-medium text-gray-700">작업자</p>
            <p className="text-gray-500">worker1 / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
