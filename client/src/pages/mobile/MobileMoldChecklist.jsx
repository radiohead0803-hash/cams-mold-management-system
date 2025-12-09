import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, CheckCircle, Clock, ChevronDown, ChevronUp,
  AlertCircle, Send, FileText
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

// 9개 카테고리 체크리스트 정의
const CHECKLIST_CATEGORIES = [
  {
    id: 'material',
    title: 'Ⅰ. 원재료',
    items: [
      { id: 1, name: '수축률', type: 'text' },
      { id: 2, name: '소재 (MS SPEC)', type: 'text' },
      { id: 3, name: '공급 업체', type: 'text' }
    ]
  },
  {
    id: 'mold',
    title: 'Ⅱ. 금형',
    items: [
      { id: 1, name: '금형 발주 품번·품목 아이템 사양 일치', type: 'check', options: ['확인', '미확인'] },
      { id: 2, name: '양산차 조건 제작 사양 반영', type: 'check', options: ['유', '무'] },
      { id: 3, name: '수축률', type: 'text' },
      { id: 4, name: '금형 중량', type: 'text', suffix: 'ton' },
      { id: 5, name: '범퍼 히트파팅 적용', type: 'check', options: ['적용', '미적용'] },
      { id: 6, name: '캐비티 재질', type: 'select', options: ['NAK80', 'S45C', 'SKD61'] },
      { id: 7, name: '코어 재질', type: 'select', options: ['NAK80', 'S45C', 'SKD61'] },
      { id: 8, name: '캐비티 수', type: 'text' },
      { id: 9, name: '게이트 형식', type: 'check', options: ['오픈', '밸브'] },
      { id: 10, name: '게이트 수', type: 'text' }
    ]
  },
  {
    id: 'gas_vent',
    title: 'Ⅲ. 가스 빼기',
    items: [
      { id: 1, name: '가스 빼기 금형 전반 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '가스 빼기 2/100 또는 3/100 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '가스 빼기 피치간 거리 30mm 간격 유지', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'moldflow',
    title: 'Ⅳ. 성형 해석',
    items: [
      { id: 1, name: '중 대물류 및 도금 아이템 성형 해석 실행', type: 'check', options: ['실행', '미실행'] },
      { id: 2, name: '성형성 확인(미성형 발생부 확인)', type: 'check', options: ['확인', '미확인'] },
      { id: 3, name: '웰드라인 위치 확인', type: 'check', options: ['확인', '미확인'] }
    ]
  },
  {
    id: 'sink_mark',
    title: 'Ⅴ. 싱크마크',
    items: [
      { id: 1, name: '전체 리브 0.6t 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '싱크 발생 구조(제품 두께 편차)', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'ejection',
    title: 'Ⅵ. 취출',
    items: [
      { id: 1, name: '제품 취출 구조(범퍼 하단 매칭부)', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '언더컷 구조 확인', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '빼기 구배 3~5도', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'mic',
    title: 'Ⅶ. MIC 제품',
    items: [
      { id: 1, name: 'MIC 사양 게이트 형상 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '웰드라인 확인 및 도장 사양', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'coating',
    title: 'Ⅷ. 도금',
    items: [
      { id: 1, name: '게이트 위치/개수 최적화', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '수축률', type: 'text', suffix: '/1000' },
      { id: 3, name: '보스 조립부 엣지 1R 반영', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'rear_back_beam',
    title: 'Ⅸ. 리어 백빔',
    items: [
      { id: 1, name: '리어 백빔 금형구배 5도 이상', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '리어 백빔 제품 끝단부 두께 5.0t 이상', type: 'check', options: ['반영', '미반영'] }
    ]
  }
];

export default function MobileMoldChecklist() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [checklistData, setChecklistData] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    initializeChecklist();
    if (moldId) {
      loadMoldData();
    }
  }, [moldId]);

  const initializeChecklist = () => {
    const initialData = {};
    CHECKLIST_CATEGORIES.forEach(category => {
      category.items.forEach(item => {
        initialData[`${category.id}_${item.id}`] = {
          value: '',
          checked: false,
          remarks: ''
        };
      });
    });
    setChecklistData(initialData);
  };

  const loadMoldData = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        setMoldInfo(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (categoryId, itemId, field, value) => {
    const key = `${categoryId}_${itemId}`;
    setChecklistData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const getProgress = () => {
    let total = 0;
    let completed = 0;
    CHECKLIST_CATEGORIES.forEach(category => {
      category.items.forEach(item => {
        total++;
        const key = `${category.id}_${item.id}`;
        const data = checklistData[key];
        if (data && (data.checked || data.value)) {
          completed++;
        }
      });
    });
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getCategoryProgress = (category) => {
    let completed = 0;
    category.items.forEach(item => {
      const key = `${category.id}_${item.id}`;
      const data = checklistData[key];
      if (data && (data.checked || data.value)) {
        completed++;
      }
    });
    return { completed, total: category.items.length };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/mold-specifications/${moldId}/checklist`, { checklistData });
      alert('저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const progress = getProgress();

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
                <h1 className="text-lg font-bold text-gray-900">금형체크리스트</h1>
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
            <span>전체 진행률</span>
            <span className="font-bold text-purple-600">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {CHECKLIST_CATEGORIES.map((category) => {
          const catProgress = getCategoryProgress(category);
          const isExpanded = expandedCategory === category.id;
          
          return (
            <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    catProgress.completed === catProgress.total && catProgress.total > 0
                      ? 'bg-green-100 text-green-700'
                      : catProgress.completed > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {catProgress.completed === catProgress.total && catProgress.total > 0 
                      ? <CheckCircle size={16} /> 
                      : catProgress.completed}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm text-gray-800">{category.title}</div>
                    <div className="text-xs text-gray-500">{catProgress.completed}/{catProgress.total} 완료</div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isExpanded && (
                <div className="border-t divide-y">
                  {category.items.map((item) => {
                    const key = `${category.id}_${item.id}`;
                    const data = checklistData[key] || {};
                    
                    return (
                      <div key={item.id} className="p-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">{item.name}</div>
                        
                        {item.type === 'text' && (
                          <input
                            type="text"
                            value={data.value || ''}
                            onChange={(e) => handleItemChange(category.id, item.id, 'value', e.target.value)}
                            disabled={!isEditing}
                            placeholder="입력"
                            className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                          />
                        )}
                        
                        {item.type === 'check' && (
                          <div className="flex gap-2">
                            {item.options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => isEditing && handleItemChange(category.id, item.id, 'value', opt)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  data.value === opt
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                } ${!isEditing && 'opacity-60'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {item.type === 'select' && (
                          <select
                            value={data.value || ''}
                            onChange={(e) => handleItemChange(category.id, item.id, 'value', e.target.value)}
                            disabled={!isEditing}
                            className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                          >
                            <option value="">선택</option>
                            {item.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
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
