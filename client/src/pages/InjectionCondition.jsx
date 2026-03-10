import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Edit3, CheckCircle, AlertCircle, Clock,
  ChevronDown, ChevronUp, Zap, Target, Timer, Gauge, Thermometer,
  Droplets, Settings, ToggleLeft, ToggleRight, Plus, Minus, Package,
  Send, History, Search, User, X
} from 'lucide-react';
import api, { moldSpecificationAPI, injectionConditionAPI, weightAPI, materialAPI, masterDataAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

/**
 * PC 사출조건 관리 페이지 (수리요청 등록 스타일)
 * 프로세스 기준 섹션 구분:
 * 1. 금형/제품 정보 (자동연동)
 * 2. 원재료 정보 (개발담당자 작성)
 * 3. 사출 조건 (Plant 작성)
 * 4. 온도 설정 (Plant 작성)
 */
export default function InjectionConditionNew() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const moldId = searchParams.get('moldId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [condition, setCondition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  
  const [expandedSections, setExpandedSections] = useState({
    product: true,
    material: true,
    injection: false,
    temperature: false
  });
  
  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type);
  
  const [rawMaterials, setRawMaterials] = useState([]);
  
  // 승인자 검색 관련 state
  const [showApproverModal, setShowApproverModal] = useState(false);
  const [approverSearchKeyword, setApproverSearchKeyword] = useState('');
  const [approverSearchResults, setApproverSearchResults] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [draftId, setDraftId] = useState(null);
  
  const [conditionData, setConditionData] = useState({
    // 속도 설정
    speed_1: '', speed_2: '', speed_3: '', speed_4: '', speed_cooling: '',
    // 위치 설정
    position_pv: '', position_1: '', position_2: '', position_3: '',
    // 압력 설정
    pressure_1: '', pressure_2: '', pressure_3: '', pressure_4: '',
    // 시간 설정
    time_injection: '', time_holding: '', time_holding_3: '', time_holding_4: '', time_cooling: '',
    // 계량 속도
    metering_speed_vp: '', metering_speed_1: '', metering_speed_2: '', metering_speed_3: '',
    // 계량 위치
    metering_position_1: '', metering_position_2: '',
    // 계량 압력
    metering_pressure_2: '', metering_pressure_3: '', metering_pressure_4: '',
    // 보압 설정
    holding_pressure_1: '', holding_pressure_2: '', holding_pressure_3: '', holding_pressure_4: '',
    holding_pressure_1h: '', holding_pressure_2h: '', holding_pressure_3h: '',
    // BARREL 온도
    barrel_temp_1: '', barrel_temp_2: '', barrel_temp_3: '', barrel_temp_4: '', barrel_temp_5: '',
    barrel_temp_6: '', barrel_temp_7: '', barrel_temp_8: '', barrel_temp_9: '',
    // 핫런너 설정
    hot_runner_installed: false,
    hot_runner_type: '',
    hr_temp_1: '', hr_temp_2: '', hr_temp_3: '', hr_temp_4: '',
    hr_temp_5: '', hr_temp_6: '', hr_temp_7: '', hr_temp_8: '',
    valve_gate_count: 0,
    valve_gate_used: false,
    valve_gate_data: [],
    // 칠러온도
    chiller_temp_main: '', chiller_temp_moving: '', chiller_temp_fixed: '',
    // 기타
    cycle_time: '', remarks: '',
    // 작성처 구분
    writer_type: '',
    // 원재료
    material_spec: '', material_grade: '', material_supplier: '',
    material_shrinkage: '', mold_shrinkage: '',
    // 중량관리
    design_weight: '', management_weight: ''
  });

  useEffect(() => {
    if (moldId) loadData();
  }, [moldId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const moldResponse = await moldSpecificationAPI.getById(moldId).catch(() => null);
      if (moldResponse?.data?.data) setMoldInfo(moldResponse.data.data);

      const conditionResponse = await injectionConditionAPI.get({ mold_spec_id: moldId }).catch(() => null);
      if (conditionResponse?.data?.data) {
        setCondition(conditionResponse.data.data);
        setConditionData(conditionResponse.data.data);
      }
      
      // 원재료 기초정보 로드
      const rawMaterialsResponse = await masterDataAPI.getRawMaterials({ is_active: true }).catch(() => null);
      if (rawMaterialsResponse?.data?.data) {
        setRawMaterials(rawMaterialsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 원재료 선택 시 관련 정보 자동 입력
  const handleRawMaterialSelect = (materialId) => {
    const selected = rawMaterials.find(m => m.id === parseInt(materialId));
    if (selected) {
      setConditionData(prev => ({
        ...prev,
        material_spec: selected.material_name,
        material_grade: selected.material_grade || '',
        material_supplier: selected.supplier || '',
        material_shrinkage: selected.shrinkage_rate || '',
        mold_shrinkage: selected.mold_shrinkage || '',
        material_density: selected.density || ''
      }));
    }
  };

  const handleChange = (field, value) => {
    setConditionData(prev => ({ ...prev, [field]: value }));
  };

  // 임시저장
  const handleDraftSave = async () => {
    try {
      setSaving(true);
      const dataToSave = { ...conditionData, mold_spec_id: moldId };
      
      // 중량 데이터 별도 저장
      if (conditionData.design_weight && isDeveloper) {
        await weightAPI.update(moldId, { weight_type: 'design', weight_value: conditionData.design_weight, weight_unit: conditionData.design_weight_unit || 'g', change_reason: changeReason }).catch(() => {});
      }
      if (conditionData.actual_weight && !isDeveloper) {
        await weightAPI.update(moldId, { weight_type: 'actual', weight_value: conditionData.actual_weight, weight_unit: conditionData.actual_weight_unit || 'g', change_reason: changeReason }).catch(() => {});
      }
      
      // 원재료 정보 별도 저장
      if (isDeveloper && (conditionData.material_spec || conditionData.material_grade || conditionData.material_supplier)) {
        await materialAPI.update(moldId, {
          material_spec: conditionData.material_spec, material_grade: conditionData.material_grade,
          material_supplier: conditionData.material_supplier, material_shrinkage: conditionData.material_shrinkage,
          mold_shrinkage: conditionData.mold_shrinkage, change_reason: changeReason
        }).catch(() => {});
      }

      const res = await injectionConditionAPI.saveDraft(dataToSave);
      if (res.data?.success) {
        setDraftId(res.data.data.id);
        alert('임시저장이 완료되었습니다.');
      }
    } catch (error) {
      console.error('Draft save failed:', error);
      alert('임시저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 승인요청
  const handleRequestApproval = async () => {
    if (!selectedApprover) {
      setShowApproverModal(true);
      return;
    }

    // 먼저 임시저장
    try {
      setSaving(true);
      const dataToSave = { ...conditionData, mold_spec_id: moldId };
      const draftRes = await injectionConditionAPI.saveDraft(dataToSave);
      const savedId = draftRes.data?.data?.id || draftId || condition?.id;

      if (!savedId) {
        alert('먼저 임시저장을 해주세요.');
        setSaving(false);
        return;
      }

      const res = await injectionConditionAPI.requestApproval({
        id: savedId,
        approver_id: selectedApprover.id,
        mold_spec_id: moldId
      });

      if (res.data?.success) {
        alert(res.data.message);
        setIsEditing(false);
        setChangeReason('');
        setSelectedApprover(null);
        setDraftId(null);
        loadData();
      }
    } catch (error) {
      console.error('Request approval failed:', error);
      alert('승인요청에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 기존 제출 (수정 시)
  const handleSave = async (submitType = 'draft') => {
    if (submitType === 'draft') {
      return handleDraftSave();
    }
    // submit → 승인요청 플로
    if (!selectedApprover) {
      setShowApproverModal(true);
      return;
    }
    return handleRequestApproval();
  };

  // 승인자 검색
  const handleSearchApprover = async () => {
    if (!approverSearchKeyword.trim()) return;
    try {
      const res = await api.get('/workflow/approvers/search', {
        params: { name: approverSearchKeyword }
      });
      if (res.data.success) {
        setApproverSearchResults(res.data.data);
      }
    } catch (err) {
      console.error('승인자 검색 실패:', err);
    }
  };

  // 승인자 선택
  const handleSelectApprover = (approver) => {
    setSelectedApprover(approver);
    setShowApproverModal(false);
    setApproverSearchKeyword('');
    setApproverSearchResults([]);
  };

  const handleApprove = async (action) => {
    const rejectionReason = action === 'reject' ? prompt('반려 사유를 입력하세요:') : null;
    if (action === 'reject' && !rejectionReason) return;

    try {
      setSaving(true);
      await injectionConditionAPI.approve(condition.id, { action, rejection_reason: rejectionReason });
      alert(action === 'approve' ? '승인되었습니다.' : '반려되었습니다.');
      loadData();
    } catch (error) {
      alert('처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 핫런너 토글
  const toggleHotRunner = () => {
    if (!isEditing) return;
    setConditionData(prev => ({
      ...prev, hot_runner_installed: !prev.hot_runner_installed,
      hot_runner_type: !prev.hot_runner_installed ? 'open' : '',
      valve_gate_count: 0, valve_gate_data: []
    }));
  };

  // 밸브게이트 추가/삭제
  const addValveGate = () => {
    if (!isEditing) return;
    const newSeq = (conditionData.valve_gate_data?.length || 0) + 1;
    setConditionData(prev => ({
      ...prev, valve_gate_count: newSeq,
      valve_gate_data: [...(prev.valve_gate_data || []), { seq: newSeq, sequence: `V${newSeq}`, moving: '', fixed: '', cycle_time: '', used: true }]
    }));
  };

  const removeValveGate = (index) => {
    if (!isEditing) return;
    setConditionData(prev => {
      const newData = prev.valve_gate_data.filter((_, i) => i !== index).map((item, i) => ({ ...item, seq: i + 1 }));
      return { ...prev, valve_gate_count: newData.length, valve_gate_data: newData };
    });
  };

  const handleValveGateChange = (index, field, value) => {
    if (!isEditing) return;
    setConditionData(prev => {
      const newData = [...prev.valve_gate_data];
      newData[index] = { ...newData[index], [field]: value };
      return { ...prev, valve_gate_data: newData };
    });
  };

  const handleHotRunnerTypeChange = (type) => {
    if (!isEditing) return;
    setConditionData(prev => ({
      ...prev, hot_runner_type: type,
      valve_gate_count: type === 'valve_gate' ? (prev.valve_gate_count || 1) : 0,
      valve_gate_used: type === 'valve_gate',
      valve_gate_data: type === 'valve_gate' ? (prev.valve_gate_data?.length > 0 ? prev.valve_gate_data : [{ seq: 1, sequence: 'V1', moving: '', fixed: '', cycle_time: '', used: true }]) : []
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
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
              <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <Thermometer className="w-6 h-6 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {condition ? '사출조건 수정' : '사출조건 등록'}
                </h1>
                <p className="text-sm text-slate-500">
                  {moldInfo ? `${moldInfo.part_number || moldInfo.mold_code} - ${moldInfo.part_name || moldInfo.mold_name}` : '사출조건 관리'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDraftSave}
                    disabled={saving}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    임시저장
                  </button>
                  <button
                    onClick={handleRequestApproval}
                    disabled={saving || !selectedApprover}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {saving ? '처리 중...' : '승인요청'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  {condition ? '수정' : '작성'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* 상태 표시 */}
        {condition && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            condition.status === 'approved' ? 'bg-green-50 border border-green-200' : 
            condition.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' : 
            condition.status === 'rejected' ? 'bg-red-50 border border-red-200' : 
            'bg-slate-50 border border-slate-200'
          }`}>
            {condition.status === 'approved' && <CheckCircle size={20} className="text-green-600" />}
            {condition.status === 'pending' && <Clock size={20} className="text-yellow-600" />}
            {condition.status === 'rejected' && <AlertCircle size={20} className="text-red-600" />}
            {condition.status === 'draft' && <Edit3 size={20} className="text-slate-600" />}
            <div>
              <span className="font-medium">
                {condition.status === 'approved' ? '승인됨' : 
                 condition.status === 'pending' ? '승인 대기 중' : 
                 condition.status === 'rejected' ? '반려됨' : '임시저장'}
              </span>
              {condition.status === 'rejected' && condition.rejection_reason && (
                <p className="text-sm text-red-600 mt-1">반려 사유: {condition.rejection_reason}</p>
              )}
            </div>
          </div>
        )}

        {/* ===== 1. 금형/제품 정보 (자동연동) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('product')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800">1. 금형/제품 정보</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">자동연동</span>
            </div>
            {expandedSections.product ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.product && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">금형코드</label>
                  <input type="text" value={moldInfo?.mold_code || ''} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">금형명</label>
                  <input type="text" value={moldInfo?.mold_name || ''} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">품명</label>
                  <input type="text" value={moldInfo?.part_name || ''} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">품번</label>
                  <input type="text" value={moldInfo?.part_number || ''} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">차종</label>
                  <input type="text" value={moldInfo?.car_model || ''} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">재질</label>
                  <input type="text" value={moldInfo?.material || ''} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 text-slate-600" readOnly />
                </div>
              </div>
              
              {/* 작성처 구분 */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">작성처 구분 *</label>
                <div className="flex gap-3">
                  {[
                    { value: 'maker', label: '제작처', color: 'orange' },
                    { value: 'plant', label: '생산처', color: 'green' },
                    { value: 'mold_developer', label: '개발담당', color: 'blue' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => isEditing && setConditionData(prev => ({ ...prev, writer_type: opt.value }))}
                      disabled={!isEditing}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition font-medium text-sm ${
                        conditionData.writer_type === opt.value
                          ? opt.color === 'orange' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                            opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' :
                            'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      } ${!isEditing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {condition?.writer_type && !isEditing && (
                  <p className="mt-2 text-sm text-slate-500">
                    현재 작성처: <span className="font-medium">
                      {condition.writer_type === 'maker' ? '제작처' : 
                       condition.writer_type === 'plant' ? '생산처' : '개발담당'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== 2. 원재료 정보 (개발담당자 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('material')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-slate-800">2. 원재료 정보</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">개발담당자 작성</span>
            </div>
            {expandedSections.material ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.material && (
            <div className="p-6 space-y-4">
              {/* 원재료 선택 드롭다운 */}
              {isEditing && isDeveloper && rawMaterials.length > 0 && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-purple-700 mb-2">📦 기초정보에서 원재료 선택</label>
                  <select
                    onChange={(e) => handleRawMaterialSelect(e.target.value)}
                    className="w-full border border-purple-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- 원재료를 선택하면 자동으로 정보가 입력됩니다 --</option>
                    {rawMaterials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.material_name} - {m.material_grade} ({m.supplier}) | 수축률: {m.shrinkage_rate}% | 비중: {m.density}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">MS SPEC (원재료)</label>
                  <input
                    type="text"
                    value={conditionData.material_spec || moldInfo?.material_spec || ''}
                    onChange={(e) => handleChange('material_spec', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="원재료명 (예: ABS, PP, PC)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">그레이드</label>
                  <input
                    type="text"
                    value={conditionData.material_grade || moldInfo?.material_grade || ''}
                    onChange={(e) => handleChange('material_grade', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="그레이드"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">원재료 업체</label>
                  <input
                    type="text"
                    value={conditionData.material_supplier || moldInfo?.material_supplier || ''}
                    onChange={(e) => handleChange('material_supplier', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="원재료 공급업체"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">원재료 수축율 (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={conditionData.material_shrinkage || moldInfo?.material_shrinkage || ''}
                    onChange={(e) => handleChange('material_shrinkage', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">금형 수축율 (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={conditionData.mold_shrinkage || moldInfo?.mold_shrinkage || ''}
                    onChange={(e) => handleChange('mold_shrinkage', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">비중 (g/cm³)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={conditionData.material_density || moldInfo?.material_density || ''}
                    onChange={(e) => handleChange('material_density', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 3. 사출 조건 (Plant 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('injection')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-slate-800">3. 사출 조건</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Plant 작성</span>
            </div>
            {expandedSections.injection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.injection && (
            <div className="p-6 space-y-6">
              {/* 속도 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-blue-500" />
                  속도 설정
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {['1차', '2차', '3차', '4차', '냉'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`speed_${i < 4 ? i + 1 : 'cooling'}`] || ''}
                        onChange={(e) => handleChange(`speed_${i < 4 ? i + 1 : 'cooling'}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 위치 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Target size={16} className="text-green-500" />
                  위치 설정
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {[{ key: 'position_pv', label: 'PV' }, { key: 'position_1', label: '#' }, { key: 'position_2', label: '43' }, { key: 'position_3', label: '21' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 압력 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Gauge size={16} className="text-purple-500" />
                  압력 설정
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {['1차', '2차', '3차', '4차'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`pressure_${i + 1}`] || ''}
                        onChange={(e) => handleChange(`pressure_${i + 1}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 시간 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Timer size={16} className="text-cyan-500" />
                  시간 설정 (sec)
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {[{ key: 'time_injection', label: '사출' }, { key: 'time_holding', label: '보압' }, { key: 'time_holding_3', label: '보3' }, { key: 'time_holding_4', label: '보4' }, { key: 'time_cooling', label: '냉각' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 계량 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Settings size={16} className="text-amber-500" />
                  계량 설정
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[{ key: 'metering_speed_vp', label: 'VP' }, { key: 'metering_speed_1', label: '계1' }, { key: 'metering_speed_2', label: '계2' }, { key: 'metering_speed_3', label: '계3' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">속도 {item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[{ key: 'metering_position_1', label: '위치1' }, { key: 'metering_position_2', label: '위치2' }, { key: 'metering_pressure_2', label: '압력2' }, { key: 'metering_pressure_3', label: '압력3' }, { key: 'metering_pressure_4', label: '압력4' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 보압 설정 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Gauge size={16} className="text-rose-500" />
                  보압 설정
                </h4>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {['1차', '2차', '3차', '4차'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`holding_pressure_${i + 1}`] || ''}
                        onChange={(e) => handleChange(`holding_pressure_${i + 1}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['1H', '2H', '3H'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`holding_pressure_${label.toLowerCase()}`] || ''}
                        onChange={(e) => handleChange(`holding_pressure_${label.toLowerCase()}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 사이클타임 & 중량관리 */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">사이클타임 (sec)</label>
                  <input
                    type="number"
                    value={conditionData.cycle_time || ''}
                    onChange={(e) => handleChange('cycle_time', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">설계중량 (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={conditionData.design_weight || moldInfo?.design_weight || ''}
                    onChange={(e) => handleChange('design_weight', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    placeholder="기본정보 연동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">관리중량 (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={conditionData.management_weight || ''}
                    onChange={(e) => handleChange('management_weight', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                    placeholder="관리중량 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">비고</label>
                  <input
                    type="text"
                    value={conditionData.remarks || ''}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 focus:ring-2 focus:ring-red-500"
                    placeholder="비고 사항"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 4. 온도 설정 (Plant 작성) ===== */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('temperature')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-slate-800">4. 온도 설정</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Plant 작성</span>
            </div>
            {expandedSections.temperature ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.temperature && (
            <div className="p-6 space-y-6">
              {/* BARREL 온도 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Thermometer size={16} className="text-orange-500" />
                  BARREL 온도 (°C)
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{num}</label>
                      <input
                        type="number"
                        value={conditionData[`barrel_temp_${num}`] || ''}
                        onChange={(e) => handleChange(`barrel_temp_${num}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 칠러온도 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Droplets size={16} className="text-sky-500" />
                  칠러온도 (°C)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[{ key: 'chiller_temp_main', label: '메인' }, { key: 'chiller_temp_moving', label: '가동' }, { key: 'chiller_temp_fixed', label: '고정' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-slate-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center disabled:bg-slate-50 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 핫런너 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Thermometer size={16} className="text-violet-500" />
                    핫런너 설정
                  </h4>
                  <button
                    onClick={toggleHotRunner}
                    disabled={!isEditing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      conditionData.hot_runner_installed ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-600'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {conditionData.hot_runner_installed ? <><ToggleRight size={18} /> 설치</> : <><ToggleLeft size={18} /> 미설치</>}
                  </button>
                </div>

                {conditionData.hot_runner_installed && (
                  <div className="space-y-4 p-4 bg-violet-50 rounded-lg">
                    {/* 핫런너 타입 */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">핫런너 타입</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleHotRunnerTypeChange('open')}
                          disabled={!isEditing}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                            conditionData.hot_runner_type === 'open' ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          오픈 타입
                        </button>
                        <button
                          onClick={() => handleHotRunnerTypeChange('valve_gate')}
                          disabled={!isEditing}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                            conditionData.hot_runner_type === 'valve_gate' ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          밸브게이트
                        </button>
                      </div>
                    </div>

                    {/* H/R 온도 */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">H/R 온도 (°C)</label>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <div key={num}>
                            <label className="block text-xs text-slate-500 mb-1 text-center">{num}</label>
                            <input
                              type="number"
                              value={conditionData[`hr_temp_${num}`] || ''}
                              onChange={(e) => handleChange(`hr_temp_${num}`, e.target.value)}
                              disabled={!isEditing}
                              className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-slate-50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 밸브게이트 */}
                    {conditionData.hot_runner_type === 'valve_gate' && (
                      <div className="space-y-4">
                        {/* 밸브게이트 수량 및 사용유무 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">밸브 수량</label>
                            <input
                              type="number"
                              value={conditionData.valve_gate_count || 0}
                              onChange={(e) => handleChange('valve_gate_count', parseInt(e.target.value) || 0)}
                              disabled={!isEditing}
                              min="0"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
                              placeholder="밸브 수량"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">사용 유무</label>
                            <button
                              onClick={() => handleChange('valve_gate_used', !conditionData.valve_gate_used)}
                              disabled={!isEditing}
                              className={`w-full py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                                conditionData.valve_gate_used 
                                  ? 'bg-green-500 text-white border-green-500' 
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {conditionData.valve_gate_used ? '사용' : '미사용'}
                            </button>
                          </div>
                        </div>

                        {/* 밸브게이트 시퀀스 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">밸브게이트 시퀀스 ({conditionData.valve_gate_data?.length || 0}개)</label>
                            {isEditing && (
                              <button onClick={addValveGate} className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-600 rounded text-sm font-medium">
                                <Plus size={16} /> 추가
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="grid grid-cols-14 gap-2 text-xs text-slate-500 font-medium px-3">
                              <div className="col-span-1">순번</div>
                              <div className="col-span-2">시퀀스</div>
                              <div className="col-span-2">가동측(°C)</div>
                              <div className="col-span-2">고정측(°C)</div>
                              <div className="col-span-3">사이클타임(sec)</div>
                              <div className="col-span-2">사용</div>
                              <div className="col-span-2"></div>
                            </div>
                            {(conditionData.valve_gate_data || []).map((gate, index) => (
                              <div key={index} className="grid grid-cols-14 gap-2 items-center p-3 bg-white rounded-lg">
                                <span className="col-span-1 text-sm font-medium text-slate-500">#{gate.seq}</span>
                                <input
                                  type="text"
                                  value={gate.sequence || ''}
                                  onChange={(e) => handleValveGateChange(index, 'sequence', e.target.value)}
                                  disabled={!isEditing}
                                  className="col-span-2 border rounded px-2 py-2 text-sm text-center"
                                  placeholder="SEQ"
                                />
                                <input
                                  type="number"
                                  value={gate.moving || ''}
                                  onChange={(e) => handleValveGateChange(index, 'moving', e.target.value)}
                                  disabled={!isEditing}
                                  className="col-span-2 border rounded px-2 py-2 text-sm text-center"
                                  placeholder="가동"
                                />
                                <input
                                  type="number"
                                  value={gate.fixed || ''}
                                  onChange={(e) => handleValveGateChange(index, 'fixed', e.target.value)}
                                  disabled={!isEditing}
                                  className="col-span-2 border rounded px-2 py-2 text-sm text-center"
                                  placeholder="고정"
                                />
                                <input
                                  type="number"
                                  step="0.1"
                                  value={gate.cycle_time || ''}
                                  onChange={(e) => handleValveGateChange(index, 'cycle_time', e.target.value)}
                                  disabled={!isEditing}
                                  className="col-span-3 border rounded px-2 py-2 text-sm text-center"
                                  placeholder="사이클타임"
                                />
                                <button
                                  onClick={() => handleValveGateChange(index, 'used', !gate.used)}
                                  disabled={!isEditing}
                                  className={`col-span-2 py-2 rounded text-xs font-medium ${
                                    gate.used ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {gate.used ? '사용' : '미사용'}
                                </button>
                                {isEditing && (
                                  <button onClick={() => removeValveGate(index)} className="col-span-2 p-1 text-red-500 flex justify-center">
                                    <Minus size={18} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 변경 사유 */}
        {condition?.id && isEditing && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="font-medium text-slate-700 block mb-2">변경 사유</label>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="변경 사유를 입력하세요..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}

        {/* 개발담당자 승인 버튼 */}
        {isDeveloper && condition?.status === 'pending' && !isEditing && (
          <div className="flex gap-4">
            <button
              onClick={() => handleApprove('reject')}
              disabled={saving}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              반려
            </button>
            <button
              onClick={() => handleApprove('approve')}
              disabled={saving}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              승인
            </button>
          </div>
        )}

        {/* 승인자 선택 영역 */}
        {isEditing && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-slate-700 block mb-1">승인자 선택</label>
                <p className="text-xs text-slate-400">승인요청 시 승인자를 선택해주세요</p>
              </div>
              {selectedApprover ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{selectedApprover.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedApprover.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedApprover.user_type === 'system_admin' ? '관리자' : '금형개발'}
                    </span>
                  </div>
                  <button onClick={() => setSelectedApprover(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowApproverModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                >
                  <Search size={16} />
                  승인자 검색
                </button>
              )}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition font-medium"
          >
            취소
          </button>
          {isEditing && (
            <>
              <button
                onClick={handleDraftSave}
                disabled={saving}
                className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                임시저장
              </button>
              <button
                onClick={handleRequestApproval}
                disabled={saving || !selectedApprover}
                className="px-6 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} />
                {saving ? '처리 중...' : '승인요청'}
              </button>
            </>
          )}
        </div>
      </main>

      {/* 승인자 검색 모달 */}
      {showApproverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900">승인자 선택</h3>
              <button onClick={() => { setShowApproverModal(false); setApproverSearchKeyword(''); setApproverSearchResults([]); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="이름 또는 이메일로 검색..."
                  value={approverSearchKeyword}
                  onChange={(e) => setApproverSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchApprover()}
                />
                <button onClick={() => handleSearchApprover()} className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  <Search size={16} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {approverSearchResults.length === 0 && approverSearchKeyword && (
                  <p className="text-sm text-slate-500 text-center py-6">검색 결과가 없습니다.</p>
                )}
                {approverSearchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectApprover(user)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {user.name}
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${user.user_type === 'system_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.user_type === 'system_admin' ? '관리자' : '금형개발'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{user.email} {user.company_name && `| ${user.company_name}`}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
