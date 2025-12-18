import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, Camera, Upload, X, AlertCircle, CheckCircle,
  Clock, User, Calendar, FileText, Phone, MapPin, Package, Wrench,
  Building, Truck, DollarSign, ClipboardList, Link2, ChevronDown, ChevronUp,
  Image, Plus, Trash2
} from 'lucide-react';
import { repairRequestAPI, moldSpecificationAPI, inspectionAPI, injectionConditionAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

/**
 * PC 수리요청 양식 페이지
 * 프로세스 기준 섹션 구분:
 * 1. 요청 단계 (Plant): 기본정보 + 사진 + 카테고리(EO/현실화/돌발)
 * 2. 제품/금형 정보: 자동연동 (읽기전용)
 * 3. 수리처 선정 (Plant/개발담당자): 수리처 선정 → 개발담당자 승인
 * 4. 수리후 귀책처리 (개발담당자): 귀책 판정
 * 5. 수리 단계 (Maker): 수리정보
 * 6. 완료/관리 단계 (HQ): 관리정보
 */
export default function RepairRequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const moldId = searchParams.get('moldId');
  const requestId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [images, setImages] = useState([]); // 첨부 이미지
  const [inspectionInfo, setInspectionInfo] = useState({
    lastDailyCheck: null,
    lastPeriodicCheck: null,
    loading: false
  });
  const [injectionCondition, setInjectionCondition] = useState(null);
  const [moldSpec, setMoldSpec] = useState(null);
  const [repairProgress, setRepairProgress] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    request: true,    // 요청 단계
    product: true,    // 제품/금형 정보
    repairShop: false, // 수리처 선정
    liability: false,  // 수리후 귀책처리
    repair: false,    // 수리 단계
    complete: false   // 완료/관리 단계
  });
  
  const [formData, setFormData] = useState({
    // ===== 요청 단계 (Plant 작성) =====
    problem: '',                                    // 문제 내용
    cause_and_reason: '',                           // 원인 및 발생사유
    priority: '보통',                               // 우선순위
    occurred_date: new Date().toISOString().split('T')[0], // 발생일
    problem_type: '',                               // 문제 유형
    occurrence_type: '신규',                        // 발생 유형 (신규/재발)
    repair_category: '',                            // 수리 카테고리 (EO/현실화/돌발)
    requester_name: user?.name || '',               // 요청자
    contact: '',                                    // 연락처
    representative_part_number: '',                 // 대표 품번
    stock_schedule_date: '',                        // 재고 예정일
    stock_quantity: '',                             // 재고 수량
    stock_unit: 'EA',                               // 단위
    
    // ===== 제품/금형 정보 (자동연동) =====
    car_model: '',                                  // 차종
    part_number: '',                                // 품번
    part_name: '',                                  // 품명
    maker: '',                                      // 제작처
    production_site: '',                            // 생산처
    production_shot: '',                            // 현재 타수
    
    // ===== 수리처 선정 (Plant/개발담당자 작성) =====
    repair_shop_type: '',                           // 수리처 유형 (자체/외주)
    repair_company: '',                             // 수리업체
    repair_shop_selected_by: '',                    // 수리처 선정자
    repair_shop_selected_date: '',                  // 수리처 선정일
    repair_shop_approval_status: '대기',            // 수리처 승인상태 (대기/승인/반려)
    repair_shop_approved_by: '',                    // 수리처 승인자 (개발담당자)
    repair_shop_approved_date: '',                  // 수리처 승인일
    repair_shop_rejection_reason: '',               // 수리처 반려사유
    
    // ===== 수리후 귀책처리 (개발담당자 작성) =====
    liability_type: '',                             // 귀책 유형 (제작처/생산처/공동/기타)
    liability_ratio_maker: '',                      // 제작처 귀책비율 (%)
    liability_ratio_plant: '',                      // 생산처 귀책비율 (%)
    liability_reason: '',                           // 귀책 판정 사유
    liability_decided_by: '',                       // 귀책 판정자
    liability_decided_date: '',                     // 귀책 판정일
    
    // ===== 수리 단계 (Maker 작성) =====
    status: '요청접수',                             // 진행상태
    manager_name: '',                               // 담당자
    temporary_action: '',                           // 임시 조치 내용
    root_cause_action: '',                          // 근본 원인 조치
    repair_cost: '',                                // 수리비용
    repair_duration: '',                            // 수리기간
    completion_date: '',                            // 완료예정일
    mold_arrival_date: '',                          // 금형 입고일
    repair_start_date: '',                          // 수리 시작일
    repair_end_date: '',                            // 수리 완료일
    
    // ===== 완료/관리 단계 (HQ 작성) =====
    operation_type: '양산',                         // 운영 유형
    management_type: '',                            // 관리 유형
    sign_off_status: '제출되지 않음',               // 결재 상태
    order_company: ''                               // 발주업체
  });

  useEffect(() => {
    if (requestId) {
      loadRepairRequest();
    } else if (moldId) {
      loadMoldInfo();
    }
  }, [requestId, moldId]);

  // 점검 정보 로드
  useEffect(() => {
    if (moldId) {
      loadInspectionInfo(moldId);
    }
  }, [moldId]);

  const loadMoldInfo = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        const spec = response.data.data;
        setMoldInfo(spec);
        setMoldSpec(spec); // 금형사양 정보 저장
        setFormData(prev => ({
          ...prev,
          car_model: spec.car_model || '',
          part_number: spec.part_number || '',
          part_name: spec.part_name || '',
          maker: spec.makerCompany?.company_name || '',
          production_site: spec.plantCompany?.company_name || '',
          production_shot: spec.mold?.current_shots || ''
        }));
        
        // 사출조건 정보 로드
        loadInjectionCondition(moldId);
        // 수리 진행현황 로드
        loadRepairProgress(moldId);
      }
    } catch (error) {
      console.error('Load mold info error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 사출조건 정보 로드
  const loadInjectionCondition = async (specId) => {
    try {
      const response = await injectionConditionAPI.get({ mold_spec_id: specId });
      if (response.data?.data) {
        setInjectionCondition(response.data.data);
      }
    } catch (error) {
      console.error('Load injection condition error:', error);
    }
  };

  // 수리 진행현황 로드
  const loadRepairProgress = async (specId) => {
    try {
      const response = await repairRequestAPI.getAll({ mold_spec_id: specId });
      if (response.data?.data) {
        const requests = response.data.data;
        // 상태별 카운트
        const statusCounts = {
          total: requests.length,
          requested: requests.filter(r => r.status === '요청접수').length,
          assigned: requests.filter(r => ['수리처선정', '수리처승인대기', '귀책협의'].includes(r.status)).length,
          inProgress: requests.filter(r => r.status === '수리진행').length,
          inspection: requests.filter(r => r.status === '검수중').length,
          completed: requests.filter(r => r.status === '완료').length,
          latestRequest: requests[0] || null
        };
        setRepairProgress(statusCounts);
      }
    } catch (error) {
      console.error('Load repair progress error:', error);
    }
  };

  // 최근 점검 정보 로드
  const loadInspectionInfo = async (specId) => {
    try {
      setInspectionInfo(prev => ({ ...prev, loading: true }));
      
      // 일상점검 최근 기록 조회
      const dailyResponse = await inspectionAPI.getAll({ 
        mold_spec_id: specId, 
        inspection_type: 'daily',
        limit: 1,
        sort: 'created_at:desc'
      }).catch(() => null);
      
      // 정기점검 최근 기록 조회
      const periodicResponse = await inspectionAPI.getAll({ 
        mold_spec_id: specId, 
        inspection_type: 'periodic',
        limit: 1,
        sort: 'created_at:desc'
      }).catch(() => null);
      
      setInspectionInfo({
        lastDailyCheck: dailyResponse?.data?.data?.[0] || null,
        lastPeriodicCheck: periodicResponse?.data?.data?.[0] || null,
        loading: false
      });
    } catch (error) {
      console.error('Load inspection info error:', error);
      setInspectionInfo(prev => ({ ...prev, loading: false }));
    }
  };

  // 점검 시트로 이동
  const navigateToInspection = (inspection) => {
    if (!inspection) return;
    const path = inspection.inspection_type === 'daily' 
      ? `/daily-check?id=${inspection.id}&moldId=${moldId}`
      : `/periodic-check?id=${inspection.id}&moldId=${moldId}`;
    navigate(path);
  };

  const loadRepairRequest = async () => {
    try {
      setLoading(true);
      const response = await repairRequestAPI.getById(requestId);
      if (response.data?.data) {
        setFormData(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Load repair request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (submitType = 'draft') => {
    // 필수 필드 검증
    if (!formData.problem.trim()) {
      alert('문제 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      const dataToSave = {
        ...formData,
        mold_spec_id: moldId || formData.mold_spec_id,
        submit_type: submitType
      };

      if (requestId) {
        await repairRequestAPI.update(requestId, dataToSave);
        alert('수정되었습니다.');
      } else {
        await repairRequestAPI.create(dataToSave);
        alert('등록되었습니다.');
      }

      navigate(-1);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 이미지 추가
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages(prev => [...prev, {
            id: Date.now() + Math.random(),
            file,
            preview: event.target.result,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  // 이미지 삭제
  const handleImageRemove = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // 클립보드 붙여넣기
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImages(prev => [...prev, {
              id: Date.now() + Math.random(),
              file,
              preview: event.target.result,
              name: `캡처_${new Date().toLocaleString()}.png`
            }]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const priorityOptions = ['높음', '보통', '낮음'];
  const statusOptions = ['요청접수', '수리처선정', '수리처승인대기', '수리후귀책처리', '수리진행', '수리완료', '검수중', '완료'];
  const occurrenceOptions = ['신규', '재발'];
  const operationOptions = ['양산', '개발', '시작'];
  const problemTypeOptions = ['내구성', '외관', '치수', '기능', '기타'];
  const repairCategoryOptions = ['EO', '현실화', '돌발'];  // 수리 카테고리
  const repairShopTypeOptions = ['자체', '외주'];  // 수리처 유형
  const liabilityTypeOptions = ['제작처', '생산처', '공동', '기타'];  // 귀책 유형
  const managementTypeOptions = ['전산공유(L1)', '일반', '긴급'];
  
  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type);
  const isRepairShopApproved = formData.repair_shop_approval_status === '승인';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <Wrench className="w-6 h-6 text-amber-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {requestId ? '수리요청 수정' : '수리요청 등록'}
                </h1>
                <p className="text-sm text-slate-500">
                  {moldInfo ? `${moldInfo.part_number} - ${moldInfo.part_name}` : '금형 수리요청 양식'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                임시저장
              </button>
              <button
                onClick={() => handleSave('submit')}
                disabled={saving}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={16} />
                {saving ? '저장 중...' : '제출'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4" onPaste={handlePaste}>
        {/* ===== 1. 요청 단계 (Plant 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('request')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-slate-800">1. 요청 단계</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Plant 작성</span>
              <span className="text-xs text-red-500">* 필수</span>
            </div>
            {expandedSections.request ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.request && (
            <div className="p-6 space-y-4">
              {/* 문제 내용 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  문제 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.problem}
                  onChange={(e) => handleChange('problem', e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="발생한 문제를 상세히 입력하세요"
                />
              </div>

              {/* 원인 및 발생사유 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  원인 및 발생사유
                </label>
                <textarea
                  value={formData.cause_and_reason}
                  onChange={(e) => handleChange('cause_and_reason', e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="- 원인:&#10;- 발생사유:"
                />
              </div>

              {/* 사진 추가 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Camera size={16} />
                    사진 추가
                    <span className="text-xs text-slate-400">(Ctrl+V로 캡처 이미지 붙여넣기 가능)</span>
                  </div>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
                  {/* 이미지 미리보기 */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {images.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.preview}
                            alt={img.name}
                            className="w-full h-24 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            onClick={() => handleImageRemove(img.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                          <p className="text-xs text-slate-500 mt-1 truncate">{img.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 업로드 버튼 */}
                  <div className="flex items-center justify-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm"
                    >
                      <Upload size={16} />
                      파일 선택
                    </button>
                    <span className="text-sm text-slate-400">또는 이미지를 드래그하세요</span>
                  </div>
                </div>
              </div>

              {/* 수리 카테고리 (EO/현실화/돌발) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  수리 카테고리 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {repairCategoryOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('repair_category', opt)}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                        formData.repair_category === opt
                          ? opt === 'EO' ? 'bg-blue-500 text-white border-blue-500'
                            : opt === '현실화' ? 'bg-green-500 text-white border-green-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt}
                      {opt === 'EO' && <span className="block text-xs mt-1 opacity-80">설계변경</span>}
                      {opt === '현실화' && <span className="block text-xs mt-1 opacity-80">양산준비</span>}
                      {opt === '돌발' && <span className="block text-xs mt-1 opacity-80">긴급수리</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* 우선순위, 발생일, 문제유형, 발생유형 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {priorityOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">발생일</label>
                  <input
                    type="date"
                    value={formData.occurred_date}
                    onChange={(e) => handleChange('occurred_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">문제 유형</label>
                  <select
                    value={formData.problem_type}
                    onChange={(e) => handleChange('problem_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">선택</option>
                    {problemTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">발생 유형</label>
                  <select
                    value={formData.occurrence_type}
                    onChange={(e) => handleChange('occurrence_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {occurrenceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 요청자, 연락처 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">요청자</label>
                  <input
                    type="text"
                    value={formData.requester_name}
                    onChange={(e) => handleChange('requester_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="요청자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleChange('contact', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 대표 품번, 재고 예정일, 재고 수량, 단위 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">대표 품번</label>
                  <input
                    type="text"
                    value={formData.representative_part_number}
                    onChange={(e) => handleChange('representative_part_number', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="대표 품번"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">재고 예정일</label>
                  <input
                    type="date"
                    value={formData.stock_schedule_date}
                    onChange={(e) => handleChange('stock_schedule_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">재고 수량</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">단위</label>
                  <select
                    value={formData.stock_unit}
                    onChange={(e) => handleChange('stock_unit', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="EA">EA</option>
                    <option value="SET">SET</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 2. 제품/금형 정보 (자동연동) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('product')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800">2. 제품/금형 정보</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">자동연동</span>
            </div>
            {expandedSections.product ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.product && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">차종</label>
                  <input
                    type="text"
                    value={formData.car_model}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                    placeholder="자동연동"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">품번</label>
                  <input
                    type="text"
                    value={formData.part_number}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                    placeholder="자동연동"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">품명</label>
                  <input
                    type="text"
                    value={formData.part_name}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                    placeholder="자동연동"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">제작처</label>
                  <input
                    type="text"
                    value={formData.maker}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                    placeholder="자동연동"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">생산처</label>
                  <input
                    type="text"
                    value={formData.production_site}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                    placeholder="자동연동"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">현재 타수</label>
                  <input
                    type="text"
                    value={formData.production_shot}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                    placeholder="자동연동"
                    readOnly
                  />
                </div>
              </div>

              {/* 사출조건 관리 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-red-500">🔥</span>
                    사출조건 관리
                  </h4>
                  <button
                    onClick={() => navigate(`/injection-condition?moldId=${moldId}`)}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600"
                  >
                    상세보기
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs text-slate-500 mb-1">사출온도</p>
                    <p className="text-lg font-bold text-red-600">
                      {injectionCondition?.barrel_temp_1 || '-'}°C
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs text-slate-500 mb-1">사출압력</p>
                    <p className="text-lg font-bold text-orange-600">
                      {injectionCondition?.pressure_1 || '-'} MPa
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-xs text-slate-500 mb-1">사출속도</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {injectionCondition?.speed_1 || '-'} mm/s
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">사이클타임</p>
                    <p className="text-lg font-bold text-slate-600">
                      {injectionCondition?.cycle_time || '-'} sec
                    </p>
                  </div>
                </div>
              </div>

              {/* 금형사양 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-green-500">💎</span>
                    금형사양
                  </h4>
                  <button
                    onClick={() => navigate(`/mold-detail/${moldId}`)}
                    className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600"
                  >
                    상세보기
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">재질</p>
                    <p className="text-lg font-bold text-slate-700">
                      {moldSpec?.material || 'NAK80'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">중량</p>
                    <p className="text-lg font-bold text-slate-700">
                      {moldSpec?.mold?.weight || '-'}kg
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">치수</p>
                    <p className="text-lg font-bold text-slate-700">
                      {moldSpec?.mold?.dimensions || '-'}mm
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">캐비티</p>
                    <p className="text-lg font-bold text-slate-700">
                      {moldSpec?.cavity_count || '-'}개
                    </p>
                  </div>
                </div>
              </div>

              {/* 금형수리 진행현황 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Wrench size={16} className="text-amber-500" />
                    금형수리 진행현황
                  </h4>
                  <button
                    onClick={() => navigate(`/repair-requests?moldId=${moldId}`)}
                    className="px-3 py-1 bg-amber-500 text-white text-xs rounded-full hover:bg-amber-600"
                  >
                    상세보기
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div 
                    onClick={() => repairProgress?.requested > 0 && navigate(`/repair-requests?moldId=${moldId}&status=요청접수`)}
                    className={`p-3 rounded-lg border text-center ${repairProgress?.requested > 0 ? 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.requested > 0 ? 'bg-blue-500 text-white' : 'bg-slate-300 text-white'}`}>
                      <FileText size={14} />
                    </div>
                    <p className="text-xs text-slate-600">요청접수</p>
                    <p className={`text-sm font-bold ${repairProgress?.requested > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{repairProgress?.requested || 0}</p>
                  </div>
                  <div 
                    onClick={() => repairProgress?.assigned > 0 && navigate(`/repair-requests?moldId=${moldId}&status=작업배정`)}
                    className={`p-3 rounded-lg border text-center ${repairProgress?.assigned > 0 ? 'bg-cyan-50 border-cyan-200 cursor-pointer hover:bg-cyan-100' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.assigned > 0 ? 'bg-cyan-500 text-white' : 'bg-slate-300 text-white'}`}>
                      <User size={14} />
                    </div>
                    <p className="text-xs text-slate-600">작업배정</p>
                    <p className={`text-sm font-bold ${repairProgress?.assigned > 0 ? 'text-cyan-600' : 'text-slate-400'}`}>{repairProgress?.assigned || 0}</p>
                  </div>
                  <div 
                    onClick={() => repairProgress?.inProgress > 0 && navigate(`/repair-requests?moldId=${moldId}&status=수리진행`)}
                    className={`p-3 rounded-lg border text-center ${repairProgress?.inProgress > 0 ? 'bg-amber-50 border-amber-200 cursor-pointer hover:bg-amber-100' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.inProgress > 0 ? 'bg-amber-500 text-white' : 'bg-slate-300 text-white'}`}>
                      <Wrench size={14} />
                    </div>
                    <p className="text-xs text-slate-600">수리진행</p>
                    <p className={`text-sm font-bold ${repairProgress?.inProgress > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{repairProgress?.inProgress || 0}</p>
                  </div>
                  <div 
                    onClick={() => repairProgress?.inspection > 0 && navigate(`/repair-requests?moldId=${moldId}&status=검수중`)}
                    className={`p-3 rounded-lg border text-center ${repairProgress?.inspection > 0 ? 'bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.inspection > 0 ? 'bg-purple-500 text-white' : 'bg-slate-300 text-white'}`}>
                      <CheckCircle size={14} />
                    </div>
                    <p className="text-xs text-slate-600">검수완료</p>
                    <p className={`text-sm font-bold ${repairProgress?.inspection > 0 ? 'text-purple-600' : 'text-slate-400'}`}>{repairProgress?.inspection || 0}</p>
                  </div>
                  <div 
                    onClick={() => repairProgress?.completed > 0 && navigate(`/repair-requests?moldId=${moldId}&status=완료`)}
                    className={`p-3 rounded-lg border text-center ${repairProgress?.completed > 0 ? 'bg-green-50 border-green-200 cursor-pointer hover:bg-green-100' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.completed > 0 ? 'bg-green-500 text-white' : 'bg-slate-300 text-white'}`}>
                      <CheckCircle size={14} />
                    </div>
                    <p className="text-xs text-slate-600">최종승인</p>
                    <p className={`text-sm font-bold ${repairProgress?.completed > 0 ? 'text-green-600' : 'text-slate-400'}`}>{repairProgress?.completed || 0}</p>
                  </div>
                </div>
              </div>

              {/* 점검 정보 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <ClipboardList size={16} className="text-blue-600" />
                  점검 관리 현황
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 일상점검 */}
                  <div 
                    onClick={() => navigateToInspection(inspectionInfo.lastDailyCheck)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inspectionInfo.lastDailyCheck 
                        ? 'border-green-200 bg-green-50 hover:border-green-400 cursor-pointer' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">일상점검</span>
                      {inspectionInfo.loading ? (
                        <span className="text-xs text-slate-400">로딩중...</span>
                      ) : inspectionInfo.lastDailyCheck ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={10} /> 기록있음
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">기록없음</span>
                      )}
                    </div>
                    {inspectionInfo.lastDailyCheck ? (
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600">
                          <Calendar size={12} className="inline mr-1" />
                          최근: {new Date(inspectionInfo.lastDailyCheck.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-xs text-slate-500">
                          상태: {inspectionInfo.lastDailyCheck.status === 'approved' ? '승인됨' : 
                                 inspectionInfo.lastDailyCheck.status === 'pending' ? '대기중' : 
                                 inspectionInfo.lastDailyCheck.status}
                        </p>
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <Link2 size={10} /> 클릭하여 점검시트 보기
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">일상점검 기록이 없습니다.</p>
                    )}
                  </div>

                  {/* 정기점검 */}
                  <div 
                    onClick={() => navigateToInspection(inspectionInfo.lastPeriodicCheck)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inspectionInfo.lastPeriodicCheck 
                        ? 'border-purple-200 bg-purple-50 hover:border-purple-400 cursor-pointer' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">정기점검</span>
                      {inspectionInfo.loading ? (
                        <span className="text-xs text-slate-400">로딩중...</span>
                      ) : inspectionInfo.lastPeriodicCheck ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={10} /> 기록있음
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">기록없음</span>
                      )}
                    </div>
                    {inspectionInfo.lastPeriodicCheck ? (
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600">
                          <Calendar size={12} className="inline mr-1" />
                          최근: {new Date(inspectionInfo.lastPeriodicCheck.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-xs text-slate-500">
                          상태: {inspectionInfo.lastPeriodicCheck.status === 'approved' ? '승인됨' : 
                                 inspectionInfo.lastPeriodicCheck.status === 'pending' ? '대기중' : 
                                 inspectionInfo.lastPeriodicCheck.status}
                        </p>
                        <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                          <Link2 size={10} /> 클릭하여 점검시트 보기
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">정기점검 기록이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 3. 수리처 선정 (Plant/개발담당자 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('repairShop')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-slate-800">3. 수리처 선정</span>
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Plant/개발담당자</span>
              {formData.repair_shop_approval_status === '승인' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> 승인됨
                </span>
              )}
              {formData.repair_shop_approval_status === '반려' && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle size={12} /> 반려
                </span>
              )}
            </div>
            {expandedSections.repairShop ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.repairShop && (
            <div className="p-6 space-y-4">
              {/* 수리처 유형 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">수리처 유형</label>
                <div className="flex gap-3">
                  {repairShopTypeOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('repair_shop_type', opt)}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                        formData.repair_shop_type === opt
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt}
                      {opt === '자체' && <span className="block text-xs mt-1 opacity-80">사내 수리</span>}
                      {opt === '외주' && <span className="block text-xs mt-1 opacity-80">외부 업체</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* 수리업체, 선정자, 선정일 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리업체</label>
                  <input
                    type="text"
                    value={formData.repair_company}
                    onChange={(e) => handleChange('repair_company', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                    placeholder="수리업체명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">선정자</label>
                  <input
                    type="text"
                    value={formData.repair_shop_selected_by || user?.name || ''}
                    onChange={(e) => handleChange('repair_shop_selected_by', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                    placeholder="선정자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">선정일</label>
                  <input
                    type="date"
                    value={formData.repair_shop_selected_date}
                    onChange={(e) => handleChange('repair_shop_selected_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* 승인 상태 (개발담당자만 수정 가능) */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">개발담당자 승인</label>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    formData.repair_shop_approval_status === '승인' ? 'bg-green-100 text-green-700' :
                    formData.repair_shop_approval_status === '반려' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {formData.repair_shop_approval_status || '대기'}
                  </span>
                </div>
                
                {isDeveloper && formData.repair_shop_approval_status !== '승인' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('repair_shop_approval_status', '승인');
                          handleChange('repair_shop_approved_by', user?.name || '');
                          handleChange('repair_shop_approved_date', new Date().toISOString().split('T')[0]);
                        }}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt('반려 사유를 입력하세요:');
                          if (reason) {
                            handleChange('repair_shop_approval_status', '반려');
                            handleChange('repair_shop_rejection_reason', reason);
                            handleChange('repair_shop_approved_by', user?.name || '');
                            handleChange('repair_shop_approved_date', new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                      >
                        반려
                      </button>
                    </div>
                  </div>
                )}

                {formData.repair_shop_approved_by && (
                  <div className="mt-3 text-sm text-slate-600">
                    <p>승인자: {formData.repair_shop_approved_by}</p>
                    <p>승인일: {formData.repair_shop_approved_date}</p>
                    {formData.repair_shop_rejection_reason && (
                      <p className="text-red-600">반려사유: {formData.repair_shop_rejection_reason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== 4. 수리후 귀책처리 (개발담당자 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('liability')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-slate-800">4. 수리후 귀책처리</span>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">개발담당자</span>
              {!isRepairShopApproved && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">수리처 승인 후 진행</span>
              )}
            </div>
            {expandedSections.liability ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.liability && (
            <div className={`p-6 space-y-4 ${!isRepairShopApproved ? 'opacity-50 pointer-events-none' : ''}`}>
              {!isRepairShopApproved && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <AlertCircle size={16} className="inline mr-2" />
                  수리처 선정이 승인된 후 수리후 귀책처리를 진행할 수 있습니다.
                </div>
              )}

              {/* 귀책 유형 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">귀책 유형</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {liabilityTypeOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('liability_type', opt)}
                      disabled={!isRepairShopApproved}
                      className={`py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                        formData.liability_type === opt
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 귀책 비율 (공동인 경우) */}
              {formData.liability_type === '공동' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">제작처 귀책비율 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.liability_ratio_maker}
                      onChange={(e) => {
                        handleChange('liability_ratio_maker', e.target.value);
                        handleChange('liability_ratio_plant', String(100 - Number(e.target.value)));
                      }}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">생산처 귀책비율 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.liability_ratio_plant}
                      onChange={(e) => {
                        handleChange('liability_ratio_plant', e.target.value);
                        handleChange('liability_ratio_maker', String(100 - Number(e.target.value)));
                      }}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {/* 귀책 판정 사유 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">귀책 판정 사유</label>
                <textarea
                  value={formData.liability_reason}
                  onChange={(e) => handleChange('liability_reason', e.target.value)}
                  rows={3}
                  disabled={!isRepairShopApproved}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                  placeholder="귀책 판정 사유를 입력하세요"
                />
              </div>

              {/* 판정자, 판정일 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">판정자</label>
                  <input
                    type="text"
                    value={formData.liability_decided_by || (isDeveloper ? user?.name : '')}
                    onChange={(e) => handleChange('liability_decided_by', e.target.value)}
                    disabled={!isRepairShopApproved || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="판정자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">판정일</label>
                  <input
                    type="date"
                    value={formData.liability_decided_date}
                    onChange={(e) => handleChange('liability_decided_date', e.target.value)}
                    disabled={!isRepairShopApproved || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 5. 수리 단계 (Maker 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('repair')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-slate-800">5. 수리 단계</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Maker 작성</span>
              {!isRepairShopApproved && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">수리처 승인 후 진행</span>
              )}
            </div>
            {expandedSections.repair ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.repair && (
            <div className={`p-6 space-y-4 ${!isRepairShopApproved ? 'opacity-50 pointer-events-none' : ''}`}>
              {!isRepairShopApproved && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <AlertCircle size={16} className="inline mr-2" />
                  수리처 선정이 승인된 후 수리를 진행할 수 있습니다.
                </div>
              )}

              {/* 진행상태, 담당자, 금형입고일 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">진행상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => handleChange('manager_name', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">금형 입고일</label>
                  <input
                    type="date"
                    value={formData.mold_arrival_date}
                    onChange={(e) => handleChange('mold_arrival_date', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* 임시 조치 내용 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">임시 조치 내용</label>
                <textarea
                  value={formData.temporary_action}
                  onChange={(e) => handleChange('temporary_action', e.target.value)}
                  rows={2}
                  disabled={!isRepairShopApproved}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  placeholder="임시 조치 내용을 입력하세요"
                />
              </div>

              {/* 근본 원인 조치 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">근본 원인 조치</label>
                <textarea
                  value={formData.root_cause_action}
                  onChange={(e) => handleChange('root_cause_action', e.target.value)}
                  rows={2}
                  disabled={!isRepairShopApproved}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  placeholder="근본 원인 조치 내용을 입력하세요"
                />
              </div>

              {/* 수리 일정 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리 시작일</label>
                  <input
                    type="date"
                    value={formData.repair_start_date}
                    onChange={(e) => handleChange('repair_start_date', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리 완료일</label>
                  <input
                    type="date"
                    value={formData.repair_end_date}
                    onChange={(e) => handleChange('repair_end_date', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리기간</label>
                  <input
                    type="text"
                    value={formData.repair_duration}
                    onChange={(e) => handleChange('repair_duration', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="예: 3일"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">완료예정일</label>
                  <input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => handleChange('completion_date', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* 수리비용 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리비용</label>
                  <input
                    type="text"
                    value={formData.repair_cost}
                    onChange={(e) => handleChange('repair_cost', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="₩"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 6. 완료/관리 단계 (HQ 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('complete')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-slate-800">6. 완료/관리 단계</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">HQ 작성</span>
            </div>
            {expandedSections.complete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.complete && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">운영 유형</label>
                  <select
                    value={formData.operation_type}
                    onChange={(e) => handleChange('operation_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    {operationOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">관리 유형</label>
                  <select
                    value={formData.management_type}
                    onChange={(e) => handleChange('management_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">선택</option>
                    {managementTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">결재 상태</label>
                  <input
                    type="text"
                    value={formData.sign_off_status}
                    readOnly
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">발주업체</label>
                  <input
                    type="text"
                    value={formData.order_company}
                    onChange={(e) => handleChange('order_company', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="발주업체명"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition font-medium"
          >
            취소
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50"
          >
            임시저장
          </button>
          <button
            onClick={() => handleSave('submit')}
            disabled={saving}
            className="px-6 py-2.5 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50"
          >
            {saving ? '저장 중...' : '제출'}
          </button>
        </div>
      </main>
    </div>
  );
}
