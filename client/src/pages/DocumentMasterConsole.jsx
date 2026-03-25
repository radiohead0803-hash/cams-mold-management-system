import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit3, Eye, Copy, Send, CheckCircle, Rocket, RefreshCw,
  FileText, Settings, Clock, Trash2, Truck, ClipboardList, ChevronDown,
  ChevronUp, Filter, BarChart3, X, MoreVertical, Shield, Archive, ListChecks
} from 'lucide-react';
import api, { checklistMasterAPI, standardDocumentAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// ========== 문서 유형 정의 ==========
const DOC_TYPES = {
  checklist_master: { label: '점검 마스터', icon: ClipboardList, color: 'bg-blue-100 text-blue-700', group: 'checklist' },
  pre_production: { label: '제작전 체크리스트', icon: ListChecks, color: 'bg-indigo-100 text-indigo-700', group: 'checklist' },
  daily_check: { label: '일상점검', icon: ClipboardList, color: 'bg-green-100 text-green-700', group: 'inspection' },
  periodic_check: { label: '정기점검', icon: Settings, color: 'bg-purple-100 text-purple-700', group: 'inspection' },
  mold_checklist: { label: '금형체크리스트', icon: FileText, color: 'bg-orange-100 text-orange-700', group: 'checklist' },
  development_plan: { label: '개발계획', icon: BarChart3, color: 'bg-cyan-100 text-cyan-700', group: 'document' },
  transfer: { label: '이관 체크리스트', icon: Truck, color: 'bg-pink-100 text-pink-700', group: 'transfer' },
  hardness: { label: '경도측정', icon: Shield, color: 'bg-red-100 text-red-700', group: 'inspection' },
  hardness_standards: { label: '경도기준 마스터', icon: Shield, color: 'bg-red-100 text-red-700', group: 'inspection' },
  repair_shipment_checklist: { label: '수리출하점검', icon: ClipboardList, color: 'bg-teal-100 text-teal-700', group: 'checklist' },
  nurturing: { label: '금형육성', icon: Archive, color: 'bg-amber-100 text-amber-700', group: 'document' },
  transfer_master: { label: '이관 마스터', icon: Truck, color: 'bg-rose-100 text-rose-700', group: 'transfer' }
};

const STATUS_CONFIG = {
  draft: { label: '초안', color: 'bg-gray-100 text-gray-800', icon: Edit3 },
  review: { label: '검토중', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending: { label: '승인대기', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  deployed: { label: '배포됨', color: 'bg-green-100 text-green-800', icon: Rocket },
  rejected: { label: '반려', color: 'bg-red-100 text-red-800', icon: X },
  archived: { label: '보관', color: 'bg-gray-100 text-gray-600', icon: Archive },
  active: { label: '활성', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

const TAB_GROUPS = [
  { key: 'all', label: '전체', icon: FileText },
  { key: 'checklist', label: '체크리스트형', icon: ClipboardList },
  { key: 'inspection', label: '점검형', icon: Settings },
  { key: 'document', label: '일반문서형', icon: FileText },
  { key: 'transfer', label: '이관형', icon: Truck },
  { key: 'approval', label: '승인/배포 현황', icon: CheckCircle }
];

export default function DocumentMasterConsole() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 데이터 소스
  const [checklistVersions, setChecklistVersions] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistCycles, setChecklistCycles] = useState([]);
  const [standardDocs, setStandardDocs] = useState([]);
  const [transferMasterItems, setTransferMasterItems] = useState([]);

  // 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => { loadAllData(); }, []);

  // ========== 3개 API 통합 로드 ==========
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [versionsRes, itemsRes, cyclesRes] = await Promise.all([
        checklistMasterAPI.getVersions().catch(() => ({ data: { data: [] } })),
        checklistMasterAPI.getItems().catch(() => ({ data: { data: [] } })),
        checklistMasterAPI.getCycles().catch(() => ({ data: { data: [] } }))
      ]);
      setChecklistVersions(versionsRes.data?.data || []);
      setChecklistItems(itemsRes.data?.data || []);
      setChecklistCycles(cyclesRes.data?.data || []);

      try {
        const docRes = await standardDocumentAPI.getAll();
        setStandardDocs(Array.isArray(docRes.data?.data) ? docRes.data.data : []);
      } catch { setStandardDocs([]); }

      try {
        const trRes = await api.get('/production-transfer/checklist-master');
        setTransferMasterItems(trRes.data?.data?.items || trRes.data?.data || []);
      } catch { setTransferMasterItems([]); }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== 어댑터: 3개 데이터소스 → 통합 목록 ==========
  const unifiedList = useMemo(() => {
    const list = [];

    // 1) 점검 마스터 버전 → 통합 목록
    checklistVersions.forEach(v => {
      list.push({
        _source: 'checklist_master',
        _sourceId: v.id,
        id: `cm-${v.id}`,
        name: v.name || '점검 마스터',
        type: 'checklist_master',
        version: `v${v.version || 1}`,
        status: v.status || 'draft',
        itemCount: v.snapshot_data?.items?.length || 0,
        createdBy: v.creator?.name || '-',
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        deployedAt: v.deployed_at,
        isCurrentDeployed: v.is_current_deployed,
        description: v.description,
        raw: v
      });
    });

    // 2) 표준문서 템플릿 → 통합 목록
    standardDocs.forEach(d => {
      list.push({
        _source: 'standard_doc',
        _sourceId: d.id,
        id: `sd-${d.id}`,
        name: d.template_name,
        type: d.template_type || 'mold_checklist',
        version: d.version || '1.0',
        status: d.status || 'draft',
        itemCount: d.item_count || 0,
        createdBy: d.created_by_name || '-',
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        deployedAt: d.deployed_at,
        isCurrentDeployed: d.status === 'deployed',
        description: d.description,
        raw: d
      });
    });

    // 3) 이관 체크리스트 마스터 → 통합 목록 (카테고리별 그룹화)
    const transferCategories = {};
    (Array.isArray(transferMasterItems) ? transferMasterItems : []).forEach(item => {
      const cat = item.category || '기타';
      if (!transferCategories[cat]) {
        transferCategories[cat] = { items: [], category: cat };
      }
      transferCategories[cat].items.push(item);
    });
    Object.values(transferCategories).forEach((catGroup, idx) => {
      list.push({
        _source: 'transfer_master',
        _sourceId: `cat-${idx}`,
        id: `tm-${idx}`,
        name: `이관 체크리스트 - ${catGroup.category}`,
        type: 'transfer_master',
        version: '1.0',
        status: 'active',
        itemCount: catGroup.items.length,
        createdBy: '-',
        createdAt: catGroup.items[0]?.created_at,
        updatedAt: catGroup.items[0]?.updated_at,
        deployedAt: null,
        isCurrentDeployed: true,
        description: `${catGroup.category} 카테고리 (${catGroup.items.length}개 항목)`,
        raw: catGroup
      });
    });

    return list;
  }, [checklistVersions, standardDocs, transferMasterItems]);

  // ========== 필터 적용 ==========
  const filteredList = useMemo(() => {
    return unifiedList.filter(item => {
      // 그룹 탭 필터
      if (activeGroup === 'approval') {
        return ['review', 'pending', 'approved', 'deployed'].includes(item.status);
      }
      if (activeGroup !== 'all') {
        const docType = DOC_TYPES[item.type];
        if (!docType || docType.group !== activeGroup) return false;
      }
      // 상태 필터
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      // 유형 필터
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      // 검색어
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.type?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [unifiedList, activeGroup, statusFilter, typeFilter, searchTerm]);

  // ========== 승인/배포 현황 통계 ==========
  const stats = useMemo(() => {
    const s = { total: unifiedList.length, draft: 0, review: 0, approved: 0, deployed: 0, active: 0 };
    unifiedList.forEach(item => {
      if (s[item.status] !== undefined) s[item.status]++;
      else if (item.status === 'pending') s.review++;
    });
    return s;
  }, [unifiedList]);

  // ========== 액션 핸들러 ==========
  const handleAction = async (item, action) => {
    setActionMenu(null);
    try {
      if (item._source === 'checklist_master') {
        const id = item._sourceId;
        if (action === 'view') return navigate(`/checklist-master/${id}`);
        if (action === 'edit') return navigate(`/checklist-master/${id}/edit`);
        if (action === 'submit') { await checklistMasterAPI.submitForReview(id); }
        if (action === 'approve') { await checklistMasterAPI.approve(id); }
        if (action === 'deploy') { await checklistMasterAPI.deploy(id); }
        if (action === 'clone') { await checklistMasterAPI.clone(id); }
        if (action === 'delete') {
          if (!window.confirm(`"${item.name}" 을(를) 삭제하시겠습니까?`)) return;
          await checklistMasterAPI.deleteVersion(id);
        }
      } else if (item._source === 'standard_doc') {
        const id = item._sourceId;
        if (action === 'view') return setShowDetailModal(item);
        if (action === 'approve') { await standardDocumentAPI.approve(id); }
        if (action === 'deploy') { await standardDocumentAPI.deploy(id, {}); }
        if (action === 'clone') { await standardDocumentAPI.duplicate(id, {}); }
        if (action === 'delete') {
          if (!window.confirm(`"${item.name}" 을(를) 삭제하시겠습니까?`)) return;
          await standardDocumentAPI.delete(id);
        }
      } else if (item._source === 'transfer_master') {
        if (action === 'view') return setShowDetailModal(item);
      }
      loadAllData();
    } catch (error) {
      console.error('Action failed:', error);
      alert(`작업에 실패했습니다: ${error?.response?.data?.error?.message || error.message}`);
    }
  };

  // ========== 상태별 가능 액션 ==========
  const getActions = (item) => {
    const actions = [{ key: 'view', label: '상세보기', icon: Eye }];
    if (item._source === 'checklist_master') {
      if (item.status === 'draft') {
        actions.push({ key: 'edit', label: '편집', icon: Edit3 });
        actions.push({ key: 'submit', label: '검토 요청', icon: Send });
        actions.push({ key: 'delete', label: '삭제', icon: Trash2, danger: true });
      }
      if (item.status === 'review') actions.push({ key: 'approve', label: '승인', icon: CheckCircle });
      if (item.status === 'approved') actions.push({ key: 'deploy', label: '배포', icon: Rocket });
      actions.push({ key: 'clone', label: '복제', icon: Copy });
    } else if (item._source === 'standard_doc') {
      if (item.status === 'draft') {
        actions.push({ key: 'approve', label: '승인', icon: CheckCircle });
        actions.push({ key: 'delete', label: '삭제', icon: Trash2, danger: true });
      }
      if (item.status === 'approved') actions.push({ key: 'deploy', label: '배포', icon: Rocket });
      actions.push({ key: 'clone', label: '복제', icon: Copy });
    }
    return actions;
  };

  // ========== 렌더링 ==========
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
              <h1 className="text-2xl font-bold text-gray-900">표준문서 통합관리</h1>
              <p className="text-gray-500 mt-1">점검 마스터 / 표준문서 / 이관 체크리스트 통합 관리 콘솔</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadAllData}
                className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                새로고침
              </button>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: '전체', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
            { label: '초안', value: stats.draft, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: '검토/승인대기', value: stats.review, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: '승인됨', value: stats.approved, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: '배포/활성', value: stats.deployed + stats.active, color: 'text-green-700', bg: 'bg-green-50' }
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-lg border border-gray-200 p-4`}>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 그룹 탭 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TAB_GROUPS.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeGroup === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveGroup(tab.key); setStatusFilter('all'); setTypeFilter('all'); }}
                className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <TabIcon className="w-4 h-4 mr-1.5" />
                {tab.label}
                {tab.key === 'all' && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{stats.total}</span>}
              </button>
            );
          })}
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="문서명, 설명, 유형 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="draft">초안</option>
              <option value="review">검토중</option>
              <option value="pending">승인대기</option>
              <option value="approved">승인됨</option>
              <option value="deployed">배포됨</option>
              <option value="active">활성</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 유형</option>
              {Object.entries(DOC_TYPES).map(([key, dt]) => (
                <option key={key} value={key}>{dt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 승인/배포 현황 탭이면 파이프라인 뷰 */}
        {activeGroup === 'approval' ? (
          <ApprovalPipelineView items={filteredList} onAction={handleAction} />
        ) : (
          /* 통합 목록 테이블 */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문서명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">버전</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">항목수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">표시할 문서가 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">검색 조건을 변경하거나 신규 문서를 생성하세요</p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map(item => {
                    const docType = DOC_TYPES[item.type] || DOC_TYPES.mold_checklist;
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusCfg.icon;
                    const TypeIcon = docType.icon;
                    const actions = getActions(item);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${docType.color}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description || '-'}</p>
                            </div>
                            {item.isCurrentDeployed && item._source === 'checklist_master' && (
                              <span className="ml-2 shrink-0 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                현재 적용
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${docType.color}`}>
                            {docType.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.version}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-900">{item.itemCount}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{item.createdBy}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-4 text-right relative">
                          <div className="flex items-center justify-end space-x-1">
                            {/* 빠른 액션 버튼들 */}
                            <button
                              onClick={() => handleAction(item, 'view')}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {actions.length > 2 && (
                              <div className="relative">
                                <button
                                  onClick={() => setActionMenu(actionMenu === item.id ? null : item.id)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {actionMenu === item.id && (
                                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                    {actions.filter(a => a.key !== 'view').map(a => {
                                      const AIcon = a.icon;
                                      return (
                                        <button
                                          key={a.key}
                                          onClick={() => handleAction(item, a.key)}
                                          className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                                            a.danger ? 'text-red-600' : 'text-gray-700'
                                          }`}
                                        >
                                          <AIcon className="w-4 h-4 mr-2" />
                                          {a.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 하단 정보 */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{filteredList.length}개 문서 표시 / 전체 {unifiedList.length}개</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> 점검 마스터 {checklistVersions.length}개</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span> 표준문서 {standardDocs.length}개</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-pink-500 mr-1"></span> 이관 마스터 {Object.keys(transferMasterItems.reduce?.((a, i) => { a[i.category] = 1; return a; }, {}) || {}).length}개 카테고리</span>
          </div>
        </div>
      </div>

      {/* 신규 생성 모달 */}
      {showCreateModal && (
        <CreateDocumentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadAllData(); }}
          checklistItems={checklistItems}
          checklistCycles={checklistCycles}
        />
      )}

      {/* 상세 보기 모달 */}
      {showDetailModal && (
        <DocumentDetailModal
          item={showDetailModal}
          onClose={() => setShowDetailModal(null)}
          onAction={(action) => { handleAction(showDetailModal, action); setShowDetailModal(null); }}
        />
      )}

      {/* 액션 메뉴 외부 클릭 닫기 */}
      {actionMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}

// ========== 승인/배포 파이프라인 뷰 ==========
function ApprovalPipelineView({ items, onAction }) {
  const stages = [
    { key: 'review', label: '검토중', color: 'border-yellow-300 bg-yellow-50' },
    { key: 'pending', label: '승인대기', color: 'border-orange-300 bg-orange-50' },
    { key: 'approved', label: '승인됨', color: 'border-blue-300 bg-blue-50' },
    { key: 'deployed', label: '배포됨', color: 'border-green-300 bg-green-50' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stages.map(stage => {
        const stageItems = items.filter(i => i.status === stage.key);
        return (
          <div key={stage.key} className={`rounded-lg border-2 ${stage.color} p-4 min-h-[200px]`}>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
              {stage.label}
              <span className="text-sm font-normal text-gray-500">{stageItems.length}건</span>
            </h3>
            <div className="space-y-2">
              {stageItems.map(item => {
                const docType = DOC_TYPES[item.type] || DOC_TYPES.mold_checklist;
                return (
                  <div
                    key={item.id}
                    onClick={() => onAction(item, 'view')}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${docType.color}`}>{docType.label}</span>
                      <span className="text-xs text-gray-400">{item.version}</span>
                    </div>
                  </div>
                );
              })}
              {stageItems.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">없음</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========== 신규 생성 모달 ==========
function CreateDocumentModal({ onClose, onCreated, checklistItems, checklistCycles }) {
  const [createType, setCreateType] = useState('checklist_master');
  const [formData, setFormData] = useState({
    name: '', description: '', template_type: 'daily_check',
    major_category: '', item_name: '', check_method: '', required_photo: false
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    try {
      setSaving(true);
      if (createType === 'checklist_master') {
        if (!formData.name.trim()) return alert('마스터 이름을 입력하세요.');
        await checklistMasterAPI.createVersion({
          name: formData.name,
          description: formData.description,
          items: selectedItems.map(id => ({ id })),
          cycleMappings: []
        });
      } else if (createType === 'standard_doc') {
        if (!formData.name.trim()) return alert('문서명을 입력하세요.');
        await standardDocumentAPI.create({
          template_name: formData.name,
          template_type: formData.template_type,
          description: formData.description,
          version: '1.0',
          status: 'draft'
        });
      }
      onCreated();
    } catch (error) {
      console.error('Create failed:', error);
      alert(`생성 실패: ${error?.response?.data?.error?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">신규 문서 생성</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)]">
          {/* 생성 유형 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">생성 유형</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'checklist_master', label: '점검 마스터 버전', icon: ClipboardList, desc: '점검항목 + 주기 매핑' },
                { key: 'standard_doc', label: '표준문서 템플릿', icon: FileText, desc: '8가지 유형 문서 템플릿' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setCreateType(opt.key)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    createType === opt.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className={`w-6 h-6 mb-2 ${createType === opt.key ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 공통 필드 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={createType === 'checklist_master' ? '예: 정기점검 체크리스트 v2' : '예: 일상점검 표준양식'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="간단한 설명..."
              />
            </div>

            {/* 표준문서 전용: 문서 유형 선택 */}
            {createType === 'standard_doc' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">문서 유형</label>
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pre_production">제작전 체크리스트</option>
                  <option value="daily_check">일상점검</option>
                  <option value="periodic_check">정기점검</option>
                  <option value="mold_checklist">금형체크리스트</option>
                  <option value="development_plan">개발계획</option>
                  <option value="transfer">이관 체크리스트</option>
                  <option value="hardness">경도측정</option>
                  <option value="nurturing">금형육성</option>
                </select>
              </div>
            )}

            {/* 점검 마스터 전용: 항목 선택 */}
            {createType === 'checklist_master' && checklistItems.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  점검항목 선택 ({selectedItems.length}개 선택됨)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {checklistItems.map(item => (
                    <label key={item.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => setSelectedItems(prev =>
                          prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        )}
                        className="w-4 h-4 text-blue-600 rounded mr-3"
                      />
                      <div>
                        <span className="text-sm text-gray-900">{item.item_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{item.major_category}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">취소</button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== 상세 보기 모달 ==========
function DocumentDetailModal({ item, onClose, onAction }) {
  const docType = DOC_TYPES[item.type] || DOC_TYPES.mold_checklist;
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${docType.color}`}>
              <docType.icon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">유형</span>
                <p className="font-medium text-sm">{docType.label}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">버전</span>
                <p className="font-medium text-sm">{item.version}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">상태</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" /> {statusCfg.label}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500">항목 수</span>
                <p className="font-medium text-sm">{item.itemCount}개</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">작성자</span>
                <p className="font-medium text-sm">{item.createdBy}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">수정일</span>
                <p className="font-medium text-sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('ko-KR') : '-'}</p>
              </div>
            </div>
            {item.description && (
              <div>
                <span className="text-xs text-gray-500">설명</span>
                <p className="text-sm text-gray-700 mt-1">{item.description}</p>
              </div>
            )}

            {/* 이관 마스터인 경우 항목 목록 */}
            {item._source === 'transfer_master' && item.raw?.items && (
              <div>
                <span className="text-xs text-gray-500 mb-2 block">체크리스트 항목</span>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {item.raw.items.map((ti, idx) => (
                    <div key={ti.id || idx} className="flex items-center px-3 py-2 border-b border-gray-100 last:border-b-0 text-sm">
                      <span className="w-10 text-gray-400 text-xs">{ti.item_code}</span>
                      <span className="flex-1 text-gray-900">{ti.item_name}</span>
                      {ti.is_required && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">필수</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 데이터 소스 */}
            <div className="pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-400">
                데이터 소스: {item._source === 'checklist_master' ? '점검 마스터 (checklist_master_versions)'
                  : item._source === 'standard_doc' ? '표준문서 (standard_document_templates)'
                  : '이관 마스터 (production_transfer_checklist_master)'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
          {item._source === 'checklist_master' && (
            <>
              {item.status === 'draft' && (
                <button onClick={() => onAction('submit')} className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">검토 요청</button>
              )}
              {item.status === 'review' && (
                <button onClick={() => onAction('approve')} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">승인</button>
              )}
              {item.status === 'approved' && (
                <button onClick={() => onAction('deploy')} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">배포</button>
              )}
            </>
          )}
          {item._source === 'standard_doc' && (
            <>
              {item.status === 'draft' && (
                <button onClick={() => onAction('approve')} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">승인</button>
              )}
              {item.status === 'approved' && (
                <button onClick={() => onAction('deploy')} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">배포</button>
              )}
            </>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  );
}
