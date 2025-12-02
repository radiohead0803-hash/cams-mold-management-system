import { useEffect, useState } from 'react';
import api from '../lib/api';

export interface RepairRequest {
  id: number;
  mold_id: number;
  plant_id: number | null;
  checklist_instance_id: number | null;
  status: string;
  priority: string;
  request_type: string;
  requested_by: number | null;
  requested_role: string | null;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  mold?: {
    id: number;
    mold_code: string;
    mold_name: string;
    status: string;
  };
  checklist?: {
    id: number;
    category: string;
    inspected_at: string;
  };
  items?: RepairRequestItem[];
}

export interface RepairRequestItem {
  id: number;
  repair_request_id: number;
  checklist_answer_id: number | null;
  item_label: string;
  item_section: string | null;
  value_text: string | null;
  value_bool: boolean | null;
  is_ng: boolean;
}

export function useRepairRequests(params?: { status?: string; plantId?: number }) {
  const [data, setData] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/api/v1/repair-requests', {
          params
        });

        setData(res.data.data || []);
      } catch (err: any) {
        console.error('useRepairRequests error', err);
        setError('수리요청 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [params?.status, params?.plantId]);

  return { data, loading, error };
}

export function useRepairRequestDetail(id: string | undefined) {
  const [data, setData] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/api/v1/repair-requests/${id}`);
        setData(res.data.data);
      } catch (err: any) {
        console.error('useRepairRequestDetail error', err);
        setError('수리요청 상세를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  return { data, loading, error };
}
