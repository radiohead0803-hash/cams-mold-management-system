import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, X, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { moldSpecificationAPI } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MoldSpecificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [specification, setSpecification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [partImage, setPartImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    part_number: '',
    part_name: '',
    car_model: '',
    car_year: '',
    mold_type: '',
    cavity_count: 1,
    material: '',
    tonnage: '',
    development_stage: '',
    production_stage: '',
    order_date: '',
    target_delivery_date: '',
    estimated_cost: '',
    notes: ''
  });

  useEffect(() => {
    loadSpecification();
  }, [id]);

  const loadSpecification = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(id);
      const spec = response.data.data;
      
      setSpecification(spec);
      setFormData({
        part_number: spec.part_number || '',
        part_name: spec.part_name || '',
        car_model: spec.car_model || '',
        car_year: spec.car_year || '',
        mold_type: spec.mold_type || '',
        cavity_count: spec.cavity_count || 1,
        material: spec.material || '',
        tonnage: spec.tonnage || '',
        development_stage: spec.development_stage || '',
        production_stage: spec.production_stage || '',
        order_date: spec.order_date || '',
        target_delivery_date: spec.target_delivery_date || '',
        estimated_cost: spec.estimated_cost || '',
        notes: spec.notes || ''
      });
    } catch (err) {
      console.error('Failed to load specification:', err);
      setError('금형 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updateData = {
        ...formData,
        cavity_count: parseInt(formData.cavity_count) || 1,
        tonnage: formData.tonnage ? parseInt(formData.tonnage) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
      };

      console.log('Saving data:', updateData);
      
      const response = await moldSpecificationAPI.update(id, updateData);
      
      console.log('Save response:', response);
      
      setSuccess('저장되었습니다!');
      setEditMode(false);
      await loadSpecification();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
      console.error('Error response:', err.response);
      
      const errorMessage = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || '알 수 없는 오류가 발생했습니다';
      
      setError('저장에 실패했습니다: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (partImage?.preview) {
      URL.revokeObjectURL(partImage.preview);
    }

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
          if (partImage?.preview) {
            URL.revokeObjectURL(partImage.preview);
          }

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

  const uploadPartImage = async () => {
    if (!partImage) return;

    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', partImage.file);

      const response = await fetch(`${API_URL}/api/v1/mold-specifications/${id}/part-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('부품 사진 업로드 실패');
      }

      setSuccess('부품 사진이 업로드되었습니다!');
      setPartImage(null);
      await loadSpecification();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('사진 업로드 실패: ' + err.message);
    } finally {
      setUploadingImage(false);
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

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!specification) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
        <p className="text-gray-500">금형 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/molds')} className="btn-primary mt-4">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/molds')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} className="mr-2" />
            목록으로
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">금형 상세 정보</h1>
            <p className="text-sm text-gray-600 mt-1">
              {specification.part_number} - {specification.part_name}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Edit2 size={18} />
              수정
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  loadSpecification();
                }}
                className="btn-secondary flex items-center gap-2"
                disabled={saving}
              >
                <X size={18} />
                취소
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    저장
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="text-green-600 mr-3" size={20} />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="text-red-600 mr-3" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">기본 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부품번호</label>
                {editMode ? (
                  <input
                    type="text"
                    name="part_number"
                    value={formData.part_number}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.part_number}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부품명</label>
                {editMode ? (
                  <input
                    type="text"
                    name="part_name"
                    value={formData.part_name}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.part_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차종</label>
                {editMode ? (
                  <input
                    type="text"
                    name="car_model"
                    value={formData.car_model}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.car_model}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연식</label>
                {editMode ? (
                  <input
                    type="text"
                    name="car_year"
                    value={formData.car_year}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.car_year}</p>
                )}
              </div>
            </div>
          </div>

          {/* 금형 사양 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">금형 사양</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금형 타입</label>
                {editMode ? (
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
                ) : (
                  <p className="font-medium">{specification.mold_type}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">캐비티 수</label>
                {editMode ? (
                  <input
                    type="number"
                    name="cavity_count"
                    value={formData.cavity_count}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.cavity_count}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">재질</label>
                {editMode ? (
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.material}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">톤수</label>
                {editMode ? (
                  <input
                    type="number"
                    name="tonnage"
                    value={formData.tonnage}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="font-medium">{specification.tonnage}</p>
                )}
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">비고</h2>
            {editMode ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="input"
              />
            ) : (
              <p className="text-gray-700">{specification.notes || '-'}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* 부품 사진 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4 flex items-center">
              <ImageIcon className="mr-2 text-purple-600" size={18} />
              부품 사진
            </h3>
            
            {specification.part_images && specification.part_images.url ? (
              <div className="mb-4">
                <img
                  src={`${API_URL}${specification.part_images.url}`}
                  alt="부품 사진"
                  className="w-full rounded-lg border"
                />
                <p className="text-xs text-gray-500 mt-2">{specification.part_images.filename}</p>
              </div>
            ) : (
              <div className="mb-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-500">등록된 사진이 없습니다</p>
              </div>
            )}

            {/* 사진 업로드 */}
            {partImage ? (
              <div className="relative mb-4">
                <img
                  src={partImage.preview}
                  alt="미리보기"
                  className="w-full rounded-lg border"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
                <p className="text-xs text-gray-600 mt-2">{partImage.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(partImage.size)}</p>
              </div>
            ) : (
              <div
                className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary-400 transition-colors cursor-pointer"
                onPaste={handlePaste}
                tabIndex={0}
              >
                <p className="text-sm text-gray-600 mb-2">사진 업로드</p>
                <p className="text-xs text-gray-500 mb-2">Ctrl+V로 붙여넣기</p>
                <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2">
                  <Upload size={16} />
                  파일 선택
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {partImage && (
              <button
                onClick={uploadPartImage}
                disabled={uploadingImage}
                className="w-full btn-primary text-sm"
              >
                {uploadingImage ? '업로드 중...' : '사진 업로드'}
              </button>
            )}
          </div>

          {/* 상태 정보 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">상태 정보</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">상태</span>
                <span className="font-medium">{specification.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">개발 단계</span>
                <span className="font-medium">{specification.development_stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">생산 단계</span>
                <span className="font-medium">{specification.production_stage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">제작처</span>
                <span className="font-medium">{specification.makerCompany?.company_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">생산처</span>
                <span className="font-medium">{specification.plantCompany?.company_name || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
