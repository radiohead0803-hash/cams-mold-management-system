import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Filter, AlertTriangle, CheckCircle, Clock, 
  XCircle, RefreshCw, MessageSquare, FileText, Camera, Calendar,
  ChevronDown, ChevronUp, Edit, Trash2, Eye, AlertCircle, RotateCcw,
  Settings, Lock, Unlock, Upload, Image, X
} from 'lucide-react';
import api from '../lib/api';
import { moldSpecificationAPI } from '../lib/api';

// 상태 정의
const STATUSES = [
  { code: 'registered', name: '등록됨', color: 'gray', icon: FileText },
  { code: 'analyzing', name: '원인 분석 중', color: 'blue', icon: Search },
  { code: 'improving', name: '개선 조치 진행', color: 'yellow', icon: Clock },
  { code: 'verifying', name: '재확인 중', color: 'purple', icon: Eye },
  { code: 'closed', name: '종결', color: 'green', icon: CheckCircle },
  { code: 'reopened', name: '재발', color: 'red', icon: RotateCcw }
];

// 심각도 정의
const SEVERITIES = [
  { code: 'minor', name: 'Minor', color: 'green' },
  { code: 'major', name: 'Major', color: 'yellow' },
  { code: 'critical', name: 'Critical', color: 'red' }
];

// 문제 유형 정의
const PROBLEM_TYPES = [
  { code: 'APPEARANCE', name: '외관' },
  { code: 'DIMENSION', name: '치수' },
  { code: 'FUNCTION', name: '기능' },
  { code: 'STRUCTURE', name: '구조' },
  { code: 'DURABILITY', name: '내구' },
  { code: 'EJECTION', name: '취출' },
  { code: 'COOLING', name: '냉각' },
  { code: 'OTHER', name: '기타' }
];

// 원인 유형 정의
const CAUSE_TYPES = [
  { code: 'DESIGN', name: '설계' },
  { code: 'MACHINING', name: '가공' },
  { code: 'ASSEMBLY', name: '조립' },
  { code: 'MATERIAL', name: '재질' },
  { code: 'INJECTION', name: '사출조건' },
  { code: 'MANAGEMENT', name: '관리 미흡' }
];

// 발견 주체 정의
const DISCOVERED_BY_OPTIONS = [
  { code: 'mold_developer', name: '금형개발' },
  { code: 'maker', name: '제작처' },
  { code: 'plant', name: '생산처' }
];

// 개선 방법 유형
const IMPROVEMENT_METHODS = [
  { code: 'MOLD_MODIFY', name: '금형 수정' },
  { code: 'CONDITION_CHANGE', name: '조건 변경' },
  { code: 'STANDARD_CHANGE', name: '작업 표준 변경' },
  { code: 'MANAGEMENT_ENHANCE', name: '관리 강화' }
];

