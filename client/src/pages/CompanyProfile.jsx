import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterDataAPI, equipmentAPI, generalEquipmentAPI, companyProfileAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { 
  Building2, Save, ArrowLeft, Phone, Mail, MapPin, User, 
  Factory, Wrench, Award, RefreshCw, Plus, Trash2, Edit3,
  CheckCircle, AlertCircle, X, Search, Download, Lock, Users, FileText, Clock, Send, BarChart3, Upload
} from 'lucide-react';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState(null);

  // 사출기 입력 상태
  const [newMachine, setNewMachine] = useState({ manufacturer: '', model_name: '', tonnage: '', year_installed: '', daily_capacity: '' });

  // 비밀번호 변경
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm_password: '' });

  // 담당자 정보
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ contact_name: '', contact_role: '', department: '', plant_name: '', car_model: '', phone: '', email: '' });
  const [showContactForm, setShowContactForm] = useState(false);

  // 인증현황
  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState({ cert_name: '', cert_number: '', issuing_authority: '', issue_date: '', expiry_date: '' });
  const [showCertForm, setShowCertForm] = useState(false);

  // 톤수별 집계
  const [tonnageSummary, setTonnageSummary] = useState([]);

  // 내 업체 보유장비 - 사출기 (equipment API 기반)
  const [myEquipments, setMyEquipments] = useState([]);
  const [equipLoading, setEquipLoading] = useState(false);

  // 내 업체 일반장비 (general equipment API 기반)
  const [myGeneralEquips, setMyGeneralEquips] = useState([]);
  const [geCategories, setGeCategories] = useState([]);
  const [geMasters, setGeMasters] = useState([]);
  const [geLoading, setGeLoading] = useState(false);
  const [newGenEquip, setNewGenEquip] = useState({ category_id: '', equipment_name: '', manufacturer: '', model_name: '', spec_summary: '', quantity: 1 });
  const [showGeMasterModal, setShowGeMasterModal] = useState(false);
  const [geFilterCat, setGeFilterCat] = useState('');

  // 기초정보 불러오기 모달 상태
  const [showImportModal, setShowImportModal] = useState(false);
  const [allMachines, setAllMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [importKeyword, setImportKeyword] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [selectedImports, setSelectedImports] = useState([]);

  useEffect(() => {
    loadProfile();
    loadMyEquipments();
    loadMyGeneralEquips();
    loadContacts();
    loadCertifications();
    loadTonnageSummary();
  }, []);

  const loadMyEquipments = async () => {
    try {
      setEquipLoading(true);
      const res = await equipmentAPI.getMyEquipments();
      if (res.data.success) setMyEquipments(res.data.data);
    } catch (e) {
      console.warn('Load equipments failed:', e.message);
    } finally {
      setEquipLoading(false);
    }
  };

  const loadMyGeneralEquips = async () => {
    try {
      setGeLoading(true);
      const [eqRes, catRes, masterRes] = await Promise.all([
        generalEquipmentAPI.getMyEquipments(),
        generalEquipmentAPI.getCategories(),
        generalEquipmentAPI.getMasters({ limit: 300 })
      ]);
      if (eqRes.data.success) setMyGeneralEquips(eqRes.data.data);
      if (catRes.data.success) setGeCategories(catRes.data.data);
      if (masterRes.data.success) setGeMasters(masterRes.data.data);
    } catch (e) {
      console.warn('Load general equips failed:', e.message);
    } finally {
      setGeLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await companyProfileAPI.getContacts();
      if (res.data.success) setContacts(res.data.data);
    } catch (e) { console.warn('Load contacts failed:', e.message); }
  };

  const loadCertifications = async () => {
    try {
      const res = await companyProfileAPI.getCertifications();
      if (res.data.success) setCertifications(res.data.data);
    } catch (e) { console.warn('Load certifications failed:', e.message); }
  };

  const loadTonnageSummary = async () => {
    try {
      const res = await companyProfileAPI.getTonnageSummary();
      if (res.data.success) setTonnageSummary(res.data.data);
    } catch (e) { console.warn('Load tonnage summary failed:', e.message); }
  };

  const handleChangePassword = async () => {
    if (!pwData.current_password || !pwData.new_password) { alert('현재/새 비밀번호를 모두 입력하세요'); return; }
    if (pwData.new_password !== pwData.confirm_password) { alert('새 비밀번호가 일치하지 않습니다'); return; }
    try {
      const res = await companyProfileAPI.changePassword({ current_password: pwData.current_password, new_password: pwData.new_password });
      if (res.data.success) { alert('비밀번호가 변경되었습니다'); setShowPwModal(false); setPwData({ current_password: '', new_password: '', confirm_password: '' }); }
    } catch (e) { alert(e.response?.data?.error?.message || '비밀번호 변경 실패'); }
  };

  const handleAddContact = async () => {
    if (!newContact.contact_name) { alert('담당자명은 필수입니다'); return; }
    try {
      const res = await companyProfileAPI.addContact(newContact);
      if (res.data.success) { await loadContacts(); setNewContact({ contact_name: '', contact_role: '', department: '', plant_name: '', car_model: '', phone: '', email: '' }); setShowContactForm(false); }
    } catch (e) { alert('담당자 등록 실패: ' + (e.response?.data?.error?.message || e.message)); }
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('이 담당자를 삭제하시겠습니까?')) return;
    try { await companyProfileAPI.deleteContact(id); await loadContacts(); } catch (e) { alert('삭제 실패'); }
  };

  const handleAddCert = async () => {
    if (!newCert.cert_name) { alert('인증명은 필수입니다'); return; }
    try {
      const res = await companyProfileAPI.addCertification(newCert);
      if (res.data.success) { await loadCertifications(); setNewCert({ cert_name: '', cert_number: '', issuing_authority: '', issue_date: '', expiry_date: '' }); setShowCertForm(false); }
    } catch (e) { alert('인증 등록 실패: ' + (e.response?.data?.error?.message || e.message)); }
  };

  const handleDeleteCert = async (id) => {
    if (!confirm('이 인증을 삭제하시겠습니까?')) return;
    try { await companyProfileAPI.deleteCertification(id); await loadCertifications(); } catch (e) { alert('삭제 실패'); }
  };

  const handleSaveDraft = async () => {
    try {
      const res = await companyProfileAPI.saveDraft({ draft_data: formData });
      if (res.data.success) setMessage({ type: 'success', text: '임시저장 완료' });
    } catch (e) { setMessage({ type: 'error', text: '임시저장 실패' }); }
  };

  const handleSubmitForApproval = async () => {
    if (!confirm('프로필 변경사항을 승인 요청하시겠습니까?')) return;
    try {
      const res = await companyProfileAPI.submitForApproval({ draft_data: formData });
      if (res.data.success) { setMessage({ type: 'success', text: '승인 요청이 제출되었습니다. 담당자 확인 후 반영됩니다.' }); setEditMode(false); }
    } catch (e) { setMessage({ type: 'error', text: '승인 요청 실패' }); }
  };

  const handleAddGeneralEquip = async () => {
    if (!newGenEquip.category_id || !newGenEquip.equipment_name) {
      alert('카테고리와 장비명은 필수입니다');
      return;
    }
    try {
      const res = await generalEquipmentAPI.addMyEquipment({
        category_id: parseInt(newGenEquip.category_id),
        equipment_name: newGenEquip.equipment_name,
        manufacturer: newGenEquip.manufacturer || null,
        model_name: newGenEquip.model_name || null,
        spec_summary: newGenEquip.spec_summary || null,
        quantity: parseInt(newGenEquip.quantity) || 1
      });
      if (res.data.success) {
        await loadMyGeneralEquips();
        setNewGenEquip({ category_id: '', equipment_name: '', manufacturer: '', model_name: '', spec_summary: '', quantity: 1 });
      }
    } catch (e) {
      alert('장비 등록 실패: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  const handleRemoveGeneralEquip = async (id) => {
    if (!confirm('이 장비를 삭제하시겠습니까?')) return;
    try {
      await generalEquipmentAPI.deleteEquipment(id);
      await loadMyGeneralEquips();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  const handleSelectFromGeMaster = async (master) => {
    try {
      const res = await generalEquipmentAPI.addMyEquipment({
        category_id: master.category_id,
        equipment_master_id: master.id,
        equipment_name: master.equipment_name,
        manufacturer: master.manufacturer,
        model_name: master.model_name,
        spec_summary: master.spec_summary,
        quantity: 1
      });
      if (res.data.success) {
        await loadMyGeneralEquips();
      }
    } catch (e) {
      alert('등록 실패: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await masterDataAPI.getMyProfile();
      if (response.data.success) {
        setCompany(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      if (error.response?.status === 400) {
        setMessage({ type: 'warning', text: '소속 업체가 등록되지 않았습니다. 관리자에게 문의하세요.' });
      } else {
        setMessage({ type: 'error', text: '프로필 로드 실패: ' + (error.response?.data?.error?.message || error.message) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updateData = {};
      const fields = [
        'phone', 'fax', 'email', 'address', 'address_detail', 'postal_code',
        'latitude', 'longitude',
        'manager_name', 'manager_phone', 'manager_email',
        'representative', 'business_number',
        'production_capacity', 'equipment_list', 'certifications', 'specialties',
        'production_lines', 'injection_machines', 'daily_capacity', 'notes'
      ];
      for (const f of fields) {
        if (formData[f] !== company[f]) updateData[f] = formData[f];
      }

      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'info', text: '변경된 항목이 없습니다.' });
        setSaving(false);
        return;
      }

      const response = await masterDataAPI.updateMyProfile(updateData);
      if (response.data.success) {
        setCompany(response.data.data);
        setEditMode(false);
        setMessage({ type: 'success', text: '프로필이 저장되었습니다. 금형개발 담당자에게 알림이 발송되었습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 실패: ' + (error.response?.data?.error?.message || error.message) });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMachine = async () => {
    if (!newMachine.manufacturer || !newMachine.tonnage) return;
    try {
      const res = await equipmentAPI.addMyEquipment({
        equipment_type: 'injection_machine',
        manufacturer: newMachine.manufacturer,
        model_name: newMachine.model_name,
        tonnage: parseInt(newMachine.tonnage),
        year_installed: newMachine.year_installed ? parseInt(newMachine.year_installed) : null,
        daily_capacity: newMachine.daily_capacity ? parseInt(newMachine.daily_capacity) : null
      });
      if (res.data.success) {
        await loadMyEquipments();
        setNewMachine({ manufacturer: '', model_name: '', tonnage: '', year_installed: '', daily_capacity: '' });
      }
    } catch (e) {
      alert('장비 등록 실패: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  const handleRemoveMachine = async (equipId) => {
    if (!confirm('이 장비를 삭제하시겠습니까?')) return;
    try {
      await equipmentAPI.deleteEquipment(equipId);
      await loadMyEquipments();
    } catch (e) {
      alert('삭제 실패: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  const handleAddEquipment = () => {
    const name = prompt('장비명을 입력하세요:');
    if (!name) return;
    const spec = prompt('사양/수량을 입력하세요:');
    const list = Array.isArray(formData.equipment_list) ? [...formData.equipment_list] : [];
    list.push({ name, spec: spec || '', id: Date.now() });
    setFormData({ ...formData, equipment_list: list });
  };

  const handleRemoveEquipment = (idx) => {
    const list = [...(formData.equipment_list || [])];
    list.splice(idx, 1);
    setFormData({ ...formData, equipment_list: list });
  };

  const handleAddCertification = () => {
    const name = prompt('인증명을 입력하세요 (예: ISO 9001):');
    if (!name) return;
    const expiry = prompt('유효기간 (예: 2026-12):');
    const list = Array.isArray(formData.certifications) ? [...formData.certifications] : [];
    list.push({ name, expiry: expiry || '', id: Date.now() });
    setFormData({ ...formData, certifications: list });
  };

  const handleRemoveCertification = (idx) => {
    const list = [...(formData.certifications || [])];
    list.splice(idx, 1);
    setFormData({ ...formData, certifications: list });
  };

  const loadMachinesFromMaster = async () => {
    setImportLoading(true);
    try {
      const response = await equipmentAPI.getMasters({ equipment_type: 'injection_machine', limit: 200 });
      if (response.data.success) {
        setAllMachines(response.data.data);
        setFilteredMachines(response.data.data);
      }
    } catch (error) {
      console.error('Load machines error:', error);
    } finally {
      setImportLoading(false);
    }
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    setImportKeyword('');
    setSelectedImports([]);
    loadMachinesFromMaster();
  };

  const filterImportMachines = (keyword) => {
    setImportKeyword(keyword);
    if (!keyword.trim()) {
      setFilteredMachines(allMachines);
      return;
    }
    const kw = keyword.toLowerCase();
    setFilteredMachines(allMachines.filter(m =>
      (m.manufacturer || '').toLowerCase().includes(kw) ||
      (m.model_name || '').toLowerCase().includes(kw) ||
      (m.description || '').toLowerCase().includes(kw) ||
      String(m.tonnage).includes(kw)
    ));
  };

  const toggleImportSelect = (machine) => {
    setSelectedImports(prev => {
      const exists = prev.find(s => s.id === machine.id);
      if (exists) return prev.filter(s => s.id !== machine.id);
      return [...prev, machine];
    });
  };

  const handleImportMachines = async () => {
    try {
      const equipments = selectedImports.map(m => ({
        equipment_master_id: m.id,
        equipment_type: m.equipment_type || 'injection_machine',
        manufacturer: m.manufacturer,
        model_name: m.model_name,
        tonnage: m.tonnage
      }));
      const res = await equipmentAPI.bulkAddMyEquipments({ equipments });
      if (res.data.success) {
        await loadMyEquipments();
        setShowImportModal(false);
        setSelectedImports([]);
      }
    } catch (e) {
      alert('불러오기 실패: ' + (e.response?.data?.error?.message || e.message));
    }
  };

  const isPlant = user?.role === 'plant' || company?.company_type === 'plant';
  const isMaker = user?.role === 'maker' || company?.company_type === 'maker';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-blue-600" />
              업체 프로필 관리
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isPlant ? '생산처' : '제작처'} 정보를 등록하고 관리합니다 • 변경 시 금형개발 담당자에게 자동 알림
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPwModal(true)} className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
            <Lock size={14} />
            비밀번호 변경
          </button>
          {editMode ? (
            <>
              <button onClick={handleSaveDraft} className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">
                <Clock size={14} />
                임시저장
              </button>
              <button onClick={handleSubmitForApproval} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <Send size={14} />
                승인요청
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm">
                <Save size={14} />
                {saving ? '저장 중...' : '즉시저장'}
              </button>
              <button onClick={() => { setEditMode(false); setFormData(company); }} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                취소
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Edit3 size={14} />
              수정
            </button>
          )}
        </div>
      </div>

      {/* 알림 메시지 */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          message.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-sm underline">닫기</button>
        </div>
      )}

      {!company ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">소속 업체 정보가 없습니다</p>
          <p className="text-gray-400 text-sm mt-2">관리자에게 업체 등록을 요청하세요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 기본 정보 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">업체코드</label>
                <p className="text-sm font-mono bg-gray-100 rounded px-3 py-2">{company.company_code}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">업체명</label>
                <p className="text-sm font-semibold bg-gray-100 rounded px-3 py-2">{company.company_name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">업체유형</label>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${company.company_type === 'maker' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {company.company_type === 'maker' ? '제작처' : '생산처'}
                </span>
              </div>
              <InputField label="대표자" field="representative" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="사업자등록번호" field="business_number" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="이메일" field="email" formData={formData} setFormData={setFormData} editMode={editMode} type="email" />
              <InputField label="전화번호" field="phone" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="팩스" field="fax" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="우편번호" field="postal_code" formData={formData} setFormData={setFormData} editMode={editMode} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <InputField label="주소" field="address" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="상세주소" field="address_detail" formData={formData} setFormData={setFormData} editMode={editMode} />
            </div>

            {/* GPS 좌표 */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                GPS 위치 정보
                {formData.latitude && formData.longitude && (
                  <span className="ml-auto text-xs font-normal text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} /> 좌표 등록됨
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">위도 (Latitude)</label>
                  {editMode ? (
                    <input
                      type="number" step="0.000001" placeholder="예: 35.1500"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800">
                      {formData.latitude || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">경도 (Longitude)</label>
                  {editMode ? (
                    <input
                      type="number" step="0.000001" placeholder="예: 126.8300"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800">
                      {formData.longitude || '-'}
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          alert('이 브라우저에서는 GPS를 지원하지 않습니다.');
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setFormData({
                              ...formData,
                              latitude: pos.coords.latitude.toFixed(6),
                              longitude: pos.coords.longitude.toFixed(6)
                            });
                          },
                          (err) => alert('위치를 가져올 수 없습니다: ' + err.message),
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <MapPin size={14} />
                      현재 위치 가져오기
                    </button>
                  )}
                  {formData.latitude && formData.longitude && (
                    <a
                      href={`https://map.kakao.com/link/map/${formData.company_name || '업체'},${formData.latitude},${formData.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      <MapPin size={14} />
                      지도 보기
                    </a>
                  )}
                </div>
              </div>
              {formData.latitude && formData.longitude && (
                <p className="mt-2 text-xs text-gray-500">
                  📍 위치가 등록되면 금형 위치 추적의 기준점으로 활용됩니다.
                </p>
              )}
            </div>
          </section>

          {/* 담당자 정보 (공장/차종별 여러 명) */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-600" />
              담당자 정보
              <span className="text-xs font-normal text-gray-400 ml-2">공장/차종별 여러 명 등록 가능</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <InputField label="대표 담당자명" field="manager_name" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="대표 전화번호" field="manager_phone" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="대표 이메일" field="manager_email" formData={formData} setFormData={setFormData} editMode={editMode} type="email" />
            </div>

            {contacts.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 mt-3">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">담당자명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">직책</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">부서</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">공장</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">차종</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">연락처</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">이메일</th>
                      {editMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">삭제</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map(c => (
                      <tr key={c.id}>
                        <td className="px-3 py-2 font-medium">{c.contact_name} {c.is_primary && <span className="text-[10px] bg-purple-100 text-purple-700 rounded px-1">대표</span>}</td>
                        <td className="px-3 py-2 text-xs">{c.contact_role || '-'}</td>
                        <td className="px-3 py-2 text-xs">{c.department || '-'}</td>
                        <td className="px-3 py-2 text-xs">{c.plant_name || '-'}</td>
                        <td className="px-3 py-2 text-xs">{c.car_model || '-'}</td>
                        <td className="px-3 py-2 text-xs">{c.phone || '-'}</td>
                        <td className="px-3 py-2 text-xs">{c.email || '-'}</td>
                        {editMode && (
                          <td className="px-3 py-2">
                            <button onClick={() => handleDeleteContact(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editMode && !showContactForm && (
              <button onClick={() => setShowContactForm(true)} className="mt-3 flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                <Plus size={14} /> 담당자 추가
              </button>
            )}
            {editMode && showContactForm && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-medium text-purple-700 mb-2">새 담당자 등록</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input type="text" placeholder="담당자명 *" value={newContact.contact_name} onChange={e => setNewContact({...newContact, contact_name: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="직책" value={newContact.contact_role} onChange={e => setNewContact({...newContact, contact_role: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="부서" value={newContact.department} onChange={e => setNewContact({...newContact, department: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="공장명" value={newContact.plant_name} onChange={e => setNewContact({...newContact, plant_name: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="담당차종" value={newContact.car_model} onChange={e => setNewContact({...newContact, car_model: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="연락처" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="email" placeholder="이메일" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <div className="flex gap-1">
                    <button onClick={handleAddContact} className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">등록</button>
                    <button onClick={() => setShowContactForm(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">취소</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 생산처 전용: 사출기 보유현황 */}
          {isPlant && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Factory size={20} className="text-green-600" />
                사출기 보유현황
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <InputField label="생산 라인 수" field="production_lines" formData={formData} setFormData={setFormData} editMode={editMode} type="number" />
                <InputField label="일일 생산능력 (개)" field="daily_capacity" formData={formData} setFormData={setFormData} editMode={editMode} type="number" />
              </div>

              {/* 사출기 목록 */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">보유 사출기 목록</p>
                  {editMode && (
                    <span className="text-xs text-gray-400">제조사와 톤수는 필수입니다</span>
                  )}
                </div>
                
                {equipLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw size={20} className="animate-spin text-green-500" />
                    <span className="ml-2 text-sm text-gray-500">장비 로딩 중...</span>
                  </div>
                ) : myEquipments.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">제조사</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">모델명</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">톤수</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">도입년도</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">일일생산</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                          {editMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">삭제</th>}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {myEquipments.map((m, i) => (
                          <tr key={m.id}>
                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2 font-medium">{m.manufacturer}</td>
                            <td className="px-3 py-2">{m.model_name || '-'}</td>
                            <td className="px-3 py-2 font-bold text-blue-600">{m.tonnage ? `${m.tonnage}T` : '-'}</td>
                            <td className="px-3 py-2">{m.year_installed || '-'}</td>
                            <td className="px-3 py-2">{m.daily_capacity ? `${m.daily_capacity.toLocaleString()}개` : '-'}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                m.status === 'active' ? 'bg-green-100 text-green-700' :
                                m.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                m.status === 'retired' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {m.status === 'active' ? '가동' : m.status === 'maintenance' ? '정비' : m.status === 'retired' ? '폐기' : m.status === 'standby' ? '대기' : m.status}
                              </span>
                            </td>
                            {editMode && (
                              <td className="px-3 py-2">
                                <button onClick={() => handleRemoveMachine(m.id)} className="text-red-500 hover:text-red-700">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Factory className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">등록된 사출기가 없습니다</p>
                  </div>
                )}

                {editMode && (
                  <div className="mt-3 mb-3">
                    <button onClick={handleOpenImportModal} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                      <Download size={14} /> 기초정보에서 불러오기
                    </button>
                  </div>
                )}

                {editMode && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">수동 입력 (기초정보에 없는 장비)</p>
                    <div className="flex items-end gap-2 flex-wrap">
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs text-gray-500">제조사 *</label>
                        <input type="text" value={newMachine.manufacturer} onChange={e => setNewMachine({...newMachine, manufacturer: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="LS엠트론" />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label className="text-xs text-gray-500">모델명</label>
                        <input type="text" value={newMachine.model_name} onChange={e => setNewMachine({...newMachine, model_name: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="LGE-III" />
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500">톤수 *</label>
                        <input type="number" value={newMachine.tonnage} onChange={e => setNewMachine({...newMachine, tonnage: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="350" />
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500">도입년도</label>
                        <input type="text" value={newMachine.year_installed} onChange={e => setNewMachine({...newMachine, year_installed: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="2024" />
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-gray-500">일일생산(개)</label>
                        <input type="number" value={newMachine.daily_capacity} onChange={e => setNewMachine({...newMachine, daily_capacity: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="5000" />
                      </div>
                      <button onClick={handleAddMachine} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        <Plus size={14} /> 추가
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 톤수별 보유수량 집계 */}
              {tonnageSummary.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
                    <BarChart3 size={16} /> 톤수별 보유수량 집계
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tonnageSummary.map(t => (
                      <div key={t.tonnage} className="bg-white border border-green-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                        <p className="text-lg font-bold text-green-700">{t.tonnage || '?'}T</p>
                        <p className="text-xs text-gray-600">{t.count}대 (가동 {t.active_count}대)</p>
                        {t.total_daily_capacity && <p className="text-[10px] text-gray-400">일 {parseInt(t.total_daily_capacity).toLocaleString()}개</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    총 {tonnageSummary.reduce((s, t) => s + parseInt(t.count), 0)}대 보유 • 
                    가동 {tonnageSummary.reduce((s, t) => s + parseInt(t.active_count), 0)}대
                  </p>
                </div>
              )}
            </section>
          )}

          {/* 제작처 전용: 생산능력 및 전문분야 */}
          {isMaker && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-orange-600" />
                제작 능력
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="월간 금형 제작 능력 (개)" field="production_capacity" formData={formData} setFormData={setFormData} editMode={editMode} type="number" />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">전문분야</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={Array.isArray(formData.specialties) ? formData.specialties.join(', ') : (formData.specialties || '')}
                      onChange={e => setFormData({...formData, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="사출금형, 프레스금형 (쉼표 구분)"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(formData.specialties) ? formData.specialties : []).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{s}</span>
                      ))}
                      {(!formData.specialties || (Array.isArray(formData.specialties) && formData.specialties.length === 0)) && <span className="text-gray-400 text-sm">미등록</span>}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 공통: 보유장비 현황 (카테고리별) */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-blue-600" />
              보유 장비 현황
              <span className="text-xs font-normal text-gray-400 ml-2">카테고리별 장비 등록</span>
            </h2>

            {geLoading ? (
              <div className="flex items-center justify-center py-6">
                <RefreshCw size={20} className="animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">장비 로딩 중...</span>
              </div>
            ) : myGeneralEquips.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">분류</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">장비명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">제조사</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">사양</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">수량</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                      {editMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">삭제</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myGeneralEquips.map((eq, i) => (
                      <tr key={eq.id}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${eq.applicable_to === 'maker' ? 'bg-blue-100 text-blue-700' : eq.applicable_to === 'plant' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {eq.category_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{eq.equipment_name}</td>
                        <td className="px-3 py-2 text-xs">{eq.manufacturer || '-'}</td>
                        <td className="px-3 py-2 text-xs text-orange-600">{eq.spec_summary || '-'}</td>
                        <td className="px-3 py-2 text-center font-bold">{eq.quantity || 1}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${eq.status === 'active' ? 'bg-green-100 text-green-700' : eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {eq.status === 'active' ? '가동' : eq.status === 'maintenance' ? '정비' : eq.status === 'retired' ? '폐기' : eq.status}
                          </span>
                        </td>
                        {editMode && (
                          <td className="px-3 py-2">
                            <button onClick={() => handleRemoveGeneralEquip(eq.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">등록된 장비가 없습니다</p>
              </div>
            )}

            {editMode && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowGeMasterModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                    <Download size={14} /> 기초정보에서 선택
                  </button>
                </div>
                <p className="text-xs text-gray-500">수동 입력 (기초정보에 없는 장비)</p>
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="min-w-[140px]">
                    <label className="text-xs text-gray-500">분류 *</label>
                    <select value={newGenEquip.category_id} onChange={e => setNewGenEquip({...newGenEquip, category_id: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                      <option value="">선택</option>
                      {geCategories.map(c => (
                        <option key={c.id} value={c.id}>[{c.applicable_to === 'maker' ? '제작처' : c.applicable_to === 'plant' ? '생산처' : '공통'}] {c.category_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-gray-500">장비명 *</label>
                    <input type="text" value={newGenEquip.equipment_name} onChange={e => setNewGenEquip({...newGenEquip, equipment_name: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="VMC 850" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500">제조사</label>
                    <input type="text" value={newGenEquip.manufacturer} onChange={e => setNewGenEquip({...newGenEquip, manufacturer: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="두산" />
                  </div>
                  <div className="w-20">
                    <label className="text-xs text-gray-500">수량</label>
                    <input type="number" value={newGenEquip.quantity} onChange={e => setNewGenEquip({...newGenEquip, quantity: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" min="1" />
                  </div>
                  <button onClick={handleAddGeneralEquip} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    <Plus size={14} /> 추가
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 기초정보 선택 모달 (일반장비) */}
          {showGeMasterModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">기초정보에서 장비 선택</h3>
                    <button onClick={() => setShowGeMasterModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <select value={geFilterCat} onChange={e => setGeFilterCat(e.target.value)} className="border rounded px-2 py-1.5 text-sm min-w-[160px]">
                      <option value="">전체 분류</option>
                      {geCategories.map(c => (
                        <option key={c.id} value={c.id}>[{c.applicable_to === 'maker' ? '제작처' : c.applicable_to === 'plant' ? '생산처' : '공통'}] {c.category_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {geMasters
                      .filter(m => !geFilterCat || m.category_id === parseInt(geFilterCat))
                      .map(m => (
                        <div key={m.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex-1">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mr-2">{m.category_name}</span>
                            <span className="font-medium text-sm">{m.equipment_name}</span>
                            {m.manufacturer && <span className="text-xs text-gray-500 ml-2">{m.manufacturer}</span>}
                            {m.spec_summary && <span className="text-xs text-orange-500 ml-2">{m.spec_summary}</span>}
                          </div>
                          <button onClick={() => handleSelectFromGeMaster(m)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                            추가
                          </button>
                        </div>
                    ))}
                    {geMasters.filter(m => !geFilterCat || m.category_id === parseInt(geFilterCat)).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">해당 분류의 기초정보가 없습니다</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 공통: 인증현황 (DB 기반) */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-600" />
              인증 현황
              <span className="text-xs font-normal text-gray-400 ml-2">인증서 사진 및 주관처 입력</span>
            </h2>
            {certifications.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">인증명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">인증번호</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">주관처</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">발급일</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">만료일</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">인증서</th>
                      {editMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">삭제</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certifications.map(cert => (
                      <tr key={cert.id}>
                        <td className="px-3 py-2 font-medium">
                          <Award size={12} className="inline text-yellow-500 mr-1" />
                          {cert.cert_name}
                        </td>
                        <td className="px-3 py-2 text-xs">{cert.cert_number || '-'}</td>
                        <td className="px-3 py-2 text-xs">{cert.issuing_authority || '-'}</td>
                        <td className="px-3 py-2 text-xs">{cert.issue_date || '-'}</td>
                        <td className="px-3 py-2 text-xs">{cert.expiry_date || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cert.status === 'valid' ? 'bg-green-100 text-green-700' : cert.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {cert.status === 'valid' ? '유효' : cert.status === 'expired' ? '만료' : '갱신중'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {cert.cert_file_url ? (
                            <a href={cert.cert_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5">
                              <FileText size={12} /> 보기
                            </a>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        {editMode && (
                          <td className="px-3 py-2">
                            <button onClick={() => handleDeleteCert(cert.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">등록된 인증이 없습니다</p>
              </div>
            )}
            {editMode && !showCertForm && (
              <button onClick={() => setShowCertForm(true)} className="mt-3 flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                <Plus size={14} /> 인증 추가
              </button>
            )}
            {editMode && showCertForm && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs font-medium text-yellow-700 mb-2">새 인증 등록</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <input type="text" placeholder="인증명 * (예: ISO 9001)" value={newCert.cert_name} onChange={e => setNewCert({...newCert, cert_name: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="인증번호" value={newCert.cert_number} onChange={e => setNewCert({...newCert, cert_number: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <input type="text" placeholder="주관처 (예: KAB)" value={newCert.issuing_authority} onChange={e => setNewCert({...newCert, issuing_authority: e.target.value})} className="border rounded px-2 py-1.5 text-sm" />
                  <div>
                    <label className="text-[10px] text-gray-500">발급일</label>
                    <input type="date" value={newCert.issue_date} onChange={e => setNewCert({...newCert, issue_date: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">만료일</label>
                    <input type="date" value={newCert.expiry_date} onChange={e => setNewCert({...newCert, expiry_date: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div className="flex gap-1 items-end">
                    <button onClick={handleAddCert} className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">등록</button>
                    <button onClick={() => setShowCertForm(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">취소</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 비고 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">비고</h2>
            {editMode ? (
              <textarea
                value={formData.notes || ''}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="추가 정보를 입력하세요..."
              />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.notes || '없음'}</p>
            )}
          </section>
        </div>
      )}
      {/* 기초정보에서 불러오기 모달 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Download size={20} className="text-indigo-600" />
                  기초정보에서 사출기 불러오기
                </h3>
                <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-3 relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="제조사, 모델명, 업체명, 톤수로 검색..."
                  value={importKeyword}
                  onChange={(e) => filterImportMachines(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {importLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-indigo-500" />
                  <span className="ml-2 text-sm text-gray-500">사출기 목록 로딩 중...</span>
                </div>
              ) : filteredMachines.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">등록된 사출기가 없습니다.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">선택</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">제조사</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">모델명</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">톤수</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">설명</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMachines.map((m) => {
                        const isSelected = selectedImports.some(s => s.id === m.id);
                        return (
                          <tr
                            key={m.id}
                            onClick={() => toggleImportSelect(m)}
                            className={`cursor-pointer transition ${isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-50'}`}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleImportSelect(m)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium">{m.manufacturer}</td>
                            <td className="px-3 py-2">{m.model_name || '-'}</td>
                            <td className="px-3 py-2 font-bold text-blue-600">{m.tonnage ? `${m.tonnage}T` : '-'}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{m.description || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {filteredMachines.length}개 중 {selectedImports.length}개 선택
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={handleImportMachines}
                  disabled={selectedImports.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-1"
                >
                  <Plus size={14} />
                  {selectedImports.length}개 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock size={20} className="text-gray-600" />
                비밀번호 변경
              </h3>
              <button onClick={() => setShowPwModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">비밀번호 변경은 승인 없이 즉시 반영됩니다.</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">현재 비밀번호</label>
                <input type="password" value={pwData.current_password} onChange={e => setPwData({...pwData, current_password: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="현재 비밀번호 입력" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호</label>
                <input type="password" value={pwData.new_password} onChange={e => setPwData({...pwData, new_password: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="새 비밀번호 (4자 이상)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호 확인</label>
                <input type="password" value={pwData.confirm_password} onChange={e => setPwData({...pwData, confirm_password: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="새 비밀번호 다시 입력" />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowPwModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">취소</button>
              <button onClick={handleChangePassword} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">변경</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, field, formData, setFormData, editMode, type = 'text' }) {
  if (editMode) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input
          type={type}
          value={formData[field] || ''}
          onChange={e => setFormData({...formData, [field]: type === 'number' ? (parseInt(e.target.value) || null) : e.target.value})}
          className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <p className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">{formData[field] || '-'}</p>
    </div>
  );
}
