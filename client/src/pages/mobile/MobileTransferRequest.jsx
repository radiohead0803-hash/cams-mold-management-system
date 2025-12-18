import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Camera, CheckCircle, Clock, AlertCircle, 
  Package, Building2, Wrench, ChevronDown, ChevronUp, X, Image as ImageIcon,
  Wifi, WifiOff
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { transferAPI, moldSpecificationAPI } from '../../lib/api';
import useOfflineSync, { SyncStatus } from '../../hooks/useOfflineSync.jsx';
import { tempStorage } from '../../utils/mobileStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function MobileTransferRequest() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    moldInfo: true,
    management: true,
    checklist: true,
    approval: false
  });

  // 오프라인 동기화
  const { online, syncing, pendingCount, processQueue } = useOfflineSync();
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    transfer_date: new Date().toISOString().split('T')[0],
    from_company_id: '',
    to_company_id: '',
    developer_id: '',
    reason: '',
    cumulative_shots: '',
    last_cleaning_date: '',
    last_fitting_date: '',
    weight: '',
    machine_tonnage: '',
    special_notes: '',
    cleaning_grade: 'B',
    fitting_grade: 'B'
  });

  useEffect(() => {
    loadInitialData();
  }, [moldId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 금형 정보 로드
      if (moldId) {
        const moldRes = await moldSpecificationAPI.getById(moldId);
        if (moldRes.data.success) {
          setMoldInfo(moldRes.data.data);
          setFormData(prev => ({
            ...prev,
            from_company_id: moldRes.data.data.plant_company_id || '',
            cumulative_shots: moldRes.data.data.current_shots || ''
          }));
        }
      }
      
      // 업체 목록 로드
      const companiesRes = await fetch(`${API_URL}/companies?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const companiesData = await companiesRes.json();
      if (companiesData.success) {
        setCompanies(companiesData.data.items || []);
      }
      
      // 체크리스트 항목 로드
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
      } catch (checklistError) {
        console.error('Failed to load checklist:', checklistError);
        setChecklistItems(getDefaultChecklistItems());
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklistItems = () => [
    { id: 1, category: 'fitting', category_name: '습합', item_name: '제품 BURR', item_description: 'BURR 발생부 습합개소 확인', requires_photo: false, guide_description: '제품 BURR 발생부의 습합 상태를 확인합니다', check_points: ['BURR 발생 위치 확인', '습합 개소 상태 점검', '필요시 수정 작업 진행'] },
    { id: 2, category: 'appearance', category_name: '외관', item_name: 'EYE BOLT 체결부', item_description: '피치 마모 및 밀착상태 확인', requires_photo: false, guide_description: 'EYE BOLT 체결부의 피치 마모 및 밀착상태를 확인합니다', check_points: ['피치 마모 상태 확인', '밀착 상태 점검', '체결 토크 확인'] },
    { id: 3, category: 'appearance', category_name: '외관', item_name: '상,하 고정판 확인', item_description: '이물 및 녹 오염상태 확인', requires_photo: false, guide_description: '상,하 고정판의 이물 및 녹 오염상태를 확인합니다', check_points: ['이물질 부착 여부 확인', '녹 발생 상태 점검', '오염 정도 확인'] },
    { id: 4, category: 'appearance', category_name: '외관', item_name: '냉각상태', item_description: '냉각호스 정리 및 오염상태 확인', requires_photo: false, guide_description: '냉각호스 정리 및 오염상태를 확인합니다', check_points: ['냉각호스 연결 상태 확인', '호스 정리 상태 점검', '오염 및 누수 확인'] },
    { id: 5, category: 'cavity', category_name: '캐비티', item_name: '표면 흠집,녹', item_description: '표면 흠 및 녹 발생상태 확인', requires_photo: true, guide_description: '표면 흠 및 녹 발생상태를 확인합니다', check_points: ['표면 흠집 유무 확인', '녹 발생 여부 점검', '손상 정도 기록'] },
    { id: 6, category: 'cavity', category_name: '캐비티', item_name: '파팅면 오염,탄화', item_description: '파팅면 오염 및 탄화수지 확인', requires_photo: true, guide_description: '파팅면 오염 및 탄화수지 상태를 확인합니다', check_points: ['파팅면 오염 상태 확인', '탄화수지 부착 여부 점검', '청소 필요 여부 판단'] },
    { id: 7, category: 'cavity', category_name: '캐비티', item_name: '파팅면 BURR', item_description: '파팅면 끝단 손으로 접촉 확인', requires_photo: false, guide_description: '파팅면 끝단을 손으로 접촉하여 BURR 상태를 확인합니다', check_points: ['파팅면 끝단 상태 확인', 'BURR 발생 여부 점검', '손으로 접촉 시 이상 유무'] },
    { id: 8, category: 'core', category_name: '코어', item_name: '코어류 분해청소', item_description: '긁힘 상태확인 및 이물확인', requires_photo: true, guide_description: '코어류 분해 후 긁힘 상태 및 이물을 확인합니다', check_points: ['코어 분해 상태 확인', '긁힘 및 손상 점검', '이물질 유무 확인'] },
    { id: 9, category: 'core', category_name: '코어', item_name: '마모', item_description: '작동부 마모상태 점검', requires_photo: false, guide_description: '작동부 마모상태를 점검합니다', check_points: ['작동부 마모 정도 확인', '교체 필요 여부 판단', '마모 패턴 기록'] },
    { id: 10, category: 'core', category_name: '코어', item_name: '작동유 윤활유', item_description: '작동유 윤활상태 확인', requires_photo: false, guide_description: '작동유 윤활상태를 확인합니다', check_points: ['윤활유 상태 확인', '윤활 부족 여부 점검', '보충 필요 여부 판단'] },
    { id: 11, category: 'hydraulic', category_name: '유압장치', item_name: '작동유 누유', item_description: '유압 배관 파손 확인', requires_photo: false, guide_description: '유압 배관 파손 및 누유 상태를 확인합니다', check_points: ['배관 파손 여부 확인', '누유 발생 위치 점검', '수리 필요 여부 판단'] },
    { id: 12, category: 'hydraulic', category_name: '유압장치', item_name: '호스 및 배선정리', item_description: '호스,배선 정돈상태 확인', requires_photo: false, guide_description: '호스 및 배선 정돈상태를 확인합니다', check_points: ['호스 정리 상태 확인', '배선 정돈 여부 점검', '꼬임 및 손상 확인'] },
    { id: 13, category: 'heater', category_name: '히터', item_name: '히터단선 누전', item_description: '히터단선,누전확인[테스터기]', requires_photo: false, guide_description: '히터단선 및 누전 상태를 테스터기로 확인합니다', check_points: ['히터 단선 여부 확인', '누전 테스트 진행', '저항값 측정 기록'] },
    { id: 14, category: 'heater', category_name: '히터', item_name: '수지 누출', item_description: '수지 넘침 확인', requires_photo: false, guide_description: '수지 넘침 상태를 확인합니다', check_points: ['수지 누출 위치 확인', '넘침 정도 점검', '청소 필요 여부 판단'] }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        transfer_type: 'plant_to_plant',
        from_company_id: parseInt(formData.from_company_id),
        to_company_id: parseInt(formData.to_company_id),
        developer_id: parseInt(formData.developer_id) || null,
        request_date: formData.transfer_date,
        planned_transfer_date: formData.transfer_date,
        reason: formData.reason,
        current_shots: parseInt(formData.cumulative_shots) || 0,
        mold_info_snapshot: {
          ...moldInfo,
          cumulative_shots: formData.cumulative_shots,
          last_cleaning_date: formData.last_cleaning_date,
          last_fitting_date: formData.last_fitting_date,
          weight: formData.weight,
          machine_tonnage: formData.machine_tonnage,
          special_notes: formData.special_notes,
          cleaning_grade: formData.cleaning_grade,
          fitting_grade: formData.fitting_grade
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
  const selectedFromCompany = companies.find(c => c.id === parseInt(formData.from_company_id));
  const selectedToCompany = companies.find(c => c.id === parseInt(formData.to_company_id));

  // 카테고리별 그룹화
  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { name: item.category_name, items: [] };
    }
    acc[item.category].items.push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">금형 이관 요청</h1>
              <p className="text-xs text-white/80">
                {moldInfo?.part_number || ''} - {moldInfo?.part_name || ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* 금형 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('moldInfo')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-sky-50"
          >
            <div className="flex items-center gap-2">
              <Package className="text-blue-600" size={18} />
              <span className="font-medium text-gray-800">금형 기본 정보</span>
            </div>
            {expandedSections.moldInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.moldInfo && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">차종</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.car_model || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">품번</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.part_number || '-'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">품명</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.part_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">금형 타입</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.mold_type || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">형체력(Ton)</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.tonnage || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">재질</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.material || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">제작처</label>
                  <div className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-lg">
                    {moldInfo?.maker_company_name || '-'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">이관일</label>
                <input 
                  type="date" 
                  name="transfer_date"
                  value={formData.transfer_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* 관리 현황 (인계 업체) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('management')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50"
          >
            <div className="flex items-center gap-2">
              <Building2 className="text-orange-600" size={18} />
              <span className="font-medium text-gray-800">관리 현황 (인계/인수)</span>
            </div>
            {expandedSections.management ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.management && (
            <div className="p-4 space-y-4">
              {/* 인계 업체 */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-orange-700 mb-3">인계 업체 정보</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">인계 업체 <span className="text-red-500">*</span></label>
                    <select 
                      name="from_company_id"
                      value={formData.from_company_id}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">업체 선택</option>
                      {plantCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">누적 SHOT 수</label>
                      <input 
                        type="number" 
                        name="cumulative_shots"
                        value={formData.cumulative_shots}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="152,238"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">관리중량(g)</label>
                      <input 
                        type="number" 
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="1,460"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">세척등급</label>
                      <select 
                        name="cleaning_grade"
                        value={formData.cleaning_grade}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">최종 세척일</label>
                      <input 
                        type="date" 
                        name="last_cleaning_date"
                        value={formData.last_cleaning_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">습합등급</label>
                      <select 
                        name="fitting_grade"
                        value={formData.fitting_grade}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">최종 습합일</label>
                      <input 
                        type="date" 
                        name="last_fitting_date"
                        value={formData.last_fitting_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">사출기 사양</label>
                    <input 
                      type="text" 
                      name="machine_tonnage"
                      value={formData.machine_tonnage}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="UBE 2,200Ton"
                    />
                  </div>
                </div>
              </div>
              
              {/* 인수 업체 */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-3">인수 업체 정보</h4>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">인수 업체 <span className="text-red-500">*</span></label>
                  <select 
                    name="to_company_id"
                    value={formData.to_company_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">업체 선택</option>
                    {plantCompanies.filter(c => c.id !== parseInt(formData.from_company_id)).map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 특이사항 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">특이사항</label>
                <textarea 
                  name="special_notes"
                  value={formData.special_notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="특이사항을 입력하세요..."
                />
              </div>
            </div>
          )}
        </div>

        {/* 점검 체크리스트 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('checklist')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50"
          >
            <div className="flex items-center gap-2">
              <Wrench className="text-green-600" size={18} />
              <span className="font-medium text-gray-800">점검 체크리스트</span>
            </div>
            {expandedSections.checklist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.checklist && (
            <div className="p-4">
              {Object.entries(groupedChecklist).map(([category, group]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                    {group.name}
                  </h4>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <input 
                            type="checkbox"
                            checked={checklistResults[item.id]?.result === 'pass'}
                            onChange={(e) => handleChecklistChange(item.id, 'result', e.target.checked ? 'pass' : '')}
                            className="mt-0.5 w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{item.item_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.item_description}</p>
                            {item.check_points && item.check_points.length > 0 && (
                              <div className="mt-2 p-2 bg-cyan-50 rounded-lg">
                                <p className="text-xs font-medium text-cyan-700 mb-1">📋 점검 포인트:</p>
                                {item.check_points.map((point, pIdx) => (
                                  <p key={pIdx} className="text-xs text-cyan-600">• {point}</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <label className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer relative">
                            <Camera size={18} />
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    handleChecklistChange(item.id, 'photos', [
                                      ...(checklistResults[item.id]?.photos || []),
                                      { url: ev.target.result, name: file.name, timestamp: new Date().toISOString() }
                                    ]);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {checklistResults[item.id]?.photos?.length > 0 && (
                              <span className="absolute -top-1 -right-1 text-xs bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                                {checklistResults[item.id].photos.length}
                              </span>
                            )}
                          </label>
                        </div>
                        {checklistResults[item.id]?.photos?.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto">
                            {checklistResults[item.id].photos.map((photo, pIdx) => (
                              <div key={pIdx} className="relative flex-shrink-0">
                                <img src={photo.url} alt={`사진 ${pIdx + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPhotos = checklistResults[item.id].photos.filter((_, i) => i !== pIdx);
                                    handleChecklistChange(item.id, 'photos', newPhotos);
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
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

        {/* 승인 정보 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('approval')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="text-purple-600" size={18} />
              <span className="font-medium text-gray-800">승인 정보</span>
            </div>
            {expandedSections.approval ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.approval && (
            <div className="p-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>이관 요청 후 <strong>인계업체 → 개발담당 → 인수업체</strong> 순서로 승인이 진행됩니다.</span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-orange-200 rounded-lg p-3 bg-orange-50/50">
                  <p className="text-xs text-orange-600 font-medium mb-2">인계 업체</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedFromCompany?.company_name || '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">담당: {user?.name || '-'}</p>
                </div>
                <div className="border border-green-200 rounded-lg p-3 bg-green-50/50">
                  <p className="text-xs text-green-600 font-medium mb-2">인수 업체</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedToCompany?.company_name || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">승인 후 자동 입력</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 이관 사유 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">이관 사유</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
            placeholder="이관 사유를 입력하세요..."
          />
        </div>
      </form>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !online}
          className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              저장 중...
            </>
          ) : !online ? (
            <>
              <WifiOff size={18} />
              오프라인
            </>
          ) : (
            <>
              <Save size={18} />
              이관 요청
            </>
          )}
        </button>
      </div>

      {/* 오프라인/동기화 상태 표시 */}
      <SyncStatus 
        online={online} 
        syncing={syncing} 
        pendingCount={pendingCount} 
        onSync={processQueue} 
      />
    </div>
  );
}
