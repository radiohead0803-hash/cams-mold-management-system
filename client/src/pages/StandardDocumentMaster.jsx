import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Search, Filter, Edit, Trash2, Save, X, RefreshCw,
  ChevronDown, ChevronRight, MoreVertical, CheckCircle, Clock, Send,
  Copy, History, Eye, AlertCircle, Shield, ChevronUp, XCircle
} from 'lucide-react';
import api from '../lib/api';

const DOCUMENT_TYPES = {
  pre_production: { label: '제작전 체크리스트', color: 'blue' },
  daily_check: { label: '일상점검 체크리스트', color: 'green' },
  periodic_check: { label: '정기점검 체크리스트', color: 'purple' },
  mold_checklist: { label: '금형체크리스트', color: 'orange' },
  development_plan: { label: '금형개발계획', color: 'cyan' },
  transfer: { label: '양산이관 체크리스트', color: 'pink' },
  hardness: { label: '경도측정 기준서', color: 'amber' },
  nurturing: { label: '금형육성 단계', color: 'teal' },
  repair_shipment_checklist: { label: '수리출하 점검표', color: 'red' }
};

const STATUS_CONFIG = {
  draft: { label: '초안', color: 'gray', icon: Edit, bg: 'bg-gray-100 text-gray-700' },
  pending: { label: '승인대기', color: 'yellow', icon: Clock, bg: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인완료', color: 'green', icon: CheckCircle, bg: 'bg-green-100 text-green-700' },
  deployed: { label: '배포완료', color: 'blue', icon: Send, bg: 'bg-blue-100 text-blue-700' },
  rejected: { label: '반려', color: 'red', icon: XCircle, bg: 'bg-red-100 text-red-700' },
  archived: { label: '보관', color: 'gray', icon: FileText, bg: 'bg-gray-100 text-gray-500' }
};

const TYPE_COLORS = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  red: 'bg-red-50 text-red-700 border-red-200'
};

// ===== Helper: 항목 수 계산 =====
function countTotalItems(items, structure) {
  if (!items || !Array.isArray(items)) return 0;
  if (structure === 'nested') {
    return items.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  }
  return items.length;
}

// ===== Helper: 항목 구조 감지 =====
function detectStructure(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return 'flat';
  return items[0]?.items ? 'nested' : 'flat';
}

