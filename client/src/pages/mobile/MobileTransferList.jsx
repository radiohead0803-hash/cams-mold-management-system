import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Plus, CheckCircle, Clock, XCircle, FileText, 
  ArrowRight, ChevronRight, Filter, RefreshCw
} from 'lucide-react';
import { transferAPI } from '../../lib/api';
import { format } from 'date-fns';

export default function MobileTransferList() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, [filter, moldId]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (filter !== 'all') {
        params.status = filter;
      }
      if (moldId) {
        params.mold_id = moldId;
      }
      const response = await transferAPI.getAll(params);
      setTransfers(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransfers();
    setRefreshing(false);
  };

  const getStatusConfig = (status) => {
    const configs = {
      requested: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        border: 'border-yellow-200',
        label: '요청됨',
        icon: Clock
      },
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        border: 'border-yellow-200',
        label: '승인 대기',
        icon: Clock
      },
      in_progress: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        label: '진행 중',
        icon: ArrowRight
      },
      approved: { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        border: 'border-green-200',
        label: '승인 완료',
        icon: CheckCircle
      },
      completed: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        label: '완료',
        icon: CheckCircle
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        border: 'border-red-200',
        label: '반려',
        icon: XCircle
      }
    };
    return configs[status] || configs.pending;
  };

  const filterOptions = [
    { value: 'all', label: '전체' },
    { value: 'requested', label: '요청됨' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'rejected', label: '반려' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold">금형 이관 현황</h1>
                <p className="text-xs text-white/80">이관 요청 및 승인 관리</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* 필터 탭 */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-white text-sky-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 이관 목록 */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">로딩 중...</p>
            </div>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500 text-sm">이관 요청이 없습니다.</p>
            {moldId && (
              <button
                onClick={() => navigate(`/mobile/mold/${moldId}/transfer/new`)}
                className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium"
              >
                이관 요청하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => {
              const statusConfig = getStatusConfig(transfer.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={transfer.id}
                  onClick={() => navigate(`/mobile/transfer/${transfer.id}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
                >
                  <div className="p-4">
                    {/* 상단: 금형 정보 & 상태 */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {transfer.transfer_number || `TRF-${transfer.id}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {transfer.part_number} - {transfer.part_name}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    {/* 이관 경로 */}
                    <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500">인계</p>
                        <p className="text-sm font-medium text-orange-600 truncate">
                          {transfer.from_company_name || '-'}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500">인수</p>
                        <p className="text-sm font-medium text-green-600 truncate">
                          {transfer.to_company_name || '-'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 하단: 날짜 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        요청일: {transfer.request_date ? format(new Date(transfer.request_date), 'yyyy-MM-dd') : '-'}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                  
                  {/* 승인 대기 중인 경우 액션 버튼 */}
                  {(transfer.status === 'requested' || transfer.status === 'pending') && (
                    <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 flex items-center justify-between">
                      <span className="text-xs text-yellow-700">승인 대기 중</span>
                      <button className="text-xs text-yellow-700 font-medium">
                        상세보기 →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      {moldId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={() => navigate(`/mobile/mold/${moldId}/transfer/new`)}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            새 이관 요청
          </button>
        </div>
      )}
    </div>
  );
}
