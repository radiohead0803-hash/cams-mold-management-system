import { MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * 금형 위치 목록 컴포넌트
 * GPS 위치 및 위치 이탈 정보 표시
 */
export default function MoldLocationList({ molds }) {
  if (!molds || molds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">금형 위치 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">
            금형 위치 / 위치이탈
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          총 {molds.length}개
        </span>
      </div>

      {/* 목록 */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {molds.map((mold) => (
          <div
            key={mold.id}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition ${
              mold.gps_alert 
                ? 'bg-rose-50 border border-rose-200' 
                : 'bg-slate-50'
            }`}
          >
            {/* 금형 정보 */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate">
                {mold.mold_code}
                {mold.mold_name && ` · ${mold.mold_name}`}
              </p>
              
              {/* 기본 위치 */}
              <p className="text-[11px] text-slate-500 truncate">
                보관위치: {mold.base_location || '-'}
              </p>
              
              {/* GPS 위치 */}
              {mold.gps && (
                <p className="text-[10px] text-slate-400 truncate">
                  GPS: {Number(mold.gps.latitude).toFixed(5)}, {Number(mold.gps.longitude).toFixed(5)}
                  <span className="ml-1">
                    ({new Date(mold.gps.recorded_at).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })})
                  </span>
                </p>
              )}

              {/* 위치 이탈 정보 */}
              {mold.gps_alert && (
                <p className="text-[10px] text-rose-600 mt-1 truncate">
                  ⚠️ {mold.gps_alert.metadata?.dist_km 
                    ? `${Number(mold.gps_alert.metadata.dist_km).toFixed(2)}km 이동 감지` 
                    : '위치 이탈 감지'}
                </p>
              )}
            </div>

            {/* 상태 배지 */}
            <div className="flex-shrink-0">
              {mold.gps_alert ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                  <AlertTriangle className="w-3 h-3" />
                  위치이탈
                </span>
              ) : mold.gps ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  정상
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  GPS 없음
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 통계 요약 */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
              정상: {molds.filter(m => m.gps && !m.gps_alert).length}
            </span>
            <span className="text-rose-600">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span>
              이탈: {molds.filter(m => m.gps_alert).length}
            </span>
            <span className="text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1"></span>
              미기록: {molds.filter(m => !m.gps).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
