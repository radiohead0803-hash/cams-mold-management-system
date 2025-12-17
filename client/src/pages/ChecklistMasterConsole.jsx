import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Edit3, Eye, Copy, Send, CheckCircle, 
  Rocket, RefreshCw, ChevronRight, FileText, Settings, Clock
} from 'lucide-react';
import { checklistMasterAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function ChecklistMasterConsole() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [items, setItems] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('versions');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [versionsRes, itemsRes, cyclesRes] = await Promise.all([
        checklistMasterAPI.getVersions().catch(() => ({ data: { data: [] } })),
        checklistMasterAPI.getItems().catch(() => ({ data: { data: [] } })),
        checklistMasterAPI.getCycles().catch(() => ({ data: { data: [] } }))
      ]);
      
      setVersions(versionsRes.data?.data || []);
      setItems(itemsRes.data?.data || []);
      setCycles(cyclesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVersions = versions.filter(v => {
    const matchesFilter = filter === 'all' || v.status === filter;
    const matchesSearch = !searchTerm || 
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusAction = async (version, action) => {
    try {
      if (action === 'submit-review') {
        await checklistMasterAPI.submitForReview(version.id);
      } else if (action === 'approve') {
        await checklistMasterAPI.approve(version.id);
      } else if (action === 'deploy') {
        await checklistMasterAPI.deploy(version.id);
      } else if (action === 'clone') {
        await checklistMasterAPI.clone(version.id);
      }
      loadData();
    } catch (error) {
      console.error('Action failed:', error);
      alert('작업에 실패했습니다.');
    }
  };

  const statusConfig = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-800', icon: Edit3 },
    review: { label: '검토중', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    deployed: { label: '배포됨', color: 'bg-green-100 text-green-800', icon: Rocket }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">체크리스트 마스터 관리</h1>
              <p className="text-gray-500 mt-1">점검 체크리스트 템플릿 생성, 승인, 배포 관리</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              신규 생성
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 탭 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'versions' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            마스터 버전
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'items' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            점검항목 관리
          </button>
          <button
            onClick={() => setActiveTab('cycles')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'cycles' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            점검주기 코드
          </button>
        </div>

        {activeTab === 'versions' && (
          <>
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="마스터 이름 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체 상태</option>
                    <option value="draft">초안</option>
                    <option value="review">검토중</option>
                    <option value="approved">승인됨</option>
                    <option value="deployed">배포됨</option>
                  </select>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </button>
              </div>
            </div>

            {/* 버전 목록 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">배포일</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVersions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        마스터 버전이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredVersions.map(version => {
                      const config = statusConfig[version.status] || statusConfig.draft;
                      const StatusIcon = config.icon;
                      
                      return (
                        <tr key={version.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div>
                                <p className="font-medium text-gray-900">{version.name}</p>
                                <p className="text-sm text-gray-500">{version.description?.substring(0, 50)}...</p>
                              </div>
                              {version.is_current_deployed && (
                                <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                  현재 적용
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-900">v{version.version}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{version.creator?.name || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {version.deployed_at 
                              ? new Date(version.deployed_at).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => navigate(`/checklist-master/${version.id}`)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="상세보기"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {version.status === 'draft' && (
                                <>
                                  <button
                                    onClick={() => navigate(`/checklist-master/${version.id}/edit`)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="편집"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStatusAction(version, 'submit-review')}
                                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                                    title="검토 요청"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              {version.status === 'review' && (
                                <button
                                  onClick={() => handleStatusAction(version, 'approve')}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="승인"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {version.status === 'approved' && (
                                <button
                                  onClick={() => handleStatusAction(version, 'deploy')}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="배포"
                                >
                                  <Rocket className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleStatusAction(version, 'clone')}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                title="복제"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'items' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">점검항목 마스터</h3>
              <button
                onClick={() => setShowItemModal(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                항목 추가
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  점검항목이 없습니다.
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {item.major_category}
                          </span>
                          <span className="font-medium text-gray-900">{item.item_name}</span>
                          {item.required_photo && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              사진필수
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-blue-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'cycles' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">점검주기 코드</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {cycles.map(cycle => (
                <div key={cycle.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cycle.cycle_type === 'daily' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {cycle.label}
                    </span>
                    <span className="text-gray-600">{cycle.description}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {cycle.cycle_type === 'shots' && `${cycle.cycle_shots?.toLocaleString()} SHOT`}
                    {cycle.cycle_type === 'daily' && '매일/생산전'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 신규 생성 모달 */}
      {showCreateModal && (
        <CreateVersionModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadData();
          }}
          items={items}
          cycles={cycles}
        />
      )}

      {/* 항목 추가 모달 */}
      {showItemModal && (
        <CreateItemModal
          onClose={() => setShowItemModal(false)}
          onCreated={() => {
            setShowItemModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// 버전 생성 모달
function CreateVersionModal({ onClose, onCreated, items, cycles }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [cycleMappings, setCycleMappings] = useState({});
  const [saving, setSaving] = useState(false);

  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleToggleCycle = (itemId, cycleId) => {
    const key = `${itemId}-${cycleId}`;
    setCycleMappings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('마스터 이름을 입력하세요.');
      return;
    }

    try {
      setSaving(true);
      
      const mappings = [];
      Object.entries(cycleMappings).forEach(([key, enabled]) => {
        if (enabled) {
          const [itemId, cycleId] = key.split('-').map(Number);
          mappings.push({ item_id: itemId, cycle_code_id: cycleId, is_enabled: true });
        }
      });

      await checklistMasterAPI.createVersion({
        name,
        description,
        items: selectedItems.map(id => ({ id })),
        cycleMappings: mappings
      });

      onCreated();
    } catch (error) {
      console.error('Create failed:', error);
      alert('생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 카테고리별 그룹화
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.major_category]) acc[item.major_category] = [];
    acc[item.major_category].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">신규 마스터 버전 생성</h2>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마스터 이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 정기점검 체크리스트 v1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="마스터 설명"
                />
              </div>
            </div>

            {/* 항목 선택 및 주기 매핑 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">항목 선택 및 주기 매핑</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">선택</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">카테고리</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">항목명</th>
                      {cycles.map(cycle => (
                        <th key={cycle.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                          {cycle.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(groupedItems).map(([category, categoryItems]) => (
                      categoryItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleToggleItem(item.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {idx === 0 ? category : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                          {cycles.map(cycle => (
                            <td key={cycle.id} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={cycleMappings[`${item.id}-${cycle.id}`] || false}
                                onChange={() => handleToggleCycle(item.id, cycle.id)}
                                disabled={!selectedItems.includes(item.id)}
                                className="w-4 h-4 text-green-600 rounded disabled:opacity-30"
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 항목 생성 모달
function CreateItemModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    major_category: '',
    item_name: '',
    description: '',
    check_method: '',
    required_photo: false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.major_category || !formData.item_name) {
      alert('카테고리와 항목명을 입력하세요.');
      return;
    }

    try {
      setSaving(true);
      await checklistMasterAPI.createItem(formData);
      onCreated();
    } catch (error) {
      console.error('Create item failed:', error);
      alert('항목 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">점검항목 추가</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대분류 (카테고리) *</label>
            <input
              type="text"
              value={formData.major_category}
              onChange={(e) => setFormData(prev => ({ ...prev, major_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="예: 금형 외관 점검"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">항목명 *</label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="예: 금형 외관 상태"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">점검내용</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="점검 내용을 상세히 기술..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">점검방법</label>
            <textarea
              value={formData.check_method}
              onChange={(e) => setFormData(prev => ({ ...prev, check_method: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
              placeholder="점검 방법을 기술..."
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.required_photo}
                onChange={(e) => setFormData(prev => ({ ...prev, required_photo: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">사진 필수</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
