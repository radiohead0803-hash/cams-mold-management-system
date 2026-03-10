// client/src/pages/mobile/MobilePeriodicInspection.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, Wrench, ChevronRight, ChevronLeft, Loader2, BookOpen, X, MapPin, Save, Send, Search, User } from 'lucide-react';
import api from '../../lib/api';
// draftStorage 불필요 - 서버 checklist-instances API로 통합
import InspectionPhotoSection from '../../components/InspectionPhotoSection';

// 웹버전과 동일한 정기점검 유형/카테고리/항목 구조
const INSPECTION_TYPES = [
  {
    id: '20k',
    name: '20,000 SHOT 점검',
    period: '3개월',
    shotThreshold: 20000,
    categories: [
      {
        id: 1,
        name: '파팅면/성형면',
        icon: '🔧',
        items: [
          { id: 1, name: '파팅면 단차', description: '±0.02mm 이내', required: true, checkPoints: ['파팅면 단차 측정', '기준치 ±0.02mm 이내 확인', '단차 발생 부위 표시'] },
          { id: 2, name: '성형면 손상', description: '표면 이상 여부', required: true, checkPoints: ['성형면 스크래치 확인', '부식/마모 흔적 점검', '표면 광택 상태 확인'] }
        ]
      },
      {
        id: 2,
        name: '벤트/게이트',
        icon: '🔄',
        items: [
          { id: 3, name: '벤트홀 막힘', description: '막힘 여부 확인', required: true, checkPoints: ['벤트홀 개방 상태 확인', '가스 배출 원활성 점검', '이물질 제거 상태'] },
          { id: 4, name: '게이트 청결', description: '0.03mm 이상 마모시 재가공', required: true, checkPoints: ['게이트 마모 측정', '0.03mm 이상 마모시 재가공 필요', '게이트 청결 상태 확인'] }
        ]
      },
      {
        id: 3,
        name: '작동부',
        icon: '⚙️',
        items: [
          { id: 5, name: '슬라이드 작동', description: '이상음/걸림/누유 여부', required: true, checkPoints: ['슬라이드 이동 시 이상음 확인', '걸림 현상 점검', '누유 여부 확인'] },
          { id: 6, name: '작동 원활성', description: '원활한 작동 확인', required: true, checkPoints: ['전체 작동부 원활성 점검', '작동 속도 정상 여부', '반복 작동 테스트'] }
        ]
      },
      {
        id: 4,
        name: '습합(접합)',
        icon: '🔗',
        items: [
          { id: 7, name: '금형 간극', description: '±0.02mm 이내 유지', required: true, checkPoints: ['금형 간극 측정', '기준치 ±0.02mm 이내 확인', '간극 불량 부위 표시'] },
          { id: 8, name: '접합 정렬', description: '정렬 상태 확인', required: true, checkPoints: ['상/하형 정렬 상태 확인', '가이드핀 정렬 점검', '접합면 밀착 상태'] }
        ]
      },
      {
        id: 5,
        name: '취출계통',
        icon: '📤',
        items: [
          { id: 9, name: '밀핀/스프링', description: '박힘/변형/마모 없음', required: true, checkPoints: ['밀핀 박힘 여부 확인', '스프링 변형 점검', '마모 상태 측정'] }
        ]
      },
      {
        id: 6,
        name: '냉각/유압 연결부',
        icon: '💧',
        items: [
          { id: 10, name: '누유/누수', description: '누유/누수 여부', required: true, checkPoints: ['유압 라인 누유 확인', '냉각수 누수 점검', '연결부 조임 상태'] },
          { id: 11, name: '조인트/호스', description: '커넥터·호스 상태', required: true, checkPoints: ['커넥터 체결 상태 확인', '호스 균열/노화 점검', '연결부 밀봉 상태'] }
        ]
      }
    ]
  },
  {
    id: '50k',
    name: '50,000 SHOT 점검',
    period: '6개월',
    shotThreshold: 50000,
    categories: [
      {
        id: 1,
        name: '벤트·게이트부 마모',
        icon: '🔧',
        items: [
          { id: 12, name: '핀/인서트 마모', description: '0.05mm 이상이면 교체', required: true, checkPoints: ['핀 마모량 측정', '인서트 마모 상태 확인', '0.05mm 이상시 교체 진행'] }
        ]
      },
      {
        id: 2,
        name: '가이드핀/리테이너',
        icon: '📍',
        items: [
          { id: 13, name: '마모/유격', description: '±0.02mm, 변형·이상음 없음', required: true, checkPoints: ['가이드핀 마모 측정', '유격 ±0.02mm 이내 확인', '변형/이상음 점검'] },
          { id: 14, name: '리프트핀/엘글라', description: '마모/유격 확인', required: true, checkPoints: ['리프트핀 마모 상태', '엘글라 유격 측정', '작동 원활성 확인'] }
        ]
      },
      {
        id: 3,
        name: '냉각라인',
        icon: '💧',
        items: [
          { id: 15, name: '유량/온도', description: '온도 편차 ±10% 이내', required: true, checkPoints: ['냉각수 유량 측정', '입/출구 온도 측정', '온도 편차 ±10% 이내 확인'] },
          { id: 16, name: '누수 확인', description: '누수 없음', required: true, checkPoints: ['냉각라인 전체 누수 점검', '연결부 누수 확인', '호스 상태 점검'] }
        ]
      },
      {
        id: 4,
        name: '히터·센서·배선',
        icon: '🌡️',
        items: [
          { id: 17, name: '히터 저항', description: '±10% 이내', required: true, checkPoints: ['히터 저항값 측정', '기준치 ±10% 이내 확인', '이상 히터 표시'] },
          { id: 18, name: '센서/배선', description: '손상·접촉불량 확인', required: true, checkPoints: ['센서 작동 상태 확인', '배선 손상 점검', '접촉불량 부위 확인'] }
        ]
      },
      {
        id: 5,
        name: '표면처리',
        icon: '✨',
        items: [
          { id: 19, name: '코팅/크롬층', description: '박리, 변색, 두께 이상 확인', required: true, checkPoints: ['코팅 박리 여부 확인', '크롬층 변색 점검', '두께 측정 및 기록'] }
        ]
      },
      {
        id: 6,
        name: '습합 정확도',
        icon: '📐',
        items: [
          { id: 20, name: '수평각', description: '±0.02mm, 간극/접합력 확인', required: true, checkPoints: ['수평각 측정', '간극 ±0.02mm 이내 확인', '접합력 테스트'] }
        ]
      },
      {
        id: 7,
        name: '취출핀/볼트너트',
        icon: '🔩',
        items: [
          { id: 21, name: '핀 마모', description: '마모·손상 여부', required: true, checkPoints: ['취출핀 마모 측정', '손상 부위 확인', '교체 필요 여부 판단'] },
          { id: 22, name: '볼트너트 작동', description: '작동 상태와 배선 접점', required: true, checkPoints: ['볼트너트 작동 확인', '배선 접점 상태 점검', '조임 토크 확인'] }
        ]
      }
    ]
  },
  {
    id: '80k',
    name: '80,000 SHOT 점검',
    period: '청소/습합 집중',
    shotThreshold: 80000,
    categories: [
      {
        id: 1,
        name: '세척',
        icon: '🧹',
        items: [
          { id: 23, name: '금형 외곽 세척', description: '코어/캐비티 내 이물 제거', required: true, checkPoints: ['금형 외곽 세척 완료', '코어 내 이물 제거', '캐비티 내 이물 제거'] },
          { id: 24, name: '벤트·게이트 세척', description: '촉촉 상태 확인', required: true, checkPoints: ['벤트홀 세척 완료', '게이트 세척 상태', '세척 후 건조 상태 확인'] }
        ]
      },
      {
        id: 2,
        name: '습합',
        icon: '🔗',
        items: [
          { id: 25, name: '습합 면 정렬', description: '간극 재측정', required: true, checkPoints: ['습합면 정렬 상태 확인', '간극 재측정 실시', '측정값 기록'] },
          { id: 26, name: '런너/가이드', description: '클리닝 상태', required: true, checkPoints: ['런너 클리닝 완료', '가이드 클리닝 상태', '잔류물 제거 확인'] }
        ]
      },
      {
        id: 3,
        name: '냉각수/유압',
        icon: '💧',
        items: [
          { id: 27, name: '필터/밸브', description: '필터 교체 권고', required: true, checkPoints: ['필터 상태 점검', '필터 교체 필요 여부', '밸브 작동 확인'] }
        ]
      },
      {
        id: 4,
        name: '히터/센서',
        icon: '🌡️',
        items: [
          { id: 28, name: '감지기/배선', description: '접점 청소', required: true, checkPoints: ['감지기 접점 청소', '배선 접점 청소', '청소 후 작동 확인'] }
        ]
      },
      {
        id: 5,
        name: '윤활',
        icon: '🧴',
        items: [
          { id: 29, name: '정밀 윤활', description: '기록 및 마모 트래킹', required: true, checkPoints: ['윤활 부위 확인', '윤활유 도포', '마모 상태 기록'] }
        ]
      }
    ]
  },
  {
    id: '100k',
    name: '100,000 SHOT 점검',
    period: '1년',
    shotThreshold: 100000,
    categories: [
      {
        id: 1,
        name: '냉각라인',
        icon: '💧',
        items: [
          { id: 30, name: '스케일 제거', description: '이물 세척, 냉각수흐름 확보', required: true, checkPoints: ['스케일 제거 작업', '이물 세척 완료', '냉각수 흐름 확인'] }
        ]
      },
      {
        id: 2,
        name: '치수 확인',
        icon: '📏',
        items: [
          { id: 31, name: '표준/인서트 치수', description: '±0.05mm 이내', required: true, checkPoints: ['표준 치수 측정', '인서트 치수 측정', '±0.05mm 이내 확인'] }
        ]
      },
      {
        id: 3,
        name: '표면/코팅',
        icon: '✨',
        items: [
          { id: 32, name: '코팅 박리', description: '크롬층 불균일, 변색 확인', required: true, checkPoints: ['코팅 박리 여부 확인', '크롬층 균일성 점검', '변색 부위 확인'] }
        ]
      },
      {
        id: 4,
        name: '볼트너트/게이트',
        icon: '🔩',
        items: [
          { id: 33, name: '작동 확인', description: '판탈림 여부, 배선 절연', required: true, checkPoints: ['볼트너트 판탈림 확인', '배선 절연 상태 점검', '작동 테스트'] }
        ]
      },
      {
        id: 5,
        name: '냉각수/공기',
        icon: '🌬️',
        items: [
          { id: 34, name: '유량계/밸브', description: '필터/세척 상태, 누수 확인', required: true, checkPoints: ['유량계 작동 확인', '밸브 상태 점검', '필터 세척/교체'] }
        ]
      },
      {
        id: 6,
        name: '마모 분석',
        icon: '📊',
        items: [
          { id: 35, name: '정밀 윤활', description: '마모 예측치, 교체 시점 산정', required: true, checkPoints: ['마모 예측치 분석', '교체 시점 산정', '윤활 상태 기록'] }
        ]
      }
    ]
  }
];

