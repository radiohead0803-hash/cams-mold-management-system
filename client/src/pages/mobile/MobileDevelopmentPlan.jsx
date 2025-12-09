import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle, Clock, AlertCircle, 
  ChevronDown, ChevronUp, Edit2, Calendar, Factory,
  FileText, Gauge, Box, Send
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

// 12단계 공정 정의
const DEVELOPMENT_STAGES = [
  { id: 'drawing_receipt', name: '도면접수', order: 1 },
  { id: 'mold_base_order', name: '몰드베이스 발주', order: 2 },
  { id: 'mold_design', name: '금형설계', order: 3 },
  { id: 'drawing_review', name: '도면검토회', order: 4 },
  { id: 'upper_machining', name: '상형가공', order: 5 },
  { id: 'lower_machining', name: '하형가공', order: 6 },
  { id: 'core_machining', name: '코어가공', order: 7 },
  { id: 'discharge', name: '방전', order: 8 },
  { id: 'surface_finish', name: '격면사상', order: 9 },
  { id: 'mold_assembly', name: '금형조립', order: 10 },
  { id: 'tryout', name: '습합', order: 11 },
  { id: 'initial_to', name: '초도 T/O', order: 12 }
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기', color: 'bg-gray-100 text-gray-700', icon: Clock },
  { value: 'in_progress', label: '진행중', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'completed', label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'delayed', label: '지연', color: 'bg-red-100 text-red-700', icon: AlertCircle }
];

