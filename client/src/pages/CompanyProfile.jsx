import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterDataAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { 
  Building2, Save, ArrowLeft, Phone, Mail, MapPin, User, 
  Factory, Wrench, Award, RefreshCw, Plus, Trash2, Edit3,
  CheckCircle, AlertCircle
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
  const [newMachine, setNewMachine] = useState({ manufacturer: '', model: '', tonnage: '', year: '' });

  useEffect(() => {
    loadProfile();
  }, []);

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

  const handleAddMachine = () => {
    if (!newMachine.manufacturer || !newMachine.tonnage) return;
    const machines = Array.isArray(formData.injection_machines) ? [...formData.injection_machines] : [];
    machines.push({ ...newMachine, id: Date.now() });
    setFormData({ ...formData, injection_machines: machines });
    setNewMachine({ manufacturer: '', model: '', tonnage: '', year: '' });
  };

  const handleRemoveMachine = (idx) => {
    const machines = [...(formData.injection_machines || [])];
    machines.splice(idx, 1);
    setFormData({ ...formData, injection_machines: machines });
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
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                <Save size={16} />
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => { setEditMode(false); setFormData(company); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                취소
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Edit3 size={16} />
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
          </section>

          {/* 담당자 정보 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-purple-600" />
              담당자 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="담당자명" field="manager_name" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="담당자 전화번호" field="manager_phone" formData={formData} setFormData={setFormData} editMode={editMode} />
              <InputField label="담당자 이메일" field="manager_email" formData={formData} setFormData={setFormData} editMode={editMode} type="email" />
            </div>
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
                
                {(formData.injection_machines || []).length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">제조사</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">모델명</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">톤수</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">도입년도</th>
                          {editMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">삭제</th>}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(formData.injection_machines || []).map((m, i) => (
                          <tr key={m.id || i}>
                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2 font-medium">{m.manufacturer}</td>
                            <td className="px-3 py-2">{m.model || '-'}</td>
                            <td className="px-3 py-2 font-bold text-blue-600">{m.tonnage}T</td>
                            <td className="px-3 py-2">{m.year || '-'}</td>
                            {editMode && (
                              <td className="px-3 py-2">
                                <button onClick={() => handleRemoveMachine(i)} className="text-red-500 hover:text-red-700">
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
                  <div className="mt-3 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">제조사 *</label>
                      <select value={newMachine.manufacturer} onChange={e => setNewMachine({...newMachine, manufacturer: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                        <option value="">선택</option>
                        <option>LS엠트론</option>
                        <option>우진플라임</option>
                        <option>엥겔</option>
                        <option>크라우스마파이</option>
                        <option>아버그</option>
                        <option>동성화인</option>
                        <option>기타</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">모델명</label>
                      <input type="text" value={newMachine.model} onChange={e => setNewMachine({...newMachine, model: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="LGE350" />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500">톤수 *</label>
                      <input type="number" value={newMachine.tonnage} onChange={e => setNewMachine({...newMachine, tonnage: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="350" />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500">도입년도</label>
                      <input type="text" value={newMachine.year} onChange={e => setNewMachine({...newMachine, year: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="2024" />
                    </div>
                    <button onClick={handleAddMachine} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      <Plus size={14} /> 추가
                    </button>
                  </div>
                )}
              </div>
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

          {/* 공통: 보유장비 목록 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-blue-600" />
              보유 장비
            </h2>
            {(formData.equipment_list || []).length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">장비명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">사양/수량</th>
                      {editMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">삭제</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(formData.equipment_list || []).map((eq, i) => (
                      <tr key={eq.id || i}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{eq.name}</td>
                        <td className="px-3 py-2">{eq.spec || '-'}</td>
                        {editMode && (
                          <td className="px-3 py-2">
                            <button onClick={() => handleRemoveEquipment(i)} className="text-red-500 hover:text-red-700">
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
              <button onClick={handleAddEquipment} className="mt-3 flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                <Plus size={14} /> 장비 추가
              </button>
            )}
          </section>

          {/* 공통: 인증현황 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-600" />
              인증 현황
            </h2>
            {(formData.certifications || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(formData.certifications || []).map((cert, i) => (
                  <div key={cert.id || i} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    <Award size={14} className="text-yellow-600" />
                    <span className="font-medium">{cert.name}</span>
                    {cert.expiry && <span className="text-xs text-gray-500">({cert.expiry}까지)</span>}
                    {editMode && (
                      <button onClick={() => handleRemoveCertification(i)} className="text-red-400 hover:text-red-600 ml-1">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">등록된 인증이 없습니다</p>
            )}
            {editMode && (
              <button onClick={handleAddCertification} className="mt-3 flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                <Plus size={14} /> 인증 추가
              </button>
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