type CheckStatus = '양호' | '정비 필요' | '수리 필요' | null;

interface CheckResult {
  status?: CheckStatus;
  value?: string;
  notes?: string;
  timestamp?: string;
  photos?: PhotoItem[];
}

interface PhotoItem {
  id: string;
  file_url: string;
  thumbnail_url?: string;
  uploading?: boolean;
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
  location?: string;
}

interface InspectionType {
  id: string;
  name: string;
  period: string;
  shotThreshold: number;
  categories: Category[];
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  items: Item[];
}

interface Item {
  id: number;
  name: string;
  description: string;
  required: boolean;
  checkPoints?: string[];
  fieldType?: string;
  isShotLinked?: boolean;
}

export default function MobilePeriodicInspection() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const moldId = params.moldId || searchParams.get('moldId') || searchParams.get('mold');

  const [selectedType, setSelectedType] = useState<InspectionType | null>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [checkResults, setCheckResults] = useState<Record<number, CheckResult>>({});
  const [mold, setMold] = useState<Mold | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGuide, setShowGuide] = useState<Item | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: string; text: string } | null>(null);
  const [showApproverModal, setShowApproverModal] = useState(false);
  const [approverKeyword, setApproverKeyword] = useState('');
  const [approverResults, setApproverResults] = useState<any[]>([]);
  const [selectedApprover, setSelectedApprover] = useState<any>(null);

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

    // GPS 위치 캡처
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          console.error('GPS 오류:', err);
        }
      );
    }
  }, [moldId]);

  // Draft 복원 (서버 → 로컬 순서)
  useEffect(() => {
    (async () => {
      // 1. 서버에서 draft 조회 (PC에서 임시저장한 것)
      if (moldId) {
        try {
          const res = await api.get(`/checklist-instances/mold/${moldId}/status`);
          if (res.data?.success) {
            const periodicLatest = res.data.data?.periodic?.latest;
            if (periodicLatest && periodicLatest.status === 'draft') {
              try {
                const detailRes = await api.get(`/checklist-instances/${periodicLatest.id}`);
                if (detailRes.data?.success && detailRes.data.data) {
                  const serverDraft = detailRes.data.data;
                  const results = typeof serverDraft.results === 'string' ? JSON.parse(serverDraft.results) : serverDraft.results;
                  if (results && Object.keys(results).length > 0) {
                    setCheckResults(results);
                    setSaveMessage({ type: 'success', text: `서버 임시저장 복원됨 (${new Date(serverDraft.created_at).toLocaleString()})` });
                    setTimeout(() => setSaveMessage(null), 4000);
                    return;
                  }
                }
              } catch (detailErr) {
                console.log('서버 draft 상세 로드 실패, 로컬 확인:', detailErr);
              }
            }
          }
        } catch (serverErr) {
          console.log('서버 draft 조회 실패, 로컬 확인:', serverErr);
        }
      }

      // 로컬 폴백 없음 - 서버 draft만 사용
    })();
  }, [moldId]);

  const handleTypeSelect = (type: InspectionType) => {
    setSelectedType(type);
    setCurrentCategoryIndex(0);
    setCheckResults({});
  };

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

  const handleNotesChange = (itemId: number, notes: string) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const handlePhotosChange = (itemId: number, photos: PhotoItem[]) => {
    setCheckResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos
      }
    }));
  };

  const handleNext = () => {
    if (selectedType && currentCategoryIndex < selectedType.categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const buildPayload = (status: string, approverId: number | null = null) => {
    if (!selectedType) return {};
    const allItems = selectedType.categories.flatMap(cat => cat.items);
    return {
      mold_id: mold?.id,
      category: 'periodic',
      status,
      approver_id: approverId,
      check_date: new Date().toISOString(),
      results: { ...checkResults, inspection_type: selectedType.id, gps_location: gpsLocation },
      summary: {
        total: allItems.length,
        completed: Object.keys(checkResults).length,
        good: (Object.values(checkResults) as CheckResult[]).filter(r => r.status === '양호').length,
        warning: (Object.values(checkResults) as CheckResult[]).filter(r => r.status === '정비 필요').length,
        bad: (Object.values(checkResults) as CheckResult[]).filter(r => r.status === '수리 필요').length
      }
    };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.post('/checklist-instances/periodic/draft', buildPayload('draft'));
      setSaveMessage({ type: 'success', text: '임시저장이 완료되었습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('임시저장 실패:', err);
      setSaveMessage({ type: 'error', text: '임시저장에 실패했습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSearchApprover = async (keyword?: string) => {
    const searchWord = keyword !== undefined ? keyword : approverKeyword;
    try {
      const res = await api.get('/workflow/approvers/search', { params: { name: searchWord.trim() || undefined } });
      if (res.data.success) setApproverResults(res.data.data);
    } catch (err) {
      console.error('검색 실패:', err);
    }
  };

  const openApproverModal = () => {
    setShowApproverModal(true);
    handleSearchApprover('');
  };

  const handleRequestApproval = async () => {
    if (!selectedApprover) { openApproverModal(); return; }
    if (!selectedType) return;
    const allItems = selectedType.categories.flatMap(cat => cat.items);
    const requiredItems = allItems.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => checkResults[item.id]?.status);
    if (completedRequired.length < requiredItems.length) {
      setError(`필수 항목을 모두 완료해주세요. (${completedRequired.length}/${requiredItems.length})`);
      return;
    }
    setSaving(true);
    try {
      await api.post('/checklist-instances/daily/request-approval', buildPayload('pending_approval', selectedApprover.id));
      setSaveMessage({ type: 'success', text: `${selectedApprover.name}님께 승인요청 완료` });
      setTimeout(() => { moldId ? navigate(`/mobile/mold/${moldId}`) : navigate(-1); }, 2000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: '승인요청 실패' });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedType) return;

    const allItems = selectedType.categories.flatMap(cat => cat.items);
    const requiredItems = allItems.filter(item => item.required);
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
      const payload = buildPayload('completed');
      await api.post('/checklist-instances/periodic/complete', payload);
      setSuccess('정기점검이 완료되었습니다!');
      setTimeout(() => {
        moldId ? navigate(`/mobile/mold/${moldId}`) : navigate(-1);
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || '점검 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryProgress = (category: Category) => {
    const completed = category.items.filter(
      item => checkResults[item.id]?.status
    ).length;
    const total = category.items.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const getRecommendedType = () => {
    if (!mold) return null;
    const shots = mold.current_shots || 0;

    if (shots >= 100000) return INSPECTION_TYPES.find(t => t.id === '100k');
    if (shots >= 80000) return INSPECTION_TYPES.find(t => t.id === '80k');
    if (shots >= 50000) return INSPECTION_TYPES.find(t => t.id === '50k');
    if (shots >= 20000) return INSPECTION_TYPES.find(t => t.id === '20k');
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 점검 유형 선택 화면
  if (!selectedType) {
    const recommendedType = getRecommendedType();

    return (
      <div className="min-h-screen bg-slate-50 pb-6">
        {/* 헤더 */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="h-14 flex items-center px-4 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-sm font-semibold text-slate-900">정기점검</div>
              <div className="text-[10px] text-slate-500">
                {mold?.mold_code} - {mold?.part_name || mold?.mold_name}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* 금형 정보 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">금형 정보</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">품번:</span>
                <span className="ml-1 font-medium">{mold?.mold_code}</span>
              </div>
              <div>
                <span className="text-slate-500">품명:</span>
                <span className="ml-1 font-medium">{mold?.part_name || mold?.mold_name}</span>
              </div>
              <div>
                <span className="text-slate-500">누적 타수:</span>
                <span className="ml-1 font-medium">{(mold?.current_shots || 0).toLocaleString()} Shot</span>
              </div>
              {gpsLocation && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-blue-500" />
                  <span className="text-slate-500">GPS:</span>
                  <span className="ml-1 font-medium text-[10px]">
                    {gpsLocation.latitude.toFixed(4)}°N
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 점검 주기 안내 */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-xs font-semibold text-blue-900 mb-2">📋 정기점검 주기 구분표</h3>
            <div className="space-y-1 text-[11px] text-blue-800">
              <p>• <strong>20,000 SHOT</strong> (3개월): 기본 항목 점검</p>
              <p>• <strong>50,000 SHOT</strong> (6개월): 20K + 추가 정밀 점검</p>
              <p>• <strong>80,000 SHOT</strong>: 50K + 청소/습합 집중</p>
              <p>• <strong>100,000 SHOT</strong> (1년): 전체 종합 점검</p>
            </div>
          </div>

          {/* 점검 유형 선택 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">점검 유형 선택</h3>
            {INSPECTION_TYPES.map((type) => {
              const isRecommended = recommendedType?.id === type.id;
              const totalItems = type.categories.reduce((sum, cat) => sum + cat.items.length, 0);

              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isRecommended
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {isRecommended && (
                        <span className="inline-block px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded mb-1">
                          권장
                        </span>
                      )}
                      <h4 className="font-semibold text-slate-900 text-sm">{type.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{type.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500">
                        {type.categories.length}개 카테고리
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {totalItems}개 항목
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // 점검 진행 화면
  const currentCategory = selectedType.categories[currentCategoryIndex];
  const totalCategories = selectedType.categories.length;
  const allItems = selectedType.categories.flatMap(cat => cat.items);
  const completedItems = Object.keys(checkResults).filter(key => checkResults[Number(key)]?.status).length;
  const progress = Math.round((completedItems / allItems.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedType(null)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-sm font-semibold text-slate-900">{selectedType.name}</div>
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
        <div className="flex px-3 py-3 gap-2 min-w-max">
          {selectedType.categories.map((category, index) => {
            const { completed, total } = getCategoryProgress(category);
            const isActive = index === currentCategoryIndex;
            const isComplete = completed === total;

            return (
              <button
                key={category.id}
                onClick={() => setCurrentCategoryIndex(index)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs whitespace-nowrap transition-all ${
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
                  <button
                    onClick={() => setShowGuide(item)}
                    className="text-blue-500 flex items-center gap-1 text-[10px]"
                  >
                    <BookOpen size={14} />
                    가이드
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
              </div>

              {/* 상태 선택 버튼 (양호/정비 필요/수리 필요) */}
              <div className="flex gap-2 mt-2">
                {(['양호', '정비 필요', '수리 필요'] as CheckStatus[]).map((status) => {
                  const isSelected = result.status === status;
                  const colors = {
                    '양호': isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-300',
                    '정비 필요': isSelected ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-300',
                    '수리 필요': isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-300'
                  };
                  const icons = {
                    '양호': <Check size={14} />,
                    '정비 필요': <AlertTriangle size={14} />,
                    '수리 필요': <Wrench size={14} />
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

              {/* 비고 입력 (정비 필요/수리 필요 선택 시 표시) */}
              {(result.status === '정비 필요' || result.status === '수리 필요') && (
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

              {/* 사진 추가 */}
              <InspectionPhotoSection
                photos={result.photos || []}
                onPhotosChange={(photos: PhotoItem[]) => handlePhotosChange(item.id, photos)}
                moldId={moldId}
                itemId={item.id}
                inspectionType="periodic"
                maxPhotos={10}
              />
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

      {/* 저장 메시지 */}
      {saveMessage && (
        <div className={`mx-4 mb-2 p-2.5 rounded-lg text-xs font-medium ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{saveMessage.text}</div>
      )}

      {/* 승인자 표시 */}
      {selectedApprover && (
        <div className="mx-4 mb-2 p-2.5 bg-blue-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-1.5"><User size={14} className="text-blue-600" /><span className="text-xs text-blue-800">승인자: <strong>{selectedApprover.name}</strong></span></div>
          <button onClick={() => setSelectedApprover(null)} className="text-blue-400"><X size={14} /></button>
        </div>
      )}

      {/* 임시저장 / 승인요청 */}
      <div className="flex gap-2 px-4 mb-2">
        <button onClick={handleSaveDraft} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-300 rounded-xl text-slate-700 text-xs font-medium disabled:opacity-50">
          <Save size={14} />{saving ? '저장중...' : '임시저장'}
        </button>
        <button onClick={handleRequestApproval} disabled={saving}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium disabled:opacity-50 ${
            selectedApprover ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
          <Send size={14} />{selectedApprover ? '승인요청' : '승인자 선택'}
        </button>
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3 px-4 pb-4">
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

      {/* 승인자 검색 모달 */}
      {showApproverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">승인자 선택</h3>
              <button onClick={() => setShowApproverModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input type="text" className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="이름 검색" value={approverKeyword} onChange={(e) => setApproverKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchApprover()} />
                <button onClick={() => handleSearchApprover()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"><Search size={16} /></button>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {approverResults.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">{approverKeyword ? '검색 결과가 없습니다.' : '담당자 목록을 불러오는 중...'}</p>
                )}
                {approverResults.map((u: any) => (
                  <button key={u.id} onClick={() => { setSelectedApprover(u); setShowApproverModal(false); setApproverKeyword(''); setApproverResults([]); }} className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 transition">
                    <div className="text-sm font-medium">
                      {u.name}
                      <span className="ml-1 text-[10px] text-gray-400">({u.username})</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${u.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.user_type === 'system_admin' ? '관리자' : '금형개발'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{u.email || '-'} {u.company_name && `| ${u.company_name}`}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" />
                점검 가이드
              </h3>
              <button
                onClick={() => setShowGuide(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 항목 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{showGuide.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{showGuide.description}</p>
              </div>

              {/* 점검 포인트 */}
              {showGuide.checkPoints && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h5 className="text-xs font-semibold text-blue-900 mb-2">📋 점검 포인트</h5>
                  <ul className="space-y-2">
                    {showGuide.checkPoints.map((point, idx) => (
                      <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 참고 사진 (플레이스홀더) */}
              <div>
                <h5 className="text-xs font-semibold text-slate-900 mb-2">📷 참고 사진</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                    양호 예시
                  </div>
                  <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                    불량 예시
                  </div>
                  <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                    점검 방법
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
