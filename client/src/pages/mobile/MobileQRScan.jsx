import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authAPI } from '../../lib/api'
import api from '../../lib/api'
import { 
  QrCode, User, Lock, AlertCircle, CheckCircle, 
  ChevronRight, Eye, EyeOff, Loader2
} from 'lucide-react'

/**
 * 외부 QR 스캔 앱 (네이버 등)에서 접속하는 페이지
 * URL: /m/qr/{qrCode} 또는 /m/qr?code={qrCode}
 * 
 * 플로우:
 * 1. QR 스캔 → URL 접속
 * 2. 금형 정보 확인
 * 3. 로그인 (아이디/패스워드)
 * 4. 역할별 대시보드로 이동
 */
export default function MobileQRScan() {
  const { qrCode: paramCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, user, isAuthenticated } = useAuthStore()

  // QR 코드 (URL 파라미터 또는 쿼리스트링)
  const qrCode = paramCode || searchParams.get('code') || ''

  // 상태
  const [mold, setMold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 로그인 폼
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // 금형 정보 조회
  useEffect(() => {
    if (qrCode) {
      fetchMoldByQR()
    } else {
      setLoading(false)
      setError('QR 코드가 없습니다.')
    }
  }, [qrCode])

  // 이미 로그인된 경우 바로 이동
  useEffect(() => {
    if (isAuthenticated && user && mold) {
      navigateToWorkspace(mold, user)
    }
  }, [isAuthenticated, user, mold])

  const fetchMoldByQR = async () => {
    setLoading(true)
    setError('')
    
    try {
      // QR 코드로 금형 검색
      const response = await api.get(`/api/v1/mobile/molds/by-qr/${encodeURIComponent(qrCode)}`)
      
      if (response.data.success && response.data.data) {
        setMold(response.data.data)
      } else {
        setError('금형을 찾을 수 없습니다.')
      }
    } catch (err) {
      console.error('Mold fetch error:', err)
      
      // ID로 재시도
      if (/^\d+$/.test(qrCode) || qrCode.startsWith('MOLD-')) {
        try {
          const id = qrCode.startsWith('MOLD-') ? qrCode.replace('MOLD-', '') : qrCode
          const retryRes = await api.get(`/api/v1/mobile/molds/${id}`)
          if (retryRes.data.success && retryRes.data.data) {
            setMold(retryRes.data.data)
            return
          }
        } catch (e) {}
      }
      
      setError('금형을 찾을 수 없습니다. QR 코드를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const response = await authAPI.login({ username, password })
      const { token, user: userData } = response.data.data
      
      login(userData, token)
      navigateToWorkspace(mold, userData)
    } catch (err) {
      console.error('Login error:', err)
      setLoginError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoginLoading(false)
    }
  }

  const navigateToWorkspace = (moldData, userData) => {
    const role = userData.user_type || userData.role
    
    // 역할별 금형 상세 페이지로 이동
    navigate(`/mobile/mold/${moldData.id}`, {
      state: {
        mold: moldData,
        role,
        user: userData,
        fromQR: true
      }
    })
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">금형 정보 확인 중...</p>
          <p className="text-sm text-blue-200 mt-2">QR: {qrCode}</p>
        </div>
      </div>
    )
  }

  // 에러 (금형 없음)
  if (error || !mold) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">금형을 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-4">{error || 'QR 코드를 확인해주세요.'}</p>
          <p className="text-sm text-gray-400 mb-6">QR 코드: {qrCode}</p>
          <button
            onClick={() => navigate('/mobile/qr-login')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            QR 스캔 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 pb-20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="w-6 h-6" />
          <span className="text-sm font-medium">CAMS 모바일</span>
        </div>
        <h1 className="text-xl font-bold text-center">금형 정보 확인</h1>
      </div>

      {/* 금형 정보 카드 */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-medium">금형 인식 완료</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">QR 코드</span>
              <span className="font-bold text-blue-600">{mold.qr_code || `MOLD-${mold.id}`}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">부품명</span>
              <span className="font-medium">{mold.part_name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">차종</span>
              <span className="font-medium">{mold.car_model || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">금형코드</span>
              <span className="font-medium">{mold.mold_code || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">상태</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                mold.status === 'active' || mold.status === 'production' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {mold.status === 'active' ? '사용중' : mold.status || '대기'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 로그인 폼 */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-1">로그인</h2>
          <p className="text-sm text-gray-500 mb-4">업무 수행을 위해 로그인해주세요</p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디 입력"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* 테스트 계정 안내 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">테스트 계정</p>
            <div className="space-y-1 text-xs">
              <p><span className="font-medium">금형개발:</span> developer / dev123</p>
              <p><span className="font-medium">제작처:</span> maker1 / maker123</p>
              <p><span className="font-medium">생산처:</span> plant1 / plant123</p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-gray-400">
          로그인 후 역할에 맞는 업무 화면으로 이동합니다
        </p>
      </div>
    </div>
  )
}
