import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, QrCode, ArrowLeft, Loader2, AlertTriangle, Search, X } from 'lucide-react';
import api from '../../lib/api';

/**
 * PC용 QR 스캔 페이지 (plant/maker)
 * BarcodeDetector API 우선 사용, 미지원 시 jsQR 폴백
 */
export default function QrScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [moldInfo, setMoldInfo] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err) {
      console.error('[QrScan] Camera error:', err);
      setCameraError('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
    }
  }, []);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // QR 코드 감지 루프
  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    let detector = null;
    let useJsQR = false;

    // BarcodeDetector 지원 여부 확인
    if ('BarcodeDetector' in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        useJsQR = true;
      }
    } else {
      useJsQR = true;
    }

    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        let result = null;

        if (detector) {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            result = barcodes[0].rawValue;
          }
        } else if (useJsQR && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // jsQR이 동적으로 로드되어 있으면 사용
          if (window.jsQR) {
            const code = window.jsQR(imageData.data, canvas.width, canvas.height);
            if (code) result = code.data;
          }
        }

        if (result) {
          stopCamera();
          handleQrResult(result);
          return;
        }
      } catch (err) {
        console.warn('[QrScan] Detection error:', err);
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [scanning, stopCamera]);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // QR 결과 처리
  const handleQrResult = async (code) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setMoldInfo(null);

    try {
      const response = await api.get('/mobile/qrcode/scan', {
        params: { code: code.trim() }
      });

      const { mold, templates } = response.data.data;
      setMoldInfo({ mold, templates, code: code.trim() });
    } catch (err) {
      console.error('[QrScan] error:', err);
      setError(err.response?.data?.message || 'QR 코드를 인식할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 수동 입력 처리
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopCamera();
      handleQrResult(manualCode.trim());
    }
  };

  // 점검 페이지로 이동
  const goToInspection = (type) => {
    if (!moldInfo) return;
    const { mold } = moldInfo;
    if (type === 'daily') {
      navigate(`/qr/daily-inspection/new/${mold.id}`);
    } else {
      navigate(`/qr/periodic-inspection/new/${mold.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <QrCode className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">QR 코드 스캔</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* 카메라 영역 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              카메라 스캔
            </h2>
            {scanning ? (
              <button onClick={stopCamera} className="text-sm text-red-600 hover:text-red-700 font-medium">
                카메라 중지
              </button>
            ) : (
              <button onClick={startCamera} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                카메라 시작
              </button>
            )}
          </div>

          <div className="relative bg-black" style={{ minHeight: 320 }}>
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full"
                  playsInline
                  muted
                  style={{ maxHeight: 400, objectFit: 'cover' }}
                />
                {/* 스캔 가이드 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-white/60 rounded-2xl" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                  QR 코드를 가이드 영역에 맞춰주세요
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-gray-400 gap-3">
                {cameraError ? (
                  <>
                    <AlertTriangle className="w-12 h-12 text-yellow-500" />
                    <p className="text-sm text-yellow-600 text-center px-4">{cameraError}</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-16 h-16" />
                    <p className="text-sm">카메라를 시작하여 QR 코드를 스캔하세요</p>
                  </>
                )}
                <button
                  onClick={startCamera}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  카메라 시작
                </button>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* 수동 입력 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Search className="w-5 h-5" />
            금형 코드 직접 입력
          </h2>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="금형 코드 또는 QR 값 입력"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              조회
            </button>
          </form>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">금형 정보를 조회 중입니다...</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">조회 실패</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-400 hover:text-red-600" />
            </button>
          </div>
        )}

        {/* 금형 정보 및 점검 버튼 */}
        {moldInfo && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-green-50">
              <h2 className="font-semibold text-green-800 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                금형 정보
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">금형코드</span>
                  <p className="font-semibold text-gray-800">{moldInfo.mold.mold_code || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">품명</span>
                  <p className="font-semibold text-gray-800">{moldInfo.mold.part_name || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">품번</span>
                  <p className="font-semibold text-gray-800">{moldInfo.mold.part_number || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">상태</span>
                  <p className="font-semibold text-gray-800">{moldInfo.mold.status || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">생산처</span>
                  <p className="font-semibold text-gray-800">{moldInfo.mold.plant_name || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">누적 숏수</span>
                  <p className="font-semibold text-gray-800">
                    {moldInfo.mold.current_shot_count?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              {/* 점검 이동 버튼 */}
              <div className="pt-3 border-t flex gap-3">
                <button
                  onClick={() => goToInspection('daily')}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  일상 점검
                </button>
                <button
                  onClick={() => goToInspection('periodic')}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition"
                >
                  정기 점검
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 재스캔 버튼 */}
        {(moldInfo || error) && !scanning && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                setMoldInfo(null);
                setError(null);
                startCamera();
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              다시 스캔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
