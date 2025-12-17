// client/src/pages/mobile/MobileDailyChecklist.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, X, ChevronRight, ChevronLeft, Camera, Loader2 } from 'lucide-react';
import api from '../../lib/api';

// 웹버전과 동일한 일상점검 카테고리/항목 구조
const CHECK_CATEGORIES = [
  {
    id: 1,
    name: '금형 외관 점검',
    icon: '🔍',
    items: [
      { id: 101, name: '금형 외관 상태', description: '금형 외관의 손상, 변형, 부식 여부 확인', required: true },
      { id: 102, name: '금형 명판 상태', description: '명판 식별 가능 여부 확인', required: true },
      { id: 103, name: '파팅라인 상태', description: '파팅라인 밀착 상태 및 버 발생 여부', required: true }
    ]
  },
  {
    id: 2,
    name: '냉각 시스템',
    icon: '💧',
    items: [
      { id: 201, name: '냉각수 연결 상태', description: '냉각수 라인 연결 및 누수 여부', required: true },
      { id: 202, name: '냉각수 유량', description: '냉각수 흐름 원활 여부 (온도차 5℃ 이하)', required: true },
      { id: 203, name: '냉각 채널 막힘', description: '냉각 채널 스케일/이물질 막힘', required: false }
    ]
  },
  {
    id: 3,
    name: '작동부 점검',
    icon: '⚙️',
    items: [
      { id: 301, name: '이젝터 작동 상태', description: '이젝터 핀 작동 원활성', required: true },
      { id: 302, name: '슬라이드 작동 상태', description: '슬라이드 코어 작동 상태', required: false },
      { id: 303, name: '가이드 핀/부시 상태', description: '가이드 핀 마모 및 유격', required: true },
      { id: 304, name: '밀핀/제품핀', description: '작동 시 걸림, 파손, 변형 無', required: true },
      { id: 305, name: '리턴 핀/스프링', description: '리턴 핀 작동 및 스프링 탄성', required: true }
    ]
  },
  {
    id: 4,
    name: '게이트/런너/벤트',
    icon: '🔄',
    items: [
      { id: 401, name: '게이트 상태', description: '게이트 마모 및 손상 여부', required: true },
      { id: 402, name: '런너 상태', description: '런너 청결 및 막힘 여부', required: true },
      { id: 403, name: '벤트 상태', description: '가스 벤트 막힘 여부', required: true }
    ]
  },
  {
    id: 5,
    name: '히터/센서/전기',
    icon: '🌡️',
    items: [
      { id: 501, name: '히터/온도센서 상태', description: '히터 작동 및 센서 정상 여부', required: false },
      { id: 502, name: '배선/커넥터 상태', description: '전기 배선 손상 여부', required: false }
    ]
  },
  {
    id: 6,
    name: '체결/취출 계통',
    icon: '🔧',
    items: [
      { id: 601, name: '금형 체결볼트', description: '풀림, 균열, 아이마킹 상태', required: true },
      { id: 602, name: '로케이트링/스프루부', description: '위치이탈, 손상 無', required: true },
      { id: 603, name: '취출핀/스프링', description: '정상작동, 파손·마모 無', required: true }
    ]
  },
  {
    id: 7,
    name: '윤활/청결 관리',
    icon: '🧴',
    items: [
      { id: 701, name: '슬라이드/핀류 윤활', description: '그리스 도포 상태 양호', required: true },
      { id: 702, name: '엘글라/리프트핀 윤활', description: '그리스 도포 상태 양호', required: true },
      { id: 703, name: '성형면 청결', description: '캐비티/코어 이물질 제거', required: true }
    ]
  },
  {
    id: 8,
    name: '이상/누출 점검',
    icon: '⚠️',
    items: [
      { id: 801, name: '누유/누수 여부', description: '냉각수, 오일, 에어라인 이상 無', required: true }
    ]
  },
  {
    id: 9,
    name: '방청 관리',
    icon: '🛡️',
    items: [
      { id: 901, name: '방청유 도포', description: '보관 시 성형면 방청처리 (비가동 시)', required: false }
    ]
  },
  {
    id: 10,
    name: '생산 정보',
    icon: '📊',
    items: [
      { id: 1001, name: '생산수량', description: '금일 생산수량 입력 (숏수 자동 누적)', required: false, fieldType: 'number' }
    ]
  }
];

type CheckStatus = '양호' | '주의' | '불량' | null;

interface CheckResult {
  status?: CheckStatus;
  value?: string;
  notes?: string;
  timestamp?: string;
}

interface Mold {
  id: number;
  mold_code: string;
  mold_name?: string;
  part_name?: string;
  car_model?: string;
  current_shots?: number;
  target_shots?: number;
  guarantee_shots?: number;
}

