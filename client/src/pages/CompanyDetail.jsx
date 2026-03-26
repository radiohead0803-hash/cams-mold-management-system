import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { ArrowLeft, Edit, Save, X, Building2, Phone, Mail, MapPin, User, Calendar, Star, Factory, Wrench, Award, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

// 프로필 diff에서 비교할 필드 목록
const PROFILE_DIFF_FIELDS = [
  { key: 'phone', label: '전화번호' },
  { key: 'fax', label: '팩스' },
  { key: 'email', label: '이메일' },
  { key: 'address', label: '주소' },
  { key: 'address_detail', label: '상세주소' },
  { key: 'postal_code', label: '우편번호' },
  { key: 'manager_name', label: '담당자명' },
  { key: 'manager_phone', label: '담당자 전화' },
  { key: 'manager_email', label: '담당자 이메일' },
  { key: 'representative', label: '대표자' },
  { key: 'business_number', label: '사업자등록번호' },
  { key: 'company_name', label: '업체명' },
  { key: 'notes', label: '비고' },
  { key: 'gps_lat', label: 'GPS 위도' },
  { key: 'gps_lng', label: 'GPS 경도' },
];

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchCompanyDetail();
  }, [id]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);

      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const response = await api.get(`/companies/${id}`);
      setCompany(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      console.error('업체 상세 조회 에러:', error);
      alert('업체 정보를 불러오는데 실패했습니다.');
      navigate('/companies');
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

      const response = await api.patch(`/companies/${id}`, formData);
      setCompany(response.data.data);
      setIsEditing(false);
      alert('업체 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('업체 수정 에러:', error);
      alert(`수정 실패: ${error.response?.data?.error?.message || error.message || '알 수 없는 오류'}`);
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

  const handleApprove = async () => {
    if (!window.confirm('이 프로필 변경 요청을 승인하시겠습니까?')) return;

    try {
      setApproving(true);
      await api.post(`/company-profile/approve/${company.id}`);
      alert('프로필 변경이 승인되었습니다.');
      fetchCompanyDetail();
    } catch (error) {
      console.error('승인 에러:', error);
      alert(`승인 실패: ${error.response?.data?.error?.message || error.message || '알 수 없는 오류'}`);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason || rejectReason.trim().length < 5) {
      alert('반려 사유를 5자 이상 입력해주세요.');
      return;
    }

    try {
      setRejecting(true);
      await api.post(`/company-profile/reject/${company.id}`, { reason: rejectReason.trim() });
      alert('프로필 변경이 반려되었습니다.');
      setShowRejectModal(false);
      setRejectReason('');
      fetchCompanyDetail();
    } catch (error) {
      console.error('반려 에러:', error);
      alert(`반려 실패: ${error.response?.data?.error?.message || error.message || '알 수 없는 오류'}`);
    } finally {
      setRejecting(false);
    }
  };

  // 프로필 draft와 현재 값 비교하여 변경된 필드만 반환
  const getChangedFields = () => {
    if (!company || !company.profile_draft) return [];
    const draft = typeof company.profile_draft === 'string'
      ? JSON.parse(company.profile_draft)
      : company.profile_draft;

    return PROFILE_DIFF_FIELDS.filter(({ key }) => {
      const current = company[key] ?? '';
      const draftVal = draft[key] ?? '';
      return String(current) !== String(draftVal) && (current || draftVal);
    }).map(({ key, label }) => ({
      key,
      label,
      current: company[key] ?? '',
      draft: draft[key] ?? '',
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

  const isPendingApproval = company.profile_status === 'pending_approval';
  const changedFields = isPendingApproval ? getChangedFields() : [];

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

      {/* 승인 요청 배너 */}
      {isPendingApproval && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <p className="text-blue-800 font-semibold text-lg">프로필 승인 요청이 있습니다</p>
                  {company.submitted_at && (
                    <p className="text-blue-600 text-sm mt-0.5">
                      요청일시: {new Date(company.submitted_at).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  <CheckCircle size={18} />
                  <span>{approving ? '처리 중...' : '승인'}</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejecting}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  <XCircle size={18} />
                  <span>반려</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 본문 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 변경 항목 diff 카드 */}
        {isPendingApproval && changedFields.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-blue-800">
              <Edit className="mr-2" size={20} />
              변경 항목
            </h2>
            <div className="space-y-3">
              {changedFields.map(({ key, label, current, draft }) => (
                <div key={key} className="flex items-start py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0 pt-0.5">{label}</span>
                  <div className="flex items-center flex-wrap gap-2 min-w-0">
                    <span className="inline-block px-2 py-1 bg-red-50 text-red-700 rounded text-sm line-through break-all">
                      {current || '(없음)'}
                    </span>
                    <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-sm font-medium break-all">
                      {draft || '(없음)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isPendingApproval && changedFields.length === 0 && company.profile_draft && (
          <div className="mb-6 bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-yellow-700 text-sm">승인 대기 중이지만 변경된 항목이 없습니다.</p>
          </div>
        )}

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
                {company.profile_status && (
                  <div className="flex items-center justify-between py-2 border-t">
                    <span className="text-sm text-gray-600">프로필 상태</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      company.profile_status === 'pending_approval'
                        ? 'bg-yellow-100 text-yellow-800'
                        : company.profile_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : company.profile_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.profile_status === 'pending_approval' ? '승인대기'
                        : company.profile_status === 'approved' ? '승인됨'
                        : company.profile_status === 'rejected' ? '반려됨'
                        : company.profile_status}
                    </span>
                  </div>
                )}
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

        {/* 사출기 보유현황 (생산처) / 제작능력 (제작처) */}
        {(company.company_type === 'plant' && (company.injection_machines?.length > 0 || company.production_lines || company.daily_capacity)) && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Factory className="mr-2 text-green-600" size={20} />
              사출기 보유현황
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {company.production_lines && (
                <div>
                  <span className="text-sm text-gray-600">생산라인 수</span>
                  <p className="text-lg font-bold text-gray-900">{company.production_lines}개</p>
                </div>
              )}
              {company.daily_capacity && (
                <div>
                  <span className="text-sm text-gray-600">일일 생산능력</span>
                  <p className="text-lg font-bold text-gray-900">{company.daily_capacity?.toLocaleString()}개</p>
                </div>
              )}
            </div>
            {company.injection_machines?.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">제조사</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">모델명</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">톤수</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">도입년도</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {company.injection_machines.map((m, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{m.manufacturer}</td>
                        <td className="px-3 py-2">{m.model || '-'}</td>
                        <td className="px-3 py-2 font-bold text-blue-600">{m.tonnage}T</td>
                        <td className="px-3 py-2">{m.year || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {(company.company_type === 'maker' && (company.production_capacity || company.specialties?.length > 0)) && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Wrench className="mr-2 text-orange-600" size={20} />
              제작 능력
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {company.production_capacity && (
                <div>
                  <span className="text-sm text-gray-600">월간 금형 제작 능력</span>
                  <p className="text-lg font-bold text-gray-900">{company.production_capacity}개</p>
                </div>
              )}
              {company.specialties?.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">전문분야</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {company.specialties.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 보유 장비 */}
        {company.equipment_list?.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Wrench className="mr-2 text-blue-600" size={20} />
              보유 장비
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">장비명</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">사양/수량</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {company.equipment_list.map((eq, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{eq.name}</td>
                      <td className="px-3 py-2">{eq.spec || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 인증 현황 */}
        {company.certifications?.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="mr-2 text-yellow-600" size={20} />
              인증 현황
            </h2>
            <div className="flex flex-wrap gap-2">
              {company.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <Award size={14} className="text-yellow-600" />
                  <span className="font-medium">{cert.name}</span>
                  {cert.expiry && <span className="text-xs text-gray-500">({cert.expiry}까지)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* 반려 사유 입력 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <XCircle className="mr-2 text-red-600" size={22} />
                  프로필 변경 반려
                </h3>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                반려 사유를 입력해주세요. (최소 5자)
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="4"
                placeholder="반려 사유를 입력하세요..."
                autoFocus
              />
              <p className={`text-xs mt-1 ${rejectReason.trim().length < 5 ? 'text-red-500' : 'text-green-600'}`}>
                {rejectReason.trim().length}/5자 이상
              </p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={rejecting || rejectReason.trim().length < 5}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {rejecting ? '처리 중...' : '반려'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
