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
    <div className="min-h-screen bg-gray-50">
      {/* Header - MoldChecklist 스타일 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">제작전 체크리스트</h1>
                <p className="text-sm text-gray-500">81개 항목, 9개 카테고리</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/pre-production-checklist/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              새 체크리스트
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 필터 */}
        <div className="flex gap-2">
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
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 목록 - MoldChecklist 테이블 스타일 */}
        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : checklists.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ClipboardCheck className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500">체크리스트가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 to-blue-800 text-white px-6 py-3">
              <h3 className="font-semibold">체크리스트 목록</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">품번 / 품명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">차종</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-48">진행률</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">작성일</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {checklists.map((item) => {
                    const total = item.total_items || 81;
                    const checked = item.checked_items || 0;
                    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/pre-production-checklist/${item.id}`)}>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">{item.checklist_number}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{item.part_number || '-'}</div>
                          <div className="text-xs text-gray-500">{item.part_name || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.car_model || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 whitespace-nowrap">{checked}/{total} ({percent}%)</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={18} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
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
    setExpandedCategories(prev => ({ ...prev, [code]: !prev[code] }));
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

  // 통계 계산
  const totalItems = categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  const checkedItems = categories.reduce((sum, cat) => sum + (cat.items?.filter(i => i.is_checked).length || 0), 0);
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - MoldChecklist 스타일 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/pre-production-checklist')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {checklist?.checklist_number || '새 체크리스트'}
                </h1>
                <p className="text-sm text-gray-500">
                  {checklist?.part_number} - {checklist?.part_name}
                </p>
              </div>
            </div>

            {/* 통계 */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">총 점검항목</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">완료</p>
                <p className="text-2xl font-bold text-blue-600">{checkedItems}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">진행률</p>
                <p className="text-2xl font-bold text-green-600">{progress}%</p>
              </div>
              
              {checklist && <StatusBadge status={checklist.status} />}

              {checklist?.status === 'draft' && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send size={16} />
                  제출
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 기본 정보 - MoldChecklist 스타일 */}
        {checklist && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
              <h2 className="text-lg font-semibold">제작전 체크리스트</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">차종</label>
                  <input type="text" value={checklist.car_model || '-'} readOnly className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">양산처</label>
                  <input type="text" value={checklist.production_plant || '-'} readOnly className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">제작처</label>
                  <input type="text" value={checklist.maker_name || '-'} readOnly className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">형체력</label>
                  <input type="text" value={checklist.clamping_force || '-'} readOnly className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 카테고리별 점검 항목 - MoldChecklist 테이블 스타일 */}
        {categories.map((category) => {
          const catItems = category.items || [];
          const catChecked = catItems.filter(i => i.is_checked).length;
          const catTotal = catItems.length;
          const catPercent = catTotal > 0 ? Math.round((catChecked / catTotal) * 100) : 0;
          const isExpanded = expandedCategories[category.category_code];

          return (
            <div key={category.category_code} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* 카테고리 헤더 - gradient 스타일 */}
              <div 
                className="bg-gradient-to-r from-indigo-900 to-blue-800 text-white px-6 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleCategory(category.category_code)}
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-7 h-7 flex items-center justify-center bg-white/20 rounded text-sm font-bold">
                    {category.category_code}
                  </span>
                  {category.category_name}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-80">{catChecked}/{catTotal} ({catPercent}%)</span>
                  {catChecked === catTotal && catTotal > 0 && <CheckCircle size={18} className="text-green-400" />}
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* 테이블 형식 점검 항목 */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-12">No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">점검 항목</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-64">규격/사양</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">확인</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {catItems.map((item) => (
                        <tr key={item.item_id || item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                            {item.item_no}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 font-medium">{item.item_name}</div>
                            {item.item_description && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.item_description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.input_type === 'select' && item.input_options ? (
                              <select
                                value={item.result_value || ''}
                                onChange={(e) => handleItemChange(category.category_code, item.item_id || item.id, 'result_value', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
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
                                onChange={(e) => handleItemChange(category.category_code, item.item_id || item.id, 'result_value', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
                                disabled={checklist?.status === 'approved'}
                              />
                            ) : item.input_type === 'textarea' ? (
                              <textarea
                                value={item.result_value || ''}
                                onChange={(e) => handleItemChange(category.category_code, item.item_id || item.id, 'result_value', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm resize-none"
                                rows={1}
                                disabled={checklist?.status === 'approved'}
                              />
                            ) : (
                              <input
                                type="text"
                                value={item.result_value || item.spec_value || item.default_spec || ''}
                                onChange={(e) => handleItemChange(category.category_code, item.item_id || item.id, 'result_value', e.target.value)}
                                className="w-full border rounded px-3 py-1.5 text-sm"
                                disabled={checklist?.status === 'approved'}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleItemChange(category.category_code, item.item_id || item.id, 'is_checked', !item.is_checked)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mx-auto ${
                                item.is_checked 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                              disabled={checklist?.status === 'approved'}
                            >
                              {item.is_checked && <Check size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 비활성 카테고리 요약 */}
              {!isExpanded && catChecked > 0 && (
                <div className="px-6 py-2 text-xs text-gray-400 flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-400" />
                  {catChecked}/{catTotal} 항목 완료 — 클릭하여 펼치기
                </div>
              )}
            </div>
          );
        })}

        {/* 하단 버튼 영역 */}
        {checklist && (
          <div className="flex gap-3">
            {checklist.status === 'draft' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium hover:bg-red-100"
                >
                  <X size={18} />
                  반려
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  <CheckCircle size={18} />
                  승인
                </button>
              </>
            )}
          </div>
        )}
      </div>
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
