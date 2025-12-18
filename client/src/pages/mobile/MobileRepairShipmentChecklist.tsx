import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Check, X, AlertTriangle, Camera, Loader2, 
  ChevronRight, ChevronLeft, MapPin, Send, Clock, CheckCircle,
  FileText, Package, Wrench, Thermometer, TestTube, Truck, ClipboardCheck,
  Upload, Trash2, Image
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, any> = {
  repair_history: FileText,
  surface: Package,
  function: Wrench,
  dimension: ClipboardCheck,
  cooling: Thermometer,
  trial: TestTube,
  shipment: Truck,
  final: CheckCircle
};

// 결과 타입
type CheckResult = 'pass' | 'fail' | 'na' | 'pending';

interface ChecklistItem {
  id: number;
  category_code: string;
  category_name: string;
  category_order: number;
  item_code: string;
  item_name: string;
  item_description: string;
  item_order: number;
  result: CheckResult;
  photo_required: boolean;
  photo_urls: string[] | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  notes: string | null;
  fail_reason: string | null;
  checked_by: number | null;
  checked_by_name: string | null;
  checked_at: string | null;
  metadata: any;
}

interface Checklist {
  id: number;
  checklist_number: string;
  repair_request_id: number;
  mold_id: number;
  status: string;
  maker_checker_name: string | null;
  maker_check_date: string | null;
  hq_approver_name: string | null;
  hq_approval_date: string | null;
  hq_rejection_reason: string | null;
  total_items: number;
  passed_items: number;
  failed_items: number;
  na_items: number;
  items: ChecklistItem[];
}

interface Category {
  code: string;
  name: string;
  order: number;
  items: ChecklistItem[];
}

