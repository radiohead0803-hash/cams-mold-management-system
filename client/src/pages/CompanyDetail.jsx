import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Edit, Save, X, Building2, Phone, Mail, MapPin, User, Calendar, Star } from 'lucide-react';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanyDetail();
  }, [id]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/companies/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.data);
        setFormData(data.data);
      } else {
        alert('업체 정보를 불러오는데 실패했습니다.');
        navigate('/companies');
      }
    } catch (error) {
      console.error('업체 상세 조회 에러:', error);
      alert('업체 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(company);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/companies/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.data);
        setIsEditing(false);
        alert('업체 정보가 성공적으로 수정되었습니다.');
      } else {
        const error = await response.json();
        alert(`수정 실패: ${error.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('업체 수정 에러:', error);
      alert('업체 정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">업체 정보를 찾을 수 없습니다.</p>
          <Link to="/companies" className="mt-4 text-blue-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const companyTypeLabel = company.company_type === 'maker' ? '제작처' : '생산처';
  const companyTypeColor = company.company_type === 'maker' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/companies"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
                <p className="text-sm text-gray-500">{company.company_code}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${companyTypeColor}`}>
                {companyTypeLabel}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={18} />
                  <span>수정</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={saving}
                  >
                    <X size={18} />
                    <span>취소</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>{saving ? '저장 중...' : '저장'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Building2 className="mr-2" size={20} />
                기본 정보
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="업체 코드"
                  value={formData.company_code}
                  isEditing={false}
                />
                <InfoField
                  label="업체명"
                  value={formData.company_name}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('company_name', value)}
                />
                <InfoField
                  label="사업자등록번호"
                  value={formData.business_number}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('business_number', value)}
                />
                <InfoField
                  label="대표자"
                  value={formData.representative}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('representative', value)}
                />
              </div>
            </div>

            {/* 연락처 정보 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="mr-2" size={20} />
                연락처 정보
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="전화번호"
                  value={formData.phone}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('phone', value)}
                />
                <InfoField
                  label="팩스"
                  value={formData.fax}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('fax', value)}
                />
                <InfoField
                  label="이메일"
                  value={formData.email}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('email', value)}
                  fullWidth
                />
              </div>
            </div>

            {/* 주소 정보 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="mr-2" size={20} />
                주소 정보
              </h2>
              <div className="space-y-4">
                <InfoField
                  label="주소"
                  value={formData.address}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('address', value)}
                  fullWidth
                />
                <InfoField
                  label="상세주소"
                  value={formData.address_detail}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('address_detail', value)}
                  fullWidth
                />
                <InfoField
                  label="우편번호"
                  value={formData.postal_code}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('postal_code', value)}
                />
              </div>
            </div>

            {/* 담당자 정보 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="mr-2" size={20} />
                담당자 정보
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="담당자명"
                  value={formData.manager_name}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('manager_name', value)}
                />
                <InfoField
                  label="담당자 전화"
                  value={formData.manager_phone}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('manager_phone', value)}
                />
                <InfoField
                  label="담당자 이메일"
                  value={formData.manager_email}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('manager_email', value)}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* 오른쪽: 통계 및 추가 정보 */}
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">통계</h2>
              <div className="space-y-3">
                <StatItem label="전체 금형" value={company.total_molds || 0} />
                <StatItem label="활성 금형" value={company.active_molds || 0} />
                <StatItem label="완료 프로젝트" value={company.completed_projects || 0} />
                {company.rating && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">평가</span>
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{parseFloat(company.rating).toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 계약 정보 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="mr-2" size={20} />
                계약 정보
              </h2>
              <div className="space-y-3">
                <InfoField
                  label="계약 시작일"
                  value={formData.contract_start_date}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('contract_start_date', value)}
                  type="date"
                  fullWidth
                />
                <InfoField
                  label="계약 종료일"
                  value={formData.contract_end_date}
                  isEditing={isEditing}
                  onChange={(value) => handleChange('contract_end_date', value)}
                  type="date"
                  fullWidth
                />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">계약 상태</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    company.contract_status === 'active' ? 'bg-green-100 text-green-800' :
                    company.contract_status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {company.contract_status === 'active' ? '활성' :
                     company.contract_status === 'expired' ? '만료' : '중단'}
                  </span>
                </div>
              </div>
            </div>

            {/* 상태 카드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">상태</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">활성 상태</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {company.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm text-gray-600">등록일</span>
                  <span className="text-sm font-medium">
                    {new Date(company.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <span className="text-sm text-gray-600">최종 수정일</span>
                  <span className="text-sm font-medium">
                    {new Date(company.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 비고 */}
        {(company.notes || isEditing) && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">비고</h2>
            {isEditing ? (
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="비고 사항을 입력하세요"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{company.notes || '-'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 정보 필드 컴포넌트
function InfoField({ label, value, isEditing, onChange, type = 'text', fullWidth = false }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {isEditing && onChange ? (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      ) : (
        <p className="text-gray-900">{value || '-'}</p>
      )}
    </div>
  );
}

// 통계 항목 컴포넌트
function StatItem({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
    </div>
  );
}
