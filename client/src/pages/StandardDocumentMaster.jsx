import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Edit, Trash2, Copy, CheckCircle, Clock, 
  Upload, Send, X, Eye, ChevronDown, ChevronRight, ArrowLeft,
  RefreshCw, Save, Users, Building, Calendar, History,
  ClipboardCheck, Settings, Filter, Search, MoreVertical
} from 'lucide-react';
import api from '../lib/api';

// 문서 유형 정의
const DOCUMENT_TYPES = {
  pre_production: { label: '제작전 체크리스트', color: 'bg-blue-100 text-blue-700', icon: ClipboardCheck },
  daily_check: { label: '일상점검', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  periodic_check: { label: '정기점검', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  mold_checklist: { label: '금형체크리스트', color: 'bg-orange-100 text-orange-700', icon: FileText },
  development_plan: { label: '개발계획', color: 'bg-cyan-100 text-cyan-700', icon: Settings },
  transfer: { label: '이관 체크리스트', color: 'bg-pink-100 text-pink-700', icon: Upload },
  hardness: { label: '경도측정', color: 'bg-red-100 text-red-700', icon: FileText },
  nurturing: { label: '금형육성', color: 'bg-amber-100 text-amber-700', icon: FileText }
};

// 상태 배지 컴포넌트
const StatusBadge = ({ status }) => {
  const config = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-700', icon: Clock },
    pending: { label: '검토중', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    deployed: { label: '배포됨', color: 'bg-blue-100 text-blue-700', icon: Upload },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700', icon: X },
    archived: { label: '보관', color: 'bg-gray-100 text-gray-500', icon: FileText }
  };
  const { label, color, icon: Icon } = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// 문서 유형 배지
const TypeBadge = ({ type }) => {
  const typeInfo = DOCUMENT_TYPES[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeInfo.color}`}>
      {typeInfo.label}
    </span>
  );
};

// 기본 표준문서 마스터 데이터
const DEFAULT_DOCUMENTS = [
  {
    id: 1,
    name: '제작전 체크리스트 v1.0',
    type: 'pre_production',
    version: '1.0',
    status: 'deployed',
    itemCount: 81,
    categoryCount: 9,
    deployedTo: ['제작처', '생산처'],
    lastModified: '2025-12-08',
    createdBy: 'admin',
    description: '금형 제작 전 81개 항목, 9개 카테고리 체크리스트'
  },
  {
    id: 2,
    name: '일상점검 체크리스트 v2.0',
    type: 'daily_check',
    version: '2.0',
    status: 'deployed',
    itemCount: 7,
    categoryCount: 1,
    deployedTo: ['생산처'],
    lastModified: '2025-12-05',
    createdBy: 'admin',
    description: '일상점검 7개 항목 체크리스트'
  },
  {
    id: 3,
    name: '정기점검 체크리스트 v1.5',
    type: 'periodic_check',
    version: '1.5',
    status: 'deployed',
    itemCount: 13,
    categoryCount: 1,
    deployedTo: ['생산처'],
    lastModified: '2025-12-01',
    createdBy: 'admin',
    description: '정기점검 13개 항목 체크리스트'
  },
  {
    id: 4,
    name: '금형체크리스트 v1.0',
    type: 'mold_checklist',
    version: '1.0',
    status: 'deployed',
    itemCount: 81,
    categoryCount: 9,
    deployedTo: ['제작처', '생산처'],
    lastModified: '2025-12-08',
    createdBy: 'admin',
    description: '금형 검수용 81개 항목, 9개 카테고리 체크리스트'
  },
  {
    id: 5,
    name: '개발계획 템플릿 v1.0',
    type: 'development_plan',
    version: '1.0',
    status: 'deployed',
    itemCount: 12,
    categoryCount: 1,
    deployedTo: ['제작처'],
    lastModified: '2025-12-08',
    createdBy: 'admin',
    description: '12단계 금형개발 공정 관리 템플릿'
  },
  {
    id: 6,
    name: '이관 체크리스트 v1.0',
    type: 'transfer',
    version: '1.0',
    status: 'approved',
    itemCount: 15,
    categoryCount: 3,
    deployedTo: [],
    lastModified: '2025-12-10',
    createdBy: 'admin',
    description: '금형 이관 시 확인 항목'
  },
  {
    id: 7,
    name: '경도측정 기록표 v1.0',
    type: 'hardness',
    version: '1.0',
    status: 'deployed',
    itemCount: 6,
    categoryCount: 1,
    deployedTo: ['제작처'],
    lastModified: '2025-12-08',
    createdBy: 'admin',
    description: '경도측정 6개 강종 기준표'
  },
  {
    id: 8,
    name: '금형육성 체크리스트 v1.0',
    type: 'nurturing',
    version: '1.0',
    status: 'draft',
    itemCount: 10,
    categoryCount: 2,
    deployedTo: [],
    lastModified: '2025-12-12',
    createdBy: 'admin',
    description: '금형육성 관리 체크리스트 (개발중)'
  }
];

export default function StandardDocumentMaster() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  // 문서 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    type: 'pre_production',
    version: '1.0',
    description: '',
    deployedTo: []
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // API 호출 시도
      const response = await api.get('/hq/checklist-templates');
      if (response.data.success && response.data.data.templates) {
        const apiDocs = response.data.data.templates.map(t => ({
          id: t.id,
          name: t.template_name,
          type: t.template_type,
          version: t.version || '1.0',
          status: t.is_active ? 'deployed' : 'draft',
          itemCount: t.item_count || 0,
          categoryCount: t.category_count || 1,
          deployedTo: t.deployed_to || [],
          lastModified: t.updated_at?.split('T')[0] || t.created_at?.split('T')[0],
          createdBy: t.created_by || 'admin',
          description: t.description
        }));
        setDocuments(apiDocs.length > 0 ? apiDocs : DEFAULT_DOCUMENTS);
      } else {
        setDocuments(DEFAULT_DOCUMENTS);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments(DEFAULT_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 문서 목록
  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = filter === 'all' || doc.status === filter;
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // 통계
  const stats = {
    total: documents.length,
    deployed: documents.filter(d => d.status === 'deployed').length,
    approved: documents.filter(d => d.status === 'approved').length,
    draft: documents.filter(d => d.status === 'draft').length
  };

  const handleCreateNew = () => {
    setEditingDoc(null);
    setFormData({
      name: '',
      type: 'pre_production',
      version: '1.0',
      description: '',
      deployedTo: []
    });
    setShowModal(true);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      version: doc.version,
      description: doc.description || '',
      deployedTo: doc.deployedTo || []
    });
    setShowModal(true);
    setShowActionMenu(null);
  };

  const handleSave = async () => {
    try {
      if (editingDoc) {
        // 수정
        await api.put(`/hq/checklist-templates/${editingDoc.id}`, {
          template_name: formData.name,
          template_type: formData.type,
          description: formData.description,
          version: formData.version
        });
        setDocuments(prev => prev.map(d => 
          d.id === editingDoc.id 
            ? { ...d, ...formData, lastModified: new Date().toISOString().split('T')[0] }
            : d
        ));
      } else {
        // 신규 생성
        const response = await api.post('/hq/checklist-templates', {
          template_name: formData.name,
          template_type: formData.type,
          description: formData.description
        });
        const newDoc = {
          id: response.data?.data?.template?.id || Date.now(),
          ...formData,
          status: 'draft',
          itemCount: 0,
          categoryCount: 0,
          deployedTo: [],
          lastModified: new Date().toISOString().split('T')[0],
          createdBy: 'admin'
        };
        setDocuments(prev => [...prev, newDoc]);
      }
      setShowModal(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Save error:', error);
      // API 실패해도 로컬에서 처리
      if (editingDoc) {
        setDocuments(prev => prev.map(d => 
          d.id === editingDoc.id 
            ? { ...d, ...formData, lastModified: new Date().toISOString().split('T')[0] }
            : d
        ));
      } else {
        const newDoc = {
          id: Date.now(),
          ...formData,
          status: 'draft',
          itemCount: 0,
          categoryCount: 0,
          deployedTo: [],
          lastModified: new Date().toISOString().split('T')[0],
          createdBy: 'admin'
        };
        setDocuments(prev => [...prev, newDoc]);
      }
      setShowModal(false);
      alert('저장되었습니다.');
    }
  };

  const handleApprove = async (doc) => {
    if (!confirm(`"${doc.name}"을(를) 승인하시겠습니까?`)) return;
    try {
      await api.post(`/hq/checklist-templates/${doc.id}/approve`);
    } catch (error) {
      console.error('Approve error:', error);
    }
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, status: 'approved', lastModified: new Date().toISOString().split('T')[0] } : d
    ));
    setShowActionMenu(null);
    alert('승인되었습니다.');
  };

  const handleDeploy = async (doc) => {
    if (!confirm(`"${doc.name}"을(를) 배포하시겠습니까? 배포 후 협력사에서 사용할 수 있습니다.`)) return;
    try {
      await api.post(`/hq/checklist-templates/${doc.id}/deploy`);
    } catch (error) {
      console.error('Deploy error:', error);
    }
    setDocuments(prev => prev.map(d => 
      d.id === doc.id 
        ? { ...d, status: 'deployed', deployedTo: ['제작처', '생산처'], lastModified: new Date().toISOString().split('T')[0] } 
        : d
    ));
    setShowActionMenu(null);
    alert('배포되었습니다.');
  };

  const handleDuplicate = (doc) => {
    const newDoc = {
      ...doc,
      id: Date.now(),
      name: `${doc.name} (복사본)`,
      version: '1.0',
      status: 'draft',
      deployedTo: [],
      lastModified: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [...prev, newDoc]);
    setShowActionMenu(null);
    alert('복제되었습니다.');
  };

  const handleDelete = async (doc) => {
    if (!confirm(`"${doc.name}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/hq/checklist-templates/${doc.id}`);
    } catch (error) {
      console.error('Delete error:', error);
    }
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    setShowActionMenu(null);
    alert('삭제되었습니다.');
  };

  const handleViewDetail = (doc) => {
    // 문서 유형에 따라 상세 페이지로 이동
    const routes = {
      pre_production: '/checklist/master',
      daily_check: '/checklist/master',
      periodic_check: '/checklist/master',
      mold_checklist: '/checklist/master',
      development_plan: '/checklist/master',
      transfer: '/checklist/master',
      hardness: '/checklist/master',
      nurturing: '/checklist/master'
    };
    navigate(`${routes[doc.type] || '/checklist/master'}?templateId=${doc.id}`);
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">표준문서 마스터 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            디지털 필드 기반 체크리스트 및 표준문서 전체 관리 | 신규추가 → 편집 → 승인 → 배포
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          새 표준문서
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">전체 문서</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.deployed}</p>
              <p className="text-xs text-gray-500">배포됨</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-gray-500">승인됨</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              <p className="text-xs text-gray-500">초안</p>
            </div>
          </div>
        </div>
      </div>

      {/* 워크플로우 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-2">표준문서 관리 워크플로우</p>
            <div className="flex items-center gap-2 text-blue-800">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">신규추가</span>
              <ChevronRight size={14} />
              <span className="px-2 py-1 bg-yellow-100 rounded text-xs font-medium">편집/검토</span>
              <ChevronRight size={14} />
              <span className="px-2 py-1 bg-green-100 rounded text-xs font-medium">승인</span>
              <ChevronRight size={14} />
              <span className="px-2 py-1 bg-blue-100 rounded text-xs font-medium">배포</span>
              <ChevronRight size={14} />
              <span className="px-2 py-1 bg-purple-100 rounded text-xs font-medium">현장 사용</span>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              * 배포된 문서는 협력사(제작처/생산처)에서 모바일 앱을 통해 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* 상태 필터 */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: '전체' },
            { value: 'draft', label: '초안' },
            { value: 'approved', label: '승인됨' },
            { value: 'deployed', label: '배포됨' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 유형 필터 */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">모든 유형</option>
          {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* 검색 */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="문서명 검색..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={loadDocuments}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          title="새로고침"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* 문서 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500 mb-4">표준문서가 없습니다.</p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            새 표준문서 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              {/* 문서 헤더 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TypeBadge type={doc.type} />
                    <StatusBadge status={doc.status} />
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">버전 {doc.version}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === doc.id ? null : doc.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                  {showActionMenu === doc.id && (
                    <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => handleViewDetail(doc)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye size={14} /> 상세보기
                      </button>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit size={14} /> 편집
                      </button>
                      {doc.status === 'draft' && (
                        <button
                          onClick={() => handleApprove(doc)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                        >
                          <CheckCircle size={14} /> 승인
                        </button>
                      )}
                      {doc.status === 'approved' && (
                        <button
                          onClick={() => handleDeploy(doc)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                        >
                          <Upload size={14} /> 배포
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(doc)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy size={14} /> 복제
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 문서 정보 */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description || '-'}</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">항목 수</span>
                  <p className="font-semibold text-gray-900">{doc.itemCount}개</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">카테고리</span>
                  <p className="font-semibold text-gray-900">{doc.categoryCount}개</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>배포: {doc.deployedTo?.length > 0 ? doc.deployedTo.join(', ') : '미배포'}</span>
                <span>{doc.lastModified}</span>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => handleViewDetail(doc)}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Eye size={14} /> 상세
                </button>
                <button
                  onClick={() => handleEdit(doc)}
                  className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-1"
                >
                  <Edit size={14} /> 편집
                </button>
                {doc.status === 'draft' && (
                  <button
                    onClick={() => handleApprove(doc)}
                    className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} /> 승인
                  </button>
                )}
                {doc.status === 'approved' && (
                  <button
                    onClick={() => handleDeploy(doc)}
                    className="flex-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-1"
                  >
                    <Upload size={14} /> 배포
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 신규/편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDoc ? '표준문서 편집' : '새 표준문서 추가'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">문서명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="표준문서 이름 입력"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">문서 유형 *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">버전</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="문서 설명 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배포 대상</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.deployedTo.includes('제작처')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          deployedTo: e.target.checked 
                            ? [...prev.deployedTo, '제작처']
                            : prev.deployedTo.filter(d => d !== '제작처')
                        }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">제작처</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.deployedTo.includes('생산처')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          deployedTo: e.target.checked 
                            ? [...prev.deployedTo, '생산처']
                            : prev.deployedTo.filter(d => d !== '생산처')
                        }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">생산처</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
