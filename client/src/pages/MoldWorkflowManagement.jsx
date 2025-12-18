import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Wrench, Truck, Trash2, Plus, Eye, CheckCircle, XCircle, Clock, 
  AlertTriangle, FileText, Search, Filter, RefreshCw, ChevronDown,
  ArrowRight, Calendar, Building2, Package, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import api, { transferAPI } from '../lib/api';

/**
 * 통합관리 페이지 - 수리/이관/폐기 통합 관리
 * 전체 금형의 수리, 이관, 폐기 현황을 탭 기반으로 통합 관리
 */
export default function MoldWorkflowManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 탭 상태 (URL 파라미터 기반)
  const activeTab = searchParams.get('tab') || 'repair';
  
  // 공통 상태
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 데이터 상태
  const [repairs, setRepairs] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [scrappings, setScrappings] = useState([]);
  
  // 통계 상태
  const [statistics, setStatistics] = useState({
    repair: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    transfer: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    scrapping: { total: 0, pending: 0, approved: 0, scrapped: 0 }
  });

  const tabs = [
    { key: 'repair', label: '수리 관리', icon: Wrench, color: 'orange' },
    { key: 'transfer', label: '이관 관리', icon: Truck, color: 'purple' },
    { key: 'scrapping', label: '금형 폐기', icon: Trash2, color: 'red' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'repair':
          await loadRepairs();
          break;
        case 'transfer':
          await loadTransfers();
          break;
        case 'scrapping':
          await loadScrappings();
          break;
      }
      await loadStatistics();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepairs = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/repair-requests', { params });
      setRepairs(response.data.data || []);
    } catch (error) {
      console.error('Failed to load repairs:', error);
      setRepairs([]);
    }
  };

  const loadTransfers = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await transferAPI.getAll({ ...params, limit: 100 });
      setTransfers(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load transfers:', error);
      setTransfers([]);
    }
  };

  const loadScrappings = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/scrapping', { params });
      setScrappings(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load scrappings:', error);
      setScrappings([]);
    }
  };

  const loadStatistics = async () => {
    try {
      // 수리 통계
      const repairRes = await api.get('/repair-requests');
      const repairData = repairRes.data.data || [];
      
      // 이관 통계
      const transferRes = await transferAPI.getAll({ limit: 1000 });
      const transferData = transferRes.data.data.items || [];
      
      // 폐기 통계
      const scrappingRes = await api.get('/scrapping');
      const scrappingData = scrappingRes.data.data.items || [];
      
      setStatistics({
        repair: {
          total: repairData.length,
          pending: repairData.filter(r => r.status === 'requested' || r.status === 'pending').length,
          inProgress: repairData.filter(r => r.status === 'in_progress' || r.status === 'approved').length,
          completed: repairData.filter(r => r.status === 'completed').length
        },
        transfer: {
          total: transferData.length,
          pending: transferData.filter(t => t.status === 'pending' || t.status === '요청접수').length,
          inProgress: transferData.filter(t => t.status === 'in_progress' || t.status === 'approved').length,
          completed: transferData.filter(t => t.status === 'completed').length
        },
        scrapping: {
          total: scrappingData.length,
          pending: scrappingData.filter(s => s.status === 'requested').length,
          approved: scrappingData.filter(s => s.status === 'approved' || s.status === 'first_approved').length,
          scrapped: scrappingData.filter(s => s.status === 'scrapped').length
        }
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setStatusFilter('all');
  };

  const getStatusBadge = (status, type) => {
    const configs = {
      repair: {
        requested: { label: '요청됨', bg: 'bg-yellow-100', text: 'text-yellow-700' },
        pending: { label: '대기', bg: 'bg-yellow-100', text: 'text-yellow-700' },
        approved: { label: '승인', bg: 'bg-blue-100', text: 'text-blue-700' },
        in_progress: { label: '진행중', bg: 'bg-blue-100', text: 'text-blue-700' },
        completed: { label: '완료', bg: 'bg-green-100', text: 'text-green-700' },
        rejected: { label: '반려', bg: 'bg-red-100', text: 'text-red-700' }
      },
      transfer: {
        pending: { label: '승인대기', bg: 'bg-yellow-100', text: 'text-yellow-700' },
        '요청접수': { label: '요청접수', bg: 'bg-yellow-100', text: 'text-yellow-700' },
        approved: { label: '승인완료', bg: 'bg-green-100', text: 'text-green-700' },
        in_progress: { label: '진행중', bg: 'bg-blue-100', text: 'text-blue-700' },
        completed: { label: '완료', bg: 'bg-gray-100', text: 'text-gray-700' },
        rejected: { label: '반려', bg: 'bg-red-100', text: 'text-red-700' }
      },
      scrapping: {
        requested: { label: '요청됨', bg: 'bg-yellow-100', text: 'text-yellow-700' },
        first_approved: { label: '1차승인', bg: 'bg-blue-100', text: 'text-blue-700' },
        approved: { label: '승인완료', bg: 'bg-green-100', text: 'text-green-700' },
        rejected: { label: '반려', bg: 'bg-red-100', text: 'text-red-700' },
        scrapped: { label: '폐기완료', bg: 'bg-gray-100', text: 'text-gray-700' }
      }
    };
    
    const config = configs[type]?.[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case 'repair':
        return [
          { value: 'all', label: '전체' },
          { value: 'requested', label: '요청됨' },
          { value: 'approved', label: '승인' },
          { value: 'in_progress', label: '진행중' },
          { value: 'completed', label: '완료' }
        ];
      case 'transfer':
        return [
          { value: 'all', label: '전체' },
          { value: 'pending', label: '승인대기' },
          { value: 'approved', label: '승인완료' },
          { value: 'in_progress', label: '진행중' },
          { value: 'completed', label: '완료' }
        ];
      case 'scrapping':
        return [
          { value: 'all', label: '전체' },
          { value: 'requested', label: '요청됨' },
          { value: 'first_approved', label: '1차승인' },
          { value: 'approved', label: '승인완료' },
          { value: 'scrapped', label: '폐기완료' }
        ];
      default:
        return [{ value: 'all', label: '전체' }];
    }
  };

  const handleNewRequest = () => {
    switch (activeTab) {
      case 'repair':
        navigate('/repair-request-form');
        break;
      case 'transfer':
        navigate('/transfers/new');
        break;
      case 'scrapping':
        navigate('/scrapping/new');
        break;
    }
  };

  const handleViewDetail = (id) => {
    switch (activeTab) {
      case 'repair':
        navigate(`/repair-request-form?id=${id}`);
        break;
      case 'transfer':
        navigate(`/transfers/${id}`);
        break;
      case 'scrapping':
        navigate(`/scrapping/${id}`);
        break;
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'repair': return repairs;
      case 'transfer': return transfers;
      case 'scrapping': return scrappings;
      default: return [];
    }
  };

  const filteredData = getCurrentData().filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.mold_number?.toLowerCase().includes(search) ||
      item.part_number?.toLowerCase().includes(search) ||
      item.part_name?.toLowerCase().includes(search) ||
      item.moldSpec?.part_number?.toLowerCase().includes(search) ||
      item.moldSpec?.part_name?.toLowerCase().includes(search)
    );
  });

  const getTabColor = (tab) => {
    const colors = {
      repair: { active: 'border-orange-500 text-orange-600 bg-orange-50', hover: 'hover:bg-orange-50' },
      transfer: { active: 'border-purple-500 text-purple-600 bg-purple-50', hover: 'hover:bg-purple-50' },
      scrapping: { active: 'border-red-500 text-red-600 bg-red-50', hover: 'hover:bg-red-50' }
    };
    return colors[tab] || colors.repair;
  };

  const getNewButtonColor = () => {
    const colors = {
      repair: 'bg-orange-600 hover:bg-orange-700',
      transfer: 'bg-purple-600 hover:bg-purple-700',
      scrapping: 'bg-red-600 hover:bg-red-700'
    };
    return colors[activeTab] || colors.repair;
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">통합관리</h1>
        <p className="text-sm text-gray-600 mt-1">금형 수리, 이관, 폐기 현황을 통합 관리합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="text-orange-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-orange-600">{statistics.repair.total}</span>
          </div>
          <h3 className="font-semibold text-gray-800">수리 관리</h3>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-yellow-600">대기 {statistics.repair.pending}</span>
            <span className="text-blue-600">진행 {statistics.repair.inProgress}</span>
            <span className="text-green-600">완료 {statistics.repair.completed}</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="text-purple-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-purple-600">{statistics.transfer.total}</span>
          </div>
          <h3 className="font-semibold text-gray-800">이관 관리</h3>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-yellow-600">대기 {statistics.transfer.pending}</span>
            <span className="text-blue-600">진행 {statistics.transfer.inProgress}</span>
            <span className="text-green-600">완료 {statistics.transfer.completed}</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="text-red-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-red-600">{statistics.scrapping.total}</span>
          </div>
          <h3 className="font-semibold text-gray-800">금형 폐기</h3>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-yellow-600">대기 {statistics.scrapping.pending}</span>
            <span className="text-blue-600">승인 {statistics.scrapping.approved}</span>
            <span className="text-gray-600">폐기 {statistics.scrapping.scrapped}</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            const colors = getTabColor(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors border-b-2 ${
                  isActive ? colors.active + ' border-b-2' : 'border-transparent text-gray-500 ' + colors.hover
                }`}
              >
                <TabIcon size={20} />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-white/50' : 'bg-gray-100'
                }`}>
                  {tab.key === 'repair' ? statistics.repair.total : 
                   tab.key === 'transfer' ? statistics.transfer.total : 
                   statistics.scrapping.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* 필터 & 검색 */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="금형번호, 품번, 품명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {getFilterOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={loadData}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <button
            onClick={handleNewRequest}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${getNewButtonColor()}`}
          >
            <Plus size={18} />
            {activeTab === 'repair' ? '수리 요청' : activeTab === 'transfer' ? '이관 요청' : '폐기 요청'}
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p>데이터가 없습니다</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형정보</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {activeTab === 'repair' ? '문제유형' : activeTab === 'transfer' ? '이관유형' : '폐기사유'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Package size={18} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.moldSpec?.part_number || item.part_number || item.mold_number || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.moldSpec?.part_name || item.part_name || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700">
                        {activeTab === 'repair' ? (item.issue_type || item.problem_type || '-') :
                         activeTab === 'transfer' ? (item.transfer_type === 'plant_to_plant' ? '생산처→생산처' : item.transfer_type || '-') :
                         (item.reason || '-')}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700">
                        {item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : 
                         item.request_date ? format(new Date(item.request_date), 'yyyy-MM-dd') : '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(item.status, activeTab)}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-700">
                        {item.requester?.name || item.requestedBy?.name || item.from_manager_name || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="상세보기"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
