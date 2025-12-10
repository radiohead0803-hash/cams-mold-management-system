import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, ChevronDown, ChevronUp,
  Thermometer, Gauge, Settings, Droplets, Clock, CheckCircle, AlertCircle, Info,
  User, Calendar, FileText, Edit3, Plus, Minus, ToggleLeft, ToggleRight
} from 'lucide-react';
import { moldSpecificationAPI, injectionConditionAPI } from '../../lib/api';
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
  const [expandedSection, setExpandedSection] = useState('moldInfo');
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
    hot_runner_type: '',  // 'open' or 'valve_gate'
    // H/R 온도
    hr_temp_1: '', hr_temp_2: '', hr_temp_3: '', hr_temp_4: '',
    hr_temp_5: '', hr_temp_6: '', hr_temp_7: '', hr_temp_8: '',
    // 밸브게이트 (동적)
    valve_gate_count: 0,
    valve_gate_data: [],  // [{seq, moving, fixed}]
    // 칠러온도
    chiller_temp_main: '', chiller_temp_moving: '', chiller_temp_fixed: '',
    // 기타
    cycle_time: '', remarks: ''
  });

  useEffect(() => {
    if (moldId) {
      loadData();
    }
  }, [moldId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 금형 기본정보 조회
      const moldResponse = await moldSpecificationAPI.getById(moldId).catch(() => null);
      if (moldResponse?.data?.data) {
        setMoldInfo(moldResponse.data.data);
      }

      // 사출조건 조회
      const conditionResponse = await injectionConditionAPI.get({ 
        mold_spec_id: moldId 
      }).catch(() => null);
      
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
      
      const dataToSave = {
        ...conditionData,
        mold_spec_id: moldId,
        change_reason: changeReason
      };

      if (condition?.id) {
        await injectionConditionAPI.update(condition.id, dataToSave);
        alert('사출조건이 수정되었습니다. 개발담당자 승인을 기다려주세요.');
      } else {
        await injectionConditionAPI.create(dataToSave);
        alert('사출조건이 등록되었습니다. 개발담당자 승인을 기다려주세요.');
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
    const rejectionReason = action === 'reject' 
      ? prompt('반려 사유를 입력하세요:')
      : null;

    if (action === 'reject' && !rejectionReason) return;

    try {
      setSaving(true);
      await injectionConditionAPI.approve(condition.id, { action, rejection_reason: rejectionReason });
      alert(action === 'approve' ? '승인되었습니다.' : '반려되었습니다.');
      loadData();
    } catch (error) {
      console.error('Approve error:', error);
      alert('처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} /> 승인
        </span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock size={12} /> 대기
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertCircle size={12} /> 반려
        </span>;
      default:
        return null;
    }
  };

  // 핫런너 설치 토글
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

  // 핫런너 타입 변경
  const handleHotRunnerTypeChange = (type) => {
    if (!isEditing) return;
    setConditionData(prev => ({
      ...prev,
      hot_runner_type: type,
      valve_gate_count: type === 'valve_gate' ? (prev.valve_gate_count || 1) : 0,
      valve_gate_data: type === 'valve_gate' ? (prev.valve_gate_data.length > 0 ? prev.valve_gate_data : [{ seq: 1, moving: '', fixed: '' }]) : []
    }));
  };

  // 밸브게이트 추가 (H/R 온도도 함께 추가)
  const addValveGate = () => {
    if (!isEditing) return;
    const newSeq = (conditionData.valve_gate_data?.length || 0) + 1;
    setConditionData(prev => {
      const newData = {
        ...prev,
        valve_gate_count: newSeq,
        valve_gate_data: [...(prev.valve_gate_data || []), { seq: newSeq, moving: '', fixed: '' }]
      };
      // H/R 온도 필드 초기화 (없으면)
      if (!newData[`hr_temp_${newSeq}`]) {
        newData[`hr_temp_${newSeq}`] = '';
      }
      return newData;
    });
  };

  // 밸브게이트 삭제 (H/R 온도도 함께 정리)
  const removeValveGate = (index) => {
    if (!isEditing) return;
    setConditionData(prev => {
      const newData = prev.valve_gate_data.filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, seq: i + 1 }));
      return {
        ...prev,
        valve_gate_count: newData.length,
        valve_gate_data: newData
      };
    });
  };

  // 밸브게이트 값 변경
  const handleValveGateChange = (index, field, value) => {
    if (!isEditing) return;
    setConditionData(prev => {
      const newData = [...prev.valve_gate_data];
      newData[index] = { ...newData[index], [field]: value };
      return { ...prev, valve_gate_data: newData };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const sections = [
    {
      id: 'speed',
      title: '속도',
      icon: Gauge,
      color: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      fields: [
        { key: 'speed_1', label: '1차', suffix: '' },
        { key: 'speed_2', label: '2차', suffix: '' },
        { key: 'speed_3', label: '3차', suffix: '' },
        { key: 'speed_4', label: '4차', suffix: '' },
        { key: 'speed_cooling', label: '냉', suffix: '' }
      ]
    },
    {
      id: 'position',
      title: '위치',
      icon: Settings,
      color: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      fields: [
        { key: 'position_pv', label: 'PV', suffix: '' },
        { key: 'position_1', label: '#', suffix: '' },
        { key: 'position_2', label: '43', suffix: '' },
        { key: 'position_3', label: '21', suffix: '' }
      ]
    },
    {
      id: 'pressure',
      title: '압력',
      icon: Gauge,
      color: 'from-red-50 to-orange-50',
      iconColor: 'text-red-600',
      fields: [
        { key: 'pressure_1', label: '1차', suffix: '' },
        { key: 'pressure_2', label: '2차', suffix: '' },
        { key: 'pressure_3', label: '3차', suffix: '' },
        { key: 'pressure_4', label: '4차', suffix: '' }
      ]
    },
    {
      id: 'time',
      title: '시간',
      icon: Clock,
      color: 'from-purple-50 to-violet-50',
      iconColor: 'text-purple-600',
      fields: [
        { key: 'time_injection', label: '사출', suffix: 'sec' },
        { key: 'time_holding', label: '보압', suffix: 'sec' },
        { key: 'time_holding_3', label: '보3', suffix: 'sec' },
        { key: 'time_holding_4', label: '보4', suffix: 'sec' },
        { key: 'time_cooling', label: '냉각', suffix: 'sec' }
      ]
    },
    {
      id: 'metering_speed',
      title: '계량 속도',
      icon: Gauge,
      color: 'from-cyan-50 to-teal-50',
      iconColor: 'text-cyan-600',
      fields: [
        { key: 'metering_speed_vp', label: 'VP', suffix: '' },
        { key: 'metering_speed_1', label: '계1', suffix: '' },
        { key: 'metering_speed_2', label: '계2', suffix: '' },
        { key: 'metering_speed_3', label: '계3', suffix: '' }
      ]
    },
    {
      id: 'metering_position',
      title: '계량 위치',
      icon: Settings,
      color: 'from-lime-50 to-green-50',
      iconColor: 'text-lime-600',
      fields: [
        { key: 'metering_position_1', label: '1', suffix: '' },
        { key: 'metering_position_2', label: '2', suffix: '' }
      ]
    },
    {
      id: 'metering_pressure',
      title: '계량 압력',
      icon: Gauge,
      color: 'from-amber-50 to-yellow-50',
      iconColor: 'text-amber-600',
      fields: [
        { key: 'metering_pressure_2', label: '계2', suffix: '' },
        { key: 'metering_pressure_3', label: '3', suffix: '' },
        { key: 'metering_pressure_4', label: '4', suffix: '' }
      ]
    },
    {
      id: 'holding_pressure',
      title: '보압',
      icon: Gauge,
      color: 'from-rose-50 to-pink-50',
      iconColor: 'text-rose-600',
      fields: [
        { key: 'holding_pressure_1', label: '1차', suffix: '' },
        { key: 'holding_pressure_2', label: '2차', suffix: '' },
        { key: 'holding_pressure_3', label: '3차', suffix: '' },
        { key: 'holding_pressure_4', label: '4차', suffix: '' },
        { key: 'holding_pressure_1h', label: '1H', suffix: '' },
        { key: 'holding_pressure_2h', label: '2H', suffix: '' },
        { key: 'holding_pressure_3h', label: '3H', suffix: '' }
      ]
    },
    {
      id: 'barrel',
      title: 'BARREL',
      icon: Thermometer,
      color: 'from-orange-50 to-red-50',
      iconColor: 'text-orange-600',
      fields: [
        { key: 'barrel_temp_1', label: '1', suffix: '°C' },
        { key: 'barrel_temp_2', label: '2', suffix: '°C' },
        { key: 'barrel_temp_3', label: '3', suffix: '°C' },
        { key: 'barrel_temp_4', label: '4', suffix: '°C' },
        { key: 'barrel_temp_5', label: '5', suffix: '°C' },
        { key: 'barrel_temp_6', label: '6', suffix: '°C' },
        { key: 'barrel_temp_7', label: '7', suffix: '°C' },
        { key: 'barrel_temp_8', label: '8', suffix: '°C' },
        { key: 'barrel_temp_9', label: '9', suffix: '°C' }
      ]
    },
    {
      id: 'hot_runner',
      title: '핫런너',
      icon: Thermometer,
      color: 'from-violet-50 to-purple-50',
      iconColor: 'text-violet-600',
      isCustom: true  // 커스텀 렌더링 필요
    },
    {
      id: 'chiller',
      title: '칠러온도',
      icon: Droplets,
      color: 'from-sky-50 to-blue-50',
      iconColor: 'text-sky-600',
      fields: [
        { key: 'chiller_temp_main', label: '메인', suffix: '°C' },
        { key: 'chiller_temp_moving', label: '가동', suffix: '°C' },
        { key: 'chiller_temp_fixed', label: '고정', suffix: '°C' }
      ]
    },
    {
      id: 'other',
      title: '기타',
      icon: Settings,
      color: 'from-gray-50 to-slate-50',
      iconColor: 'text-gray-600',
      fields: [
        { key: 'cycle_time', label: '사이클타임', suffix: 'sec' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold">사출조건 관리</h1>
                <p className="text-xs text-rose-100">
                  {moldInfo?.mold_code || `금형 #${moldId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {condition && getStatusBadge(condition.status)}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    isEditing ? 'bg-white text-rose-600' : 'bg-white/20 text-white'
                  }`}
                >
                  {isEditing ? '편집중' : '편집'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 작성/수정/승인 정보 */}
        {condition && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'processInfo' ? null : 'processInfo')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50"
            >
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <span className="font-semibold text-gray-800">작성/수정/승인 정보</span>
              </div>
              {expandedSection === 'processInfo' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSection === 'processInfo' && (
              <div className="p-4 space-y-3">
                {/* 현재 상태 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">현재 상태</span>
                  {getStatusBadge(condition.status)}
                </div>

                {/* 작성 정보 */}
                <div className="border-l-4 border-blue-400 pl-3 py-2">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Edit3 size={14} />
                    <span className="text-sm font-medium">작성</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">작성자: </span>
                      <span className="font-medium">{condition.registered_by_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">작성일: </span>
                      <span className="font-medium">
                        {condition.registered_at 
                          ? new Date(condition.registered_at).toLocaleDateString('ko-KR') 
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 수정 정보 */}
                {condition.updated_at && condition.updated_at !== condition.registered_at && (
                  <div className="border-l-4 border-yellow-400 pl-3 py-2">
                    <div className="flex items-center gap-2 text-yellow-600 mb-1">
                      <Edit3 size={14} />
                      <span className="text-sm font-medium">최종 수정</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">수정자: </span>
                        <span className="font-medium">{condition.updated_by_name || condition.registered_by_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">수정일: </span>
                        <span className="font-medium">
                          {new Date(condition.updated_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    {condition.version > 1 && (
                      <div className="mt-1 text-xs text-gray-500">
                        버전: v{condition.version}
                      </div>
                    )}
                  </div>
                )}

                {/* 승인 정보 */}
                {condition.status === 'approved' && (
                  <div className="border-l-4 border-green-400 pl-3 py-2">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <CheckCircle size={14} />
                      <span className="text-sm font-medium">승인</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">승인자: </span>
                        <span className="font-medium">{condition.approved_by_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">승인일: </span>
                        <span className="font-medium">
                          {condition.approved_at 
                            ? new Date(condition.approved_at).toLocaleDateString('ko-KR') 
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 반려 정보 */}
                {condition.status === 'rejected' && (
                  <div className="border-l-4 border-red-400 pl-3 py-2">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                      <AlertCircle size={14} />
                      <span className="text-sm font-medium">반려</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">반려자: </span>
                        <span className="font-medium">{condition.approved_by_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">반려일: </span>
                        <span className="font-medium">
                          {condition.approved_at 
                            ? new Date(condition.approved_at).toLocaleDateString('ko-KR') 
                            : '-'}
                        </span>
                      </div>
                    </div>
                    {condition.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        <span className="font-medium">반려 사유: </span>
                        {condition.rejection_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* 승인 대기 중 */}
                {condition.status === 'pending' && (
                  <div className="border-l-4 border-yellow-400 pl-3 py-2">
                    <div className="flex items-center gap-2 text-yellow-600 mb-1">
                      <Clock size={14} />
                      <span className="text-sm font-medium">승인 대기 중</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      개발담당자의 승인을 기다리고 있습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 금형 기본정보 (자동 연결) */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'moldInfo' ? null : 'moldInfo')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <Info size={18} className="text-gray-600" />
              <span className="font-semibold text-gray-800">금형 기본정보</span>
            </div>
            {expandedSection === 'moldInfo' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSection === 'moldInfo' && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">금형코드</label>
                  <p className="font-medium text-sm">{moldInfo?.mold_code || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">금형명</label>
                  <p className="font-medium text-sm">{moldInfo?.mold_name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">품명</label>
                  <p className="font-medium text-sm">{moldInfo?.part_name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">재질</label>
                  <p className="font-medium text-sm">{moldInfo?.material || '-'}</p>
                </div>
              </div>
              
              {/* 설계중량 / 실중량 */}
              <div className="border-t pt-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* 설계중량 - 개발담당자만 입력 가능 */}
                  <div>
                    <label className="text-xs text-gray-500">설계중량</label>
                    {isDeveloper && isEditing ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionData.design_weight || moldInfo?.design_weight || ''}
                          onChange={(e) => handleChange('design_weight', e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          placeholder="0.00"
                        />
                        <select
                          value={conditionData.design_weight_unit || moldInfo?.design_weight_unit || 'g'}
                          onChange={(e) => handleChange('design_weight_unit', e.target.value)}
                          className="border rounded px-1 py-1 text-sm"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    ) : (
                      <p className="font-medium text-sm">
                        {moldInfo?.design_weight 
                          ? `${moldInfo.design_weight} ${moldInfo.design_weight_unit || 'g'}`
                          : '-'}
                      </p>
                    )}
                  </div>
                  
                  {/* 실중량 - 제작처/생산처 입력 가능 */}
                  <div>
                    <label className="text-xs text-gray-500">실중량</label>
                    {!isDeveloper && isEditing ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.01"
                          value={conditionData.actual_weight || moldInfo?.actual_weight || ''}
                          onChange={(e) => handleChange('actual_weight', e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          placeholder="0.00"
                        />
                        <select
                          value={conditionData.actual_weight_unit || moldInfo?.actual_weight_unit || 'g'}
                          onChange={(e) => handleChange('actual_weight_unit', e.target.value)}
                          className="border rounded px-1 py-1 text-sm"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    ) : (
                      <p className="font-medium text-sm">
                        {moldInfo?.actual_weight 
                          ? `${moldInfo.actual_weight} ${moldInfo.actual_weight_unit || 'g'}`
                          : '-'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 조건 섹션들 */}
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          // 핫런너 커스텀 섹션
          if (section.isCustom && section.id === 'hot_runner') {
            return (
              <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${section.color}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={section.iconColor} />
                    <span className="font-semibold text-gray-800">{section.title}</span>
                    {conditionData.hot_runner_installed && (
                      <span className="px-2 py-0.5 bg-violet-500 text-white text-xs rounded-full">설치</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* 핫런너 설치 유무 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">핫런너 설치</span>
                      <button
                        onClick={toggleHotRunner}
                        disabled={!isEditing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          conditionData.hot_runner_installed 
                            ? 'bg-violet-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {conditionData.hot_runner_installed ? (
                          <><ToggleRight size={16} /> 설치</>
                        ) : (
                          <><ToggleLeft size={16} /> 미설치</>
                        )}
                      </button>
                    </div>

                    {/* 핫런너 설치 시 상세 설정 */}
                    {conditionData.hot_runner_installed && (
                      <>
                        {/* 핫런너 타입 선택 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">핫런너 타입</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleHotRunnerTypeChange('open')}
                              disabled={!isEditing}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                conditionData.hot_runner_type === 'open'
                                  ? 'bg-violet-500 text-white border-violet-500'
                                  : 'bg-white text-gray-600 border-gray-300'
                              } ${!isEditing ? 'opacity-50' : ''}`}
                            >
                              오픈 타입
                            </button>
                            <button
                              onClick={() => handleHotRunnerTypeChange('valve_gate')}
                              disabled={!isEditing}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                conditionData.hot_runner_type === 'valve_gate'
                                  ? 'bg-violet-500 text-white border-violet-500'
                                  : 'bg-white text-gray-600 border-gray-300'
                              } ${!isEditing ? 'opacity-50' : ''}`}
                            >
                              밸브게이트
                            </button>
                          </div>
                        </div>

                        {/* H/R 온도 - 밸브게이트 수량에 맞게 동적 생성 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            H/R 온도 
                            {conditionData.hot_runner_type === 'valve_gate' && conditionData.valve_gate_data?.length > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({conditionData.valve_gate_data.length}개)
                              </span>
                            )}
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {/* 밸브게이트 타입: 게이트 수량만큼 표시, 오픈 타입: 기본 8개 */}
                            {(conditionData.hot_runner_type === 'valve_gate' 
                              ? Array.from({ length: Math.max(conditionData.valve_gate_data?.length || 1, 1) }, (_, i) => i + 1)
                              : [1,2,3,4,5,6,7,8]
                            ).map(num => (
                              <div key={num}>
                                <label className="block text-xs text-gray-500 mb-1">{num}</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={conditionData[`hr_temp_${num}`] || ''}
                                  onChange={(e) => handleChange(`hr_temp_${num}`, e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full border rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-50"
                                  placeholder="°C"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 밸브게이트 타입 선택 시 */}
                        {conditionData.hot_runner_type === 'valve_gate' && (
                          <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700">
                                밸브게이트 ({conditionData.valve_gate_data?.length || 0}개)
                              </label>
                              {isEditing && (
                                <button
                                  onClick={addValveGate}
                                  className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-600 rounded text-xs font-medium"
                                >
                                  <Plus size={14} /> 추가
                                </button>
                              )}
                            </div>
                            
                            {/* 밸브게이트 목록 */}
                            <div className="space-y-2">
                              {(conditionData.valve_gate_data || []).map((gate, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <span className="text-xs font-medium text-gray-500 w-6">#{gate.seq}</span>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs text-gray-500">가동</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={gate.moving || ''}
                                        onChange={(e) => handleValveGateChange(index, 'moving', e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full border rounded px-2 py-1 text-sm disabled:bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500">고정</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={gate.fixed || ''}
                                        onChange={(e) => handleValveGateChange(index, 'fixed', e.target.value)}
                                        disabled={!isEditing}
                                        className="w-full border rounded px-2 py-1 text-sm disabled:bg-white"
                                      />
                                    </div>
                                  </div>
                                  {isEditing && (
                                    <button
                                      onClick={() => removeValveGate(index)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <Minus size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              
                              {(!conditionData.valve_gate_data || conditionData.valve_gate_data.length === 0) && (
                                <p className="text-sm text-gray-400 text-center py-2">
                                  밸브게이트를 추가하세요
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${section.color}`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className={section.iconColor} />
                  <span className="font-semibold text-gray-800">{section.title}</span>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isExpanded && section.fields && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={conditionData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          disabled={!isEditing}
                          className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          {field.suffix}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 비고 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">비고</label>
          <textarea
            value={conditionData.remarks || ''}
            onChange={(e) => handleChange('remarks', e.target.value)}
            disabled={!isEditing}
            placeholder="비고 사항을 입력하세요..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-50"
          />
        </div>

        {/* 변경 사유 (수정 시) */}
        {condition?.id && isEditing && (
          <div className="bg-white rounded-xl shadow-sm p-4">
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
      </div>

      {/* 하단 고정 버튼 */}
      {isEditing && canEdit && (
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
              className="flex-1 py-3 bg-rose-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={18} />
              {saving ? '저장 중...' : (condition?.id ? '수정 및 승인요청' : '등록 및 승인요청')}
            </button>
          </div>
        </div>
      )}

      {/* 개발담당자 승인 버튼 */}
      {condition?.status === 'pending' && isDeveloper && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={() => handleApprove('reject')}
              disabled={saving}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium disabled:opacity-50"
            >
              반려
            </button>
            <button
              onClick={() => handleApprove('approve')}
              disabled={saving}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50"
            >
              승인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
