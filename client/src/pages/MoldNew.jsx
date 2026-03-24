import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Factory, Building2, Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api, { masterDataAPI } from '../lib/api';

export default function MoldNew() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [partImage, setPartImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    primary_part_number: '',
    primary_part_name: '',
    part_number: '',
    part_name: '',
    car_model: '',
    car_model_id: '',
    project_name: '',
    car_model_code: '',
    car_specification: '',
    car_year: '',
    mold_type: '',
    material: '',
    maker_company_id: '',
    plant_company_id: '',
    development_stage: '개발',
    production_stage: '시작금형',
    mold_spec_type: '시작금형',
    order_date: new Date().toISOString().split('T')[0],
    target_delivery_date: '',
    icms_cost: '',
    vendor_quote_cost: '',
    notes: '',
    part_images: [],
    // 원재료 사양
    raw_material_id: '',
    ms_spec: '',
    material_type: '',
    supplier: '',
    grade: '',
    shrinkage_rate: '',
    mold_shrinkage: ''
  });

  // 기초정보 (마스터 데이터)
  const [carModels, setCarModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [moldTypes, setMoldTypes] = useState([]);
  const [tonnages, setTonnages] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
    loadMasterData();
  }, []);

  // 기본 마스터 데이터 (API 실패 시 사용)
  const defaultMoldTypes = [
    { id: 1, name: '사출금형' },
    { id: 2, name: '프레스금형' },
    { id: 3, name: '다이캐스팅' },
    { id: 4, name: '기타' }
  ];
  const defaultMaterials = [
    { id: 1, name: 'NAK80' },
    { id: 2, name: 'SKD61' },
    { id: 3, name: 'S45C' },
    { id: 4, name: 'P20' }
  ];
  const defaultTonnages = [
    { id: 1, value: 150 },
    { id: 2, value: 250 },
    { id: 3, value: 350 },
    { id: 4, value: 450 },
    { id: 5, value: 650 },
    { id: 6, value: 850 },
    { id: 7, value: 1300 }
  ];

  const loadMasterData = async () => {
    try {
      setMasterDataLoading(true);
      const [carModelsRes, materialsRes, moldTypesRes, tonnagesRes, rawMaterialsRes] = await Promise.all([
        masterDataAPI.getCarModels(),
        masterDataAPI.getMaterials(),
        masterDataAPI.getMoldTypes(),
        masterDataAPI.getTonnages(),
        masterDataAPI.getRawMaterials({ is_active: true }).catch(() => ({ data: { data: [] } }))
      ]);
      
      // 백엔드 응답 필드명을 프론트엔드 형식으로 변환 (프로젝트명, 코드, 연식, 사양 포함)
      const carModelsData = (carModelsRes.data.data || []).map(item => ({
        id: item.id,
        name: item.model_name || item.name,
        project_name: item.project_name || '',
        code: item.model_code || item.code || '',
        year: item.model_year || item.year || '',
        specification: item.specification || item.car_specification || '',
        specifications: item.specifications || [] // 해당 차종의 사양 목록
      }));
      const materialsData = (materialsRes.data.data || []).map(item => ({
        id: item.id,
        name: item.material_name || item.name
      }));
      const moldTypesData = (moldTypesRes.data.data || []).map(item => ({
        id: item.id,
        name: item.type_name || item.name
      }));
      const tonnagesData = (tonnagesRes.data.data || []).map(item => ({
        id: item.id,
        name: item.value ? `${item.value}T` : item.name,
        value: item.value
      }));
      const rawMaterialsData = (rawMaterialsRes.data.data || []).map(item => ({
        id: item.id,
        ms_spec: item.ms_spec || item.material_name || '',
        material_type: item.material_type || '',
        grade: item.grade || item.material_grade || '',
        supplier: item.supplier || '',
        shrinkage_rate: item.shrinkage_rate || ''
      }));
      
      setCarModels(carModelsData.length > 0 ? carModelsData : []);
      setMaterials(materialsData.length > 0 ? materialsData : defaultMaterials);
      setMoldTypes(moldTypesData.length > 0 ? moldTypesData : defaultMoldTypes);
      setTonnages(tonnagesData.length > 0 ? tonnagesData : defaultTonnages);
      setRawMaterials(rawMaterialsData);
    } catch (error) {
      console.error('Failed to load master data:', error);
      // API 실패 시 기본값 사용
      setMoldTypes(defaultMoldTypes);
      setMaterials(defaultMaterials);
      setTonnages(defaultTonnages);
    } finally {
      setMasterDataLoading(false);
    }
  };

  // 차종 선택 시 - 프로젝트명/사양 초기화 (선택 필요)
  const handleCarModelChange = (e) => {
    const selectedId = e.target.value;
    const selectedModel = carModels.find(m => m.id === parseInt(selectedId) || m.name === selectedId);
    setFormData(prev => ({
      ...prev,
      car_model: selectedModel?.name || selectedId,
      car_model_id: selectedModel?.id || '',
      project_name: '',
      car_model_code: '',
      car_specification: '',
      car_year: ''
    }));
  };

  // 프로젝트명 선택 시 - 코드 자동, 사양 초기화
  const handleProjectNameChange = (e) => {
    const selectedProjectName = e.target.value;
    const matchedModel = carModels.find(m => 
      m.name === formData.car_model && m.project_name === selectedProjectName
    );
    setFormData(prev => ({
      ...prev,
      project_name: selectedProjectName,
      car_model_code: matchedModel?.code || '',
      car_specification: '',
      car_year: ''
    }));
  };

  // 사양 선택 시 - 연식 자동
  const handleSpecificationChange = (e) => {
    const selectedSpec = e.target.value;
    const matchedModel = carModels.find(m => 
      m.name === formData.car_model && 
      m.project_name === formData.project_name &&
      m.specification === selectedSpec
    );
    setFormData(prev => ({
      ...prev,
      car_specification: selectedSpec,
      car_year: matchedModel?.year || ''
    }));
  };

  // 선택된 차종의 프로젝트명 목록 가져오기
  const getProjectNamesForModel = () => {
    if (!formData.car_model) return [];
    const projectNames = carModels
      .filter(m => m.name === formData.car_model && m.project_name)
      .map(m => m.project_name);
    return [...new Set(projectNames)];
  };

  // 선택된 차종+프로젝트명의 사양 목록 가져오기
  const getSpecificationsForModelAndProject = () => {
    if (!formData.car_model) return [];
    let filtered = carModels.filter(m => m.name === formData.car_model);
    if (formData.project_name) {
      filtered = filtered.filter(m => m.project_name === formData.project_name);
    }
    const specs = filtered.filter(m => m.specification).map(m => m.specification);
    return [...new Set(specs)];
  };

  // MS SPEC 선택 시 - 타입, 공급업체, 그레이드 초기화
  const handleMsSpecSelect = (spec) => {
    setFormData(prev => ({
      ...prev,
      ms_spec: spec,
      material_type: '',
      supplier: '',
      grade: '',
      shrinkage_rate: '',
      raw_material_id: ''
    }));
  };

  // 타입 선택 시 - 공급업체, 그레이드 초기화 (연쇄 필터링)
  const handleMaterialTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      material_type: type,
      supplier: '',
      grade: '',
      shrinkage_rate: '',
      raw_material_id: ''
    }));
  };

  // 공급업체 선택 시 - 그레이드 초기화 (연쇄 필터링)
  const handleSupplierSelect = (supplierValue) => {
    setFormData(prev => ({
      ...prev,
      supplier: supplierValue,
      grade: '',
      shrinkage_rate: '',
      raw_material_id: ''
    }));
  };

  // 그레이드 선택 시 - 수축률 자동 설정
  const handleGradeSelect = (gradeValue) => {
    const matched = rawMaterials.find(m => 
      m.ms_spec === formData.ms_spec && 
      (!formData.material_type || m.material_type === formData.material_type) &&
      (!formData.supplier || m.supplier === formData.supplier) &&
      m.grade === gradeValue
    );
    setFormData(prev => ({
      ...prev,
      grade: gradeValue,
      raw_material_id: matched?.id || '',
      shrinkage_rate: matched?.shrinkage_rate || ''
    }));
  };

  // 필터링 함수들 - 선택 순서에 따른 연쇄 필터링
  // MS SPEC 선택 후 → 타입 필터링
  const getFilteredTypes = () => {
    if (!formData.ms_spec) return [];
    const types = rawMaterials
      .filter(m => m.ms_spec === formData.ms_spec && m.material_type)
      .map(m => m.material_type);
    return [...new Set(types)];
  };

  // MS SPEC + 타입 선택 후 → 공급업체 필터링
  const getFilteredSuppliers = () => {
    if (!formData.ms_spec) return [];
    let filtered = rawMaterials.filter(m => m.ms_spec === formData.ms_spec);
    // 타입이 선택되었으면 타입으로도 필터링
    if (formData.material_type) {
      filtered = filtered.filter(m => m.material_type === formData.material_type);
    }
    const suppliers = filtered.filter(m => m.supplier).map(m => m.supplier);
    return [...new Set(suppliers)];
  };

  // MS SPEC + 타입 + 공급업체 선택 후 → GRADE 필터링
  const getFilteredGrades = () => {
    if (!formData.ms_spec) return [];
    let filtered = rawMaterials.filter(m => m.ms_spec === formData.ms_spec);
    // 타입이 선택되었으면 타입으로도 필터링
    if (formData.material_type) {
      filtered = filtered.filter(m => m.material_type === formData.material_type);
    }
    // 공급업체가 선택되었으면 공급업체로도 필터링
    if (formData.supplier) {
      filtered = filtered.filter(m => m.supplier === formData.supplier);
    }
    const grades = filtered.filter(m => m.grade).map(m => m.grade);
    return [...new Set(grades)];
  };

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      
      if (!token) {
        console.error('토큰이 없습니다');
        setError('로그인이 필요합니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const response = await api.get('/companies', { params: { limit: 100 } });

      if (response.data.success) {
        setCompanies(response.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError('업체 목록을 불러오는데 실패했습니다: ' + err.message);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 기존 이미지 메모리 해제
    if (partImage?.preview) {
      URL.revokeObjectURL(partImage.preview);
    }

    // 새 이미지 설정
    setPartImage({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    });
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          // 기존 이미지 메모리 해제
          if (partImage?.preview) {
            URL.revokeObjectURL(partImage.preview);
          }

          // 붙여넣기한 이미지 설정
          const fileName = `pasted-image-${Date.now()}.png`;
          const file = new File([blob], fileName, { type: blob.type });
          
          setPartImage({
            file,
            preview: URL.createObjectURL(file),
            name: fileName,
            size: file.size
          });
        }
        break;
      }
    }
  };

  const removeImage = () => {
    if (partImage?.preview) {
      URL.revokeObjectURL(partImage.preview);
    }
    setPartImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 임시저장 핸들러
  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!token) {
        setError('로그인이 필요합니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const submitData = {
        ...formData,
        status: '임시저장',
        cavity_count: parseInt(formData.cavity_count) || 1,
        tonnage: formData.tonnage ? parseInt(formData.tonnage) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        maker_company_id: formData.maker_company_id ? parseInt(formData.maker_company_id) : null,
        plant_company_id: formData.plant_company_id ? parseInt(formData.plant_company_id) : null,
        target_delivery_date: formData.target_delivery_date || null,
        order_date: formData.order_date || null
      };

      const response = await api.post('/mold-specifications', submitData);

      if (response.data.success) {
        if (partImage) {
          await uploadPartImage(response.data.data.specification.id);
        }

        setSuccess({
          message: '임시저장되었습니다. 나중에 수정하여 등록할 수 있습니다.',
          moldCode: response.data.data.mold?.mold_code,
          qrToken: response.data.data.mold?.qr_token
        });

        setTimeout(() => {
          navigate('/molds');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError(err.response?.data?.error?.message || err.message || '임시저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!token) {
        setError('로그인이 필요합니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // 숫자 필드 변환
      const submitData = {
        ...formData,
        status: '등록',
        cavity_count: parseInt(formData.cavity_count) || 1,
        tonnage: formData.tonnage ? parseInt(formData.tonnage) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        maker_company_id: formData.maker_company_id ? parseInt(formData.maker_company_id) : null,
        plant_company_id: formData.plant_company_id ? parseInt(formData.plant_company_id) : null,
        target_delivery_date: formData.target_delivery_date || null,
        order_date: formData.order_date || null
      };

      const response = await api.post('/mold-specifications', submitData);

      if (response.data.success) {
        const specificationId = response.data.data.specification.id;

        // 부품 사진 업로드 (있는 경우)
        if (partImage) {
          await uploadPartImage(specificationId);
        }

        setSuccess({
          message: '금형 정보가 성공적으로 등록되었습니다!',
          moldCode: response.data.data.mold.mold_code,
          qrToken: response.data.data.mold.qr_token
        });

        // 3초 후 목록으로 이동
        setTimeout(() => {
          navigate('/molds');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to create mold:', err);
      const errorMsg = err.response?.data?.error?.details
        ? `${err.response.data.error.message}: ${err.response.data.error.details}`
        : err.response?.data?.error?.message || err.message || '금형 등록에 실패했습니다.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const uploadPartImage = async (specificationId) => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', partImage.file);

      const response = await api.post(`/mold-specifications/${specificationId}/part-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('부품 사진 업로드 성공:', response.data);
    } catch (err) {
      console.error('Failed to upload part image:', err);
      // 에러가 발생해도 금형 등록은 성공했으므로 계속 진행
    } finally {
      setUploadingImage(false);
    }
  };

  const makerCompanies = companies.filter(c => c.company_type === 'maker');
  const plantCompanies = companies.filter(c => c.company_type === 'plant');
  
  // 선택된 업체 정보 가져오기
  const selectedMaker = companies.find(c => c.id === parseInt(formData.maker_company_id));
  const selectedPlant = companies.find(c => c.id === parseInt(formData.plant_company_id));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          뒤로 가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">금형 신규 등록</h1>
        <p className="text-sm text-gray-600 mt-1">
          금형 기본 정보를 입력하면 QR 코드가 자동으로 생성됩니다
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="text-green-600 mr-3 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-green-900 font-semibold">{success.message}</h3>
              <p className="text-green-700 text-sm mt-1">
                금형 코드: <span className="font-mono font-bold">{success.moldCode}</span>
              </p>
              <p className="text-green-700 text-sm">
                QR 코드: <span className="font-mono font-bold">{success.qrToken}</span>
              </p>
              <p className="text-green-600 text-xs mt-2">잠시 후 목록으로 이동합니다...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="text-red-600 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-900 font-semibold">등록 실패</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        {/* 기본 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            기본 정보
          </h2>
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="대표품번 입력"
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
                placeholder="대표품명 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                품번 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_number"
                value={formData.part_number}
                onChange={handleChange}
                required
                className="input"
                placeholder="P-2024-001"
              />
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
                required
                className="input"
                placeholder="범퍼 커버 LH"
              />
            </div>
          </div>
          {/* 차종, 프로젝트명(선택), 코드(자동), 사양(선택), 연식(자동) - 1열 5항목 */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                차종 <span className="text-red-500">*</span>
              </label>
              <select
                name="car_model"
                value={formData.car_model}
                onChange={handleCarModelChange}
                required
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">{masterDataLoading ? '로딩 중...' : '차종 선택'}</option>
                {[...new Set(carModels.map(item => item.name))].map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트명 <span className="text-xs text-blue-500">(선택)</span>
              </label>
              <select
                name="project_name"
                value={formData.project_name || ''}
                onChange={handleProjectNameChange}
                className="input"
                disabled={masterDataLoading || !formData.car_model}
              >
                <option value="">{!formData.car_model ? '차종 먼저 선택' : '프로젝트명 선택'}</option>
                {getProjectNamesForModel().map((pn, idx) => (
                  <option key={idx} value={pn}>{pn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                코드 <span className="text-xs text-blue-500">(자동)</span>
              </label>
              <input
                type="text"
                name="car_model_code"
                value={formData.car_model_code || ''}
                className="input bg-gray-50"
                placeholder="프로젝트명 선택 시 자동"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사양 <span className="text-xs text-blue-500">(선택)</span>
              </label>
              <select
                name="car_specification"
                value={formData.car_specification || ''}
                onChange={handleSpecificationChange}
                className="input"
                disabled={masterDataLoading || !formData.project_name}
              >
                <option value="">{!formData.project_name ? '프로젝트명 먼저 선택' : '사양 선택'}</option>
                {getSpecificationsForModelAndProject().map((spec, idx) => (
                  <option key={idx} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연식 <span className="text-xs text-blue-500">(자동)</span>
              </label>
              <input
                type="text"
                name="car_year"
                value={formData.car_year}
                className="input bg-gray-50"
                placeholder="사양 선택 시 자동"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 금형 사양 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            금형 사양 <span className="text-xs text-blue-500 font-normal">(기초정보 연동)</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금형 타입
              </label>
              <select
                name="mold_type"
                value={formData.mold_type}
                onChange={handleChange}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">{masterDataLoading ? '로딩 중...' : '금형 타입 선택'}</option>
                {moldTypes.map(item => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금형 재질
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">{masterDataLoading ? '로딩 중...' : '금형 재질 선택'}</option>
                {materials.map(item => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 원재료 사양 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            원재료 사양 <span className="text-xs text-blue-500 font-normal">(기초정보 연동)</span>
          </h2>
          {/* 선택 필드: MS SPEC → 타입 → 공급업체 → 그레이드 */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MS SPEC <span className="text-xs text-blue-500">(선택)</span>
              </label>
              <select
                name="ms_spec"
                value={formData.ms_spec}
                onChange={(e) => handleMsSpecSelect(e.target.value)}
                className="input"
                disabled={masterDataLoading}
              >
                <option value="">{masterDataLoading ? '로딩 중...' : 'MS SPEC 선택'}</option>
                {[...new Set(rawMaterials.map(item => item.ms_spec).filter(Boolean))].map((spec, idx) => (
                  <option key={idx} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                타입 <span className="text-xs text-blue-500">(선택)</span>
              </label>
              <select
                name="material_type"
                value={formData.material_type}
                onChange={(e) => handleMaterialTypeSelect(e.target.value)}
                className="input"
                disabled={masterDataLoading || !formData.ms_spec}
              >
                <option value="">타입 선택</option>
                {getFilteredTypes().map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                공급업체 <span className="text-xs text-blue-500">(선택)</span>
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="input"
                disabled={masterDataLoading || !formData.ms_spec}
              >
                <option value="">공급업체 선택</option>
                {getFilteredSuppliers().map((supplier, idx) => (
                  <option key={idx} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GRADE <span className="text-xs text-blue-500">(선택)</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={(e) => handleGradeSelect(e.target.value)}
                className="input"
                disabled={masterDataLoading || !formData.ms_spec}
              >
                <option value="">GRADE 선택</option>
                {getFilteredGrades().map((grade, idx) => (
                  <option key={idx} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>
          {/* 자동 연동 필드 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수축률 (%) <span className="text-xs text-blue-500">(자동)</span>
              </label>
              <input
                type="text"
                name="shrinkage_rate"
                value={formData.shrinkage_rate}
                onChange={handleChange}
                className="input bg-gray-50"
                placeholder="자동 입력"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금형 수축률 (%)
              </label>
              <input
                type="text"
                name="mold_shrinkage"
                value={formData.mold_shrinkage}
                onChange={handleChange}
                className="input"
                placeholder="금형 수축률 입력"
              />
            </div>
          </div>
        </div>

        {/* 제작처 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
            <Factory className="text-blue-600 mr-2" size={20} />
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2">제작처</span>
            금형 제작 업체 선택
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제작처 업체 <span className="text-red-500">*</span>
              </label>
              <select
                name="maker_company_id"
                value={formData.maker_company_id}
                onChange={handleChange}
                className="input"
                required
                disabled={loadingCompanies}
              >
                <option value="">
                  {loadingCompanies ? '업체 목록 로딩 중...' : '-- 제작처를 선택하세요 --'}
                </option>
                {!loadingCompanies && makerCompanies.length === 0 ? (
                  <option disabled>등록된 제작처가 없습니다</option>
                ) : (
                  makerCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      [{company.company_code}] {company.company_name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 금형을 제작할 업체를 선택하세요 (총 {makerCompanies.length}개)
              </p>
            </div>
            
            {/* 선택된 제작처 정보 표시 */}
            {selectedMaker && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">선택된 제작처 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">업체명:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedMaker.company_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">업체코드:</span>
                    <span className="ml-2 font-mono font-medium text-gray-900">{selectedMaker.company_code}</span>
                  </div>
                  {selectedMaker.manager_name && (
                    <div>
                      <span className="text-gray-600">담당자:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedMaker.manager_name}</span>
                    </div>
                  )}
                  {selectedMaker.manager_phone && (
                    <div>
                      <span className="text-gray-600">연락처:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedMaker.manager_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 생산처 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
            <Building2 className="text-green-600 mr-2" size={20} />
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mr-2">생산처</span>
            양산 생산 업체 선택
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생산처 업체 <span className="text-red-500">*</span>
              </label>
              <select
                name="plant_company_id"
                value={formData.plant_company_id}
                onChange={handleChange}
                className="input"
                required
                disabled={loadingCompanies}
              >
                <option value="">
                  {loadingCompanies ? '업체 목록 로딩 중...' : '-- 생산처를 선택하세요 --'}
                </option>
                {!loadingCompanies && plantCompanies.length === 0 ? (
                  <option disabled>등록된 생산처가 없습니다</option>
                ) : (
                  plantCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      [{company.company_code}] {company.company_name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 양산을 진행할 업체를 선택하세요 (총 {plantCompanies.length}개)
              </p>
            </div>
            
            {/* 선택된 생산처 정보 표시 */}
            {selectedPlant && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">선택된 생산처 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">업체명:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedPlant.company_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">업체코드:</span>
                    <span className="ml-2 font-mono font-medium text-gray-900">{selectedPlant.company_code}</span>
                  </div>
                  {selectedPlant.manager_name && (
                    <div>
                      <span className="text-gray-600">담당자:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedPlant.manager_name}</span>
                    </div>
                  )}
                  {selectedPlant.manager_phone && (
                    <div>
                      <span className="text-gray-600">연락처:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedPlant.manager_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 제작사양 및 진행단계 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            제작사양 및 진행단계
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제작사양
              </label>
              <select
                name="production_stage"
                value={formData.production_stage}
                onChange={handleChange}
                className="input"
              >
                <option value="시작금형">시작금형</option>
                <option value="양산금형">양산금형</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                진행단계
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
              <p className="text-xs text-gray-500 mt-1">💡 양산이관 승인 시 자동으로 '양산'으로 변경됩니다</p>
            </div>
          </div>
        </div>

        {/* 일정 및 예산 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            일정 및 예산
          </h2>
          <div className="grid grid-cols-2 gap-4">
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
                목표 납기일
              </label>
              <input
                type="date"
                name="target_delivery_date"
                value={formData.target_delivery_date}
                onChange={handleChange}
                className="input"
              />
            </div>
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
        </div>

        {/* 부품 사진 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
            <ImageIcon className="text-purple-600 mr-2" size={20} />
            부품 사진 업로드 (선택사항)
          </h2>
          
          <div className="space-y-4">
            {/* 파일 선택 버튼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사진 선택
              </label>
              <div className="flex items-center gap-3">
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload size={18} />
                  사진 선택
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500">
                  💡 최대 10개까지 업로드 가능 (JPG, PNG, GIF)
                </p>
              </div>
            </div>

            {/* 이미지 미리보기 또는 붙여넣기 영역 */}
            {partImage ? (
              <div className="relative">
                <div className="aspect-video max-w-md rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <img
                    src={partImage.preview}
                    alt={partImage.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X size={20} />
                </button>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="font-medium truncate">{partImage.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(partImage.size)}</div>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                onPaste={handlePaste}
                tabIndex={0}
              >
                <ImageIcon className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  부품 사진을 업로드하면 금형 정보와 함께 저장됩니다
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  사진은 선택사항이며, 나중에 추가할 수 있습니다
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                  <span className="font-mono font-semibold">Ctrl + V</span>
                  <span>로 캐프처 이미지 붙여넣기 가능</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 비고 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비고
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="input"
            placeholder="추가 정보를 입력하세요..."
          />
        </div>

        {/* 등록 정보 요약 */}
        {(selectedMaker || selectedPlant) && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 등록 정보 요약</h3>
            <div className="space-y-2 text-sm">
              {formData.part_number && (
                <div className="flex">
                  <span className="text-gray-600 w-32">부품번호:</span>
                  <span className="font-medium text-gray-900">{formData.part_number}</span>
                </div>
              )}
              {formData.part_name && (
                <div className="flex">
                  <span className="text-gray-600 w-32">부품명:</span>
                  <span className="font-medium text-gray-900">{formData.part_name}</span>
                </div>
              )}
              {formData.car_model && (
                <div className="flex">
                  <span className="text-gray-600 w-32">차종:</span>
                  <span className="font-medium text-gray-900">{formData.car_model}</span>
                </div>
              )}
              {selectedMaker && (
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">제작처:</span>
                  <span className="font-medium text-blue-700 flex items-center">
                    <Factory size={14} className="mr-1" />
                    {selectedMaker.company_name}
                  </span>
                </div>
              )}
              {selectedPlant && (
                <div className="flex items-center">
                  <span className="text-gray-600 w-32">생산처:</span>
                  <span className="font-medium text-green-700 flex items-center">
                    <Building2 size={14} className="mr-1" />
                    {selectedPlant.company_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center transition-colors"
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <FileText size={18} className="mr-2" />
                임시저장
              </>
            )}
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={loading || uploadingImage}
          >
            {loading || uploadingImage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {uploadingImage ? '사진 업로드 중...' : '등록 중...'}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                등록
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
