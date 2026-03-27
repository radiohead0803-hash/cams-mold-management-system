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
  const { login, setAuth, user, isAuthenticated } = useAuthStore()

  // QR 코드 파싱 (URL 파라미터 또는 쿼리스트링)
  // URL이 인코딩되어 들어올 수 있으므로 디코딩 후 MOLD-{id} 추출
  const parseQRCode = (code) => {
    if (!code) return ''
    
    // URL 디코딩
    let decoded = code
    try {
      decoded = decodeURIComponent(code)
    } catch (e) {}
    
    // URL 형식인 경우 MOLD-{id} 추출
    // 예: https://...railway.app/m/qr/MOLD-55 → MOLD-55
    const urlMatch = decoded.match(/\/m\/qr\/(MOLD-\d+)/i)
    if (urlMatch) return urlMatch[1]
    
    // MOLD-{id} 형식인 경우 그대로 반환
    const moldMatch = decoded.match(/(MOLD-\d+)/i)
    if (moldMatch) return moldMatch[1]
    
    // 숫자만 있는 경우 MOLD-{id} 형식으로 변환
    if (/^\d+$/.test(decoded)) return `MOLD-${decoded}`
    
    return decoded
  }
  
  const qrCode = parseQRCode(paramCode || searchParams.get('code') || '')

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
    
    console.log('[MobileQRScan] QR Code:', qrCode)
    
    // MOLD-{id} 형식에서 ID 추출
    const extractId = (code) => {
      const match = code.match(/MOLD-(\d+)/i)
      return match ? match[1] : code
    }
    
    const moldId = extractId(qrCode)
    console.log('[MobileQRScan] Extracted ID:', moldId)
    
    try {
      // 1. 먼저 ID로 직접 조회 시도 (가장 확실한 방법)
      if (moldId && /^\d+$/.test(moldId)) {
        try {
          console.log('[MobileQRScan] Trying direct ID lookup:', moldId)
          // api.js의 baseURL이 이미 /api/v1을 포함하므로 /mobile/mold만 사용
          const idRes = await api.get(`/mobile/mold/${moldId}`)
          if (idRes.data.success && idRes.data.data) {
            console.log('[MobileQRScan] Found by ID:', idRes.data.data)
            setMold(idRes.data.data)
            return
          }
        } catch (e) {
          console.log('[MobileQRScan] ID lookup failed:', e.message)
        }
      }
      
      // 2. QR 코드로 검색
      try {
        console.log('[MobileQRScan] Trying QR code lookup:', qrCode)
        const response = await api.get(`/mobile/molds/by-qr/${encodeURIComponent(qrCode)}`)
        if (response.data.success && response.data.data) {
          console.log('[MobileQRScan] Found by QR:', response.data.data)
          setMold(response.data.data)
          return
        }
      } catch (e) {
        console.log('[MobileQRScan] QR lookup failed:', e.message)
      }
      
      setError('금형을 찾을 수 없습니다. QR 코드를 확인해주세요.')
    } catch (err) {
      console.error('[MobileQRScan] Error:', err)
      setError('금형을 찾을 수 없습니다. QR 코드를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 위치정보 가져오기
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          console.warn('Geolocation error:', error.message)
          resolve(null) // 위치 정보 실패해도 로그인은 진행
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  // 금형 위치 업데이트 API 호출
  const updateMoldLocation = async (moldId, location, userData, token) => {
    if (!location) return
    
    try {
      // /mobile/mold/:id/location API 호출 (MoldSpecification용)
      await api.post(`/mobile/mold/${moldId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        scanned_by: userData.id,
        scanned_at: new Date().toISOString(),
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('[MobileQRScan] Location updated successfully:', location)
    } catch (err) {
      console.error('[MobileQRScan] Failed to update location:', err.message)
      // 위치 업데이트 실패해도 로그인 진행
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      // 1. 위치정보 가져오기 (병렬로 시작)
      const locationPromise = getCurrentLocation()
      
      // 2. 로그인
      const response = await authAPI.login({ username, password })
      const { token, user: userData } = response.data.data
      
      // 3. 위치정보 업데이트 (로그인 성공 후)
      const location = await locationPromise
      if (location && mold) {
        await updateMoldLocation(mold.id, location, userData, token)
      }
      
      setAuth(userData, token)
      navigateToWorkspace(mold, userData)
    } catch (err) {
      console.error('Login error:', err)
      setLoginError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoginLoading(false)
    }
  }

  // 테스트 계정 자동 로그인
  const quickLogin = async (testUsername, testPassword) => {
    setUsername(testUsername)
    setPassword(testPassword)
    setLoginError('')
    setLoginLoading(true)

    try {
      // 1. 위치정보 가져오기 (병렬로 시작)
      const locationPromise = getCurrentLocation()
      
      // 2. 로그인
      const response = await authAPI.login({ username: testUsername, password: testPassword })
      const { token, user: userData } = response.data.data
      
      // 3. 위치정보 업데이트 (로그인 성공 후)
      const location = await locationPromise
      if (location && mold) {
        await updateMoldLocation(mold.id, location, userData, token)
      }
      
      setAuth(userData, token)
      navigateToWorkspace(mold, userData)
    } catch (err) {
      console.error('Quick login error:', err)
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

          {/* 테스트 계정 자동 로그인 (개발 환경에서만 표시) */}
          {import.meta.env.DEV && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm font-semibold text-purple-700 mb-3">🔧 테스트용 빠른 로그인</p>
            <div className="space-y-2">
              <button
                onClick={() => quickLogin('developer', 'dev123')}
                disabled={loginLoading}
                className="w-full p-3 bg-white border border-purple-300 rounded-lg text-left hover:bg-purple-50 disabled:opacity-50"
              >
                <div className="font-semibold text-purple-900">금형개발 담당자</div>
                <div className="text-xs text-purple-600">developer / 본사 (파란색)</div>
              </button>
              <button
                onClick={() => quickLogin('maker1', 'maker123')}
                disabled={loginLoading}
                className="w-full p-3 bg-white border border-purple-300 rounded-lg text-left hover:bg-purple-50 disabled:opacity-50"
              >
                <div className="font-semibold text-purple-900">제작처 담당자</div>
                <div className="text-xs text-purple-600">maker1 / A제작소 (주황색)</div>
              </button>
              <button
                onClick={() => quickLogin('plant1', 'plant123')}
                disabled={loginLoading}
                className="w-full p-3 bg-white border border-purple-300 rounded-lg text-left hover:bg-purple-50 disabled:opacity-50"
              >
                <div className="font-semibold text-purple-900">생산처 담당자</div>
                <div className="text-xs text-purple-600">plant1 / 생산공장1 (초록색)</div>
              </button>
            </div>
          </div>
          )}
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
