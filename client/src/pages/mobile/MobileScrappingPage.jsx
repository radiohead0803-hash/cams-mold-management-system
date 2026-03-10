import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trash2, ArrowLeft, Plus, AlertTriangle, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronUp, FileText, Save, Send,
  Shield, AlertCircle, Package, Wrench, Check,
  Search, Calculator, Archive
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

// 상태 배지
const StatusBadge = ({ status }) => {
  const config = {
    draft: { label: '임시저장', color: 'bg-slate-100 text-slate-600', icon: Save },
    requested: { label: '요청됨', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    assessed: { label: '평가완료', color: 'bg-cyan-100 text-cyan-700', icon: Search },
    reviewed: { label: '검토완료', color: 'bg-purple-100 text-purple-700', icon: Calculator },
    first_approved: { label: '1차승인', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    approved: { label: '최종승인', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '반려', color: 'bg-red-100 text-red-700', icon: XCircle },
    scrapped: { label: '폐기완료', color: 'bg-gray-100 text-gray-700', icon: Trash2 },
    closed: { label: '절차종결', color: 'bg-indigo-100 text-indigo-700', icon: Archive }
  };
  const { label, color, icon: Icon } = config[status] || config.requested;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// 7단계 표준 폐기 절차
const progressSteps = [
  { key: 'request', label: '요청', icon: FileText },
  { key: 'assessment', label: '평가', icon: Search },
  { key: 'review', label: '검토', icon: Calculator },
  { key: 'first_approval', label: '1차', icon: Shield },
  { key: 'second_approval', label: '2차', icon: Shield },
  { key: 'disposal', label: '폐기', icon: Trash2 },
  { key: 'postcare', label: '사후', icon: Archive }
];

// 목록 페이지
function ScrappingList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scrapping', { params: { limit: 20 } });
      setRequests(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft size={20} className="text-gray-600" /></button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">금형 폐기 관리</h1>
          <p className="text-xs text-gray-500">폐기 요청 및 승인 현황</p>
        </div>
        <button onClick={() => navigate('/mobile/scrapping/new')} className="p-2 bg-red-600 text-white rounded-lg"><Plus size={20} /></button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500">폐기 요청이 없습니다.</p>
            <button onClick={() => navigate('/mobile/scrapping/new')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">폐기 요청</button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <button key={req.id} onClick={() => navigate(`/mobile/scrapping/${req.id}`)} className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{req.mold_code || req.request_number}</div>
                    <div className="text-sm text-gray-600">{req.part_name || '-'}</div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{req.reason || '-'}</span>
                  <span>{req.requested_at ? new Date(req.requested_at).toLocaleDateString('ko-KR') : '-'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 상세/폼 (7단계 표준 워크플로)
function ScrappingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isNew = !id || id === 'new';

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [stepSaving, setStepSaving] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    mold_id: '', reason: '', reason_detail: '', condition_assessment: '', estimated_scrap_value: '',
    appearance_condition: '', functional_condition: '', dimensional_condition: '', assessment_notes: '',
    repair_cost_estimate: '', new_mold_cost: '', remaining_value: '', review_result: '', review_notes: '',
    disposal_method: '', disposal_company: '', disposal_cost: '', disposal_certificate: '',
    asset_disposal_completed: false, documentation_archived: false, replacement_plan: '', postcare_notes: ''
  });
  const [molds, setMolds] = useState([]);
  const [selectedMold, setSelectedMold] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    request: true, assessment: false, review: false,
    firstApproval: false, secondApproval: false, disposal: false, postcare: false
  });

  useEffect(() => {
    loadMolds();
    if (!isNew && id) loadRequest();
  }, [id]);

  const loadMolds = async () => {
    try {
      const response = await api.get('/molds', { params: { limit: 200 } });
      setMolds(response.data.data.items || response.data.data || []);
    } catch (error) { console.error('Failed to load molds:', error); }
  };

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/scrapping/${id}`);
      const data = response.data.data;
      setRequest(data);
      setFormData({
        mold_id: data.mold_id || '', reason: data.reason || '', reason_detail: data.reason_detail || '',
        condition_assessment: data.condition_assessment || '', estimated_scrap_value: data.estimated_scrap_value || '',
        appearance_condition: data.appearance_condition || '', functional_condition: data.functional_condition || '',
        dimensional_condition: data.dimensional_condition || '', assessment_notes: data.assessment_notes || '',
        repair_cost_estimate: data.repair_cost_estimate || '', new_mold_cost: data.new_mold_cost || '',
        remaining_value: data.remaining_value || '', review_result: data.review_result || '', review_notes: data.review_notes || '',
        disposal_method: data.disposal_method || '', disposal_company: data.disposal_company || '',
        disposal_cost: data.disposal_cost || '', disposal_certificate: data.disposal_certificate || '',
        asset_disposal_completed: data.asset_disposal_completed || false, documentation_archived: data.documentation_archived || false,
        replacement_plan: data.replacement_plan || '', postcare_notes: data.postcare_notes || ''
      });
      const s = data.status;
      if (s === 'requested') setExpandedSections(p => ({ ...p, assessment: true }));
      else if (s === 'assessed') setExpandedSections(p => ({ ...p, review: true }));
      else if (s === 'reviewed') setExpandedSections(p => ({ ...p, firstApproval: true }));
      else if (s === 'first_approved') setExpandedSections(p => ({ ...p, secondApproval: true }));
      else if (s === 'approved') setExpandedSections(p => ({ ...p, disposal: true }));
      else if (s === 'scrapped') setExpandedSections(p => ({ ...p, postcare: true }));
    } catch (error) { console.error('Failed to load request:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (formData.mold_id) { setSelectedMold(molds.find(m => m.id === parseInt(formData.mold_id)) || null); }
    else { setSelectedMold(null); }
  }, [formData.mold_id, molds]);

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

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
    return 0;
  };

  const handleStepSave = async (stepName) => {
    setStepSaving(stepName); setSaveMessage(null);
    try {
      if (isNew || !id || id === 'new') {
        await api.post('/scrapping', { ...formData, status: 'draft', current_step: stepName });
      } else {
        await api.patch(`/scrapping/${id}`, { ...formData, status: request?.status || 'draft', current_step: stepName });
      }
      setSaveMessage({ type: 'success', text: `${stepName} 임시저장 완료` });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: '임시저장 실패' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally { setStepSaving(null); }
  };

  const handleSubmit = async () => {
    if (!formData.mold_id || !formData.reason) { alert('금형과 폐기 사유를 선택해주세요.'); return; }
    try {
      setSaving(true);
      await api.post('/scrapping', formData);
      alert('폐기 요청이 등록되었습니다.');
      navigate('/mobile/scrapping');
    } catch (error) { alert('등록 실패: ' + (error.response?.data?.error?.message || error.message)); }
    finally { setSaving(false); }
  };

  const handleAssessmentComplete = async () => {
    if (!formData.appearance_condition || !formData.functional_condition) { alert('외관/기능 상태를 평가해주세요.'); return; }
    if (!confirm('상태 평가를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.patch(`/scrapping/${id}`, { ...formData, status: 'assessed', current_step: '상태평가' });
      setSaveMessage({ type: 'success', text: '상태 평가 완료' });
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) { alert('상태 평가 실패'); } finally { setSaving(false); }
  };

  const handleReviewComplete = async () => {
    if (!formData.review_result) { alert('경제성 검토 결과를 선택해주세요.'); return; }
    if (!confirm('경제성 검토를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.patch(`/scrapping/${id}`, { ...formData, status: 'reviewed', current_step: '경제성검토' });
      setSaveMessage({ type: 'success', text: '경제성 검토 완료' });
      setTimeout(() => setSaveMessage(null), 3000);
      await loadRequest();
    } catch (error) { alert('경제성 검토 실패'); } finally { setSaving(false); }
  };

  const handleFirstApprove = async () => {
    if (!confirm('1차 승인하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/first-approve`, { notes: rejectionReason || null });
      setSaveMessage({ type: 'success', text: '1차 승인 완료' }); setRejectionReason('');
      setTimeout(() => setSaveMessage(null), 3000); await loadRequest();
    } catch (error) { alert('승인 실패'); } finally { setSaving(false); }
  };

  const handleSecondApprove = async () => {
    if (!confirm('2차 승인(최종)하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/second-approve`, { notes: rejectionReason || null });
      setSaveMessage({ type: 'success', text: '2차 승인 완료' }); setRejectionReason('');
      setTimeout(() => setSaveMessage(null), 3000); await loadRequest();
    } catch (error) { alert('승인 실패'); } finally { setSaving(false); }
  };

  const handleReject = async (step) => {
    if (!rejectionReason.trim()) { alert('반려 사유를 입력해주세요.'); return; }
    if (!confirm('반려하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/reject`, { reason: rejectionReason });
      setSaveMessage({ type: 'success', text: '반려 완료' }); setRejectionReason('');
      setTimeout(() => setSaveMessage(null), 3000); await loadRequest();
    } catch (error) { alert('반려 실패'); } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    if (!confirm('폐기 처리를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.post(`/scrapping/${id}/complete`, {
        disposal_method: formData.disposal_method, disposal_company: formData.disposal_company,
        disposal_cost: formData.disposal_cost ? parseInt(formData.disposal_cost) : null, disposal_certificate: formData.disposal_certificate
      });
      setSaveMessage({ type: 'success', text: '폐기 처리 완료' });
      setTimeout(() => setSaveMessage(null), 3000); await loadRequest();
    } catch (error) { alert('폐기 처리 실패'); } finally { setSaving(false); }
  };

  const handlePostcareComplete = async () => {
    if (!confirm('사후관리를 완료하시겠습니까?')) return;
    try {
      setSaving(true);
      await api.patch(`/scrapping/${id}`, { ...formData, status: 'closed', current_step: '사후관리' });
      setSaveMessage({ type: 'success', text: '사후관리 완료. 절차 종결.' });
      setTimeout(() => setSaveMessage(null), 3000); await loadRequest();
    } catch (error) { alert('사후관리 실패'); } finally { setSaving(false); }
  };

  if (loading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div></div>);
  }

  const currentStep = getCurrentStep();
  const status = request?.status || 'draft';
  const canEditRequest = isNew || status === 'draft';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mobile/scrapping')} className="p-2 -ml-2"><ArrowLeft size={20} className="text-gray-600" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900 text-sm">{isNew ? '폐기 요청' : request?.request_number || '폐기 요청'}</h1>
              {!isNew && <StatusBadge status={status} />}
            </div>
            <p className="text-xs text-gray-500">
              {selectedMold ? `${selectedMold.mold_code} - ${selectedMold.part_name || ''}` : request ? `${request.mold_code || ''} - ${request.part_name || ''}` : '금형을 선택하세요'}
            </p>
          </div>
        </div>
        {saveMessage && (<div className={`mt-2 p-2 rounded-lg text-xs font-medium ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{saveMessage.text}</div>)}
      </div>

      {/* 7단계 진행 상태 */}
      {!isNew && (
        <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between">
            {progressSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (<div className={`absolute left-0 top-3.5 w-full h-0.5 -translate-x-1/2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: '100%', left: '-50%' }} />)}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 z-10 ${isActive ? 'bg-red-600 text-white ring-2 ring-red-100' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isCompleted ? <Check size={12} /> : <StepIcon size={12} />}
                  </div>
                  <span className={`text-[9px] font-medium ${isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── 1. 폐기 요청 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('request')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-red-50 to-rose-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg"><FileText className="text-red-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">1. 폐기 요청</h3><p className="text-[10px] text-gray-500">금형 선택, 폐기 사유</p></div>
            </div>
            {expandedSections.request ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.request && (
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">금형 선택 *</label>
                <select value={formData.mold_id} onChange={(e) => handleChange('mold_id', e.target.value)} disabled={!isNew} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">금형을 선택하세요</option>
                  {molds.map(m => <option key={m.id} value={m.id}>{m.mold_code} - {m.part_name || m.mold_name || '-'}</option>)}
                </select>
              </div>
              {(selectedMold || request) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg border"><p className="text-[10px] text-gray-500">금형코드</p><p className="text-xs font-medium">{selectedMold?.mold_code || request?.mold_code || '-'}</p></div>
                  <div className="p-2 bg-gray-50 rounded-lg border"><p className="text-[10px] text-gray-500">품명</p><p className="text-xs font-medium">{selectedMold?.part_name || request?.part_name || '-'}</p></div>
                  <div className="p-2 bg-gray-50 rounded-lg border"><p className="text-[10px] text-gray-500">차종</p><p className="text-xs font-medium">{selectedMold?.car_model || request?.car_model || '-'}</p></div>
                  <div className="p-2 bg-red-50 rounded-lg border border-red-200"><p className="text-[10px] text-gray-500">누적 타수</p><p className="text-xs font-bold text-red-600">{(selectedMold?.current_shots || request?.current_shots || 0).toLocaleString()}</p></div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">폐기 사유 *</label>
                <select value={formData.reason} onChange={(e) => handleChange('reason', e.target.value)} disabled={!canEditRequest} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">사유 선택</option>
                  <option value="수명종료">수명 종료</option><option value="수리불가">수리 불가</option><option value="모델단종">모델 단종</option>
                  <option value="품질불량">품질 불량</option><option value="경제성부족">경제성 부족</option><option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">상세 사유</label>
                <textarea value={formData.reason_detail} onChange={(e) => handleChange('reason_detail', e.target.value)} disabled={!canEditRequest} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="상세 사유" />
              </div>
              {request?.repair_summary && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><Wrench size={12} />수리 이력</h4>
                  <div className="text-xs text-gray-600">총 {request.repair_summary.total_repairs || 0}회 / {(request.repair_summary.total_cost || 0).toLocaleString()}원</div>
                </div>
              )}
              {canEditRequest && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('요청')} disabled={stepSaving === '요청'} className="flex-1 py-2.5 border border-red-300 text-red-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Save size={14} />임시저장</button>
                  <button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Send size={14} />{saving ? '제출중...' : '폐기 요청'}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2. 상태 평가 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('assessment')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-teal-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-100 rounded-lg"><Search className="text-cyan-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">2. 상태 평가</h3><p className="text-[10px] text-gray-500">외관·기능·치수 점검</p></div>
            </div>
            <div className="flex items-center gap-1">
              {['assessed','reviewed','first_approved','approved','scrapped','closed'].includes(request?.status) && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">완료</span>}
              {expandedSections.assessment ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.assessment && (
            <div className="p-4 space-y-3">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3"><p className="text-xs text-cyan-800"><AlertCircle className="inline mr-1" size={12} />외관, 기능, 치수 3항목 평가</p></div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">외관 상태 *</label>
                <select value={formData.appearance_condition} onChange={(e) => handleChange('appearance_condition', e.target.value)} disabled={status !== 'requested'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">선택</option><option value="양호">양호</option><option value="경미손상">경미 손상</option><option value="중대손상">중대 손상</option><option value="파손">파손</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">기능 상태 *</label>
                <select value={formData.functional_condition} onChange={(e) => handleChange('functional_condition', e.target.value)} disabled={status !== 'requested'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">선택</option><option value="정상">정상</option><option value="부분불량">부분 불량</option><option value="기능저하">기능 저하</option><option value="작동불가">작동 불가</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">치수 상태</label>
                <select value={formData.dimensional_condition} onChange={(e) => handleChange('dimensional_condition', e.target.value)} disabled={status !== 'requested'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">선택</option><option value="규격내">규격 내</option><option value="경미이탈">경미 이탈</option><option value="규격초과">규격 초과</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">평가 소견</label>
                <textarea value={formData.assessment_notes} onChange={(e) => handleChange('assessment_notes', e.target.value)} disabled={status !== 'requested'} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="평가 소견" />
              </div>
              {status === 'requested' && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('상태평가')} disabled={stepSaving === '상태평가'} className="flex-1 py-2.5 border border-cyan-300 text-cyan-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Save size={14} />임시저장</button>
                  <button type="button" onClick={handleAssessmentComplete} disabled={saving} className="flex-1 py-2.5 bg-cyan-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><CheckCircle size={14} />평가 완료</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. 경제성 검토 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('review')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg"><Calculator className="text-purple-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">3. 경제성 검토</h3><p className="text-[10px] text-gray-500">수리비 vs 잔존가치 vs 신규</p></div>
            </div>
            <div className="flex items-center gap-1">
              {['reviewed','first_approved','approved','scrapped','closed'].includes(request?.status) && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">완료</span>}
              {expandedSections.review ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.review && (
            <div className="p-4 space-y-3">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3"><p className="text-xs text-purple-800"><AlertCircle className="inline mr-1" size={12} />경제성 비교 분석</p></div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">예상 수리비 (원)</label>
                <input type="number" value={formData.repair_cost_estimate} onChange={(e) => handleChange('repair_cost_estimate', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">신규 제작비 (원)</label>
                  <input type="number" value={formData.new_mold_cost} onChange={(e) => handleChange('new_mold_cost', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">잔존가치 (원)</label>
                  <input type="number" value={formData.remaining_value || formData.estimated_scrap_value} onChange={(e) => handleChange('remaining_value', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">검토 결과 *</label>
                <select value={formData.review_result} onChange={(e) => handleChange('review_result', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">결과 선택</option>
                  <option value="폐기타당">폐기 타당</option><option value="폐기권고">폐기 권고</option>
                  <option value="수리검토">수리 검토 필요</option><option value="폐기보류">폐기 보류</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">검토 의견</label>
                <input type="text" value={formData.review_notes} onChange={(e) => handleChange('review_notes', e.target.value)} disabled={status !== 'assessed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="검토 의견" />
              </div>
              {status === 'assessed' && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('경제성검토')} disabled={stepSaving === '경제성검토'} className="flex-1 py-2.5 border border-purple-300 text-purple-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Save size={14} />임시저장</button>
                  <button type="button" onClick={handleReviewComplete} disabled={saving} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><CheckCircle size={14} />검토 완료</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. 1차 승인 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('firstApproval')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg"><Shield className="text-blue-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">4. 1차 승인</h3><p className="text-[10px] text-gray-500">금형개발 담당</p></div>
            </div>
            <div className="flex items-center gap-1">
              {request?.first_approved_at && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">완료</span>}
              {expandedSections.firstApproval ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.firstApproval && (
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800"><AlertCircle className="inline mr-1" size={12} />평가/검토 결과 확인 후 1차 승인</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] text-gray-600 mb-0.5">승인자</label><input type="text" value={request?.first_approved_by_name || user?.name || '-'} readOnly className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50" /></div>
                  <div><label className="block text-[10px] text-gray-600 mb-0.5">상태</label><span className={`inline-block px-2 py-1.5 rounded-lg text-xs ${request?.first_approved_at ? 'bg-green-100 text-green-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{request?.first_approved_at ? '승인완료' : status === 'rejected' ? '반려' : '대기'}</span></div>
                </div>
                {request?.first_approved_at && <div className="mt-1 text-[10px] text-gray-500">승인: {new Date(request.first_approved_at).toLocaleString('ko-KR')}</div>}
                {status === 'reviewed' && (<div className="mt-2"><label className="block text-[10px] text-gray-600 mb-0.5">의견 / 반려 사유</label><input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="의견..." /></div>)}
              </div>
              {status === 'reviewed' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleReject('first')} disabled={saving} className="flex-1 py-2.5 border border-red-300 text-red-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><XCircle size={14} />반려</button>
                  <button type="button" onClick={handleFirstApprove} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><CheckCircle size={14} />1차 승인</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 5. 2차 승인 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('secondApproval')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg"><Shield className="text-green-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">5. 2차 승인 (최종)</h3><p className="text-[10px] text-gray-500">시스템 관리자</p></div>
            </div>
            <div className="flex items-center gap-1">
              {request?.second_approved_at && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">완료</span>}
              {expandedSections.secondApproval ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.secondApproval && (
            <div className="p-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800"><AlertCircle className="inline mr-1" size={12} />최종 폐기 승인</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] text-gray-600 mb-0.5">승인자</label><input type="text" value={request?.second_approved_by_name || user?.name || '-'} readOnly className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50" /></div>
                  <div><label className="block text-[10px] text-gray-600 mb-0.5">상태</label><span className={`inline-block px-2 py-1.5 rounded-lg text-xs ${request?.second_approved_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{request?.second_approved_at ? '승인완료' : '대기'}</span></div>
                </div>
                {request?.second_approved_at && <div className="mt-1 text-[10px] text-gray-500">승인: {new Date(request.second_approved_at).toLocaleString('ko-KR')}</div>}
                {status === 'first_approved' && (<div className="mt-2"><label className="block text-[10px] text-gray-600 mb-0.5">의견 / 반려 사유</label><input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" placeholder="의견..." /></div>)}
              </div>
              {status === 'first_approved' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleReject('second')} disabled={saving} className="flex-1 py-2.5 border border-red-300 text-red-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><XCircle size={14} />반려</button>
                  <button type="button" onClick={handleSecondApprove} disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><CheckCircle size={14} />2차 승인</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 6. 폐기 처리 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('disposal')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg"><Trash2 className="text-orange-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">6. 폐기 처리</h3><p className="text-[10px] text-gray-500">방법, 업체, 비용</p></div>
            </div>
            <div className="flex items-center gap-1">
              {request?.scrapped_at && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">완료</span>}
              {expandedSections.disposal ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.disposal && (
            <div className="p-4 space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-xs text-orange-800"><AlertCircle className="inline mr-1" size={12} />최종 승인 후 폐기 처리</p></div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">처리 방법</label>
                <select value={formData.disposal_method} onChange={(e) => handleChange('disposal_method', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100">
                  <option value="">방법 선택</option><option value="전문업체 위탁">전문업체 위탁</option><option value="자체 처리">자체 처리</option><option value="재활용 매각">재활용 매각</option><option value="부품 분리 후 폐기">부품 분리 후 폐기</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">처리 업체</label><input type="text" value={formData.disposal_company} onChange={(e) => handleChange('disposal_company', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="처리 업체명" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">비용 (원)</label><input type="number" value={formData.disposal_cost} onChange={(e) => handleChange('disposal_cost', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="0" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">인증서 번호</label><input type="text" value={formData.disposal_certificate} onChange={(e) => handleChange('disposal_certificate', e.target.value)} disabled={status !== 'approved'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="인증서" /></div>
              </div>
              {status === 'approved' && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button type="button" onClick={() => handleStepSave('폐기처리')} disabled={stepSaving === '폐기처리'} className="flex-1 py-2.5 border border-orange-300 text-orange-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Save size={14} />임시저장</button>
                  <button type="button" onClick={handleComplete} disabled={saving} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Trash2 size={14} />{saving ? '처리중...' : '폐기 완료'}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 7. 사후 관리 ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('postcare')} className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg"><Archive className="text-indigo-600" size={16} /></div>
              <div className="text-left"><h3 className="font-semibold text-gray-800 text-sm">7. 사후 관리</h3><p className="text-[10px] text-gray-500">자산처리, 문서보관</p></div>
            </div>
            <div className="flex items-center gap-1">
              {status === 'closed' && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">종결</span>}
              {expandedSections.postcare ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {expandedSections.postcare && (
            <div className="p-4 space-y-3">
              {(status === 'scrapped' || status === 'closed') ? (
                <>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3"><p className="text-xs text-indigo-800"><AlertCircle className="inline mr-1" size={12} />사후 관리 항목 확인</p></div>
                  <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <input type="checkbox" checked={formData.asset_disposal_completed} onChange={(e) => handleChange('asset_disposal_completed', e.target.checked)} disabled={status === 'closed'} className="w-4 h-4 text-indigo-600 rounded" />
                    <div><p className="text-xs font-medium text-gray-700">자산 처리 완료</p><p className="text-[10px] text-gray-500">고정자산 대장 제거</p></div>
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <input type="checkbox" checked={formData.documentation_archived} onChange={(e) => handleChange('documentation_archived', e.target.checked)} disabled={status === 'closed'} className="w-4 h-4 text-indigo-600 rounded" />
                    <div><p className="text-xs font-medium text-gray-700">문서 보관 완료</p><p className="text-[10px] text-gray-500">폐기 관련 문서 보관</p></div>
                  </label>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">대체 금형 계획</label>
                    <textarea value={formData.replacement_plan} onChange={(e) => handleChange('replacement_plan', e.target.value)} disabled={status === 'closed'} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" placeholder="대체 계획" />
                  </div>
                  {status === 'scrapped' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button type="button" onClick={() => handleStepSave('사후관리')} disabled={stepSaving === '사후관리'} className="flex-1 py-2.5 border border-indigo-300 text-indigo-700 rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Save size={14} />임시저장</button>
                      <button type="button" onClick={handlePostcareComplete} disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-1 text-sm disabled:opacity-50"><Archive size={14} />{saving ? '처리중...' : '절차 종결'}</button>
                    </div>
                  )}
                  {status === 'closed' && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                      <Archive className="mx-auto mb-2 text-indigo-400" size={36} />
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">폐기 절차 종결</h4>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {request?.scrapped_at && <p>폐기일시: {new Date(request.scrapped_at).toLocaleString('ko-KR')}</p>}
                        {request?.scrapped_by_name && <p>처리자: {request.scrapped_by_name}</p>}
                        {request?.disposal_method && <p>처리방법: {request.disposal_method}</p>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <Clock className="mx-auto mb-2 text-gray-300" size={36} />
                  <p className="text-xs text-gray-500">폐기 처리 완료 후 사후관리를 진행합니다.</p>
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
export default function MobileScrappingPage() {
  const { id } = useParams();
  const location = window.location.pathname;
  
  if (location.includes('/new')) {
    return <ScrappingDetail />;
  }
  
  if (id) {
    return <ScrappingDetail />;
  }
  
  return <ScrappingList />;
}
