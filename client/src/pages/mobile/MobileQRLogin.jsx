import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authAPI } from '../../lib/api'
import api from '../../lib/api'
import { QrCode, Camera, X, AlertCircle, CheckCircle, User, Lock, ChevronRight } from 'lucide-react'
import jsQR from 'jsqr'

/**
 * 모바일 QR 로그인 페이지
 * 플로우: QR 스캔 → 로그인 → 역할별 금형 정보 제공
 */
export default function MobileQRLogin() {
  const navigate = useNavigate()
  const { login, setAuth, user, isAuthenticated } = useAuthStore()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // 단계 관리: 'scan' | 'login' | 'complete'
  const [step, setStep] = useState('scan')
  
  // QR 스캔 상태
  const [scanning, setScanning] = useState(false)
  const [stream, setStream] = useState(null)
  const [scanInterval, setScanInterval] = useState(null)
  const [scannedMold, setScannedMold] = useState(null)
  
  // 로그인 상태
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  
  // 공통 상태
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [moldList, setMoldList] = useState([])
  const [loadingMolds, setLoadingMolds] = useState(false)
  const [manualCode, setManualCode] = useState('')

  // 이미 로그인된 경우 스캔 단계로
  useEffect(() => {
    if (isAuthenticated && user) {
      setStep('scan')
    }
  }, [isAuthenticated, user])

  // DB에서 금형 목록 가져오기
  useEffect(() => {
    fetchMoldList()
  }, [])

  const fetchMoldList = async () => {
    setLoadingMolds(true)
    try {
      // 모바일 전용 공개 API 사용 (인증 불필요)
      const response = await api.get('/api/v1/mobile/molds/list?limit=10')
      if (response.data.success && response.data.data) {
        const molds = Array.isArray(response.data.data) 
          ? response.data.data 
          : []
        setMoldList(molds.slice(0, 8))
      }
    } catch (err) {
      console.log('[MobileQRLogin] Failed to fetch molds:', err.message)
    } finally {
      setLoadingMolds(false)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (scanInterval) {
        clearInterval(scanInterval)
      }
    }
  }, [stream, scanInterval])

  // ========== QR 스캔 관련 ==========
  const startCamera = async () => {
    try {
      setCameraError('')
      setError('')

      // HTTPS 및 카메라 API 지원 체크
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setCameraError('카메라 사용을 위해 HTTPS 연결이 필요합니다. 주소창이 https://로 시작하는지 확인하세요.')
        return
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('이 브라우저는 카메라를 지원하지 않습니다. Chrome 또는 Samsung Internet을 사용해주세요.')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })

      // 먼저 scanning=true → 다음 렌더에서 video 태그가 DOM에 나타남
      setStream(mediaStream)
      setScanning(true)

      // DOM 업데이트 후 video에 스트림 연결 (setTimeout으로 다음 프레임 보장)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().then(() => {
            console.log('[QR] Camera playing')
            startAutoScan()
          }).catch(err => {
            console.error('[QR] play() failed:', err)
            setCameraError('카메라 재생 실패: ' + err.message)
          })
        } else {
          console.error('[QR] videoRef is null after scanning=true')
          setCameraError('카메라 초기화 실패. 다시 시도해주세요.')
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('카메라를 찾을 수 없습니다.')
      } else {
        setCameraError('카메라에 접근할 수 없습니다.')
      }
    }
  }

  const startAutoScan = () => {
    const interval = setInterval(() => {
      scanQRCode()
    }, 300)
    setScanInterval(interval)
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (scanInterval) {
      clearInterval(scanInterval)
      setScanInterval(null)
    }
    setScanning(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code) {
        handleQRDetected(code.data)
      }
    }
  }

  const handleQRDetected = async (qrCode) => {
    stopCamera()
    setError('')
    
    try {
      let moldData = null

      // 1. QR 코드로 금형 검색 (MOLD-21, mold_code, 또는 ID)
      try {
        const response = await api.get(`/api/v1/mobile/molds/by-qr/${encodeURIComponent(qrCode)}`)
        if (response.data.success && response.data.data) {
          moldData = response.data.data
        }
      } catch (e) {
        console.log('QR search failed:', e.message)
      }

      // 2. 숫자만 입력된 경우 ID로 검색
      if (!moldData && /^\d+$/.test(qrCode)) {
        try {
          const specRes = await api.get(`/api/v1/mobile/molds/${qrCode}`)
          if (specRes.data.success && specRes.data.data) {
            moldData = specRes.data.data
          }
        } catch (e) {
          console.log('ID search failed:', e.message)
        }
      }

      if (moldData) {
        // QR 코드 설정
        if (!moldData.qr_code) {
          moldData.qr_code = `MOLD-${moldData.id}`
        }
        setScannedMold({ ...moldData, qrCode })
        
        // 로그인 단계로 이동 (항상 로그인 필요)
        if (isAuthenticated && user) {
          navigateToMoldPage(moldData, user)
        } else {
          setStep('login')
        }
      } else {
        setError('금형을 찾을 수 없습니다. QR 코드를 확인해주세요.')
      }
    } catch (err) {
      console.error('QR scan error:', err)
      setError(err.response?.data?.message || '금형을 찾을 수 없습니다.')
    }
  }

  // 수동 QR 코드 입력
  const handleManualInput = async (code) => {
    if (!code.trim()) return
    await handleQRDetected(code.trim())
  }

  // ========== 로그인 관련 ==========
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoginLoading(true)

    try {
      const response = await authAPI.login({ username, password })
      const { token, user: userData } = response.data.data
      
      setAuth(userData, token)
      
      // 금형이 스캔된 경우 해당 페이지로 이동
      if (scannedMold) {
        navigateToMoldPage(scannedMold, userData)
      } else {
        // 금형 스캔 없이 로그인만 한 경우
        navigateByRole(userData)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoginLoading(false)
    }
  }

  // 빠른 로그인 (테스트용)
  const quickLogin = async (testUsername, testPassword) => {
    setUsername(testUsername)
    setPassword(testPassword)
    setLoginLoading(true)
    setError('')

    try {
      const response = await authAPI.login({ username: testUsername, password: testPassword })
      const { token, user: userData } = response.data.data
      
      setAuth(userData, token)
      
      if (scannedMold) {
        navigateToMoldPage(scannedMold, userData)
      } else {
        navigateByRole(userData)
      }
    } catch (err) {
      setError('로그인 실패: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoginLoading(false)
    }
  }

  // ========== 네비게이션 ==========
  const navigateToMoldPage = (mold, userData) => {
    const role = userData.user_type || userData.role
    
    // 역할별 금형 상세 페이지로 이동
    navigate(`/mobile/mold/${mold.id}`, {
      replace: true,
      state: {
        mold,
        role,
        user: userData
      }
    })
  }

  const navigateByRole = (userData) => {
    // 로그인 후 모바일 홈으로 이동 (QR 스캔이 아닌 홈)
    navigate('/mobile/home', { replace: true })
  }

  // ========== 렌더링 ==========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-primary-600 text-white p-4 text-center">
        <QrCode className="mx-auto h-10 w-10 mb-2" />
        <h1 className="text-xl font-bold">CAMS 모바일</h1>
        <p className="text-sm text-primary-100">QR 코드 기반 금형관리</p>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex justify-center py-4 bg-white border-b">
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1 ${step === 'scan' ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'scan' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span>QR 스캔</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-1 ${step === 'login' ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'login' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span>로그인</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-1 ${step === 'complete' ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'complete' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>3</div>
            <span>작업</span>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {cameraError && (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-700">{cameraError}</p>
        </div>
      )}

      {/* 스캔된 금형 정보 */}
      {scannedMold && (
        <div className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-green-700">금형 인식 완료</span>
          </div>
          <div className="text-sm text-green-800">
            <p><strong>코드:</strong> {scannedMold.code || scannedMold.mold_code}</p>
            <p><strong>이름:</strong> {scannedMold.name || scannedMold.mold_name}</p>
            <p><strong>상태:</strong> {scannedMold.status}</p>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Step 1: QR 스캔 */}
        {step === 'scan' && (
          <div className="space-y-4">
            {/* 이미 로그인된 경우 표시 */}
            {isAuthenticated && user && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{user.name}</strong>님으로 로그인됨 ({user.user_type || user.role})
                </p>
              </div>
            )}

            {/* 카메라 뷰 */}
            {scanning ? (
              <div className="bg-black rounded-2xl overflow-hidden relative" style={{ height: '60vh', maxHeight: '500px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* 스캔 가이드 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 relative">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />
                  </div>
                </div>

                {/* 안내 텍스트 */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">QR 코드를 사각형 안에 맞춰주세요</span>
                </div>
              </div>
            ) : (
              <button
                onClick={startCamera}
                className="w-full py-4 bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <Camera className="w-6 h-6" />
                카메라로 QR 스캔
              </button>
            )}

            {scanning && (
              <button
                onClick={stopCamera}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                취소
              </button>
            )}

            {/* 수동 입력 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">또는 직접 입력</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="금형 코드 입력 (예: M2024-001)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualInput(manualCode)
                  }
                }}
              />
              <button
                onClick={() => handleManualInput(manualCode)}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium"
              >
                검색
              </button>
            </div>

            {/* DB 금형 목록 */}
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">등록된 금형 목록 (DB)</span>
              </div>
            </div>

            {loadingMolds ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                금형 목록 로딩 중...
              </div>
            ) : moldList.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {moldList.map((mold) => (
                  <button
                    key={mold.id}
                    onClick={() => handleManualInput(mold.qr_code || `MOLD-${mold.id}`)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
                  >
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {mold.part_name || mold.mold_name || mold.mold_code || `금형 #${mold.id}`}
                    </div>
                    <div className="text-xs text-primary-600 font-medium">
                      QR: {mold.qr_code || `MOLD-${mold.id}`}
                    </div>
                    <div className="text-xs text-gray-500">{mold.car_model || '-'} | {mold.status || 'active'}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                등록된 금형이 없습니다
              </div>
            )}
          </div>
        )}

        {/* Step 2: 로그인 */}
        {step === 'login' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <User className="mx-auto w-12 h-12 text-primary-600 mb-2" />
              <h2 className="text-lg font-bold">로그인</h2>
              <p className="text-sm text-gray-500">금형 작업을 위해 로그인해주세요</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="아이디 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="비밀번호 입력"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loginLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* 테스트용 빠른 로그인 */}
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-700 mb-3">🔧 테스트용 빠른 로그인</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => quickLogin('developer', 'dev123')}
                  className="p-3 bg-white border border-purple-300 rounded-lg text-left hover:bg-purple-50"
                >
                  <div className="font-semibold text-purple-900">금형개발 담당자</div>
                  <div className="text-xs text-purple-600">developer / 본사</div>
                </button>
                <button
                  onClick={() => quickLogin('maker1', 'maker123')}
                  className="p-3 bg-white border border-purple-300 rounded-lg text-left hover:bg-purple-50"
                >
                  <div className="font-semibold text-purple-900">제작처 담당자</div>
                  <div className="text-xs text-purple-600">maker1 / A제작소</div>
                </button>
                <button
                  onClick={() => quickLogin('plant1', 'plant123')}
                  className="p-3 bg-white border border-purple-300 rounded-lg text-left hover:bg-purple-50"
                >
                  <div className="font-semibold text-purple-900">생산처 담당자</div>
                  <div className="text-xs text-purple-600">plant1 / 생산공장1</div>
                </button>
              </div>
            </div>

            {/* 뒤로가기 */}
            <button
              onClick={() => {
                setStep('scan')
                setScannedMold(null)
              }}
              className="w-full py-3 text-gray-600 text-sm"
            >
              ← 다시 스캔하기
            </button>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="text-center text-xs text-gray-500">
          <p>금형에 부착된 QR 코드를 스캔하면</p>
          <p>역할에 맞는 작업 화면으로 이동합니다</p>
        </div>
      </div>
    </div>
  )
}
