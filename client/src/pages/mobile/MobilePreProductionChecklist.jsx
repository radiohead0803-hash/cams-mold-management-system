import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ClipboardCheck, ArrowLeft, Check, ChevronRight, ChevronDown,
  Send, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import api from '../../lib/api';

// 상태 배지
const StatusBadge = ({ status }) => {
  const config = {
    draft: { label: '작성중', color: 'bg-gray-100 text-gray-700', icon: Clock },
    submitted: { label: '제출됨', color: 'bg-blue-100 text-blue-700', icon: Send },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700', icon: AlertCircle }
  };
  const { label, color, icon: Icon } = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// 진행률 바
const ProgressBar = ({ value, total }) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{value}/{total} 완료</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// 목록 페이지
function ChecklistList() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pre-production-checklist', { params: { limit: 20 } });
      setChecklists(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">제작전 체크리스트</h1>
          <p className="text-xs text-gray-500">81개 항목, 9개 카테고리</p>
        </div>
      </div>

      {/* 목록 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500">체크리스트가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checklists.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/mobile/pre-production-checklist/${item.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{item.checklist_number}</div>
                    <div className="text-sm text-gray-600">{item.part_number} - {item.part_name}</div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <ProgressBar value={item.checked_items || 0} total={item.total_items || 81} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 상세 페이지
function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, [id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pre-production-checklist/${id}`);
      const data = response.data.data;
      setChecklist(data);
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        setExpandedCategory(data.categories[0].category_code);
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemCheck = async (categoryCode, itemId, checked) => {
    // 로컬 상태 업데이트
    setCategories(prev => prev.map(cat => {
      if (cat.category_code !== categoryCode) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if ((item.item_id || item.id) !== itemId) return item;
          return { ...item, is_checked: checked };
        })
      };
    }));

    // 서버 저장
    try {
      await api.patch(`/pre-production-checklist/${id}/results`, {
        results: [{ item_id: itemId, is_checked: checked }]
      });
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('체크리스트를 제출하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/pre-production-checklist/${id}/submit`);
      await loadChecklist();
      alert('제출되었습니다.');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('제출에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">체크리스트를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const checkedCount = categories.reduce((sum, cat) => 
    sum + cat.items.filter(i => i.is_checked).length, 0
  );
  const totalCount = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900">{checklist.checklist_number}</h1>
              <StatusBadge status={checklist.status} />
            </div>
            <p className="text-xs text-gray-500">{checklist.part_number} - {checklist.part_name}</p>
          </div>
        </div>
        <ProgressBar value={checkedCount} total={totalCount} />
      </div>

      {/* 카테고리 목록 */}
      <div className="p-4 space-y-3">
        {categories.map((category) => (
          <div key={category.category_code} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* 카테고리 헤더 */}
            <button
              onClick={() => setExpandedCategory(
                expandedCategory === category.category_code ? null : category.category_code
              )}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">
                  {category.category_code}
                </span>
                <span className="font-medium text-gray-900 text-sm">{category.category_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {category.items.filter(i => i.is_checked).length}/{category.items.length}
                </span>
                {expandedCategory === category.category_code ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-400" />
                )}
              </div>
            </button>

            {/* 항목 목록 */}
            {expandedCategory === category.category_code && (
              <div className="divide-y divide-gray-100">
                {category.items.map((item) => (
                  <div key={item.item_id || item.id} className="px-4 py-3 flex items-center gap-3">
                    <button
                      onClick={() => handleItemCheck(
                        category.category_code,
                        item.item_id || item.id,
                        !item.is_checked
                      )}
                      disabled={checklist.status === 'approved'}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.is_checked 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300'
                      }`}
                    >
                      {item.is_checked && <Check size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                      {item.spec_value && (
                        <div className="text-xs text-gray-500">{item.spec_value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 제출 버튼 */}
      {checklist.status === 'draft' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {saving ? '제출 중...' : '체크리스트 제출'}
          </button>
        </div>
      )}
    </div>
  );
}

// 메인 컴포넌트
export default function MobilePreProductionChecklist() {
  const { id } = useParams();
  
  if (id) {
    return <ChecklistDetail />;
  }
  
  return <ChecklistList />;
}
