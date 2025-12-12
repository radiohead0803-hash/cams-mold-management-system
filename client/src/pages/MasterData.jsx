import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterDataAPI } from '../lib/api';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Search, Filter } from 'lucide-react';

export default function MasterData() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('car-models');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterMsSpec, setFilterMsSpec] = useState('');

  const tabs = [
    { id: 'car-models', label: '차종' },
    { id: 'materials', label: '재질' },
    { id: 'mold-types', label: '금형타입' },
    { id: 'tonnages', label: '사출기 사양' },
    { id: 'raw-materials', label: '원재료' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (activeTab) {
        case 'car-models':
          response = await masterDataAPI.getCarModels({ is_active: true });
          break;
        case 'materials':
          response = await masterDataAPI.getMaterials({ is_active: true });
          break;
        case 'mold-types':
          response = await masterDataAPI.getMoldTypes({ is_active: true });
          break;
        case 'tonnages':
          response = await masterDataAPI.getTonnages({ is_active: true });
          break;
        case 'raw-materials':
          response = await masterDataAPI.getRawMaterials({ is_active: true });
          break;
      }
      
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 다음 정렬 순서 계산
  const getNextSortOrder = () => {
    if (data.length === 0) return 1;
    const maxOrder = Math.max(...data.map(item => item.sort_order || 0));
    return maxOrder + 1;
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({ sort_order: getNextSortOrder() });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        switch (activeTab) {
          case 'car-models':
            await masterDataAPI.createCarModel(formData);
            break;
          case 'materials':
            await masterDataAPI.createMaterial(formData);
            break;
          case 'mold-types':
            await masterDataAPI.createMoldType(formData);
            break;
          case 'tonnages':
            await masterDataAPI.createTonnage(formData);
            break;
          case 'raw-materials':
            await masterDataAPI.createRawMaterial(formData);
            break;
        }
      } else {
        switch (activeTab) {
          case 'car-models':
            await masterDataAPI.updateCarModel(editingId, formData);
            break;
          case 'materials':
            await masterDataAPI.updateMaterial(editingId, formData);
            break;
          case 'mold-types':
            await masterDataAPI.updateMoldType(editingId, formData);
            break;
          case 'tonnages':
            await masterDataAPI.updateTonnage(editingId, formData);
            break;
          case 'raw-materials':
            await masterDataAPI.updateRawMaterial(editingId, formData);
            break;
        }
      }
      
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      loadData();
      alert('저장되었습니다');
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 실패: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      switch (activeTab) {
        case 'car-models':
          await masterDataAPI.deleteCarModel(id);
          break;
        case 'materials':
          await masterDataAPI.deleteMaterial(id);
          break;
        case 'mold-types':
          await masterDataAPI.deleteMoldType(id);
          break;
        case 'tonnages':
          await masterDataAPI.deleteTonnage(id);
          break;
        case 'raw-materials':
          await masterDataAPI.deleteRawMaterial(id);
          break;
      }
      
      loadData();
      alert('삭제되었습니다');
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 실패');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'car-models':
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="차종명 (예: K5)"
              value={formData.model_name || ''}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="차종코드 (예: DL3)"
              value={formData.model_code || ''}
              onChange={(e) => setFormData({ ...formData, model_code: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="제조사 (예: 기아)"
              value={formData.manufacturer || ''}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="input"
            />
          </div>
        );
      
      case 'materials':
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="재질명 (예: NAK80)"
              value={formData.material_name || ''}
              onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="재질코드"
              value={formData.material_code || ''}
              onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="분류 (예: 프리하든강)"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="경도 (예: HRC 37-43)"
              value={formData.hardness || ''}
              onChange={(e) => setFormData({ ...formData, hardness: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="설명"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input col-span-2"
            />
          </div>
        );
      
      case 'mold-types':
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="금형타입명 (예: 사출금형)"
              value={formData.type_name || ''}
              onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="타입코드"
              value={formData.type_code || ''}
              onChange={(e) => setFormData({ ...formData, type_code: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="설명"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input col-span-2"
            />
          </div>
        );
      
      case 'tonnages':
        return (
          <div className="grid grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="톤수 (예: 350)"
              value={formData.tonnage_value || ''}
              onChange={(e) => setFormData({ ...formData, tonnage_value: parseInt(e.target.value) })}
              className="input"
              required
            />
            <select
              value={formData.manufacturer || ''}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="input"
            >
              <option value="">제조처 선택</option>
              <option value="LS엠트론">LS엠트론</option>
              <option value="우진플라임">우진플라임</option>
              <option value="엥겔">엥겔</option>
              <option value="크라우스마파이">크라우스마파이</option>
              <option value="아버그">아버그</option>
              <option value="동성화인">동성화인</option>
              <option value="기타">기타</option>
            </select>
            <input
              type="text"
              placeholder="모델명 (예: LGE350)"
              value={formData.model_name || ''}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
              className="input"
            />
            <input
              type="number"
              placeholder="형개폐 스트로크(mm)"
              value={formData.clamping_stroke || ''}
              onChange={(e) => setFormData({ ...formData, clamping_stroke: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="데이라이트(mm)"
              value={formData.daylight_opening || ''}
              onChange={(e) => setFormData({ ...formData, daylight_opening: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="플래튼 가로(mm)"
              value={formData.platen_size_h || ''}
              onChange={(e) => setFormData({ ...formData, platen_size_h: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="플래튼 세로(mm)"
              value={formData.platen_size_v || ''}
              onChange={(e) => setFormData({ ...formData, platen_size_v: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="타이바 간격 가로(mm)"
              value={formData.tiebar_spacing_h || ''}
              onChange={(e) => setFormData({ ...formData, tiebar_spacing_h: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="타이바 간격 세로(mm)"
              value={formData.tiebar_spacing_v || ''}
              onChange={(e) => setFormData({ ...formData, tiebar_spacing_v: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="최소 금형두께(mm)"
              value={formData.min_mold_thickness || ''}
              onChange={(e) => setFormData({ ...formData, min_mold_thickness: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="최대 금형두께(mm)"
              value={formData.max_mold_thickness || ''}
              onChange={(e) => setFormData({ ...formData, max_mold_thickness: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="최대 금형 가로(mm)"
              value={formData.max_mold_width || ''}
              onChange={(e) => setFormData({ ...formData, max_mold_width: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="최대 금형 세로(mm)"
              value={formData.max_mold_height || ''}
              onChange={(e) => setFormData({ ...formData, max_mold_height: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="사출용량(cm³)"
              value={formData.shot_volume || ''}
              onChange={(e) => setFormData({ ...formData, shot_volume: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              placeholder="사출중량 PS기준(g)"
              value={formData.shot_weight || ''}
              onChange={(e) => setFormData({ ...formData, shot_weight: parseInt(e.target.value) || null })}
              className="input"
            />
            <input
              type="number"
              step="0.1"
              placeholder="모터출력(kW)"
              value={formData.motor_power || ''}
              onChange={(e) => setFormData({ ...formData, motor_power: parseFloat(e.target.value) || null })}
              className="input"
            />
            <input
              type="text"
              placeholder="설명 (예: 대형 범퍼용)"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input col-span-2"
            />
          </div>
        );
      
      case 'raw-materials':
        return (
          <div className="grid grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="MS SPEC (예: MS213-67)"
              value={formData.ms_spec || ''}
              onChange={(e) => setFormData({ ...formData, ms_spec: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="타입 (예: PP-GF20-067 TYPE B-1)"
              value={formData.material_type || ''}
              onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="그레이드 (예: H2202)"
              value={formData.grade || ''}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="input"
            />
            <select
              value={formData.supplier || ''}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="input"
            >
              <option value="">공급업체 선택</option>
              <option value="몰딩케미칼">몰딩케미칼</option>
              <option value="GSS플라스틱">GSS플라스틱</option>
              <option value="금호석유화학">금호석유화학</option>
              <option value="LG화학">LG화학</option>
              <option value="롯데케미칼">롯데케미칼</option>
              <option value="SABIC">SABIC</option>
              <option value="BASF">BASF</option>
              <option value="DuPont">DuPont</option>
              <option value="코오롱플라스틱">코오롱플라스틱</option>
              <option value="셀라니즈">셀라니즈</option>
              <option value="한화솔루션">한화솔루션</option>
              <option value="등록업체">등록업체</option>
              <option value="신규업체확인필요">신규업체확인필요</option>
            </select>
            <input
              type="text"
              placeholder="원재료 수축률 (예: 6/1000)"
              value={formData.shrinkage_rate || ''}
              onChange={(e) => setFormData({ ...formData, shrinkage_rate: e.target.value })}
              className="input"
            />
            <input
              type="number"
              step="0.001"
              placeholder="비중 (예: 1.04)"
              value={formData.specific_gravity || ''}
              onChange={(e) => setFormData({ ...formData, specific_gravity: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="금형수축률 (예: 6/1000)"
              value={formData.mold_shrinkage || ''}
              onChange={(e) => setFormData({ ...formData, mold_shrinkage: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="용도 (예: 범퍼, 내장재)"
              value={formData.usage || ''}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="장점 (예: 강성↑, 내열성↑)"
              value={formData.advantages || ''}
              onChange={(e) => setFormData({ ...formData, advantages: e.target.value })}
              className="input col-span-2"
            />
            <input
              type="text"
              placeholder="단점 (예: 충격강도↓, 고가)"
              value={formData.disadvantages || ''}
              onChange={(e) => setFormData({ ...formData, disadvantages: e.target.value })}
              className="input col-span-2"
            />
            <input
              type="text"
              placeholder="특징 (예: 저온(-30℃) 충격/강성↑, 열변형↓)"
              value={formData.characteristics || ''}
              onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
              className="input col-span-3"
            />
            <input
              type="number"
              placeholder="예상단가 (원/kg)"
              value={formData.unit_price || ''}
              onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) || null })}
              className="input"
            />
          </div>
        );
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = [...data];
    
    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => {
        // 각 탭별로 검색 필드 지정
        switch (activeTab) {
          case 'car-models':
            return (item.model_name?.toLowerCase().includes(term) ||
                    item.model_code?.toLowerCase().includes(term) ||
                    item.manufacturer?.toLowerCase().includes(term));
          case 'materials':
            return (item.material_name?.toLowerCase().includes(term) ||
                    item.material_code?.toLowerCase().includes(term) ||
                    item.category?.toLowerCase().includes(term));
          case 'mold-types':
            return (item.type_name?.toLowerCase().includes(term) ||
                    item.type_code?.toLowerCase().includes(term));
          case 'tonnages':
            return item.tonnage_value?.toString().includes(term);
          case 'raw-materials':
            return (item.ms_spec?.toLowerCase().includes(term) ||
                    item.material_type?.toLowerCase().includes(term) ||
                    item.grade?.toLowerCase().includes(term) ||
                    item.supplier?.toLowerCase().includes(term) ||
                    item.usage?.toLowerCase().includes(term) ||
                    item.advantages?.toLowerCase().includes(term) ||
                    item.disadvantages?.toLowerCase().includes(term) ||
                    item.characteristics?.toLowerCase().includes(term));
          default:
            return true;
        }
      });
    }
    
    // 원재료 탭 추가 필터
    if (activeTab === 'raw-materials') {
      if (filterMsSpec) {
        result = result.filter(item => item.ms_spec === filterMsSpec);
      }
      if (filterSupplier) {
        result = result.filter(item => item.supplier === filterSupplier);
      }
    }
    
    return result;
  }, [data, searchTerm, filterMsSpec, filterSupplier, activeTab]);

  const renderTable = () => {
    if (loading) {
      return <div className="text-center py-8">로딩 중...</div>;
    }

    if (data.length === 0) {
      return <div className="text-center py-8 text-gray-500">데이터가 없습니다</div>;
    }

    if (filteredData.length === 0) {
      return <div className="text-center py-8 text-gray-500">검색 결과가 없습니다</div>;
    }

    switch (activeTab) {
      case 'car-models':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">차종명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">차종코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제조사</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.model_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.model_code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.manufacturer || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'materials':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">재질명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분류</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">경도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.material_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.material_code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.hardness || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'mold-types':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형타입명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.type_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.type_code || '-'}</td>
                  <td className="px-6 py-4">{item.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'tonnages':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">톤수</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">형체력(ton)</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">제조처</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">모델명</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">형개폐(mm)</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">타이바간격(mm)</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형두께(mm)</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">최대금형(mm)</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">사출용량</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">용도</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-400 text-xs">{index + 1}</td>
                  <td className="px-2 py-2 whitespace-nowrap font-bold text-blue-600">{item.tonnage_value}T</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-orange-600 font-medium">{item.clamping_force || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.manufacturer || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.model_name || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.clamping_stroke || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.tiebar_spacing_h ? `${item.tiebar_spacing_h}x${item.tiebar_spacing_v}` : '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.min_mold_thickness && item.max_mold_thickness ? `${item.min_mold_thickness}~${item.max_mold_thickness}` : '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-green-600 font-medium">{item.max_mold_width && item.max_mold_height ? `${item.max_mold_width}x${item.max_mold_height}` : '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.shot_volume ? `${item.shot_volume}cm³` : '-'}</td>
                  <td className="px-2 py-2 text-xs max-w-[100px] truncate" title={item.description || ''}>{item.description || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-2">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'raw-materials':
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">MS SPEC</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">공급업체</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">수축률</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">단가(kg)</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">용도</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">장점</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">단점</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">특징</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-400 text-xs">{index + 1}</td>
                  <td className="px-2 py-2 whitespace-nowrap font-medium text-blue-600 text-xs">{item.ms_spec}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.material_type}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.supplier || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs">{item.shrinkage_rate || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-orange-600">{item.unit_price ? `₩${item.unit_price.toLocaleString()}` : '-'}</td>
                  <td className="px-2 py-2 text-xs max-w-[100px] truncate" title={item.usage || ''}>{item.usage || '-'}</td>
                  <td className="px-2 py-2 text-xs max-w-[120px] truncate text-green-600" title={item.advantages || ''}>{item.advantages || '-'}</td>
                  <td className="px-2 py-2 text-xs max-w-[120px] truncate text-red-600" title={item.disadvantages || ''}>{item.disadvantages || '-'}</td>
                  <td className="px-2 py-2 text-xs max-w-[120px] truncate text-purple-600" title={item.characteristics || ''}>{item.characteristics || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-2">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기초정보 관리</h1>
          <p className="text-sm text-gray-600 mt-1">금형 등록 시 사용할 기초 데이터를 관리합니다</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsAdding(false);
                setEditingId(null);
                setSearchTerm('');
                setFilterSupplier('');
                setFilterMsSpec('');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {isAdding ? '새로 추가' : '수정'}
            </h2>
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save size={16} />
                저장
              </button>
              <button onClick={handleCancel} className="btn-secondary flex items-center gap-2">
                <X size={16} />
                취소
              </button>
            </div>
          </div>
          {renderForm()}
        </div>
      )}

      {/* 추가 버튼 및 검색/필터 */}
      {!isAdding && !editingId && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            새로 추가
          </button>
          
          {/* 검색 입력 */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="검색어 입력..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input flex-1"
            />
          </div>
          
          {/* 원재료 탭에서만 필터 표시 */}
          {activeTab === 'raw-materials' && (
            <>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={filterMsSpec}
                  onChange={(e) => setFilterMsSpec(e.target.value)}
                  className="input min-w-[150px]"
                >
                  <option value="">MS SPEC 전체</option>
                  {[...new Set(data.map(item => item.ms_spec))].sort().map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="">공급업체 전체</option>
                {[...new Set(data.map(item => item.supplier).filter(Boolean))].sort().map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
              {(searchTerm || filterSupplier || filterMsSpec) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSupplier('');
                    setFilterMsSpec('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  필터 초기화
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
          {renderTable()}
        </div>
      </div>
    </div>
  );
}
