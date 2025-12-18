import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, Camera, CheckCircle, Clock, AlertCircle, FileText, 
  Building2, Building, User, Calendar, Package, Wrench, Truck, ClipboardList,
  ChevronDown, ChevronUp, Check, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { transferAPI, moldSpecificationAPI, userAPI } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * PC 이관요청 양식 페이지 - 업무플로 기반 레이아웃
 * 1. 요청 단계 (인계업체): 기본정보 + 금형정보 + 관리현황
 * 2. 인계업체 승인: 인계업체 담당자 승인
 * 3. 개발담당 승인: 개발담당자 승인
 * 4. 점검 체크리스트: 금형 상태 점검
 * 5. 인수업체 검수: 검수 확인 및 승인
 * 6. 완료/관리 단계: 이관 완료 처리
 */
export default function TransferRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = searchParams.get('moldId');
  const transferId = searchParams.get('id');
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [developerList, setDeveloperList] = useState([]);
  
  const [expandedSections, setExpandedSections] = useState({
    request: true,
    fromApproval: false,
    developerApproval: false,
    checklist: false,
    toInspection: false,
    complete: false
  });
  
  const [formData, setFormData] = useState({
    transfer_date: new Date().toISOString().split('T')[0],
    from_company_id: '',
    to_company_id: '',
    reason: '',
    transfer_type: 'plant_to_plant',
    priority: '보통',
    from_manager_name: user?.name || '',
    from_manager_contact: '',
    developer_id: '',
    developer_name: '',
    developer_contact: '',
    cumulative_shots: '',
    cleaning_grade: 'B',
    last_cleaning_date: '',
    fitting_grade: 'B',
    last_fitting_date: '',
    machine_tonnage: '',
    weight: '',
    special_notes: '',
    from_approval_status: '대기',
    developer_approval_status: '대기',
    to_inspection_status: '대기',
    status: '요청접수'
  });

  const progressSteps = [
    { key: 'request', label: '요청접수', icon: FileText },
    { key: 'from_approval', label: '인계승인', icon: Building2 },
    { key: 'developer_approval', label: '개발승인', icon: User },
    { key: 'checklist', label: '체크리스트', icon: ClipboardList },
    { key: 'to_inspection', label: '인수검수', icon: CheckCircle },
    { key: 'complete', label: '완료', icon: Check }
  ];

  const getCurrentStep = () => {
    const status = formData.status;
    if (status === '요청접수') return 0;
    if (status === '인계승인대기' || status === '인계승인완료') return 1;
    if (status === '개발승인대기' || status === '개발승인완료') return 2;
    if (status === '체크리스트점검') return 3;
    if (status === '인수검수대기' || status === '인수검수완료') return 4;
    if (status === '완료') return 5;
    return 0;
  };

  useEffect(() => {
    loadInitialData();
    loadDevelopers();
  }, [moldId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      if (moldId) {
        const moldRes = await moldSpecificationAPI.getById(moldId);
        if (moldRes.data.success) {
          const spec = moldRes.data.data;
          setMoldInfo(spec);
          setFormData(prev => ({
            ...prev,
            from_company_id: spec.plant_company_id || '',
            cumulative_shots: spec.mold?.current_shots || ''
          }));
        }
      }
      
      const companiesRes = await fetch(`${API_URL}/companies?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const companiesData = await companiesRes.json();
      if (companiesData.success) {
        setCompanies(companiesData.data.items || []);
      }
      
      try {
        const checklistRes = await fetch(`${API_URL}/transfers/checklist/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const checklistData = await checklistRes.json();
        if (checklistData.success && checklistData.data?.length > 0) {
          setChecklistItems(checklistData.data);
        } else {
          setChecklistItems(getDefaultChecklistItems());
        }
      } catch {
        setChecklistItems(getDefaultChecklistItems());
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevelopers = async () => {
    try {
      const response = await userAPI.getAll({ role: 'mold_developer', limit: 100 });
      if (response.data?.data) {
        setDeveloperList(response.data.data.items || response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load developers:', error);
    }
  };

  const getDefaultChecklistItems = () => [
    { id: 1, category: 'fitting', category_name: '습합', item_name: '제품 BURR', item_description: 'BURR 발생부 습합개소 확인', guide_description: '제품 BURR 발생부의 습합 상태를 확인합니다', check_points: ['BURR 발생 위치 확인', '습합 개소 상태 점검'] },
    { id: 2, category: 'appearance', category_name: '외관', item_name: 'EYE BOLT 체결부', item_description: '피치 마모 및 밀착상태 확인', guide_description: 'EYE BOLT 체결부의 피치 마모 및 밀착상태를 확인합니다', check_points: ['피치 마모 상태 확인', '밀착 상태 점검'] },
    { id: 3, category: 'appearance', category_name: '외관', item_name: '상,하 고정판 확인', item_description: '이물 및 녹 오염상태 확인', guide_description: '상,하 고정판의 이물 및 녹 오염상태를 확인합니다', check_points: ['이물질 부착 여부 확인', '녹 발생 상태 점검'] },
    { id: 4, category: 'appearance', category_name: '외관', item_name: '냉각상태', item_description: '냉각호스 정리 및 오염상태 확인', guide_description: '냉각호스 정리 및 오염상태를 확인합니다', check_points: ['냉각호스 연결 상태 확인', '오염 및 누수 확인'] },
    { id: 5, category: 'cavity', category_name: '캐비티', item_name: '표면 흠집,녹', item_description: '표면 흠 및 녹 발생상태 확인', guide_description: '표면 흠 및 녹 발생상태를 확인합니다', check_points: ['표면 흠집 유무 확인', '녹 발생 여부 점검'] },
    { id: 6, category: 'cavity', category_name: '캐비티', item_name: '파팅면 오염,탄화', item_description: '파팅면 오염 및 탄화수지 확인', guide_description: '파팅면 오염 및 탄화수지 상태를 확인합니다', check_points: ['파팅면 오염 상태 확인', '탄화수지 부착 여부 점검'] },
    { id: 7, category: 'cavity', category_name: '캐비티', item_name: '파팅면 BURR', item_description: '파팅면 끝단 손으로 접촉 확인', guide_description: '파팅면 끝단을 손으로 접촉하여 BURR 상태를 확인합니다', check_points: ['파팅면 끝단 상태 확인', 'BURR 발생 여부 점검'] },
    { id: 8, category: 'core', category_name: '코어', item_name: '코어류 분해청소', item_description: '긁힘 상태확인 및 이물확인', guide_description: '코어류 분해 후 긁힘 상태 및 이물을 확인합니다', check_points: ['코어 분해 상태 확인', '이물질 유무 확인'] },
    { id: 9, category: 'core', category_name: '코어', item_name: '마모', item_description: '작동부 마모상태 점검', guide_description: '작동부 마모상태를 점검합니다', check_points: ['작동부 마모 정도 확인', '교체 필요 여부 판단'] },
    { id: 10, category: 'core', category_name: '코어', item_name: '작동유 윤활유', item_description: '작동유 윤활상태 확인', guide_description: '작동유 윤활상태를 확인합니다', check_points: ['윤활유 상태 확인', '보충 필요 여부 판단'] },
    { id: 11, category: 'hydraulic', category_name: '유압장치', item_name: '작동유 누유', item_description: '유압 배관 파손 확인', guide_description: '유압 배관 파손 및 누유 상태를 확인합니다', check_points: ['배관 파손 여부 확인', '누유 발생 위치 점검'] },
    { id: 12, category: 'hydraulic', category_name: '유압장치', item_name: '호스 및 배선정리', item_description: '호스,배선 정돈상태 확인', guide_description: '호스 및 배선 정돈상태를 확인합니다', check_points: ['호스 정리 상태 확인', '꼬임 및 손상 확인'] },
    { id: 13, category: 'heater', category_name: '히터', item_name: '히터단선 누전', item_description: '히터단선,누전확인[테스터기]', guide_description: '히터단선 및 누전 상태를 테스터기로 확인합니다', check_points: ['히터 단선 여부 확인', '저항값 측정 기록'] },
    { id: 14, category: 'heater', category_name: '히터', item_name: '수지 누출', item_description: '수지 넘침 확인', guide_description: '수지 넘침 상태를 확인합니다', check_points: ['수지 누출 위치 확인', '청소 필요 여부 판단'] }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChecklistChange = (itemId, field, value) => {
    setChecklistResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.from_company_id || !formData.to_company_id) {
      alert('인계 업체와 인수 업체를 선택해주세요.');
      return;
    }
    try {
      setSaving(true);
      const transferData = {
        mold_id: parseInt(moldId),
        transfer_type: formData.transfer_type,
        from_company_id: parseInt(formData.from_company_id),
        to_company_id: parseInt(formData.to_company_id),
        developer_id: parseInt(formData.developer_id) || null,
        request_date: formData.transfer_date,
        planned_transfer_date: formData.transfer_date,
        reason: formData.reason,
        priority: formData.priority,
        current_shots: parseInt(formData.cumulative_shots) || 0,
        from_manager_name: formData.from_manager_name,
        from_manager_contact: formData.from_manager_contact,
        mold_info_snapshot: {
          ...moldInfo,
          cumulative_shots: formData.cumulative_shots,
          cleaning_grade: formData.cleaning_grade,
          last_cleaning_date: formData.last_cleaning_date,
          fitting_grade: formData.fitting_grade,
          last_fitting_date: formData.last_fitting_date,
          weight: formData.weight,
          machine_tonnage: formData.machine_tonnage,
          special_notes: formData.special_notes
        },
        checklist_results: checklistResults
      };
      const response = await transferAPI.create(transferData);
      if (response.data.success) {
        alert('이관 요청이 등록되었습니다.');
        navigate('/transfers');
      }
    } catch (error) {
      console.error('Failed to create transfer:', error);
      alert('이관 요청 등록에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const plantCompanies = companies.filter(c => c.company_type === 'plant');
  const selectedFromCompany = companies.find(c => c.id === parseInt(formData.from_company_id));
  const selectedToCompany = companies.find(c => c.id === parseInt(formData.to_company_id));
  const currentStep = getCurrentStep();

  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { name: item.category_name, items: [] };
    }
    acc[item.category].items.push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-8 px-4">
      {/* 헤더 */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          뒤로 가기
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">이관요청 등록</h1>
              <p className="text-sm text-gray-500">{moldInfo?.part_number || 'P-XXXX-XXXX'} - {moldInfo?.part_name || '금형명'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => alert('임시저장 되었습니다.')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <FileText size={16} />
              임시저장
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              <Send size={16} />
              제출
            </button>
          </div>
        </div>
      </div>

      {/* 진행 상태 표시 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="text-purple-600" size={20} />
          <h3 className="font-semibold text-gray-800">금형이관 진행현황</h3>
        </div>
        <div className="flex items-center justify-between">
          {progressSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${isActive ? 'bg-purple-600 text-white ring-4 ring-purple-100' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {isCompleted ? <Check size={20} /> : <StepIcon size={20} />}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 1. 요청 단계 */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('request')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><FileText className="text-purple-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">1. 요청 단계</h3>
                <p className="text-xs text-gray-500">인계업체 작성 <span className="text-red-500">* 필수</span></p>
              </div>
            </div>
            {expandedSections.request ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.request && (
            <div className="p-6 space-y-6">
              {/* 이관 기본 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />이관 기본 정보
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">이관 요청일 <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.transfer_date} onChange={(e) => handleChange('transfer_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">이관 유형</label>
                    <select value={formData.transfer_type} onChange={(e) => handleChange('transfer_type', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500">
                      <option value="plant_to_plant">생산처 → 생산처</option>
                      <option value="maker_to_plant">제작처 → 생산처</option>
                      <option value="plant_to_maker">생산처 → 제작처</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">우선순위</label>
                    <select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500">
                      <option value="낮음">낮음</option>
                      <option value="보통">보통</option>
                      <option value="높음">높음</option>
                      <option value="긴급">긴급</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">작성자</label>
                    <input type="text" value={user?.name || ''} readOnly className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* 인계/인수 업체 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2"><Building2 size={16} />인계 업체 (From)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">업체 선택 <span className="text-red-500">*</span></label>
                      <select value={formData.from_company_id} onChange={(e) => handleChange('from_company_id', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500">
                        <option value="">업체 선택</option>
                        {plantCompanies.map(c => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">담당자</label>
                        <input type="text" value={formData.from_manager_name} onChange={(e) => handleChange('from_manager_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="담당자명" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">연락처</label>
                        <input type="text" value={formData.from_manager_contact} onChange={(e) => handleChange('from_manager_contact', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="010-0000-0000" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2"><Building size={16} />인수 업체 (To)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">업체 선택 <span className="text-red-500">*</span></label>
                      <select value={formData.to_company_id} onChange={(e) => handleChange('to_company_id', e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500">
                        <option value="">업체 선택</option>
                        {plantCompanies.filter(c => c.id !== parseInt(formData.from_company_id)).map(c => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
                      </select>
                    </div>
                    <div className="p-2 bg-green-100 rounded text-xs text-green-700">인수업체 담당자는 승인 단계에서 자동 입력됩니다.</div>
                  </div>
                </div>
              </div>

              {/* 개발담당자 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><User size={16} />개발담당자 <span className="text-xs text-red-500">* 필수</span></h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">담당자 선택</label>
                    <select value={formData.developer_id} onChange={(e) => { const selected = developerList.find(u => u.id === parseInt(e.target.value)); if (selected) { handleChange('developer_id', selected.id); handleChange('developer_name', selected.name); handleChange('developer_contact', selected.contact || ''); }}} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="">개발담당자 선택</option>
                      {developerList.map(dev => (<option key={dev.id} value={dev.id}>{dev.name} ({dev.department || '개발팀'})</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">연락처</label>
                    <input type="text" value={formData.developer_contact} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" placeholder="자동입력" />
                  </div>
                </div>
              </div>

              {/* 금형 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Package size={16} className="text-blue-600" />금형 정보 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">자동연동</span></h4>
                <div className="grid grid-cols-6 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">차종</p><p className="text-sm font-medium">{moldInfo?.car_model || '-'}</p></div>
                  <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">품번</p><p className="text-sm font-medium">{moldInfo?.part_number || '-'}</p></div>
                  <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">품명</p><p className="text-sm font-medium">{moldInfo?.part_name || '-'}</p></div>
                  <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">제작처</p><p className="text-sm font-medium">{moldInfo?.makerCompany?.company_name || '-'}</p></div>
                  <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">현 생산처</p><p className="text-sm font-medium">{moldInfo?.plantCompany?.company_name || '-'}</p></div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200"><p className="text-xs text-gray-500 mb-1">누적 타수</p><p className="text-sm font-bold text-purple-600">{formData.cumulative_shots || '-'}</p></div>
                </div>
              </div>

              {/* 관리 현황 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Wrench size={16} className="text-orange-600" />관리 현황</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-1">세척등급</label><select value={formData.cleaning_grade} onChange={(e) => handleChange('cleaning_grade', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">최종 세척일</label><input type="date" value={formData.last_cleaning_date} onChange={(e) => handleChange('last_cleaning_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">습합등급</label><select value={formData.fitting_grade} onChange={(e) => handleChange('fitting_grade', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">최종 습합일</label><input type="date" value={formData.last_fitting_date} onChange={(e) => handleChange('last_fitting_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">사출기 사양</label><input type="text" value={formData.machine_tonnage} onChange={(e) => handleChange('machine_tonnage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="UBE 2,200Ton" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">관리중량(g)</label><input type="number" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="1,460" /></div>
                  <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">특이사항</label><input type="text" value={formData.special_notes} onChange={(e) => handleChange('special_notes', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="특이사항 입력" /></div>
                </div>
              </div>

              {/* 이관 사유 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">이관 사유</h4>
                <textarea value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500" placeholder="이관 사유를 입력하세요..." />
              </div>
            </div>
          )}
        </div>

        {/* 2. 인계업체 승인 */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('fromApproval')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Building2 className="text-orange-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">2. 인계업체 승인</h3>
                <p className="text-xs text-gray-500">인계업체 담당자 <span className="text-orange-500">요청접수 후 진행</span></p>
              </div>
            </div>
            {expandedSections.fromApproval ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.fromApproval && (
            <div className="p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4"><p className="text-sm text-orange-800"><AlertCircle className="inline mr-2" size={16} />인계업체 담당자가 이관 요청 내용을 확인하고 승인합니다.</p></div>
            </div>
          )}
        </div>

        {/* 3. 개발담당 승인 */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('developerApproval')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><User className="text-blue-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">3. 개발담당 승인</h3>
                <p className="text-xs text-gray-500">개발담당자 <span className="text-blue-500">인계승인 후 진행</span></p>
              </div>
            </div>
            {expandedSections.developerApproval ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.developerApproval && (
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-800"><AlertCircle className="inline mr-2" size={16} />개발담당자가 이관 요청을 검토하고 승인합니다.</p></div>
            </div>
          )}
        </div>

        {/* 4. 점검 체크리스트 */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('checklist')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg"><ClipboardList className="text-cyan-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">4. 점검 체크리스트</h3>
                <p className="text-xs text-gray-500">인수업체 작성 <span className="text-cyan-500">개발승인 후 진행</span></p>
              </div>
            </div>
            {expandedSections.checklist ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.checklist && (
            <div className="p-6">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4"><p className="text-sm text-cyan-800"><AlertCircle className="inline mr-2" size={16} />인수업체에서 금형 상태를 점검하고 체크리스트를 작성합니다.</p></div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-cyan-50">
                      <th className="border px-3 py-2 text-center w-20">구분</th>
                      <th className="border px-3 py-2 text-center w-32">점검항목</th>
                      <th className="border px-3 py-2 text-center">점검내용</th>
                      <th className="border px-3 py-2 text-center w-16">결과</th>
                      <th className="border px-3 py-2 text-center w-20">사진</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedChecklist).map(([category, group]) => (
                      group.items.map((item, itemIdx) => (
                        <tr key={item.id} className="hover:bg-gray-50 group">
                          {itemIdx === 0 && (<td className="border px-3 py-2 text-center font-medium bg-gray-50" rowSpan={group.items.length}>{group.name}</td>)}
                          <td className="border px-3 py-2"><div className="font-medium text-gray-800">{item.item_name}</div>{item.guide_description && (<div className="text-xs text-blue-600 mt-1 hidden group-hover:block">📋 {item.guide_description}</div>)}</td>
                          <td className="border px-3 py-2"><div className="text-gray-600">{item.item_description}</div>{item.check_points && item.check_points.length > 0 && (<div className="mt-1 p-1.5 bg-cyan-50 rounded text-xs hidden group-hover:block"><p className="font-medium text-cyan-700 mb-1">점검 포인트:</p>{item.check_points.map((point, pIdx) => (<p key={pIdx} className="text-cyan-600">• {point}</p>))}</div>)}</td>
                          <td className="border px-3 py-2 text-center"><input type="checkbox" checked={checklistResults[item.id]?.result === 'pass'} onChange={(e) => handleChecklistChange(item.id, 'result', e.target.checked ? 'pass' : '')} className="w-4 h-4 text-cyan-600 rounded" /></td>
                          <td className="border px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <label className="cursor-pointer p-1 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors">
                                <Camera size={16} />
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { handleChecklistChange(item.id, 'photos', [...(checklistResults[item.id]?.photos || []), { url: ev.target.result, name: file.name, timestamp: new Date().toISOString() }]); }; reader.readAsDataURL(file); }}} />
                              </label>
                              {checklistResults[item.id]?.photos?.length > 0 && (<span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded-full">{checklistResults[item.id].photos.length}</span>)}
                            </div>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 5. 인수업체 검수 */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('toInspection')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="text-green-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">5. 인수업체 검수</h3>
                <p className="text-xs text-gray-500">인수업체 담당자 <span className="text-green-500">체크리스트 점검 후 진행</span></p>
              </div>
            </div>
            {expandedSections.toInspection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.toInspection && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-sm text-green-800"><AlertCircle className="inline mr-2" size={16} />인수업체 담당자가 금형 상태를 최종 확인하고 검수를 완료합니다.</p></div>
            </div>
          )}
        </div>

        {/* 6. 완료/관리 단계 */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('complete')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg"><Check className="text-gray-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">6. 완료/관리 단계</h3>
                <p className="text-xs text-gray-500">HQ 작성 <span className="text-gray-500">인수검수 승인 후 진행</span></p>
              </div>
            </div>
            {expandedSections.complete ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {expandedSections.complete && (
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4"><p className="text-sm text-gray-800"><AlertCircle className="inline mr-2" size={16} />이관 완료 후 관리 정보를 기록합니다.</p></div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">취소</button>
          <button type="button" onClick={() => alert('임시저장 되었습니다.')} className="px-6 py-2 border border-purple-300 rounded-lg text-purple-700 hover:bg-purple-50">임시저장</button>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center">
            {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>저장 중...</>) : (<><Send size={18} className="mr-2" />제출</>)}
          </button>
        </div>
      </form>
    </div>
  );
}
