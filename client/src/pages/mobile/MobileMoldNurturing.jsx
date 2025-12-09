import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle, Clock, ChevronDown, ChevronUp,
  TrendingUp, Target, Calendar, FileText
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

// 금형육성 단계 정의
const NURTURING_STAGES = [
  { id: 'to1', name: '1차 T/O', order: 1 },
  { id: 'to2', name: '2차 T/O', order: 2 },
  { id: 'to3', name: '3차 T/O', order: 3 },
  { id: 'to4', name: '4차 T/O', order: 4 },
  { id: 'to5', name: '5차 T/O', order: 5 },
  { id: 'mass_production', name: '양산', order: 6 }
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'completed', label: '완료', color: 'bg-green-100 text-green-700' },
  { value: 'issue', label: '이슈', color: 'bg-red-100 text-red-700' }
];

export default function MobileMoldNurturing() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  
  const [nurturingData, setNurturingData] = useState(
    NURTURING_STAGES.map(stage => ({
      stage_id: stage.id,
      stage_name: stage.name,
      date: '',
      status: 'pending',
      shot_count: '',
      cycle_time: '',
      defect_rate: '',
      issues: '',
      actions: '',
      remarks: ''
    }))
  );

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
        if (response.data.data.nurturing_data) {
          setNurturingData(response.data.data.nurturing_data);
        }
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = (index, field, value) => {
    setNurturingData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/mold-specifications/${moldId}/nurturing`, { nurturingData });
      alert('저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getProgress = () => {
    const completed = nurturingData.filter(s => s.status === 'completed').length;
    return Math.round((completed / nurturingData.length) * 100);
  };

  const getStatusBadge = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    ) : null;
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
                <h1 className="text-lg font-bold text-gray-900">금형육성</h1>
                <p className="text-xs text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`}
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

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>육성 진행률</span>
            <span className="font-bold text-purple-600">{getProgress()}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {nurturingData.map((stage, index) => {
          const isExpanded = expandedStage === index;
          
          return (
            <div key={stage.stage_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedStage(isExpanded ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                    stage.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    stage.status === 'issue' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm text-gray-800">{stage.stage_name}</div>
                    {stage.date && <div className="text-xs text-gray-500">{stage.date}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(stage.status)}
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">일자</label>
                      <input
                        type="date"
                        value={stage.date}
                        onChange={(e) => handleStageChange(index, 'date', e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">상태</label>
                      <select
                        value={stage.status}
                        onChange={(e) => handleStageChange(index, 'status', e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">숏수</label>
                      <input
                        type="number"
                        value={stage.shot_count}
                        onChange={(e) => handleStageChange(index, 'shot_count', e.target.value)}
                        disabled={!isEditing}
                        placeholder="0"
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">사이클타임 (초)</label>
                      <input
                        type="number"
                        value={stage.cycle_time}
                        onChange={(e) => handleStageChange(index, 'cycle_time', e.target.value)}
                        disabled={!isEditing}
                        placeholder="0"
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">불량률 (%)</label>
                      <input
                        type="number"
                        value={stage.defect_rate}
                        onChange={(e) => handleStageChange(index, 'defect_rate', e.target.value)}
                        disabled={!isEditing}
                        placeholder="0"
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">이슈사항</label>
                    <textarea
                      value={stage.issues}
                      onChange={(e) => handleStageChange(index, 'issues', e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">조치사항</label>
                    <textarea
                      value={stage.actions}
                      onChange={(e) => handleStageChange(index, 'actions', e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 resize-none"
                    />
                  </div>
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
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
