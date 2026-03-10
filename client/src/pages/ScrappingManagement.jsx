import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trash2, Plus, ArrowLeft, Eye, CheckCircle, XCircle, 
  AlertTriangle, Clock, FileText, BarChart3, Save, Send,
  ChevronDown, ChevronUp, Shield, AlertCircle, Package, User, Wrench, Check,
  ClipboardList, DollarSign, Calculator, Search, Archive, BookOpen
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

// 상태 배지 컴포넌트
const StatusBadge = ({ status }) => {
  const config = {
    draft: { label: '임시저장', color: 'bg-slate-100 text-slate-600', icon: Save },
    requested: { label: '요청됨', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    assessed: { label: '평가완료', color: 'bg-cyan-100 text-cyan-700', icon: ClipboardList },
    reviewed: { label: '검토완료', color: 'bg-purple-100 text-purple-700', icon: Calculator },
    first_approved: { label: '1차 승인', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    approved: { label: '최종승인', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700', icon: XCircle },
    scrapped: { label: '폐기완료', color: 'bg-gray-100 text-gray-700', icon: Trash2 },
    closed: { label: '사후관리완료', color: 'bg-indigo-100 text-indigo-700', icon: Archive }
  };
  const { label, color, icon: Icon } = config[status] || config.requested;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// 7단계 표준 폐기 절차 정의
const progressSteps = [
  { key: 'request', label: '폐기요청', icon: FileText },
  { key: 'assessment', label: '상태평가', icon: Search },
  { key: 'review', label: '경제성검토', icon: Calculator },
  { key: 'first_approval', label: '1차승인', icon: Shield },
  { key: 'second_approval', label: '2차승인', icon: Shield },
  { key: 'disposal', label: '폐기처리', icon: Trash2 },
  { key: 'postcare', label: '사후관리', icon: Archive }
];

// 폐기 요청 목록
function ScrappingList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadRequests();
    loadStatistics();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/scrapping', { params });
      setRequests(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/scrapping/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형 폐기 관리</h1>
          <p className="text-sm text-gray-600 mt-1">금형 폐기 요청 및 승인 관리</p>
        </div>
        <button onClick={() => navigate('/scrapping/new')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <Plus size={18} />폐기 요청
        </button>
      </div>

      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statistics.by_status?.map((stat) => (
            <div key={stat.status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={stat.status} />
                <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: '전체' },
          { value: 'requested', label: '요청됨' },
          { value: 'first_approved', label: '1차 승인' },
          { value: 'approved', label: '승인완료' },
          { value: 'scrapped', label: '폐기완료' },
          { value: 'rejected', label: '반려됨' }
        ].map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">폐기 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">요청번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">금형코드</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">품번 / 품명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">폐기사유</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">현재타수</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">요청일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.request_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.mold_code || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{item.part_number || '-'}</div>
                    <div className="text-xs text-gray-500">{item.part_name || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.reason || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.current_shots?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.requested_at ? new Date(item.requested_at).toLocaleDateString('ko-KR') : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => navigate(`/scrapping/${item.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 폐기 요청 상세/폼 (7단계 표준 워크플로)
function ScrappingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isNew = id === 'new';

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [stepSaving, setStepSaving] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    mold_id: '',
    reason: '',
    reason_detail: '',
    condition_assessment: '',
    estimated_scrap_value: '',
    // 상태 평가 항목
    appearance_condition: '',
    functional_condition: '',
    dimensional_condition: '',
    assessment_notes: '',
    assessed_by_name: '',
    // 경제성 검토 항목
    repair_cost_estimate: '',
    new_mold_cost: '',
    remaining_value: '',
    review_result: '',
    review_notes: '',
    reviewed_by_name: '',
    // 폐기 처리 항목
    disposal_method: '',
    disposal_company: '',
    disposal_cost: '',
    disposal_certificate: '',
    // 사후 관리 항목
    asset_disposal_completed: false,
    documentation_archived: false,
    replacement_plan: '',
    postcare_notes: ''
  });
  const [molds, setMolds] = useState([]);
  const [selectedMold, setSelectedMold] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    request: true,
    assessment: false,
    review: false,
    firstApproval: false,
    secondApproval: false,
    disposal: false,
    postcare: false
  });

  useEffect(() => {
    loadMolds();
    if (!isNew && id) {
      loadRequest();
    }
  }, [id]);

  const loadMolds = async () => {
    try {
      const response = await api.get('/molds', { params: { limit: 200 } });
      setMolds(response.data.data.items || response.data.data || []);
    } catch (error) {
      console.error('Failed to load molds:', error);
    }
  };

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/scrapping/${id}`);
      const data = response.data.data;
      setRequest(data);
      setFormData({
        mold_id: data.mold_id || '',
        reason: data.reason || '',
        reason_detail: data.reason_detail || '',
        condition_assessment: data.condition_assessment || '',
        estimated_scrap_value: data.estimated_scrap_value || '',
        appearance_condition: data.appearance_condition || '',
        functional_condition: data.functional_condition || '',
        dimensional_condition: data.dimensional_condition || '',
        assessment_notes: data.assessment_notes || '',
        assessed_by_name: data.assessed_by_name || '',
        repair_cost_estimate: data.repair_cost_estimate || '',
        new_mold_cost: data.new_mold_cost || '',
        remaining_value: data.remaining_value || '',
        review_result: data.review_result || '',
        review_notes: data.review_notes || '',
        reviewed_by_name: data.reviewed_by_name || '',
        disposal_method: data.disposal_method || '',
        disposal_company: data.disposal_company || '',
        disposal_cost: data.disposal_cost || '',
        disposal_certificate: data.disposal_certificate || '',
        asset_disposal_completed: data.asset_disposal_completed || false,
        documentation_archived: data.documentation_archived || false,
        replacement_plan: data.replacement_plan || '',
        postcare_notes: data.postcare_notes || ''
      });
      // 승인 단계에 따라 섹션 열기
      const s = data.status;
      if (s === 'requested') setExpandedSections(prev => ({ ...prev, assessment: true }));
      else if (s === 'assessed') setExpandedSections(prev => ({ ...prev, review: true }));
      else if (s === 'reviewed') setExpandedSections(prev => ({ ...prev, firstApproval: true }));
      else if (s === 'first_approved') setExpandedSections(prev => ({ ...prev, secondApproval: true }));
      else if (s === 'approved') setExpandedSections(prev => ({ ...prev, disposal: true }));
      else if (s === 'scrapped') setExpandedSections(prev => ({ ...prev, postcare: true }));
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.mold_id) {
      const mold = molds.find(m => m.id === parseInt(formData.mold_id));
      setSelectedMold(mold || null);
    } else {
      setSelectedMold(null);
    }
  }, [formData.mold_id, molds]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 7단계 진행 상태 계산
  const getCurrentStep = () => {
    const s = request?.status || 'draft';
    if (s === 'draft') return 0;
    if (s === 'requested') return 1;
    if (s === 'assessed') return 2;
    if (s === 'reviewed') return 3;
    if (s === 'first_approved') return 4;
    if (s === 'approved') return 5;
    if (s === 'scrapped') return 6;
    if (s === 'closed') return 7;
    if (s === 'rejected') return 0;
    return 0;
  };

  // 단계별 임시저장
  const handleStepSave = async (stepName) => {
    setStepSaving(stepName);
    setSaveMessage(null);
    try {
      if (isNew || !id || id === 'new') {
        await api.post('/scrapping', { ...formData, status: 'draft', current_step: stepName });
      } else {
        await api.patch(`/scrapping/${id}`, { ...formData, status: request?.status || 'draft', current_step: stepName });
      }
      setSaveMessage({ type: 'success', text: `${stepName} 단계 임시저장 완료` });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Step save failed:', error);
      setSaveMessage({ type: 'error', text: '임시저장에 실패했습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setStepSaving(null);
    }
  };

  // 폐기 요청 제출
  const handleSubmit = async () => {
    if (!formData.mold_id || !formData.reason) {
      alert('금형과 폐기 사유를 선택해주세요.');
      return;
    }
    try {
      setSaving(true);
      const response = await api.post('/scrapping', formData);
      if (response.data.success) {
        alert('폐기 요청이 등록되었습니다.');
        navigate('/scrapping');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('등록에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // 상태 평가 완료
  const handleAssessmentComplete = async () => {
    if (!formData.appearance_condition || !formData.functional_condition) {
      alert('외관 상태와 기능 상태를 모두 평가해주세요.');
      return;
    }
    if (!confirm('상태 평가를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.patch(`/scrapping/${id}`, { ...formData, status: 'assessed', current_step: '상태평가' });
      setSaveMessage({ type: 'success', text: '상태 평가 완료' });
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('상태 평가 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 경제성 검토 완료
  const handleReviewComplete = async () => {
    if (!formData.review_result) {
      alert('경제성 검토 결과를 선택해주세요.');
      return;
    }
    if (!confirm('경제성 검토를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.patch(`/scrapping/${id}`, { ...formData, status: 'reviewed', current_step: '경제성검토' });
      setSaveMessage({ type: 'success', text: '경제성 검토 완료' });
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('경제성 검토 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 1차 승인
  const handleFirstApprove = async () => {
    if (!confirm('1차 승인(금형개발 담당)을 승인하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/first-approve`, { notes: rejectionReason || null });
      setSaveMessage({ type: 'success', text: '1차 승인 완료' });
      setRejectionReason('');
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('승인 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 2차 승인
  const handleSecondApprove = async () => {
    if (!confirm('2차 승인(최종)을 승인하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/second-approve`, { notes: rejectionReason || null });
      setSaveMessage({ type: 'success', text: '2차 승인(최종) 완료' });
      setRejectionReason('');
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('승인 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 반려 처리
  const handleReject = async (step) => {
    if (!rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    const stepLabels = { first: '1차 승인', second: '2차 승인' };
    if (!confirm(`${stepLabels[step]} 단계를 반려하시겠습니까?`)) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/reject`, { reason: rejectionReason });
      setSaveMessage({ type: 'success', text: `${stepLabels[step]} 단계 반려 완료` });
      setRejectionReason('');
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('반려 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 폐기 처리 완료
  const handleComplete = async () => {
    if (!confirm('폐기 처리를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/complete`, {
        disposal_method: formData.disposal_method,
        disposal_company: formData.disposal_company,
        disposal_cost: formData.disposal_cost ? parseInt(formData.disposal_cost) : null,
        disposal_certificate: formData.disposal_certificate
      });
      setSaveMessage({ type: 'success', text: '폐기 처리가 완료되었습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('폐기 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 사후관리 완료
  const handlePostcareComplete = async () => {
    if (!confirm('사후관리를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.patch(`/scrapping/${id}`, {
        ...formData,
        status: 'closed',
        current_step: '사후관리'
      });
      setSaveMessage({ type: 'success', text: '사후관리 완료. 폐기 절차가 종결되었습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) {
      alert('사후관리 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep();
  const status = request?.status || 'draft';
  const canEditRequest = isNew || status === 'draft';

  return (
    <div className="max-w-5xl mx-auto pb-8 px-4">
      {/* 헤더 */}
      <div className="mb-6">
        <button onClick={() => navigate('/scrapping')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} className="mr-2" />뒤로 가기
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><Trash2 className="text-red-600" size={24} /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isNew ? '금형 폐기 요청' : request?.request_number || '폐기 요청'}</h1>
              <p className="text-sm text-gray-500">
                {selectedMold ? `${selectedMold.mold_code} - ${selectedMold.part_name || ''}` : request ? `${request.mold_code || ''} - ${request.part_name || ''}` : '금형을 선택하세요'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isNew && <StatusBadge status={status} />}
            {saveMessage && <div className={`px-4 py-2 rounded-lg text-sm font-medium ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{saveMessage.text}</div>}
          </div>
        </div>
      </div>

      {/* 7단계 진행 상태 표시 */}
      {!isNew && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="text-red-600" size={20} />
            <h3 className="font-semibold text-gray-800">표준 폐기 절차 진행현황</h3>
          </div>
          <div className="flex items-center justify-between">
            {progressSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div className={`absolute left-0 top-6 w-full h-0.5 -translate-x-1/2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: '100%', left: '-50%' }} />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all z-10 ${isActive ? 'bg-red-600 text-white ring-4 ring-red-100' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                  </div>
                  <span className={`text-[11px] font-medium ${isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        {/* ───── 1. 폐기 요청 ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('request')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><FileText className="text-red-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">1. 폐기 요청</h3>
                <p className="text-xs text-gray-500">금형 선택, 폐기 사유 입력 <span className="text-red-500">* 필수</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">요청자</span>
              {expandedSections.request ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.request && (
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Package size={16} className="text-blue-600" />금형 선택 <span className="text-red-500">*</span></h4>
                <select value={formData.mold_id} onChange={(e) => handleChange('mold_id', e.target.value)} disabled={!isNew} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100">
                  <option value="">금형을 선택하세요</option>
                  {molds.map(m => <option key={m.id} value={m.id}>{m.mold_code} - {m.part_name || m.mold_name || '-'}</option>)}
                </select>
              </div>
              {(selectedMold || request) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Package size={16} className="text-blue-600" />금형 기본 정보 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">자동 로딩</span></h4>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">금형코드</p><p className="text-sm font-medium">{selectedMold?.mold_code || request?.mold_code || '-'}</p></div>
                    <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">품번</p><p className="text-sm font-medium">{selectedMold?.part_number || request?.part_number || '-'}</p></div>
                    <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">품명</p><p className="text-sm font-medium">{selectedMold?.part_name || request?.part_name || '-'}</p></div>
                    <div className="p-3 bg-gray-50 rounded-lg border"><p className="text-xs text-gray-500 mb-1">차종</p><p className="text-sm font-medium">{selectedMold?.car_model || request?.car_model || '-'}</p></div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200"><p className="text-xs text-gray-500 mb-1">누적 타수</p><p className="text-sm font-bold text-red-600">{(selectedMold?.current_shots || request?.current_shots || 0).toLocaleString()}</p></div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">폐기 사유 <span className="text-red-500">*</span></label>
                  <select value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} disabled={!canEditRequest} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="">사유를 선택하세요</option>
                    <option value="수명종료">수명 종료</option><option value="수리불가">수리 불가</option><option value="모델단종">모델 단종</option>
                    <option value="품질불량">품질 불량</option><option value="경제성부족">경제성 부족</option><option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">요청자</label>
                  <input type="text" value={user?.name || request?.requested_by_name || ''} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 사유</label>
                <textarea value={formData.reason_detail} onChange={(e) => handleChange('reason_detail', e.target.value)} disabled={!canEditRequest} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="상세 사유를 입력하세요" />
              </div>
              {request?.repair_summary && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2"><Wrench size={16} />수리 이력 요약</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">총 수리횟수:</span> <span className="font-medium">{request.repair_summary.total_repairs || 0}회</span></div>
                    <div><span className="text-gray-500">총 수리비용:</span> <span className="font-medium">{(request.repair_summary.total_cost || 0).toLocaleString()}원</span></div>
                    <div><span className="text-gray-500">최종 수리:</span> <span className="font-medium">{request.repair_summary.last_repair_date ? new Date(request.repair_summary.last_repair_date).toLocaleDateString('ko-KR') : '-'}</span></div>
                  </div>
                </div>
              )}
              {canEditRequest && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('요청')} disabled={stepSaving === '요청'} className="px-5 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Save size={16} />{stepSaving === '요청' ? '저장중...' : '임시저장'}</button>
                  <button type="button" onClick={handleSubmit} disabled={saving} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Send size={16} />{saving ? '제출중...' : '폐기 요청 제출'}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───── 2. 상태 평가 ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('assessment')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg"><Search className="text-cyan-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">2. 상태 평가</h3>
                <p className="text-xs text-gray-500">금형 외관·기능·치수 상태 점검</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">평가자</span>
              {(request?.status && ['assessed','reviewed','first_approved','approved','scrapped','closed'].includes(request.status)) && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">완료</span>}
              {expandedSections.assessment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.assessment && (
            <div className="p-6 space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <p className="text-sm text-cyan-800"><AlertCircle className="inline mr-2" size={16} />금형의 현재 상태를 외관, 기능, 치수 3가지 항목으로 평가합니다.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">외관 상태 <span className="text-red-500">*</span></label>
                  <select value={formData.appearance_condition} onChange={(e) => handleChange('appearance_condition', e.target.value)} disabled={status !== 'requested'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="">선택</option><option value="양호">양호</option><option value="경미손상">경미 손상</option><option value="중대손상">중대 손상</option><option value="파손">파손</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기능 상태 <span className="text-red-500">*</span></label>
                  <select value={formData.functional_condition} onChange={(e) => handleChange('functional_condition', e.target.value)} disabled={status !== 'requested'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="">선택</option><option value="정상">정상</option><option value="부분불량">부분 불량</option><option value="기능저하">기능 저하</option><option value="작동불가">작동 불가</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">치수 상태</label>
                  <select value={formData.dimensional_condition} onChange={(e) => handleChange('dimensional_condition', e.target.value)} disabled={status !== 'requested'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="">선택</option><option value="규격내">규격 내</option><option value="경미이탈">경미 이탈</option><option value="규격초과">규격 초과</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">평가 소견</label>
                <textarea value={formData.assessment_notes} onChange={(e) => handleChange('assessment_notes', e.target.value)} disabled={status !== 'requested'} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="평가 소견을 입력하세요" />
              </div>
              {status === 'requested' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('상태평가')} disabled={stepSaving === '상태평가'} className="px-5 py-2 border border-cyan-300 text-cyan-700 rounded-lg hover:bg-cyan-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Save size={16} />임시저장</button>
                  <button type="button" onClick={handleAssessmentComplete} disabled={saving} className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} />상태 평가 완료</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───── 3. 경제성 검토 ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('review')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Calculator className="text-purple-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">3. 경제성 검토</h3>
                <p className="text-xs text-gray-500">수리비 vs 잔존가치 vs 신규 제작비 비교 분석</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">검토자</span>
              {(request?.status && ['reviewed','first_approved','approved','scrapped','closed'].includes(request.status)) && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">완료</span>}
              {expandedSections.review ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.review && (
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800"><AlertCircle className="inline mr-2" size={16} />폐기 vs 수리 vs 신규 제작의 경제성을 비교 분석합니다.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예상 수리비 (원)</label>
                  <input type="number" value={formData.repair_cost_estimate} onChange={(e) => handleChange('repair_cost_estimate', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신규 금형 제작비 (원)</label>
                  <input type="number" value={formData.new_mold_cost} onChange={(e) => handleChange('new_mold_cost', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">잔존가치 (원)</label>
                  <input type="number" value={formData.remaining_value || formData.estimated_scrap_value} onChange={(e) => handleChange('remaining_value', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" />
                </div>
              </div>
              {/* 비교 분석 요약 */}
              {(formData.repair_cost_estimate || formData.new_mold_cost || formData.remaining_value) && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">비교 분석 요약</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-orange-50 rounded-lg"><p className="text-xs text-gray-500">수리비</p><p className="font-bold text-orange-600">{parseInt(formData.repair_cost_estimate || 0).toLocaleString()}원</p></div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">신규 제작비</p><p className="font-bold text-blue-600">{parseInt(formData.new_mold_cost || 0).toLocaleString()}원</p></div>
                    <div className="text-center p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-500">잔존가치</p><p className="font-bold text-green-600">{parseInt(formData.remaining_value || formData.estimated_scrap_value || 0).toLocaleString()}원</p></div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">경제성 검토 결과 <span className="text-red-500">*</span></label>
                  <select value={formData.review_result} onChange={(e) => handleChange('review_result', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                    <option value="">결과 선택</option>
                    <option value="폐기타당">폐기 타당 - 수리비가 잔존가치 초과</option>
                    <option value="폐기권고">폐기 권고 - 경제적 효율 낮음</option>
                    <option value="수리검토">수리 검토 필요 - 수리 가능성 있음</option>
                    <option value="폐기보류">폐기 보류 - 추가 검토 필요</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">검토 의견</label>
                  <input type="text" value={formData.review_notes} onChange={(e) => handleChange('review_notes', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="검토 의견" />
                </div>
              </div>
              {status === 'assessed' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('경제성검토')} disabled={stepSaving === '경제성검토'} className="px-5 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Save size={16} />임시저장</button>
                  <button type="button" onClick={handleReviewComplete} disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} />경제성 검토 완료</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───── 4. 1차 승인 (금형개발 담당) ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('firstApproval')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Shield className="text-blue-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">4. 1차 승인</h3>
                <p className="text-xs text-gray-500">금형개발 담당 - 상태평가 및 경제성 검토 결과 확인</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">금형개발</span>
              {request?.first_approved_at && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">승인완료</span>}
              {expandedSections.firstApproval ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.firstApproval && (
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800"><AlertCircle className="inline mr-2" size={16} />상태 평가 및 경제성 검토 결과를 확인하고 1차 승인합니다.</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-1">승인자</label><input type="text" value={request?.first_approved_by_name || user?.name || '-'} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">승인상태</label><span className={`inline-block px-3 py-2 rounded-lg text-sm ${request?.first_approved_at ? 'bg-green-100 text-green-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{request?.first_approved_at ? '승인완료' : status === 'rejected' ? '반려' : '대기'}</span></div>
                </div>
                {request?.first_approved_at && <div className="mt-2 text-xs text-gray-500">승인일시: {new Date(request.first_approved_at).toLocaleString('ko-KR')}</div>}
                {status === 'reviewed' && (
                  <div className="mt-4"><label className="block text-xs text-gray-600 mb-1">승인 의견 / 반려 사유</label><input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="의견 또는 반려 사유..." /></div>
                )}
              </div>
              {status === 'reviewed' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => handleReject('first')} disabled={saving} className="px-5 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><XCircle size={16} />반려</button>
                  <button type="button" onClick={handleFirstApprove} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} />1차 승인</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───── 5. 2차 승인 (시스템 관리자) ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('secondApproval')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><Shield className="text-green-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">5. 2차 승인 (최종)</h3>
                <p className="text-xs text-gray-500">시스템 관리자 - 최종 폐기 승인</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">관리자</span>
              {request?.second_approved_at && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">승인완료</span>}
              {expandedSections.secondApproval ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.secondApproval && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800"><AlertCircle className="inline mr-2" size={16} />1차 승인된 폐기 요청을 최종 승인합니다.</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-1">승인자</label><input type="text" value={request?.second_approved_by_name || user?.name || '-'} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">승인상태</label><span className={`inline-block px-3 py-2 rounded-lg text-sm ${request?.second_approved_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{request?.second_approved_at ? '승인완료' : '대기'}</span></div>
                </div>
                {request?.second_approved_at && <div className="mt-2 text-xs text-gray-500">승인일시: {new Date(request.second_approved_at).toLocaleString('ko-KR')}</div>}
                {status === 'first_approved' && (
                  <div className="mt-4"><label className="block text-xs text-gray-600 mb-1">승인 의견 / 반려 사유</label><input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="의견 또는 반려 사유..." /></div>
                )}
              </div>
              {status === 'first_approved' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => handleReject('second')} disabled={saving} className="px-5 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><XCircle size={16} />반려</button>
                  <button type="button" onClick={handleSecondApprove} disabled={saving} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} />2차 승인 (최종)</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───── 6. 폐기 처리 ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('disposal')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Trash2 className="text-orange-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">6. 폐기 처리</h3>
                <p className="text-xs text-gray-500">처리 방법, 업체, 비용, 인증서</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">처리자</span>
              {request?.scrapped_at && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">완료</span>}
              {expandedSections.disposal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.disposal && (
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4"><p className="text-sm text-orange-800"><AlertCircle className="inline mr-2" size={16} />최종 승인 완료 후 실제 폐기 처리를 진행합니다.</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">처리 방법</label><select value={formData.disposal_method} onChange={(e) => handleChange('disposal_method', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"><option value="">방법 선택</option><option value="전문업체 위탁">전문업체 위탁</option><option value="자체 처리">자체 처리</option><option value="재활용 매각">재활용 매각</option><option value="부품 분리 후 폐기">부품 분리 후 폐기</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">처리 업체</label><input type="text" value={formData.disposal_company} onChange={(e) => handleChange('disposal_company', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="처리 업체명" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">처리 비용 (원)</label><input type="number" value={formData.disposal_cost} onChange={(e) => handleChange('disposal_cost', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">폐기 인증서 번호</label><input type="text" value={formData.disposal_certificate} onChange={(e) => handleChange('disposal_certificate', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="인증서 번호" /></div>
              </div>
              {status === 'approved' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('폐기처리')} disabled={stepSaving === '폐기처리'} className="px-5 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Save size={16} />임시저장</button>
                  <button type="button" onClick={handleComplete} disabled={saving} className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Trash2 size={16} />{saving ? '처리중...' : '폐기 처리 완료'}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───── 7. 사후 관리 ───── */}
        <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <button type="button" onClick={() => toggleSection('postcare')} className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-slate-50 hover:from-indigo-100 hover:to-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg"><Archive className="text-indigo-600" size={20} /></div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">7. 사후 관리</h3>
                <p className="text-xs text-gray-500">자산 처리, 문서 보관, 대체 금형 계획</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status === 'closed' && <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">절차종결</span>}
              {expandedSections.postcare ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          {expandedSections.postcare && (
            <div className="p-6 space-y-4">
              {(status === 'scrapped' || status === 'closed') ? (
                <>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-800"><AlertCircle className="inline mr-2" size={16} />폐기 처리 완료 후 사후 관리 항목을 확인합니다.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={formData.asset_disposal_completed} onChange={(e) => handleChange('asset_disposal_completed', e.target.checked)} disabled={status === 'closed'} className="w-4 h-4 text-indigo-600 rounded" />
                      <div><p className="text-sm font-medium text-gray-700">자산 처리 완료</p><p className="text-xs text-gray-500">고정자산 대장에서 해당 금형 제거 및 감가상각 처리</p></div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={formData.documentation_archived} onChange={(e) => handleChange('documentation_archived', e.target.checked)} disabled={status === 'closed'} className="w-4 h-4 text-indigo-600 rounded" />
                      <div><p className="text-sm font-medium text-gray-700">문서 보관 완료</p><p className="text-xs text-gray-500">폐기 관련 문서(요청서, 승인서, 인증서) 보관 처리</p></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">대체 금형 계획</label>
                    <textarea value={formData.replacement_plan} onChange={(e) => handleChange('replacement_plan', e.target.value)} disabled={status === 'closed'} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="대체 금형 신규 제작 또는 이관 계획" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사후관리 비고</label>
                    <input type="text" value={formData.postcare_notes} onChange={(e) => handleChange('postcare_notes', e.target.value)} disabled={status === 'closed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="기타 사후관리 사항" />
                  </div>
                  {status === 'scrapped' && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button type="button" onClick={() => handleStepSave('사후관리')} disabled={stepSaving === '사후관리'} className="px-5 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Save size={16} />임시저장</button>
                      <button type="button" onClick={handlePostcareComplete} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"><Archive size={16} />{saving ? '처리중...' : '사후관리 완료 (절차 종결)'}</button>
                    </div>
                  )}
                  {status === 'closed' && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center mt-4">
                      <Archive className="mx-auto mb-3 text-indigo-400" size={48} />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">폐기 절차 종결</h4>
                      <p className="text-sm text-gray-600 mb-4">모든 폐기 절차가 완료되었습니다.</p>
                      <div className="inline-flex flex-col gap-1 text-sm text-gray-500">
                        {request?.scrapped_at && <span>폐기일시: {new Date(request.scrapped_at).toLocaleString('ko-KR')}</span>}
                        {request?.scrapped_by_name && <span>처리자: {request.scrapped_by_name}</span>}
                        {request?.disposal_method && <span>처리방법: {request.disposal_method}</span>}
                        {request?.disposal_company && <span>처리업체: {request.disposal_company}</span>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <Clock className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-sm text-gray-500">폐기 처리 완료 후 사후관리를 진행합니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function ScrappingManagement() {
  const { id } = useParams();
  
  if (id) {
    return <ScrappingDetail />;
  }
  
  return <ScrappingList />;
}
