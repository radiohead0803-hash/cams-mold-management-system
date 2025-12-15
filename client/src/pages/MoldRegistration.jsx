import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { moldSpecificationAPI, masterDataAPI } from '../lib/api';
import { Upload, X, Image as ImageIcon, Sparkles, ArrowLeft } from 'lucide-react';

export default function MoldRegistration() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    // 기본 정보
    primary_part_number: '', // 대표품번
    primary_part_name: '', // 대표품명
    part_number: '',
    part_name: '',
    car_model_id: '', // 차종 ID (기초정보 연동)
    car_model: '', // 차종명
    car_specification: '', // 사양 (기초정보 연동)
    car_year: '', // 년식 (기초정보 연동)
    
    // 금형 사양
    mold_type: '',
    cavity_count: 1,
    material: '',
    dimensions: '', // 치수 (LxWxH)
    weight: '', // 중량 (kg)
    
    // 원재료 정보 (기초정보 연동)
    raw_material_id: '', // 원재료 ID
    ms_spec: '', // MS 스펙
    material_type: '', // 타입
    supplier: '', // 공급업체
    grade: '', // 그레이드
    shrinkage_rate: '', // 원재료 수축율
    mold_shrinkage: '', // 금형 수축율
    
    // 제작 정보
    target_maker_id: '', // 제작처 업체
    target_plant_id: '', // 생산처 업체
    manager_name: '', // 담당자명
    
    // 개발사양 및 단계
    mold_spec_type: '시작금형', // 제작사양: 시작금형, 양산금형
    development_stage: '개발', // 진행단계: 개발, 양산
    production_stage: '시제', // 생산단계: 시제, P1, P2, M, SOP
    
    // 제작 일정
    order_date: new Date().toISOString().split('T')[0],
    target_delivery_date: '',
    drawing_review_date: '', // 도면검토회 일정
    
    // 예산
    icms_cost: '', // ICMS 비용 (원)
    vendor_quote_cost: '', // 업체 견적가 (원)
    
    // 사출 조건 (선택)
    cycle_time: '', // 사이클 타임 (초)
    injection_temp: '', // 사출 온도 (°C)
    injection_pressure: '', // 사출 압력 (bar)
    injection_speed: '', // 사출 속도 (mm/s)
    
    // 비고
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // 제작처/생산처 목록
  const [makers, setMakers] = useState([]);
  const [plants, setPlants] = useState([]);

  // 기초정보 (마스터 데이터)
  const [carModels, setCarModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [moldTypes, setMoldTypes] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);

  // 기초정보 로드
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setMasterDataLoading(true);
      console.log('Loading master data...');
      
      // 각 API 개별 호출 (하나가 실패해도 다른 것은 로드)
      let carModelsData = [];
      let materialsData = [];
      let moldTypesData = [];
      let rawMaterialsData = [];
      let companiesData = [];

      try {
        const res = await masterDataAPI.getCarModels();
        carModelsData = res.data?.data || [];
      } catch (e) {
        console.warn('차종 로드 실패:', e.message);
        // 기본 차종 데이터
        carModelsData = [
          { id: 1, model_name: 'K5' }, { id: 2, model_name: 'K8' }, { id: 3, model_name: 'K9' },
          { id: 4, model_name: 'EV6' }, { id: 5, model_name: 'EV9' }, { id: 6, model_name: 'Sorento' },
          { id: 7, model_name: 'Carnival' }, { id: 8, model_name: 'Sportage' }
        ];
      }

      try {
        const res = await masterDataAPI.getMaterials();
        materialsData = res.data?.data || [];
      } catch (e) {
        console.warn('재질 로드 실패:', e.message);
        // 기본 재질 데이터
        materialsData = [
          { id: 1, material_name: 'NAK80' }, { id: 2, material_name: 'S45C' },
          { id: 3, material_name: 'SKD11' }, { id: 4, material_name: 'SKD61' },
          { id: 5, material_name: 'P20' }, { id: 6, material_name: 'HPM38' }, { id: 7, material_name: 'STAVAX' }
        ];
      }

      try {
        const res = await masterDataAPI.getMoldTypes();
        moldTypesData = res.data?.data || [];
      } catch (e) {
        console.warn('금형타입 로드 실패:', e.message);
        // 기본 금형타입 데이터
        moldTypesData = [
          { id: 1, type_name: '사출금형' }, { id: 2, type_name: '프레스금형' },
          { id: 3, type_name: '다이캐스팅금형' }, { id: 4, type_name: '블로우금형' }, { id: 5, type_name: '압출금형' }
        ];
      }

      try {
        const res = await masterDataAPI.getRawMaterials();
        rawMaterialsData = res.data?.data || [];
      } catch (e) {
        console.warn('원재료 로드 실패:', e.message);
      }

      try {
        const res = await masterDataAPI.getCompanies();
        companiesData = res.data?.data || [];
      } catch (e) {
        console.warn('회사 로드 실패:', e.message);
        // 기본 회사 데이터
        companiesData = [
          { id: 1, company_name: '테스트 제작처', company_type: 'maker' },
          { id: 2, company_name: '테스트 생산처', company_type: 'plant' }
        ];
      }

      console.log('Master data loaded:', {
        carModels: carModelsData,
        materials: materialsData,
        moldTypes: moldTypesData,
        rawMaterials: rawMaterialsData,
        companies: companiesData
      });

      setCarModels(carModelsData);
      setMaterials(materialsData);
      setMoldTypes(moldTypesData);
      setRawMaterials(rawMaterialsData);
      
      // 회사 목록에서 제작처/생산처 분리
      setMakers(companiesData.filter(c => c.company_type === 'maker'));
      setPlants(companiesData.filter(c => c.company_type === 'plant'));
    } catch (error) {
      console.error('Failed to load master data:', error);
    } finally {
      setMasterDataLoading(false);
    }
  };

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
    
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // MS 스펙 선택 시 그레이드/수축율/금형수축율 자동 연동
  const handleMsSpecChange = (e) => {
    const selectedId = e.target.value;
    const selectedMaterial = rawMaterials.find(m => m.id.toString() === selectedId);
    
    if (selectedMaterial) {
      setFormData(prev => ({
        ...prev,
        raw_material_id: selectedId,
        ms_spec: selectedMaterial.ms_spec || '',
        material_type: selectedMaterial.material_type || prev.material_type,
        supplier: selectedMaterial.supplier || prev.supplier,
        grade: selectedMaterial.grade || '',
        shrinkage_rate: selectedMaterial.shrinkage_rate || '',
        mold_shrinkage: selectedMaterial.mold_shrinkage || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        raw_material_id: '',
        ms_spec: '',
        grade: '',
        shrinkage_rate: '',
        mold_shrinkage: ''
      }));
    }
  };

  // 타입 선택 핸들러 (원재료 타입 필터링)
  const handleMaterialTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      material_type: e.target.value
    }));
  };

  // 공급업체 선택 핸들러
  const handleSupplierChange = (e) => {
    setFormData(prev => ({
      ...prev,
      supplier: e.target.value
    }));
  };

  // 원재료 타입 목록 (중복 제거)
  const materialTypes = [...new Set(rawMaterials.map(m => m.material_type).filter(Boolean))];
  
  // 공급업체 목록 (중복 제거)
  const suppliers = [...new Set(rawMaterials.map(m => m.supplier).filter(Boolean))];

  // 차종 선택 시 년식/사양 자동 연동
  const handleCarModelChange = (e) => {
    const selectedId = e.target.value;
    const selectedModel = carModels.find(m => m.id.toString() === selectedId);
    
    if (selectedModel) {
      setFormData(prev => ({
        ...prev,
        car_model_id: selectedId,
        car_model: selectedModel.model_name,
        car_specification: selectedModel.specification || '',
        car_year: selectedModel.model_year || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        car_model_id: '',
        car_model: '',
        car_specification: '',
        car_year: ''
      }));
    }
    
    // 에러 제거
    if (errors.car_model) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.car_model;
        return newErrors;
      });
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      alert('최대 5개의 이미지만 업로드할 수 있습니다.');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // 이미지 삭제 핸들러
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // 메모리 해제
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 샘플 데이터 채우기
  const fillSampleData = () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 6);

    // 마스터 데이터에서 첫 번째 값 사용
    const firstCarModel = carModels[0]?.model_name || 'K5';
    const firstMoldType = moldTypes[0]?.type_name || '사출금형';
    const firstMaterial = materials[0]?.material_name || 'NAK80';
    const firstMaker = makers[0]?.id || '';
    const firstPlant = plants[0]?.id || '';

    // 도면검토회 일정 (발주일 + 1개월)
    const reviewDate = new Date(today);
    reviewDate.setMonth(reviewDate.getMonth() + 1);

    setFormData({
      primary_part_number: `RP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      primary_part_name: '도어 트림',
      part_number: `P-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
      part_name: '도어 트림 LH',
      car_model: firstCarModel,
      car_year: today.getFullYear().toString(),
      mold_type: firstMoldType,
      cavity_count: 2,
      material: firstMaterial,
      dimensions: '800x600x500',
      weight: '1500',
      target_maker_id: firstMaker.toString(),
      target_plant_id: firstPlant.toString(),
      manager_name: '홍길동',
      mold_spec_type: '시작금형',
      development_stage: '개발',
      production_stage: '시제',
      order_date: today.toISOString().split('T')[0],
      target_delivery_date: futureDate.toISOString().split('T')[0],
      drawing_review_date: reviewDate.toISOString().split('T')[0],
      icms_cost: '50000000',
      vendor_quote_cost: '45000000',
      cycle_time: '60',
      injection_temp: '220',
      injection_pressure: '1200',
      injection_speed: '80',
      notes: '샘플 테스트 금형 - 자동 생성된 데이터입니다.'
    });

    alert('샘플 데이터가 입력되었습니다!');
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};

    if (!formData.part_number.trim()) {
      newErrors.part_number = '품번은 필수입니다';
    }
    if (!formData.part_name.trim()) {
      newErrors.part_name = '품명은 필수입니다';
    }
    if (!formData.car_model.trim()) {
      newErrors.car_model = '차종은 필수입니다';
    }
    if (!formData.target_maker_id) {
      newErrors.target_maker_id = '목표 제작처는 필수입니다';
    }
    if (!formData.target_delivery_date) {
      newErrors.target_delivery_date = '목표 납기일은 필수입니다';
    }
    if (formData.cavity_count < 1) {
      newErrors.cavity_count = 'Cavity 수는 1 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await moldSpecificationAPI.create(formData);
      
      if (response.data.success) {
        const { mold_code, qr_token } = response.data.data.mold;
        
        // QR 코드 자동 생성 성공 메시지
        const message = `
✅ 금형이 성공적으로 등록되었습니다!

📋 금형 정보:
• 금형 코드: ${mold_code}
• QR 토큰: ${qr_token}

🔖 QR 코드가 자동으로 생성되었습니다.
제작처에서 금형 명판에 부착하여 사용할 수 있습니다.

📸 업로드된 이미지: ${images.length}개
        `.trim();
        
        alert(message);
        navigate('/molds');
      }
    } catch (error) {
      console.error('금형 등록 실패:', error);
      const errorMessage = error.response?.data?.error?.message || '금형 등록에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">금형 신규 등록</h1>
            <p className="text-sm text-gray-600 mt-1">
              금형 기본정보를 입력하면 QR 코드가 자동으로 생성됩니다
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fillSampleData}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center space-x-2"
        >
          <Sparkles size={18} />
          <span>샘플 데이터 채우기</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1행: 대표품번, 대표품명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대표품번
              </label>
              <input
                type="text"
                name="primary_part_number"
                value={formData.primary_part_number}
                onChange={handleChange}
                className="input"
                placeholder="대표품번 입력 (예: RP-2024-001)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대표품명
              </label>
              <input
                type="text"
                name="primary_part_name"
                value={formData.primary_part_name}
                onChange={handleChange}
                className="input"
                placeholder="대표품명 입력 (예: 도어 트림)"
              />
            </div>

            {/* 2행: 품번, 품명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                품번 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleChange}
                className={`input ${errors.part_number ? 'border-red-500' : ''}`}
                placeholder="P-2024-001"
              />
              {errors.part_number && (
                <p className="text-sm text-red-500 mt-1">{errors.part_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_name"
                value={formData.part_name}
                onChange={handleChange}
                className={`input ${errors.part_name ? 'border-red-500' : ''}`}
                placeholder="도어 트림 LH"
              />
              {errors.part_name && (
                <p className="text-sm text-red-500 mt-1">{errors.part_name}</p>
              )}
            </div>

          </div>

          {/* 3행: 차종, 사양, 년식 (기초정보 연동) - 3열 구성 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                차종 <span className="text-red-500">*</span>
              </label>
              <select
                name="car_model_id"
                value={formData.car_model_id}
                onChange={handleCarModelChange}
                className={`input ${errors.car_model ? 'border-red-500' : ''}`}
                disabled={masterDataLoading}
              >
                <option value="">차종 선택</option>
                {carModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.model_name} {model.model_code ? `(${model.model_code})` : ''}
                  </option>
                ))}
              </select>
              {errors.car_model && (
                <p className="text-sm text-red-500 mt-1">{errors.car_model}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">기초정보 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사양
              </label>
              <select
                name="car_specification"
                value={formData.car_specification}
                onChange={handleChange}
                className="input"
                disabled={masterDataLoading || !formData.car_model_id}
              >
                <option value="">사양 선택</option>
                {carModels
                  .filter(m => m.id.toString() === formData.car_model_id)
                  .map(m => m.specification)
                  .filter(Boolean)
                  .map((spec, idx) => (
                    <option key={idx} value={spec}>{spec}</option>
                  ))}
                {/* 기본 사양 옵션 */}
                <option value="기본">기본</option>
                <option value="프리미엄">프리미엄</option>
                <option value="시그니처">시그니처</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">차종 선택 후 사양 선택</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                년식
              </label>
              <input
                type="text"
                name="car_year"
                value={formData.car_year}
                onChange={handleChange}
                className="input bg-gray-50"
                placeholder="차종 선택 시 자동 입력"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">기초정보에서 자동 연동</p>
            </div>
          </div>
        </section>

        {/* 금형 사양 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 금형 사양</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금형 타입 <span className="text-red-500">*</span>
              </label>
              <select
                name="mold_type"
                value={formData.mold_type}
                onChange={handleChange}
                className={`input ${errors.mold_type ? 'border-red-500' : ''}`}
                disabled={masterDataLoading}
              >
                <option value="">금형 타입 선택</option>
                {moldTypes.map(type => (
                  <option key={type.id} value={type.type_name}>
                    {type.type_name}
                  </option>
                ))}
              </select>
              {errors.mold_type && (
                <p className="text-sm text-red-500 mt-1">{errors.mold_type}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">기초정보 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                재질 <span className="text-red-500">*</span>
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleChange}
                className={`input ${errors.material ? 'border-red-500' : ''}`}
                disabled={masterDataLoading}
              >
                <option value="">재질 선택</option>
                {materials.map(mat => (
                  <option key={mat.id} value={mat.material_name}>
                    {mat.material_name}
                  </option>
                ))}
              </select>
              {errors.material && (
                <p className="text-sm text-red-500 mt-1">{errors.material}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">기초정보 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cavity 수 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cavity_count"
                value={formData.cavity_count}
                onChange={handleChange}
                className={`input ${errors.cavity_count ? 'border-red-500' : ''}`}
                min="1"
              />
              {errors.cavity_count && (
                <p className="text-sm text-red-500 mt-1">{errors.cavity_count}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                치수 (LxWxH)
              </label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                className="input"
                placeholder="800x600x500 (mm)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                중량 (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="input"
                placeholder="1500"
              />
            </div>
          </div>
        </section>

        {/* 원재료 정보 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 원재료 정보</h2>
          {/* 1행: MS 스펙, 타입, 공급업체 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MS 스펙
              </label>
              <select
                name="raw_material_id"
                value={formData.raw_material_id}
                onChange={handleMsSpecChange}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">MS 스펙 선택</option>
                {rawMaterials.map(mat => (
                  <option key={mat.id} value={mat.id}>
                    {mat.ms_spec}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">기초정보 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타입
              </label>
              <select
                name="material_type"
                value={formData.material_type}
                onChange={handleMaterialTypeChange}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">타입 선택</option>
                {materialTypes.map((type, idx) => (
                  <option key={idx} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">기초정보 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                공급업체
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleSupplierChange}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">공급업체 선택</option>
                {suppliers.map((sup, idx) => (
                  <option key={idx} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">기초정보 연동</p>
            </div>
          </div>

          {/* 2행: 그레이드, 원재료 수축율, 금형 수축율 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                그레이드
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                className="input bg-gray-50"
                placeholder="MS 스펙 선택 시 자동 입력"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">자동 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                원재료 수축율
              </label>
              <input
                type="text"
                name="shrinkage_rate"
                value={formData.shrinkage_rate}
                className="input bg-gray-50"
                placeholder="MS 스펙 선택 시 자동 입력"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">자동 연동</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금형 수축율
              </label>
              <input
                type="text"
                name="mold_shrinkage"
                value={formData.mold_shrinkage || ''}
                className="input bg-gray-50"
                placeholder="MS 스펙 선택 시 자동 입력"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">자동 연동</p>
            </div>
          </div>
        </section>

        {/* 제작 정보 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏭 제작 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                목표 제작처 <span className="text-red-500">*</span>
              </label>
              <select
                name="target_maker_id"
                value={formData.target_maker_id}
                onChange={handleChange}
                className={`input ${errors.target_maker_id ? 'border-red-500' : ''}`}
              >
                <option value="">제작처 선택</option>
                {makers.map(maker => (
                  <option key={maker.id} value={maker.id}>
                    {maker.company_name}
                  </option>
                ))}
              </select>
              {errors.target_maker_id && (
                <p className="text-sm text-red-500 mt-1">{errors.target_maker_id}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">💡 금형을 제작할 업체를 선택하세요 (총 {makers.length}개)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                목표 생산처
              </label>
              <select
                name="target_plant_id"
                value={formData.target_plant_id}
                onChange={handleChange}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">-- 생산처를 선택하세요 --</option>
                {plants.map(plant => (
                  <option key={plant.id} value={plant.id}>
                    {plant.company_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">💡 양산을 진행할 업체를 선택하세요 (총 {plants.length}개)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자명
              </label>
              <input
                type="text"
                name="manager_name"
                value={formData.manager_name}
                onChange={handleChange}
                className="input"
                placeholder="홍길동"
              />
            </div>
          </div>
        </section>

        {/* 개발사양 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 개발사양</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                진행단계 <span className="text-red-500">*</span>
              </label>
              <select
                name="development_stage"
                value={formData.development_stage}
                onChange={handleChange}
                className="input"
              >
                <option value="개발">개발</option>
                <option value="양산">양산</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">현재 금형의 진행 단계</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제작사양 <span className="text-red-500">*</span>
              </label>
              <select
                name="mold_spec_type"
                value={formData.mold_spec_type}
                onChange={handleChange}
                className="input"
              >
                <option value="시작금형">시작금형</option>
                <option value="양산금형">양산금형</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">시작금형: 개발/시제용, 양산금형: 양산용</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                생산단계
              </label>
              <select
                name="production_stage"
                value={formData.production_stage}
                onChange={handleChange}
                className="input"
              >
                <option value="시제">시제</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="M">M</option>
                <option value="SOP">SOP</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">현재 생산 단계 (T/O 단계)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발주일
              </label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                목표 납기일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="target_delivery_date"
                value={formData.target_delivery_date}
                onChange={handleChange}
                className={`input ${errors.target_delivery_date ? 'border-red-500' : ''}`}
              />
              {errors.target_delivery_date && (
                <p className="text-sm text-red-500 mt-1">{errors.target_delivery_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                도면검토회 일정
              </label>
              <input
                type="date"
                name="drawing_review_date"
                value={formData.drawing_review_date}
                onChange={handleChange}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">제작전 체크리스트 알림 기준일</p>
            </div>
          </div>
        </section>

        {/* 일정 및 예산 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 일정 및 예산</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ICMS 비용 (원)
              </label>
              <input
                type="number"
                name="icms_cost"
                value={formData.icms_cost}
                onChange={handleChange}
                className="input"
                placeholder="50000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업체 견적가 (원)
              </label>
              <input
                type="number"
                name="vendor_quote_cost"
                value={formData.vendor_quote_cost}
                onChange={handleChange}
                className="input"
                placeholder="45000000"
              />
            </div>
          </div>
        </section>

        {/* 사출 조건 (선택) */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 사출 조건 (선택)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사이클 타임 (초)
              </label>
              <input
                type="number"
                name="cycle_time"
                value={formData.cycle_time}
                onChange={handleChange}
                className="input"
                placeholder="60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사출 온도 (°C)
              </label>
              <input
                type="number"
                name="injection_temp"
                value={formData.injection_temp}
                onChange={handleChange}
                className="input"
                placeholder="220"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사출 압력 (bar)
              </label>
              <input
                type="number"
                name="injection_pressure"
                value={formData.injection_pressure}
                onChange={handleChange}
                className="input"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사출 속도 (mm/s)
              </label>
              <input
                type="number"
                name="injection_speed"
                value={formData.injection_speed}
                onChange={handleChange}
                className="input"
                placeholder="80"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 사출 조건은 선택 사항입니다. 제작 완료 후 입력할 수 있습니다.</p>
        </section>

        {/* 비고 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 비고</h2>
          <div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows="4"
              placeholder="추가 정보나 특이사항을 입력하세요"
            />
          </div>
        </section>

        {/* 이미지 업로드 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📷 금형 이미지</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 업로드 (최대 5개)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (최대 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            {/* 이미지 미리보기 */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs text-center py-1 rounded">
                      {images[index].name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔖</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">QR 코드 자동 생성 시스템</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  금형 등록 시 <strong>고유한 QR 코드가 자동으로 생성</strong>됩니다.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>금형 코드: M-YYYY-XXX 형식으로 자동 생성</li>
                  <li>QR 토큰: CAMS-XXXXXXXX-XXXX 형식의 고유 식별자</li>
                  <li>제작처에서 금형 명판에 QR 코드 부착</li>
                  <li>생산처에서 QR 스캔으로 금형 정보 즉시 조회</li>
                </ul>
                <p className="mt-2 text-xs">
                  💡 <strong>Tip:</strong> 우측 상단 "샘플 데이터 채우기" 버튼으로 테스트 데이터를 빠르게 입력할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/molds')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? '등록 중...' : '금형 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