export default function StandardDocumentMaster() {
  // === 목록 상태 ===
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(null);

  // === 편집 모달 ===
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'pre_production', version: '1.0',
    description: '', deployedTo: [], developmentStage: 'all'
  });
  const [editItems, setEditItems] = useState([]);
  const [itemsStructure, setItemsStructure] = useState('flat');
  const [loadingItems, setLoadingItems] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});

  // === 이력 모달 ===
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // === 개정 모달 ===
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [reviseDoc, setReviseDoc] = useState(null);
  const [reviseForm, setReviseForm] = useState({ new_version: '', revision_reason: '' });

  // === 상세보기 모달 ===
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDoc, setDetailDoc] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ===== 데이터 로드 =====
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType) params.template_type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.q = searchQuery;
      const res = await api.get('/standard-document-templates', { params });
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error('문서 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchQuery]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // ===== 편집 모달 열기 =====
  const handleEdit = async (doc) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.template_name,
      type: doc.template_type,
      version: doc.version || '1.0',
      description: doc.description || '',
      deployedTo: doc.deployed_to || [],
      developmentStage: doc.development_stage || 'all'
    });
    setShowModal(true);
    setShowActionMenu(null);

    // 항목 로드
    setLoadingItems(true);
    try {
      const res = await api.get(`/standard-document-templates/${doc.id}`);
      const tmpl = res.data?.data;
      if (tmpl?.items && Array.isArray(tmpl.items) && tmpl.items.length > 0) {
        setEditItems(JSON.parse(JSON.stringify(tmpl.items)));
        setItemsStructure(detectStructure(tmpl.items));
        if (detectStructure(tmpl.items) === 'nested') {
          const exp = {};
          tmpl.items.forEach((_, i) => { exp[i] = false; });
          setExpandedCats(exp);
        }
      } else {
        setEditItems([]);
        setItemsStructure('flat');
      }
    } catch (e) {
      console.error('항목 로드 실패:', e);
      setEditItems([]);
      setItemsStructure('flat');
    } finally {
      setLoadingItems(false);
    }
  };

  // ===== 새 문서 =====
  const handleNew = () => {
    setEditingDoc(null);
    setFormData({ name: '', type: 'pre_production', version: '1.0', description: '', deployedTo: [], developmentStage: 'all' });
    setEditItems([]);
    setItemsStructure('flat');
    setExpandedCats({});
    setShowModal(true);
  };

  // ===== 저장 =====
  const handleSave = async () => {
    try {
      if (editingDoc) {
        const payload = {
          template_name: formData.name,
          template_type: formData.type,
          description: formData.description,
          version: formData.version,
          development_stage: formData.developmentStage,
          deployed_to: formData.deployedTo,
          items: editItems,
          item_count: countTotalItems(editItems, itemsStructure),
          category_count: itemsStructure === 'nested' ? editItems.length : 1
        };
        await api.patch(`/standard-document-templates/${editingDoc.id}`, payload);
        alert('저장되었습니다.');
      } else {
        const res = await api.post('/standard-document-templates', {
          template_name: formData.name,
          template_type: formData.type,
          description: formData.description,
          development_stage: formData.developmentStage
        });
        if (editItems.length > 0 && res.data?.data?.id) {
          await api.patch(`/standard-document-templates/${res.data.data.id}`, {
            items: editItems,
            item_count: countTotalItems(editItems, itemsStructure),
            category_count: itemsStructure === 'nested' ? editItems.length : 1
          });
        }
        alert('생성되었습니다.');
      }
      setShowModal(false);
      fetchDocuments();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장 실패: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  // ===== 삭제 =====
  const handleDelete = async (doc) => {
    if (!window.confirm(`"${doc.template_name}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/standard-document-templates/${doc.id}`);
      alert('삭제되었습니다.');
      fetchDocuments();
    } catch (err) {
      alert('삭제 실패: ' + (err.response?.data?.error?.message || err.message));
    }
    setShowActionMenu(null);
  };

  // ===== 승인/배포/반려 =====
  const handleApprove = async (doc) => {
    if (!window.confirm(`"${doc.template_name}" v${doc.version}을(를) 승인하시겠습니까?`)) return;
    try {
      await api.post(`/standard-document-templates/${doc.id}/approve`);
      alert('승인되었습니다.');
      fetchDocuments();
    } catch (err) {
      alert('승인 실패: ' + (err.response?.data?.error?.message || err.message));
    }
    setShowActionMenu(null);
  };

  const handleDeploy = async (doc) => {
    if (!window.confirm(`"${doc.template_name}" v${doc.version}을(를) 배포하시겠습니까?`)) return;
    try {
      await api.post(`/standard-document-templates/${doc.id}/deploy`, { deployed_to: ['제작처', '생산처'] });
      alert('배포되었습니다.');
      fetchDocuments();
    } catch (err) {
      alert('배포 실패: ' + (err.response?.data?.error?.message || err.message));
    }
    setShowActionMenu(null);
  };

  const handleReject = async (doc) => {
    if (!window.confirm(`"${doc.template_name}"을(를) 반려하시겠습니까?`)) return;
    try {
      await api.post(`/standard-document-templates/${doc.id}/reject`);
      alert('반려되었습니다.');
      fetchDocuments();
    } catch (err) {
      alert('반려 실패: ' + (err.response?.data?.error?.message || err.message));
    }
    setShowActionMenu(null);
  };

  // ===== 복제 =====
  const handleDuplicate = async (doc) => {
    try {
      await api.post(`/standard-document-templates/${doc.id}/duplicate`);
      alert('복제되었습니다.');
      fetchDocuments();
    } catch (err) {
      alert('복제 실패: ' + (err.response?.data?.error?.message || err.message));
    }
    setShowActionMenu(null);
  };

  // ===== 개정 =====
  const openReviseModal = (doc) => {
    const parts = (doc.version || '1.0').split('.');
    const nextMinor = `${parts[0]}.${parseInt(parts[1] || 0) + 1}`;
    setReviseDoc(doc);
    setReviseForm({ new_version: nextMinor, revision_reason: '' });
    setShowReviseModal(true);
    setShowActionMenu(null);
  };

  const handleRevise = async () => {
    if (!reviseForm.new_version) { alert('새 버전을 입력하세요.'); return; }
    try {
      const res = await api.post(`/standard-document-templates/${reviseDoc.id}/revise`, {
        new_version: reviseForm.new_version,
        revision_reason: reviseForm.revision_reason
      });
      alert(res.data?.message || '개정되었습니다.');
      setShowReviseModal(false);
      fetchDocuments();
    } catch (err) {
      alert('개정 실패: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  // ===== 이력 조회 =====
  const openHistory = async (doc) => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setShowActionMenu(null);
    try {
      const res = await api.get(`/standard-document-templates/${doc.id}/history`);
      setHistoryData(res.data?.data);
    } catch (err) {
      console.error('이력 조회 실패:', err);
      setHistoryData({ template_name: doc.template_name, history: [] });
    } finally {
      setLoadingHistory(false);
    }
  };

  // ===== 상세보기 =====
  const openDetail = async (doc) => {
    setDetailDoc(doc);
    setShowDetailModal(true);
    setLoadingDetail(true);
    setShowActionMenu(null);
    try {
      const res = await api.get(`/standard-document-templates/${doc.id}`);
      const tmpl = res.data?.data;
      setDetailItems(tmpl?.items || []);
    } catch (e) {
      console.error('상세 조회 실패:', e);
      setDetailItems([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ===== Flat 항목 조작 =====
  const handleAddItem = () => {
    if (itemsStructure === 'nested') {
      setEditItems(prev => [...prev, { id: `cat_${Date.now()}`, title: '', items: [] }]);
    } else {
      setEditItems(prev => [...prev, { id: `item_${Date.now()}`, item_name: '', item_type: 'check', is_required: false }]);
    }
  };
  const handleItemChange = (idx, field, value) => {
    setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const handleRemoveItem = (idx) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };
  const handleMoveItem = (idx, dir) => {
    setEditItems(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  // ===== Nested 항목 조작 =====
  const handleCatTitleChange = (catIdx, value) => {
    setEditItems(prev => prev.map((c, i) => i === catIdx ? { ...c, title: value } : c));
  };
  const handleMoveCat = (catIdx, dir) => {
    setEditItems(prev => {
      const arr = [...prev];
      const target = dir === 'up' ? catIdx - 1 : catIdx + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[catIdx], arr[target]] = [arr[target], arr[catIdx]];
      return arr;
    });
  };
  const handleRemoveCategory = (catIdx) => {
    setEditItems(prev => prev.filter((_, i) => i !== catIdx));
  };
  const handleAddSubItem = (catIdx) => {
    setEditItems(prev => prev.map((c, i) =>
      i === catIdx
        ? { ...c, items: [...(c.items || []), { id: `sub_${Date.now()}`, item_name: '', item_type: 'check', is_required: false }] }
        : c
    ));
  };
  const handleSubItemChange = (catIdx, subIdx, field, value) => {
    setEditItems(prev => prev.map((c, ci) =>
      ci === catIdx
        ? { ...c, items: c.items.map((s, si) => si === subIdx ? { ...s, [field]: value } : s) }
        : c
    ));
  };
  const handleRemoveSubItem = (catIdx, subIdx) => {
    setEditItems(prev => prev.map((c, ci) =>
      ci === catIdx
        ? { ...c, items: c.items.filter((_, si) => si !== subIdx) }
        : c
    ));
  };

  // ===== 통계 =====
  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    deployed: documents.filter(d => d.status === 'deployed').length
  };

  // ===================== RENDER =====================
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={28} />
            표준문서 마스터
          </h1>
          <p className="text-sm text-gray-500 mt-1">체크리스트, 기준서, 개발계획 등 표준문서를 통합 관리합니다.</p>
        </div>
        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={18} /> 새 문서
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: '전체', value: stats.total, color: 'border-gray-300 bg-white' },
          { label: '초안', value: stats.draft, color: 'border-gray-300 bg-gray-50' },
          { label: '승인대기', value: stats.pending, color: 'border-yellow-300 bg-yellow-50' },
          { label: '승인완료', value: stats.approved, color: 'border-green-300 bg-green-50' },
          { label: '배포완료', value: stats.deployed, color: 'border-blue-300 bg-blue-50' }
        ].map(s => (
          <div key={s.label} className={`border rounded-lg px-4 py-3 ${s.color}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 필터 & 검색 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="문서명, 코드 검색..."
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 유형</option>
          {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button onClick={fetchDocuments} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">문서명</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-40">유형</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-20">버전</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-24">상태</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-20">항목수</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-24">적용단계</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-24">작성일</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-16">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                로딩 중...
              </td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                등록된 문서가 없습니다.
              </td></tr>
            ) : documents.map((doc, idx) => {
              const typeConf = DOCUMENT_TYPES[doc.template_type] || { label: doc.template_type, color: 'gray' };
              const statusConf = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusConf.icon;
              return (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(doc)}>
                  <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-gray-900">{doc.template_name}</div>
                    {doc.template_code && <div className="text-xs text-gray-400 mt-0.5">{doc.template_code}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[typeConf.color] || 'bg-gray-50 text-gray-700'}`}>
                      {typeConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-mono font-medium text-gray-700">v{doc.version || '1.0'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.bg}`}>
                      <StatusIcon size={12} />
                      {statusConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{doc.item_count || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-500">
                      {doc.development_stage === 'all' ? '전체' : doc.development_stage === 'development' ? '개발' : '양산'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowActionMenu(showActionMenu === doc.id ? null : doc.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {showActionMenu === doc.id && (
                      <div className="absolute right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-40">
                        <button onClick={() => openDetail(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Eye size={14} /> 상세보기
                        </button>
                        <button onClick={() => handleEdit(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Edit size={14} /> 편집
                        </button>
                        <button onClick={() => openHistory(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <History size={14} /> 이력보기
                        </button>
                        <button onClick={() => openReviseModal(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <RefreshCw size={14} /> 개정
                        </button>
                        {doc.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700 flex items-center gap-2">
                              <CheckCircle size={14} /> 승인
                            </button>
                            <button onClick={() => handleReject(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2">
                              <XCircle size={14} /> 반려
                            </button>
                          </>
                        )}
                        {doc.status === 'approved' && (
                          <button onClick={() => handleDeploy(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2">
                            <Send size={14} /> 배포
                          </button>
                        )}
                        <button onClick={() => handleDuplicate(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                          <Copy size={14} /> 복제
                        </button>
                        <hr className="my-1" />
                        <button onClick={() => handleDelete(doc)} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          총 {documents.length}건
        </div>
      </div>

      {/* ===================== 상세보기 모달 ===================== */}
      {showDetailModal && detailDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detailDoc.template_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[DOCUMENT_TYPES[detailDoc.template_type]?.color] || ''}`}>
                    {DOCUMENT_TYPES[detailDoc.template_type]?.label || detailDoc.template_type}
                  </span>
                  <span className="text-sm font-mono text-gray-500">v{detailDoc.version || '1.0'}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[detailDoc.status]?.bg || ''}`}>
                    {STATUS_CONFIG[detailDoc.status]?.label || detailDoc.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">문서코드</p>
                  <p className="text-sm font-medium">{detailDoc.template_code || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">적용단계</p>
                  <p className="text-sm font-medium">{detailDoc.development_stage === 'all' ? '전체' : detailDoc.development_stage === 'development' ? '개발' : '양산'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">항목수</p>
                  <p className="text-sm font-medium">{detailDoc.item_count || 0}개</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">배포대상</p>
                  <p className="text-sm font-medium">{(detailDoc.deployed_to || []).join(', ') || '미지정'}</p>
                </div>
              </div>
              {detailDoc.description && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">설명</p>
                  <p className="text-sm text-gray-700">{detailDoc.description}</p>
                </div>
              )}

              {/* 항목 목록 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">항목 목록</h3>
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mr-2" /> 로딩 중...
                  </div>
                ) : detailItems.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">항목이 없습니다.</p>
                ) : detectStructure(detailItems) === 'nested' ? (
                  <div className="space-y-2">
                    {detailItems.map((cat, catIdx) => (
                      <div key={catIdx} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 font-medium text-sm flex items-center gap-2">
                          <span className="text-gray-400">{catIdx + 1}.</span>
                          {cat.title || cat.id || '카테고리'}
                          <span className="text-xs text-gray-400 ml-auto">{cat.items?.length || 0}개</span>
                        </div>
                        {cat.items && cat.items.length > 0 && (
                          <table className="min-w-full text-sm">
                            <thead><tr className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                              <th className="px-3 py-1 text-center w-8">#</th>
                              <th className="px-3 py-1 text-left">항목명</th>
                              <th className="px-3 py-1 text-center w-20">유형</th>
                              <th className="px-3 py-1 text-center w-12">필수</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                              {cat.items.map((item, itemIdx) => (
                                <tr key={itemIdx} className="hover:bg-gray-50">
                                  <td className="px-3 py-1.5 text-center text-gray-400 text-xs">{itemIdx + 1}</td>
                                  <td className="px-3 py-1.5 text-sm">{item.item_name || item.name || '-'}</td>
                                  <td className="px-3 py-1.5 text-center text-xs text-gray-500">{item.item_type || item.type || 'check'}</td>
                                  <td className="px-3 py-1.5 text-center">
                                    {(item.is_required || item.required) && <CheckCircle size={14} className="text-green-500 mx-auto" />}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-3 py-2 text-center text-xs w-10">#</th>
                        <th className="px-3 py-2 text-left text-xs">항목명</th>
                        <th className="px-3 py-2 text-center text-xs w-24">유형</th>
                        <th className="px-3 py-2 text-center text-xs w-12">필수</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-2">{item.item_name || item.name || item.grade || '-'}</td>
                            <td className="px-3 py-2 text-center text-xs text-gray-500">{item.item_type || item.type || 'check'}</td>
                            <td className="px-3 py-2 text-center">
                              {(item.is_required || item.required) && <CheckCircle size={14} className="text-green-500 mx-auto" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 승인/배포 정보 */}
              {(detailDoc.approved_by_name || detailDoc.deployed_by_name) && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {detailDoc.approved_by_name && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600">승인</p>
                      <p className="text-sm font-medium">{detailDoc.approved_by_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{detailDoc.approved_at ? new Date(detailDoc.approved_at).toLocaleString('ko-KR') : ''}</p>
                    </div>
                  )}
                  {detailDoc.deployed_by_name && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600">배포</p>
                      <p className="text-sm font-medium">{detailDoc.deployed_by_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{detailDoc.deployed_at ? new Date(detailDoc.deployed_at).toLocaleString('ko-KR') : ''}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 shrink-0">
              <button onClick={() => { setShowDetailModal(false); handleEdit(detailDoc); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                <Edit size={16} /> 편집
              </button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 이력 모달 ===================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <History size={20} className="text-purple-600" /> 개정 이력
                </h2>
                {historyData && <p className="text-sm text-gray-500 mt-0.5">{historyData.template_name}</p>}
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <RefreshCw size={20} className="animate-spin mr-2" /> 이력 로딩 중...
                </div>
              ) : !historyData?.history?.length ? (
                <p className="text-center text-gray-400 py-8">개정 이력이 없습니다.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {[...historyData.history].reverse().map((h, idx) => (
                      <div key={idx} className="relative pl-12">
                        <div className={`absolute left-3.5 top-1.5 w-3 h-3 rounded-full border-2 ${h.is_current ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`} />
                        <div className={`border rounded-lg p-3 ${h.is_current ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm">v{h.version}</span>
                              {h.is_current && <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded">현재</span>}
                              {h.status && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_CONFIG[h.status]?.bg || 'bg-gray-100'}`}>
                                  {STATUS_CONFIG[h.status]?.label || h.status}
                                </span>
                              )}
                            </div>
                            {h.item_count !== null && h.item_count !== undefined && (
                              <span className="text-xs text-gray-400">{h.item_count}개 항목</span>
                            )}
                          </div>
                          {h.revision_reason && !h.is_current && (
                            <p className="text-sm text-gray-600 mt-1">{h.revision_reason}</p>
                          )}
                          {h.revised_by_name && (
                            <p className="text-xs text-gray-400 mt-1">
                              {h.revised_by_name} · {h.revised_at ? new Date(h.revised_at).toLocaleString('ko-KR') : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== 개정 모달 ===================== */}
      {showReviseModal && reviseDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReviseModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw size={20} className="text-orange-600" /> 개정 요청
              </h2>
              <button onClick={() => setShowReviseModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">대상 문서</p>
                <p className="text-sm font-medium">{reviseDoc.template_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">현재 버전: v{reviseDoc.version || '1.0'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 버전</label>
                <input
                  type="text"
                  value={reviseForm.new_version}
                  onChange={(e) => setReviseForm(prev => ({ ...prev, new_version: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 2.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">개정 사유</label>
                <textarea
                  value={reviseForm.revision_reason}
                  onChange={(e) => setReviseForm(prev => ({ ...prev, revision_reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="개정 사유를 입력하세요"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                <AlertCircle size={14} className="inline mr-1" />
                개정 시 현재 버전이 이력에 보관되고, 새 버전은 <strong>승인대기</strong> 상태로 전환됩니다.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button onClick={() => setShowReviseModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">취소</button>
              <button
                onClick={handleRevise}
                disabled={!reviseForm.new_version}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw size={16} /> 개정 요청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 편집 모달 ===================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editingDoc ? '표준문서 편집' : '새 표준문서'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">문서명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="표준문서명 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">적용단계</label>
                <div className="flex gap-4">
                  {[{ value: 'all', label: '전체' }, { value: 'development', label: '개발' }, { value: 'production', label: '양산' }].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="developmentStage"
                        value={opt.value}
                        checked={formData.developmentStage === opt.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, developmentStage: e.target.value }))}
                        className="rounded"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배포 대상</label>
                <div className="flex gap-4">
                  {['제작처', '생산처'].map(target => (
                    <label key={target} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.deployedTo.includes(target)}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            deployedTo: e.target.checked
                              ? [...prev.deployedTo, target]
                              : prev.deployedTo.filter(d => d !== target)
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{target}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 항목 관리 섹션 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    항목 관리
                    {editItems.length > 0 && (
                      <span className="text-blue-600 font-normal ml-1">
                        ({itemsStructure === 'nested'
                          ? `${editItems.length}개 카테고리, ${countTotalItems(editItems, 'nested')}개 항목`
                          : `${editItems.length}개`})
                      </span>
                    )}
                    {itemsStructure === 'nested' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded">카테고리 구조</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    {itemsStructure === 'flat' && editItems.length === 0 && (
                      <button
                        onClick={() => { setItemsStructure('nested'); setExpandedCats({}); }}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-purple-300 text-purple-700 rounded hover:bg-purple-50"
                      >
                        카테고리 구조로 전환
                      </button>
                    )}
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={14} />
                      {itemsStructure === 'nested' ? '카테고리 추가' : '항목 추가'}
                    </button>
                  </div>
                </div>

                {loadingItems ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mr-2" />
                    항목 로드 중...
                  </div>
                ) : editItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">항목이 없습니다. '항목 추가' 버튼을 클릭하세요.</p>
                  </div>
                ) : itemsStructure === 'nested' ? (
                  /* ========== 카테고리 중첩 구조 편집 ========== */
                  <div className="space-y-3">
                    {editItems.map((cat, catIdx) => (
                      <div key={cat.id || catIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 flex items-center gap-2">
                          <button
                            onClick={() => setExpandedCats(prev => ({ ...prev, [catIdx]: !prev[catIdx] }))}
                            className="p-0.5 text-gray-500 hover:text-gray-700"
                          >
                            {expandedCats[catIdx] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <span className="text-xs text-gray-400 w-6">{catIdx + 1}.</span>
                          <input
                            type="text"
                            value={cat.title || cat.id || ''}
                            onChange={(e) => handleCatTitleChange(catIdx, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500"
                            placeholder="카테고리명 입력"
                          />
                          <span className="text-xs text-gray-400">{cat.items?.length || 0}개</span>
                          <div className="flex gap-0.5">
                            <button onClick={() => handleMoveCat(catIdx, 'up')} disabled={catIdx === 0}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                              <ChevronUp size={14} />
                            </button>
                            <button onClick={() => handleMoveCat(catIdx, 'down')} disabled={catIdx === editItems.length - 1}
                              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                              <ChevronDown size={14} />
                            </button>
                          </div>
                          <button onClick={() => handleRemoveCategory(catIdx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {expandedCats[catIdx] && (
                          <div className="px-3 pb-2">
                            {cat.items && cat.items.length > 0 ? (
                              <table className="min-w-full text-sm mt-1">
                                <thead>
                                  <tr className="text-[10px] text-gray-400 uppercase">
                                    <th className="px-1 py-1 text-center w-8">#</th>
                                    <th className="px-1 py-1 text-left">항목명</th>
                                    <th className="px-1 py-1 text-center w-20">유형</th>
                                    <th className="px-1 py-1 text-center w-10">필수</th>
                                    <th className="px-1 py-1 text-center w-10">삭제</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cat.items.map((subItem, subIdx) => (
                                    <tr key={subItem.id || subIdx} className="hover:bg-gray-50">
                                      <td className="px-1 py-1 text-center text-gray-300 text-xs">{subIdx + 1}</td>
                                      <td className="px-1 py-1">
                                        <input
                                          type="text"
                                          value={subItem.item_name || subItem.name || ''}
                                          onChange={(e) => handleSubItemChange(catIdx, subIdx, subItem.item_name !== undefined ? 'item_name' : 'name', e.target.value)}
                                          className="w-full px-2 py-0.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500"
                                          placeholder="항목명"
                                        />
                                      </td>
                                      <td className="px-1 py-1">
                                        <select
                                          value={subItem.item_type || subItem.type || 'check'}
                                          onChange={(e) => handleSubItemChange(catIdx, subIdx, subItem.item_type !== undefined ? 'item_type' : 'type', e.target.value)}
                                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs"
                                        >
                                          <option value="check">예/아니오</option>
                                          <option value="text">텍스트</option>
                                          <option value="number">숫자</option>
                                          <option value="select">선택</option>
                                        </select>
                                      </td>
                                      <td className="px-1 py-1 text-center">
                                        <input type="checkbox"
                                          checked={subItem.is_required || subItem.required || false}
                                          onChange={(e) => handleSubItemChange(catIdx, subIdx, 'is_required', e.target.checked)}
                                          className="w-3.5 h-3.5 text-blue-600 rounded" />
                                      </td>
                                      <td className="px-1 py-1 text-center">
                                        <button onClick={() => handleRemoveSubItem(catIdx, subIdx)}
                                          className="p-0.5 text-red-400 hover:text-red-600 rounded">
                                          <Trash2 size={12} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-gray-400 py-2 text-center">하위 항목 없음</p>
                            )}
                            <button
                              onClick={() => handleAddSubItem(catIdx)}
                              className="mt-1 flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Plus size={12} /> 항목 추가
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 mt-1">
                      총 {editItems.length}개 카테고리, {countTotalItems(editItems, 'nested')}개 항목
                    </div>
                  </div>
                ) : (
                  /* ========== Flat 구조 편집 ========== */
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs text-gray-500 w-12">순서</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">항목명</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-500 w-24">필드 유형</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-500 w-12">필수</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-500 w-16">이동</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-500 w-12">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-center text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.item_name || item.name || item.grade || ''}
                                onChange={(e) => handleItemChange(idx, item.item_name !== undefined ? 'item_name' : item.grade !== undefined ? 'grade' : 'name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="항목명 입력"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={item.item_type || item.type || 'check'}
                                onChange={(e) => handleItemChange(idx, item.item_type !== undefined ? 'item_type' : 'type', e.target.value)}
                                className="w-full px-1 py-1 border border-gray-200 rounded text-xs"
                              >
                                <option value="check">예/아니오</option>
                                <option value="text">텍스트</option>
                                <option value="number">숫자</option>
                                <option value="select">선택</option>
                                <option value="date">날짜</option>
                                <option value="photo">사진</option>
                              </select>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.is_required || item.required || false}
                                onChange={(e) => handleItemChange(idx, item.is_required !== undefined ? 'is_required' : 'required', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex justify-center gap-0.5">
                                <button onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0}
                                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                                  <ChevronUp size={14} />
                                </button>
                                <button onClick={() => handleMoveItem(idx, 'down')} disabled={idx === editItems.length - 1}
                                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                      총 {editItems.length}개 항목
                      {editItems.filter(i => i.is_required || i.required).length > 0 && (
                        <span> (필수: {editItems.filter(i => i.is_required || i.required).length}개)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 shrink-0">
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

      {/* 클릭 외부 닫기 */}
      {showActionMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(null)} />
      )}
    </div>
  );
}
