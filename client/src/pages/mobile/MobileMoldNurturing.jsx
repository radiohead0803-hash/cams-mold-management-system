import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Camera, Image, X, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Filter, Search, Edit, Trash2, Eye, RotateCcw,
  AlertTriangle, Save, Upload, FileText, Settings, Lock
} from 'lucide-react';
import api, { moldSpecificationAPI } from '../../lib/api';

// 상태 정의
const STATUSES = [
  { code: 'registered', name: '등록됨', color: 'gray' },
  { code: 'analyzing', name: '분석중', color: 'blue' },
  { code: 'improving', name: '개선중', color: 'yellow' },
  { code: 'verifying', name: '확인중', color: 'purple' },
  { code: 'closed', name: '종결', color: 'green' },
  { code: 'reopened', name: '재발', color: 'red' }
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
  { code: 'MANAGEMENT', name: '관리미흡' }
];

// 발견 주체 정의
const DISCOVERED_BY_OPTIONS = [
  { code: 'mold_developer', name: '금형개발' },
  { code: 'maker', name: '제작처' },
  { code: 'plant', name: '생산처' }
];

export default function MobileMoldNurturing() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [moldInfo, setMoldInfo] = useState(null);
  const [problems, setProblems] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // 육성 단계 (DB에서 로드)
  const [nurturingStages, setNurturingStages] = useState([]);
  
  // 필터
  const [showFilter, setShowFilter] = useState(false);
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 모바일 단계별 입력
  
  // 이미지 업로드
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
    planned_completion_date: '',
    occurrence_photos: [],
    // T/O 공통 조건필드
    try_location: '',
    try_date: new Date().toISOString().split('T')[0],
    try_machine: '',
    try_material: '',
    shot_count: '',
    cycle_time: '',
    responsible_company_name: ''
  });

  useEffect(() => {
    loadStages();
    if (moldId) {
      loadData();
    }
  }, [moldId, stageFilter, statusFilter]);

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

  // 카메라로 사진 촬영
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // 갤러리에서 이미지 선택
  const handleGallerySelect = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  // 이미지 파일 처리
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    
    try {
      for (const file of files) {
        // 이미지 리사이즈 및 압축
        const resizedImage = await resizeImage(file, 1024, 0.8);
        
        // 서버에 업로드
        const formDataUpload = new FormData();
        formDataUpload.append('file', resizedImage);
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

  // 이미지 리사이즈 함수
  const resizeImage = (file, maxSize, quality) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 삭제
  const handleRemoveImage = (index) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      occurrence_photos: (prev.occurrence_photos || []).filter((_, i) => i !== index)
    }));
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
        created_by: 1,
        created_by_name: '현장작업자'
      };
      
      if (editMode && selectedProblem) {
        await api.put(`/mold-nurturing/problems/${selectedProblem.id}`, {
          ...payload,
          updated_by: 1,
          updated_by_name: '현장작업자'
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
        updated_by_name: '현장작업자'
      });
      loadData();
      setShowDetailModal(false);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
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
      planned_completion_date: '',
      occurrence_photos: [],
      try_location: '',
      try_date: new Date().toISOString().split('T')[0],
      try_machine: '',
      try_material: '',
      shot_count: '',
      cycle_time: '',
      responsible_company_name: ''
    });
    setTempImages([]);
    setSelectedProblem(null);
    setEditMode(false);
    setCurrentStep(1);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'minor': return 'bg-green-100 text-green-700';
      case 'major': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered': return 'bg-gray-100 text-gray-700';
      case 'analyzing': return 'bg-blue-100 text-blue-700';
      case 'improving': return 'bg-yellow-100 text-yellow-700';
      case 'verifying': return 'bg-purple-100 text-purple-700';
      case 'closed': return 'bg-green-100 text-green-700';
      case 'reopened': return 'bg-red-100 text-red-700';
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">금형육성</span>
                </div>
                <h1 className="text-lg font-bold text-gray-900">문제점 관리</h1>
              </div>
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-lg ${showFilter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <Filter size={20} />
            </button>
          </div>
          
          {/* 금형 정보 */}
          {moldInfo && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">{moldInfo.mold?.mold_code || `M-${moldId}`}</span>
              <span>|</span>
              <span>{moldInfo.part_name || '-'}</span>
            </div>
          )}
        </div>

        {/* 필터 */}
        {showFilter && (
          <div className="px-4 pb-3 flex gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">전체 단계</option>
              {NURTURING_STAGES.map(stage => (
                <option key={stage.code} value={stage.code}>{stage.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">전체 상태</option>
              {STATUSES.map(status => (
                <option key={status.code} value={status.code}>{status.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-gray-900">{statistics.total || 0}</div>
              <div className="text-xs text-gray-500">전체</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-red-600">{statistics.recurrenceCount || 0}</div>
              <div className="text-xs text-gray-500">재발</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-yellow-600">
                {statistics.bySeverity?.find(s => s.severity === 'critical')?.count || 0}
              </div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-green-600">
                {statistics.byStatus?.find(s => s.status === 'closed')?.count || 0}
              </div>
              <div className="text-xs text-gray-500">종결</div>
            </div>
          </div>
        </div>
      )}

      {/* 문제점 목록 */}
      <div className="px-4 space-y-3">
        {problems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">등록된 문제점이 없습니다.</p>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
            >
              첫 문제점 등록
            </button>
          </div>
        ) : (
          problems.map((problem) => (
            <div 
              key={problem.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden"
              onClick={() => openDetail(problem)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${getStageColor(problem.nurturing_stage)}`}>
                      {getStageName(problem.nurturing_stage)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(problem.severity)}`}>
                      {SEVERITIES.find(s => s.code === problem.severity)?.name}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(problem.status)}`}>
                    {STATUSES.find(s => s.code === problem.status)?.name}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{problem.problem_summary}</h3>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{problem.occurrence_date}</span>
                  <div className="flex items-center gap-1">
                    {problem.is_recurred && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">재발</span>
                    )}
                    {problem.occurrence_photos?.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Camera size={12} /> {problem.occurrence_photos.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Plus size={20} /> 문제점 등록
        </button>
      </div>

      {/* 문제점 등록 모달 (단계별 입력) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
          <div className="bg-white flex-1 overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-1">
                  <X size={24} />
                </button>
                <h2 className="font-bold text-lg">{editMode ? '문제점 수정' : '문제점 등록'}</h2>
              </div>
              <div className="text-sm text-gray-500">{currentStep}/3</div>
            </div>

            {/* 단계 표시 */}
            <div className="px-4 py-3 bg-gray-50 flex gap-2">
              {[1, 2, 3].map(step => (
                <div 
                  key={step}
                  className={`flex-1 h-1 rounded-full ${currentStep >= step ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              ))}
            </div>

            <div className="p-4">
              {/* Step 1: 기본 정보 */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500" />
                    기본 정보
                  </h3>
                  
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
                      className="w-full border rounded-xl px-4 py-3"
                    >
                      {nurturingStages.map(stage => (
                        <option key={stage.stage_code} value={stage.stage_code}>
                          {stage.stage_name} {stage.is_fixed ? '(고정)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">발생일 *</label>
                      <input
                        type="date"
                        value={formData.occurrence_date}
                        onChange={(e) => handleFormChange('occurrence_date', e.target.value)}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">심각도 *</label>
                      <select
                        value={formData.severity}
                        onChange={(e) => handleFormChange('severity', e.target.value)}
                        className="w-full border rounded-xl px-4 py-3"
                      >
                        {SEVERITIES.map(sev => (
                          <option key={sev.code} value={sev.code}>{sev.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">발견 주체</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DISCOVERED_BY_OPTIONS.map(opt => (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => handleFormChange('discovered_by', opt.code)}
                          className={`py-2 rounded-xl text-sm border ${
                            formData.discovered_by === opt.code
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">문제 유형 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {PROBLEM_TYPES.map(type => (
                        <button
                          key={type.code}
                          type="button"
                          onClick={() => handleMultiSelectToggle('problem_types', type.code)}
                          className={`px-3 py-1.5 rounded-full text-sm border ${
                            formData.problem_types.includes(type.code)
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">문제 요약 *</label>
                    <input
                      type="text"
                      value={formData.problem_summary}
                      onChange={(e) => handleFormChange('problem_summary', e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      placeholder="문제를 간략히 요약"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                    <textarea
                      value={formData.problem_detail}
                      onChange={(e) => handleFormChange('problem_detail', e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      rows={3}
                      placeholder="문제의 상세 내용"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: 사진 촬영 */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Camera size={18} className="text-blue-500" />
                    사진 촬영
                  </h3>
                  
                  <p className="text-sm text-gray-500">
                    현장에서 문제 발생 부위를 촬영해주세요. (최대 5장)
                  </p>

                  {/* 이미지 미리보기 */}
                  {tempImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {tempImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 촬영 버튼 */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCameraCapture}
                      disabled={uploadingImage || tempImages.length >= 5}
                      className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 disabled:opacity-50"
                    >
                      <Camera size={32} className="text-gray-400" />
                      <span className="text-sm text-gray-600">카메라 촬영</span>
                    </button>
                    <button
                      onClick={handleGallerySelect}
                      disabled={uploadingImage || tempImages.length >= 5}
                      className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 disabled:opacity-50"
                    >
                      <Image size={32} className="text-gray-400" />
                      <span className="text-sm text-gray-600">갤러리 선택</span>
                    </button>
                  </div>

                  {uploadingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      업로드 중...
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">발생 위치</label>
                    <input
                      type="text"
                      value={formData.occurrence_location}
                      onChange={(e) => handleFormChange('occurrence_location', e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      placeholder="예: 캐비티 A면 게이트 부근"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: 원인/조치 */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Search size={18} className="text-purple-500" />
                    원인 분석 및 조치
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">추정 원인 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {CAUSE_TYPES.map(type => (
                        <button
                          key={type.code}
                          type="button"
                          onClick={() => handleMultiSelectToggle('cause_types', type.code)}
                          className={`px-3 py-1.5 rounded-full text-sm border ${
                            formData.cause_types.includes(type.code)
                              ? 'bg-purple-100 border-purple-500 text-purple-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">원인 상세</label>
                    <textarea
                      value={formData.cause_detail}
                      onChange={(e) => handleFormChange('cause_detail', e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      rows={2}
                      placeholder="원인에 대한 상세 설명"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="improvement_required"
                      checked={formData.improvement_required}
                      onChange={(e) => handleFormChange('improvement_required', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <label htmlFor="improvement_required" className="text-sm font-medium text-gray-700">
                      개선 조치 필요
                    </label>
                  </div>

                  {formData.improvement_required && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">개선 조치 내용</label>
                        <textarea
                          value={formData.improvement_action}
                          onChange={(e) => handleFormChange('improvement_action', e.target.value)}
                          className="w-full border rounded-xl px-4 py-3"
                          rows={2}
                          placeholder="개선 조치 내용"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">조치 담당</label>
                          <select
                            value={formData.action_responsible}
                            onChange={(e) => handleFormChange('action_responsible', e.target.value)}
                            className="w-full border rounded-xl px-4 py-3"
                          >
                            {DISCOVERED_BY_OPTIONS.map(opt => (
                              <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">완료 예정일</label>
                          <input
                            type="date"
                            value={formData.planned_completion_date}
                            onChange={(e) => handleFormChange('planned_completion_date', e.target.value)}
                            className="w-full border rounded-xl px-4 py-3"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
                >
                  이전
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium"
                >
                  다음
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editMode ? '수정' : '등록'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedProblem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
          <div className="bg-white flex-1 overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowDetailModal(false)} className="p-1">
                  <X size={24} />
                </button>
                <h2 className="font-bold text-lg">{selectedProblem.problem_number}</h2>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedProblem.status)}`}>
                {STATUSES.find(s => s.code === selectedProblem.status)?.name}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* 기본 정보 */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getStageColor(selectedProblem.nurturing_stage)}`}>
                  {getStageName(selectedProblem.nurturing_stage)}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(selectedProblem.severity)}`}>
                  {SEVERITIES.find(s => s.code === selectedProblem.severity)?.name}
                </span>
                {selectedProblem.is_recurred && (
                  <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">재발</span>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">{selectedProblem.problem_summary}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedProblem.occurrence_date}</p>
              </div>

              {/* 사진 */}
              {selectedProblem.occurrence_photos?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">발생 사진</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProblem.occurrence_photos.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img src={url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 내용 */}
              {selectedProblem.problem_detail && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">상세 내용</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    {selectedProblem.problem_detail}
                  </p>
                </div>
              )}

              {/* 원인 분석 */}
              {selectedProblem.cause_detail && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">원인 분석</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-xl">
                    {selectedProblem.cause_detail}
                  </p>
                </div>
              )}

              {/* 개선 조치 */}
              {selectedProblem.improvement_action && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">개선 조치</h4>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-xl">
                    {selectedProblem.improvement_action}
                  </p>
                </div>
              )}

              {/* 이력 */}
              {selectedProblem.histories?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">이력</h4>
                  <div className="space-y-2">
                    {selectedProblem.histories.slice(0, 5).map((history, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5"></div>
                        <div>
                          <span className="text-gray-500">{new Date(history.changed_at).toLocaleDateString()}</span>
                          <span className="mx-1">-</span>
                          <span className="text-gray-700">{history.change_description || history.action_type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 변경 */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">상태 변경</h4>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter(s => s.code !== selectedProblem.status && s.code !== 'reopened').map(status => (
                    <button
                      key={status.code}
                      onClick={() => handleStatusChange(selectedProblem.id, status.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs ${getStatusColor(status.code)}`}
                    >
                      {status.name}
                    </button>
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
