import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Edit2, ChevronDown, ChevronUp,
  Box, Gauge, Thermometer, Settings, Factory, Calendar
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

export default function MobileMoldSpecification() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('basic');
  
  const [specData, setSpecData] = useState({
    // 기본정보
    mold_code: '',
    part_name: '',
    part_number: '',
    car_model: '',
    mold_spec_type: '',
    // 금형정보
    cavity_count: '',
    tonnage: '',
    weight: '',
    mold_size: '',
    material: '',
    core_material: '',
    // 생산정보
    cycle_time: '',
    current_shots: '',
    warranty_shots: '',
    // 제작정보
    maker_company_name: '',
    order_date: '',
    target_delivery_date: '',
    // 기타
    shrinkage_rate: '',
    remarks: ''
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
        const data = response.data.data;
        setMoldInfo(data);
        setSpecData({
          mold_code: data.mold?.mold_code || data.mold_code || '',
          part_name: data.part_name || '',
          part_number: data.part_number || '',
          car_model: data.car_model || '',
          mold_spec_type: data.mold_spec_type || '',
          cavity_count: data.cavity_count || '',
          tonnage: data.tonnage || '',
          weight: data.weight || '',
          mold_size: data.mold_size || '',
          material: data.material || '',
          core_material: data.core_material || '',
          cycle_time: data.cycle_time || '',
          current_shots: data.current_shots || data.mold?.current_shots || '',
          warranty_shots: data.warranty_shots || '',
          maker_company_name: data.makerCompany?.company_name || '',
          order_date: data.order_date || '',
          target_delivery_date: data.target_delivery_date || '',
          shrinkage_rate: data.shrinkage_rate || '',
          remarks: data.remarks || ''
        });
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSpecData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/mold-specifications/${moldId}`, specData);
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const sections = [
    {
      id: 'basic',
      title: '기본정보',
      icon: Box,
      color: 'from-purple-50 to-indigo-50',
      iconColor: 'text-purple-600',
      fields: [
        { key: 'mold_code', label: '금형코드', readOnly: true },
        { key: 'part_name', label: '품명' },
        { key: 'part_number', label: '형번' },
        { key: 'car_model', label: '차종' },
        { key: 'mold_spec_type', label: '금형유형', type: 'select', options: ['시작금형', '양산금형'] }
      ]
    },
    {
      id: 'mold',
      title: '금형정보',
      icon: Settings,
      color: 'from-blue-50 to-cyan-50',
      iconColor: 'text-blue-600',
      fields: [
        { key: 'cavity_count', label: '캐비티 수', type: 'number' },
        { key: 'tonnage', label: '톤수', suffix: 'ton' },
        { key: 'weight', label: '금형중량', suffix: 'kg' },
        { key: 'mold_size', label: '금형사이즈' },
        { key: 'material', label: '캐비티 재질', type: 'select', options: ['NAK80', 'S45C', 'SKD61'] },
        { key: 'core_material', label: '코어 재질', type: 'select', options: ['NAK80', 'S45C', 'SKD61'] },
        { key: 'shrinkage_rate', label: '수축률' }
      ]
    },
    {
      id: 'production',
      title: '생산정보',
      icon: Gauge,
      color: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      fields: [
        { key: 'cycle_time', label: '사이클타임', suffix: '초' },
        { key: 'current_shots', label: '현재 숏수', type: 'number' },
        { key: 'warranty_shots', label: '보증 숏수', type: 'number' }
      ]
    },
    {
      id: 'maker',
      title: '제작정보',
      icon: Factory,
      color: 'from-amber-50 to-orange-50',
      iconColor: 'text-amber-600',
      fields: [
        { key: 'maker_company_name', label: '제작처' },
        { key: 'order_date', label: '발주일', type: 'date' },
        { key: 'target_delivery_date', label: '납품예정일', type: 'date' }
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
                <h1 className="text-lg font-bold text-gray-900">금형사양</h1>
                <p className="text-xs text-gray-500">
                  {specData.mold_code || `M-${moldId}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                isEditing ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
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
                <div className="p-4 space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={specData[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          disabled={!isEditing || field.readOnly}
                          className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                        >
                          <option value="">선택</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={specData[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          disabled={!isEditing || field.readOnly}
                          className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                        />
                      ) : (
                        <div className="relative">
                          <input
                            type={field.type || 'text'}
                            value={specData[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            disabled={!isEditing || field.readOnly}
                            className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                          />
                          {field.suffix && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                              {field.suffix}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 비고 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-xs text-gray-500 mb-1">비고</label>
          <textarea
            value={specData.remarks}
            onChange={(e) => handleChange('remarks', e.target.value)}
            disabled={!isEditing}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 resize-none"
          />
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
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
