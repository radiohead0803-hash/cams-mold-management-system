import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Camera, CheckCircle, XCircle, Clock, AlertCircle, FileText, Building2, User, Calendar, Package, Wrench, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { transferAPI, moldSpecificationAPI, masterDataAPI } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function TransferRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = searchParams.get('moldId');
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [moldImage, setMoldImage] = useState(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    // 기본 정보
    transfer_date: new Date().toISOString().split('T')[0],
    from_company_id: '',
    to_company_id: '',
    developer_id: '',
    reason: '',
    
    // 관리 현황
    cumulative_shots: '',
    last_cleaning_date: '',
    last_fitting_date: '',
    weight: '',
    machine_tonnage: '',
    special_notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, [moldId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 금형 정보 로드
      if (moldId) {
        const moldRes = await moldSpecificationAPI.getById(moldId);
        if (moldRes.data.success) {
          setMoldInfo(moldRes.data.data);
          // 기존 정보로 폼 초기화
          setFormData(prev => ({
            ...prev,
            from_company_id: moldRes.data.data.plant_company_id || '',
            cumulative_shots: moldRes.data.data.current_shots || ''
          }));
        }
      }
      
      // 업체 목록 로드
      const companiesRes = await fetch(`${API_URL}/companies?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const companiesData = await companiesRes.json();
      if (companiesData.success) {
        setCompanies(companiesData.data.items || []);
      }
      
      // 체크리스트 항목 로드 (마스터 템플릿에서 가져오기)
      try {
        const checklistRes = await fetch(`${API_URL}/transfers/checklist/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const checklistData = await checklistRes.json();
        if (checklistData.success && checklistData.data?.length > 0) {
          setChecklistItems(checklistData.data);
          console.log('Checklist loaded from:', checklistData.source);
        } else {
          setChecklistItems(getDefaultChecklistItems());
        }
      } catch (checklistError) {
        console.error('Failed to load checklist from API, using defaults:', checklistError);
        setChecklistItems(getDefaultChecklistItems());
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklistItems = () => [
    { id: 1, category: 'fitting', category_name: '습합', item_name: '제품 BURR', item_description: 'BURR 발생부 습합개소 확인', requires_photo: false },
    { id: 2, category: 'appearance', category_name: '외관', item_name: 'EYE BOLT 체결부', item_description: '피치 마모 및 밀착상태 확인', requires_photo: false },
    { id: 3, category: 'appearance', category_name: '외관', item_name: '상,하 고정판 확인', item_description: '이물 및 녹 오염상태 확인', requires_photo: false },
    { id: 4, category: 'appearance', category_name: '외관', item_name: '냉각상태', item_description: '냉각호스 정리 및 오염상태 확인', requires_photo: false },
    { id: 5, category: 'cavity', category_name: '캐비티', item_name: '표면 흠집,녹', item_description: '표면 흠 및 녹 발생상태 확인', requires_photo: true },
    { id: 6, category: 'cavity', category_name: '캐비티', item_name: '파팅면 오염,탄화', item_description: '파팅면 오염 및 탄화수지 확인', requires_photo: true },
    { id: 7, category: 'cavity', category_name: '캐비티', item_name: '파팅면 BURR', item_description: '파팅면 끝단 손으로 접촉 확인', requires_photo: false },
    { id: 8, category: 'core', category_name: '코어', item_name: '코어류 분해청소', item_description: '긁힘 상태확인 및 이물확인', requires_photo: true },
    { id: 9, category: 'core', category_name: '코어', item_name: '마모', item_description: '작동부 마모상태 점검', requires_photo: false },
    { id: 10, category: 'core', category_name: '코어', item_name: '작동유 윤활유', item_description: '작동유 윤활상태 확인', requires_photo: false },
    { id: 11, category: 'hydraulic', category_name: '유압장치', item_name: '작동유 누유', item_description: '유압 배관 파손 확인', requires_photo: false },
    { id: 12, category: 'hydraulic', category_name: '유압장치', item_name: '호스 및 배선정리', item_description: '호스,배선 정돈상태 확인', requires_photo: false },
    { id: 13, category: 'heater', category_name: '히터', item_name: '히터단선 누전', item_description: '히터단선,누전확인[테스터기]', requires_photo: false },
    { id: 14, category: 'heater', category_name: '히터', item_name: '수지 누출', item_description: '수지 넘침 확인', requires_photo: false }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (itemId, field, value) => {
    setChecklistResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // 이관 요청 생성
      const transferData = {
        mold_id: parseInt(moldId),
        transfer_type: 'plant_to_plant',
        from_company_id: parseInt(formData.from_company_id),
        to_company_id: parseInt(formData.to_company_id),
        developer_id: parseInt(formData.developer_id) || null,
        request_date: formData.transfer_date,
        planned_transfer_date: formData.transfer_date,
        reason: formData.reason,
        current_shots: parseInt(formData.cumulative_shots) || 0,
        mold_info_snapshot: {
          ...moldInfo,
          cumulative_shots: formData.cumulative_shots,
          last_cleaning_date: formData.last_cleaning_date,
          last_fitting_date: formData.last_fitting_date,
          weight: formData.weight,
          machine_tonnage: formData.machine_tonnage,
          special_notes: formData.special_notes
        },
        checklist_results: checklistResults
      };
      
      const response = await transferAPI.create(transferData);
      
      if (response.data.success) {
        alert('이관 요청이 등록되었습니다.');
        navigate('/transfers');
      }
    } catch (error) {
      console.error('Failed to create transfer:', error);
      alert('이관 요청 등록에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const plantCompanies = companies.filter(c => c.company_type === 'plant');
  const selectedFromCompany = companies.find(c => c.id === parseInt(formData.from_company_id));
  const selectedToCompany = companies.find(c => c.id === parseInt(formData.to_company_id));

  // 카테고리별 그룹화
  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { name: item.category_name, items: [] };
    }
    acc[item.category].items.push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* 헤더 */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          뒤로 가기
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">양산금형이관 체크리스트</h1>
            <p className="text-sm text-gray-600 mt-1">금형 인수인계 점검 및 승인 요청</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>습합 주기: A : 10,000 Shot, B : 20,000 Shot C : 30,000 Shot</p>
            <p>세척 주기: A : 10,000 Shot, B : 20,000 Shot, C : 30,000 Shot</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 금형 기본 정보 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
            <Package className="mr-2 text-blue-600" size={20} />
            금형 기본 정보
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">차종</label>
              <input type="text" value={moldInfo?.car_model || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">PART NUMBER</label>
              <input type="text" value={moldInfo?.part_number || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">PART NAME</label>
              <input type="text" value={moldInfo?.part_name || ''} readOnly className="input bg-gray-50" />
            </div>
            <div className="row-span-3 flex items-center justify-center bg-gray-100 rounded-lg">
              {moldInfo?.part_image_url ? (
                <img src={moldInfo.part_image_url} alt="부품 그림" className="max-h-32 object-contain" />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon size={48} className="mx-auto mb-2" />
                  <p className="text-sm">부품 그림</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">단산 금형 이관일</label>
              <input 
                type="date" 
                name="transfer_date"
                value={formData.transfer_date}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">작성자</label>
              <input type="text" value={user?.name || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">금형 이관 연도</label>
              <input type="text" value={new Date().getFullYear()} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">금형 제작처</label>
              <input type="text" value={moldInfo?.maker_company_name || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">금형 사이즈</label>
              <input type="text" value={moldInfo?.dimensions || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">금형 Type</label>
              <input type="text" value={moldInfo?.mold_type || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">게이트 방식</label>
              <input type="text" value={moldInfo?.gate_type || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">노즐 반경 (Ø)</label>
              <input type="text" value={moldInfo?.nozzle_radius || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">재질</label>
              <input type="text" value={moldInfo?.material || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">형체력(Ton)</label>
              <input type="text" value={moldInfo?.tonnage || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">금형 수축률</label>
              <input type="text" value={moldInfo?.shrinkage_rate || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">grade</label>
              <input type="text" value={moldInfo?.grade || ''} readOnly className="input bg-gray-50" />
            </div>
          </div>
        </div>

        {/* 관리 현황 (인계 업체) */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
            <Building2 className="mr-2 text-orange-600" size={20} />
            관리 현황 (인계 업체)
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">인계 업체 <span className="text-red-500">*</span></label>
              <select 
                name="from_company_id"
                value={formData.from_company_id}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">업체 선택</option>
                {plantCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">인계담당</label>
              <input type="text" value={user?.name || ''} readOnly className="input bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">성형조건</label>
              <select className="input">
                <option value="">파일 첨부</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">누적 SHOT 수</label>
              <input 
                type="number" 
                name="cumulative_shots"
                value={formData.cumulative_shots}
                onChange={handleChange}
                className="input"
                placeholder="152,238"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">세척등급</label>
              <select className="input">
                <option value="B">B</option>
                <option value="A">A</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">최종 세척 점검 일</label>
              <input 
                type="date" 
                name="last_cleaning_date"
                value={formData.last_cleaning_date}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">습합등급</label>
              <select className="input">
                <option value="B">B</option>
                <option value="A">A</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">최종 습합 점검 일</label>
              <input 
                type="date" 
                name="last_fitting_date"
                value={formData.last_fitting_date}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">사출기 사양</label>
              <input 
                type="text" 
                name="machine_tonnage"
                value={formData.machine_tonnage}
                onChange={handleChange}
                className="input"
                placeholder="UBE 2,200Ton"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">관리중량(g)</label>
              <input 
                type="number" 
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="input"
                placeholder="1,460"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">특이사항</label>
              <input 
                type="text" 
                name="special_notes"
                value={formData.special_notes}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* 점검 내용 (인수 업체) */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
            <Wrench className="mr-2 text-green-600" size={20} />
            점검 내용 (인수 업체)
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">인수 업체 <span className="text-red-500">*</span></label>
            <select 
              name="to_company_id"
              value={formData.to_company_id}
              onChange={handleChange}
              required
              className="input max-w-xs"
            >
              <option value="">업체 선택</option>
              {plantCompanies.filter(c => c.id !== parseInt(formData.from_company_id)).map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          {/* 금형 사진 영역 */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
              {moldImage ? (
                <img src={moldImage} alt="금형 사진" className="max-h-full object-contain" />
              ) : (
                <div className="text-center text-gray-400">
                  <Camera size={48} className="mx-auto mb-2" />
                  <p className="text-sm">금형 사진</p>
                  <p className="text-xs">(번호 표시)</p>
                </div>
              )}
            </div>
            
            {/* 체크리스트 테이블 */}
            <div className="col-span-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border px-2 py-2 text-center w-16">구분</th>
                    <th className="border px-2 py-2 text-center w-32">점검항목</th>
                    <th className="border px-2 py-2 text-center">점검내용</th>
                    <th className="border px-2 py-2 text-center w-16">결과</th>
                    <th className="border px-2 py-2 text-center w-16">사진</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedChecklist).map(([category, group], groupIdx) => (
                    group.items.map((item, itemIdx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        {itemIdx === 0 && (
                          <td 
                            className="border px-2 py-2 text-center font-medium bg-gray-50"
                            rowSpan={group.items.length}
                          >
                            {group.name}
                          </td>
                        )}
                        <td className="border px-2 py-2">{item.item_name}</td>
                        <td className="border px-2 py-2 text-gray-600">{item.item_description}</td>
                        <td className="border px-2 py-2 text-center">
                          <input 
                            type="checkbox"
                            checked={checklistResults[item.id]?.result === 'pass'}
                            onChange={(e) => handleChecklistChange(item.id, 'result', e.target.checked ? 'pass' : '')}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="border px-2 py-2 text-center">
                          {item.requires_photo && (
                            <button type="button" className="text-gray-400 hover:text-blue-600">
                              <Camera size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 승인 정보 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
            <CheckCircle className="mr-2 text-purple-600" size={20} />
            승인 정보
          </h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="inline mr-2" size={16} />
              상기 금형 인수 인계함을 증명합니다. 이관 요청 후 <strong>인계업체 → 개발담당 → 인수업체</strong> 순서로 승인이 진행됩니다.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            {/* 인계 업체 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 text-orange-700">*인계 업체명: {selectedFromCompany?.company_name || '-'}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">*인계 일자:</span>
                  <span className="ml-2">{formData.transfer_date}</span>
                </div>
                <div>
                  <span className="text-gray-600">*인계 담당자:</span>
                  <span className="ml-2">{user?.name || '-'}</span>
                </div>
              </div>
              <div className="mt-4 text-center text-gray-400 text-sm">(서명)</div>
            </div>
            
            {/* 인수 업체 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 text-green-700">*인수 업체명: {selectedToCompany?.company_name || '-'}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">*인수 일자:</span>
                  <span className="ml-2 text-gray-400">승인 후 자동 입력</span>
                </div>
                <div>
                  <span className="text-gray-600">*인수 담당자:</span>
                  <span className="ml-2 text-gray-400">승인 후 자동 입력</span>
                </div>
              </div>
              <div className="mt-4 text-center text-gray-400 text-sm">(서명)</div>
            </div>
          </div>
        </div>

        {/* 이관 사유 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">이관 사유</h2>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            className="input w-full"
            placeholder="이관 사유를 입력하세요..."
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                이관 요청
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
