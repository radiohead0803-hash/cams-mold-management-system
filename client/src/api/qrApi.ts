// client/src/api/qrApi.ts
import api from './httpClient';

export interface QrScanResponse {
  sessionId: string;
  mold: {
    id: number;
    code: string;
    name?: string;
    status: string;
    plantName?: string;
  };
  availableActions: string[]; // ['daily_inspection', 'periodic_inspection', ...]
  locationAlert?: {
    isOutOfRange: boolean;
    distanceKm?: number;
  };
}

export async function startQrSession(qrCode: string) {
  const res = await api.post<{ success: boolean; data: QrScanResponse }>('/qr/scan', { 
    qr_code: qrCode 
  });
  return res.data.data;
}