export default function MobileDevelopmentPlan() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('spec');
  const [expandedStage, setExpandedStage] = useState(null);
  
  // 제작사양
  const [specData, setSpecData] = useState({
    car_model: '',
    maker_name: '',
    to_date: '',
    production_days: 0,
    shrinkage_rate: '',
    start_check: false,
    mass_production_check: false,
    cavity_material: '',
    core_material: '',
    part_weight: ''
  });
  
  // 추진계획 (12단계)
  const [planData, setPlanData] = useState(
    DEVELOPMENT_STAGES.map(stage => ({
      stage_id: stage.id,
      stage_name: stage.name,
      start_date: '',
      end_date: '',
      status: 'pending',
      remarks: '',
      days_diff: 0
    }))
  );
  
  const [approvalStatus, setApprovalStatus] = useState('draft');

  useEffect(() => {
    if (moldId) {
      loadMoldData();
    }
  }, [moldId]);

  const loadMoldData = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        const data = response.data.data;
        setMoldInfo(data);
        
        setSpecData({
          car_model: data.car_model || '',
          maker_name: data.makerCompany?.company_name || '',
          to_date: data.target_delivery_date || '',
          production_days: calculateDays(data.order_date, data.target_delivery_date),
          shrinkage_rate: data.shrinkage_rate || '',
          start_check: data.mold_spec_type === '시작금형',
          mass_production_check: data.mold_spec_type === '양산금형',
          cavity_material: data.material || '',
          core_material: data.core_material || '',
          part_weight: data.part_weight || ''
        });
        
        if (data.development_plan) {
          setPlanData(data.development_plan);
        }
        
        setApprovalStatus(data.plan_approval_status || 'draft');
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysDiff = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  const handleSpecChange = (field, value) => {
    setSpecData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (index, field, value) => {
    setPlanData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'end_date') {
        updated[index].days_diff = calculateDaysDiff(value);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/dev/plans/${moldId}`, { specData, planData });
      alert('저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSaving(true);
      await api.post(`/dev/plans/${moldId}/submit-approval`);
      setApprovalStatus('pending');
      alert('승인 요청이 제출되었습니다.');
    } catch (error) {
      console.error('Submit failed:', error);
      alert('승인 요청에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        <Icon size={12} />
        {option.label}
      </span>
    );
  };

  const getProgressPercentage = () => {
    const completed = planData.filter(p => p.status === 'completed').length;
    return Math.round((completed / planData.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">개발계획</h1>
                <p className="text-xs text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {approvalStatus === 'pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  승인대기
                </span>
              )}
              {approvalStatus === 'approved' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  승인완료
                </span>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-full ${isEditing ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
              >
                <Edit2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>전체 진행률</span>
            <span className="font-bold text-purple-600">{getProgressPercentage()}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 제작사양 섹션 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'spec' ? null : 'spec')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <span className="font-semibold text-gray-800">제작사양</span>
            </div>
            {expandedSection === 'spec' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSection === 'spec' && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">차종</label>
                  <input
                    type="text"
                    value={specData.car_model}
                    onChange={(e) => handleSpecChange('car_model', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">제작처</label>
                  <input
                    type="text"
                    value={specData.maker_name}
                    onChange={(e) => handleSpecChange('maker_name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">T/O일정</label>
                  <input
                    type="date"
                    value={specData.to_date}
                    onChange={(e) => handleSpecChange('to_date', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">제작일정</label>
                  <div className="border rounded-lg px-3 py-2 text-sm bg-yellow-50 text-center font-bold">
                    D+{specData.production_days || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">수축률</label>
                  <input
                    type="text"
                    value={specData.shrinkage_rate}
                    onChange={(e) => handleSpecChange('shrinkage_rate', e.target.value)}
                    disabled={!isEditing}
                    placeholder="6/1000"
                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">금형 유형</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={specData.start_check}
                        onChange={(e) => handleSpecChange('start_check', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded"
                      />
                      시작
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={specData.mass_production_check}
                        onChange={(e) => handleSpecChange('mass_production_check', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded"
                      />
                      양산
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">상형 (캐비티) 재질</label>
                    <select
                      value={specData.cavity_material}
                      onChange={(e) => handleSpecChange('cavity_material', e.target.value)}
                      disabled={!isEditing}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                    >
                      <option value="">선택</option>
                      <option value="NAK80">NAK80</option>
                      <option value="S45C">S45C</option>
                      <option value="SKD61">SKD61</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">하형 (코어) 재질</label>
                    <select
                      value={specData.core_material}
                      onChange={(e) => handleSpecChange('core_material', e.target.value)}
                      disabled={!isEditing}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                    >
                      <option value="">선택</option>
                      <option value="NAK80">NAK80</option>
                      <option value="S45C">S45C</option>
                      <option value="SKD61">SKD61</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">부품중량 (g)</label>
                    <input
                      type="text"
                      value={specData.part_weight}
                      onChange={(e) => handleSpecChange('part_weight', e.target.value)}
                      disabled={!isEditing}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 추진일정 섹션 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'plan' ? null : 'plan')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50"
          >
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              <span className="font-semibold text-gray-800">추진일정 (12단계)</span>
            </div>
            {expandedSection === 'plan' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {expandedSection === 'plan' && (
            <div className="divide-y">
              {planData.map((stage, index) => (
                <div key={stage.stage_id} className="p-3">
                  <button
                    onClick={() => setExpandedStage(expandedStage === index ? null : index)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                        stage.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        stage.status === 'delayed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm text-gray-800">{stage.stage_name}</div>
                        {stage.end_date && (
                          <div className="text-xs text-gray-500">
                            {stage.end_date} {stage.days_diff !== 0 && (
                              <span className={stage.days_diff < 0 ? 'text-red-500' : 'text-green-500'}>
                                ({stage.days_diff > 0 ? '+' : ''}{stage.days_diff}일)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(stage.status)}
                      {expandedStage === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expandedStage === index && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">시작일</label>
                          <input
                            type="date"
                            value={stage.start_date}
                            onChange={(e) => handlePlanChange(index, 'start_date', e.target.value)}
                            disabled={!isEditing}
                            className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">종료일</label>
                          <input
                            type="date"
                            value={stage.end_date}
                            onChange={(e) => handlePlanChange(index, 'end_date', e.target.value)}
                            disabled={!isEditing}
                            className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">상태</label>
                        <select
                          value={stage.status}
                          onChange={(e) => handlePlanChange(index, 'status', e.target.value)}
                          disabled={!isEditing}
                          className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">비고</label>
                        <textarea
                          value={stage.remarks}
                          onChange={(e) => handlePlanChange(index, 'remarks', e.target.value)}
                          disabled={!isEditing}
                          rows={2}
                          className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 금형 정보 요약 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Box size={18} className="text-gray-600" />
            금형 정보
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-xs text-gray-500">형번</div>
              <div className="font-medium">{moldInfo?.part_number || '-'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-xs text-gray-500">품명</div>
              <div className="font-medium truncate">{moldInfo?.part_name || '-'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-xs text-gray-500">원재료</div>
              <div className="font-medium">{moldInfo?.material || '-'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-xs text-gray-500">캐비티</div>
              <div className="font-medium">{moldInfo?.cavity_count || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleSubmitForApproval}
              disabled={saving}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={18} />
              승인요청
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
