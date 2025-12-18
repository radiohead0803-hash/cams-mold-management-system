import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Check, X, AlertTriangle, Camera, Loader2, 
  ChevronRight, ChevronLeft, MapPin, Send, Clock, CheckCircle,
  FileText, Package, Wrench, Thermometer, TestTube, Truck, ClipboardCheck,
  Upload, Trash2, Image, ThumbsUp, ThumbsDown, Eye
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// 카테고리 아이콘 매핑
const categoryIcons = {
  repair_history: FileText,
  surface: Package,
  function: Wrench,
  dimension: ClipboardCheck,
  cooling: Thermometer,
  trial: TestTube,
  shipment: Truck,
  final: CheckCircle
};

export default function RepairShipmentChecklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repairRequestId = searchParams.get('repairRequestId');
  const moldId = searchParams.get('moldId');
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [currentPhotoItemId, setCurrentPhotoItemId] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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
          maker_checker_name: user?.name
        });
        
        if (createRes.data.success) {
          setChecklist(createRes.data.data);
          organizeCategories(createRes.data.data.items);
        }
      }
    } catch (err) {
      console.error('체크리스트 로드 오류:', err);
      setError(err.response?.data?.error?.message || '체크리스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별로 항목 정리
  const organizeCategories = (items) => {
    const categoryMap = {};
    
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
  const handleResultChange = async (itemId, result) => {
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
          item.id === itemId ? { ...item, result, checked_by_name: user?.name } : item
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
    } catch (err) {
      setError(err.response?.data?.error?.message || '결과 저장에 실패했습니다.');
    }
  };

  // 비고 업데이트
  const handleNotesChange = async (itemId, notes) => {
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
  const handleCameraClick = (itemId) => {
    setCurrentPhotoItemId(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 사진 업로드 처리
  const handleFileChange = async (e) => {
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
  const handleDeletePhoto = async (itemId, photoUrl) => {
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
        maker_checker_name: user?.name
      });
      
      setSuccess('승인 요청이 완료되었습니다. 본사 승인을 기다려주세요.');
      setChecklist(prev => prev ? { ...prev, status: 'pending_approval' } : null);
    } catch (err) {
      setError(err.response?.data?.error?.message || '승인 요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 본사 승인
  const handleApprove = async () => {
    if (!checklist) return;
    
    setSubmitting(true);
    try {
      await api.post(`/repair-shipment-checklists/${checklist.id}/approve`, {
        hq_approver_id: user?.id,
        hq_approver_name: user?.name
      });
      
      setSuccess('승인이 완료되었습니다. 출하가 가능합니다.');
      setChecklist(prev => prev ? { ...prev, status: 'approved' } : null);
      setShowApprovalModal(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || '승인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 본사 반려
  const handleReject = async () => {
    if (!checklist || !rejectionReason.trim()) {
      setError('반려 사유를 입력해주세요.');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/repair-shipment-checklists/${checklist.id}/reject`, {
        hq_approver_id: user?.id,
        hq_approver_name: user?.name,
        rejection_reason: rejectionReason
      });
      
      setSuccess('반려되었습니다.');
      setChecklist(prev => prev ? { ...prev, status: 'rejected', hq_rejection_reason: rejectionReason } : null);
      setShowApprovalModal(false);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.error?.message || '반려에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 카테고리 진행률 계산
  const getCategoryProgress = (category) => {
    const completed = category.items.filter(i => i.result !== 'pending').length;
    return { completed, total: category.items.length };
  };

  // 전체 진행률 계산
  const getTotalProgress = () => {
    const allItems = categories.flatMap(c => c.items);
    const completed = allItems.filter(i => i.result !== 'pending').length;
    return Math.round((completed / allItems.length) * 100) || 0;
  };

  const isHQ = user?.user_type === 'system_admin' || user?.user_type === 'mold_developer';
  const isMaker = user?.user_type === 'maker';
  const isReadOnly = checklist?.status === 'approved' || checklist?.status === 'shipped' || 
                     (checklist?.status === 'pending_approval' && isMaker);
  const canApprove = isHQ && checklist?.status === 'pending_approval';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">체크리스트 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!checklist || categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-2">체크리스트를 불러올 수 없습니다</p>
          <p className="text-sm text-gray-500 mb-4">{error || '수리요청 ID를 확인해주세요.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const progress = getTotalProgress();
  const CategoryIcon = categoryIcons[currentCategory?.code] || FileText;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">수리 후 출하점검 체크리스트</h1>
                <p className="text-sm text-gray-500">{checklist.checklist_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 상태 배지 */}
              {checklist.status === 'draft' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">작성중</span>
              )}
              {checklist.status === 'pending_approval' && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full flex items-center gap-1">
                  <Clock size={14} />
                  승인대기
                </span>
              )}
              {checklist.status === 'approved' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
                  <CheckCircle size={14} />
                  승인완료
                </span>
              )}
              {checklist.status === 'rejected' && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full flex items-center gap-1">
                  <X size={14} />
                  반려
                </span>
              )}
              
              {/* 승인/반려 버튼 (본사 담당자) */}
              {canApprove && (
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  승인/반려
                </button>
              )}
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">전체 진행률</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-6">
          {/* 사이드바 - 카테고리 목록 */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-32">
              <h3 className="font-semibold text-gray-900 mb-3">점검 카테고리</h3>
              <div className="space-y-2">
                {categories.map((category, index) => {
                  const { completed, total } = getCategoryProgress(category);
                  const isActive = index === currentCategoryIndex;
                  const isComplete = completed === total;
                  const Icon = categoryIcons[category.code] || FileText;

                  return (
                    <button
                      key={category.code}
                      onClick={() => setCurrentCategoryIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : isComplete
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Icon size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{category.name}</div>
                        <div className="text-xs opacity-75">{completed}/{total} 완료</div>
                      </div>
                      {isComplete && <Check size={14} className="text-green-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 메인 컨텐츠 - 점검 항목 */}
          <div className="col-span-9">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CategoryIcon size={20} className="text-blue-500" />
                  {currentCategory?.name}
                </h2>
                <span className="text-sm text-gray-500">
                  {currentCategoryIndex + 1} / {categories.length}
                </span>
              </div>

              <div className="space-y-4">
                {currentCategory?.items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    {/* 항목 헤더 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          <span className="text-blue-500 mr-2">[{item.item_code}]</span>
                          {item.item_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{item.item_description}</p>
                        {/* 사진 필수 상태 표시 */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                            item.photo_urls && item.photo_urls.length > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            📷 사진필수 {item.photo_urls && item.photo_urls.length > 0 ? `(${item.photo_urls.length}장 첨부)` : '(미첨부)'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCameraClick(item.id)}
                        disabled={isReadOnly || uploadingItemId === item.id}
                        className={`ml-4 p-3 rounded-lg ${
                          uploadingItemId === item.id
                            ? 'bg-blue-100 text-blue-500'
                            : isReadOnly
                            ? 'bg-gray-100 text-gray-400'
                            : item.photo_urls && item.photo_urls.length > 0
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 animate-pulse'
                        }`}
                      >
                        {uploadingItemId === item.id ? (
                          <Loader2 size={24} className="animate-spin" />
                        ) : (
                          <Camera size={24} />
                        )}
                      </button>
                    </div>

                    {/* 상태 선택 버튼 */}
                    <div className="flex gap-2 mb-3">
                      {['pass', 'fail', 'na'].map((result) => {
                        const isSelected = item.result === result;
                        const colors = {
                          pass: isSelected ? 'bg-green-500 text-white' : 'bg-white text-green-600 border-green-300 hover:bg-green-50',
                          fail: isSelected ? 'bg-red-500 text-white' : 'bg-white text-red-600 border-red-300 hover:bg-red-50',
                          na: isSelected ? 'bg-gray-500 text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        };
                        const labels = { pass: 'PASS', fail: 'FAIL', na: 'N/A' };
                        const icons = {
                          pass: <Check size={16} />,
                          fail: <X size={16} />,
                          na: <span className="text-xs">N/A</span>
                        };

                        return (
                          <button
                            key={result}
                            onClick={() => !isReadOnly && handleResultChange(item.id, result)}
                            disabled={isReadOnly}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border font-medium transition-all ${colors[result]} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {icons[result]}
                            {labels[result]}
                          </button>
                        );
                      })}
                    </div>

                    {/* 비고 입력 */}
                    {item.result === 'fail' && (
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        disabled={isReadOnly}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
                        rows={2}
                        placeholder="불합격 사유를 입력하세요"
                      />
                    )}

                    {/* 첨부 사진 */}
                    {item.photo_urls && item.photo_urls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Image size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500">첨부 사진 ({item.photo_urls.length})</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {item.photo_urls.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`점검 사진 ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                              {!isReadOnly && (
                                <button
                                  onClick={() => handleDeletePhoto(item.id, url)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 점검자 정보 */}
                    {item.checked_by_name && (
                      <div className="mt-2 text-xs text-gray-400">
                        점검: {item.checked_by_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 에러/성공 메시지 */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* 하단 네비게이션 */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setCurrentCategoryIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentCategoryIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  이전
                </button>
                
                {currentCategoryIndex === categories.length - 1 ? (
                  isMaker && checklist.status === 'draft' && (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      승인 요청
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setCurrentCategoryIndex(prev => Math.min(categories.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                  >
                    다음
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 승인/반려 모달 */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">출하점검 승인/반려</h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p>체크리스트: {checklist.checklist_number}</p>
                <p>제작처 점검자: {checklist.maker_checker_name}</p>
                <p>점검일: {checklist.maker_check_date ? new Date(checklist.maker_check_date).toLocaleDateString('ko-KR') : '-'}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">반려 시 사유 (반려 시 필수)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="반려 사유를 입력하세요"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
              >
                <ThumbsDown size={16} />
                반려
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
              >
                <ThumbsUp size={16} />
                승인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
