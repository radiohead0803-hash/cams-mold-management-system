import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'
import api from '../lib/api'
import { QrCode, Camera, X, AlertCircle, CheckCircle } from 'lucide-react'
import jsQR from 'jsqr'

// 역할별 라우팅 함수
const navigateByRole = (navigate, role) => {
  switch (role) {
    case 'developer':
    case 'hq':
      navigate('/mobile/qr-scan') // 본사 → QR 스캔 페이지
      break
    case 'maker':
      navigate('/mobile/qr-scan') // 제작처 → QR 스캔 페이지
      break
    case 'production':
    case 'plant':
      navigate('/mobile/qr-scan') // 생산처 → QR 스캔 페이지
      break
    default:
      navigate('/mobile/qr-scan')
  }
}

export default function QRLogin() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [stream, setStream] = useState(null)
  const [scanInterval, setScanInterval] = useState(null)
  const [detectedQR, setDetectedQR] = useState(null)

  useEffect(() => {
    return () => {
      // Cleanup: 카메라 스트림 및 스캔 인터벌 정리
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (scanInterval) {
        clearInterval(scanInterval)
      }
    }
  }, [stream, scanInterval])

  const startCamera = async () => {
    try {
      setCameraError('')
      setDetectedQR(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // 후면 카메라 우선
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setScanning(true)
        
        // 비디오가 재생되면 자동 스캔 시작
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          startAutoScan()
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.')
    }
  }

  const startAutoScan = () => {
    const interval = setInterval(() => {
      scanQRCode()
    }, 300) // 300ms마다 스캔
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
    setDetectedQR(null)
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
        setDetectedQR(code.data)
        // QR 코드 감지 시 자동 로그인 시도
        handleQRDetected(code.data)
      }
    }
  }

  const handleQRDetected = async (qrData) => {
    // 중복 처리 방지
    if (detectedQR === qrData) return
    
    stopCamera()
    await handleManualQRInput(qrData)
  }

  // QR 스캔 처리 - 금형 정보 조회 후 금형 페이지로 이동
  const handleManualQRInput = async (qrValue) => {
    try {
      setError('')
      
      console.log('[QRLogin] Scanning QR code:', qrValue)
      
      // QR 스캔 API 호출 (신규 엔드포인트)
      const response = await api.post('/api/v1/mobile/qr/scan', { 
        code: qrValue
      })
      
      console.log('[QRLogin] QR scan response:', response.data)
      
      if (response.data.success) {
        const { mold, templates } = response.data.data
        
        // 금형 정보를 localStorage에 저장
        localStorage.setItem('cams_scanned_mold', JSON.stringify({
          mold,
          templates,
          scannedAt: new Date().toISOString()
        }))
        
        // 현재 로그인된 사용자 역할 확인
        const authStore = useAuthStore.getState()
        const userRole = authStore.user?.role || 'production'
        
        console.log('[QRLogin] Navigating to mold page:', mold.id, 'role:', userRole)
        
        // 금형 개요 페이지로 이동
        navigate(`/mobile/molds/${mold.id}`, {
          state: { 
            role: userRole,
            mold: {
              ...mold,
              shotRate: mold.maxShots > 0 ? Math.round((mold.shotCounter / mold.maxShots) * 100) : 0
            }
          }
        })
      }
    } catch (err) {
      console.error('[QRLogin] QR scan error:', err)
      const errorMsg = err.response?.data?.message || 'QR 스캔에 실패했습니다.'
      setError(errorMsg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <QrCode className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            QR 코드 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            금형 QR 코드를 스캔하여 로그인하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <p className="ml-3 text-sm text-yellow-800">{cameraError}</p>
            </div>
          </div>
        )}

        {/* 카메라 뷰 */}
        {scanning ? (
          <div className="card">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* 스캔 가이드 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-white border-dashed rounded-lg opacity-50 animate-pulse"></div>
              </div>

              {/* 스캔 상태 표시 */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  {detectedQR ? (
                    <>
                      <CheckCircle size={16} className="text-green-400" />
                      <span>QR 코드 감지됨!</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>QR 코드를 스캔 중...</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs text-center text-gray-600">
                QR 코드가 자동으로 감지되면 즉시 로그인됩니다
              </p>
              <button
                onClick={stopCamera}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <X size={20} />
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="card space-y-4">
            <button
              onClick={startCamera}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              카메라 시작
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <Link to="/login" className="btn-secondary w-full text-center block">
              일반 로그인
            </Link>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <QrCode className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">QR 로그인 안내</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside text-xs">
                <li>금형에 부착된 QR 코드를 스캔하세요</li>
                <li>QR 코드 스캔 시 자동으로 로그인됩니다</li>
                <li>GPS 위치가 자동으로 기록됩니다</li>
                <li>세션은 8시간 동안 유지됩니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 개발 테스트용: 빠른 로그인 */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔧</span>
            <p className="font-semibold text-purple-900">개발 테스트용 - 빠른 로그인</p>
          </div>
          
          <div className="space-y-2 mb-4">
            <button
              onClick={async () => {
                try {
                  const response = await authAPI.login({ username: 'developer', password: 'dev123' });
                  const { token, user } = response.data.data;
                  login(user, token);
                  console.log('[QRLogin] Quick login - developer:', user);
                  navigateByRole(navigate, user.role || 'developer');
                } catch (err) {
                  console.error('[QRLogin] Quick login error:', err);
                  setError('로그인 실패');
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-purple-900">금형개발 담당자</div>
                  <div className="text-xs text-purple-600">developer / 본사</div>
                </div>
                <div className="text-2xl">👨‍💼</div>
              </div>
            </button>

            <button
              onClick={async () => {
                try {
                  const response = await authAPI.login({ username: 'maker1', password: 'maker123' });
                  const { token, user } = response.data.data;
                  login(user, token);
                  console.log('[QRLogin] Quick login - maker:', user);
                  navigateByRole(navigate, user.role || 'maker');
                } catch (err) {
                  console.error('[QRLogin] Quick login error:', err);
                  setError('로그인 실패');
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-purple-900">제작처 담당자</div>
                  <div className="text-xs text-purple-600">maker1 / A제작소</div>
                </div>
                <div className="text-2xl">🏭</div>
              </div>
            </button>

            <button
              onClick={async () => {
                try {
                  const response = await authAPI.login({ username: 'plant1', password: 'plant123' });
                  const { token, user } = response.data.data;
                  login(user, token);
                  console.log('[QRLogin] Quick login - plant:', user);
                  navigateByRole(navigate, user.role || 'plant');
                } catch (err) {
                  console.error('[QRLogin] Quick login error:', err);
                  setError('로그인 실패');
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-purple-900">생산처 담당자</div>
                  <div className="text-xs text-purple-600">plant1 / 생산공장1</div>
                </div>
                <div className="text-2xl">🏭</div>
              </div>
            </button>
          </div>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600">QR 코드 테스트</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => handleManualQRInput('QR-MOLD-001')}
              className="text-left px-3 py-2 bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors"
            >
              <div className="text-xs font-semibold text-purple-900">금형 #001</div>
              <div className="text-xs text-purple-600">QR-MOLD-001</div>
            </button>
            <button
              onClick={() => handleManualQRInput('QR-MOLD-002')}
              className="text-left px-3 py-2 bg-white border border-purple-300 rounded hover:bg-purple-50 transition-colors"
            >
              <div className="text-xs font-semibold text-purple-900">금형 #002</div>
              <div className="text-xs text-purple-600">QR-MOLD-002</div>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="QR 코드 값 입력 (예: QR-MOLD-003)"
              className="input text-sm flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleManualQRInput(e.target.value)
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
