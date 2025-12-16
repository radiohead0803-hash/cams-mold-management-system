import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import QRScanner from '../../components/mobile/QRScanner';
import { recentActions } from '../../utils/mobileStorage';

export default function QrScanPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleScan = async (code) => {
    if (!code.trim()) {
      setError('금형 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/mobile/qrcode/scan', {
        params: { code: code.trim() }
      });

      const { mold, templates } = response.data.data;

      // 최근 작업 기록 저장
      await recentActions.add(
        mold.id,
        mold.mold_code || mold.part_number,
        'qr_scan',
        `QR 스캔: ${mold.part_name || mold.mold_code}`
      );

      // QR 스캔 로그 기록
      try {
        await api.post('/mobile/qr/scan-log', {
          qr_code: code.trim(),
          mold_id: mold.id,
          scan_result: 'success'
        });
      } catch (logErr) {
        console.warn('[QrScan] Log error:', logErr);
      }

      // 점검 종류 선택 페이지로 이동
      navigate('/mobile/checklist-select', {
        state: { mold, templates }
      });

    } catch (err) {
      console.error('[QrScan] error:', err);
      const errorMsg = err.response?.data?.message || 
        'QR 코드를 인식할 수 없습니다. 다시 시도해주세요.';
      setError(errorMsg);

      // 실패 로그 기록
      try {
        await api.post('/mobile/qr/scan-log', {
          qr_code: code.trim(),
          scan_result: 'fail',
          error_message: errorMsg
        });
      } catch (logErr) {
        console.warn('[QrScan] Log error:', logErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = (code) => {
    handleScan(code);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>금형 정보 조회 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white rounded-full bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">QR 스캔</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-10 p-3 bg-red-500/90 text-white rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* QR 스캐너 */}
      <QRScanner
        onScan={handleScan}
        onManualInput={handleManualInput}
        debounceMs={1500}
      />
    </div>
  );
}