export default function MobileRepairShipmentChecklist() {
  const { moldId } = useParams();
  const [searchParams] = useSearchParams();
  const repairRequestId = searchParams.get('repairRequestId');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [currentPhotoItemId, setCurrentPhotoItemId] = useState<number | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // GPS 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => console.log('GPS 오류:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // 체크리스트 로드 또는 생성
  useEffect(() => {
    loadOrCreateChecklist();
  }, [repairRequestId, moldId]);

  const loadOrCreateChecklist = async () => {
    if (!repairRequestId || !moldId) {
      setError('수리요청 ID와 금형 ID가 필요합니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 기존 체크리스트 조회
      const res = await api.get(`/repair-shipment-checklists/repair-request/${repairRequestId}`);
      
      if (res.data.success && res.data.data) {
        setChecklist(res.data.data);
        organizeCategories(res.data.data.items);
      } else {
        // 체크리스트 생성
        const createRes = await api.post('/repair-shipment-checklists', {
          repair_request_id: repairRequestId,
          mold_id: moldId,
          maker_checker_id: user?.id,
          maker_checker_name: user?.name,
          gps_latitude: gpsLocation?.latitude,
          gps_longitude: gpsLocation?.longitude
        });
        
        if (createRes.data.success) {
          setChecklist(createRes.data.data);
          organizeCategories(createRes.data.data.items);
        }
      }
    } catch (err: any) {
      console.error('체크리스트 로드 오류:', err);
      setError(err.response?.data?.error?.message || '체크리스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별로 항목 정리
  const organizeCategories = (items: ChecklistItem[]) => {
    const categoryMap: Record<string, Category> = {};
    
    items.forEach(item => {
      if (!categoryMap[item.category_code]) {
        categoryMap[item.category_code] = {
          code: item.category_code,
          name: item.category_name,
          order: item.category_order,
          items: []
        };
      }
      categoryMap[item.category_code].items.push(item);
    });
    
    const sortedCategories = Object.values(categoryMap)
      .sort((a, b) => a.order - b.order)
      .map(cat => ({
        ...cat,
        items: cat.items.sort((a, b) => a.item_order - b.item_order)
      }));
    
    setCategories(sortedCategories);
  };

  // 항목 결과 업데이트
  const handleResultChange = async (itemId: number, result: CheckResult) => {
    if (!checklist) return;
    
    try {
      await api.put(`/repair-shipment-checklists/${checklist.id}/items/${itemId}`, {
        result,
        checked_by: user?.id,
        checked_by_name: user?.name
      });
      
      // 로컬 상태 업데이트
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, result, checked_by_name: user?.name || null } : item
        )
      })));
      
      // 체크리스트 통계 업데이트
      const allItems = categories.flatMap(c => c.items);
      const updatedItems = allItems.map(item => item.id === itemId ? { ...item, result } : item);
      setChecklist(prev => prev ? {
        ...prev,
        passed_items: updatedItems.filter(i => i.result === 'pass').length,
        failed_items: updatedItems.filter(i => i.result === 'fail').length,
        na_items: updatedItems.filter(i => i.result === 'na').length
      } : null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '결과 저장에 실패했습니다.');
    }
  };

  // 비고 업데이트
  const handleNotesChange = async (itemId: number, notes: string) => {
    if (!checklist) return;
    
    try {
      await api.put(`/repair-shipment-checklists/${checklist.id}/items/${itemId}`, { notes });
      
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, notes } : item
        )
      })));
    } catch (err) {
      console.error('비고 저장 오류:', err);
    }
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
    if (!file || !currentPhotoItemId || !checklist) return;

    setUploadingItemId(currentPhotoItemId);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('mold_id', moldId || '');
      formData.append('item_id', String(currentPhotoItemId));
      formData.append('inspection_type', 'repair_shipment');

      const res = await api.post('/inspection-photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const photoUrl = res.data.data.file_url;
        
        // 항목의 photo_urls 업데이트
        const item = categories.flatMap(c => c.items).find(i => i.id === currentPhotoItemId);
        const currentPhotos = item?.photo_urls || [];
        const newPhotos = [...currentPhotos, photoUrl];
        
        await api.put(`/repair-shipment-checklists/${checklist.id}/items/${currentPhotoItemId}`, {
          photo_urls: newPhotos
        });

        setCategories(prev => prev.map(cat => ({
          ...cat,
          items: cat.items.map(item => 
            item.id === currentPhotoItemId 
              ? { ...item, photo_urls: newPhotos } 
              : item
          )
        })));
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
  const handleDeletePhoto = async (itemId: number, photoUrl: string) => {
    if (!checklist) return;
    
    try {
      const item = categories.flatMap(c => c.items).find(i => i.id === itemId);
      const newPhotos = (item?.photo_urls || []).filter(url => url !== photoUrl);
      
      await api.put(`/repair-shipment-checklists/${checklist.id}/items/${itemId}`, {
        photo_urls: newPhotos
      });

      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, photo_urls: newPhotos } : item
        )
      })));
    } catch (err) {
      console.error('사진 삭제 실패:', err);
    }
  };

  // 승인 요청 (제작처 점검 완료)
  const handleSubmit = async () => {
    if (!checklist) return;
    
    // 미완료 항목 확인
    const allItems = categories.flatMap(c => c.items);
    const pendingItems = allItems.filter(i => i.result === 'pending');
    
    if (pendingItems.length > 0) {
      setError(`미완료 항목이 ${pendingItems.length}개 있습니다. 모든 항목을 점검해주세요.`);
      return;
    }
    
    // FAIL 항목 확인
    const failedItems = allItems.filter(i => i.result === 'fail');
    if (failedItems.length > 0) {
      setError(`불합격 항목이 ${failedItems.length}개 있습니다. 모든 항목이 PASS여야 승인 요청이 가능합니다.`);
      return;
    }
    
    // 사진 필수 항목 확인
    const photoRequiredItems = allItems.filter(i => i.photo_required && i.result === 'pass');
    for (const item of photoRequiredItems) {
      if (!item.photo_urls || item.photo_urls.length === 0) {
        setError(`항목 [${item.item_code}] ${item.item_name}에 사진 첨부가 필요합니다.`);
        return;
      }
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await api.post(`/repair-shipment-checklists/${checklist.id}/submit`, {
        maker_checker_id: user?.id,
        maker_checker_name: user?.name,
        gps_latitude: gpsLocation?.latitude,
        gps_longitude: gpsLocation?.longitude
      });
      
      setSuccess('승인 요청이 완료되었습니다. 본사 승인을 기다려주세요.');
      
      // 체크리스트 상태 업데이트
      setChecklist(prev => prev ? { ...prev, status: 'pending_approval' } : null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '승인 요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 카테고리 진행률 계산
  const getCategoryProgress = (category: Category) => {
    const completed = category.items.filter(i => i.result !== 'pending').length;
    return { completed, total: category.items.length };
  };

  // 전체 진행률 계산
  const getTotalProgress = () => {
    const allItems = categories.flatMap(c => c.items);
    const completed = allItems.filter(i => i.result !== 'pending').length;
    return Math.round((completed / allItems.length) * 100) || 0;
  };

  // 다음/이전 카테고리
  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-slate-600">체크리스트 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!checklist || categories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-2">체크리스트를 불러올 수 없습니다</p>
          <p className="text-sm text-slate-500 mb-4">{error || '수리요청 ID를 확인해주세요.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const progress = getTotalProgress();
  const isReadOnly = checklist.status === 'pending_approval' || checklist.status === 'approved' || checklist.status === 'shipped';
  const CategoryIcon = categoryIcons[currentCategory.code] || FileText;

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
              <div className="text-sm font-semibold text-slate-900">수리 후 출하점검</div>
              <div className="text-[10px] text-slate-500">
                {checklist.checklist_number}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {checklist.status === 'pending_approval' && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full flex items-center gap-1">
                <Clock size={10} />
                승인대기
              </span>
            )}
            {checklist.status === 'approved' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-full flex items-center gap-1">
                <CheckCircle size={10} />
                승인완료
              </span>
            )}
            <span className="text-xs text-slate-600">{progress}%</span>
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
          {categories.map((category, index) => {
            const { completed, total } = getCategoryProgress(category);
            const isActive = index === currentCategoryIndex;
            const isComplete = completed === total;
            const Icon = categoryIcons[category.code] || FileText;

            return (
              <button
                key={category.code}
                onClick={() => setCurrentCategoryIndex(index)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isComplete
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{category.name}</span>
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
            <CategoryIcon size={16} className="text-blue-500" />
            {currentCategory.name}
          </h2>
          <span className="text-xs text-slate-500">
            {currentCategoryIndex + 1} / {categories.length}
          </span>
        </div>

        {currentCategory.items.map((item) => {
          const hasPhoto = item.photo_urls && item.photo_urls.length > 0;
          const needsPhoto = item.photo_required && !hasPhoto && item.result === 'pass';
          
          return (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-3 shadow-sm ${needsPhoto ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}
          >
            {/* 항목 헤더 */}
            <div className="mb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-900">
                    <span className="text-blue-500 mr-1">[{item.item_code}]</span>
                    {item.item_name}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.item_description}</p>
                  {/* 사진 필수 표시 */}
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${hasPhoto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      📷 사진필수 {hasPhoto ? `(${item.photo_urls.length}장)` : '(미첨부)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCameraClick(item.id)}
                  disabled={isReadOnly || uploadingItemId === item.id}
                  className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    uploadingItemId === item.id 
                      ? 'bg-blue-100' 
                      : isReadOnly 
                      ? 'bg-slate-100 text-slate-400' 
                      : needsPhoto
                      ? 'bg-red-100 hover:bg-red-200 text-red-600 animate-pulse'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                  } transition-all`}
                >
                  {uploadingItemId === item.id ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Camera size={24} />
                  )}
                </button>
              </div>
            </div>

            {/* 상태 선택 버튼 (PASS/FAIL/N/A) */}
            <div className="flex gap-2 mt-2">
              {(['pass', 'fail', 'na'] as CheckResult[]).map((result) => {
                const isSelected = item.result === result;
                const colors = {
                  pass: isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-600 border-green-300',
                  fail: isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-300',
                  na: isSelected ? 'bg-slate-500 text-white border-slate-500' : 'bg-white text-slate-600 border-slate-300'
                };
                const labels = { pass: 'PASS', fail: 'FAIL', na: 'N/A' };
                const icons = {
                  pass: <Check size={14} />,
                  fail: <X size={14} />,
                  na: <span className="text-[10px]">N/A</span>
                };

                return (
                  <button
                    key={result}
                    onClick={() => !isReadOnly && handleResultChange(item.id, result)}
                    disabled={isReadOnly}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all ${colors[result]} ${isReadOnly ? 'opacity-60' : ''}`}
                  >
                    {icons[result]}
                    {labels[result]}
                  </button>
                );
              })}
            </div>

            {/* 비고 입력 (FAIL 선택 시 표시) */}
            {item.result === 'fail' && (
              <div className="mt-2">
                <textarea
                  value={item.notes || ''}
                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                  placeholder="불합격 사유를 입력하세요"
                />
              </div>
            )}

            {/* 업로드된 사진 표시 */}
            {item.photo_urls && item.photo_urls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1 mb-2">
                  <Image size={12} className="text-slate-400" />
                  <span className="text-[10px] text-slate-500">첨부 사진 ({item.photo_urls.length})</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.photo_urls.map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img
                        src={url}
                        alt={`점검 사진 ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      />
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeletePhoto(item.id, url)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 점검자 정보 */}
            {item.checked_by_name && (
              <div className="mt-2 text-[10px] text-slate-400">
                점검: {item.checked_by_name}
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border border-slate-300 text-slate-600 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          이전
        </button>
        
        {currentCategoryIndex === categories.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || isReadOnly}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {isReadOnly ? '승인 대기중' : '승인 요청'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-blue-500 text-white font-medium"
          >
            다음
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
