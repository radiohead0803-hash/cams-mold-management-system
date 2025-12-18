import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, Camera, Upload, X, AlertCircle, CheckCircle,
  Clock, User, Calendar, FileText, Phone, MapPin, Package, Wrench,
  Building, Truck, DollarSign, ClipboardList, Link2, ChevronDown, ChevronUp,
  Image, Plus, Trash2
} from 'lucide-react';
import { repairRequestAPI, moldSpecificationAPI, inspectionAPI, injectionConditionAPI, userAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

/**
 * PC 수리요청 양식 페이지
 * 프로세스 기준 섹션 구분:
 * 1. 요청 단계 (Plant): 기본정보 + 사진 + 카테고리 + 금형정보(자동연동)
 * 2. 수리처 선정 (Plant/개발담당자): 수리처 선정 → 개발담당자 승인
 * 3. 수리 단계 (Maker): 수리정보
 * 4. 체크리스트 점검: 수리 후 출하점검
 * 5. 생산처 검수 (Plant): 검수내용 확인 및 승인
 * 6. 귀책처리 (개발담당자): 귀책 판정
 * 7. 완료/관리 단계 (HQ): 관리정보
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
  const [camsManagerList, setCamsManagerList] = useState([]); // 캠스 담당자 목록
  const [expandedSections, setExpandedSections] = useState({
    request: true,    // 요청 단계 (금형정보 포함)
    repairShop: false, // 수리처 선정
    repair: false,    // 수리 단계
    checklist: false,  // 체크리스트 점검
    plantInspection: false, // 생산처 검수
    liability: false,  // 귀책처리
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
    plant_manager_name: user?.name || '',           // 생산처 담당자
    plant_manager_contact: '',                      // 생산처 담당자 연락처
    cams_manager_id: '',                            // 캠스 담당자 ID
    cams_manager_name: '',                          // 캠스 담당자명
    cams_manager_contact: '',                       // 캠스 담당자 연락처
    
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
    
    // ===== 생산처 검수 (Plant 작성) =====
    plant_inspection_status: '대기',                // 생산처 검수상태 (대기/승인/반려)
    plant_inspection_result: '',                    // 검수 결과
    plant_inspection_comment: '',                   // 검수 의견
    plant_inspection_by: '',                        // 검수자
    plant_inspection_date: '',                      // 검수일
    plant_inspection_rejection_reason: '',          // 반려 사유
    
    // ===== 귀책처리 (개발담당자 작성) =====
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

  // 캠스 담당자 목록 로드
  useEffect(() => {
    loadCamsManagers();
  }, []);

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

  // 캠스 담당자 목록 로드 (개발팀/HQ 사용자)
  const loadCamsManagers = async () => {
    try {
      const response = await userAPI.getAll({ role: 'developer' });
      if (response.data?.data) {
        setCamsManagerList(response.data.data.map(u => ({
          id: u.id,
          name: u.name,
          contact: u.phone || u.email || '',
          department: u.department || '개발팀'
        })));
      }
    } catch (error) {
      console.error('Load CAMS managers error:', error);
      // 기본 담당자 목록 (API 실패 시)
      setCamsManagerList([
        { id: '1', name: '김개발', contact: '010-1234-5678', department: '개발팀' },
        { id: '2', name: '이품질', contact: '010-2345-6789', department: '품질팀' },
        { id: '3', name: '박관리', contact: '010-3456-7890', department: '관리팀' }
      ]);
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

    // 제출 시 캠스 담당자 필수 검증
    if (submitType === 'submit' && !formData.cams_manager_id) {
      alert('캠스 담당자를 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      const dataToSave = {
        ...formData,
        mold_spec_id: moldId || formData.mold_spec_id,
        submit_type: submitType
      };

      let savedRequest;
      if (requestId) {
        savedRequest = await repairRequestAPI.update(requestId, dataToSave);
        alert('수정되었습니다.');
      } else {
        savedRequest = await repairRequestAPI.create(dataToSave);
        
        // 제출 시 캠스 담당자에게 알림 발송
        if (submitType === 'submit' && formData.cams_manager_id) {
          await sendNotificationToCamsManager(savedRequest.data?.data?.id);
        }
        
        alert('등록되었습니다. 캠스 담당자에게 알림이 발송되었습니다.');
      }

      navigate(-1);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // 캠스 담당자에게 알림 발송
  const sendNotificationToCamsManager = async (repairRequestId) => {
    try {
      // 알림 API 호출 (백엔드에서 처리)
      await repairRequestAPI.sendNotification({
        repair_request_id: repairRequestId,
        recipient_id: formData.cams_manager_id,
        recipient_name: formData.cams_manager_name,
        notification_type: 'repair_request_created',
        message: `새로운 수리요청이 등록되었습니다. (금형: ${formData.part_name || moldInfo?.part_name})`,
        plant_manager_name: formData.plant_manager_name,
        plant_manager_contact: formData.plant_manager_contact
      });
    } catch (error) {
      console.error('Send notification error:', error);
      // 알림 실패해도 요청 등록은 성공으로 처리
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
  const statusOptions = ['요청접수', '수리처선정', '수리처승인대기', '수리진행', '체크리스트점검', '생산처검수대기', '생산처검수완료', '귀책처리', '수리완료', '완료'];
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

      {/* 금형수리 진행현황 플로어 */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              금형수리 진행현황
            </h3>
            {requestId && (
              <button
                onClick={() => navigate(`/repairs/${requestId}`)}
                className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-full hover:bg-amber-600 transition"
              >
                상세보기
              </button>
            )}
          </div>
          
          {/* 진행 단계 플로어 */}
          <div className="flex items-center justify-between relative">
            {/* 연결선 */}
            <div className="absolute top-6 left-8 right-8 h-0.5 bg-slate-200 z-0"></div>
            
            {/* 단계별 아이콘 */}
            {[
              { id: 'request', label: '요청접수', icon: FileText, step: 1 },
              { id: 'repairShop', label: '수리처선정', icon: Building, step: 2 },
              { id: 'repair', label: '수리진행', icon: Wrench, step: 3 },
              { id: 'checklist', label: '체크리스트', icon: ClipboardList, step: 4 },
              { id: 'plantInspection', label: '생산처검수', icon: Package, step: 5 },
              { id: 'liability', label: '귀책처리', icon: DollarSign, step: 6 },
              { id: 'complete', label: '완료', icon: CheckCircle, step: 7 }
            ].map((stage, index) => {
              const currentStepIndex = statusOptions.indexOf(formData.status);
              const isCompleted = index < Math.floor(currentStepIndex / 1.5);
              const isCurrent = index === Math.floor(currentStepIndex / 1.5);
              const StageIcon = stage.icon;
              
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    // 해당 섹션 열기
                    setExpandedSections(prev => {
                      const newState = { ...prev };
                      Object.keys(newState).forEach(key => newState[key] = false);
                      newState[stage.id] = true;
                      return newState;
                    });
                    // 해당 섹션으로 스크롤
                    setTimeout(() => {
                      document.getElementById(`section-${stage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className="flex flex-col items-center z-10 group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-amber-500 text-white animate-pulse ring-4 ring-amber-200' 
                        : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-amber-400 group-hover:text-amber-500'
                  }`}>
                    <StageIcon size={20} />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-amber-600' 
                        : 'text-slate-500 group-hover:text-amber-600'
                  }`}>
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4" onPaste={handlePaste}>
        {/* ===== 1. 요청 단계 (Plant 작성) ===== */}
        <div id="section-request" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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

              {/* 생산처 담당자 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">생산처 담당자</label>
                  <input
                    type="text"
                    value={formData.plant_manager_name}
                    onChange={(e) => handleChange('plant_manager_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                  <input
                    type="text"
                    value={formData.plant_manager_contact}
                    onChange={(e) => handleChange('plant_manager_contact', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 캠스 담당자 (조회 기능) */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  캠스 담당자 <span className="text-xs text-red-500">* 필수</span>
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">담당자 선택</label>
                    <div className="relative">
                      <select
                        value={formData.cams_manager_id}
                        onChange={(e) => {
                          const selectedUser = camsManagerList.find(u => u.id === e.target.value);
                          if (selectedUser) {
                            handleChange('cams_manager_id', selectedUser.id);
                            handleChange('cams_manager_name', selectedUser.name);
                            handleChange('cams_manager_contact', selectedUser.contact || '');
                          }
                        }}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">캠스 담당자 선택</option>
                        {camsManagerList.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} ({manager.department || '개발팀'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                    <input
                      type="text"
                      value={formData.cams_manager_contact}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600"
                      placeholder="자동입력"
                      readOnly
                    />
                  </div>
                </div>
                {formData.cams_manager_name && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">선택된 담당자:</span> {formData.cams_manager_name}
                      {formData.cams_manager_contact && ` (${formData.cams_manager_contact})`}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      수리요청 등록 시 해당 담당자에게 알림이 발송됩니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 금형 기본 정보 (자동연동) */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-blue-600" />
                  금형 정보 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">자동연동</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">차종</p>
                    <p className="text-sm font-medium text-slate-700">{formData.car_model || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">품번</p>
                    <p className="text-sm font-medium text-slate-700">{formData.part_number || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">품명</p>
                    <p className="text-sm font-medium text-slate-700">{formData.part_name || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">제작처</p>
                    <p className="text-sm font-medium text-slate-700">{formData.maker || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">생산처</p>
                    <p className="text-sm font-medium text-slate-700">{formData.production_site || '-'}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-slate-500 mb-1">현재 타수</p>
                    <p className="text-sm font-bold text-amber-600">{formData.production_shot || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/mold-detail/${moldId}`)}
                  className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2"
                >
                  <Package size={14} />
                  금형 상세정보 보기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== 2. 수리처 선정 (Plant/개발담당자 작성) ===== */}
        <div id="section-repairShop" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('repairShop')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-slate-800">2. 수리처 선정</span>
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

        {/* ===== 3. 수리 단계 (Maker 작성) ===== */}
        <div id="section-repair" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('repair')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-slate-800">3. 수리 단계</span>
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

        {/* ===== 4. 체크리스트 점검 (수리 후 출하점검) ===== */}
        <div id="section-checklist" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('checklist')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-slate-800">4. 체크리스트 점검</span>
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">수리 후 출하점검</span>
              {!isRepairShopApproved && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">수리처 승인 후 진행</span>
              )}
            </div>
            {expandedSections.checklist ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.checklist && (
            <div className="p-6 space-y-4">
              {!isRepairShopApproved && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <AlertCircle size={16} className="inline mr-2" />
                  수리처 선정이 승인된 후 체크리스트 점검을 진행할 수 있습니다.
                </div>
              )}
              
              {/* 체크리스트 점검 항목 미리보기 - 8개 카테고리 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <ClipboardList size={16} className="text-cyan-600" />
                  수리 후 출하점검 체크리스트 (8개 카테고리, 32개 항목)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { category: '1. 수리 이력 및 범위 확인', icon: '📋', items: ['수리 요청 내역 일치 여부', '수리 범위 명확화', '추가 수리 발생 여부', '수리 전·후 비교 사진'] },
                    { category: '2. 성형면 및 외관 상태', icon: '🔍', items: ['성형면 손상', '폴리싱 상태', '파팅라인', '텍스처 영역', '육안 이물'] },
                    { category: '3. 기능부 작동 점검', icon: '⚙️', items: ['슬라이드 작동', '리프터 작동', '이젝터', '가이드핀/부시', '볼트 체결 상태'] },
                    { category: '4. 치수 및 맞물림 상태', icon: '📐', items: ['습합 상태', '간섭 흔적', '틈새 과다 여부', 'Shim 변경 여부'] },
                    { category: '5. 냉각·윤활·방청 상태', icon: '💧', items: ['냉각 회로', '오링/실링', '윤활 상태', '방청 처리', '잔유 제거'] },
                    { category: '6. 시운전 결과 확인', icon: '🧪', items: ['시운전 실시 여부', '성형품 외관', '기능 불량', '판단 결과'] },
                    { category: '7. 출하 준비 및 식별 관리', icon: '📦', items: ['금형 세척 상태', '금형 고정', 'QR/명판', '출하 사진', '출하 목적지'] },
                    { category: '8. 최종 확인 및 승인', icon: '✅', items: ['제작처 확인', '본사 승인'] }
                  ].map((section, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-100">
                      <p className="text-xs font-medium text-cyan-600 mb-2 flex items-center gap-1">
                        <span>{section.icon}</span>
                        {section.category}
                      </p>
                      <ul className="space-y-1">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-xs text-slate-600 flex items-center gap-2">
                            <span className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center bg-white text-[10px]">
                              📷
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  ※ 모든 항목은 사진 첨부 필수입니다
                </p>
              </div>
              
              <div className={`p-4 bg-cyan-50 border border-cyan-200 rounded-lg ${!isRepairShopApproved ? 'opacity-50' : ''}`}>
                <p className="text-sm text-cyan-700 mb-3">
                  <span className="font-medium">📋 수리 후 출하점검 체크리스트</span>
                </p>
                <button
                  onClick={() => navigate(`/repair-shipment-checklist?repairRequestId=${requestId || ''}&moldId=${moldId || moldInfo?.id || ''}`)}
                  disabled={!isRepairShopApproved}
                  className="w-full py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  체크리스트 점검 시작
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== 5. 생산처 검수 (Plant 작성) ===== */}
        <div id="section-plantInspection" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('plantInspection')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-slate-800">5. 생산처 검수</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Plant 작성</span>
              {formData.plant_inspection_status === '승인' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> 승인완료
                </span>
              )}
              {!isRepairShopApproved && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">체크리스트 점검 후 진행</span>
              )}
            </div>
            {expandedSections.plantInspection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.plantInspection && (
            <div className={`p-6 space-y-4 ${!isRepairShopApproved ? 'opacity-50 pointer-events-none' : ''}`}>
              {!isRepairShopApproved && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <AlertCircle size={16} className="inline mr-2" />
                  체크리스트 점검이 완료된 후 생산처 검수를 진행할 수 있습니다.
                </div>
              )}

              {/* 체크리스트 점검 결과 요약 */}
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                <h4 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center gap-2">
                  <ClipboardList size={16} />
                  체크리스트 점검 결과
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg border border-cyan-100">
                    <p className="text-2xl font-bold text-green-600">-</p>
                    <p className="text-xs text-slate-500">적합 항목</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-cyan-100">
                    <p className="text-2xl font-bold text-red-600">-</p>
                    <p className="text-xs text-slate-500">부적합 항목</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-cyan-100">
                    <p className="text-2xl font-bold text-slate-600">-</p>
                    <p className="text-xs text-slate-500">총 항목</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/repair-shipment-checklist?repairRequestId=${requestId || ''}&moldId=${moldId || moldInfo?.id || ''}&view=result`)}
                  className="w-full mt-3 py-2 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-200 transition"
                >
                  체크리스트 상세 보기
                </button>
              </div>

              {/* 검수 결과 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">검수 결과</label>
                <div className="grid grid-cols-2 gap-3">
                  {['적합', '부적합'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleChange('plant_inspection_result', opt)}
                      disabled={!isRepairShopApproved}
                      className={`py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                        formData.plant_inspection_result === opt
                          ? opt === '적합' 
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 검수 의견 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">검수 의견</label>
                <textarea
                  value={formData.plant_inspection_comment}
                  onChange={(e) => handleChange('plant_inspection_comment', e.target.value)}
                  rows={3}
                  disabled={!isRepairShopApproved}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="검수 의견을 입력하세요"
                />
              </div>

              {/* 검수자, 검수일 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">검수자</label>
                  <input
                    type="text"
                    value={formData.plant_inspection_by || user?.name || ''}
                    onChange={(e) => handleChange('plant_inspection_by', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="검수자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">검수일</label>
                  <input
                    type="date"
                    value={formData.plant_inspection_date}
                    onChange={(e) => handleChange('plant_inspection_date', e.target.value)}
                    disabled={!isRepairShopApproved}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
              </div>

              {/* 승인/반려 버튼 */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">생산처 검수 승인</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    formData.plant_inspection_status === '승인' 
                      ? 'bg-green-100 text-green-700' 
                      : formData.plant_inspection_status === '반려'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {formData.plant_inspection_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('plant_inspection_status', '승인');
                      handleChange('plant_inspection_date', new Date().toISOString().split('T')[0]);
                      handleChange('plant_inspection_by', user?.name || '');
                    }}
                    disabled={!isRepairShopApproved || !formData.plant_inspection_result}
                    className="py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt('반려 사유를 입력하세요:');
                      if (reason) {
                        handleChange('plant_inspection_status', '반려');
                        handleChange('plant_inspection_rejection_reason', reason);
                      }
                    }}
                    disabled={!isRepairShopApproved}
                    className="py-3 bg-white text-red-500 border-2 border-red-500 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    반려
                  </button>
                </div>
                {formData.plant_inspection_status === '반려' && formData.plant_inspection_rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <p className="text-red-600">반려사유: {formData.plant_inspection_rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== 6. 귀책처리 (개발담당자 작성) ===== */}
        <div id="section-liability" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('liability')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-slate-800">6. 귀책처리</span>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">개발담당자</span>
              {formData.plant_inspection_status !== '승인' && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">생산처 검수 승인 후 진행</span>
              )}
            </div>
            {expandedSections.liability ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.liability && (
            <div className={`p-6 space-y-4 ${formData.plant_inspection_status !== '승인' ? 'opacity-50 pointer-events-none' : ''}`}>
              {formData.plant_inspection_status !== '승인' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <AlertCircle size={16} className="inline mr-2" />
                  생산처 검수가 승인된 후 귀책처리를 진행할 수 있습니다.
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

        {/* ===== 7. 완료/관리 단계 (HQ 작성) ===== */}
        <div id="section-complete" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('complete')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-slate-800">7. 완료/관리 단계</span>
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
