/**
 * 모바일 업체 목록 페이지
 * 업체(제작처/생산처) 목록 조회 및 검색
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Search, ChevronRight, RefreshCw,
  Building2, Phone, Mail, Package, User, AlertTriangle
} from 'lucide-react';
import api from '../../lib/api';

const FILTER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'maker', label: '제작처' },
  { key: 'producer', label: '생산처' },
];

export default function MobileCompanyList() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data?.items || response.data.data || []);
      } else {
        setError('업체 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('업체 목록 조회 오류:', err);
      setError('업체 목록을 불러오는 중 오류가 발생했습니다.');
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

  const filteredCompanies = companies.filter((company) => {
    const matchesFilter =
      activeFilter === 'all' ||
      company.type === activeFilter ||
      company.company_type === activeFilter;
    const matchesSearch =
      !searchTerm ||
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">업체 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">업체 관리</h1>
          </div>
          <button onClick={fetchCompanies} className="p-2">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="업체명, 담당자 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm text-sm border-0 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400">
          총 {filteredCompanies.length}개 업체
        </p>

        {/* Company Cards */}
        {filteredCompanies.length > 0 ? (
          <div className="space-y-3">
            {filteredCompanies.map((company) => (
              <div
                key={company.id || company.company_id}
                onClick={() => navigate(`/mobile/companies/${company.id || company.company_id}`)}
                className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {company.name || company.company_name || '-'}
                      </p>
                      {getTypeBadge(company.type || company.company_type)}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                </div>

                <div className="space-y-1.5 ml-13">
                  {(company.contact_person || company.manager) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{company.contact_person || company.manager}</span>
                    </div>
                  )}
                  {(company.phone || company.contact_phone) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{company.phone || company.contact_phone}</span>
                    </div>
                  )}
                  {(company.email || company.contact_email) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{company.email || company.contact_email}</span>
                    </div>
                  )}
                  {(company.mold_count !== undefined && company.mold_count !== null) && company.mold_count > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Package className="w-3.5 h-3.5 shrink-0" />
                      <span>관리 금형 {company.mold_count}개</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 업체가 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
