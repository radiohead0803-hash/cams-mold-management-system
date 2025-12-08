import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, X, Package, Factory, Building2, Clock, ChevronDown, AlertCircle, Box } from 'lucide-react';
import { moldSpecificationAPI } from '../lib/api';

export default function MoldSpecification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = id || searchParams.get('moldId');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldData, setMoldData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [expandedSections, setExpandedSections] = useState(['basic', 'mold', 'maker', 'plant']);

  useEffect(() => { if (moldId) loadMoldData(); }, [moldId]);

  const loadMoldData = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      setMoldData(response.data.data);
      setEditedData(response.data.data);
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await moldSpecificationAPI.update(moldId, editedData);
      setMoldData(editedData);
      setEditMode(false);
      alert('저장되었습니다.');
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => setEditedData(prev => ({ ...prev, [field]: value }));
  const toggleSection = (sectionId) => setExpandedSections(prev => prev.includes(sectionId) ? prev.filter(s => s !== sectionId) : [...prev, sectionId]);

  const getSourceBadge = (source) => {
    const badges = { headquarters: { label: '본사', color: 'bg-blue-100 text-blue-700' }, maker: { label: '제작처', color: 'bg-orange-100 text-orange-700' }, plant: { label: '생산처', color: 'bg-green-100 text-green-700' } };
    const badge = badges[source] || badges.headquarters;
    return <span className={px-2 py-0.5 rounded-full text-xs font-medium +badge.color}>{badge.label} 입력</span>;
  };

  const renderField = (label, field, type = 'text', options = null, source = 'headquarters') => {
    const value = editMode ? (editedData[field] ?? '') : (moldData?.[field] ?? '-');
    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 w-32">{label}</label>
            {source !== 'headquarters' && <span className={px-1.5 py-0.5 rounded text-xs +(source === 'maker' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600')}>{source === 'maker' ? '제작처' : '생산처'}</span>}
          </div>
          {editMode ? (
            type === 'select' && options ? <select value={editedData[field] || ''} onChange={(e) => handleChange(field, e.target.value)} className="flex-1 ml-4 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"><option value="">선택</option>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
            : type === 'textarea' ? <textarea value={editedData[field] || ''} onChange={(e) => handleChange(field, e.target.value)} className="flex-1 ml-4 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" rows={2} />
            : <input type={type} value={editedData[field] || ''} onChange={(e) => handleChange(field, e.target.value)} className="flex-1 ml-4 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
          ) : <span className="flex-1 ml-4 text-sm text-gray-900">{value || '-'}</span>}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!moldData) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><AlertCircle className="mx-auto text-red-400" size={48} /><p className="mt-4 text-gray-600">금형 정보를 찾을 수 없습니다.</p><button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">돌아가기</button></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-gray-600" /></button>
              <div><h1 className="text-xl font-bold text-gray-900">금형사양</h1><p className="text-sm text-gray-500">{moldData?.mold?.mold_code || 'M-'+moldId} - {moldData?.part_name || '금형'}</p></div>
            </div>
            <div className="flex items-center gap-2">
              {editMode ? (<><button onClick={() => { setEditedData(moldData); setEditMode(false); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"><X size={16} /> 취소</button><button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save size={16} /> {saving ? '저장 중...' : '저장'}</button></>) : (<button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Edit2 size={16} /> 수정</button>)}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Package className="text-blue-600" size={24} /></div><p className="text-xs text-gray-500">금형코드</p><p className="font-semibold">{moldData?.mold?.mold_code || '-'}</p></div>
            <div className="text-center"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Box className="text-purple-600" size={24} /></div><p className="text-xs text-gray-500">금형타입</p><p className="font-semibold">{moldData?.mold_type || '-'}</p></div>
            <div className="text-center"><div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Factory className="text-orange-600" size={24} /></div><p className="text-xs text-gray-500">제작처</p><p className="font-semibold">{moldData?.makerCompany?.company_name || moldData?.MakerCompany?.company_name || '-'}</p></div>
            <div className="text-center"><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Building2 className="text-green-600" size={24} /></div><p className="text-xs text-gray-500">생산처</p><p className="font-semibold">{moldData?.plantCompany?.company_name || moldData?.PlantCompany?.company_name || '-'}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <button onClick={() => toggleSection('basic')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Package className="text-blue-600" size={20} /></div><div className="text-left"><h3 className="font-semibold">기본 정보</h3><p className="text-xs text-gray-500">본사 개발담당 입력 항목</p></div></div>
            <div className="flex items-center gap-2">{getSourceBadge('headquarters')}<ChevronDown className={'text-gray-400 transition-transform '+(expandedSections.includes('basic') ? 'rotate-180' : '')} size={20} /></div>
          </button>
          {expandedSections.includes('basic') && <div className="px-6 pb-4 border-t">{renderField('품번', 'part_number')}{renderField('대표품번', 'representative_part_number')}{renderField('품명', 'part_name')}{renderField('차종', 'car_model')}{renderField('연식', 'car_year')}{renderField('개발사양', 'mold_spec_type', 'select', ['시작금형', '양산금형'])}{renderField('단계', 'development_stage', 'select', ['개발', '양산'])}{renderField('발주일', 'order_date', 'date')}{renderField('납기예정일', 'target_delivery_date', 'date')}{renderField('비고', 'notes', 'textarea')}</div>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <button onClick={() => toggleSection('mold')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Box className="text-purple-600" size={20} /></div><div className="text-left"><h3 className="font-semibold">금형 사양</h3><p className="text-xs text-gray-500">금형 규격 및 사양 정보</p></div></div>
            <div className="flex items-center gap-2">{getSourceBadge('headquarters')}<ChevronDown className={'text-gray-400 transition-transform '+(expandedSections.includes('mold') ? 'rotate-180' : '')} size={20} /></div>
          </button>
          {expandedSections.includes('mold') && <div className="px-6 pb-4 border-t">{renderField('금형타입', 'mold_type', 'select', ['사출금형', '프레스금형', '다이캐스팅', '기타'])}{renderField('Cavity 수', 'cavity_count', 'number')}{renderField('재질', 'material')}{renderField('톤수', 'tonnage', 'number')}{renderField('금형 크기 (L)', 'mold_size_l', 'number')}{renderField('금형 크기 (W)', 'mold_size_w', 'number')}{renderField('금형 크기 (H)', 'mold_size_h', 'number')}{renderField('금형 중량', 'weight', 'number')}{renderField('수축률', 'shrinkage_rate')}{renderField('캐비티 재질', 'cavity_material')}{renderField('코어 재질', 'core_material')}</div>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <button onClick={() => toggleSection('maker')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-lg"><Factory className="text-orange-600" size={20} /></div><div className="text-left"><h3 className="font-semibold">제작처 정보</h3><p className="text-xs text-gray-500">금형 제작처에서 입력한 정보</p></div></div>
            <div className="flex items-center gap-2">{getSourceBadge('maker')}<ChevronDown className={'text-gray-400 transition-transform '+(expandedSections.includes('maker') ? 'rotate-180' : '')} size={20} /></div>
          </button>
          {expandedSections.includes('maker') && <div className="px-6 pb-4 border-t">{renderField('제작 담당자', 'maker_manager', 'text', null, 'maker')}{renderField('제작 시작일', 'manufacturing_start_date', 'date', null, 'maker')}{renderField('제작 완료일', 'manufacturing_end_date', 'date', null, 'maker')}{renderField('실제 금형 중량', 'actual_weight', 'number', null, 'maker')}{renderField('게이트 타입', 'gate_type', 'select', ['핫러너', '콜드러너', '밸브게이트'], 'maker')}{renderField('게이트 수', 'gate_count', 'number', null, 'maker')}{renderField('냉각채널 수', 'cooling_channel_count', 'number', null, 'maker')}{renderField('제작 비고', 'maker_notes', 'textarea', null, 'maker')}</div>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <button onClick={() => toggleSection('plant')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><Building2 className="text-green-600" size={20} /></div><div className="text-left"><h3 className="font-semibold">생산처 정보</h3><p className="text-xs text-gray-500">생산처에서 입력한 운영 정보</p></div></div>
            <div className="flex items-center gap-2">{getSourceBadge('plant')}<ChevronDown className={'text-gray-400 transition-transform '+(expandedSections.includes('plant') ? 'rotate-180' : '')} size={20} /></div>
          </button>
          {expandedSections.includes('plant') && <div className="px-6 pb-4 border-t">{renderField('설치 위치', 'installation_location', 'text', null, 'plant')}{renderField('설치일', 'installation_date', 'date', null, 'plant')}{renderField('사출기 번호', 'machine_number', 'text', null, 'plant')}{renderField('사출기 톤수', 'machine_tonnage', 'number', null, 'plant')}{renderField('현재 타수', 'current_shots', 'number', null, 'plant')}{renderField('목표 타수', 'target_shots', 'number', null, 'plant')}{renderField('사이클 타임', 'cycle_time', 'number', null, 'plant')}{renderField('운영 상태', 'operation_status', 'select', ['가동중', '정지', '정비중', '대기'], 'plant')}{renderField('생산 비고', 'plant_notes', 'textarea', null, 'plant')}</div>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4"><Clock className="text-gray-400" size={20} /><h3 className="font-semibold">수정 이력</h3></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">최초 등록</span><span>{moldData?.created_at ? new Date(moldData.created_at).toLocaleString('ko-KR') : '-'}</span></div>
            <div className="flex justify-between py-2"><span className="text-gray-600">최종 수정</span><span>{moldData?.updated_at ? new Date(moldData.updated_at).toLocaleString('ko-KR') : '-'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
