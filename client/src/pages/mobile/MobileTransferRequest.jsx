import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, Camera, CheckCircle, AlertCircle, FileText,
  Package, Building2, Building, User, Wrench, Truck, ClipboardList,
  ChevronDown, ChevronUp, Check, Wifi, WifiOff, Shield
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { transferAPI, moldSpecificationAPI, userAPI } from '../../lib/api';
import useOfflineSync from '../../hooks/useOfflineSync.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * 모바일 이관요청 페이지 - 새로운 업무플로
 * 1. 요청 단계 (인계업체) - 금형 기본정보 자동 로딩
 * 2. 점검 체크리스트 (인계업체 작성)
 * 3. 인계준비 승인 (개발담당 승인)
 * 4. 검수승인 (인수업체)
 * 5. 이관 승인 (개발담당)
 * 6. 완료/관리 단계
 */
export default function MobileTransferRequest() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [developerList, setDeveloperList] = useState([]);
  
  const { online } = useOfflineSync();
  
  const [expandedSections, setExpandedSections] = useState({
    request: true,
    checklist: false,
    handoverApproval: false,
    inspectionApproval: false,
    transferApproval: false,
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
    to_manager_name: '',
    to_manager_contact: '',
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
    status: '요청접수'
  });

  const progressSteps = [
    { key: 'request', label: '요청', icon: FileText },
    { key: 'checklist', label: '점검', icon: ClipboardList },
    { key: 'handover', label: '인계승인', icon: Shield },
    { key: 'inspection', label: '검수승인', icon: CheckCircle },
    { key: 'transfer', label: '이관승인', icon: Truck },
    { key: 'complete', label: '완료', icon: Check }
  ];

  const getCurrentStep = () => {
    const status = formData.status;
    if (status === '요청접수') return 0;
    if (status === '체크리스트작성' || status === '체크리스트완료') return 1;
    if (status === '인계승인대기' || status === '인계승인완료') return 2;
    if (status === '검수승인대기' || status === '검수승인완료') return 3;
    if (status === '이관승인대기' || status === '이관승인완료') return 4;
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
    { id: 1, category: 'fitting', category_name: '습합', item_name: '제품 BURR', item_description: 'BURR 발생부 습합개소 확인', check_points: ['BURR 발생 위치 확인', '습합 개소 상태 점검'] },
    { id: 2, category: 'appearance', category_name: '외관', item_name: 'EYE BOLT 체결부', item_description: '피치 마모 및 밀착상태 확인', check_points: ['피치 마모 상태 확인', '밀착 상태 점검'] },
    { id: 3, category: 'appearance', category_name: '외관', item_name: '상,하 고정판 확인', item_description: '이물 및 녹 오염상태 확인', check_points: ['이물질 부착 여부 확인', '녹 발생 상태 점검'] },
    { id: 4, category: 'appearance', category_name: '외관', item_name: '냉각상태', item_description: '냉각호스 정리 및 오염상태 확인', check_points: ['냉각호스 연결 상태 확인', '오염 및 누수 확인'] },
    { id: 5, category: 'cavity', category_name: '캐비티', item_name: '표면 흠집,녹', item_description: '표면 흠 및 녹 발생상태 확인', check_points: ['표면 흠집 유무 확인', '녹 발생 여부 점검'] },
    { id: 6, category: 'cavity', category_name: '캐비티', item_name: '파팅면 오염,탄화', item_description: '파팅면 오염 및 탄화수지 확인', check_points: ['파팅면 오염 상태 확인', '탄화수지 부착 여부 점검'] },
    { id: 7, category: 'cavity', category_name: '캐비티', item_name: '파팅면 BURR', item_description: '파팅면 끝단 손으로 접촉 확인', check_points: ['파팅면 끝단 상태 확인', 'BURR 발생 여부 점검'] },
    { id: 8, category: 'core', category_name: '코어', item_name: '코어류 분해청소', item_description: '긁힘 상태확인 및 이물확인', check_points: ['코어 분해 상태 확인', '이물질 유무 확인'] },
    { id: 9, category: 'core', category_name: '코어', item_name: '마모', item_description: '작동부 마모상태 점검', check_points: ['작동부 마모 정도 확인', '교체 필요 여부 판단'] },
    { id: 10, category: 'core', category_name: '코어', item_name: '작동유 윤활유', item_description: '작동유 윤활상태 확인', check_points: ['윤활유 상태 확인', '보충 필요 여부 판단'] },
    { id: 11, category: 'hydraulic', category_name: '유압장치', item_name: '작동유 누유', item_description: '유압 배관 파손 확인', check_points: ['배관 파손 여부 확인', '누유 발생 위치 점검'] },
    { id: 12, category: 'hydraulic', category_name: '유압장치', item_name: '호스 및 배선정리', item_description: '호스,배선 정돈상태 확인', check_points: ['호스 정리 상태 확인', '꼬임 및 손상 확인'] },
    { id: 13, category: 'heater', category_name: '히터', item_name: '히터단선 누전', item_description: '히터단선,누전확인[테스터기]', check_points: ['히터 단선 여부 확인', '저항값 측정 기록'] },
    { id: 14, category: 'heater', category_name: '히터', item_name: '수지 누출', item_description: '수지 넘침 확인', check_points: ['수지 누출 위치 확인', '청소 필요 여부 판단'] }
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

  const handleSubmit = async () => {
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
        to_manager_name: formData.to_manager_name,
        to_manager_contact: formData.to_manager_contact,
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
        navigate(`/mobile/mold/${moldId}`);
      }
    } catch (error) {
      console.error('Failed to create transfer:', error);
      alert('이관 요청 등록에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const plantCompanies = companies.filter(c => c.company_type === 'plant');
  const currentStep = getCurrentStep();

  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { name: item.category_name, items: [] };
    }
    acc[item.category].items.push(item);
    return acc;
  }, {});

  const checklistCompletionRate = () => {
    const total = checklistItems.length;
    if (total === 0) return 0;
    const completed = Object.values(checklistResults).filter(r => r?.result === 'pass' || r?.result === 'fail').length;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={24} /></button>
            <div>
              <div className="flex items-center gap-2">
                <Truck size={20} />
                <h1 className="text-lg font-bold">금형이관 요청</h1>
              </div>
              <p className="text-xs text-purple-200">{moldInfo?.part_number || 'P-XXXX'} - {moldInfo?.part_name || '금형명'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {online ? <Wifi size={16} className="text-green-300" /> : <WifiOff size={16} className="text-red-300" />}
          </div>
        </div>
      </div>

      {/* 진행 상태 */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto">
          {progressSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center min-w-[50px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isActive ? 'bg-purple-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {isCompleted ? <Check size={14} /> : <StepIcon size={14} />}
                </div>
                <span className={`text-[10px] ${isActive ? 'text-purple-600 font-medium' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 1. 요청 단계 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('request')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg"><FileText className="text-purple-600" size={16} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">1. 요청 단계</h3>
                <p className="text-[10px] text-gray-500">인계업체 작성 <span className="text-red-500">*필수</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">인계업체</span>
              {expandedSections.request ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          
          {expandedSections.request && (
            <div className="p-4 space-y-4">
              {/* 금형 기본 정보 */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><Package size={14} className="text-blue-600" />금형 정보 <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">자동로딩</span></h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg text-center"><p className="text-[10px] text-gray-500">차종</p><p className="text-xs font-medium">{moldInfo?.car_model || '-'}</p></div>
                  <div className="p-2 bg-gray-50 rounded-lg text-center"><p className="text-[10px] text-gray-500">품번</p><p className="text-xs font-medium">{moldInfo?.part_number || '-'}</p></div>
                  <div className="p-2 bg-purple-50 rounded-lg text-center"><p className="text-[10px] text-gray-500">타수</p><p className="text-xs font-bold text-purple-600">{formData.cumulative_shots || '-'}</p></div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">이관일 <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.transfer_date} onChange={(e) => handleChange('transfer_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">우선순위</label>
                  <select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="낮음">낮음</option>
                    <option value="보통">보통</option>
                    <option value="높음">높음</option>
                    <option value="긴급">긴급</option>
                  </select>
                </div>
              </div>

              {/* 인계 업체 */}
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1"><Building2 size={14} />인계 업체</h4>
                <select value={formData.from_company_id} onChange={(e) => handleChange('from_company_id', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2">
                  <option value="">업체 선택 *</option>
                  {plantCompanies.map(c => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={formData.from_manager_name} onChange={(e) => handleChange('from_manager_name', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="담당자" />
                  <input type="text" value={formData.from_manager_contact} onChange={(e) => handleChange('from_manager_contact', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="연락처" />
                </div>
              </div>

              {/* 인수 업체 */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><Building size={14} />인수 업체</h4>
                <select value={formData.to_company_id} onChange={(e) => handleChange('to_company_id', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2">
                  <option value="">업체 선택 *</option>
                  {plantCompanies.filter(c => c.id !== parseInt(formData.from_company_id)).map(c => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={formData.to_manager_name} onChange={(e) => handleChange('to_manager_name', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="담당자" />
                  <input type="text" value={formData.to_manager_contact} onChange={(e) => handleChange('to_manager_contact', e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="연락처" />
                </div>
              </div>

              {/* 개발담당자 */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><User size={14} />개발담당자</h4>
                <select value={formData.developer_id} onChange={(e) => { const selected = developerList.find(u => u.id === parseInt(e.target.value)); if (selected) { handleChange('developer_id', selected.id); handleChange('developer_name', selected.name); }}} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">담당자 선택</option>
                  {developerList.map(dev => (<option key={dev.id} value={dev.id}>{dev.name}</option>))}
                </select>
              </div>

              {/* 관리 현황 */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><Wrench size={14} className="text-orange-600" />관리 현황</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] text-gray-500 mb-1">세척등급</label><select value={formData.cleaning_grade} onChange={(e) => handleChange('cleaning_grade', e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm"><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                  <div><label className="block text-[10px] text-gray-500 mb-1">최종 세척일</label><input type="date" value={formData.last_cleaning_date} onChange={(e) => handleChange('last_cleaning_date', e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" /></div>
                  <div><label className="block text-[10px] text-gray-500 mb-1">습합등급</label><select value={formData.fitting_grade} onChange={(e) => handleChange('fitting_grade', e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm"><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
                  <div><label className="block text-[10px] text-gray-500 mb-1">최종 습합일</label><input type="date" value={formData.last_fitting_date} onChange={(e) => handleChange('last_fitting_date', e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" /></div>
                </div>
              </div>

              {/* 이관 사유 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">이관 사유</label>
                <textarea value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="이관 사유를 입력하세요..." />
              </div>
            </div>
          )}
        </div>

        {/* 2. 점검 체크리스트 (인계업체 작성) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('checklist')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-100 rounded-lg"><ClipboardList className="text-cyan-600" size={16} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">2. 점검 체크리스트</h3>
                <p className="text-[10px] text-gray-500">인계업체 작성</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded">인계업체</span>
              <span className="text-[10px] bg-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded">{checklistCompletionRate()}%</span>
              {expandedSections.checklist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.checklist && (
            <div className="p-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-cyan-800"><AlertCircle className="inline mr-1" size={14} />인계업체에서 금형 상태를 점검하고 체크리스트를 작성합니다.</p>
              </div>
              {Object.entries(groupedChecklist).map(([category, group]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.name}</h4>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{item.item_name}</p>
                            <p className="text-xs text-gray-500">{item.item_description}</p>
                            {item.check_points && item.check_points.length > 0 && (
                              <div className="mt-2 p-2 bg-cyan-50 rounded-lg">
                                <p className="text-[10px] font-medium text-cyan-700 mb-1">점검 포인트:</p>
                                {item.check_points.map((point, pIdx) => (<p key={pIdx} className="text-[10px] text-cyan-600">• {point}</p>))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <select value={checklistResults[item.id]?.result || ''} onChange={(e) => handleChecklistChange(item.id, 'result', e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs w-16">
                              <option value="">선택</option>
                              <option value="pass">양호</option>
                              <option value="fail">불량</option>
                            </select>
                            <label className="p-2 text-gray-400 hover:text-cyan-600 rounded-lg cursor-pointer relative">
                              <Camera size={18} />
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { handleChecklistChange(item.id, 'photos', [...(checklistResults[item.id]?.photos || []), { url: ev.target.result, name: file.name }]); }; reader.readAsDataURL(file); }}} />
                              {checklistResults[item.id]?.photos?.length > 0 && (<span className="absolute -top-1 -right-1 text-[10px] bg-cyan-500 text-white w-4 h-4 rounded-full flex items-center justify-center">{checklistResults[item.id].photos.length}</span>)}
                            </label>
                          </div>
                        </div>
                        {checklistResults[item.id]?.photos?.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto">
                            {checklistResults[item.id].photos.map((photo, pIdx) => (
                              <div key={pIdx} className="relative flex-shrink-0">
                                <img src={photo.url} alt={`사진 ${pIdx + 1}`} className="w-14 h-14 object-cover rounded-lg border" />
                                <button type="button" onClick={() => { const newPhotos = checklistResults[item.id].photos.filter((_, i) => i !== pIdx); handleChecklistChange(item.id, 'photos', newPhotos); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. 인계준비 승인 (개발담당) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('handoverApproval')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg"><Shield className="text-blue-600" size={16} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">3. 인계준비 승인</h3>
                <p className="text-[10px] text-blue-500">개발담당 승인</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">개발담당</span>
              {expandedSections.handoverApproval ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.handoverApproval && (
            <div className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-xs text-blue-800"><AlertCircle className="inline mr-1" size={14} />개발담당자가 체크리스트 작성 내용을 검토하고 인계준비를 승인합니다.</p></div>
            </div>
          )}
        </div>

        {/* 4. 검수승인 (인수업체) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('inspectionApproval')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg"><CheckCircle className="text-green-600" size={16} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">4. 검수승인</h3>
                <p className="text-[10px] text-green-500">인수업체 검수</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">인수업체</span>
              {expandedSections.inspectionApproval ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.inspectionApproval && (
            <div className="p-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-xs text-green-800"><AlertCircle className="inline mr-1" size={14} />인수업체 담당자가 체크리스트 내용을 확인하고 금형 상태를 검수합니다.</p></div>
            </div>
          )}
        </div>

        {/* 5. 이관 승인 (개발담당) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('transferApproval')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg"><Truck className="text-orange-600" size={16} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">5. 이관 승인</h3>
                <p className="text-[10px] text-orange-500">개발담당 최종승인</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">개발담당</span>
              {expandedSections.transferApproval ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.transferApproval && (
            <div className="p-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-xs text-orange-800"><AlertCircle className="inline mr-1" size={14} />개발담당자가 검수 완료 후 최종 이관을 승인합니다.</p></div>
            </div>
          )}
        </div>

        {/* 6. 완료/관리 단계 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('complete')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg"><Check className="text-gray-600" size={16} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">6. 완료/관리 단계</h3>
                <p className="text-[10px] text-gray-500">이관 완료 처리</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">HQ</span>
              {expandedSections.complete ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.complete && (
            <div className="p-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3"><p className="text-xs text-gray-800"><AlertCircle className="inline mr-1" size={14} />이관 완료 후 관리 정보를 기록합니다.</p></div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
        <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium">취소</button>
        <button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>저장 중...</>) : (<><Send size={18} />제출</>)}
        </button>
      </div>
    </div>
  );
}
