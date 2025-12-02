import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";

type TryoutStatus = "draft" | "submitted" | "approved" | "rejected";
type UserRole = "maker" | "production" | "developer" | "plant" | "hq";

interface Tryout {
  id?: number;
  mold_id: number;
  trial_no: string;
  trial_date?: string;
  status: TryoutStatus;
  machine_name?: string;
  tonnage?: number;
  resin?: string;
  resin_maker?: string;
  color?: string;
  cavity_used?: number;
  shot_weight_g?: number;
  cycle_sec?: number;
  comment?: string;
  approval_comment?: string;
}

interface Condition {
  id?: number;
  name: string;
  value?: string;
  unit?: string;
  category?: string;
  order_index: number;
}

interface Defect {
  id?: number;
  defect_type: string;
  severity?: "none" | "minor" | "major" | "critical";
  location?: string;
  description?: string;
  cause_analysis?: string;
  action_plan?: string;
  is_resolved?: boolean;
}

interface TryoutDetailResponse {
  success: boolean;
  data: {
    tryout: Tryout;
    conditions: Condition[];
    defects: Defect[];
    files: any[];
  };
}

const DEFAULT_CONDITIONS: Condition[] = [
  { name: "용융온도 (Nozzle)", unit: "℃", category: "temperature", order_index: 1 },
  { name: "실린더온도 1구", unit: "℃", category: "temperature", order_index: 2 },
  { name: "실린더온도 2구", unit: "℃", category: "temperature", order_index: 3 },
  { name: "금형온도 (고정측)", unit: "℃", category: "temperature", order_index: 4 },
  { name: "금형온도 (가동측)", unit: "℃", category: "temperature", order_index: 5 },
  { name: "사출압력", unit: "bar", category: "pressure", order_index: 10 },
  { name: "보압 1단", unit: "bar", category: "pressure", order_index: 11 },
  { name: "보압 2단", unit: "bar", category: "pressure", order_index: 12 },
  { name: "배압", unit: "bar", category: "pressure", order_index: 13 },
  { name: "사출속도 1단", unit: "mm/s", category: "speed", order_index: 20 },
  { name: "사출속도 2단", unit: "mm/s", category: "speed", order_index: 21 },
  { name: "사출시간", unit: "sec", category: "time", order_index: 30 },
  { name: "보압시간", unit: "sec", category: "time", order_index: 31 },
  { name: "냉각시간", unit: "sec", category: "time", order_index: 32 },
];

