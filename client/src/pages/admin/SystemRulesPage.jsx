/**
 * 시스템 규칙/기준값 관리 페이지
 */
import { useState, useEffect } from 'react';
import { 
  Settings, Save, RotateCcw, AlertTriangle, 
  Clock, MapPin, Bell, CheckSquare, Gauge,
  RefreshCw, ChevronDown, ChevronUp, Plus, Trash2, X, Edit3, Search
} from 'lucide-react';
import api from '../../lib/api';

const CATEGORY_CONFIG = {
  inspection: { label: '점검 관련', icon: CheckSquare, color: 'blue', desc: '일상/정기점검 주기 및 사진 정책' },
  shot_count: { label: '타수 관련', icon: Gauge, color: 'purple', desc: '보증숏수, 점검 트리거 기준' },
  gps: { label: 'GPS 관련', icon: MapPin, color: 'green', desc: '위치 이탈 판정 및 갱신 주기' },
  notification: { label: '알림 관련', icon: Bell, color: 'orange', desc: '알림 보관, 재발송 정책' },
  approval: { label: '승인 관련', icon: Clock, color: 'teal', desc: '승인 SLA, 리마인더, 에스컬레이션' },
  system: { label: '시스템 설정', icon: Settings, color: 'gray', desc: '세션, QR, 업로드, 경도 기준' }
};

const CATEGORY_OPTIONS = [
  { value: 'inspection', label: '점검 관련' },
  { value: 'shot_count', label: '타수 관련' },
  { value: 'gps', label: 'GPS 관련' },
  { value: 'notification', label: '알림 관련' },
  { value: 'approval', label: '승인 관련' },
  { value: 'system', label: '시스템 설정' }
];

