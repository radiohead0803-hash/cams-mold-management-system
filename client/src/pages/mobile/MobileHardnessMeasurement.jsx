import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp,
  Gauge, Target, Calendar
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

// 경도 기준 정의
const HARDNESS_STANDARDS = {
  'NAK80': { min: 38, max: 42, unit: 'HRC' },
  'S45C': { min: 18, max: 22, unit: 'HRC' },
  'SKD61': { min: 48, max: 52, unit: 'HRC' }
};

export default function MobileHardnessMeasurement() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState('cavity');
  
  const [measurements, setMeasurements] = useState({
    cavity: {
      material: 'NAK80',
      date: '',
      points: [
        { id: 1, location: '중앙', value: '' },
        { id: 2, location: '상단', value: '' },
        { id: 3, location: '하단', value: '' },
        { id: 4, location: '좌측', value: '' },
        { id: 5, location: '우측', value: '' }
      ]
    },
    core: {
      material: 'NAK80',
      date: '',
      points: [
        { id: 1, location: '중앙', value: '' },
        { id: 2, location: '상단', value: '' },
        { id: 3, location: '하단', value: '' },
        { id: 4, location: '좌측', value: '' },
        { id: 5, location: '우측', value: '' }
      ]
    }
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
        if (response.data.data.hardness_data) {
          setMeasurements(response.data.data.hardness_data);
        }
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialChange = (section, material) => {
    setMeasurements(prev => ({
      ...prev,
      [section]: { ...prev[section], material }
    }));
  };

  const handleDateChange = (section, date) => {
    setMeasurements(prev => ({
      ...prev,
      [section]: { ...prev[section], date }
    }));
  };

  const handlePointChange = (section, pointId, value) => {
    setMeasurements(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        points: prev[section].points.map(p => 
          p.id === pointId ? { ...p, value } : p
        )
      }
    }));
  };

  const addPoint = (section) => {
    setMeasurements(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        points: [
          ...prev[section].points,
          { id: Date.now(), location: '추가 측정점', value: '' }
        ]
      }
    }));
  };

  const removePoint = (section, pointId) => {
    setMeasurements(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        points: prev[section].points.filter(p => p.id !== pointId)
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/mold-specifications/${moldId}/hardness`, { measurements });
      alert('저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getValueStatus = (material, value) => {
    if (!value) return 'empty';
    const standard = HARDNESS_STANDARDS[material];
    if (!standard) return 'unknown';
    const numValue = parseFloat(value);
    if (numValue >= standard.min && numValue <= standard.max) return 'pass';
    return 'fail';
  };

  const getAverage = (points) => {
    const values = points.filter(p => p.value).map(p => parseFloat(p.value));
    if (values.length === 0) return '-';
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const renderSection = (sectionKey, title) => {
    const section = measurements[sectionKey];
    const isExpanded = expandedSection === sectionKey;
    const standard = HARDNESS_STANDARDS[section.material];
    
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
        >
          <div className="flex items-center gap-2">
            <Gauge size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-800">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">평균: {getAverage(section.points)} {standard?.unit}</span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">재질</label>
                <select
                  value={section.material}
                  onChange={(e) => handleMaterialChange(sectionKey, e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                >
                  {Object.keys(HARDNESS_STANDARDS).map(mat => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">측정일</label>
                <input
                  type="date"
                  value={section.date}
                  onChange={(e) => handleDateChange(sectionKey, e.target.value)}
                  disabled={!isEditing}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-700 font-medium">
                기준값: {standard?.min} ~ {standard?.max} {standard?.unit}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">측정점</span>
                {isEditing && (
                  <button
                    onClick={() => addPoint(sectionKey)}
                    className="text-xs text-blue-600 flex items-center gap-1"
                  >
                    <Plus size={14} /> 추가
                  </button>
                )}
              </div>
              
              {section.points.map((point) => {
                const status = getValueStatus(section.material, point.value);
                return (
                  <div key={point.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={point.location}
                      onChange={(e) => {
                        setMeasurements(prev => ({
                          ...prev,
                          [sectionKey]: {
                            ...prev[sectionKey],
                            points: prev[sectionKey].points.map(p =>
                              p.id === point.id ? { ...p, location: e.target.value } : p
                            )
                          }
                        }));
                      }}
                      disabled={!isEditing}
                      className="w-24 border rounded-lg px-2 py-2 text-sm disabled:bg-gray-50"
                    />
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        step="0.1"
                        value={point.value}
                        onChange={(e) => handlePointChange(sectionKey, point.id, e.target.value)}
                        disabled={!isEditing}
                        placeholder="측정값"
                        className={`w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 ${
                          status === 'pass' ? 'border-green-300 bg-green-50' :
                          status === 'fail' ? 'border-red-300 bg-red-50' : ''
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {standard?.unit}
                      </span>
                    </div>
                    {isEditing && section.points.length > 1 && (
                      <button
                        onClick={() => removePoint(sectionKey, point.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

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
                <h1 className="text-lg font-bold text-gray-900">경도측정</h1>
                <p className="text-xs text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                isEditing ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isEditing ? '편집중' : '편집'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {renderSection('cavity', '상형 (캐비티)')}
        {renderSection('core', '하형 (코어)')}
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
          </div>
        </div>
      )}
    </div>
  );
}
