import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Factory, Building2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MoldNew() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [partImages, setPartImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    part_number: '',
    part_name: '',
    car_model: '',
    car_year: new Date().getFullYear().toString(),
    mold_type: '사출금형',
    cavity_count: 1,
    material: '',
    tonnage: '',
    maker_company_id: '',
    plant_company_id: '',
    development_stage: '개발',
    production_stage: '시제',
    order_date: new Date().toISOString().split('T')[0],
    target_delivery_date: '',
    estimated_cost: '',
    notes: '',
    part_images: []
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      
      if (!token) {
        console.error('토큰이 없습니다');
        setError('로그인이 필요합니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const url = `${API_URL}/api/v1/companies?limit=100`;
      console.log('API 요청 URL:', url);
      console.log('토큰:', token ? '있음' : '없음');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 에러:', errorData);
        
        if (response.status === 401) {
          setError('로그인이 만료되었습니다. 다시 로그인해주세요.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          throw new Error(errorData.error?.message || '업체 목록 조회 실패');
        }
        return;
      }

      const data = await response.json();
      console.log('받은 데이터:', data);
      
      if (data.success) {
        setCompanies(data.data.items || []);
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
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 이미지 미리보기 생성
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setPartImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setPartImages(prev => {
      const updated = [...prev];
      // 메모리 해제
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        cavity_count: parseInt(formData.cavity_count) || 1,
        tonnage: formData.tonnage ? parseInt(formData.tonnage) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        maker_company_id: formData.maker_company_id ? parseInt(formData.maker_company_id) : null,
        plant_company_id: formData.plant_company_id ? parseInt(formData.plant_company_id) : null,
        target_delivery_date: formData.target_delivery_date || null,
        order_date: formData.order_date || null
      };

      const response = await fetch(`${API_URL}/api/v1/mold-specifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        const errorMsg = errorData.error?.details 
          ? `${errorData.error.message}: ${errorData.error.details}`
          : errorData.error?.message || '금형 등록 실패';
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.success) {
        const specificationId = data.data.specification.id;
        
        // 부품 사진 업로드 (있는 경우)
        if (partImages.length > 0) {
          await uploadPartImages(specificationId);
        }
        
        setSuccess({
          message: '금형 정보가 성공적으로 등록되었습니다!',
          moldCode: data.data.mold.mold_code,
          qrToken: data.data.mold.qr_token
        });
        
        // 3초 후 목록으로 이동
        setTimeout(() => {
          navigate('/molds');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to create mold:', err);
      setError(err.message || '금형 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const uploadPartImages = async (specificationId) => {
    try {
      setUploadingImages(true);
      
      const formData = new FormData();
      partImages.forEach(img => {
        formData.append('photos', img.file);
      });

      const response = await fetch(`${API_URL}/api/v1/mold-specifications/${specificationId}/part-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('부품 사진 업로드 실패');
      }

      const data = await response.json();
      console.log('부품 사진 업로드 성공:', data);
    } catch (err) {
      console.error('Failed to upload part images:', err);
      // 에러가 발생해도 금형 등록은 성공했으므로 계속 진행
    } finally {
      setUploadingImages(false);
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
                부품번호 <span className="text-red-500">*</span>
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
                부품명 <span className="text-red-500">*</span>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                차종 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="car_model"
                value={formData.car_model}
                onChange={handleChange}
                required
                className="input"
                placeholder="K5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연식
              </label>
              <input
                type="text"
                name="car_year"
                value={formData.car_year}
                onChange={handleChange}
                className="input"
                placeholder="2024"
              />
            </div>
          </div>
        </div>

        {/* 금형 사양 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            금형 사양
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
              >
                <option value="사출금형">사출금형</option>
                <option value="프레스금형">프레스금형</option>
                <option value="다이캐스팅">다이캐스팅</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                캐비티 수
              </label>
              <input
                type="number"
                name="cavity_count"
                value={formData.cavity_count}
                onChange={handleChange}
                min="1"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                재질
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="input"
                placeholder="NAK80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                톤수 (ton)
              </label>
              <input
                type="number"
                name="tonnage"
                value={formData.tonnage}
                onChange={handleChange}
                className="input"
                placeholder="350"
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

        {/* 개발 및 생산 단계 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            개발 및 생산 단계
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                개발 단계
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                생산 단계
              </label>
              <select
                name="production_stage"
                value={formData.production_stage}
                onChange={handleChange}
                className="input"
              >
                <option value="시제">시제</option>
                <option value="양산">양산</option>
              </select>
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
            <div className="col-span-2">
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
        </div>

        {/* 부품 사진 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
            <ImageIcon className="text-purple-600 mr-2" size={20} />
            부품 사진
          </h2>
          
          <div className="space-y-4">
            {/* 파일 선택 버튼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부품 사진 업로드 (선택사항)
              </label>
              <div className="flex items-center gap-3">
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload size={18} />
                  사진 선택
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500">
                  💡 최대 10개까지 업로드 가능 (JPG, PNG, GIF)
                </p>
              </div>
            </div>

            {/* 이미지 미리보기 */}
            {partImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {partImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                    <div className="mt-1 text-xs text-gray-600 truncate">
                      {img.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(img.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {partImages.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-sm text-gray-600 mb-2">
                  부품 사진을 업로드하면 금형 정보와 함께 저장됩니다
                </p>
                <p className="text-xs text-gray-500">
                  사진은 선택사항이며, 나중에 추가할 수 있습니다
                </p>
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
            type="submit"
            className="btn-primary flex items-center"
            disabled={loading || uploadingImages}
          >
            {loading || uploadingImages ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {uploadingImages ? '사진 업로드 중...' : '등록 중...'}
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
