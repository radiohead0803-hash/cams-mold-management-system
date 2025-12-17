// client/src/pages/qr/PeriodicInspectionPage.tsx
import { FormEvent, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { submitPeriodicInspection } from '../../api/inspectionApi';

type CycleType = '20K' | '100K' | '400K' | '800K';

interface LocationState {
  mold?: {
    id: number;
    code: string;
    name?: string;
  };
}

export default function PeriodicInspectionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const moldId = Number(searchParams.get('moldId') || 0);
  const location = useLocation();
  const state = location.state as LocationState | null;

  const navigate = useNavigate();
  const [cycleType, setCycleType] = useState<CycleType>('20K');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState([
    { code: 'PARTING_LINE', measuredValue: 0 },
    { code: 'GUIDE_PIN', measuredValue: 0 },
    { code: 'COOLING', measuredValue: 0 },
  ]);

  const handleChangeMeasured = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, measuredValue: value } : item
      )
    );
  };

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
    setSuccess(null);
    setError(null);

    try {
      await submitPeriodicInspection({
        sessionId,
        moldId,
        cycleType,
        items: items.map((item) => ({
          code: item.code,
          measuredValue: item.measuredValue,
        })),
        note,
      });

      setSuccess('정기점검이 저장되었습니다. NG/Critical NG 결과는 자동으로 반영됩니다.');
      setTimeout(() => {
        navigate(-1);
      }, 1500);
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

  const moldLabel =
    state?.mold?.code ??
    (moldId ? `금형 ID ${moldId}` : '금형');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center">
      <div className="w-full max-w-xl mt-10 px-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">
            정기점검 등록
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {moldLabel} 에 대한 정기점검 결과를 입력하세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 space-y-4"
        >
          <div>
            <div className="block text-xs font-medium text-slate-300 mb-1">
              점검 주기
            </div>
            <div className="flex flex-wrap gap-2">
              {(['20K', '100K', '400K', '800K'] as CycleType[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycleType(c)}
                  className={`px-3 py-1.5 rounded-2xl text-xs border ${
                    cycleType === c
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-950 text-slate-200 border-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="block text-xs font-medium text-slate-300 mb-1">
              측정 항목
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between gap-2 bg-slate-950 rounded-2xl px-3 py-2 border border-slate-800"
                >
                  <div className="text-xs text-slate-300">{item.code}</div>
                  <input
                    type="number"
                    step="0.01"
                    className="w-24 rounded-xl bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-right"
                    value={item.measuredValue}
                    onChange={(e) =>
                      handleChangeMeasured(index, Number(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              비고
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-2xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="특이사항, NG 사유 등을 기록하세요."
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
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-white text-sm font-medium py-2.5 mt-1 shadow-lg shadow-emerald-500/40 transition-all"
          >
            {loading ? '저장 중…' : '정기점검 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
