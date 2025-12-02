// client/src/pages/qr/QrScanPage.tsx
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startQrSession, QrScanResponse } from '../../api/qrApi';

export default function QrScanPage() {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QrScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await startQrSession(qrCode.trim());
      setResult(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'QR 스캔 중 오류가 발생했습니다. (QR 코드/네트워크 확인)';
      setError(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const goAction = (action: string) => {
    if (!result) return;
    const sessionId = result.sessionId;
    const moldId = result.mold.id;

    switch (action) {
      case 'daily_inspection':
        navigate(`/qr/daily-inspection/${sessionId}?moldId=${moldId}`);
        break;
      case 'periodic_inspection':
        navigate(`/qr/periodic-inspection/${sessionId}?moldId=${moldId}`);
        break;
      case 'create_repair_request':
        navigate(`/qr/repair-request/${sessionId}?moldId=${moldId}`);
        break;
      default:
        alert(`아직 화면이 준비되지 않은 작업: ${action}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-sky-500/20">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-white">
            QR 스캔 / 금형 조회
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            모바일 카메라로 읽은 QR 코드 문자열을 아래에 입력하거나
            스캐너 입력창에 포커스 후 스캔하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">
              QR 코드 값
            </label>
            <input
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="예: M2024-001-PLANT-A-QR"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white text-sm font-medium py-2.5 transition-all shadow-lg shadow-sky-500/40"
          >
            {loading ? '조회 중…' : 'QR 조회'}
          </button>
        </form>

        {result && (
          <div className="mt-6 space-y-4">
            {/* 금형 정보 */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-slate-400">금형 코드</div>
                  <div className="text-sm font-semibold text-white">
                    {result.mold.code}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {result.mold.status}
                </span>
              </div>
              {result.mold.name && (
                <div className="text-xs text-slate-300">
                  {result.mold.name}
                </div>
              )}
              {result.mold.plantName && (
                <div className="text-[11px] text-slate-500 mt-1">
                  생산처: {result.mold.plantName}
                </div>
              )}
              {result.locationAlert?.isOutOfRange && (
                <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-2">
                  등록된 생산처 위치에서{' '}
                  {result.locationAlert.distanceKm?.toFixed(1) ?? '?'} km
                  이상 이탈했습니다. 위치 이동 여부를 확인하세요.
                </div>
              )}
            </div>

            {/* 가능한 작업 버튼 */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-300 mb-2">
                이 금형에서 수행 가능한 작업
              </div>
              <div className="flex flex-wrap gap-2">
                {result.availableActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => goAction(action)}
                    className="px-3 py-1.5 rounded-2xl text-xs font-medium bg-slate-800 hover:bg-sky-500/70 text-slate-100 hover:text-white border border-slate-600 hover:border-sky-400 transition-all"
                  >
                    {toKoreanLabel(action)}
                  </button>
                ))}
                {result.availableActions.length === 0 && (
                  <div className="text-[11px] text-slate-500">
                    현재 사용자/상태에서 가능한 작업이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toKoreanLabel(action: string) {
  switch (action) {
    case 'daily_inspection':
      return '일상점검 작성';
    case 'periodic_inspection':
      return '정기점검 작성';
    case 'create_repair_request':
      return '수리요청 작성';
    case 'tryout_check':
      return 'TRIAL / TRY-OUT 체크';
    default:
      return action;
  }
}
