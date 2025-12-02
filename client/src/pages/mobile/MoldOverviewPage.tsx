import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import MoldTopNav from '../../components/MoldTopNav';
import { UserRole } from '../../constants/moldMenus';
import api from '../../lib/api';

interface Mold {
  id: number;
  code: string;
  name: string;
  status: 'active' | 'hold' | 'repair';
  shotCounter: number;
  maxShots: number;
  shotRate: number;
  locationName?: string;
  ownerName?: string;
  plantName?: string;
  makerName?: string;
}

interface LocationState {
  role?: UserRole;
  mold?: Mold;
}

export default function MoldOverviewPage() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const [mold, setMold] = useState<Mold | null>(null);
  const [loading, setLoading] = useState(true);

  // 역할 확인
  const auth = JSON.parse(localStorage.getItem('cams_auth') || '{}');
  const scannedMold = JSON.parse(localStorage.getItem('cams_scanned_mold') || '{}');
  const role: UserRole = (state as LocationState)?.role || auth.role || 'production';

  useEffect(() => {
    loadMoldData();
  }, [moldId]);

  const loadMoldData = async () => {
    try {
      setLoading(true);

      // state나 localStorage에서 금형 정보 가져오기
      if ((state as LocationState)?.mold) {
        setMold((state as LocationState).mold!);
      } else if (scannedMold.mold) {
        setMold(scannedMold.mold);
      } else {
        // API로 조회
        const response = await api.get(`/api/v1/molds/${moldId}`);
        if (response.data.success) {
          setMold(response.data.data);
        }
      }
    } catch (error) {
      console.error('[MoldOverview] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600';
      case 'hold':
        return 'bg-amber-50 text-amber-600';
      case 'repair':
        return 'bg-rose-50 text-rose-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '사용중';
      case 'hold':
        return '대기';
      case 'repair':
        return '수리중';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">금형 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!mold) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">금형 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const shotRate = mold.maxShots > 0 
    ? Math.round((mold.shotCounter / mold.maxShots) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          {/* 좌측: 뒤로가기 + 금형 코드 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-[10px] text-slate-500">금형코드</div>
              <div className="text-sm font-semibold text-slate-900">
                {mold.code}
              </div>
            </div>
          </div>

          {/* 우측: 드롭다운 메뉴 */}
          <MoldTopNav role={role} />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-4 space-y-4 max-w-7xl mx-auto">
        {/* 1행: 금형 이미지 + 제품 이미지 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 금형 이미지 카드 */}
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900">금형 이미지</div>
            <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              <Camera size={32} className="text-slate-400" />
            </div>
            <button
              disabled={!['developer', 'maker'].includes(role)}
              className={`
                w-full text-xs py-2 rounded-full border transition-colors
                ${
                  ['developer', 'maker'].includes(role)
                    ? 'border-slate-900 text-slate-900 hover:bg-slate-50'
                    : 'border-slate-200 text-slate-300 cursor-not-allowed'
                }
              `}
            >
              이미지 업로드
            </button>
          </section>

          {/* 제품 이미지 카드 */}
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900">제품 이미지</div>
            <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              <Camera size={32} className="text-slate-400" />
            </div>
            <button
              disabled={role !== 'developer'}
              className={`
                w-full text-xs py-2 rounded-full border transition-colors
                ${
                  role === 'developer'
                    ? 'border-fuchsia-500 text-fuchsia-600 hover:bg-fuchsia-50'
                    : 'border-slate-200 text-slate-300 cursor-not-allowed'
                }
              `}
            >
              이미지 업로드
            </button>
          </section>
        </div>

        {/* 2행: 상태/위치/샷수/담당자 */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-500 mb-2">현재 상태</div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${getStatusColor(mold.status)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span className="font-medium">{getStatusLabel(mold.status)}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-2">위치</div>
              <div className="font-semibold text-slate-900">
                {mold.plantName || mold.locationName || '-'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-2">샷수 진행률</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-fuchsia-500 transition-all"
                    style={{ width: `${shotRate}%` }}
                  />
                </div>
                <span className="font-semibold text-slate-900 min-w-[3ch]">{shotRate}%</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-2">담당자</div>
              <div className="font-semibold text-slate-900">
                {mold.ownerName || '미지정'}
              </div>
            </div>
          </div>
        </section>

        {/* 3행: 금형관리 알림 + 금형점검 바로가기 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 금형관리 알림 */}
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900 mb-2">금형관리 알림</div>
            
            {shotRate >= 90 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-amber-900 mb-0.5">
                      샷수 임계치 도달
                    </div>
                    <div className="text-[11px] text-amber-700">
                      현재 샷수가 {shotRate}%에 도달했습니다. 교체를 고려해 주세요.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mold.status === 'repair' && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-rose-900 mb-0.5">
                      수리 진행 중
                    </div>
                    <div className="text-[11px] text-rose-700">
                      금형이 현재 수리 중입니다.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {shotRate < 90 && mold.status === 'active' && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-0.5">
                      정상 작동 중
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      금형이 정상적으로 작동하고 있습니다.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 금형점검 바로가기 */}
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900 mb-2">금형점검 바로가기</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'daily', label: '일상점검', roles: ['maker', 'production', 'plant'] },
                { id: 'regular', label: '정기점검', roles: ['maker', 'production', 'plant'] },
                { id: 'clean', label: '슬롯클리닝', roles: ['maker', 'production', 'plant'] },
                { id: 'wash', label: '세척점검', roles: ['maker', 'production', 'plant'] },
              ].map((btn) => {
                const enabled = btn.roles.includes(role);
                return (
                  <button
                    key={btn.id}
                    disabled={!enabled}
                    onClick={() => enabled && navigate(`/mobile/molds/${moldId}/check/${btn.id}`)}
                    className={`
                      px-3 py-2.5 rounded-xl border text-left text-xs font-medium
                      transition-colors
                      ${
                        enabled
                          ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                          : 'border-slate-200 text-slate-300 cursor-not-allowed'
                      }
                    `}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* 4행: 금형 기본 정보 */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-900 mb-2">금형 기본 정보</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-slate-500 mb-1">금형명</div>
              <div className="font-semibold text-slate-900">{mold.name}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">현재 샷수</div>
              <div className="font-semibold text-slate-900">
                {mold.shotCounter.toLocaleString()} / {mold.maxShots.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">제작처</div>
              <div className="font-semibold text-slate-900">{mold.makerName || '-'}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
