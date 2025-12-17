/**
 * 시스템 규칙/기준값 관리 페이지
 */
import { useState, useEffect } from 'react';
import { 
  Settings, Save, RotateCcw, AlertTriangle, 
  Clock, MapPin, Bell, CheckSquare, Gauge,
  RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../../lib/api';

const CATEGORY_CONFIG = {
  inspection: { label: '점검 관련', icon: CheckSquare, color: 'blue' },
  shot_count: { label: '타수 관련', icon: Gauge, color: 'purple' },
  gps: { label: 'GPS 관련', icon: MapPin, color: 'green' },
  notification: { label: '알림 관련', icon: Bell, color: 'orange' },
  approval: { label: '승인 관련', icon: Clock, color: 'teal' },
  system: { label: '시스템 설정', icon: Settings, color: 'gray' }
};

export default function SystemRulesPage() {
  const [rules, setRules] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [message, setMessage] = useState(null);

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
            새로고침
          </button>
        </div>
      </div>

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
          {Object.entries(grouped).map(([category, categoryRules]) => {
            const config = CATEGORY_CONFIG[category] || { label: category, icon: Settings, color: 'gray' };
            const Icon = config.icon;
            const isExpanded = expandedCategories[category];
            
            return (
              <div key={category} className="bg-white rounded-xl border overflow-hidden">
                {/* 카테고리 헤더 */}
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
                      <p className="text-sm text-gray-500">{categoryRules.length}개 규칙</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {/* 규칙 목록 */}
                {isExpanded && (
                  <div className="divide-y">
                    {categoryRules.map((rule) => (
                      <div key={rule.rule_key} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{rule.name}</h4>
                              {!rule.is_editable && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">읽기전용</span>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span>키: {rule.rule_key}</span>
                              {rule.min_value !== null && <span>최소: {rule.min_value}</span>}
                              {rule.max_value !== null && <span>최대: {rule.max_value}</span>}
                              {rule.updated_by_name && (
                                <span>수정: {rule.updated_by_name} ({formatDate(rule.updated_at)})</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-4">
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
                                  {rule.unit && <span className="text-gray-500">{rule.unit}</span>}
                                </div>
                                <button
                                  onClick={() => handleSave(rule.rule_key)}
                                  disabled={saving}
                                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                >
                                  ✕
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
                                {rule.is_editable && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleEdit(rule)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                      title="수정"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    {rule.default_value && rule.value !== rule.default_value && (
                                      <button
                                        onClick={() => handleReset(rule.rule_key)}
                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                                        title="기본값으로 초기화"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
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
        </div>
      )}
    </div>
  );
}
