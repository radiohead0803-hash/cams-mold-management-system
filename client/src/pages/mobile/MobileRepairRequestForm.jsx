import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Send, Camera, Upload, X, AlertCircle, CheckCircle, Clock, Calendar, FileText, Package, Wrench, Building, ClipboardList, Scale, Link2, User, WifiOff, Image } from 'lucide-react';
import api, { repairRequestAPI, moldSpecificationAPI, inspectionAPI, injectionConditionAPI, workflowAPI } from '../../lib/api';
import useGeoLocation from '../../hooks/useGeoLocation';
import { useAuthStore } from '../../stores/authStore';
import useOfflineSync, { SyncStatus } from '../../hooks/useOfflineSync.jsx';

export default function MobileRepairRequestForm() {
  const { id, moldId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const gps = useGeoLocation({ autoStart: true, highAccuracy: true });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!id);
  
  // 오프라인 동기화
  const { online, syncing, pendingCount, processQueue } = useOfflineSync();
  const [activeSection, setActiveSection] = useState('request');
  const [images, setImages] = useState([]);
  const [developerSearch, setDeveloperSearch] = useState('');
  const [developerList, setDeveloperList] = useState([]);
  const [showDevDropdown, setShowDevDropdown] = useState(false);
  const [searchingDev, setSearchingDev] = useState(false);
  const [inspectionInfo, setInspectionInfo] = useState({ lastDailyCheck: null, lastPeriodicCheck: null, loading: false });
  const [injectionCondition, setInjectionCondition] = useState(null);
  const [moldSpec, setMoldSpec] = useState(null);
  const [repairProgress, setRepairProgress] = useState(null);
  const moldInfo = location.state?.moldInfo || { id: moldId };
  
  const [formData, setFormData] = useState({
    // ===== 요청 단계 (Plant 작성) =====
    problem: '', cause_and_reason: '', priority: '보통', occurred_date: new Date().toISOString().split('T')[0],
    problem_type: '', occurrence_type: '신규', repair_category: '',
    plant_manager_name: user?.name || '', plant_manager_contact: '',
    cams_manager_id: '', cams_manager_name: '', cams_manager_contact: '',
    stock_quantity: '', shortage_expected_date: '', mold_arrival_request_datetime: '',
    // ===== 제품/금형 정보 (자동연동) =====
    car_model: '', part_number: '', part_name: '', maker: '', production_site: '', production_shot: '',
    // ===== 수리처 선정 =====
    repair_shop_type: '', repair_company: '', repair_shop_selected_by: '', repair_shop_selected_date: '',
    repair_shop_approval_status: '대기', repair_shop_approved_by: '', repair_shop_approved_date: '', repair_shop_rejection_reason: '',
    // ===== 생산처 검수 =====
    plant_inspection_status: '대기', plant_inspection_result: '', plant_inspection_comment: '',
    plant_inspection_by: '', plant_inspection_date: '', plant_inspection_rejection_reason: '',
    // ===== 체크리스트 점검 =====
    checklist_result: '', checklist_comment: '', checklist_inspector: '', checklist_date: '', checklist_status: '대기',
    // ===== 귀책처리 =====
    liability_type: '', liability_ratio_maker: '', liability_ratio_plant: '', liability_reason: '', liability_decided_by: '', liability_decided_date: '',
    // ===== 수리 단계 =====
    status: '요청접수', manager_name: '', temporary_action: '', root_cause_action: '', repair_cost: '', repair_duration: '',
    completion_date: '', mold_arrival_date: '', repair_start_date: '', repair_end_date: '',
    // ===== 완료/관리 단계 =====
    operation_type: '양산', management_type: '', sign_off_status: '제출되지 않음', order_company: ''
  });

  useEffect(() => { if (id) loadRepairRequest(); else if (moldInfo?.id || moldId) loadMoldInfo(moldInfo?.id || moldId); }, [id, moldInfo?.id, moldId]);
  useEffect(() => { if (moldId || moldInfo?.id) { loadInspectionInfo(moldId || moldInfo?.id); loadInjectionCondition(moldId || moldInfo?.id); loadRepairProgress(moldId || moldInfo?.id); } }, [moldId, moldInfo?.id]);

  // 금형개발 담당자 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (developerSearch.trim()) {
        searchDevelopers(developerSearch.trim());
        setShowDevDropdown(true);
      } else {
        loadAllDevelopers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [developerSearch]);

  const searchDevelopers = async (name) => {
    setSearchingDev(true);
    try {
      const res = await workflowAPI.searchDevelopers({ name, limit: 10 });
      if (res.data?.success) setDeveloperList(res.data.data || []);
    } catch (e) { console.error(e); setDeveloperList([]); }
    finally { setSearchingDev(false); }
  };

  const loadAllDevelopers = async () => {
    try {
      const res = await workflowAPI.searchDevelopers({ limit: 50 });
      if (res.data?.success) setDeveloperList(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadAllDevelopers(); }, []);

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

  const loadRepairProgress = async (specId) => {
    try {
      const res = await repairRequestAPI.getAll({ mold_spec_id: specId });
      if (res.data?.data) {
        const requests = res.data.data;
        setRepairProgress({
          total: requests.length,
          requested: requests.filter(r => r.status === '요청접수').length,
          assigned: requests.filter(r => ['수리처선정', '수리처승인대기', '귀책협의'].includes(r.status)).length,
          inProgress: requests.filter(r => r.status === '수리진행').length,
          inspection: requests.filter(r => r.status === '검수중').length,
          completed: requests.filter(r => r.status === '완료').length
        });
      }
    } catch (e) { console.error(e); }
  };

  const navigateToInspection = (insp) => {
    if (!insp) return;
    const specId = moldId || moldInfo?.id;
    navigate(insp.inspection_type === 'daily' ? `/mobile/daily-check/${specId}?id=${insp.id}` : `/mobile/periodic-check/${specId}?id=${insp.id}`);
  };

  const handleChange = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      try {
        const fd = new FormData();
        fd.append('photo', f);
        fd.append('mold_id', moldId || '');
        fd.append('inspection_type', 'repair');
        fd.append('source_page', 'MobileRepairRequestForm');
        fd.append('capture_method', e.target === cameraInputRef.current ? 'camera' : 'gallery');
        if (gps.latitude !== null) {
          fd.append('gps_latitude', String(gps.latitude));
          fd.append('gps_longitude', String(gps.longitude));
          if (gps.accuracy !== null) fd.append('gps_accuracy', String(gps.accuracy));
        }
        const res = await api.post('/inspection-photos/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.success) {
          setImages(p => [...p, { id: res.data.data.id, file_url: res.data.data.file_url, preview: res.data.data.file_url, name: f.name }]);
        }
      } catch (err) {
        console.error('사진 업로드 실패:', err);
      }
    }
    e.target.value = '';
  };
  const handleImageRemove = (imgId) => setImages(p => p.filter(i => i.id !== imgId));

  const handleSave = async (type = 'draft') => {
    if (!formData.problem) { alert('문제 내용을 입력해주세요.'); return; }
    if (!formData.repair_category) { alert('수리 카테고리를 선택해주세요.'); return; }
    try {
      setSaving(true);
      const data = { ...formData, mold_id: moldSpec?.mold_id || moldSpec?.mold?.id, mold_spec_id: moldInfo?.id || moldId, submit_type: type };
      if (id) { await repairRequestAPI.update(id, data); alert('수정되었습니다.'); } else { await repairRequestAPI.create(data); alert('등록되었습니다.'); }
      navigate(-1);
    } catch (e) { alert('저장 실패'); } finally { setSaving(false); }
  };

  const sections = [{ id: 'request', name: '1.요청', icon: FileText }, { id: 'repairShop', name: '2.수리처', icon: Building }, { id: 'repair', name: '3.수리', icon: Wrench }, { id: 'checklist', name: '4.점검', icon: ClipboardList }, { id: 'plantInspection', name: '5.검수', icon: CheckCircle }, { id: 'liability', name: '6.귀책', icon: Scale }, { id: 'complete', name: '7.관리', icon: Package }];
  const priorityOptions = ['높음', '보통', '낮음'];
  const statusOptions = ['요청접수', '수리처선정', '수리처승인대기', '수리진행', '체크리스트점검', '귀책처리', '수리완료', '검수중', '완료'];
  const occurrenceOptions = ['신규', '재발'];
  const operationOptions = ['양산', '개발', '시작'];
  const problemTypeOptions = ['내구성', '외관', '치수', '기능', '기타'];
  const repairCategoryOptions = ['EO', '현실화', '돌발'];
  const repairShopTypeOptions = ['자체', '외주'];
  const liabilityTypeOptions = ['제작처', '생산처', '공동', '기타'];
  const managementTypeOptions = ['전산공유(L1)', '일반', '긴급'];
  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type);
  const isRepairShopApproved = formData.repair_shop_approval_status === '승인';
  // 개발단계에서는 4번 체크리스트, 5번 생산처검수 항목 항상 활성화
  const isChecklistEnabled = true; // 개발단계: 항상 활성화

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div></div>;

  const renderSection = () => {
    switch (activeSection) {
      case 'request': return (<div className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-2">수리 카테고리 <span className="text-red-500">*</span></label><div className="grid grid-cols-3 gap-2">{repairCategoryOptions.map(o => (<button key={o} onClick={() => isEditing && handleChange('repair_category', o)} className={`py-3 px-2 rounded-lg text-sm font-medium border-2 ${formData.repair_category === o ? o === 'EO' ? 'bg-blue-500 text-white border-blue-500' : o === '현실화' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}><div>{o}</div><div className="text-xs mt-0.5 opacity-80">{o === 'EO' ? '설계변경' : o === '현실화' ? '양산준비' : '긴급수리'}</div></button>))}</div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">문제 내용 <span className="text-red-500">*</span></label><textarea value={formData.problem} onChange={(e) => handleChange('problem', e.target.value)} disabled={!isEditing} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="문제 내용" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">원인 및 발생사유</label><textarea value={formData.cause_and_reason} onChange={(e) => handleChange('cause_and_reason', e.target.value)} disabled={!isEditing} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="- 원인:&#10;- 발생사유:" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2"><Camera size={14} className="inline mr-1" />사진 추가</label><input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" /><input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />{images.length > 0 && <div className="grid grid-cols-3 gap-2 mb-3">{images.map(i => (<div key={i.id} className="relative"><img src={i.preview || i.file_url} className="w-full h-20 object-cover rounded-lg border" />{isEditing && <button onClick={() => handleImageRemove(i.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>}</div>))}</div>}{isEditing && <div className={isMobile ? 'flex gap-2' : ''}>{isMobile && <button onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 rounded-lg text-sm text-blue-600 border-2 border-dashed border-blue-300"><Camera size={16} />카메라 촬영</button>}<button onClick={() => fileInputRef.current?.click()} className={`${isMobile ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-600 border-2 border-dashed`}><Image size={16} />{isMobile ? '갤러리 선택' : '이미지 선택'}</button></div>}</div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label><select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">{priorityOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">발생일</label><input type="date" value={formData.occurred_date} onChange={(e) => handleChange('occurred_date', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">문제유형</label><select value={formData.problem_type} onChange={(e) => handleChange('problem_type', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"><option value="">선택</option>{problemTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">발생유형</label><div className="flex gap-2">{occurrenceOptions.map(o => (<button key={o} onClick={() => isEditing && handleChange('occurrence_type', o)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${formData.occurrence_type === o ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-300'} ${!isEditing ? 'opacity-60' : ''}`}>{o}</button>))}</div></div></div>
        {/* 생산처 담당자 */}
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">생산처 담당자</label><input type="text" value={formData.plant_manager_name} onChange={(e) => handleChange('plant_manager_name', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="담당자명" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">연락처</label><input type="tel" value={formData.plant_manager_contact} onChange={(e) => handleChange('plant_manager_contact', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="010-0000-0000" /></div></div>
        {/* 금형개발 담당자 검색 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금형개발 담당자 <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="text" value={developerSearch} onChange={(e) => { setDeveloperSearch(e.target.value); if (!e.target.value) { handleChange('cams_manager_id', ''); handleChange('cams_manager_name', ''); handleChange('cams_manager_contact', ''); } }} onFocus={() => setShowDevDropdown(true)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="담당자 이름 검색..." />
            {searchingDev && <div className="absolute right-3 top-2.5"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div></div>}
            {showDevDropdown && developerList.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {developerList.map(dev => (
                  <button key={dev.id} type="button" onClick={() => { handleChange('cams_manager_id', dev.id); handleChange('cams_manager_name', dev.name); handleChange('cams_manager_contact', dev.phone || dev.email || ''); setDeveloperSearch(dev.name); setShowDevDropdown(false); }} className="w-full text-left px-3 py-2 hover:bg-amber-50 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium">{dev.name}</span>
                    {dev.company_name && <span className="ml-1 text-xs text-gray-500">{dev.company_name}</span>}
                    <span className="float-right text-xs text-gray-400">{dev.phone || dev.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {formData.cams_manager_name && <div className="p-2 bg-blue-50 rounded-lg border border-blue-200"><p className="text-xs text-blue-700">선택된 담당자: {formData.cams_manager_name} {formData.cams_manager_contact && `(${formData.cams_manager_contact})`}</p><p className="text-xs text-blue-600 mt-0.5">수리요청 등록 시 해당 담당자에게 알림이 발송됩니다.</p></div>}
        {/* 재고 현황 */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">📦 재고 현황</label>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">재고 수량</label><input type="number" value={formData.stock_quantity} onChange={(e) => handleChange('stock_quantity', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="현재 재고" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">과부족 예상일</label><input type="date" value={formData.shortage_expected_date} onChange={(e) => handleChange('shortage_expected_date', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div>
          </div>
          {(formData.stock_quantity || formData.shortage_expected_date) && <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200"><p className="text-xs text-orange-700">재고: {formData.stock_quantity || 0}개 {formData.shortage_expected_date && `/ 과부족 예상일: ${formData.shortage_expected_date}`}</p></div>}
        </div>
        {/* 금형입고요청일시 */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">🚚 금형입고요청</label>
          <div><label className="block text-xs text-gray-500 mb-1">금형입고요청일시</label><input type="datetime-local" value={formData.mold_arrival_request_datetime} onChange={(e) => handleChange('mold_arrival_request_datetime', e.target.value)} disabled={!isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div>
          {formData.mold_arrival_request_datetime && <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200"><p className="text-xs text-blue-700">입고요청일시: {new Date(formData.mold_arrival_request_datetime).toLocaleString('ko-KR')}</p></div>}
        </div>
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

        {/* 금형수리 진행현황 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Wrench size={14} className="text-amber-500" />금형수리 진행현황</h4>
            <button onClick={() => navigate(`/mobile/repair-requests?moldId=${moldId || moldInfo?.id}`)} className="px-3 py-1 bg-amber-500 text-white text-xs rounded-full">상세보기</button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <div onClick={() => repairProgress?.requested > 0 && navigate(`/mobile/repair-requests?moldId=${moldId || moldInfo?.id}&status=요청접수`)} className={`p-2 rounded-lg border text-center ${repairProgress?.requested > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}><div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.requested > 0 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-white'}`}><FileText size={10} /></div><p className="text-xs text-gray-600">요청접수</p></div>
            <div onClick={() => repairProgress?.assigned > 0 && navigate(`/mobile/repair-requests?moldId=${moldId || moldInfo?.id}&status=작업배정`)} className={`p-2 rounded-lg border text-center ${repairProgress?.assigned > 0 ? 'bg-cyan-50 border-cyan-200' : 'bg-gray-50 border-gray-200'}`}><div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.assigned > 0 ? 'bg-cyan-500 text-white' : 'bg-gray-300 text-white'}`}><User size={10} /></div><p className="text-xs text-gray-600">작업배정</p></div>
            <div onClick={() => repairProgress?.inProgress > 0 && navigate(`/mobile/repair-requests?moldId=${moldId || moldInfo?.id}&status=수리진행`)} className={`p-2 rounded-lg border text-center ${repairProgress?.inProgress > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}><div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.inProgress > 0 ? 'bg-amber-500 text-white' : 'bg-gray-300 text-white'}`}><Wrench size={10} /></div><p className="text-xs text-gray-600">수리진행</p></div>
            <div onClick={() => repairProgress?.inspection > 0 && navigate(`/mobile/repair-requests?moldId=${moldId || moldInfo?.id}&status=검수중`)} className={`p-2 rounded-lg border text-center ${repairProgress?.inspection > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}><div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.inspection > 0 ? 'bg-purple-500 text-white' : 'bg-gray-300 text-white'}`}><CheckCircle size={10} /></div><p className="text-xs text-gray-600">검수완료</p></div>
            <div onClick={() => repairProgress?.completed > 0 && navigate(`/mobile/repair-requests?moldId=${moldId || moldInfo?.id}&status=완료`)} className={`p-2 rounded-lg border text-center ${repairProgress?.completed > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}><div className={`w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center ${repairProgress?.completed > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}><CheckCircle size={10} /></div><p className="text-xs text-gray-600">최종승인</p></div>
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
        <div><label className="block text-sm font-medium text-gray-700 mb-2">귀책 유형</label><div className="grid grid-cols-2 gap-2">{liabilityTypeOptions.map(o => (<button key={o} onClick={() => isRepairShopApproved && isEditing && handleChange('liability_type', o)} disabled={!isChecklistEnabled} className={`py-2 px-3 rounded-lg text-sm font-medium border-2 ${formData.liability_type === o ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-600 border-gray-300'}`}>{o}</button>))}</div></div>
        {formData.liability_type === '공동' && <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">제작처 (%)</label><input type="number" min="0" max="100" value={formData.liability_ratio_maker} onChange={(e) => { handleChange('liability_ratio_maker', e.target.value); handleChange('liability_ratio_plant', String(100 - Number(e.target.value))); }} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">생산처 (%)</label><input type="number" min="0" max="100" value={formData.liability_ratio_plant} onChange={(e) => { handleChange('liability_ratio_plant', e.target.value); handleChange('liability_ratio_maker', String(100 - Number(e.target.value))); }} disabled={!isRepairShopApproved || !isEditing} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">귀책 판정 사유</label><textarea value={formData.liability_reason} onChange={(e) => handleChange('liability_reason', e.target.value)} disabled={!isRepairShopApproved || !isEditing} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="귀책 판정 사유" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">판정자</label><input value={formData.liability_decided_by || (isDeveloper ? user?.name : '')} onChange={(e) => handleChange('liability_decided_by', e.target.value)} disabled={!isRepairShopApproved || !isDeveloper} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">판정일</label><input type="date" value={formData.liability_decided_date} onChange={(e) => handleChange('liability_decided_date', e.target.value)} disabled={!isRepairShopApproved || !isDeveloper} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" /></div></div>
      </div>);
      
            
      case 'checklist': return (<div className="space-y-4">
        {!isRepairShopApproved && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700"><AlertCircle size={14} className="inline mr-1" />수리처 승인 후 진행 가능합니다.</div>}
        
        {/* 전체 진행률 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-600">전체 진행률</span>
            <span className="text-sm font-bold text-cyan-600">0%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600" style={{ width: '0%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">0 / 32 항목 완료</p>
        </div>

        {/* 카테고리별 진행 현황 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">카테고리별 진행 현황</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { category: '수리이력', icon: '📋', count: 4 },
              { category: '성형면', icon: '🔍', count: 5 },
              { category: '기능부', icon: '⚙️', count: 5 },
              { category: '치수', icon: '📐', count: 4 },
              { category: '냉각', icon: '💧', count: 5 },
              { category: '시운전', icon: '🧪', count: 4 },
              { category: '출하', icon: '📦', count: 5 },
              { category: '승인', icon: '✅', count: 2 }
            ].map((cat, idx) => (
              <div key={idx} className="p-2 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-lg">{cat.icon}</span>
                <p className="text-[10px] text-slate-600 mt-1 truncate">{cat.category}</p>
                <p className="text-[10px] text-slate-400">0/{cat.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 점검 항목 미리보기 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">1. 수리 이력 및 범위 확인</h3>
          <div className="space-y-3">
            {['수리 요청 내역 일치 여부', '수리 범위 명확화', '추가 수리 발생 여부', '수리 전·후 비교 사진'].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span>🔍</span>
                  <span className="text-sm font-medium text-slate-800">{item}</span>
                  <span className="text-red-500">*</span>
                </div>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-1 text-xs opacity-50"><input type="radio" disabled className="w-3 h-3" />양호</label>
                  <label className="flex items-center gap-1 text-xs opacity-50"><input type="radio" disabled className="w-3 h-3" />주의</label>
                  <label className="flex items-center gap-1 text-xs opacity-50"><input type="radio" disabled className="w-3 h-3" />불량</label>
                </div>
                <button disabled className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-400">📷 사진 추가</button>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 bg-cyan-50 border border-cyan-200 rounded-lg ${!isRepairShopApproved ? 'opacity-50' : ''}`}>
          <p className="text-sm text-cyan-700 mb-3 font-medium">📋 수리 후 출하점검 체크리스트</p>
          <button onClick={() => navigate(`/mobile/repair-shipment-checklist?repairRequestId=${id || ''}&moldId=${moldId || moldInfo?.id || ''}`)} disabled={!isChecklistEnabled} className="w-full py-3 bg-cyan-500 text-white rounded-lg font-medium disabled:opacity-50">체크리스트 점검 시작</button>
        </div>

        {/* 점검 결과 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">점검 결과</label>
          <div className="grid grid-cols-2 gap-2">
            {['적합', '부적합'].map(opt => (
              <button key={opt} type="button" onClick={() => isRepairShopApproved && handleChange('checklist_result', opt)} disabled={!isChecklistEnabled} className={`py-2.5 rounded-lg text-sm font-medium border-2 ${formData.checklist_result === opt ? opt === '적합' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300'}`}>{opt}</button>
            ))}
          </div>
        </div>

        {/* 점검 의견 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">점검 의견</label>
          <textarea value={formData.checklist_comment || ''} onChange={(e) => handleChange('checklist_comment', e.target.value)} disabled={!isChecklistEnabled} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="점검 의견을 입력하세요" />
        </div>

        {/* 점검자, 점검일 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">점검자</label>
            <input type="text" value={formData.checklist_inspector || user?.name || ''} onChange={(e) => handleChange('checklist_inspector', e.target.value)} disabled={!isChecklistEnabled} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">점검일</label>
            <input type="date" value={formData.checklist_date || ''} onChange={(e) => handleChange('checklist_date', e.target.value)} disabled={!isChecklistEnabled} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* 승인요청 */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">체크리스트 점검 승인</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${formData.checklist_status === '승인' ? 'bg-green-100 text-green-700' : formData.checklist_status === '반려' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{formData.checklist_status || '대기'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleChange('checklist_status', '승인')} disabled={!isChecklistEnabled} className="py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">승인</button>
            <button type="button" onClick={() => handleChange('checklist_status', '반려')} disabled={!isChecklistEnabled} className="py-2.5 bg-white text-red-500 border-2 border-red-200 rounded-lg text-sm font-medium disabled:opacity-50">반려</button>
          </div>
        </div>
      </div>);
      
      case 'plantInspection': return (<div className="space-y-4">
        {!isRepairShopApproved && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700"><AlertCircle size={14} className="inline mr-1" />체크리스트 점검 완료 후 진행 가능합니다.</div>}
        
        {/* 전체 진행률 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-600">전체 진행률</span>
            <span className="text-sm font-bold text-indigo-600">0%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: '0%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">0 / 24 항목 완료</p>
        </div>

        {/* 카테고리별 진행 현황 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">카테고리별 진행 현황</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { category: '입고상태', icon: '📦', count: 4 },
              { category: '수리내역', icon: '📋', count: 4 },
              { category: '기능점검', icon: '⚙️', count: 4 },
              { category: '외관품질', icon: '🔍', count: 4 },
              { category: '시운전', icon: '🧪', count: 4 },
              { category: '최종승인', icon: '✅', count: 4 }
            ].map((cat, idx) => (
              <div key={idx} className="p-2 rounded-lg border border-slate-200 bg-white text-center">
                <span className="text-lg">{cat.icon}</span>
                <p className="text-[10px] text-slate-600 mt-1 truncate">{cat.category}</p>
                <p className="text-[10px] text-slate-400">0/{cat.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 점검 항목 미리보기 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">1. 입고 상태 확인</h3>
          <div className="space-y-3">
            {['포장 상태 확인', '운송 중 손상 여부', '금형 외관 상태', '부속품 확인'].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span>📦</span>
                  <span className="text-sm font-medium text-slate-800">{item}</span>
                  <span className="text-red-500">*</span>
                </div>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-1 text-xs opacity-50"><input type="radio" disabled className="w-3 h-3" />양호</label>
                  <label className="flex items-center gap-1 text-xs opacity-50"><input type="radio" disabled className="w-3 h-3" />주의</label>
                  <label className="flex items-center gap-1 text-xs opacity-50"><input type="radio" disabled className="w-3 h-3" />불량</label>
                </div>
                <button disabled className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-400">📷 사진 추가</button>
              </div>
            ))}
          </div>
        </div>

        {/* 검수 결과 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">검수 결과</label>
          <div className="grid grid-cols-2 gap-2">
            {['적합', '부적합'].map(opt => (
              <button key={opt} type="button" onClick={() => isRepairShopApproved && handleChange('plant_inspection_result', opt)} disabled={!isChecklistEnabled} className={`py-2.5 rounded-lg text-sm font-medium border-2 ${formData.plant_inspection_result === opt ? opt === '적합' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300'}`}>{opt}</button>
            ))}
          </div>
        </div>

        {/* 검수 의견 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">검수 의견</label>
          <textarea value={formData.plant_inspection_comment || ''} onChange={(e) => handleChange('plant_inspection_comment', e.target.value)} disabled={!isChecklistEnabled} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" placeholder="검수 의견을 입력하세요" />
        </div>

        {/* 검수자, 검수일 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검수자</label>
            <input type="text" value={formData.plant_inspection_by || user?.name || ''} onChange={(e) => handleChange('plant_inspection_by', e.target.value)} disabled={!isChecklistEnabled} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검수일</label>
            <input type="date" value={formData.plant_inspection_date || ''} onChange={(e) => handleChange('plant_inspection_date', e.target.value)} disabled={!isChecklistEnabled} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* 승인요청 */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">생산처 검수 승인</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${formData.plant_inspection_status === '승인' ? 'bg-green-100 text-green-700' : formData.plant_inspection_status === '반려' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{formData.plant_inspection_status || '대기'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleChange('plant_inspection_status', '승인')} disabled={!isChecklistEnabled} className="py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">승인</button>
            <button type="button" onClick={() => handleChange('plant_inspection_status', '반려')} disabled={!isChecklistEnabled} className="py-2.5 bg-white text-red-500 border-2 border-red-200 rounded-lg text-sm font-medium disabled:opacity-50">반려</button>
          </div>
        </div>
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
      </div>);
      
      default: return null;
    }
  };

  return (<div className="min-h-screen bg-gray-50 pb-24">
    <SyncStatus online={online} syncing={syncing} pendingCount={pendingCount} onSync={processQueue} />
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="px-4 py-3"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={24} className="text-gray-600" /></button><div><h1 className="text-lg font-bold text-gray-800">{id ? '수리요청 수정' : '수리요청 등록'}</h1><p className="text-xs text-gray-500">{formData.part_number || '새 요청'}{!online && <span className="ml-2 text-orange-500"><WifiOff size={12} className="inline" /> 오프라인</span>}</p></div></div><div className="flex items-center gap-2">{id && !isEditing ? <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium">수정</button> : id && isEditing ? <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">취소</button> : null}</div></div></div>
      <div className="flex border-t overflow-x-auto">{sections.map(s => (<button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex-shrink-0 px-3 py-2.5 text-center text-xs font-medium ${activeSection === s.id ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' : 'text-gray-500'}`}><s.icon size={14} className="inline mr-1" />{s.name}</button>))}</div>
    </div>
    <div className="p-4"><div className="bg-white rounded-xl p-4 shadow-sm">{renderSection()}</div></div>
    {isEditing && <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-2"><button onClick={() => handleSave('draft')} disabled={saving} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"><Save size={18} />임시저장</button><button onClick={() => handleSave('submit')} disabled={saving || !online} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">{!online ? <WifiOff size={18} /> : <Send size={18} />}{saving ? '저장 중...' : !online ? '오프라인' : '제출'}</button></div>}
  </div>);
}
