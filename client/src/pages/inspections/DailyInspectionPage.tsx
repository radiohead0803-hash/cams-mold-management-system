// client/src/pages/inspections/DailyInspectionPage.tsx
import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { submitDailyInspection } from '../../api/inspectionApi';

interface LocationState {
  mold?: {
    id: number;
    code: string;
    name?: string;
  };
}

export default function DailyInspectionPage() {
  const navigate = useNavigate();
  const { sessionId, moldId } = useParams<{ sessionId: string; moldId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [productionQuantity, setProductionQuantity] = useState<number>(0);
  const [ngQuantity, setNgQuantity] = useState<number>(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionId || !moldId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await submitDailyInspection({
        sessionId,
        moldId: Number(moldId),
        productionQuantity,
        ngQuantity,
        checklistItems: [], // 체크리스트 V2 붙일 때 여기 채우면 됨
        note,
      });

      setSuccess('일상점검이 저장되었습니다. 금형 타수와 점검 스케줄이 자동 업데이트 됩니다.');
      // 점검 후 다시 QR 화면 또는 대시보드로
      setTimeout(() => {
        navigate('/dashboard/plant', { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        '일상점검 저장 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const moldLabel =
    state?.mold?.code ??
    (moldId ? `금형 ID ${moldId}` : '금형');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center">
      <div className="w-full max-w-xl mt-10 px-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">
            일상점검 등록
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {moldLabel} 에 대한 일상점검 결과와 생산수량을 입력하세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              생산수량 (Shot)
            </label>
            <input
              type="number"
              min={0}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={productionQuantity}
              onChange={(e) => setProductionQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              NG 수량
            </label>
            <input
              type="number"
              min={0}
              className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={ngQuantity}
              onChange={(e) => setNgQuantity(Number(e.target.value))}
            />
          </div>

          {/* TODO: 체크리스트 항목은 추후 마스터 기반으로 동적 생성 */}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              비고
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="특이사항이나 NG 항목을 간단히 기록하세요."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl px-3 py-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white text-sm font-medium py-2.5 mt-1 shadow-lg shadow-sky-500/40 transition-all"
          >
            {loading ? '저장 중…' : '일상점검 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
