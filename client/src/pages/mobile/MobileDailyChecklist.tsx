// client/src/pages/mobile/MobileDailyChecklist.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, X, ChevronRight, ChevronLeft, Camera, Loader2, BookOpen, Image, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import api from '../../lib/api';

// 웹버전과 동일한 일상점검 카테고리/항목 구조 (checkPoints 포함)
const CHECK_CATEGORIES = [
  {
    id: 1,
    name: '금형 외관 점검',
    icon: '🔍',
    items: [
      { id: 101, name: '금형 외관 상태', description: '금형 외관의 손상, 변형, 부식 여부 확인', required: true, checkPoints: ['금형 표면 스크래치 확인', '찌그러짐/변형 여부', '녹/부식 발생 여부', '외관 청결 상태'] },
      { id: 102, name: '금형 명판 상태', description: '명판 식별 가능 여부 확인', required: true, checkPoints: ['금형 번호 식별 가능', '제작일자 확인 가능', '명판 손상 여부'] },
      { id: 103, name: '파팅라인 상태', description: '파팅라인 밀착 상태 및 버 발생 여부', required: true, checkPoints: ['상/하형 접합부 밀착도', '버(Burr) 발생 여부', '수지 간섭 흔적 확인', '찌꺼기 제거 상태'] }
    ]
  },
  {
    id: 2,
    name: '냉각 시스템',
    icon: '💧',
    items: [
      { id: 201, name: '냉각수 연결 상태', description: '냉각수 라인 연결 및 누수 여부', required: true, checkPoints: ['입/출구 호스 연결 상태', '누수 여부 확인', '커플링 체결 상태'] },
      { id: 202, name: '냉각수 유량', description: '냉각수 흐름 원활 여부 (온도차 5℃ 이하)', required: true, checkPoints: ['입구 온도 측정', '출구 온도 측정', '온도차 5℃ 이하 확인', '유량 정상 여부'] },
      { id: 203, name: '냉각 채널 막힘', description: '냉각 채널 스케일/이물질 막힘', required: false, checkPoints: ['채널 막힘 여부', '스케일 축적 상태', '냉각 효율 저하 여부'] }
    ]
  },
  {
    id: 3,
    name: '작동부 점검',
    icon: '⚙️',
    items: [
      { id: 301, name: '이젝터 작동 상태', description: '이젝터 핀 작동 원활성', required: true, checkPoints: ['이젝터 핀 걸림 없음', '부드러운 작동 확인', '복귀 동작 정상'] },
      { id: 302, name: '슬라이드 작동 상태', description: '슬라이드 코어 작동 상태', required: false, checkPoints: ['슬라이드 이동 시 걸림 확인', '이상음 발생 여부', '작동 속도 정상 여부'] },
      { id: 303, name: '가이드 핀/부시 상태', description: '가이드 핀 마모 및 유격', required: true, checkPoints: ['가이드핀 손상 확인', '마모 상태 점검', '유격 정상 여부'] },
      { id: 304, name: '밀핀/제품핀', description: '작동 시 걸림, 파손, 변형 無', required: true, checkPoints: ['밀핀 작동 확인', '파손 여부 점검', '변형 상태 확인'] },
      { id: 305, name: '리턴 핀/스프링', description: '리턴 핀 작동 및 스프링 탄성', required: true, checkPoints: ['리턴 핀 복귀 동작', '스프링 탄성 상태', '정상 작동 확인'] }
    ]
  },
  {
    id: 4,
    name: '게이트/런너/벤트',
    icon: '🔄',
    items: [
      { id: 401, name: '게이트 상태', description: '게이트 마모 및 손상 여부', required: true, checkPoints: ['게이트 마모 확인', '변형/손상 여부', '막힘 상태 점검'] },
      { id: 402, name: '런너 상태', description: '런너 청결 및 막힘 여부', required: true, checkPoints: ['잔류 수지 확인', '이물질 여부', '청결 상태'] },
      { id: 403, name: '벤트 상태', description: '가스 벤트 막힘 여부', required: true, checkPoints: ['벤트 구멍 막힘 확인', '가스 배출 원활성', '이물질 제거 상태'] }
    ]
  },
  {
    id: 5,
    name: '히터/센서/전기',
    icon: '🌡️',
    items: [
      { id: 501, name: '히터/온도센서 상태', description: '히터 작동 및 센서 정상 여부', required: false, checkPoints: ['히터 작동 확인', '온도센서 정상 작동', '과열 여부 점검', '단선/접촉불량 확인'] },
      { id: 502, name: '배선/커넥터 상태', description: '전기 배선 손상 여부', required: false, checkPoints: ['배선 피복 상태', '커넥터 접촉 상태', '단선 여부 확인'] }
    ]
  },
  {
    id: 6,
    name: '체결/취출 계통',
    icon: '🔧',
    items: [
      { id: 601, name: '금형 체결볼트', description: '풀림, 균열, 아이마킹 상태', required: true, checkPoints: ['볼트 풀림 확인', '균열 발생 여부', '아이마킹 상태'] },
      { id: 602, name: '로케이트링/스프루부', description: '위치이탈, 손상 無', required: true, checkPoints: ['로케이트링 위치', '스프루부 손상 여부', '고정 상태 확인'] },
      { id: 603, name: '취출핀/스프링', description: '정상작동, 파손·마모 無', required: true, checkPoints: ['취출핀 작동 확인', '스프링 탄성 상태', '파손/마모 여부'] }
    ]
  },
  {
    id: 7,
    name: '윤활/청결 관리',
    icon: '🧴',
    items: [
      { id: 701, name: '슬라이드/핀류 윤활', description: '그리스 도포 상태 양호', required: true, checkPoints: ['슬라이드 그리스 상태', '핀류 윤활 상태', '그리스 도포량 적정'] },
      { id: 702, name: '엘글라/리프트핀 윤활', description: '그리스 도포 상태 양호', required: true, checkPoints: ['엘글라 그리스 상태', '리프트핀 윤활 상태', '도포 상태 확인'] },
      { id: 703, name: '성형면 청결', description: '캐비티/코어 이물질 제거', required: true, checkPoints: ['캐비티 표면 수지 잔류 확인', '코어 청결 상태', '이물질 제거 완료'] }
    ]
  },
  {
    id: 8,
    name: '이상/누출 점검',
    icon: '⚠️',
    items: [
      { id: 801, name: '누유/누수 여부', description: '냉각수, 오일, 에어라인 이상 無', required: true, checkPoints: ['냉각수 누수 확인', '오일 누유 확인', '에어라인 이상 확인'] }
    ]
  },
  {
    id: 9,
    name: '방청 관리',
    icon: '🛡️',
    items: [
      { id: 901, name: '방청유 도포', description: '보관 시 성형면 방청처리 (비가동 시)', required: false, checkPoints: ['방청유 도포 상태', '성형면 처리 확인', '보관 환경 적정'] }
    ]
  },
  {
    id: 10,
    name: '생산 정보',
    icon: '📊',
    items: [
      { id: 1001, name: '생산수량', description: '금일 생산수량 입력 (숏수 자동 누적)', required: false, fieldType: 'number', checkPoints: ['생산수량 정확히 입력', '숏수 자동 누적 확인', '보증숏수 90% 도달 시 경고', '100% 도달 시 긴급 알림'] }
    ]
  }
];

