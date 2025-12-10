import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ClipboardCheck, ChevronRight, ChevronDown, Check, X, 
  FileText, Upload, Send, ArrowLeft, Plus, Filter,
  CheckCircle, Clock, AlertCircle, Eye
} from 'lucide-react';
import api from '../lib/api';

// 상태 배지 컴포넌트
const StatusBadge = ({ status }) => {
  const config = {
    draft: { label: '작성중', color: 'bg-gray-100 text-gray-700' },
    submitted: { label: '제출됨', color: 'bg-blue-100 text-blue-700' },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-700' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700' }
  };
  const { label, color } = config[status] || config.draft;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
};

// 진행률 바 컴포넌트
const ProgressBar = ({ value, total }) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">{value}/{total} ({percent}%)</span>
    </div>
  );
};

// 체크리스트 목록 페이지
function ChecklistList() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadChecklists();
  }, [filter]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/pre-production-checklist', { params });
      setChecklists(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제작전 체크리스트</h1>
          <p className="text-sm text-gray-600 mt-1">81개 항목, 9개 카테고리</p>
        </div>
        <button
          onClick={() => navigate('/pre-production-checklist/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          새 체크리스트
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: '전체' },
          { value: 'draft', label: '작성중' },
          { value: 'submitted', label: '제출됨' },
          { value: 'approved', label: '승인됨' },
          { value: 'rejected', label: '반려됨' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardCheck className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">체크리스트가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">품번 / 품명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">차종</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">진행률</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">작성일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {checklists.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.checklist_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{item.part_number || '-'}</div>
                    <div className="text-xs text-gray-500">{item.part_name || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.car_model || '-'}</td>
                  <td className="px-4 py-3 w-48">
                    <ProgressBar value={item.checked_items || 0} total={item.total_items || 81} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/pre-production-checklist/${item.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 체크리스트 상세/편집 페이지
function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadChecklist();
    } else {
      loadItems();
    }
  }, [id]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pre-production-checklist/${id}`);
      const data = response.data.data;
      setChecklist(data);
      setCategories(data.categories || []);
      // 첫 번째 카테고리 펼치기
      if (data.categories?.length > 0) {
        setExpandedCategories({ [data.categories[0].category_code]: true });
      }
    } catch (error) {
      console.error('Failed to load checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pre-production-checklist/items');
      setCategories(response.data.data.categories || []);
      if (response.data.data.categories?.length > 0) {
        setExpandedCategories({ [response.data.data.categories[0].category_code]: true });
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (code) => {
    setExpandedCategories(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleItemChange = (categoryCode, itemId, field, value) => {
    setCategories(prev => prev.map(cat => {
      if (cat.category_code !== categoryCode) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.item_id !== itemId && item.id !== itemId) return item;
          return { ...item, [field]: value };
        })
      };
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const results = categories.flatMap(cat => 
        cat.items.map(item => ({
          item_id: item.item_id || item.id,
          is_applicable: item.is_applicable !== false,
          spec_value: item.spec_value || item.default_spec,
          is_checked: item.is_checked || false,
          result_value: item.result_value,
          notes: item.notes
        }))
      );
      
      await api.patch(`/pre-production-checklist/${id}/results`, { results });
      await loadChecklist();
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('체크리스트를 제출하시겠습니까?')) return;
    try {
      await api.post(`/pre-production-checklist/${id}/submit`);
      await loadChecklist();
      alert('제출되었습니다.');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('제출에 실패했습니다.');
    }
  };

  const handleApprove = async () => {
    if (!confirm('체크리스트를 승인하시겠습니까?')) return;
    try {
      await api.post(`/pre-production-checklist/${id}/approve`);
      await loadChecklist();
      alert('승인되었습니다.');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('승인에 실패했습니다.');
    }
  };

  const handleReject = async () => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (!reason) return;
    try {
      await api.post(`/pre-production-checklist/${id}/reject`, { reason });
      await loadChecklist();
      alert('반려되었습니다.');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('반려에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/pre-production-checklist')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {checklist?.checklist_number || '새 체크리스트'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {checklist?.part_number} - {checklist?.part_name}
          </p>
        </div>
        {checklist && <StatusBadge status={checklist.status} />}
      </div>

      {/* 기본 정보 */}
      {checklist && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">차종:</span>
              <span className="ml-2 font-medium">{checklist.car_model || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">양산처:</span>
              <span className="ml-2 font-medium">{checklist.production_plant || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">제작처:</span>
              <span className="ml-2 font-medium">{checklist.maker_name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">형체력:</span>
              <span className="ml-2 font-medium">{checklist.clamping_force || '-'}</span>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={checklist.checked_items || 0} total={checklist.total_items || 81} />
          </div>
        </div>
      )}

      {/* 카테고리별 점검 항목 */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.category_code} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* 카테고리 헤더 */}
            <button
              onClick={() => toggleCategory(category.category_code)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-bold text-sm">
                  {category.category_code}
                </span>
                <span className="font-semibold text-gray-900">{category.category_name}</span>
                <span className="text-xs text-gray-500">({category.items?.length || 0}개 항목)</span>
              </div>
              {expandedCategories[category.category_code] ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {/* 항목 목록 */}
            {expandedCategories[category.category_code] && (
              <div className="divide-y divide-gray-100">
                {category.items?.map((item) => (
                  <div key={item.item_id || item.id} className="px-4 py-3 flex items-center gap-4">
                    {/* 체크박스 */}
                    <button
                      onClick={() => handleItemChange(
                        category.category_code, 
                        item.item_id || item.id, 
                        'is_checked', 
                        !item.is_checked
                      )}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        item.is_checked 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      disabled={checklist?.status === 'approved'}
                    >
                      {item.is_checked && <Check size={14} />}
                    </button>

                    {/* 항목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">#{item.item_no}</span>
                        <span className="font-medium text-gray-900">{item.item_name}</span>
                      </div>
                      {item.item_description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.item_description}</p>
                      )}
                    </div>

                    {/* 입력 필드 */}
                    <div className="w-48">
                      {item.input_type === 'select' && item.input_options ? (
                        <select
                          value={item.result_value || ''}
                          onChange={(e) => handleItemChange(
                            category.category_code,
                            item.item_id || item.id,
                            'result_value',
                            e.target.value
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={checklist?.status === 'approved'}
                        >
                          <option value="">선택</option>
                          {(typeof item.input_options === 'string' 
                            ? JSON.parse(item.input_options) 
                            : item.input_options
                          ).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : item.input_type === 'number' ? (
                        <input
                          type="number"
                          value={item.result_value || item.spec_value || ''}
                          onChange={(e) => handleItemChange(
                            category.category_code,
                            item.item_id || item.id,
                            'result_value',
                            e.target.value
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={checklist?.status === 'approved'}
                        />
                      ) : item.input_type === 'textarea' ? (
                        <textarea
                          value={item.result_value || ''}
                          onChange={(e) => handleItemChange(
                            category.category_code,
                            item.item_id || item.id,
                            'result_value',
                            e.target.value
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={1}
                          disabled={checklist?.status === 'approved'}
                        />
                      ) : (
                        <input
                          type="text"
                          value={item.result_value || item.spec_value || item.default_spec || ''}
                          onChange={(e) => handleItemChange(
                            category.category_code,
                            item.item_id || item.id,
                            'result_value',
                            e.target.value
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={checklist?.status === 'approved'}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 액션 버튼 */}
      {checklist && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {checklist.status === 'draft' && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send size={18} />
                제출
              </button>
            </>
          )}
          {checklist.status === 'submitted' && (
            <>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X size={18} />
                반려
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={18} />
                승인
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 메인 컴포넌트
export default function PreProductionChecklist() {
  const { id } = useParams();
  
  if (id) {
    return <ChecklistDetail />;
  }
  
  return <ChecklistList />;
}
