import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, ChevronDown, ChevronUp,
  Thermometer, Gauge, Settings, Droplets, Clock, CheckCircle, AlertCircle, Info
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
    // 온도 조건
    nozzle_temp: '',
    cylinder_temp_1: '',
    cylinder_temp_2: '',
    cylinder_temp_3: '',
    cylinder_temp_4: '',
    mold_temp_fixed: '',
    mold_temp_moving: '',
    // 압력 조건
    injection_pressure_1: '',
    injection_pressure_2: '',
    injection_pressure_3: '',
    holding_pressure_1: '',
    holding_pressure_2: '',
    holding_pressure_3: '',
    back_pressure: '',
    // 속도
    injection_speed_1: '',
    injection_speed_2: '',
    injection_speed_3: '',
    screw_rpm: '',
    // 시간
    injection_time: '',
    holding_time: '',
    cooling_time: '',
    cycle_time: '',
    // 계량
    metering_stroke: '',
    cushion: '',
    suck_back: ''
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const sections = [
    {
      id: 'temperature',
      title: '온도 설정',
      icon: Thermometer,
      color: 'from-red-50 to-orange-50',
      iconColor: 'text-red-600',
      fields: [
        { key: 'nozzle_temp', label: '노즐 온도', suffix: '°C' },
        { key: 'cylinder_temp_1', label: '실린더 1존', suffix: '°C' },
        { key: 'cylinder_temp_2', label: '실린더 2존', suffix: '°C' },
        { key: 'cylinder_temp_3', label: '실린더 3존', suffix: '°C' },
        { key: 'cylinder_temp_4', label: '실린더 4존', suffix: '°C' },
        { key: 'mold_temp_fixed', label: '금형 (고정측)', suffix: '°C' },
        { key: 'mold_temp_moving', label: '금형 (가동측)', suffix: '°C' }
      ]
    },
    {
      id: 'pressure',
      title: '압력 설정',
      icon: Gauge,
      color: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      fields: [
        { key: 'injection_pressure_1', label: '사출압력 1단', suffix: 'MPa' },
        { key: 'injection_pressure_2', label: '사출압력 2단', suffix: 'MPa' },
        { key: 'injection_pressure_3', label: '사출압력 3단', suffix: 'MPa' },
        { key: 'holding_pressure_1', label: '보압 1단', suffix: 'MPa' },
        { key: 'holding_pressure_2', label: '보압 2단', suffix: 'MPa' },
        { key: 'holding_pressure_3', label: '보압 3단', suffix: 'MPa' },
        { key: 'back_pressure', label: '배압', suffix: 'MPa' }
      ]
    },
    {
      id: 'speed',
      title: '속도 설정',
      icon: Settings,
      color: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      fields: [
        { key: 'injection_speed_1', label: '사출속도 1단', suffix: '%' },
        { key: 'injection_speed_2', label: '사출속도 2단', suffix: '%' },
        { key: 'injection_speed_3', label: '사출속도 3단', suffix: '%' },
        { key: 'screw_rpm', label: '스크류 회전수', suffix: 'rpm' }
      ]
    },
    {
      id: 'time',
      title: '시간 설정',
      icon: Clock,
      color: 'from-purple-50 to-violet-50',
      iconColor: 'text-purple-600',
      fields: [
        { key: 'injection_time', label: '사출 시간', suffix: 'sec' },
        { key: 'holding_time', label: '보압 시간', suffix: 'sec' },
        { key: 'cooling_time', label: '냉각 시간', suffix: 'sec' },
        { key: 'cycle_time', label: '사이클 타임', suffix: 'sec' }
      ]
    },
    {
      id: 'metering',
      title: '계량 설정',
      icon: Droplets,
      color: 'from-orange-50 to-amber-50',
      iconColor: 'text-orange-600',
      fields: [
        { key: 'metering_stroke', label: '계량값', suffix: 'mm' },
        { key: 'cushion', label: '쿠션', suffix: 'mm' },
        { key: 'suck_back', label: '석백', suffix: 'mm' }
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
            <div className="p-4 grid grid-cols-2 gap-3">
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
          )}
        </div>

        {/* 조건 섹션들 */}
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
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

              {isExpanded && (
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
