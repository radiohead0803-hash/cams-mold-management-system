// client/src/pages/qr/DailyInspectionPage.tsx
import { FormEvent, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { submitDailyInspection } from '../../api/inspectionApi';

export default function DailyInspectionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const moldId = Number(searchParams.get('moldId') || 0);

  const navigate = useNavigate();
  const [producedShots, setProducedShots] = useState('');
  const [ngShots, setNgShots] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!sessionId || !moldId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        잘못된 접근입니다. QR 스캔부터 다시 진행하세요.
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        session_id: sessionId,
        mold_id: moldId,
        production_quantity: Number(producedShots || 0),
        ng_quantity: Number(ngShots || 0),
        checklist_items: [], // 먼저 수량/메모만, 체크항목은 나중에 확장
        notes: notes || undefined,
      };

      await submitDailyInspection(payload);
      setMessage('일상점검이 저장되었습니다. 금형 타수가 자동 업데이트되었습니다.');
      setTimeout(() => {
        navigate(-1); // 이전 화면(작업 선택)으로
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        '일상점검 저장 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center py-8 px-4">
      <div className="w-full max-w-xl bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-xl shadow-sky-500/20">
        <h1 className="text-xl font-semibold text-white mb-1">일상점검</h1>
        <p className="text-xs text-slate-400 mb-4">
          생산수량과 NG 수량을 기록하면 금형 타수가 자동으로 누적됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-200 mb-1">
                생산수량 (Shot)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={producedShots}
                onChange={(e) => setProducedShots(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-200 mb-1">
                NG 수량
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={ngShots}
                onChange={(e) => setNgShots(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-200 mb-1">
              특이사항 / 메모
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 게이트 주변 번짐, 웰드라인 두드러짐 등"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}
          {message && (
            <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl px-3 py-2">
              {message}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-slate-600 text-slate-200 text-sm py-2.5"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white text-sm font-medium py-2.5 shadow-lg shadow-sky-500/40"
            >
              {loading ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