interface Item {
  id: number;
  name: string;
  description: string;
  required: boolean;
  checkPoints?: string[];
  fieldType?: string;
}

type CheckStatus = '양호' | '주의' | '불량' | null;

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
  const [showGuide, setShowGuide] = useState<Item | null>(null);
  const [success, setSuccess] = useState('');
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoItemId, setCurrentPhotoItemId] = useState<number | null>(null);

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

  // 카메라/갤러리 열기
  const handleCameraClick = (itemId: number) => {
    setCurrentPhotoItemId(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 사진 업로드 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPhotoItemId) return;

    setUploadingItemId(currentPhotoItemId);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('mold_id', moldId || '');
      formData.append('item_id', String(currentPhotoItemId));
      formData.append('inspection_type', 'daily');
      formData.append('shot_count', String(mold?.current_shots || 0));

      const res = await api.post('/inspection-photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const newPhoto: PhotoItem = {
          id: res.data.data.id,
          file_url: res.data.data.file_url,
          thumbnail_url: res.data.data.thumbnail_url
        };

        setCheckResults(prev => ({
          ...prev,
          [currentPhotoItemId]: {
            ...prev[currentPhotoItemId],
            photos: [...(prev[currentPhotoItemId]?.photos || []), newPhoto]
          }
        }));
      }
    } catch (err) {
      console.error('사진 업로드 실패:', err);
      setError('사진 업로드에 실패했습니다.');
    } finally {
      setUploadingItemId(null);
      setCurrentPhotoItemId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 사진 삭제
  const handleDeletePhoto = async (itemId: number, photoId: string) => {
    try {
      await api.delete(`/inspection-photos/${photoId}`);
      setCheckResults(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photos: prev[itemId]?.photos?.filter(p => p.id !== photoId) || []
        }
      }));
    } catch (err) {
      console.error('사진 삭제 실패:', err);
    }
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
      {/* 숨겨진 파일 입력 (카메라/갤러리) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

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
        <div className="flex px-3 py-3 gap-2 min-w-max">
          {CHECK_CATEGORIES.map((category, index) => {
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGuide(item as Item)}
                      className="text-blue-500 flex items-center gap-1 text-[10px]"
                    >
                      <BookOpen size={14} />
                      가이드
                    </button>
                    <button
                      onClick={() => handleCameraClick(item.id)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${uploadingItemId === item.id ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'} text-blue-600 transition-all`}
                      disabled={uploadingItemId === item.id}
                    >
                      {uploadingItemId === item.id ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Camera size={20} />
                      )}
                    </button>
                  </div>
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

              {/* 업로드된 사진 표시 */}
              {result.photos && result.photos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 mb-2">
                    <Image size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500">업로드된 사진 ({result.photos.length})</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {result.photos.map((photo) => (
                      <div key={photo.id} className="relative flex-shrink-0">
                        <img
                          src={photo.thumbnail_url || photo.file_url}
                          alt="점검 사진"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => handleDeletePhoto(item.id, photo.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
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