export default function TryoutPage() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuthStore();
  const role = user?.role as UserRole;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tryout, setTryout] = useState<Tryout | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);

  // TRY-OUT 회차 선택
  const [trialNo, setTrialNo] = useState<string>("T0");

  // 생산처 + 제작처만 작성/수정 가능
  const canEditRole = role === "maker" || role === "production";
  const editable =
    canEditRole &&
    (tryout?.status === "draft" || tryout?.status === "rejected");

  const canApprove = role === "developer" && tryout?.status === "submitted";

  const statusLabel = useMemo(() => {
    switch (tryout?.status) {
      case "draft":
        return "작성중";
      case "submitted":
        return "승인대기";
      case "approved":
        return "승인완료";
      case "rejected":
        return "반려";
      default:
        return "-";
    }
  }, [tryout?.status]);

  // 1) TRY-OUT 데이터 불러오기
  const fetchTryout = async (trial: string) => {
    if (!moldId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<TryoutDetailResponse>(
        `/api/v1/molds/${moldId}/tryouts/detail`,
        {
          params: { trial_no: trial },
        }
      );

      const data = res.data;
      if (data?.data?.tryout) {
        setTryout(data.data.tryout);
        setConditions(
          (data.data.conditions || []).length
            ? data.data.conditions
            : DEFAULT_CONDITIONS
        );
        setDefects(data.data.defects || []);
      } else {
        // 해당 회차 정보가 없으면 새 draft 생성 상태로 초기화
        setTryout({
          mold_id: Number(moldId),
          trial_no: trial,
          status: "draft",
        } as Tryout);
        setConditions(DEFAULT_CONDITIONS);
        setDefects([]);
      }
    } catch (err: any) {
      console.error("fetchTryout error", err);
      // 404 에러면 새로 생성 모드
      if (err.response?.status === 404) {
        setTryout({
          mold_id: Number(moldId),
          trial_no: trial,
          status: "draft",
        } as Tryout);
        setConditions(DEFAULT_CONDITIONS);
        setDefects([]);
        setError(null);
      } else {
        setError("금형육성 정보를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTryout(trialNo);
  }, [moldId, trialNo]);

  // 2) 저장
  const handleSave = async () => {
    if (!editable || !moldId || !tryout) return;
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...tryout,
        conditions,
        defects,
      };
      
      const res = await api.post(`/api/v1/molds/${moldId}/tryouts`, payload);

      if (res.data.success) {
        setTryout(res.data.data.tryout || res.data.data);
        setConditions(res.data.data.conditions || conditions);
        setDefects(res.data.data.defects || defects);
        alert("저장되었습니다.");
      }
    } catch (err) {
      console.error("save tryout error", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 3) 제출(승인요청)
  const handleSubmit = async () => {
    if (!editable || !tryout?.id) {
      alert("저장 후 제출해주세요.");
      return;
    }
    if (!confirm("이 TRY-OUT 정보를 제출하고 승인요청 하시겠습니까?")) return;

    try {
      setSaving(true);
      setError(null);
      const res = await api.post(`/api/v1/tryouts/${tryout.id}/submit`, {});
      
      if (res.data.success) {
        setTryout(res.data.data);
        alert("승인요청이 완료되었습니다.");
      }
    } catch (err) {
      console.error("submit tryout error", err);
      setError("승인요청 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 4) 승인/반려 (본사)
  const handleApprove = async () => {
    if (!canApprove || !tryout?.id) return;
    
    const useAsMass = confirm(
      "이 조건을 양산 기준 조건으로 사용하시겠습니까?\n" +
      "(금형사양에 성형 조건이 자동 반영됩니다)"
    );
    
    const comment = prompt("승인 코멘트를 입력하세요.");

    try {
      setSaving(true);
      const res = await api.post(`/api/v1/tryouts/${tryout.id}/approve`, {
        comment,
        use_as_mass_condition: useAsMass
      });
      
      if (res.data.success) {
        setTryout(res.data.data);
        alert("승인되었습니다.");
      }
    } catch (err) {
      console.error("approve tryout error", err);
      setError("승인 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!canApprove || !tryout?.id) return;
    const reason = prompt("반려 사유를 입력하세요.");
    if (!reason) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const res = await api.post(`/api/v1/tryouts/${tryout.id}/reject`, {
        comment: reason,
      });
      
      if (res.data.success) {
        setTryout(res.data.data);
        alert("반려 처리되었습니다.");
      }
    } catch (err) {
      console.error("reject tryout error", err);
      setError("반려 처리 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 5) 조건/불량 입력 핸들러
  const updateCondition = (name: string, value: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.name === name ? { ...c, value } : c))
    );
  };

  const updateDefect = (index: number, patch: Partial<Defect>) => {
    setDefects((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  };

  const addDefect = () => {
    setDefects((prev) => [
      ...prev,
      { defect_type: "", severity: "minor", is_resolved: false },
    ]);
  };

  const removeDefect = (index: number) => {
    if (!confirm("이 불량 항목을 삭제하시겠습니까?")) return;
    setDefects((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">데이터 없음</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 상단 헤더 */}
      <header className="h-14 flex items-center justify-between px-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full border flex items-center justify-center text-xs hover:bg-gray-50"
          >
            ←
          </button>
          <div>
            <div className="text-[11px] text-slate-500">TRY-OUT · 금형육성</div>
            <div className="text-sm font-semibold">
              {state?.mold?.code || `M-${moldId}`} · {state?.mold?.name || ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 상태 배지 */}
          <span
            className={
              "px-2 py-1 rounded-full text-[10px] font-medium " +
              (tryout.status === "approved"
                ? "bg-emerald-50 text-emerald-600"
                : tryout.status === "submitted"
                ? "bg-amber-50 text-amber-600"
                : tryout.status === "rejected"
                ? "bg-rose-50 text-rose-600"
                : "bg-slate-100 text-slate-600")
            }
          >
            {statusLabel}
          </span>

          {/* 버튼 그룹 */}
          {canEditRole && (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={!editable || saving}
                className="px-3 py-1 rounded-full border border-slate-300 text-[10px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                저장
              </button>
              <button
                onClick={handleSubmit}
                disabled={!editable || saving}
                className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                승인요청
              </button>
            </div>
          )}
          {canApprove && (
            <div className="flex gap-1">
              <button
                onClick={handleApprove}
                disabled={saving}
                className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] hover:bg-emerald-700 disabled:opacity-50"
              >
                승인
              </button>
              <button
                onClick={handleReject}
                disabled={saving}
                className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] hover:bg-rose-700 disabled:opacity-50"
              >
                반려
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 p-4 space-y-4 max-w-6xl mx-auto w-full">
        {error && (
          <div className="text-[11px] text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {/* 반려 코멘트 표시 */}
        {tryout.status === "rejected" && tryout.approval_comment && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px]">
            <div className="font-semibold text-rose-700 mb-1">반려 사유</div>
            <div className="text-rose-600">{tryout.approval_comment}</div>
          </div>
        )}

        {/* 1. TRY-OUT 회차 + 기본정보 */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3 text-[11px]">
          <div className="font-semibold text-sm mb-3">기본 정보</div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <div className="text-slate-500 mb-1">TRY-OUT 회차</div>
              <select
                className="border rounded-full px-3 py-1 text-[11px] bg-white"
                value={trialNo}
                onChange={(e) => setTrialNo(e.target.value)}
                disabled={saving || tryout.status !== "draft"}
              >
                <option value="T0">T0</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="PPAP">PPAP</option>
                <option value="MASS-001">MASS-001</option>
                <option value="MASS-002">MASS-002</option>
              </select>
            </div>
            <div>
              <div className="text-slate-500 mb-1">시험일자</div>
              <input
                type="date"
                className="border rounded-full px-3 py-1 text-[11px]"
                value={tryout.trial_date || ""}
                onChange={(e) =>
                  setTryout({ ...tryout, trial_date: e.target.value })
                }
                disabled={!editable}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field
              label="사용 사출기"
              value={tryout.machine_name || ""}
              onChange={(v) => setTryout({ ...tryout, machine_name: v })}
              disabled={!editable}
            />
            <Field
              label="톤수"
              value={tryout.tonnage || ""}
              onChange={(v) =>
                setTryout({ ...tryout, tonnage: Number(v) || undefined })
              }
              disabled={!editable}
            />
            <Field
              label="수지"
              value={tryout.resin || ""}
              onChange={(v) => setTryout({ ...tryout, resin: v })}
              disabled={!editable}
            />
            <Field
              label="수지 제조사"
              value={tryout.resin_maker || ""}
              onChange={(v) => setTryout({ ...tryout, resin_maker: v })}
              disabled={!editable}
            />
            <Field
              label="색상"
              value={tryout.color || ""}
              onChange={(v) => setTryout({ ...tryout, color: v })}
              disabled={!editable}
            />
            <Field
              label="사용 캐비티수"
              value={tryout.cavity_used || ""}
              onChange={(v) =>
                setTryout({ ...tryout, cavity_used: Number(v) || undefined })
              }
              disabled={!editable}
            />
            <Field
              label="샷중량(g)"
              value={tryout.shot_weight_g || ""}
              onChange={(v) =>
                setTryout({
                  ...tryout,
                  shot_weight_g: Number(v) || undefined,
                })
              }
              disabled={!editable}
            />
            <Field
              label="싸이클타임(sec)"
              value={tryout.cycle_sec || ""}
              onChange={(v) =>
                setTryout({ ...tryout, cycle_sec: Number(v) || undefined })
              }
              disabled={!editable}
            />
          </div>

          <div>
            <div className="text-slate-500 mb-1">종합 코멘트</div>
            <textarea
              className="w-full border rounded-xl px-3 py-2 text-[11px] min-h-[60px]"
              value={tryout.comment || ""}
              onChange={(e) => setTryout({ ...tryout, comment: e.target.value })}
              disabled={!editable}
              placeholder="TRY-OUT 결과 종합 의견을 입력하세요..."
            />
          </div>
        </section>

        {/* 2. 성형조건 */}
        <section className="bg-white rounded-2xl shadow-sm p-4 text-[11px] space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">성형 조건</div>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">항목</th>
                  <th className="px-3 py-2 text-left">값</th>
                  <th className="px-3 py-2 text-left">단위</th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((c, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full border rounded px-2 py-1 text-[11px]"
                        value={c.value || ""}
                        onChange={(e) => updateCondition(c.name, e.target.value)}
                        disabled={!editable}
                        placeholder="값 입력"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-500">{c.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 불량/조치 */}
        <section className="bg-white rounded-2xl shadow-sm p-4 text-[11px] space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-sm">품질 / 불량 및 조치</div>
            {editable && (
              <button
                onClick={addDefect}
                className="px-3 py-1 rounded-full border border-slate-300 text-[10px] hover:bg-gray-50"
              >
                + 불량 추가
              </button>
            )}
          </div>

          <div className="space-y-3">
            {defects.map((d, index) => (
              <div
                key={index}
                className="border rounded-xl px-3 py-3 space-y-2 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-700">불량 #{index + 1}</div>
                  {editable && (
                    <button
                      onClick={() => removeDefect(index)}
                      className="text-rose-600 text-[10px] hover:underline"
                    >
                      삭제
                    </button>
                  )}
                </div>
                
                <Field
                  label="불량 유형"
                  value={d.defect_type}
                  onChange={(v) => updateDefect(index, { defect_type: v })}
                  disabled={!editable}
                  placeholder="예: 싱크마크, 웰드라인, 변형..."
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-slate-500 mb-1">심각도</div>
                    <select
                      className="w-full border rounded px-2 py-1 text-[11px] bg-white"
                      value={d.severity || "minor"}
                      onChange={(e) =>
                        updateDefect(index, { severity: e.target.value as any })
                      }
                      disabled={!editable}
                    >
                      <option value="none">없음</option>
                      <option value="minor">경미</option>
                      <option value="major">중대</option>
                      <option value="critical">치명</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      checked={!!d.is_resolved}
                      onChange={(e) =>
                        updateDefect(index, { is_resolved: e.target.checked })
                      }
                      disabled={!editable}
                      className="w-4 h-4"
                    />
                    <span>조치 완료</span>
                  </div>
                </div>
                
                <Field
                  label="발생 위치"
                  value={d.location || ""}
                  onChange={(v) => updateDefect(index, { location: v })}
                  disabled={!editable}
                  placeholder="불량 발생 위치"
                />
                
                <div>
                  <div className="text-slate-500 mb-1">상세 설명</div>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-[11px] min-h-[40px]"
                    value={d.description || ""}
                    onChange={(e) =>
                      updateDefect(index, { description: e.target.value })
                    }
                    disabled={!editable}
                    placeholder="불량 상세 내용"
                  />
                </div>
                
                <div>
                  <div className="text-slate-500 mb-1">원인 분석</div>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-[11px] min-h-[40px]"
                    value={d.cause_analysis || ""}
                    onChange={(e) =>
                      updateDefect(index, { cause_analysis: e.target.value })
                    }
                    disabled={!editable}
                    placeholder="불량 원인 분석"
                  />
                </div>
                
                <div>
                  <div className="text-slate-500 mb-1">조치 계획</div>
                  <textarea
                    className="w-full border rounded px-2 py-1 text-[11px] min-h-[40px]"
                    value={d.action_plan || ""}
                    onChange={(e) =>
                      updateDefect(index, { action_plan: e.target.value })
                    }
                    disabled={!editable}
                    placeholder="개선 대책 및 조치 계획"
                  />
                </div>
              </div>
            ))}
            {!defects.length && (
              <div className="text-center py-8 text-slate-400">
                등록된 불량 정보가 없습니다.
                {editable && <div className="mt-2">위의 '+ 불량 추가' 버튼을 클릭하세요.</div>}
              </div>
            )}
          </div>
        </section>

        {/* 4. 첨부파일 영역 (향후 구현) */}
        <section className="bg-white rounded-2xl shadow-sm p-4 text-[11px]">
          <div className="font-semibold text-sm mb-2">첨부파일</div>
          <div className="text-center py-8 text-slate-400">
            파일 업로드 기능은 추후 구현 예정입니다.
          </div>
        </section>
      </main>
    </div>
  );
}

// 작은 공통 입력 컴포넌트
function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-slate-500">{label}</div>
      <input
        className="w-full border rounded px-3 py-1 text-[11px] disabled:bg-gray-50 disabled:text-gray-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
