import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function CompanyManagement() {
  const { token } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, maker, plant
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    makers: 0,
    plants: 0,
    activeCompanies: 0
  });

  useEffect(() => {
    fetchCompanies();
  }, [filter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const params = { limit: 100 };
      if (filter !== 'all') {
        params.company_type = filter;
      }

      const response = await api.get('/companies', { params });
      setCompanies(response.data.data.items || []);

      // 통계 계산
      const items = response.data.data.items || [];
      const makers = items.filter(c => c.company_type === 'maker').length;
      const plants = items.filter(c => c.company_type === 'plant').length;
      const active = items.filter(c => c.is_active).length;

      setStats({
        totalCompanies: response.data.data.total || 0,
        makers,
        plants,
        activeCompanies: active
      });
    } catch (error) {
      console.error('회사 목록 조회 에러:', error);
      alert(`회사 목록을 불러오는데 실패했습니다: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headerStats = [
    { label: '전체 업체', value: stats.totalCompanies },
    { label: '제작처', value: stats.makers },
    { label: '생산처', value: stats.plants },
    { label: '활성 업체', value: stats.activeCompanies }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="업체 관리" 
        subtitle="제작처 및 생산처 통합 관리"
        stats={headerStats}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 필터 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('maker')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'maker'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏭 제작처
              </button>
              <button
                onClick={() => setFilter('plant')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'plant'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏢 생산처
              </button>
            </div>

            {/* 검색 및 추가 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="업체명 또는 코드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ➕ 업체 등록
              </button>
            </div>
          </div>
        </div>

        {/* 업체 목록 */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구분
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업체 코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업체명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금형 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 업체가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <CompanyRow key={company.id} company={company} onRefresh={fetchCompanies} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 업체 등록 모달 */}
      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchCompanies();
          }}
        />
      )}
    </div>
  );
}

// 업체 행 컴포넌트
function CompanyRow({ company, onRefresh }) {
  const typeLabel = company.company_type === 'maker' ? '🏭 제작처' : '🏢 생산처';
  const typeColor = company.company_type === 'maker' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  const getRatingBadge = (rating) => {
    if (!rating) return null;
    const score = parseFloat(rating);
    let color = 'bg-gray-100 text-gray-800';
    if (score >= 4.5) color = 'bg-green-100 text-green-800';
    else if (score >= 4.0) color = 'bg-blue-100 text-blue-800';
    else if (score >= 3.5) color = 'bg-yellow-100 text-yellow-800';
    else color = 'bg-red-100 text-red-800';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
        ⭐ {score.toFixed(1)}
      </span>
    );
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColor}`}>
          {typeLabel}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {company.company_code}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {company.company_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        {company.phone || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        <div>{company.manager_name || '-'}</div>
        {company.manager_phone && (
          <div className="text-xs text-gray-500">{company.manager_phone}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getRatingBadge(company.rating)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        <div>전체: {company.total_molds || 0}</div>
        <div className="text-xs text-gray-500">활성: {company.active_molds || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          company.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {company.is_active ? '활성' : '비활성'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link
          to={`/companies/${company.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          상세보기
        </Link>
      </td>
    </tr>
  );
}

// 업체 등록 모달
function AddCompanyModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: 'maker',
    business_number: '',
    representative: '',
    phone: '',
    email: '',
    address: '',
    manager_name: '',
    manager_phone: '',
    manager_email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name) {
      alert('업체명은 필수입니다.');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/companies', formData);
      alert('업체가 성공적으로 등록되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('업체 등록 에러:', error);
      alert(`등록 실패: ${error.response?.data?.error?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">업체 등록</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업체 구분 *
                </label>
                <select
                  value={formData.company_type}
                  onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="maker">🏭 제작처</option>
                  <option value="plant">🏢 생산처</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업체 코드
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {formData.company_type === 'maker' ? '자동생성 (MKR-XXX)' : '자동생성 (PLT-XXX)'}
                </div>
                <p className="text-xs text-gray-500 mt-1">* 업체 구분에 따라 자동으로 생성됩니다</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업체명 *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="업체명 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  value={formData.business_number}
                  onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                  placeholder="123-45-67890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대표자명
                </label>
                <input
                  type="text"
                  value={formData.representative}
                  onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                  placeholder="대표자명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="02-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="주소 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">담당자 정보</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자명
                  </label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="담당자명"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 전화
                  </label>
                  <input
                    type="tel"
                    value={formData.manager_phone}
                    onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 이메일
                  </label>
                  <input
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                    placeholder="manager@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
