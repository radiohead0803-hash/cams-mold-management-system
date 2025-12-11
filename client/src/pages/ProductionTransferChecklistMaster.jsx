import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  FileText, 
  Image,
  ChevronDown,
  ChevronRight,
  Settings,
  List
} from 'lucide-react';
import api from '../lib/api';

const ProductionTransferChecklistMaster = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    item_code: '',
    item_name: '',
    description: '',
    is_required: true,
    requires_attachment: false,
    attachment_type: '',
    display_order: 0,
    is_active: true
  });

  const categories = [
    '1.금형기본정보',
    '2.도면문서검증',
    '3.치수정밀도검사',
    '4.성형면외관상태',
    '5.성능기능점검',
    '6.금형안전성확인',
    '7.시운전결과',
    '8.금형인계물류'
  ];

  const categoryLabels = {
    '1.금형기본정보': '📋 1. 금형 기본 정보 확인',
    '2.도면문서검증': '📄 2. 도면/문서 검증',
    '3.치수정밀도검사': '📏 3. 치수/정밀도 검사',
    '4.성형면외관상태': '🔍 4. 성형면/외관 상태',
    '5.성능기능점검': '⚙️ 5. 성능·기능 점검',
    '6.금형안전성확인': '🛡️ 6. 금형 안전성 확인',
    '7.시운전결과': '🧪 7. 시운전(TRY-OUT) 결과',
    '8.금형인계물류': '🚚 8. 금형 인계 및 물류'
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/production-transfer/checklist-master');
      if (response.data.success) {
        setItems(response.data.data.items);
        setGroupedItems(response.data.data.grouped);
        // 모든 카테고리 펼침
        const expanded = {};
        Object.keys(response.data.data.grouped).forEach(cat => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);
      }
    } catch (err) {
      console.error('체크리스트 마스터 조회 오류:', err);
      setError('체크리스트 마스터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleEdit = (item) => {
    setEditingItem(item.id);
    setFormData({
      category: item.category,
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description || '',
      is_required: item.is_required,
      requires_attachment: item.requires_attachment,
      attachment_type: item.attachment_type || '',
      display_order: item.display_order,
      is_active: item.is_active
    });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setFormData({
      category: categories[0],
      item_code: '',
      item_name: '',
      description: '',
      is_required: true,
      requires_attachment: false,
      attachment_type: '',
      display_order: 999,
      is_active: true
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsAddingNew(false);
    setFormData({
      category: '',
      item_code: '',
      item_name: '',
      description: '',
      is_required: true,
      requires_attachment: false,
      attachment_type: '',
      display_order: 0,
      is_active: true
    });
  };

  const handleSave = async () => {
    try {
      if (isAddingNew) {
        await api.post('/production-transfer/checklist-master', formData);
      } else {
        await api.put(`/production-transfer/checklist-master/${editingItem}`, formData);
      }
      handleCancel();
      fetchItems();
    } catch (err) {
      console.error('저장 오류:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getAttachmentIcon = (type) => {
    if (type === 'image') return <Image size={14} className="text-blue-500" />;
    if (type === 'document') return <FileText size={14} className="text-green-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                  <Settings className="mr-2" size={24} />
                  양산이관 체크리스트 마스터 관리
                </h1>
                <p className="text-sm text-gray-500">8개 카테고리, {items.length}개 항목</p>
              </div>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              항목 추가
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 신규 추가 폼 */}
        {isAddingNew && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Plus size={20} className="mr-2 text-blue-600" />
              새 항목 추가
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">항목 코드</label>
                <input
                  type="text"
                  name="item_code"
                  value={formData.item_code}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="예: BI007"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">항목명</label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="체크리스트 항목명 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">첨부파일 유형</label>
                <select
                  name="attachment_type"
                  value={formData.attachment_type}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">없음</option>
                  <option value="image">이미지</option>
                  <option value="document">문서</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="항목에 대한 상세 설명"
                />
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_required"
                    checked={formData.is_required}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">필수 항목</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requires_attachment"
                    checked={formData.requires_attachment}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">첨부파일 필요</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">활성화</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 카테고리별 항목 목록 */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryItems = groupedItems[category] || [];
            const isExpanded = expandedCategories[category];
            
            return (
              <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                {/* 카테고리 헤더 */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="ml-2 font-semibold text-gray-900">
                      {categoryLabels[category]}
                    </span>
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {categoryItems.length}개 항목
                    </span>
                  </div>
                </button>

                {/* 항목 목록 */}
                {isExpanded && (
                  <div className="divide-y">
                    {categoryItems.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        등록된 항목이 없습니다.
                      </div>
                    ) : (
                      categoryItems.map((item, index) => (
                        <div key={item.id} className="px-6 py-4">
                          {editingItem === item.id ? (
                            /* 수정 폼 */
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  name="item_code"
                                  value={formData.item_code}
                                  onChange={handleChange}
                                  className="border rounded px-3 py-2"
                                  placeholder="항목 코드"
                                />
                                <input
                                  type="text"
                                  name="item_name"
                                  value={formData.item_name}
                                  onChange={handleChange}
                                  className="border rounded px-3 py-2 md:col-span-2"
                                  placeholder="항목명"
                                />
                              </div>
                              <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                                rows={2}
                                placeholder="설명"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      name="is_required"
                                      checked={formData.is_required}
                                      onChange={handleChange}
                                      className="mr-2"
                                    />
                                    <span className="text-sm">필수</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      name="is_active"
                                      checked={formData.is_active}
                                      onChange={handleChange}
                                      className="mr-2"
                                    />
                                    <span className="text-sm">활성화</span>
                                  </label>
                                  <select
                                    name="attachment_type"
                                    value={formData.attachment_type}
                                    onChange={handleChange}
                                    className="border rounded px-2 py-1 text-sm"
                                  >
                                    <option value="">첨부없음</option>
                                    <option value="image">이미지</option>
                                    <option value="document">문서</option>
                                  </select>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleCancel}
                                    className="px-3 py-1 border rounded hover:bg-gray-50"
                                  >
                                    <X size={16} />
                                  </button>
                                  <button
                                    onClick={handleSave}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    <Save size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* 표시 모드 */
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                    {item.item_code}
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {item.item_name}
                                  </span>
                                  {item.is_required && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                      필수
                                    </span>
                                  )}
                                  {item.requires_attachment && (
                                    <span className="flex items-center text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                      {getAttachmentIcon(item.attachment_type)}
                                      <span className="ml-1">
                                        {item.attachment_type === 'image' ? '이미지' : '문서'}
                                      </span>
                                    </span>
                                  )}
                                  {!item.is_active && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                      비활성
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} className="text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 통계 요약 */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <List size={20} className="mr-2" />
            체크리스트 요약
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{items.length}</div>
              <div className="text-sm text-gray-600">전체 항목</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {items.filter(i => i.is_required).length}
              </div>
              <div className="text-sm text-gray-600">필수 항목</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(i => i.requires_attachment).length}
              </div>
              <div className="text-sm text-gray-600">첨부파일 필요</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(groupedItems).length}
              </div>
              <div className="text-sm text-gray-600">카테고리</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionTransferChecklistMaster;
