import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, Camera, Upload, X, AlertCircle, CheckCircle,
  Clock, User, Calendar, FileText, Phone, MapPin, Package, Wrench,
  Building, Truck, DollarSign, ClipboardList, Link2, ChevronDown, ChevronUp
} from 'lucide-react';
import { repairRequestAPI, moldSpecificationAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

/**
 * PC 수리요청 양식 페이지
 * PC/모바일 동기화: repairRequestAPI 사용, repair_requests 테이블
 */
export default function RepairRequestForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const moldId = searchParams.get('moldId');
  const requestId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    product: true,
    repair: false,
    management: false
  });
  
  const [formData, setFormData] = useState({
    // 기본 정보
    problem: '',
    cause_and_reason: '',
    priority: '보통',
    status: '금형수정중',
    manager_name: '',
    occurred_date: new Date().toISOString().split('T')[0],
    problem_source: '',
    
    // 금형/제품 정보
    requester_name: user?.name || '',
    car_model: '',
    part_number: '',
    part_name: '',
    occurrence_type: '신규',
    production_site: '',
    production_manager: '',
    contact: '',
    production_shot: '',
    maker: '',
    operation_type: '양산',
    problem_type: '',
    
    // 수리 정보
    repair_cost: '',
    completion_date: '',
    temporary_action: '',
    root_cause_action: '',
    mold_arrival_date: '',
    stock_schedule_date: '',
    stock_quantity: '',
    stock_unit: 'EA',
    repair_company: '',
    repair_duration: '',
    
    // 관리 정보
    management_type: '',
    sign_off_status: '제출되지 않음',
    representative_part_number: '',
    order_company: ''
  });

  useEffect(() => {
    if (requestId) {
      loadRepairRequest();
    } else if (moldId) {
      loadMoldInfo();
    }
  }, [requestId, moldId]);

  const loadMoldInfo = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        const spec = response.data.data;
        setMoldInfo(spec);
        setFormData(prev => ({
          ...prev,
          car_model: spec.car_model || '',
          part_number: spec.part_number || '',
          part_name: spec.part_name || '',
          maker: spec.makerCompany?.company_name || '',
          production_site: spec.plantCompany?.company_name || '',
          production_shot: spec.mold?.current_shots || ''
        }));
      }
    } catch (error) {
      console.error('Load mold info error:', error);
    } finally {
      setLoading(false);
    }
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

  const priorityOptions = ['높음', '보통', '낮음'];
  const statusOptions = ['금형수정중', '수리완료', '검토중', '승인대기', '반려'];
  const occurrenceOptions = ['신규', '재발'];
  const operationOptions = ['양산', '개발', '시작'];
  const problemTypeOptions = ['내구성', '외관', '치수', '기능', '기타'];
  const managementTypeOptions = ['전산공유(L1)', '일반', '긴급'];

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

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* 기본 정보 섹션 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-slate-800">기본 정보</span>
              <span className="text-xs text-red-500">* 필수</span>
            </div>
            {expandedSections.basic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.basic && (
            <div className="p-6 space-y-4">
              {/* 문제 */}
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
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="- 원인:&#10;- 발생사유:"
                />
              </div>

              {/* 우선순위 & 진행상태 */}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">진행상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {statusOptions.map(opt => (
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => handleChange('manager_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="담당자명"
                  />
                </div>
              </div>

              {/* 문제 유형 & 발생 유형 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">운영 유형</label>
                  <select
                    value={formData.operation_type}
                    onChange={(e) => handleChange('operation_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {operationOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 제품/금형 정보 섹션 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('product')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800">제품/금형 정보</span>
              <span className="text-xs text-blue-500">자동연동</span>
            </div>
            {expandedSections.product ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.product && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">차종</label>
                  <input
                    type="text"
                    value={formData.car_model}
                    onChange={(e) => handleChange('car_model', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="자동연동"
                    readOnly={!!moldId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">품번</label>
                  <input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => handleChange('part_number', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="자동연동"
                    readOnly={!!moldId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">품명</label>
                  <input
                    type="text"
                    value={formData.part_name}
                    onChange={(e) => handleChange('part_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="자동연동"
                    readOnly={!!moldId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">제작처</label>
                  <input
                    type="text"
                    value={formData.maker}
                    onChange={(e) => handleChange('maker', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="자동연동"
                    readOnly={!!moldId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">생산처</label>
                  <input
                    type="text"
                    value={formData.production_site}
                    onChange={(e) => handleChange('production_site', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="자동연동"
                    readOnly={!!moldId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">현재 타수</label>
                  <input
                    type="text"
                    value={formData.production_shot}
                    onChange={(e) => handleChange('production_shot', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                    placeholder="자동연동"
                    readOnly={!!moldId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">요청자</label>
                  <input
                    type="text"
                    value={formData.requester_name}
                    onChange={(e) => handleChange('requester_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="요청자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">생산담당자</label>
                  <input
                    type="text"
                    value={formData.production_manager}
                    onChange={(e) => handleChange('production_manager', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="생산담당자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleChange('contact', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 수리 정보 섹션 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('repair')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-slate-800">수리 정보</span>
            </div>
            {expandedSections.repair ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.repair && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">임시 조치 내용</label>
                <textarea
                  value={formData.temporary_action}
                  onChange={(e) => handleChange('temporary_action', e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  placeholder="임시 조치 내용을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">근본 원인 조치</label>
                <textarea
                  value={formData.root_cause_action}
                  onChange={(e) => handleChange('root_cause_action', e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  placeholder="근본 원인 조치 내용을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리업체</label>
                  <input
                    type="text"
                    value={formData.repair_company}
                    onChange={(e) => handleChange('repair_company', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="수리업체명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리비용</label>
                  <input
                    type="text"
                    value={formData.repair_cost}
                    onChange={(e) => handleChange('repair_cost', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="₩"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">수리기간</label>
                  <input
                    type="text"
                    value={formData.repair_duration}
                    onChange={(e) => handleChange('repair_duration', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="예: 3일"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">완료예정일</label>
                  <input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => handleChange('completion_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">금형 입고일</label>
                  <input
                    type="date"
                    value={formData.mold_arrival_date}
                    onChange={(e) => handleChange('mold_arrival_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">재고 예정일</label>
                  <input
                    type="date"
                    value={formData.stock_schedule_date}
                    onChange={(e) => handleChange('stock_schedule_date', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">재고 수량</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">단위</label>
                  <select
                    value={formData.stock_unit}
                    onChange={(e) => handleChange('stock_unit', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
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

        {/* 관리 정보 섹션 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('management')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-slate-800">관리 정보</span>
            </div>
            {expandedSections.management ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.management && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">관리 유형</label>
                  <select
                    value={formData.management_type}
                    onChange={(e) => handleChange('management_type', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
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
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">발주업체</label>
                  <input
                    type="text"
                    value={formData.order_company}
                    onChange={(e) => handleChange('order_company', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    placeholder="발주업체명"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">대표 품번</label>
                <input
                  type="text"
                  value={formData.representative_part_number}
                  onChange={(e) => handleChange('representative_part_number', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                  placeholder="대표 품번"
                />
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
