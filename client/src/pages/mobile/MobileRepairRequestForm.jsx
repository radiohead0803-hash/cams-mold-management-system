import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Send, Camera, Upload, X, AlertCircle, CheckCircle, Clock, Calendar, FileText, Package, Wrench, Building, ClipboardList, Scale, Link2 } from 'lucide-react';
import { repairRequestAPI, moldSpecificationAPI, inspectionAPI, injectionConditionAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function MobileRepairRequestForm() {
  const { id, moldId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id);
  const [activeSection, setActiveSection] = useState('request');
  const [images, setImages] = useState([]);
  const [inspectionInfo, setInspectionInfo] = useState({ lastDailyCheck: null, lastPeriodicCheck: null, loading: false });
  const [injectionCondition, setInjectionCondition] = useState(null);
  const [moldSpec, setMoldSpec] = useState(null);
  const moldInfo = location.state?.moldInfo || { id: moldId };
  
  const [formData, setFormData] = useState({
    problem: '', cause_and_reason: '', priority: '보통', occurred_date: new Date().toISOString().split('T')[0],
    problem_type: '', occurrence_type: '신규', repair_category: '', requester_name: user?.name || '', contact: '',
    car_model: '', part_number: '', part_name: '', maker: '', production_site: '', production_shot: '',
    repair_shop_type: '', repair_company: '', repair_shop_selected_by: '', repair_shop_selected_date: '',
    repair_shop_approval_status: '대기', repair_shop_approved_by: '', repair_shop_approved_date: '', repair_shop_rejection_reason: '',
    liability_type: '', liability_ratio_maker: '', liability_ratio_plant: '', liability_reason: '', liability_decided_by: '', liability_decided_date: '',
    status: '요청접수', manager_name: '', temporary_action: '', root_cause_action: '', repair_cost: '', repair_duration: '',
    completion_date: '', mold_arrival_date: '', repair_start_date: '', repair_end_date: '',
    operation_type: '양산', management_type: '', sign_off_status: '제출되지 않음', order_company: '',
    representative_part_number: '', stock_schedule_date: '', stock_quantity: '', stock_unit: 'EA'
  });

  useEffect(() => { if (id) loadRepairRequest(); else if (moldInfo?.id || moldId) loadMoldInfo(moldInfo?.id || moldId); }, [id, moldInfo?.id, moldId]);
  useEffect(() => { if (moldId || moldInfo?.id) { loadInspectionInfo(moldId || moldInfo?.id); loadInjectionCondition(moldId || moldInfo?.id); } }, [moldId, moldInfo?.id]);

  const loadMoldInfo = async (specId) => {
    try {
      const res = await moldSpecificationAPI.getById(specId);
      if (res.data?.data) {
        const s = res.data.data;
        setMoldSpec(s);
        setFormData(p => ({ ...p, car_model: s.car_model || '', part_number: s.part_number || '', part_name: s.part_name || '', maker: s.makerCompany?.company_name || '', production_site: s.plantCompany?.company_name || '', production_shot: s.mold?.current_shots || '' }));
      }
    } catch (e) { console.error(e); }
  };

  const loadRepairRequest = async () => {
    try { setLoading(true); const res = await repairRequestAPI.getById(id); if (res.data?.data) setFormData(p => ({ ...p, ...res.data.data })); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadInspectionInfo = async (specId) => {
    try {
      setInspectionInfo(p => ({ ...p, loading: true }));
      const daily = await inspectionAPI.getAll({ mold_spec_id: specId, inspection_type: 'daily', limit: 1, sort: 'created_at:desc' }).catch(() => null);
      const periodic = await inspectionAPI.getAll({ mold_spec_id: specId, inspection_type: 'periodic', limit: 1, sort: 'created_at:desc' }).catch(() => null);
      setInspectionInfo({ lastDailyCheck: daily?.data?.data?.[0] || null, lastPeriodicCheck: periodic?.data?.data?.[0] || null, loading: false });
    } catch (e) { setInspectionInfo(p => ({ ...p, loading: false })); }
  };

  const loadInjectionCondition = async (specId) => {
    try {
      const res = await injectionConditionAPI.get({ mold_spec_id: specId });
      if (res.data?.data) setInjectionCondition(res.data.data);
    } catch (e) { console.error(e); }
  };

  const navigateToInspection = (insp) => {
    if (!insp) return;
    const specId = moldId || moldInfo?.id;
    navigate(insp.inspection_type === 'daily' ? `/mobile/daily-check/${specId}?id=${insp.id}` : `/mobile/periodic-check/${specId}?id=${insp.id}`);
  };

  const handleChange = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  const handleImageUpload = (e) => { Array.from(e.target.files).forEach(f => { if (f.type.startsWith('image/')) { const r = new FileReader(); r.onload = (ev) => setImages(p => [...p, { id: Date.now() + Math.random(), file: f, preview: ev.target.result, name: f.name }]); r.readAsDataURL(f); } }); e.target.value = ''; };
  const handleImageRemove = (imgId) => setImages(p => p.filter(i => i.id !== imgId));

  const handleSave = async (type = 'draft') => {
    if (!formData.problem) { alert('문제 내용을 입력해주세요.'); return; }
    if (!formData.repair_category) { alert('수리 카테고리를 선택해주세요.'); return; }
    try {
      setSaving(true);
      const data = { ...formData, mold_spec_id: moldInfo?.id || moldId, submit_type: type };
      if (id) { await repairRequestAPI.update(id, data); alert('수정되었습니다.'); } else { await repairRequestAPI.create(data); alert('등록되었습니다.'); }
      navigate(-1);
    } catch (e) { alert('저장 실패'); } finally { setSaving(false); }
  };

  const sections = [{ id: 'request', name: '요청', icon: FileText }, { id: 'product', name: '금형', icon: Package }, { id: 'repairShop', name: '수리처', icon: Building }, { id: 'liability', name: '귀책', icon: Scale }, { id: 'repair', name: '수리', icon: Wrench }, { id: 'complete', name: '관리', icon: ClipboardList }];
  const priorityOptions = ['높음', '보통', '낮음'];
  const statusOptions = ['요청접수', '수리처선정', '수리처승인대기', '귀책협의', '수리진행', '수리완료', '검수중', '완료'];
  const occurrenceOptions = ['신규', '재발'];
  const operationOptions = ['양산', '개발', '시작'];
  const problemTypeOptions = ['내구성', '외관', '치수', '기능', '기타'];
  const repairCategoryOptions = ['EO', '현실화', '돌발'];
  const repairShopTypeOptions = ['자체', '외주'];
  const liabilityTypeOptions = ['제작처', '생산처', '공동', '기타'];
  const managementTypeOptions = ['전산공유(L1)', '일반', '긴급'];
  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type);
  const isRepairShopApproved = formData.repair_shop_approval_status === '승인';

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div></div>;

  const renderSection = () => {
    switch (activeSection) {
      case 'request': return (<div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-2">수리 카테고리 <span className="text-red-500">*</span></label><div className="grid grid-cols-3 gap-2">{repairCategoryOptions.map(o => (<button key={o} onClick={() => isEditing && handleChange('repair_category', o)} className={`py-3 px-2 rounded-lg text-sm font-medium border-2 ${formData.repair_category === o ? o === 'EO' ? 'bg-blue-500 text-white border-blue-500' : o === '현실화' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}><div>{o}</div><div className="text-xs mt-0.5 opacity-80">{o === 'EO' ? '설계변경' : o === '현실화' ? '양산준비' : '긴급수리'}</div></button>))}</div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">문제 내용 <span className="text-red-500">*</span></label><textarea value={formData.problem} onChange={(e) => handleChange('problem', e.target.value)} disabled={!isEditing} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="문제 내용" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">원인 및 발생사유</label><textarea value={formData.cause_and_reason} onChange={(e) => handleChange('cause_and_reason', e.target.value)} disabled={!isEditing} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="- 원인:&#10;- 발생사유:" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2"><Camera size={14} className="inline mr-1" />사진 추가</label><input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />{images.length > 0 && <div className="grid grid-cols-3 gap-2 mb-3">{images.map(i => (<div key={i.id} className="relative"><img src={i.preview} className="w-full h-20 object-cover rounded-lg border" />{isEditing && <button onClick={() => handleImageRemove(i.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>}</div>))}</div>}{isEditing && <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 border-2 border-dashed"><Upload size={16} />이미지 선택</button>}</div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label><select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">{priorityOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">발생일</label><input type="date" value={formData.occurred_date} onChange={(e) => handleChange('occurred_date', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">문제유형</label><select value={formData.problem_type} onChange={(e) => handleChange('problem_type', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"><option value="">선택</option>{problemTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">발생유형</label><div className="flex gap-2">{occurrenceOptions.map(o => (<button key={o} onClick={() => isEditing && handleChange('occurrence_type', o)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${formData.occurrence_type === o ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}>{o}</button>))}</div></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">요청자</label><input type="text" value={formData.requester_name} onChange={(e) => handleChange('requester_name', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="요청자명" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">연락처</label><input type="tel" value={formData.contact} onChange={(e) => handleChange('contact', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="010-0000-0000" /></div></div>
      </div>);
      
      case 'product': return (<div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700"><span className="font-medium">📋 금형정보 자동연동</span></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">차종</label><input value={formData.car_model} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">품번</label><input value={formData.part_number} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">품명</label><input value={formData.part_name} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">제작처</label><input value={formData.maker} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">생산처</label><input value={formData.production_site} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">현재 타수</label><input value={formData.production_shot} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div>
        
        {/* 사출조건 관리 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><span className="text-red-500">🔥</span>사출조건 관리</h4>
            <button onClick={() => navigate(`/mobile/injection-condition/${moldId || moldInfo?.id}`)} className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">상세보기</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-red-50 rounded-lg border border-red-100"><p className="text-xs text-gray-500">사출온도</p><p className="text-base font-bold text-red-600">{injectionCondition?.barrel_temp_1 || '-'}°C</p></div>
            <div className="p-2 bg-orange-50 rounded-lg border border-orange-100"><p className="text-xs text-gray-500">사출압력</p><p className="text-base font-bold text-orange-600">{injectionCondition?.pressure_1 || '-'} MPa</p></div>
            <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-100"><p className="text-xs text-gray-500">사출속도</p><p className="text-base font-bold text-yellow-600">{injectionCondition?.speed_1 || '-'} mm/s</p></div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><p className="text-xs text-gray-500">사이클타임</p><p className="text-base font-bold text-gray-600">{injectionCondition?.cycle_time || '-'} sec</p></div>
          </div>
        </div>

        {/* 금형사양 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><span className="text-green-500">💎</span>금형사양</h4>
            <button onClick={() => navigate(`/mobile/mold-detail/${moldId || moldInfo?.id}`)} className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">상세보기</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><p className="text-xs text-gray-500">재질</p><p className="text-base font-bold text-gray-700">{moldSpec?.material || 'NAK80'}</p></div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><p className="text-xs text-gray-500">중량</p><p className="text-base font-bold text-gray-700">{moldSpec?.mold?.weight || '-'}kg</p></div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><p className="text-xs text-gray-500">치수</p><p className="text-base font-bold text-gray-700">{moldSpec?.mold?.dimensions || '-'}mm</p></div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><p className="text-xs text-gray-500">캐비티</p><p className="text-base font-bold text-gray-700">{moldSpec?.cavity_count || '-'}개</p></div>
          </div>
        </div>

        {/* 점검 관리 현황 */}
        <div className="mt-4 pt-4 border-t border-gray-200"><h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><ClipboardList size={14} className="text-blue-600" />점검 관리 현황</h4><div className="space-y-3">
          <div onClick={() => navigateToInspection(inspectionInfo.lastDailyCheck)} className={`p-3 rounded-lg border-2 ${inspectionInfo.lastDailyCheck ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-gray-700">일상점검</span>{inspectionInfo.loading ? <span className="text-xs text-gray-400">로딩중...</span> : inspectionInfo.lastDailyCheck ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} />기록있음</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">기록없음</span>}</div>{inspectionInfo.lastDailyCheck ? <div><p className="text-xs text-gray-600"><Calendar size={10} className="inline mr-1" />최근: {new Date(inspectionInfo.lastDailyCheck.created_at).toLocaleDateString('ko-KR')}</p><p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><Link2 size={10} />클릭하여 점검시트 보기</p></div> : <p className="text-xs text-gray-400">일상점검 기록이 없습니다.</p>}</div>
          <div onClick={() => navigateToInspection(inspectionInfo.lastPeriodicCheck)} className={`p-3 rounded-lg border-2 ${inspectionInfo.lastPeriodicCheck ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-gray-700">정기점검</span>{inspectionInfo.loading ? <span className="text-xs text-gray-400">로딩중...</span> : inspectionInfo.lastPeriodicCheck ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} />기록있음</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">기록없음</span>}</div>{inspectionInfo.lastPeriodicCheck ? <div><p className="text-xs text-gray-600"><Calendar size={10} className="inline mr-1" />최근: {new Date(inspectionInfo.lastPeriodicCheck.created_at).toLocaleDateString('ko-KR')}</p><p className="text-xs text-purple-600 mt-1 flex items-center gap-1"><Link2 size={10} />클릭하여 점검시트 보기</p></div> : <p className="text-xs text-gray-400">정기점검 기록이 없습니다.</p>}</div>
        </div></div>
      </div>);
      
      case 'repairShop': return (<div className="space-y-4">
        <div className={`p-3 rounded-lg flex items-center gap-2 ${formData.repair_shop_approval_status === '승인' ? 'bg-green-50 border border-green-200' : formData.repair_shop_approval_status === '반려' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>{formData.repair_shop_approval_status === '승인' ? <CheckCircle size={16} className="text-green-600" /> : formData.repair_shop_approval_status === '반려' ? <AlertCircle size={16} className="text-red-600" /> : <Clock size={16} className="text-yellow-600" />}<span className="text-sm font-medium">{formData.repair_shop_approval_status === '승인' ? '수리처 승인됨' : formData.repair_shop_approval_status === '반려' ? '수리처 반려됨' : '승인 대기 중'}</span></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">수리처 유형</label><div className="grid grid-cols-2 gap-2">{repairShopTypeOptions.map(o => (<button key={o} onClick={() => isEditing && handleChange('repair_shop_type', o)} className={`py-3 px-4 rounded-lg text-sm font-medium border-2 ${formData.repair_shop_type === o ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600 border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}><div>{o}</div><div className="text-xs mt-0.5 opacity-80">{o === '자체' ? '사내 수리' : '외부 업체'}</div></button>))}</div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">수리업체</label><input value={formData.repair_company} onChange={(e) => handleChange('repair_company', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="수리업체명" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">선정자</label><input value={formData.repair_shop_selected_by || user?.name || ''} onChange={(e) => handleChange('repair_shop_selected_by', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">선정일</label><input type="date" value={formData.repair_shop_selected_date} onChange={(e) => handleChange('repair_shop_selected_date', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
        {isDeveloper && formData.repair_shop_approval_status !== '승인' && <div className="p-4 bg-gray-50 rounded-lg space-y-3"><label className="text-sm font-medium text-gray-700">개발담당자 승인</label><div className="flex gap-2"><button onClick={() => { handleChange('repair_shop_approval_status', '승인'); handleChange('repair_shop_approved_by', user?.name || ''); handleChange('repair_shop_approved_date', new Date().toISOString().split('T')[0]); }} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">승인</button><button onClick={() => { const r = prompt('반려 사유:'); if (r) { handleChange('repair_shop_approval_status', '반려'); handleChange('repair_shop_rejection_reason', r); handleChange('repair_shop_approved_by', user?.name || ''); handleChange('repair_shop_approved_date', new Date().toISOString().split('T')[0]); }}} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">반려</button></div></div>}
        {formData.repair_shop_approved_by && <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg"><p>승인자: {formData.repair_shop_approved_by}</p><p>승인일: {formData.repair_shop_approved_date}</p>{formData.repair_shop_rejection_reason && <p className="text-red-600">반려사유: {formData.repair_shop_rejection_reason}</p>}</div>}
      </div>);
      
      case 'liability': return (<div className={`space-y-4 ${!isRepairShopApproved ? 'opacity-50' : ''}`}>
        {!isRepairShopApproved && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700"><AlertCircle size={14} className="inline mr-1" />수리처 승인 후 진행 가능합니다.</div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-2">귀책 유형</label><div className="grid grid-cols-2 gap-2">{liabilityTypeOptions.map(o => (<button key={o} onClick={() => isRepairShopApproved && isEditing && handleChange('liability_type', o)} disabled={!isRepairShopApproved} className={`py-2 px-3 rounded-lg text-sm font-medium border-2 ${formData.liability_type === o ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-600 border-gray-300'}`}>{o}</button>))}</div></div>
        {formData.liability_type === '공동' && <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">제작처 (%)</label><input type="number" min="0" max="100" value={formData.liability_ratio_maker} onChange={(e) => { handleChange('liability_ratio_maker', e.target.value); handleChange('liability_ratio_plant', String(100 - Number(e.target.value))); }} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">생산처 (%)</label><input type="number" min="0" max="100" value={formData.liability_ratio_plant} onChange={(e) => { handleChange('liability_ratio_plant', e.target.value); handleChange('liability_ratio_maker', String(100 - Number(e.target.value))); }} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">귀책 판정 사유</label><textarea value={formData.liability_reason} onChange={(e) => handleChange('liability_reason', e.target.value)} disabled={!isRepairShopApproved || !isEditing} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="귀책 판정 사유" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">판정자</label><input value={formData.liability_decided_by || (isDeveloper ? user?.name : '')} onChange={(e) => handleChange('liability_decided_by', e.target.value)} disabled={!isRepairShopApproved || !isDeveloper} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">판정일</label><input type="date" value={formData.liability_decided_date} onChange={(e) => handleChange('liability_decided_date', e.target.value)} disabled={!isRepairShopApproved || !isDeveloper} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
      </div>);
      
      case 'repair': return (<div className={`space-y-4 ${!isRepairShopApproved ? 'opacity-50' : ''}`}>
        {!isRepairShopApproved && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700"><AlertCircle size={14} className="inline mr-1" />수리처 승인 후 진행 가능합니다.</div>}
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">진행상태</label><select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">{statusOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">담당자</label><input value={formData.manager_name} onChange={(e) => handleChange('manager_name', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="담당자명" /></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">금형 입고일</label><input type="date" value={formData.mold_arrival_date} onChange={(e) => handleChange('mold_arrival_date', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">임시 조치 내용</label><textarea value={formData.temporary_action} onChange={(e) => handleChange('temporary_action', e.target.value)} disabled={!isRepairShopApproved || !isEditing} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="임시 조치 내용" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">근본 원인 조치</label><textarea value={formData.root_cause_action} onChange={(e) => handleChange('root_cause_action', e.target.value)} disabled={!isRepairShopApproved || !isEditing} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="근본 원인 조치" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">수리 시작일</label><input type="date" value={formData.repair_start_date} onChange={(e) => handleChange('repair_start_date', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">수리 완료일</label><input type="date" value={formData.repair_end_date} onChange={(e) => handleChange('repair_end_date', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">수리기간</label><input value={formData.repair_duration} onChange={(e) => handleChange('repair_duration', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="예: 3일" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">완료예정일</label><input type="date" value={formData.completion_date} onChange={(e) => handleChange('completion_date', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">수리비용</label><input value={formData.repair_cost} onChange={(e) => handleChange('repair_cost', e.target.value)} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="₩" /></div>
      </div>);
      
      case 'complete': return (<div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">운영유형</label><select value={formData.operation_type} onChange={(e) => handleChange('operation_type', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">{operationOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">관리유형</label><select value={formData.management_type} onChange={(e) => handleChange('management_type', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"><option value="">선택</option>{managementTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">결재상태</label><input value={formData.sign_off_status} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" readOnly /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">발주업체</label><input value={formData.order_company} onChange={(e) => handleChange('order_company', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="발주업체명" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">대표품번</label><input value={formData.representative_part_number} onChange={(e) => handleChange('representative_part_number', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="대표품번" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">재고예정일</label><input type="date" value={formData.stock_schedule_date} onChange={(e) => handleChange('stock_schedule_date', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">재고수량</label><input type="number" value={formData.stock_quantity} onChange={(e) => handleChange('stock_quantity', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="수량" /></div></div>
      </div>);
      
      default: return null;
    }
  };

  return (<div className="min-h-screen bg-gray-50 pb-24">
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="px-4 py-3"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={24} className="text-gray-600" /></button><div><h1 className="text-lg font-bold text-gray-800">{id ? '수리요청 수정' : '수리요청 등록'}</h1><p className="text-xs text-gray-500">{formData.part_number || '새 요청'}</p></div></div><div className="flex items-center gap-2">{id && !isEditing ? <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium">수정</button> : id && isEditing ? <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">취소</button> : null}</div></div></div>
      <div className="flex border-t overflow-x-auto">{sections.map(s => (<button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex-shrink-0 px-3 py-2.5 text-center text-xs font-medium ${activeSection === s.id ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' : 'text-gray-500'}`}><s.icon size={14} className="inline mr-1" />{s.name}</button>))}</div>
    </div>
    <div className="p-4"><div className="bg-white rounded-xl p-4 shadow-sm">{renderSection()}</div></div>
    {isEditing && <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-2"><button onClick={() => handleSave('draft')} disabled={saving} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"><Save size={18} />임시저장</button><button onClick={() => handleSave('submit')} disabled={saving} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"><Send size={18} />{saving ? '저장 중...' : '제출'}</button></div>}
  </div>);
}
