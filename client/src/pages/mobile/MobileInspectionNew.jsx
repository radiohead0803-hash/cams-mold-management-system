import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Check, AlertTriangle, X, Save, Send,
  ChevronRight, ChevronDown, RefreshCw, Clock, CheckCircle
} from 'lucide-react';
import { inspectionNewAPI, checklistMasterAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function MobileInspectionNew() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const moldId = searchParams.get('moldId');
  const cycleCodeId = searchParams.get('cycleCodeId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instance, setInstance] = useState(null);
  const [items, setItems] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [showCycleSelect, setShowCycleSelect] = useState(!id && !cycleCodeId);

  useEffect(() => {
    if (id) {
      loadInstance(id);
    } else if (moldId && cycleCodeId) {
      startNewInspection();
    } else if (moldId) {
      loadCycles();
    }
  }, [id, moldId, cycleCodeId]);

  const loadCycles = async () => {
    try {
      const response = await checklistMasterAPI.getCycles();
      setCycles(response.data?.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load cycles:', error);
      setLoading(false);
    }
  };

  const loadInstance = async (instanceId) => {
    try {
      setLoading(true);
      const response = await inspectionNewAPI.getById(instanceId);
      if (response.data?.data) {
        setInstance(response.data.data);
        setItems(response.data.data.items || []);
        
        // 첫 번째 카테고리 펼치기
        if (response.data.data.items?.length > 0) {
          const firstCategory = response.data.data.items[0]?.item?.major_category;
          setExpandedCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Failed to load instance:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewInspection = async () => {
    try {
      setLoading(true);
      const response = await inspectionNewAPI.start({
        mold_id: parseInt(moldId),
        cycle_code_id: parseInt(cycleCodeId)
      });
      
      if (response.data?.data) {
        setInstance(response.data.data);
        setItems(response.data.data.items || []);
        
        if (response.data.data.items?.length > 0) {
          const firstCategory = response.data.data.items[0]?.item?.major_category;
          setExpandedCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Failed to start inspection:', error);
      alert('점검 시작에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCycle = (cycleId) => {
    navigate(`/mobile/inspection-new?moldId=${moldId}&cycleCodeId=${cycleId}`);
  };

  const handleItemChange = (itemId, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveDraft = async () => {
    if (!instance) return;
    
    try {
      setSaving(true);
      await inspectionNewAPI.saveDraft(instance.id, { items });
      alert('임시저장되었습니다.');
    } catch (error) {
      console.error('Save draft failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!instance) return;
    
    // 필수 항목 체크
    const incompleteItems = items.filter(item => !item.result);
    if (incompleteItems.length > 0) {
      const confirm = window.confirm(`${incompleteItems.length}개 항목이 미입력 상태입니다. 제출하시겠습니까?`);
      if (!confirm) return;
    }
    
    try {
      setSaving(true);
      await inspectionNewAPI.submit(instance.id, { items });
      alert('점검이 제출되었습니다.');
      navigate(-1);
    } catch (error) {
      console.error('Submit failed:', error);
      alert('제출에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 카테고리별 그룹화
  const groupedItems = items.reduce((acc, item) => {
    const category = item.item?.major_category || '기타';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // 카테고리별 진행률 계산
  const getCategoryProgress = (categoryItems) => {
    const completed = categoryItems.filter(item => item.result).length;
    return { completed, total: categoryItems.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 주기 선택 화면
  if (showCycleSelect) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">점검 유형 선택</h1>
        </div>
        
        <div className="p-4 space-y-3">
          {cycles.map(cycle => (
            <button
              key={cycle.id}
              onClick={() => handleSelectCycle(cycle.id)}
              className="w-full bg-white rounded-lg shadow p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  cycle.cycle_type === 'daily' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {cycle.cycle_type === 'daily' ? (
                    <Clock className="w-6 h-6 text-blue-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div className="ml-4 text-left">
                  <p className="font-semibold text-gray-900">{cycle.label}</p>
                  <p className="text-sm text-gray-500">{cycle.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-gray-900">
                {instance?.cycleCode?.label || '점검'}
              </h1>
              <p className="text-sm text-gray-500">
                {instance?.mold?.mold_code || instance?.mold?.mold_name || '금형'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">진행률</p>
            <p className="text-lg font-bold text-blue-600">
              {items.filter(i => i.result).length}/{items.length}
            </p>
          </div>
        </div>
      </div>

      {/* 카테고리별 점검 항목 */}
      <div className="p-4 space-y-3">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const progress = getCategoryProgress(categoryItems);
          const isExpanded = expandedCategory === category;
          
          return (
            <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 카테고리 헤더 */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
              >
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{category}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    progress.completed === progress.total 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {/* 항목 목록 */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {categoryItems.map(item => (
                    <InspectionItemCard
                      key={item.id}
                      item={item}
                      onChange={(field, value) => handleItemChange(item.id, field, value)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex space-x-3">
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          임시저장
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 flex items-center justify-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-5 h-5 mr-2" />
          제출
        </button>
      </div>
    </div>
  );
}

// 점검 항목 카드
function InspectionItemCard({ item, onChange }) {
  const [showNote, setShowNote] = useState(false);
  
  const resultOptions = [
    { value: 'good', label: '양호', color: 'bg-green-500', icon: Check },
    { value: 'caution', label: '주의', color: 'bg-yellow-500', icon: AlertTriangle },
    { value: 'bad', label: '불량', color: 'bg-red-500', icon: X }
  ];

  return (
    <div className="p-4">
      {/* 항목 정보 */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{item.item?.item_name}</p>
            {item.item?.description && (
              <p className="text-sm text-gray-500 mt-1">{item.item.description}</p>
            )}
          </div>
          {item.item?.required_photo && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded ml-2">
              사진필수
            </span>
          )}
        </div>
      </div>

      {/* 결과 선택 */}
      <div className="flex space-x-2 mb-3">
        {resultOptions.map(option => {
          const Icon = option.icon;
          const isSelected = item.result === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange('result', option.value)}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${
                isSelected 
                  ? `${option.color} text-white` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* 비고 및 사진 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowNote(!showNote)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm ${
            item.note ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.note ? '비고 수정' : '비고 추가'}
        </button>
        <button
          className={`py-2 px-3 rounded-lg ${
            item.photo_urls?.length > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* 비고 입력 */}
      {showNote && (
        <div className="mt-3">
          <textarea
            value={item.note || ''}
            onChange={(e) => onChange('note', e.target.value)}
            placeholder="비고 사항을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