export default function MoldNurturingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moldId = searchParams.get('moldId');
  
  const [loading, setLoading] = useState(true);
  const [moldInfo, setMoldInfo] = useState(null);
  const [problems, setProblems] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // 필터
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  
  // 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // 육성 단계 (DB에서 로드)
  const [nurturingStages, setNurturingStages] = useState([]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageResponsible, setNewStageResponsible] = useState('maker');
  const [editingStage, setEditingStage] = useState(null);
  
  // 사진 업로드
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tempImages, setTempImages] = useState([]);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    nurturing_stage: 'INITIAL_TO',
    occurrence_date: new Date().toISOString().split('T')[0],
    discovered_by: 'maker',
    problem_types: [],
    problem_summary: '',
    problem_detail: '',
    occurrence_location: '',
    severity: 'minor',
    cause_types: [],
    cause_detail: '',
    recurrence_risk: 'low',
    improvement_required: true,
    improvement_action: '',
    action_responsible: 'maker',
    improvement_methods: [],
    planned_completion_date: '',
    action_status: 'not_started',
    verification_stage: '',
    result_description: '',
    final_judgment: '',
    // T/O 공통 조건필드
    try_location: '',
    try_date: new Date().toISOString().split('T')[0],
    try_machine: '',
    try_material: '',
    shot_count: '',
    cycle_time: '',
    responsible_company_name: '',
    // 사진
    occurrence_photos: []
  });

  useEffect(() => {
    loadStages();
    if (moldId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [moldId, stageFilter, statusFilter, severityFilter]);

  // 육성 단계 로드
  const loadStages = async () => {
    try {
      const response = await api.get(`/mold-nurturing/stages?mold_id=${moldId || ''}`);
      if (response.data?.success) {
        setNurturingStages(response.data.data.stages || []);
      }
    } catch (error) {
      console.error('육성 단계 로드 실패:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 금형 정보 로드
      const moldResponse = await moldSpecificationAPI.getById(moldId);
      if (moldResponse.data?.data) {
        setMoldInfo(moldResponse.data.data);
      }
      
      // 문제점 목록 로드
      const params = new URLSearchParams();
      params.append('mold_id', moldId);
      if (stageFilter) params.append('nurturing_stage', stageFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      
      const problemsResponse = await api.get(`/mold-nurturing/problems?${params.toString()}`);
      if (problemsResponse.data?.success) {
        setProblems(problemsResponse.data.data);
      }
      
      // 통계 로드
      const statsResponse = await api.get(`/mold-nurturing/statistics?mold_id=${moldId}`);
      if (statsResponse.data?.success) {
        setStatistics(statsResponse.data.data);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 육성 단계 추가
  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      alert('단계명을 입력해주세요.');
      return;
    }
    try {
      await api.post('/mold-nurturing/stages', {
        stage_name: newStageName,
        responsible_type: newStageResponsible,
        mold_id: moldId
      });
      setNewStageName('');
      setShowStageModal(false);
      loadStages();
      alert('단계가 추가되었습니다.');
    } catch (error) {
      console.error('단계 추가 실패:', error);
      alert('단계 추가에 실패했습니다.');
    }
  };

  // 육성 단계 수정
  const handleUpdateStage = async () => {
    if (!editingStage || !newStageName.trim()) return;
    try {
      await api.put(`/mold-nurturing/stages/${editingStage.stage_code}`, {
        stage_name: newStageName,
        responsible_type: newStageResponsible
      });
      setEditingStage(null);
      setNewStageName('');
      setShowStageModal(false);
      loadStages();
      alert('수정되었습니다.');
    } catch (error) {
      console.error('단계 수정 실패:', error);
      alert(error.response?.data?.error?.message || '수정에 실패했습니다.');
    }
  };

  // 육성 단계 삭제
  const handleDeleteStage = async (stageCode) => {
    if (!confirm('이 단계를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/mold-nurturing/stages/${stageCode}`);
      loadStages();
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('단계 삭제 실패:', error);
      alert(error.response?.data?.error?.message || '삭제에 실패했습니다.');
    }
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingImage(true);
    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('type', 'nurturing_problem');
        formDataUpload.append('mold_id', moldId);
        
        const response = await api.post('/files/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data?.success && response.data?.data?.url) {
          setTempImages(prev => [...prev, response.data.data.url]);
          setFormData(prev => ({
            ...prev,
            occurrence_photos: [...(prev.occurrence_photos || []), response.data.data.url]
          }));
        }
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // 이미지 삭제
  const handleRemoveImage = (index) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      occurrence_photos: (prev.occurrence_photos || []).filter((_, i) => i !== index)
    }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectToggle = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.problem_summary.trim()) {
        alert('문제 요약을 입력해주세요.');
        return;
      }
      
      const payload = {
        ...formData,
        mold_id: moldId,
        mold_spec_id: moldInfo?.id,
        created_by: 1, // TODO: 실제 사용자 ID
        created_by_name: '관리자' // TODO: 실제 사용자명
      };
      
      if (editMode && selectedProblem) {
        await api.put(`/mold-nurturing/problems/${selectedProblem.id}`, {
          ...payload,
          updated_by: 1,
          updated_by_name: '관리자'
        });
        alert('수정되었습니다.');
      } else {
        await api.post('/mold-nurturing/problems', payload);
        alert('등록되었습니다.');
      }
      
      setShowAddModal(false);
      setEditMode(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleStatusChange = async (problemId, newStatus) => {
    try {
      await api.put(`/mold-nurturing/problems/${problemId}/status`, {
        status: newStatus,
        updated_by: 1,
        updated_by_name: '관리자'
      });
      loadData();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleReopen = async (problemId) => {
    if (!confirm('이 문제를 재발로 처리하시겠습니까?')) return;
    try {
      await api.post(`/mold-nurturing/problems/${problemId}/reopen`, {
        updated_by: 1,
        updated_by_name: '관리자',
        description: '문제 재발'
      });
      loadData();
    } catch (error) {
      console.error('재오픈 실패:', error);
      alert('재오픈에 실패했습니다.');
    }
  };

  const handleDelete = async (problemId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/mold-nurturing/problems/${problemId}`);
      loadData();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const openDetail = async (problem) => {
    try {
      const response = await api.get(`/mold-nurturing/problems/${problem.id}`);
      if (response.data?.success) {
        setSelectedProblem(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('상세 조회 실패:', error);
    }
  };

  const openEdit = (problem) => {
    setFormData({
      nurturing_stage: problem.nurturing_stage || 'INITIAL_TO',
      occurrence_date: problem.occurrence_date || '',
      discovered_by: problem.discovered_by || 'maker',
      problem_types: problem.problem_types || [],
      problem_summary: problem.problem_summary || '',
      problem_detail: problem.problem_detail || '',
      occurrence_location: problem.occurrence_location || '',
      severity: problem.severity || 'minor',
      cause_types: problem.cause_types || [],
      cause_detail: problem.cause_detail || '',
      recurrence_risk: problem.recurrence_risk || 'low',
      improvement_required: problem.improvement_required !== false,
      improvement_action: problem.improvement_action || '',
      action_responsible: problem.action_responsible || 'maker',
      improvement_methods: problem.improvement_methods || [],
      planned_completion_date: problem.planned_completion_date || '',
      action_status: problem.action_status || 'not_started',
      verification_stage: problem.verification_stage || '',
      result_description: problem.result_description || '',
      final_judgment: problem.final_judgment || '',
      occurrence_photos: problem.occurrence_photos || [],
      // T/O 공통 조건필드
      try_location: problem.try_location || '',
      try_date: problem.try_date || '',
      try_machine: problem.try_machine || '',
      try_material: problem.try_material || '',
      shot_count: problem.shot_count || '',
      cycle_time: problem.cycle_time || '',
      responsible_company_name: problem.responsible_company_name || ''
    });
    setTempImages(problem.occurrence_photos || []);
    setSelectedProblem(problem);
    setEditMode(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      nurturing_stage: 'INITIAL_TO',
      occurrence_date: new Date().toISOString().split('T')[0],
      discovered_by: 'maker',
      problem_types: [],
      problem_summary: '',
      problem_detail: '',
      occurrence_location: '',
      severity: 'minor',
      cause_types: [],
      cause_detail: '',
      recurrence_risk: 'low',
      improvement_required: true,
      improvement_action: '',
      action_responsible: 'maker',
      improvement_methods: [],
      planned_completion_date: '',
      action_status: 'not_started',
      verification_stage: '',
      result_description: '',
      final_judgment: '',
      try_location: '',
      try_date: new Date().toISOString().split('T')[0],
      try_machine: '',
      try_material: '',
      shot_count: '',
      cycle_time: '',
      responsible_company_name: '',
      occurrence_photos: []
    });
    setTempImages([]);
    setSelectedProblem(null);
    setEditMode(false);
  };

  const getSeverityColor = (severity) => {
    const s = SEVERITIES.find(s => s.code === severity);
    if (!s) return 'bg-gray-100 text-gray-700';
    switch (s.color) {
      case 'green': return 'bg-green-100 text-green-700';
      case 'yellow': return 'bg-yellow-100 text-yellow-700';
      case 'red': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    const s = STATUSES.find(s => s.code === status);
    if (!s) return 'bg-gray-100 text-gray-700';
    switch (s.color) {
      case 'gray': return 'bg-gray-100 text-gray-700';
      case 'blue': return 'bg-blue-100 text-blue-700';
      case 'yellow': return 'bg-yellow-100 text-yellow-700';
      case 'purple': return 'bg-purple-100 text-purple-700';
      case 'green': return 'bg-green-100 text-green-700';
      case 'red': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 육성 단계 색상 (DB에서 로드된 단계 사용)
  const getStageColor = (stageCode) => {
    const stage = nurturingStages.find(s => s.stage_code === stageCode);
    if (!stage) return 'bg-gray-100 text-gray-700';
    // 고정 단계는 파란색, 나머지는 순서에 따라 색상 지정
    if (stage.is_fixed) return 'bg-blue-100 text-blue-700';
    const order = stage.stage_order || 0;
    if (order <= 2) return 'bg-indigo-100 text-indigo-700';
    if (order <= 4) return 'bg-purple-100 text-purple-700';
    if (order <= 5) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  // 육성 단계명 가져오기
  const getStageName = (stageCode) => {
    const stage = nurturingStages.find(s => s.stage_code === stageCode);
    return stage?.stage_name || stageCode;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">금형육성</span>
                  {moldInfo && (
                    <span className="text-sm text-gray-500">{moldInfo.mold?.mold_code || `M-${moldId}`}</span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 mt-1">금형육성 문제점 관리</h1>
                <p className="text-sm text-gray-500">{moldInfo?.part_name || '금형'} - TRY 및 양산 단계 문제 추적</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} /> 문제점 등록
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 금형 정보 요약 */}
        {moldInfo && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-500">금형코드</span>
                <p className="font-medium">{moldInfo.mold?.mold_code || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">품명</span>
                <p className="font-medium">{moldInfo.part_name || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">차종</span>
                <p className="font-medium">{moldInfo.car_model || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">제작처</span>
                <p className="font-medium">{moldInfo.makerCompany?.company_name || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">생산처</span>
                <p className="font-medium">{moldInfo.plantCompany?.company_name || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-2xl font-bold text-gray-900">{statistics.total || 0}</div>
              <div className="text-sm text-gray-500">전체 문제</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-2xl font-bold text-red-600">{statistics.recurrenceCount || 0}</div>
              <div className="text-sm text-gray-500">재발 문제</div>
            </div>
            {SEVERITIES.map(sev => {
              const count = statistics.bySeverity?.find(s => s.severity === sev.code)?.count || 0;
              return (
                <div key={sev.code} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className={`text-2xl font-bold ${
                    sev.color === 'red' ? 'text-red-600' : 
                    sev.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{count}</div>
                  <div className="text-sm text-gray-500">{sev.name}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">필터:</span>
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">전체 단계</option>
              {nurturingStages.map(stage => (
                <option key={stage.stage_code} value={stage.stage_code}>
                  {stage.stage_name} {stage.is_fixed ? '(고정)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowStageModal(true)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              title="육성단계 관리"
            >
              <Settings size={16} />
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">전체 상태</option>
              {STATUSES.map(status => (
                <option key={status.code} value={status.code}>{status.name}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">전체 심각도</option>
              {SEVERITIES.map(sev => (
                <option key={sev.code} value={sev.code}>{sev.name}</option>
              ))}
            </select>
            <button
              onClick={() => { setStageFilter(''); setStatusFilter(''); setSeverityFilter(''); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 문제점 목록 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">문제점 목록 ({problems.length}건)</h2>
          </div>
          
          {problems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>등록된 문제점이 없습니다.</p>
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                첫 문제점 등록하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">번호</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">육성단계</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">문제유형</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">문제요약</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">심각도</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">상태</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">재발</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">발생일</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {problems.map((problem) => (
                    <tr key={problem.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {problem.problem_number}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${getStageColor(problem.nurturing_stage)}`}>
                          {getStageName(problem.nurturing_stage)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(problem.problem_types || []).slice(0, 2).map(type => (
                            <span key={type} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {PROBLEM_TYPES.find(t => t.code === type)?.name || type}
                            </span>
                          ))}
                          {(problem.problem_types || []).length > 2 && (
                            <span className="text-xs text-gray-400">+{problem.problem_types.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={problem.problem_summary}>
                        {problem.problem_summary}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(problem.severity)}`}>
                          {SEVERITIES.find(s => s.code === problem.severity)?.name || problem.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(problem.status)}`}>
                          {STATUSES.find(s => s.code === problem.status)?.name || problem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {problem.is_recurred && (
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-medium">재발</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {problem.occurrence_date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(problem)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                            title="상세보기"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(problem)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                            title="수정"
                          >
                            <Edit size={16} />
                          </button>
                          {problem.status === 'closed' && (
                            <button
                              onClick={() => handleReopen(problem.id)}
                              className="p-1.5 text-orange-500 hover:bg-orange-50 rounded"
                              title="재발 처리"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(problem.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 육성 단계별 현황 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 mb-4">육성 단계별 문제 현황</h3>
          <div className="flex items-end gap-4 h-40">
            {nurturingStages.map(stage => {
              const count = statistics?.byStage?.find(s => s.nurturing_stage === stage.stage_code)?.count || 0;
              const maxCount = Math.max(...(statistics?.byStage?.map(s => parseInt(s.count)) || [1]), 1);
              const height = (count / maxCount) * 100;
              const order = stage.stage_order || 0;
              const bgColor = stage.is_fixed ? 'bg-blue-500' :
                order <= 2 ? 'bg-indigo-500' :
                order <= 4 ? 'bg-purple-500' :
                order <= 5 ? 'bg-orange-500' : 'bg-green-500';
              return (
                <div key={stage.stage_code} className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-bold text-gray-700 mb-1">{count}</div>
                  <div 
                    className={`w-full rounded-t ${bgColor}`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {stage.stage_name}
                    {stage.is_fixed && <Lock size={10} className="inline ml-0.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 문제점 등록/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editMode ? '문제점 수정' : '문제점 등록'}
              </h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 문제점 기본 정보 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  문제점 기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      육성단계 *
                      {nurturingStages.find(s => s.stage_code === formData.nurturing_stage)?.is_fixed && (
                        <Lock size={12} className="inline ml-1 text-blue-500" />
                      )}
                    </label>
                    <select
                      value={formData.nurturing_stage}
                      onChange={(e) => handleFormChange('nurturing_stage', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {nurturingStages.map(stage => (
                        <option key={stage.stage_code} value={stage.stage_code}>
                          {stage.stage_name} {stage.is_fixed ? '(고정)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">발생일자 *</label>
                    <input
                      type="date"
                      value={formData.occurrence_date}
                      onChange={(e) => handleFormChange('occurrence_date', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">발견 주체 *</label>
                    <select
                      value={formData.discovered_by}
                      onChange={(e) => handleFormChange('discovered_by', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {DISCOVERED_BY_OPTIONS.map(opt => (
                        <option key={opt.code} value={opt.code}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">심각도 *</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => handleFormChange('severity', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {SEVERITIES.map(sev => (
                        <option key={sev.code} value={sev.code}>{sev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">문제 유형 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {PROBLEM_TYPES.map(type => (
                        <button
                          key={type.code}
                          type="button"
                          onClick={() => handleMultiSelectToggle('problem_types', type.code)}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${
                            formData.problem_types.includes(type.code)
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">문제 요약 *</label>
                    <input
                      type="text"
                      value={formData.problem_summary}
                      onChange={(e) => handleFormChange('problem_summary', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="문제를 간략히 요약해주세요"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                    <textarea
                      value={formData.problem_detail}
                      onChange={(e) => handleFormChange('problem_detail', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="문제의 상세 내용을 입력해주세요"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">발생 위치</label>
                    <input
                      type="text"
                      value={formData.occurrence_location}
                      onChange={(e) => handleFormChange('occurrence_location', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: 캐비티 A면 게이트 부근"
                    />
                  </div>
                  
                  {/* 사진 업로드 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Camera size={16} className="inline mr-1" />
                      발생 사진 (최대 5장)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {/* 이미지 미리보기 */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      {(formData.occurrence_photos || []).map((url, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border">
                          <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      {/* 업로드 버튼 */}
                      {(formData.occurrence_photos || []).length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 disabled:opacity-50"
                        >
                          {uploadingImage ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                          ) : (
                            <>
                              <Upload size={20} />
                              <span className="text-xs mt-1">사진 추가</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">클릭하여 이미지를 업로드하세요</p>
                  </div>
                </div>
              </div>

              {/* T/O 공통 조건필드 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-purple-500" />
                  T/O 조건 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">T/O 장소</label>
                    <input
                      type="text"
                      value={formData.try_location || ''}
                      onChange={(e) => handleFormChange('try_location', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: 본사 사출실"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">T/O 일자</label>
                    <input
                      type="date"
                      value={formData.try_date || ''}
                      onChange={(e) => handleFormChange('try_date', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당 업체</label>
                    <input
                      type="text"
                      value={formData.responsible_company_name || ''}
                      onChange={(e) => handleFormChange('responsible_company_name', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: OO금형"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설비/사출기</label>
                    <input
                      type="text"
                      value={formData.try_machine || ''}
                      onChange={(e) => handleFormChange('try_machine', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: 350톤 사출기"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">원재료</label>
                    <input
                      type="text"
                      value={formData.try_material || ''}
                      onChange={(e) => handleFormChange('try_material', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: ABS, PP"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">숏수</label>
                      <input
                        type="number"
                        value={formData.shot_count || ''}
                        onChange={(e) => handleFormChange('shot_count', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">C/T (초)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.cycle_time || ''}
                        onChange={(e) => handleFormChange('cycle_time', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="45.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 원인 분석 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Search size={18} className="text-blue-500" />
                  원인 분석
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">추정 원인 유형 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {CAUSE_TYPES.map(type => (
                        <button
                          key={type.code}
                          type="button"
                          onClick={() => handleMultiSelectToggle('cause_types', type.code)}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${
                            formData.cause_types.includes(type.code)
                              ? 'bg-blue-100 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 원인 설명</label>
                    <textarea
                      value={formData.cause_detail}
                      onChange={(e) => handleFormChange('cause_detail', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={2}
                      placeholder="원인에 대한 상세 설명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">재발 가능성</label>
                    <select
                      value={formData.recurrence_risk}
                      onChange={(e) => handleFormChange('recurrence_risk', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="low">낮음</option>
                      <option value="medium">보통</option>
                      <option value="high">높음</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 개선 조치 계획 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-yellow-500" />
                  개선 조치 계획
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="improvement_required"
                      checked={formData.improvement_required}
                      onChange={(e) => handleFormChange('improvement_required', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="improvement_required" className="text-sm font-medium text-gray-700">
                      개선 필요
                    </label>
                  </div>
                  {formData.improvement_required && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">개선 조치 내용</label>
                        <textarea
                          value={formData.improvement_action}
                          onChange={(e) => handleFormChange('improvement_action', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2"
                          rows={2}
                          placeholder="개선 조치 내용을 입력해주세요"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">조치 담당</label>
                          <select
                            value={formData.action_responsible}
                            onChange={(e) => handleFormChange('action_responsible', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                          >
                            {DISCOVERED_BY_OPTIONS.map(opt => (
                              <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">계획 완료 예정일</label>
                          <input
                            type="date"
                            value={formData.planned_completion_date}
                            onChange={(e) => handleFormChange('planned_completion_date', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">개선 방법 유형 (복수 선택)</label>
                        <div className="flex flex-wrap gap-2">
                          {IMPROVEMENT_METHODS.map(method => (
                            <button
                              key={method.code}
                              type="button"
                              onClick={() => handleMultiSelectToggle('improvement_methods', method.code)}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${
                                formData.improvement_methods.includes(method.code)
                                  ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {method.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 개선 결과 및 검증 (수정 모드에서만) */}
              {editMode && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    개선 결과 및 검증
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">조치 완료 여부</label>
                        <select
                          value={formData.action_status}
                          onChange={(e) => handleFormChange('action_status', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="not_started">미조치</option>
                          <option value="completed">조치 완료</option>
                          <option value="insufficient">효과 미흡</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">재확인 단계</label>
                        <select
                          value={formData.verification_stage}
                          onChange={(e) => handleFormChange('verification_stage', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">선택</option>
                          <option value="same_try">동일 TRY</option>
                          <option value="next_try">차기 TRY</option>
                          <option value="initial_production">초기 양산</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">개선 후 결과 설명</label>
                      <textarea
                        value={formData.result_description}
                        onChange={(e) => handleFormChange('result_description', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        rows={2}
                        placeholder="개선 후 결과를 설명해주세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">최종 판정</label>
                      <select
                        value={formData.final_judgment}
                        onChange={(e) => handleFormChange('final_judgment', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">선택</option>
                        <option value="ok">OK (종결)</option>
                        <option value="conditional_ok">조건부 OK</option>
                        <option value="re_action_required">재조치 필요</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editMode ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedProblem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedProblem.problem_number}</h2>
                <p className="text-sm text-gray-500">{selectedProblem.problem_summary}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-gray-500">육성단계</span>
                  <p className={`text-sm font-medium px-2 py-1 rounded inline-block ${getStageColor(selectedProblem.nurturing_stage)}`}>
                    {getStageName(selectedProblem.nurturing_stage)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">심각도</span>
                  <p className={`text-sm font-medium px-2 py-1 rounded inline-block ${getSeverityColor(selectedProblem.severity)}`}>
                    {SEVERITIES.find(s => s.code === selectedProblem.severity)?.name}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">상태</span>
                  <p className={`text-sm font-medium px-2 py-1 rounded inline-block ${getStatusColor(selectedProblem.status)}`}>
                    {STATUSES.find(s => s.code === selectedProblem.status)?.name}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">발생일</span>
                  <p className="text-sm font-medium">{selectedProblem.occurrence_date}</p>
                </div>
              </div>

              {/* 발생 사진 */}
              {selectedProblem.occurrence_photos && selectedProblem.occurrence_photos.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Camera size={16} />
                    발생 사진
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedProblem.occurrence_photos.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border hover:opacity-80"
                      >
                        <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 내용 */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">상세 내용</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedProblem.problem_detail || '상세 내용 없음'}
                </p>
              </div>

              {/* 원인 분석 */}
              {selectedProblem.cause_detail && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">원인 분석</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    {selectedProblem.cause_detail}
                  </p>
                </div>
              )}

              {/* 개선 조치 */}
              {selectedProblem.improvement_action && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">개선 조치</h4>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    {selectedProblem.improvement_action}
                  </p>
                </div>
              )}

              {/* 이력 타임라인 */}
              {selectedProblem.histories && selectedProblem.histories.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">이력</h4>
                  <div className="space-y-2">
                    {selectedProblem.histories.map((history, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5"></div>
                        <div>
                          <span className="text-gray-500">{new Date(history.changed_at).toLocaleString()}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">{history.change_description || history.action_type}</span>
                          <span className="text-gray-400 ml-2">by {history.changed_by_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 변경 버튼 */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-2">상태 변경</h4>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter(s => s.code !== selectedProblem.status && s.code !== 'reopened').map(status => (
                    <button
                      key={status.code}
                      onClick={() => { handleStatusChange(selectedProblem.id, status.code); setShowDetailModal(false); }}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${getStatusColor(status.code)} hover:opacity-80`}
                    >
                      {status.name}으로 변경
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 육성단계 관리 모달 */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">육성단계 관리</h2>
              <button onClick={() => { setShowStageModal(false); setEditingStage(null); setNewStageName(''); }} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 단계 추가/수정 폼 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-800 mb-3">
                  {editingStage ? '단계 수정' : '새 단계 추가'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">단계명 *</label>
                    <input
                      type="text"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="예: T/O 4차"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당 유형</label>
                    <select
                      value={newStageResponsible}
                      onChange={(e) => setNewStageResponsible(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="maker">제작처</option>
                      <option value="plant">생산처</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {editingStage ? (
                      <>
                        <button
                          onClick={handleUpdateStage}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => { setEditingStage(null); setNewStageName(''); }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleAddStage}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        추가
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 단계 목록 */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">현재 단계 목록</h3>
                <div className="space-y-2">
                  {nurturingStages.map(stage => (
                    <div 
                      key={stage.stage_code} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        stage.is_fixed ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-6">{stage.stage_order}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{stage.stage_name}</span>
                            {stage.is_fixed && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                                <Lock size={10} /> 고정
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {stage.responsible_type === 'maker' ? '제작처' : '생산처'}
                          </span>
                        </div>
                      </div>
                      {!stage.is_fixed && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { 
                              setEditingStage(stage); 
                              setNewStageName(stage.stage_name); 
                              setNewStageResponsible(stage.responsible_type || 'maker');
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                            title="수정"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.stage_code)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
