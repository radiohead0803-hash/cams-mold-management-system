import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, ClipboardList, MapPin, Activity } from 'lucide-react';

/**
 * QR 스캔 후 금형 정보 표시 페이지
 * - 금형 기본 정보
 * - 현재 위치/타수
 * - 수리요청, 일상점검 등 액션 버튼
 */
export default function ScanInfoPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state || !state.session || !state.mold) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-400 mb-4">세션 정보가 없습니다.</p>
          <button
            onClick={() => navigate('/qr-login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            QR 스캔하기
          </button>
        </div>
      </div>
    );
  }

  const { session, mold, user } = state;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">금형 정보</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6 space-y-6">
        {/* 금형 기본 정보 카드 */}
        <section className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">금형코드</p>
              <p className="text-2xl font-bold text-white mt-1">{mold.mold_code}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              mold.status === 'active' ? 'bg-green-500/20 text-green-400' :
              mold.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {mold.status === 'active' ? '양산중' :
               mold.status === 'maintenance' ? '수리중' :
               mold.status}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">금형명</p>
              <p className="text-base text-white mt-1">{mold.mold_name || '-'}</p>
            </div>

            {mold.car_model && (
              <div>
                <p className="text-sm text-slate-400">차종</p>
                <p className="text-base text-white mt-1">{mold.car_model}</p>
              </div>
            )}

            {mold.part_name && (
              <div>
                <p className="text-sm text-slate-400">부품명</p>
                <p className="text-base text-white mt-1">{mold.part_name}</p>
              </div>
            )}

            {mold.cavity && (
              <div>
                <p className="text-sm text-slate-400">캐비티</p>
                <p className="text-base text-white mt-1">{mold.cavity}</p>
              </div>
            )}
          </div>
        </section>

        {/* 위치 및 타수 정보 */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-slate-400">현재 위치</p>
            </div>
            <p className="text-lg font-semibold text-white">
              {mold.location || '미등록'}
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <p className="text-sm text-slate-400">누적 타수</p>
            </div>
            <p className="text-lg font-semibold text-white">
              {mold.current_shots?.toLocaleString() || '0'} 
              {mold.target_shots && (
                <span className="text-sm text-slate-400 ml-1">
                  / {mold.target_shots.toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </section>

        {/* 액션 버튼 */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-400 px-2">작업 선택</h2>
          
          {/* 수리요청 버튼 */}
          <button
            onClick={() => navigate('/repair-request', {
              state: { 
                sessionToken: session.token,
                moldId: mold.id,
                moldCode: mold.mold_code,
                moldName: mold.mold_name
              }
            })}
            className="w-full flex items-center gap-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 transition group"
          >
            <div className="p-3 bg-rose-500/20 rounded-xl group-hover:bg-rose-500/30 transition">
              <Wrench className="w-6 h-6 text-rose-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">수리요청</p>
              <p className="text-sm text-slate-400">불량 발생 시 수리 요청</p>
            </div>
          </button>

          {/* 일상점검 버튼 */}
          <button
            onClick={() => navigate('/daily-check', {
              state: { 
                sessionToken: session.token,
                moldId: mold.id,
                moldCode: mold.mold_code
              }
            })}
            className="w-full flex items-center gap-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 transition group"
          >
            <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition">
              <ClipboardList className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">일상점검</p>
              <p className="text-sm text-slate-400">일일 점검 항목 체크</p>
            </div>
          </button>
        </section>

        {/* 세션 정보 */}
        <section className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50">
          <p className="text-xs text-slate-500 mb-2">세션 정보</p>
          <div className="space-y-1 text-xs text-slate-400">
            <p>작업자: {user?.name || '알 수 없음'}</p>
            <p>세션 만료: {new Date(session.expires_at).toLocaleString('ko-KR')}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
