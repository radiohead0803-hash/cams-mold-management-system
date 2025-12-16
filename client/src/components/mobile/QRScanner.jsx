/**
 * QR 스캐너 컴포넌트
 * - 카메라 권한 처리
 * - 수동 입력 대체 경로
 * - 토치(플래시) 지원
 * - 스캔 디바운스
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Flashlight, FlashlightOff, Keyboard, X, AlertTriangle, RefreshCw } from 'lucide-react';

// 카메라 권한 상태
const CAMERA_STATUS = {
  CHECKING: 'checking',
  GRANTED: 'granted',
  DENIED: 'denied',
  NOT_SUPPORTED: 'not_supported',
  HTTPS_REQUIRED: 'https_required'
};

export default function QRScanner({ 
  onScan, 
  onError,
  onManualInput,
  debounceMs = 1000 
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanRef = useRef(0);

  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.CHECKING);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 카메라 권한 확인
  const checkCameraPermission = useCallback(async () => {
    // HTTPS 체크
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setCameraStatus(CAMERA_STATUS.HTTPS_REQUIRED);
      setErrorMessage('카메라 사용을 위해 HTTPS 연결이 필요합니다.');
      return false;
    }

    // 카메라 API 지원 체크
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus(CAMERA_STATUS.NOT_SUPPORTED);
      setErrorMessage('이 브라우저는 카메라를 지원하지 않습니다.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      // 토치 지원 확인
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      setTorchSupported(capabilities?.torch === true);
      
      streamRef.current = stream;
      setCameraStatus(CAMERA_STATUS.GRANTED);
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraStatus(CAMERA_STATUS.DENIED);
        setErrorMessage('카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
      } else if (error.name === 'NotFoundError') {
        setCameraStatus(CAMERA_STATUS.NOT_SUPPORTED);
        setErrorMessage('카메라를 찾을 수 없습니다.');
      } else {
        setCameraStatus(CAMERA_STATUS.DENIED);
        setErrorMessage(`카메라 오류: ${error.message}`);
      }
      
      return false;
    }
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      setScanning(true);
    }
  }, []);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // 토치 토글
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;

    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }]
      });
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error('Torch toggle error:', error);
    }
  }, [torchEnabled, torchSupported]);

  // QR 코드 스캔 (BarcodeDetector API 사용)
  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !scanning) return;

    // 디바운스 체크
    const now = Date.now();
    if (now - lastScanRef.current < debounceMs) return;

    try {
      // BarcodeDetector API 지원 확인
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(videoRef.current);
        
        if (barcodes.length > 0) {
          lastScanRef.current = now;
          const code = barcodes[0].rawValue;
          
          // 진동 피드백
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          onScan?.(code);
        }
      } else {
        // BarcodeDetector 미지원 시 대체 로직 필요
        console.warn('BarcodeDetector not supported');
      }
    } catch (error) {
      console.error('QR scan error:', error);
    }
  }, [scanning, debounceMs, onScan]);

  // 수동 입력 제출
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onManualInput?.(manualCode.trim());
      setManualCode('');
      setShowManualInput(false);
    }
  };

  // 초기화
  useEffect(() => {
    checkCameraPermission().then(granted => {
      if (granted) {
        startCamera();
      }
    });

    return () => {
      stopCamera();
    };
  }, [checkCameraPermission, startCamera, stopCamera]);

  // 스캔 루프
  useEffect(() => {
    if (!scanning) return;

    const interval = setInterval(scanQRCode, 200);
    return () => clearInterval(interval);
  }, [scanning, scanQRCode]);

  // 권한 거부 화면
  if (cameraStatus === CAMERA_STATUS.DENIED || 
      cameraStatus === CAMERA_STATUS.NOT_SUPPORTED ||
      cameraStatus === CAMERA_STATUS.HTTPS_REQUIRED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-100 rounded-xl">
        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">카메라 사용 불가</h3>
        <p className="text-sm text-gray-600 text-center mb-6">{errorMessage}</p>
        
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => checkCameraPermission()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </button>
          
          <button
            onClick={() => setShowManualInput(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg"
          >
            <Keyboard className="w-5 h-5" />
            QR 코드 직접 입력
          </button>
        </div>
      </div>
    );
  }

  // 수동 입력 모달
  if (showManualInput) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">QR 코드 직접 입력</h3>
            <button onClick={() => setShowManualInput(false)} className="p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleManualSubmit}>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="금형 코드 또는 QR 코드 입력"
              className="w-full px-4 py-3 border rounded-lg mb-4 text-lg"
              autoFocus
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 카메라 뷰 */}
      <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* 스캔 가이드 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
          </div>
        </div>

        {/* 스캔 라인 애니메이션 */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 relative overflow-hidden">
              <div className="absolute w-full h-0.5 bg-blue-500 animate-scan" />
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {torchSupported && (
          <button
            onClick={toggleTorch}
            className={`p-4 rounded-full ${torchEnabled ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {torchEnabled ? <Flashlight className="w-6 h-6" /> : <FlashlightOff className="w-6 h-6" />}
          </button>
        )}
        
        <button
          onClick={() => setShowManualInput(true)}
          className="p-4 rounded-full bg-gray-200 text-gray-700"
        >
          <Keyboard className="w-6 h-6" />
        </button>
      </div>

      {/* 안내 텍스트 */}
      <p className="text-center text-sm text-gray-500 mt-4">
        QR 코드를 사각형 안에 맞춰주세요
      </p>

      {/* 숨겨진 캔버스 (이미지 처리용) */}
      <canvas ref={canvasRef} className="hidden" />

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
