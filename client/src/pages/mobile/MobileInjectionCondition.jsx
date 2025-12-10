import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Edit3, CheckCircle, AlertCircle, Clock,
  ChevronRight, RotateCcw, Zap, Target, Timer, Gauge, Thermometer,
  Droplets, Settings, ToggleLeft, ToggleRight, Plus, Minus, History
} from 'lucide-react';
import { moldSpecificationAPI, injectionConditionAPI, weightAPI, materialAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function MobileInjectionCondition() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [condition, setCondition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [changeReason, setChangeReason] = useState('');
  
  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type);
  const canEdit = !isDeveloper || condition?.status === 'draft';
  
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
    cycle_time: '', remarks: ''
  });

  // 카테고리 정의
  const categories = [
    { 
      id: 'speed', 
      name: '속도', 
      icon: Zap, 
      color: 'bg-blue-500',
      fields: ['speed_1', 'speed_2', 'speed_3', 'speed_4', 'speed_cooling']
    },
    { 
      id: 'position', 
      name: '위치', 
      icon: Target, 
      color: 'bg-green-500',
      fields: ['position_pv', 'position_1', 'position_2', 'position_3']
    },
    { 
      id: 'pressure', 
      name: '압력', 
      icon: Gauge, 
      color: 'bg-purple-500',
      fields: ['pressure_1', 'pressure_2', 'pressure_3', 'pressure_4']
    },
    { 
      id: 'time', 
      name: '시간', 
      icon: Timer, 
      color: 'bg-cyan-500',
      fields: ['time_injection', 'time_holding', 'time_holding_3', 'time_holding_4', 'time_cooling']
    },
    { 
      id: 'metering', 
      name: '계량', 
      icon: Settings, 
      color: 'bg-amber-500',
      fields: ['metering_speed_vp', 'metering_speed_1', 'metering_speed_2', 'metering_speed_3', 
               'metering_position_1', 'metering_position_2',
               'metering_pressure_2', 'metering_pressure_3', 'metering_pressure_4']
    },
    { 
      id: 'holding', 
      name: '보압', 
      icon: Gauge, 
      color: 'bg-rose-500',
      fields: ['holding_pressure_1', 'holding_pressure_2', 'holding_pressure_3', 'holding_pressure_4',
               'holding_pressure_1h', 'holding_pressure_2h', 'holding_pressure_3h']
    },
    { 
      id: 'barrel', 
      name: 'BARREL', 
      icon: Thermometer, 
      color: 'bg-orange-500',
      fields: ['barrel_temp_1', 'barrel_temp_2', 'barrel_temp_3', 'barrel_temp_4', 'barrel_temp_5',
               'barrel_temp_6', 'barrel_temp_7', 'barrel_temp_8', 'barrel_temp_9']
    },
    { 
      id: 'hotrunner', 
      name: '핫런너', 
      icon: Thermometer, 
      color: 'bg-violet-500',
      fields: ['hot_runner_installed']
    },
    { 
      id: 'chiller', 
      name: '칠러온도', 
      icon: Droplets, 
      color: 'bg-sky-500',
      fields: ['chiller_temp_main', 'chiller_temp_moving', 'chiller_temp_fixed']
    },
    { 
      id: 'other', 
      name: '기타', 
      icon: Settings, 
      color: 'bg-gray-500',
      fields: ['cycle_time', 'remarks']
    }
  ];

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

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // 중량 데이터 별도 저장
      if (conditionData.design_weight && isDeveloper) {
        await weightAPI.update(moldId, {
          weight_type: 'design',
          weight_value: conditionData.design_weight,
          weight_unit: conditionData.design_weight_unit || 'g',
          change_reason: changeReason
        });
      }
      if (conditionData.actual_weight && !isDeveloper) {
        await weightAPI.update(moldId, {
          weight_type: 'actual',
          weight_value: conditionData.actual_weight,
          weight_unit: conditionData.actual_weight_unit || 'g',
          change_reason: changeReason
        });
      }
      
      // 원재료 정보 별도 저장 (개발담당자만, 이력관리)
      if (isDeveloper && (conditionData.material_spec || conditionData.material_grade || 
          conditionData.material_supplier || conditionData.material_shrinkage || conditionData.mold_shrinkage)) {
        await materialAPI.update(moldId, {
          material_spec: conditionData.material_spec,
          material_grade: conditionData.material_grade,
          material_supplier: conditionData.material_supplier,
          material_shrinkage: conditionData.material_shrinkage,
          mold_shrinkage: conditionData.mold_shrinkage,
          change_reason: changeReason
        });
      }
      
      const dataToSave = { ...conditionData, mold_spec_id: moldId, change_reason: changeReason };

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

  // 카테고리별 입력 완료율 계산
  const getCategoryProgress = (category) => {
    const filledCount = category.fields.filter(f => {
      if (f === 'hot_runner_installed') return true; // 토글은 항상 완료
      return conditionData[f] !== '' && conditionData[f] !== null && conditionData[f] !== undefined;
    }).length;
    return { filled: filledCount, total: category.fields.length };
  };

  // 전체 진행률 계산
  const getTotalProgress = () => {
    let filled = 0, total = 0;
    categories.forEach(cat => {
      const progress = getCategoryProgress(cat);
      filled += progress.filled;
      total += progress.total;
    });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  // 핫런너 토글
  const toggleHotRunner = () => {
    if (!isEditing) return;
    setConditionData(prev => ({
      ...prev,
      hot_runner_installed: !prev.hot_runner_installed,
      hot_runner_type: !prev.hot_runner_installed ? 'open' : '',
      valve_gate_count: 0,
      valve_gate_data: []
    }));
  };

  // 밸브게이트 추가/삭제
  const addValveGate = () => {
    if (!isEditing) return;
    const newSeq = (conditionData.valve_gate_data?.length || 0) + 1;
    setConditionData(prev => ({
      ...prev,
      valve_gate_count: newSeq,
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
      ...prev,
      hot_runner_type: type,
      valve_gate_count: type === 'valve_gate' ? (prev.valve_gate_count || 1) : 0,
      valve_gate_data: type === 'valve_gate' ? (prev.valve_gate_data?.length > 0 ? prev.valve_gate_data : [{ seq: 1, moving: '', fixed: '' }]) : []
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalProgress = getTotalProgress();

  // 카테고리 상세 렌더링
  const renderCategoryDetail = () => {
    if (!activeCategory) return null;
    const cat = categories.find(c => c.id === activeCategory);
    if (!cat) return null;

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
        {/* 상세 헤더 */}
        <div className={`${cat.color} text-white px-4 py-4 sticky top-0`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveCategory(null)} className="p-1">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <cat.icon size={24} />
              <span className="text-lg font-bold">{cat.name}</span>
            </div>
          </div>
        </div>

        <div className="p-4 pb-24">
          {/* 속도 */}
          {cat.id === 'speed' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">속도 설정</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['1차', '2차', '3차', '4차', '냉'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`speed_${i < 4 ? i + 1 : 'cooling'}`] || ''}
                        onChange={(e) => handleChange(`speed_${i < 4 ? i + 1 : 'cooling'}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 위치 */}
          {cat.id === 'position' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">위치 설정</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[{ key: 'position_pv', label: 'PV' }, { key: 'position_1', label: '#' }, { key: 'position_2', label: '43' }, { key: 'position_3', label: '21' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 압력 */}
          {cat.id === 'pressure' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">압력 설정</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['1차', '2차', '3차', '4차'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`pressure_${i + 1}`] || ''}
                        onChange={(e) => handleChange(`pressure_${i + 1}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 시간 */}
          {cat.id === 'time' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">시간 설정</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[{ key: 'time_injection', label: '사출' }, { key: 'time_holding', label: '보압' }, { key: 'time_holding_3', label: '보3' }, { key: 'time_holding_4', label: '보4' }, { key: 'time_cooling', label: '냉각' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{item.label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={conditionData[item.key] || ''}
                          onChange={(e) => handleChange(item.key, e.target.value)}
                          disabled={!isEditing}
                          className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400">sec</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 계량 */}
          {cat.id === 'metering' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">계량 속도</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[{ key: 'metering_speed_vp', label: 'VP' }, { key: 'metering_speed_1', label: '계1' }, { key: 'metering_speed_2', label: '계2' }, { key: 'metering_speed_3', label: '계3' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">계량 위치</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ key: 'metering_position_1', label: '1' }, { key: 'metering_position_2', label: '2' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-gray-500 mb-1">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">계량 압력</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[{ key: 'metering_pressure_2', label: '계2' }, { key: 'metering_pressure_3', label: '3' }, { key: 'metering_pressure_4', label: '4' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{item.label}</label>
                      <input
                        type="number"
                        value={conditionData[item.key] || ''}
                        onChange={(e) => handleChange(item.key, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 보압 */}
          {cat.id === 'holding' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">보압 설정</h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['1차', '2차', '3차', '4차'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`holding_pressure_${i + 1}`] || ''}
                        onChange={(e) => handleChange(`holding_pressure_${i + 1}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['1H', '2H', '3H'].map((label, i) => (
                    <div key={i}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{label}</label>
                      <input
                        type="number"
                        value={conditionData[`holding_pressure_${label.toLowerCase()}`] || ''}
                        onChange={(e) => handleChange(`holding_pressure_${label.toLowerCase()}`, e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BARREL */}
          {cat.id === 'barrel' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">BARREL 온도</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{num}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={conditionData[`barrel_temp_${num}`] || ''}
                          onChange={(e) => handleChange(`barrel_temp_${num}`, e.target.value)}
                          disabled={!isEditing}
                          className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400">°C</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 핫런너 */}
          {cat.id === 'hotrunner' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">핫런너 설치</h3>
                  <button
                    onClick={toggleHotRunner}
                    disabled={!isEditing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      conditionData.hot_runner_installed ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-600'
                    } ${!isEditing ? 'opacity-50' : ''}`}
                  >
                    {conditionData.hot_runner_installed ? <><ToggleRight size={18} /> 설치</> : <><ToggleLeft size={18} /> 미설치</>}
                  </button>
                </div>

                {conditionData.hot_runner_installed && (
                  <>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">핫런너 타입</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleHotRunnerTypeChange('open')}
                          disabled={!isEditing}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                            conditionData.hot_runner_type === 'open' ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          오픈 타입
                        </button>
                        <button
                          onClick={() => handleHotRunnerTypeChange('valve_gate')}
                          disabled={!isEditing}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                            conditionData.hot_runner_type === 'valve_gate' ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          밸브게이트
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">H/R 온도</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(conditionData.hot_runner_type === 'valve_gate' 
                          ? Array.from({ length: Math.max(conditionData.valve_gate_data?.length || 1, 1) }, (_, i) => i + 1)
                          : [1, 2, 3, 4, 5, 6, 7, 8]
                        ).map(num => (
                          <div key={num}>
                            <label className="block text-xs text-gray-500 mb-1 text-center">{num}</label>
                            <input
                              type="number"
                              value={conditionData[`hr_temp_${num}`] || ''}
                              onChange={(e) => handleChange(`hr_temp_${num}`, e.target.value)}
                              disabled={!isEditing}
                              className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                              placeholder="°C"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {conditionData.hot_runner_type === 'valve_gate' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">밸브게이트 ({conditionData.valve_gate_data?.length || 0}개)</label>
                          {isEditing && (
                            <button onClick={addValveGate} className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-600 rounded text-xs font-medium">
                              <Plus size={14} /> 추가
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(conditionData.valve_gate_data || []).map((gate, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <span className="text-xs font-medium text-gray-500 w-6">#{gate.seq}</span>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  value={gate.moving || ''}
                                  onChange={(e) => handleValveGateChange(index, 'moving', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  placeholder="가동"
                                />
                                <input
                                  type="number"
                                  value={gate.fixed || ''}
                                  onChange={(e) => handleValveGateChange(index, 'fixed', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  placeholder="고정"
                                />
                              </div>
                              {isEditing && (
                                <button onClick={() => removeValveGate(index)} className="p-1 text-red-500">
                                  <Minus size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 칠러온도 */}
          {cat.id === 'chiller' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">칠러온도</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[{ key: 'chiller_temp_main', label: '메인' }, { key: 'chiller_temp_moving', label: '가동' }, { key: 'chiller_temp_fixed', label: '고정' }].map((item) => (
                    <div key={item.key}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">{item.label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={conditionData[item.key] || ''}
                          onChange={(e) => handleChange(item.key, e.target.value)}
                          disabled={!isEditing}
                          className="w-full border rounded-lg px-2 py-2 text-center text-sm disabled:bg-gray-50"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400">°C</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 기타 */}
          {cat.id === 'other' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">기타 설정</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">사이클타임</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={conditionData.cycle_time || ''}
                        onChange={(e) => handleChange('cycle_time', e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">sec</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">비고</label>
                    <textarea
                      value={conditionData.remarks || ''}
                      onChange={(e) => handleChange('remarks', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      placeholder="비고 사항을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {isEditing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1">
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">사출조건 관리</h1>
                <p className="text-xs text-gray-500">{moldInfo?.mold_code || `금형 #${moldId}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
                >
                  취소
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                >
                  <Edit3 size={16} />
                  {condition ? '수정' : '작성'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 전체 진행률 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">전체 진행률</span>
            <span className="text-sm font-bold text-blue-600">{totalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {categories.reduce((acc, cat) => acc + getCategoryProgress(cat).filled, 0)} / {categories.reduce((acc, cat) => acc + getCategoryProgress(cat).total, 0)} 항목 완료
          </p>
        </div>

        {/* 상태 표시 */}
        {condition && (
          <div className={`rounded-xl p-4 ${
            condition.status === 'approved' ? 'bg-green-50 border border-green-200' :
            condition.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
            condition.status === 'rejected' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {condition.status === 'approved' && <CheckCircle size={20} className="text-green-600" />}
              {condition.status === 'pending' && <Clock size={20} className="text-yellow-600" />}
              {condition.status === 'rejected' && <AlertCircle size={20} className="text-red-600" />}
              <span className="font-medium">
                {condition.status === 'approved' ? '승인됨' :
                 condition.status === 'pending' ? '승인 대기 중' :
                 condition.status === 'rejected' ? '반려됨' : '임시저장'}
              </span>
            </div>
            {condition.status === 'rejected' && condition.rejection_reason && (
              <p className="text-sm text-red-600 mt-2">반려 사유: {condition.rejection_reason}</p>
            )}
          </div>
        )}

        {/* 금형 기본정보 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">금형 기본정보</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">금형코드</span>
              <p className="font-medium">{moldInfo?.mold_code || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">금형명</span>
              <p className="font-medium">{moldInfo?.mold_name || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">품명</span>
              <p className="font-medium">{moldInfo?.part_name || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">재질</span>
              <p className="font-medium">{moldInfo?.material || '-'}</p>
            </div>
          </div>
          <div className="border-t mt-3 pt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">설계중량</span>
              <p className="font-medium">{moldInfo?.design_weight ? `${moldInfo.design_weight} ${moldInfo.design_weight_unit || 'g'}` : '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">실중량</span>
              <p className="font-medium">{moldInfo?.actual_weight ? `${moldInfo.actual_weight} ${moldInfo.actual_weight_unit || 'g'}` : '-'}</p>
            </div>
          </div>
        </div>

        {/* 원재료 정보 (개발담당자 입력) */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">원재료 정보</h3>
            {isDeveloper && (
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">개발담당자 입력</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">MS SPEC</span>
              {isDeveloper && isEditing ? (
                <input
                  type="text"
                  value={conditionData.material_spec || moldInfo?.material_spec || ''}
                  onChange={(e) => handleChange('material_spec', e.target.value)}
                  className="w-full border rounded px-2 py-1 mt-1 text-sm"
                  placeholder="원재료 규격"
                />
              ) : (
                <p className="font-medium">{moldInfo?.material_spec || '-'}</p>
              )}
            </div>
            <div>
              <span className="text-gray-500">그레이드</span>
              {isDeveloper && isEditing ? (
                <input
                  type="text"
                  value={conditionData.material_grade || moldInfo?.material_grade || ''}
                  onChange={(e) => handleChange('material_grade', e.target.value)}
                  className="w-full border rounded px-2 py-1 mt-1 text-sm"
                  placeholder="그레이드"
                />
              ) : (
                <p className="font-medium">{moldInfo?.material_grade || '-'}</p>
              )}
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">원재료 업체</span>
              {isDeveloper && isEditing ? (
                <input
                  type="text"
                  value={conditionData.material_supplier || moldInfo?.material_supplier || ''}
                  onChange={(e) => handleChange('material_supplier', e.target.value)}
                  className="w-full border rounded px-2 py-1 mt-1 text-sm"
                  placeholder="원재료 공급업체"
                />
              ) : (
                <p className="font-medium">{moldInfo?.material_supplier || '-'}</p>
              )}
            </div>
            <div>
              <span className="text-gray-500">원재료 수축율</span>
              {isDeveloper && isEditing ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.001"
                    value={conditionData.material_shrinkage || moldInfo?.material_shrinkage || ''}
                    onChange={(e) => handleChange('material_shrinkage', e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="0.000"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              ) : (
                <p className="font-medium">{moldInfo?.material_shrinkage ? `${moldInfo.material_shrinkage}%` : '-'}</p>
              )}
            </div>
            <div>
              <span className="text-gray-500">금형 수축율</span>
              {isDeveloper && isEditing ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.001"
                    value={conditionData.mold_shrinkage || moldInfo?.mold_shrinkage || ''}
                    onChange={(e) => handleChange('mold_shrinkage', e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="0.000"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              ) : (
                <p className="font-medium">{moldInfo?.mold_shrinkage ? `${moldInfo.mold_shrinkage}%` : '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* 카테고리별 진행 현황 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">카테고리별 진행 현황</h3>
          <div className="grid grid-cols-5 gap-2">
            {categories.map((cat) => {
              const progress = getCategoryProgress(cat);
              const percent = progress.total > 0 ? Math.round((progress.filled / progress.total) * 100) : 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-1`}>
                    <cat.icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate w-full text-center">{cat.name}</span>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div className={`${cat.color} h-1 rounded-full`} style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{progress.filled}/{progress.total}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 변경 사유 (수정 시) */}
        {condition?.id && isEditing && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="text-sm font-medium text-gray-700 block mb-2">변경 사유</label>
            <textarea
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="변경 사유를 입력하세요..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        )}

        {/* 작성/수정/승인 정보 */}
        {condition && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">작성/승인 정보</h3>
            <div className="space-y-3 text-sm">
              {/* 작성 정보 */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Edit3 size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-800">작성</p>
                  <p className="text-blue-600">{condition.created_by_name || '-'}</p>
                  <p className="text-xs text-blue-500">{condition.created_at ? new Date(condition.created_at).toLocaleString('ko-KR') : '-'}</p>
                </div>
              </div>
              
              {/* 수정 정보 */}
              {condition.updated_at && condition.updated_at !== condition.created_at && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Edit3 size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">최종 수정</p>
                    <p className="text-amber-600">{condition.updated_by_name || '-'}</p>
                    <p className="text-xs text-amber-500">{new Date(condition.updated_at).toLocaleString('ko-KR')}</p>
                    {condition.change_reason && (
                      <p className="text-xs text-amber-600 mt-1">사유: {condition.change_reason}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* 승인/반려 정보 */}
              {(condition.status === 'approved' || condition.status === 'rejected') && (
                <div className={`flex items-start gap-3 p-3 rounded-lg ${condition.status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${condition.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {condition.status === 'approved' ? <CheckCircle size={16} className="text-white" /> : <AlertCircle size={16} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${condition.status === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                      {condition.status === 'approved' ? '승인' : '반려'}
                    </p>
                    <p className={condition.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                      {condition.approved_by_name || '-'}
                    </p>
                    <p className={`text-xs ${condition.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                      {condition.approved_at ? new Date(condition.approved_at).toLocaleString('ko-KR') : '-'}
                    </p>
                    {condition.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">사유: {condition.rejection_reason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 개발담당자 승인 버튼 */}
        {isDeveloper && condition?.status === 'pending' && !isEditing && (
          <div className="flex gap-3">
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
      </div>

      {/* 하단 저장/제출 버튼 */}
      {isEditing && !activeCategory && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? '저장 중...' : (condition ? '수정 완료' : '작성 완료')}
          </button>
        </div>
      )}

      {/* 카테고리 상세 모달 */}
      {renderCategoryDetail()}
    </div>
  );
}