export default function SystemRulesPage() {
  const [rules, setRules] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_key: '', category: 'inspection', name: '', description: '',
    value: '', value_type: 'number', unit: '', min_value: '', max_value: '', default_value: ''
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system-rules');
      if (response.data.success) {
        setRules(response.data.data.rules);
        setGrouped(response.data.data.grouped);
        // 모든 카테고리 펼침
        const expanded = {};
        Object.keys(response.data.data.grouped).forEach(cat => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);
      }
    } catch (error) {
      console.error('규칙 조회 에러:', error);
      showMessage('규칙 목록을 불러올 수 없습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRules = async () => {
    if (!confirm('기본 규칙을 생성하시겠습니까?')) return;
    
    try {
      const response = await api.post('/system-rules/seed');
      if (response.data.success) {
        showMessage(response.data.message, 'success');
        fetchRules();
      }
    } catch (error) {
      showMessage('규칙 생성에 실패했습니다.', 'error');
    }
  };

  const handleEdit = (rule) => {
    setEditingKey(rule.rule_key);
    setEditValue(rule.value);
  };

  const handleSave = async (ruleKey) => {
    try {
      setSaving(true);
      const response = await api.patch(`/system-rules/${ruleKey}`, { value: editValue });
      if (response.data.success) {
        showMessage('규칙이 업데이트되었습니다.', 'success');
        setEditingKey(null);
        fetchRules();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || '업데이트에 실패했습니다.';
      showMessage(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (ruleKey) => {
    if (!confirm('이 규칙을 기본값으로 초기화하시겠습니까?')) return;
    
    try {
      const response = await api.post(`/system-rules/${ruleKey}/reset`);
      if (response.data.success) {
        showMessage('규칙이 초기화되었습니다.', 'success');
        fetchRules();
      }
    } catch (error) {
      showMessage('초기화에 실패했습니다.', 'error');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleDelete = async (ruleKey) => {
    if (!confirm(`규칙 "${ruleKey}"을(를) 삭제하시겠습니까?`)) return;
    try {
      const response = await api.delete(`/system-rules/${ruleKey}`);
      if (response.data.success) {
        showMessage('규칙이 삭제되었습니다.', 'success');
        fetchRules();
      }
    } catch (error) {
      showMessage('삭제에 실패했습니다.', 'error');
    }
  };

  const handleAddRule = async () => {
    if (!newRule.rule_key || !newRule.name || !newRule.value) {
      showMessage('규칙 키, 이름, 값은 필수입니다.', 'error');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...newRule,
        min_value: newRule.min_value ? parseFloat(newRule.min_value) : null,
        max_value: newRule.max_value ? parseFloat(newRule.max_value) : null,
        default_value: newRule.default_value || newRule.value
      };
      const response = await api.post('/system-rules', payload);
      if (response.data.success) {
        showMessage('규칙이 생성되었습니다.', 'success');
        setShowAddModal(false);
        setNewRule({ rule_key: '', category: 'inspection', name: '', description: '', value: '', value_type: 'number', unit: '', min_value: '', max_value: '', default_value: '' });
        fetchRules();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || '생성에 실패했습니다.';
      showMessage(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredGrouped = () => {
    const result = {};
    Object.entries(grouped).forEach(([category, categoryRules]) => {
      if (filterCategory && category !== filterCategory) return;
      const filtered = categoryRules.filter(rule => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return rule.name?.toLowerCase().includes(q) || rule.rule_key?.toLowerCase().includes(q) || rule.description?.toLowerCase().includes(q);
      });
      if (filtered.length > 0) result[category] = filtered;
    });
    return result;
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredGrouped = getFilteredGrouped();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            기준값 관리
          </h1>
          <p className="text-gray-500 mt-1">점검 주기, 타수 기준, GPS 설정 등 운영 기준값을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            규칙 추가
          </button>
          <button
            onClick={handleSeedRules}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Settings className="w-4 h-4" />
            기본 규칙 생성
          </button>
          <button
            onClick={fetchRules}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      {!loading && rules.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const count = grouped[key]?.length || 0;
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(filterCategory === key ? '' : key)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  filterCategory === key ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' : 'bg-white hover:shadow-md'
                }`}
              >
                <Icon className={`w-5 h-5 text-${cfg.color}-500 mb-1`} />
                <div className="text-xs text-gray-500">{cfg.label}</div>
                <div className="text-lg font-bold text-gray-900">{count}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* 검색/필터 바 */}
      {!loading && rules.length > 0 && (
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="규칙 이름, 키, 설명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 카테고리</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(searchQuery || filterCategory) && (
            <button
              onClick={() => { setSearchQuery(''); setFilterCategory(''); }}
              className="px-3 py-2.5 text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 규칙 목록 */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">등록된 규칙이 없습니다</p>
          <button
            onClick={handleSeedRules}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            기본 규칙 생성하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredGrouped).map(([category, categoryRules]) => {
            const config = CATEGORY_CONFIG[category] || { label: category, icon: Settings, color: 'gray', desc: '' };
            const Icon = config.icon;
            const isExpanded = expandedCategories[category];
            
            return (
              <div key={category} className="bg-white rounded-xl border overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                      <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{config.label}</h3>
                      <p className="text-xs text-gray-500">{config.desc} ({categoryRules.length}개)</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {isExpanded && (
                  <div className="divide-y">
                    {categoryRules.map((rule) => (
                      <div key={rule.rule_key} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-gray-900">{rule.name}</h4>
                              {!rule.is_editable && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">읽기전용</span>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{rule.rule_key}</span>
                              {rule.min_value !== null && <span>최소: {rule.min_value}</span>}
                              {rule.max_value !== null && <span>최대: {rule.max_value}</span>}
                              {rule.updated_by_name && (
                                <span>수정: {rule.updated_by_name} ({formatDate(rule.updated_at)})</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            {editingKey === rule.rule_key ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <input
                                    type={rule.value_type === 'number' ? 'number' : 'text'}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min={rule.min_value}
                                    max={rule.max_value}
                                  />
                                  {rule.unit && <span className="text-gray-500 text-sm">{rule.unit}</span>}
                                </div>
                                <button onClick={() => handleSave(rule.rule_key)} disabled={saving} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={handleCancel} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {rule.value} {rule.unit && <span className="text-sm font-normal text-gray-500">{rule.unit}</span>}
                                  </div>
                                  {rule.default_value && rule.value !== rule.default_value && (
                                    <div className="text-xs text-orange-500">기본값: {rule.default_value}</div>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {rule.is_editable && (
                                    <button onClick={() => handleEdit(rule)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="수정">
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {rule.default_value && rule.value !== rule.default_value && (
                                    <button onClick={() => handleReset(rule.rule_key)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="기본값으로 초기화">
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={() => handleDelete(rule.rule_key)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg" title="삭제">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(filteredGrouped).length === 0 && (searchQuery || filterCategory) && (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* 새 규칙 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">새 규칙 추가</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">규칙 키 *</label>
                  <input type="text" placeholder="예: my_custom_rule" value={newRule.rule_key}
                    onChange={(e) => setNewRule(p => ({ ...p, rule_key: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                  <select value={newRule.category} onChange={(e) => setNewRule(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">규칙 이름 *</label>
                <input type="text" placeholder="표시될 이름" value={newRule.name}
                  onChange={(e) => setNewRule(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea placeholder="규칙 설명" value={newRule.description} rows={2}
                  onChange={(e) => setNewRule(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">값 *</label>
                  <input type="text" value={newRule.value}
                    onChange={(e) => setNewRule(p => ({ ...p, value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">값 타입</label>
                  <select value={newRule.value_type} onChange={(e) => setNewRule(p => ({ ...p, value_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="number">숫자</option>
                    <option value="string">문자열</option>
                    <option value="boolean">부울</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                  <input type="text" placeholder="일, 회, m ..." value={newRule.unit}
                    onChange={(e) => setNewRule(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최소값</label>
                  <input type="number" value={newRule.min_value}
                    onChange={(e) => setNewRule(p => ({ ...p, min_value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최대값</label>
                  <input type="number" value={newRule.max_value}
                    onChange={(e) => setNewRule(p => ({ ...p, max_value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기본값</label>
                  <input type="text" value={newRule.default_value}
                    onChange={(e) => setNewRule(p => ({ ...p, default_value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={handleAddRule} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? '생성 중...' : '규칙 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
