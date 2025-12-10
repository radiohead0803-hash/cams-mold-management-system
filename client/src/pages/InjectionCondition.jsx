import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Edit3, CheckCircle, AlertCircle, Clock,
  ChevronDown, ChevronUp, Zap, Target, Timer, Gauge, Thermometer,
  Droplets, Settings, ToggleLeft, ToggleRight, Plus, Minus, Package,
  Send, History
} from 'lucide-react';
import { moldSpecificationAPI, injectionConditionAPI, weightAPI, materialAPI } from '../lib/api';
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
    valve_gate_data: [],
    // 칠러온도
    chiller_temp_main: '', chiller_temp_moving: '', chiller_temp_fixed: '',
    // 기타
    cycle_time: '', remarks: '',
    // 원재료
    material_spec: '', material_grade: '', material_supplier: '',
    material_shrinkage: '', mold_shrinkage: ''
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
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConditionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (submitType = 'draft') => {
    try {
      setSaving(true);
      
      // 중량 데이터 별도 저장
      if (conditionData.design_weight && isDeveloper) {
        await weightAPI.update(moldId, { weight_type: 'design', weight_value: conditionData.design_weight, weight_unit: conditionData.design_weight_unit || 'g', change_reason: changeReason });
      }
      if (conditionData.actual_weight && !isDeveloper) {
        await weightAPI.update(moldId, { weight_type: 'actual', weight_value: conditionData.actual_weight, weight_unit: conditionData.actual_weight_unit || 'g', change_reason: changeReason });
      }
      
      // 원재료 정보 별도 저장
      if (isDeveloper && (conditionData.material_spec || conditionData.material_grade || conditionData.material_supplier || conditionData.material_shrinkage || conditionData.mold_shrinkage)) {
        await materialAPI.update(moldId, {
          material_spec: conditionData.material_spec, material_grade: conditionData.material_grade,
          material_supplier: conditionData.material_supplier, material_shrinkage: conditionData.material_shrinkage,
          mold_shrinkage: conditionData.mold_shrinkage, change_reason: changeReason
        });
      }
      
      const dataToSave = { ...conditionData, mold_spec_id: moldId, change_reason: changeReason, submit_type: submitType };

      if (condition?.id) {
        await injectionConditionAPI.update(condition.id, dataToSave);
        alert('사출조건이 수정되었습니다.');
      } else {
        await injectionConditionAPI.create(dataToSave);
        alert('사출조건이 등록되었습니다.');
      }

      setIsEditing(false);
      setChangeReason('');
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
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
      valve_gate_data: [...(prev.valve_gate_data || []), { seq: newSeq, moving: '', fixed: '' }]
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
      valve_gate_data: type === 'valve_gate' ? (prev.valve_gate_data?.length > 0 ? prev.valve_gate_data : [{ seq: 1, moving: '', fixed: '' }]) : []
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {saving ? '저장 중...' : '제출'}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">MS SPEC</label>
                  <input
                    type="text"
                    value={conditionData.material_spec || moldInfo?.material_spec || ''}
                    onChange={(e) => handleChange('material_spec', e.target.value)}
                    disabled={!isEditing || !isDeveloper}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-purple-500"
                    placeholder="원재료 규격"
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

              {/* 사이클타임 & 비고 */}
              <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-slate-700">밸브게이트 ({conditionData.valve_gate_data?.length || 0}개)</label>
                          {isEditing && (
                            <button onClick={addValveGate} className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-600 rounded text-sm font-medium">
                              <Plus size={16} /> 추가
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(conditionData.valve_gate_data || []).map((gate, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-slate-500 w-8">#{gate.seq}</span>
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <input
                                  type="number"
                                  value={gate.moving || ''}
                                  onChange={(e) => handleValveGateChange(index, 'moving', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full border rounded px-3 py-2 text-sm"
                                  placeholder="가동"
                                />
                                <input
                                  type="number"
                                  value={gate.fixed || ''}
                                  onChange={(e) => handleValveGateChange(index, 'fixed', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full border rounded px-3 py-2 text-sm"
                                  placeholder="고정"
                                />
                              </div>
                              {isEditing && (
                                <button onClick={() => removeValveGate(index)} className="p-1 text-red-500">
                                  <Minus size={18} />
                                </button>
                              )}
                            </div>
                          ))}
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
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50"
              >
                임시저장
              </button>
              <button
                onClick={() => handleSave('submit')}
                disabled={saving}
                className="px-6 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {saving ? '저장 중...' : '제출'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