export default function MobileDailyChecklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = searchParams.get('moldId') || searchParams.get('mold');

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [checkResults, setCheckResults] = useState<Record<number, CheckResult>>({});
  const [mold, setMold] = useState<Mold | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentCategory = CHECK_CATEGORIES[currentCategoryIndex];
  const totalCategories = CHECK_CATEGORIES.length;
  const totalItems = CHECK_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = Object.keys(checkResults).filter(
    key => checkResults[Number(key)]?.status || checkResults[Number(key)]?.value !== undefined
  ).length;
  const progress = Math.round((completedItems / totalItems) * 100);

  // 금형 정보 로드
  useEffect(() => {
    const loadMoldData = async () => {
      setLoading(true);
      try {
        if (moldId) {
          const res = await api.get(`/mold-specifications/${moldId}`);
          if (res.data.success && res.data.data) {
            setMold(res.data.data);
          } else {
            setMold({
              id: Number(moldId),
              mold_code: `MOLD-${moldId}`,
              mold_name: '금형',
              current_shots: 0,
              target_shots: 500000
            });
          }
        }
      } catch (err) {
        console.error('금형 정보 로드 실패:', err);
        setMold({
          id: Number(moldId) || 1,
          mold_code: 'UNKNOWN',
          mold_name: '알 수 없음',
          current_shots: 0,
          target_shots: 500000
        });
      } finally {
        setLoading(false);
      }
    };
    loadMoldData();
  }, [moldId]);

  const handleStatusChange = (itemId: number, status: CheckStatus) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleValueChange = (itemId: number, value: string) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        value,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleNotesChange = (itemId: number, notes: string) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const handleNext = () => {
    if (currentCategoryIndex < totalCategories - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    const requiredItems = CHECK_CATEGORIES.flatMap(cat =>
      cat.items.filter(item => item.required)
    );
    const completedRequired = requiredItems.filter(item =>
      checkResults[item.id]?.status
    );

    if (completedRequired.length < requiredItems.length) {
      setError(`필수 항목을 모두 완료해주세요. (${completedRequired.length}/${requiredItems.length})`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // API 호출 (추후 구현)
      const summary = {
        mold_id: mold?.id,
        check_date: new Date().toISOString(),
        results: checkResults,
        summary: {
          total: totalItems,
          completed: completedItems,
          good: Object.values(checkResults).filter(r => r.status === '양호').length,
          warning: Object.values(checkResults).filter(r => r.status === '주의').length,
          bad: Object.values(checkResults).filter(r => r.status === '불량').length
        }
      };

      console.log('일상점검 완료:', summary);
      setSuccess('일상점검이 완료되었습니다!');
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || '점검 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryProgress = (category: typeof CHECK_CATEGORIES[0]) => {
    const completed = category.items.filter(
      item => checkResults[item.id]?.status || checkResults[item.id]?.value !== undefined
    ).length;
    const total = category.items.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-sm font-semibold text-slate-900">일상점검</div>
              <div className="text-[10px] text-slate-500">
                {mold?.mold_code} - {mold?.part_name || mold?.mold_name}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            {progress}% 완료
          </div>
        </div>

        {/* 전체 진행률 바 */}
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 카테고리 탭 (가로 스크롤) */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex p-2 gap-2 min-w-max">
          {CHECK_CATEGORIES.map((category, index) => {
            const { completed, total } = getCategoryProgress(category);
            const isActive = index === currentCategoryIndex;
            const isComplete = completed === total;

            return (
              <button
                key={category.id}
                onClick={() => setCurrentCategoryIndex(index)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isComplete
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-[10px] opacity-75">
                  {completed}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 현재 카테고리 점검 항목 */}
      <main className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>{currentCategory.icon}</span>
            {currentCategory.name}
          </h2>
          <span className="text-xs text-slate-500">
            {currentCategoryIndex + 1} / {totalCategories}
          </span>
        </div>

        {currentCategory.items.map((item) => {
          const result = checkResults[item.id] || {};
          const isNumberField = (item as any).fieldType === 'number';

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm"
            >
              {/* 항목 헤더 */}
              <div className="mb-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-slate-900">
                    {item.name}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <button className="text-slate-400">
                    <Camera size={16} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
              </div>

              {/* 숫자 입력 필드 (생산수량) */}
              {isNumberField ? (
                <div className="mt-2">
                  <input
                    type="number"
                    value={result.value || ''}
                    onChange={(e) => handleValueChange(item.id, e.target.value)}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="수량 입력"
                    min="0"
                  />
                  {mold && (
                    <div className="text-[10px] text-slate-500 mt-1">
                      현재 숏수: {(mold.current_shots || 0).toLocaleString()} / {(mold.target_shots || mold.guarantee_shots || 500000).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                /* 상태 선택 버튼 (양호/주의/불량) */
                <div className="flex gap-2 mt-2">
                  {(['양호', '주의', '불량'] as CheckStatus[]).map((status) => {
                    const isSelected = result.status === status;
                    const colors = {
                      '양호': isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-300',
                      '주의': isSelected ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-300',
                      '불량': isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-300'
                    };
                    const icons = {
                      '양호': <Check size={14} />,
                      '주의': <AlertTriangle size={14} />,
                      '불량': <X size={14} />
                    };

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(item.id, status)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all ${colors[status!]}`}
                      >
                        {icons[status!]}
                        {status}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 비고 입력 (주의/불량 선택 시 표시) */}
              {(result.status === '주의' || result.status === '불량') && (
                <div className="mt-2">
                  <textarea
                    value={result.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="특이사항을 입력하세요"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* 에러/성공 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700">
            {success}
          </div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          이전
        </button>

        {currentCategoryIndex === totalCategories - 1 ? (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            점검 완료
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-medium"
          >
            다음
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
