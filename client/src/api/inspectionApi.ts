// client/src/api/inspectionApi.ts
import api from './httpClient';

export interface DailyInspectionPayload {
  session_id: string;
  mold_id: number;
  production_quantity: number;
  ng_quantity: number;
  checklist_items: { question_id: number; answer: string; is_ng?: boolean; ng_reason?: string }[];
  notes?: string;
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

export async function submitDailyInspection(payload: DailyInspectionPayload) {
  const res = await api.post('/inspections/daily', payload);
  return res.data;
}

export async function submitPeriodicInspection(
  payload: PeriodicInspectionPayload,
) {
  const res = await api.post('/inspections/periodic', payload);
  return res.data;
}
