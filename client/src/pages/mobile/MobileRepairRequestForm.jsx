import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, Camera, Upload, X, AlertCircle, CheckCircle,
  Clock, User, Calendar, FileText, Phone, MapPin, Package, Wrench,
  Building, Truck, DollarSign, ClipboardList, Link2
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function MobileRepairRequestForm() {
  const { id } = useParams(); // 수정 시 ID
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id);
  const [activeSection, setActiveSection] = useState('basic');
  
  // 금형 정보 (QR 스캔 또는 선택에서 전달)
  const moldInfo = location.state?.moldInfo || {};
  
  const [formData, setFormData] = useState({
    // 기본 정보
    problem: '',
    cause_and_reason: '',
    priority: '보통',
    status: '금형수정중',
    manager_name: '',
    occurred_date: new Date().toISOString().split('T')[0],
    problem_source: '',
    images: [],
    
    // 금형/제품 정보
    requester_name: user?.name || '',
    car_model: moldInfo?.car_model || '',
    part_number: moldInfo?.part_number || '',
    part_name: moldInfo?.part_name || '',
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
    management_type: '',
    sign_off_status: '제출되지 않음',
    representative_part_number: '',
    order_company: '',
    related_files: []
  });

  useEffect(() => {
    if (id) {
      loadRepairRequest();
    }
  }, [id]);

  const loadRepairRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/repair-requests/${id}`);
      if (response.data?.data) {
        setFormData(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSave = {
        ...formData,
        mold_spec_id: moldInfo?.id || formData.mold_spec_id
      };

      if (id) {
        await api.put(`/repair-requests/${id}`, dataToSave);
        alert('수정되었습니다.');
      } else {
        await api.post('/repair-requests', dataToSave);
        alert('등록되었습니다.');
      }

      navigate(-1);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic', name: '기본정보', icon: FileText },
    { id: 'product', name: '제품정보', icon: Package },
    { id: 'repair', name: '수리정보', icon: Wrench },
    { id: 'management', name: '관리정보', icon: ClipboardList }
  ];

  const priorityOptions = ['높음', '보통', '낮음'];
  const statusOptions = ['금형수정중', '수리완료', '검토중', '승인대기', '반려'];
  const occurrenceOptions = ['신규', '재발'];
  const operationOptions = ['양산', '개발', '시작'];
  const problemTypeOptions = ['내구성', '외관', '치수', '기능', '기타'];
  const managementTypeOptions = ['전산공유(L1)', '일반', '긴급'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="space-y-4">
            {/* 문제 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />문제 *
              </label>
              <textarea
                value={formData.problem}
                onChange={(e) => handleChange('problem', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="문제 내용을 입력하세요"
              />
            </div>

            {/* 원인 및 발생사유 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">원인 및 발생사유</label>
              <textarea
                value={formData.cause_and_reason}
                onChange={(e) => handleChange('cause_and_reason', e.target.value)}
                disabled={!isEditing}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="- 원인: &#10;- 발생사유:"
              />
            </div>

            {/* 우선순위 & 진행상태 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">우선 순위</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">진행상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 추진담당 & 발생일자 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />추진담당
                </label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => handleChange('manager_name', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />발생일자
                </label>
                <input
                  type="date"
                  value={formData.occurred_date}
                  onChange={(e) => handleChange('occurred_date', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* 문제점 출처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문제점 출처</label>
              <input
                type="text"
                value={formData.problem_source}
                onChange={(e) => handleChange('problem_source', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="문제점 출처를 입력하세요"
              />
            </div>

            {/* 이미지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Camera size={14} className="inline mr-1" />이미지 *
              </label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {isEditing && (
                  <button className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                    <Upload size={16} />
                    이미지 업로드
                  </button>
                )}
                {formData.images?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img} alt="" className="w-full h-20 object-cover rounded" />
                        {isEditing && (
                          <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'product':
        return (
          <div className="space-y-4">
            {/* 접수 및 요청담당 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />접수 및 요청담당
              </label>
              <input
                type="text"
                value={formData.requester_name}
                onChange={(e) => handleChange('requester_name', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
              />
            </div>

            {/* 대상차종 & 품번 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상차종 *</label>
                <input
                  type="text"
                  value={formData.car_model}
                  onChange={(e) => handleChange('car_model', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="예: NQPE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">품번 *</label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => handleChange('part_number', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="예: 86612-P1800"
                />
              </div>
            </div>

            {/* 품명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">품명 *</label>
              <input
                type="text"
                value={formData.part_name}
                onChange={(e) => handleChange('part_name', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="예: COVER-RR BUMPER LWR (UPT)"
              />
            </div>

            {/* 발생구분 & 생산처 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발생구분 *</label>
                <div className="flex gap-2">
                  {occurrenceOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => isEditing && handleChange('occurrence_type', opt)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        formData.occurrence_type === opt 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-600 border-gray-300'
                      } ${!isEditing ? 'opacity-60' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">생산처 *</label>
                <input
                  type="text"
                  value={formData.production_site}
                  onChange={(e) => handleChange('production_site', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="예: 신성화학"
                />
              </div>
            </div>

            {/* 담당자(생산처) & 연락처 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자(생산처) *</label>
                <input
                  type="text"
                  value={formData.production_manager}
                  onChange={(e) => handleChange('production_manager', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="예: 강찬혁 대리"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={14} className="inline mr-1" />연락처
                </label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            {/* 생산수량(SHOT) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생산수량(SHOT) *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.production_shot}
                  onChange={(e) => handleChange('production_shot', e.target.value)}
                  disabled={!isEditing}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="34006"
                />
                <span className="text-sm text-gray-500">SHOT</span>
              </div>
            </div>

            {/* 제작처 & 운영구분 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building size={14} className="inline mr-1" />제작처
                </label>
                <input
                  type="text"
                  value={formData.maker}
                  onChange={(e) => handleChange('maker', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="예: SM정밀"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">운영구분</label>
                <select
                  value={formData.operation_type}
                  onChange={(e) => handleChange('operation_type', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                >
                  {operationOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 문제유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문제유형</label>
              <div className="flex flex-wrap gap-2">
                {problemTypeOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => isEditing && handleChange('problem_type', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      formData.problem_type === opt 
                        ? 'bg-purple-500 text-white border-purple-500' 
                        : 'bg-white text-gray-600 border-gray-300'
                    } ${!isEditing ? 'opacity-60' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'repair':
        return (
          <div className="space-y-4">
            {/* 금형수정비 & 완료일자 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign size={14} className="inline mr-1" />금형수정비
                </label>
                <input
                  type="number"
                  value={formData.repair_cost}
                  onChange={(e) => handleChange('repair_cost', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="금액 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />완료일자
                </label>
                <input
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => handleChange('completion_date', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* 임시대책/조치사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">임시대책/조치사항</label>
              <textarea
                value={formData.temporary_action}
                onChange={(e) => handleChange('temporary_action', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="임시 조치 내용을 입력하세요"
              />
            </div>

            {/* 근본대책 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">근본대책</label>
              <textarea
                value={formData.root_cause_action}
                onChange={(e) => handleChange('root_cause_action', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="근본 대책을 입력하세요"
              />
            </div>

            {/* 금형입고 & 재고확보일정 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Truck size={14} className="inline mr-1" />금형입고
                </label>
                <input
                  type="date"
                  value={formData.mold_arrival_date}
                  onChange={(e) => handleChange('mold_arrival_date', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">재고확보일정</label>
                <input
                  type="date"
                  value={formData.stock_schedule_date}
                  onChange={(e) => handleChange('stock_schedule_date', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* 재고확보수량 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">재고확보수량</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleChange('stock_quantity', e.target.value)}
                  disabled={!isEditing}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="수량 입력"
                />
                <select
                  value={formData.stock_unit}
                  onChange={(e) => handleChange('stock_unit', e.target.value)}
                  disabled={!isEditing}
                  className="w-20 border rounded-lg px-2 py-2 text-sm disabled:bg-gray-50"
                >
                  <option value="EA">EA</option>
                  <option value="SET">SET</option>
                </select>
              </div>
            </div>

            {/* 금형수정처 & 금형수정기간 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Wrench size={14} className="inline mr-1" />금형수정처
                </label>
                <input
                  type="text"
                  value={formData.repair_company}
                  onChange={(e) => handleChange('repair_company', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="수정 업체명"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금형수정기간</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.repair_duration}
                    onChange={(e) => handleChange('repair_duration', e.target.value)}
                    disabled={!isEditing}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                    placeholder="기간"
                  />
                  <span className="text-sm text-gray-500">일</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'management':
        return (
          <div className="space-y-4">
            {/* 관리구분 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관리구분</label>
              <div className="flex flex-wrap gap-2">
                {managementTypeOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => isEditing && handleChange('management_type', opt)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      formData.management_type === opt 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white text-gray-600 border-gray-300'
                    } ${!isEditing ? 'opacity-60' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 승인 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">승인 상태 (읽기 전용)</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{formData.sign_off_status}</span>
                <Link2 size={14} className="text-gray-400" />
              </div>
            </div>

            {/* 사인 오프 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사인 오프 상태</label>
              <input
                type="text"
                value={formData.sign_off_status}
                onChange={(e) => handleChange('sign_off_status', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
              />
            </div>

            {/* 대표품번 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표품번</label>
              <input
                type="text"
                value={formData.representative_part_number}
                onChange={(e) => handleChange('representative_part_number', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="예: 86612-P1800"
              />
            </div>

            {/* 발주처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building size={14} className="inline mr-1" />발주처
              </label>
              <input
                type="text"
                value={formData.order_company}
                onChange={(e) => handleChange('order_company', e.target.value)}
                disabled={!isEditing}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                placeholder="예: 소금부(KIA)"
              />
            </div>

            {/* 관련 파일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={14} className="inline mr-1" />관련 파일
              </label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {isEditing && (
                  <button className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                    <Upload size={16} />
                    파일 업로드
                  </button>
                )}
                {formData.related_files?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.related_files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-blue-600 flex-1 truncate">{file.name || file}</span>
                        {isEditing && (
                          <button className="text-red-500">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {id ? '금형수리요청 상세' : '금형수리요청 등록'}
                </h1>
                <p className="text-xs text-gray-500">
                  {moldInfo?.mold_code || formData.part_number || '새 요청'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {id && !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  수정
                </button>
              ) : id && isEditing ? (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
                >
                  취소
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* 섹션 탭 */}
        <div className="flex border-t">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500'
              }`}
            >
              <section.icon size={16} className="inline mr-1" />
              {section.name}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          {renderSection()}
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? '저장 중...' : (id ? '수정 완료' : '등록하기')}
          </button>
        </div>
      )}
    </div>
  );
}
