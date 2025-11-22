import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { moldSpecificationAPI } from '../lib/api';

export default function MoldRegistration() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    // 기본 정보
    part_number: '',
    part_name: '',
    car_model: '',
    car_year: new Date().getFullYear().toString(),
    
    // 금형 사양
    mold_type: '사출금형',
    cavity_count: 1,
    material: 'NAK80',
    tonnage: 350,
    
    // 제작 정보
    target_maker_id: '',
    development_stage: '개발',
    production_stage: '시제',
    
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
        alert(
          `금형이 성공적으로 등록되었습니다!\n\n` +
          `금형 코드: ${mold_code}\n` +
          `QR 코드: ${qr_token}\n\n` +
          `QR 코드가 자동 생성되었습니다.`
        );
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">금형 신규 등록</h1>
        <p className="text-sm text-gray-600 mt-1">
          금형 기본정보를 입력하면 QR 코드가 자동으로 생성됩니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <input
                type="text"
                name="car_model"
                value={formData.car_model}
                onChange={handleChange}
                className={`input ${errors.car_model ? 'border-red-500' : ''}`}
                placeholder="K5"
              />
              {errors.car_model && (
                <p className="text-sm text-red-500 mt-1">{errors.car_model}</p>
              )}
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
        </section>

        {/* 금형 사양 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 금형 사양</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="다이캐스팅금형">다이캐스팅금형</option>
                <option value="블로우금형">블로우금형</option>
              </select>
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
                재질
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="input"
              >
                <option value="NAK80">NAK80</option>
                <option value="P20">P20</option>
                <option value="S50C">S50C</option>
                <option value="SKD11">SKD11</option>
                <option value="HPM38">HPM38</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                톤수 (ton) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="tonnage"
                value={formData.tonnage}
                onChange={handleChange}
                className={`input ${errors.tonnage ? 'border-red-500' : ''}`}
                min="1"
              />
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
                <option value="양산중">양산중</option>
                <option value="양산완료">양산완료</option>
              </select>
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

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">QR 코드 자동 생성</h3>
              <p className="text-sm text-blue-800">
                금형 등록 시 QR 코드가 자동으로 생성됩니다. 생성된 QR 코드는 제작처에서 금형 명판에 부착하여 사용합니다.
              </p>
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
