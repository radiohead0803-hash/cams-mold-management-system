/**
 * 모바일 금형 목록 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Package, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export default function MobileMoldList() {
  const navigate = useNavigate();
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchMolds();
  }, [statusFilter]);

  const fetchMolds = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/mold-specifications', { params });
      if (response.data.success) {
        setMolds(response.data.data || []);
      }
    } catch (error) {
      console.error('금형 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      mold.mold_number?.toLowerCase().includes(term) ||
      mold.part_name?.toLowerCase().includes(term) ||
      mold.car_model?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      repair: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: '가동중',
      inactive: '비가동',
      maintenance: '정비중',
      repair: '수리중'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.inactive}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">금형 목록</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilter(!showFilter)} className="p-2">
              <Filter className={`w-5 h-5 ${showFilter ? 'text-blue-500' : ''}`} />
            </button>
            <button onClick={fetchMolds} className="p-2">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="금형번호, 부품명, 차종 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter */}
        {showFilter && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: '전체' },
              { key: 'active', label: '가동중' },
              { key: 'inactive', label: '비가동' },
              { key: 'maintenance', label: '정비중' },
              { key: 'repair', label: '수리중' }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  statusFilter === opt.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mold List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMolds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>금형이 없습니다</p>
          </div>
        ) : (
          filteredMolds.map(mold => (
            <div
              key={mold.id}
              onClick={() => navigate(`/mobile/mold/${mold.id}`)}
              className="bg-white rounded-lg shadow-sm p-4 active:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-600">{mold.mold_number}</span>
                    {getStatusBadge(mold.status)}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{mold.part_name || '-'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{mold.car_model || '-'}</span>
                    <span>•</span>
                    <span>{mold.current_shots?.toLocaleString() || 0}타</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Count */}
      <div className="fixed bottom-4 left-4 right-4">
        <div className="bg-gray-800 text-white text-center py-2 rounded-lg text-sm">
          총 {filteredMolds.length}개 금형
        </div>
      </div>
    </div>
  );
}
