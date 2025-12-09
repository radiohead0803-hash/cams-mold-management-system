import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, ChevronDown, ChevronUp,
  Thermometer, Gauge, Settings, Droplets
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

export default function MobileInjectionCondition() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('temperature');
  
  const [conditionData, setConditionData] = useState({
    // 온도 조건
    barrel_temp_1: '',
    barrel_temp_2: '',
    barrel_temp_3: '',
    barrel_temp_4: '',
    nozzle_temp: '',
    mold_temp_cavity: '',
    mold_temp_core: '',
    // 압력 조건
    injection_pressure_1: '',
    injection_pressure_2: '',
    holding_pressure_1: '',
    holding_pressure_2: '',
    back_pressure: '',
    // 속도/시간
    injection_speed_1: '',
    injection_speed_2: '',
    screw_speed: '',
    injection_time: '',
    holding_time: '',
    cooling_time: '',
    cycle_time: '',
    // 계량
    metering_position: '',
    cushion: '',
    suck_back: ''
  });

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
        setMoldInfo(response.data.data);
        if (response.data.data.injection_condition) {
          setConditionData(response.data.data.injection_condition);
        }
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
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
      await api.put(`/mold-specifications/${moldId}/injection-condition`, { conditionData });
      alert('저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
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
      title: '온도 조건',
      icon: Thermometer,
      color: 'from-red-50 to-orange-50',
      iconColor: 'text-red-600',
      fields: [
        { key: 'barrel_temp_1', label: '배럴온도 1', suffix: '°C' },
        { key: 'barrel_temp_2', label: '배럴온도 2', suffix: '°C' },
        { key: 'barrel_temp_3', label: '배럴온도 3', suffix: '°C' },
        { key: 'barrel_temp_4', label: '배럴온도 4', suffix: '°C' },
        { key: 'nozzle_temp', label: '노즐온도', suffix: '°C' },
        { key: 'mold_temp_cavity', label: '금형온도 (캐비티)', suffix: '°C' },
        { key: 'mold_temp_core', label: '금형온도 (코어)', suffix: '°C' }
      ]
    },
    {
      id: 'pressure',
      title: '압력 조건',
      icon: Gauge,
      color: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      fields: [
        { key: 'injection_pressure_1', label: '사출압력 1', suffix: 'bar' },
        { key: 'injection_pressure_2', label: '사출압력 2', suffix: 'bar' },
        { key: 'holding_pressure_1', label: '보압 1', suffix: 'bar' },
        { key: 'holding_pressure_2', label: '보압 2', suffix: 'bar' },
        { key: 'back_pressure', label: '배압', suffix: 'bar' }
      ]
    },
    {
      id: 'speed_time',
      title: '속도/시간',
      icon: Settings,
      color: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      fields: [
        { key: 'injection_speed_1', label: '사출속도 1', suffix: 'mm/s' },
        { key: 'injection_speed_2', label: '사출속도 2', suffix: 'mm/s' },
        { key: 'screw_speed', label: '스크류 회전속도', suffix: 'rpm' },
        { key: 'injection_time', label: '사출시간', suffix: '초' },
        { key: 'holding_time', label: '보압시간', suffix: '초' },
        { key: 'cooling_time', label: '냉각시간', suffix: '초' },
        { key: 'cycle_time', label: '사이클타임', suffix: '초' }
      ]
    },
    {
      id: 'metering',
      title: '계량',
      icon: Droplets,
      color: 'from-purple-50 to-pink-50',
      iconColor: 'text-purple-600',
      fields: [
        { key: 'metering_position', label: '계량위치', suffix: 'mm' },
        { key: 'cushion', label: '쿠션', suffix: 'mm' },
        { key: 'suck_back', label: '석백', suffix: 'mm' }
      ]
    }
  ];

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
                <h1 className="text-lg font-bold text-gray-900">사출조건 관리</h1>
                <p className="text-xs text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                isEditing ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isEditing ? '편집중' : '편집'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
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
                          value={conditionData[field.key]}
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
              className="flex-1 py-3 bg-rose-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
