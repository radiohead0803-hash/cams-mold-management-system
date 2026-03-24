// client/src/api/inspectionApi.ts
import api from './httpClient';

/**
 * 체크리스트 코드를 question_id로 변환
 * 코드 형식: "D01", "D02", "P01" 등 → 숫자 부분 추출
 * 접두사별 오프셋: D(일상)=0, P(정기)=1000, 그 외=2000
 */
function codeToQuestionId(code: string): number {
  if (!code) return 0;
  const prefix = code.charAt(0).toUpperCase();
  const num = parseInt(code.replace(/\D/g, ''), 10) || 0;
  const offset = prefix === 'D' ? 0 : prefix === 'P' ? 1000 : 2000;
  return offset + num;
}

export interface DailyInspectionPayload {
  status?: 'draft' | 'pending_approval' | 'completed';
  approver_id?: number;
  session_id: string;
  mold_id: number;
  production_quantity: number;
  ng_quantity: number;
  checklist_items: { question_id: number; answer: string; is_ng?: boolean; ng_reason?: string }[];
  notes?: string;
}

// CamelCase version for convenience
export interface DailyInspectionPayloadCamel {
  status?: 'draft' | 'pending_approval' | 'completed';
  approverId?: number;
  sessionId: string;
  moldId: number;
  productionQuantity: number;
  ngQuantity: number;
  checklistItems: { code: string; result: 'OK' | 'NG'; note?: string }[];
  note?: string;
}

export interface PeriodicInspectionItem {
  question_id: number;
  answer: string;
  measured_value?: number;
  spec_min?: number;
  spec_max?: number;
  is_ng?: boolean;
  is_critical?: boolean;
  ng_reason?: string;
}

export interface PeriodicInspectionPayload {
  session_id: string;
  mold_id: number;
  inspection_type: '20K' | '100K' | '400K' | '800K';
  checklist_items: PeriodicInspectionItem[];
  inspector_name?: string;
  inspection_duration?: number;
  notes?: string;
}

// CamelCase version for convenience
export interface PeriodicInspectionPayloadCamel {
  sessionId: string;
  moldId: number;
  cycleType: '20K' | '100K' | '400K' | '800K';
  items: {
    code: string;
    measuredValue: number;
    specMin?: number;
    specMax?: number;
    note?: string;
  }[];
  note?: string;
}

export async function submitDailyInspection(
  payload: DailyInspectionPayload | DailyInspectionPayloadCamel,
  action: 'save_draft' | 'request_approval' | 'complete' = 'complete'
) {
  // Convert camelCase to snake_case if needed
  const snakePayload: DailyInspectionPayload = 'session_id' in payload ? payload as DailyInspectionPayload : {
    status: action === 'save_draft' ? 'draft' : action === 'request_approval' ? 'pending_approval' : 'completed',
    approver_id: (payload as DailyInspectionPayloadCamel).approverId,
    session_id: (payload as DailyInspectionPayloadCamel).sessionId,
    mold_id: (payload as DailyInspectionPayloadCamel).moldId,
    production_quantity: (payload as DailyInspectionPayloadCamel).productionQuantity,
    ng_quantity: (payload as DailyInspectionPayloadCamel).ngQuantity,
    checklist_items: (payload as DailyInspectionPayloadCamel).checklistItems?.map(item => ({
      question_id: codeToQuestionId(item.code),
      answer: item.result,
      is_ng: item.result === 'NG',
      ng_reason: item.note
    })) || [],
    notes: (payload as DailyInspectionPayloadCamel).note
  };
  
  const endpoint = action === 'save_draft' ? '/inspections/daily/draft' :
                 action === 'request_approval' ? '/inspections/daily/request-approval' :
                 '/inspections/daily';

const res = await api.post(endpoint, snakePayload);
  return res.data;
}

export async function submitPeriodicInspection(
  payload: PeriodicInspectionPayload | PeriodicInspectionPayloadCamel,
) {
  // Convert camelCase to snake_case if needed
  const snakePayload: PeriodicInspectionPayload = 'session_id' in payload ? payload as PeriodicInspectionPayload : {
    session_id: (payload as PeriodicInspectionPayloadCamel).sessionId,
    mold_id: (payload as PeriodicInspectionPayloadCamel).moldId,
    inspection_type: (payload as PeriodicInspectionPayloadCamel).cycleType,
    checklist_items: (payload as PeriodicInspectionPayloadCamel).items?.map(item => ({
      question_id: codeToQuestionId(item.code),
      answer: String(item.measuredValue),
      measured_value: item.measuredValue,
      spec_min: item.specMin,
      spec_max: item.specMax,
      ng_reason: item.note
    })) || [],
    notes: (payload as PeriodicInspectionPayloadCamel).note
  };
  
  const res = await api.post('/inspections/periodic', snakePayload);
  return res.data;
}
