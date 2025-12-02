// client/src/pages/qr/PeriodicInspectionPage.tsx
import { FormEvent, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { submitPeriodicInspection } from '../../api/inspectionApi';

const cycleOptions = [
  { value: '20K', label: '20K 정기점검' },
  { value: '100K', label: '100K 정기점검' },
  { value: '400K', label: '400K 정기점검' },
  { value: '800K', label: '800K 정기점검' },
] as const;

export default function PeriodicInspectionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const moldId = Number(searchParams.get('moldId') || 0);

  const navigate = useNavigate();
  const [cycleType, setCycleType] =
    useState<(typeof cycleOptions)[number]['value']>('20K');
  const [measuredValue, setMeasuredValue] = useState('');
  const [specMin, setSpecMin] = useState('');
  const [specMax, setSpecMax] = useState('');
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
        inspection_type: cycleType,
        checklist_items: [
          {
            question_id: 1, // TODO: 나중에 체크리스트 마스터 연동
            answer: measuredValue,
            measured_value: Number(measuredValue),
            spec_min: specMin ? Number(specMin) : undefined,
            spec_max: specMax ? Number(specMax) : undefined,
          },
        ],
        notes: notes || undefined,
      };

      await submitPeriodicInspection(payload);
      setMessage(
        `${cycleType} 정기점검이 저장되었습니다. NG/Critical NG는 자동 판정됩니다.`,
      );
      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        '정기점검 저장 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center py-8 px-4">
      <div className="w-full max-w-xl bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-xl shadow-sky-500/20">
        <h1 className="text-xl font-semibold text-white mb-1">정기점검</h1>
        <p className="text-xs text-slate-400 mb-4">
          타수 기준 정기점검 결과를 기록합니다. 기준값 대비 NG 여부는 서버에서
          자동 판정합니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-200 mb-1">
              점검 주기
            </label>
            <select
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={cycleType}
              onChange={(e) =>
                setCycleType(e.target.value as (typeof cycleOptions)[number]['value'])
              }
            >
              {cycleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-200 mb-1">
                측정값
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-200 mb-1">
                최소값
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={specMin}
                onChange={(e) => setSpecMin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-200 mb-1">
                최대값
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={specMax}
                onChange={(e) => setSpecMax(e.target.value)}
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
