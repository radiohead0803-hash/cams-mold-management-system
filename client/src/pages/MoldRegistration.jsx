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
    part_number: '',
    representative_part_number: '', // 대표품번 추가
    part_name: '',
    car_model: '',
    car_year: new Date().getFullYear().toString(),
    
    // 금형 사양
    mold_type: '',
    cavity_count: 1,
    material: '',
    tonnage: '',
    
    // 제작 정보
    target_maker_id: '3', // 기본값으로 maker1 설정
    
    // 개발사양 및 단계
    mold_spec_type: '시작금형', // 개발사양: 시작금형, 양산금형
    development_stage: '개발', // 단계: 개발, 양산
    
    // 제작 일정
    order_date: new Date().toISOString().split('T')[0],
    target_delivery_date: '',
    
    // 예산
    estimated_cost: '',
    
    // 비고
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // 제작처 목록 (추후 API에서 가져오기)
  const [makers] = useState([
    { id: 3, name: 'A제작소', company_name: 'A제작소' },
    { id: 5, name: 'B제작소', company_name: 'B제작소' }
  ]);

  // 기초정보 (마스터 데이터)
  const [carModels, setCarModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [moldTypes, setMoldTypes] = useState([]);
  const [tonnages, setTonnages] = useState([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);

  // 기초정보 로드
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setMasterDataLoading(true);
      console.log('Loading master data...');
      const [carModelsRes, materialsRes, moldTypesRes, tonnagesRes] = await Promise.all([
        masterDataAPI.getCarModels(),
        masterDataAPI.getMaterials(),
        masterDataAPI.getMoldTypes(),
        masterDataAPI.getTonnages()
      ]);

      console.log('Master data loaded:', {
        carModels: carModelsRes.data.data,
        materials: materialsRes.data.data,
        moldTypes: moldTypesRes.data.data,
        tonnages: tonnagesRes.data.data
      });

      setCarModels(carModelsRes.data.data || []);
      setMaterials(materialsRes.data.data || []);
      setMoldTypes(moldTypesRes.data.data || []);
      setTonnages(tonnagesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load master data:', error);
      alert('기초정보 로드 실패: ' + error.message);
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
    const firstTonnage = tonnages[0]?.tonnage_value || 350;

    setFormData({
      part_number: `P-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
      representative_part_number: `RP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      part_name: '도어 트림 LH',
      car_model: firstCarModel,
      car_year: today.getFullYear().toString(),
      mold_type: firstMoldType,
      cavity_count: 2,
      material: firstMaterial,
      tonnage: firstTonnage,
      target_maker_id: '3',
      mold_spec_type: '시작금형',
      development_stage: '개발',
      order_date: today.toISOString().split('T')[0],
      target_delivery_date: futureDate.toISOString().split('T')[0],
      estimated_cost: '50000000',
      notes: '샘플 테스트 금형 - 자동 생성된 데이터입니다.'
    });

    alert('샘플 데이터가 입력되었습니다!');
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};

    if (!formData.part_number.trim()) {
      newErrors.part_number = '부품번호는 필수입니다';
    }
    if (!formData.part_name.trim()) {
      newErrors.part_name = '부품명은 필수입니다';
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
    if (formData.tonnage < 1) {
      newErrors.tonnage = '톤수는 1 이상이어야 합니다';
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대표품번
              </label>
              <input
                type="text"
                name="representative_part_number"
                value={formData.representative_part_number}
                onChange={handleChange}
                className="input"
                placeholder="대표품번 입력 (예: RP-2024-001)"
              />
              <p className="text-xs text-gray-500 mt-1">동일 금형으로 생산되는 부품들의 대표 품번</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부품번호 <span className="text-red-500">*</span>
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
                부품명 <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                차종 <span className="text-red-500">*</span>
              </label>
              <select
                name="car_model"
                value={formData.car_model}
                onChange={handleChange}
                className={`input ${errors.car_model ? 'border-red-500' : ''}`}
                disabled={masterDataLoading}
              >
                <option value="">차종 선택</option>
                {carModels.map(model => (
                  <option key={model.id} value={model.model_name}>
                    {model.model_name} {model.model_code ? `(${model.model_code})` : ''}
                  </option>
                ))}
              </select>
              {errors.car_model && (
                <p className="text-sm text-red-500 mt-1">{errors.car_model}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연식
              </label>
              <select
                name="car_year"
                value={formData.car_year}
                onChange={handleChange}
                className="input"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 2 - i).map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 금형 사양 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 금형 사양</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {type.type_name} {type.type_code ? `(${type.type_code})` : ''}
                  </option>
                ))}
              </select>
              {errors.mold_type && (
                <p className="text-sm text-red-500 mt-1">{errors.mold_type}</p>
              )}
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
                    {mat.material_name} {mat.material_code ? `(${mat.material_code})` : ''}
                  </option>
                ))}
              </select>
              {errors.material && (
                <p className="text-sm text-red-500 mt-1">{errors.material}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                톤수 (ton) <span className="text-red-500">*</span>
              </label>
              <select
                name="tonnage"
                value={formData.tonnage}
                onChange={handleChange}
                className={`input ${errors.tonnage ? 'border-red-500' : ''}`}
                disabled={masterDataLoading}
              >
                <option value="">톤수 선택</option>
                {tonnages.map(ton => (
                  <option key={ton.id} value={ton.tonnage_value}>
                    {ton.tonnage_value}T {ton.description ? `- ${ton.description}` : ''}
                  </option>
                ))}
              </select>
              {errors.tonnage && (
                <p className="text-sm text-red-500 mt-1">{errors.tonnage}</p>
              )}
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
            </div>

          </div>
        </section>

        {/* 개발사양 및 단계 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 개발사양 및 단계</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                개발사양 <span className="text-red-500">*</span>
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
                단계 <span className="text-red-500">*</span>
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
          </div>
        </section>

        {/* 예산 정보 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 예산 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예상 비용 (원)
              </label>
              <input
                type="number"
                name="estimated_cost"
                value={formData.estimated_cost}
                onChange={handleChange}
                className="input"
                placeholder="50000000"
              />
            </div>
          </div>
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
