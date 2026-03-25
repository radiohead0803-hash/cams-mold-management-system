/**
 * 모바일 업체 상세 페이지
 * 단일 업체의 상세 정보 조회
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Building2, Phone, Mail, MapPin,
  User, Package, ChevronRight, AlertTriangle, Globe, FileText
} from 'lucide-react';
import api from '../../lib/api';

export default function MobileCompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetail();
    }
  }, [companyId]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/companies/${companyId}`);
      if (response.data.success) {
        setCompany(response.data.data);
      } else {
        setError('업체 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('업체 상세 조회 오류:', err);
      setError('업체 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      maker: { bg: 'bg-blue-100', text: 'text-blue-700', label: '제작처' },
      producer: { bg: 'bg-green-100', text: 'text-green-700', label: '생산처' },
      supplier: { bg: 'bg-purple-100', text: 'text-purple-700', label: '협력사' },
      client: { bg: 'bg-orange-100', text: 'text-orange-700', label: '고객사' },
    };
    const config = configs[type] || { bg: 'bg-gray-100', text: 'text-gray-600', label: type || '기타' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const isActive = status === 'active' || status === '활성';
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">업체 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold ml-2">업체 상세</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCompanyDetail}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const contacts = company.contacts || company.managers || [];
  const relatedMolds = company.molds || company.related_molds || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold ml-2">업체 상세</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Company Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">
                {company.name || company.company_name || '-'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getTypeBadge(company.type || company.company_type)}
                {getStatusBadge(company.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">기본정보</h3>
          <div className="space-y-3">
            {(company.address || company.company_address) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">주소</p>
                  <p className="text-sm text-gray-900">{company.address || company.company_address}</p>
                </div>
              </div>
            )}
            {(company.phone || company.contact_phone || company.tel) && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">전화번호</p>
                  <a
                    href={`tel:${company.phone || company.contact_phone || company.tel}`}
                    className="text-sm text-blue-600"
                  >
                    {company.phone || company.contact_phone || company.tel}
                  </a>
                </div>
              </div>
            )}
            {(company.email || company.contact_email) && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">이메일</p>
                  <a
                    href={`mailto:${company.email || company.contact_email}`}
                    className="text-sm text-blue-600"
                  >
                    {company.email || company.contact_email}
                  </a>
                </div>
              </div>
            )}
            {(company.fax) && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">팩스</p>
                  <p className="text-sm text-gray-900">{company.fax}</p>
                </div>
              </div>
            )}
            {(company.website) && (
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">웹사이트</p>
                  <p className="text-sm text-blue-600">{company.website}</p>
                </div>
              </div>
            )}
            {(company.business_number || company.registration_number) && (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">사업자번호</p>
                  <p className="text-sm text-gray-900">{company.business_number || company.registration_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Persons Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">담당자 목록</h3>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {contact.name || contact.contact_name || '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contact.position || contact.role || ''}
                      {contact.department ? ` / ${contact.department}` : ''}
                    </p>
                    {(contact.phone || contact.mobile) && (
                      <a
                        href={`tel:${contact.phone || contact.mobile}`}
                        className="text-xs text-blue-600"
                      >
                        {contact.phone || contact.mobile}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">등록된 담당자가 없습니다</p>
            </div>
          )}
        </div>

        {/* Related Molds Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">관련 금형 목록</h3>
            {relatedMolds.length > 0 && (
              <span className="text-xs text-gray-400">{relatedMolds.length}개</span>
            )}
          </div>
          {relatedMolds.length > 0 ? (
            <div className="space-y-2">
              {relatedMolds.map((mold, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/mobile/mold/${mold.id || mold.mold_id}`)}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg active:bg-gray-100 cursor-pointer"
                >
                  <Package className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {mold.mold_number || '-'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {mold.part_name || mold.mold_name || '-'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    mold.status === 'active' ? 'bg-green-100 text-green-700' :
                    mold.status === 'repair' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {mold.status === 'active' ? '가동중' :
                     mold.status === 'repair' ? '수리중' :
                     mold.status || '-'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">관련 금형이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
