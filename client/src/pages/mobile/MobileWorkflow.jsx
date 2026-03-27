/**
 * 모바일 통합 워크플로우 페이지
 * 수리/이관/폐기 워크플로우 통합 관리
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, Wrench, Truck, Trash2,
  ChevronRight, Clock, CheckCircle, AlertTriangle,
  XCircle, ArrowRight, Calendar, Package
} from 'lucide-react';
import api from '../../lib/api';

const WORKFLOW_TABS = [
  { key: 'repair', label: '수리', icon: Wrench, color: 'text-red-500' },
  { key: 'transfer', label: '이관', icon: Truck, color: 'text-blue-500' },
  { key: 'scrap', label: '폐기', icon: Trash2, color: 'text-gray-500' },
];

export default function MobileWorkflow() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('repair');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkflowData();
  }, [activeTab]);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      setError('');

      // Try workflow summary endpoint first
      let summaryData = null;
      try {
        const summaryRes = await api.get('/workflow/summary');
        summaryData = summaryRes.data?.data || summaryRes.data || null;
        if (summaryData) setSummary(summaryData);
      } catch {
        // Fallback: build summary from individual endpoints
      }

      // Fetch items based on active tab
      let itemsData = [];
      try {
        if (activeTab === 'repair') {
          const res = await api.get('/repair-requests', { params: { limit: 50 } });
          const data = res.data?.data || res.data || [];
          itemsData = Array.isArray(data) ? data : data.items || data.repairs || [];
        } else if (activeTab === 'transfer') {
          const res = await api.get('/transfers', { params: { limit: 50 } });
          const data = res.data?.data || res.data || [];
          itemsData = Array.isArray(data) ? data : data.items || data.transfers || [];
        } else if (activeTab === 'scrap') {
          const res = await api.get('/scrapping', { params: { limit: 50 } });
          const data = res.data?.data || res.data || [];
          itemsData = Array.isArray(data) ? data : data.items || data.requests || [];
        }
      } catch (err) {
        console.error(`${activeTab} 데이터 조회 실패:`, err);
      }

      setItems(itemsData);
    } catch (err) {
      console.error('워크플로우 데이터 조회 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      requested: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '요청', icon: Clock },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '대기', icon: Clock },
      approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: '승인', icon: CheckCircle },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: '진행중', icon: ArrowRight },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '완료', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '반려', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: '취소', icon: XCircle },
    };
    return configs[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || '-', icon: Clock };
  };

  const getTabSummary = (tabKey) => {
    if (!summary) return null;
    const tabSummary = summary[tabKey] || summary[`${tabKey}s`] || {};
    return {
      total: tabSummary.total || 0,
      pending: tabSummary.pending || tabSummary.requested || 0,
      in_progress: tabSummary.in_progress || 0,
      completed: tabSummary.completed || 0,
    };
  };

  const getItemDetail = (item) => {
    if (activeTab === 'repair') {
      return {
        title: item.title || item.repair_type || '수리 요청',
        moldInfo: item.mold_number || item.mold?.mold_number || '-',
        date: item.request_date || item.created_at?.split('T')[0] || '-',
        status: item.status,
        id: item.id || item.repair_id,
        detailPath: `/mobile/mold/${item.mold_id || item.mold?.id}/repair-request`,
      };
    } else if (activeTab === 'transfer') {
      return {
        title: item.title || '이관 요청',
        moldInfo: item.mold_number || item.mold?.mold_number || '-',
        date: item.request_date || item.transfer_date || item.created_at?.split('T')[0] || '-',
        status: item.status,
        id: item.id || item.transfer_id,
        detailPath: `/mobile/mold/${item.mold_id || item.mold?.id}/transfer`,
        extra: item.from_location && item.to_location
          ? `${item.from_location} → ${item.to_location}`
          : null,
      };
    } else {
      return {
        title: item.title || item.reason || '폐기 요청',
        moldInfo: item.mold_number || item.mold?.mold_number || '-',
        date: item.request_date || item.scrap_date || item.created_at?.split('T')[0] || '-',
        status: item.status,
        id: item.id || item.scrap_id,
        detailPath: `/mobile/scrapping/${item.id || item.scrap_id}`,
      };
    }
  };

  const currentTabSummary = getTabSummary(activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">통합 워크플로우</h1>
          </div>
          <button onClick={fetchWorkflowData} className="p-2">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-100">
          {WORKFLOW_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? `${tab.color} border-current`
                    : 'text-gray-400 border-transparent'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Summary Stat Cards */}
        {currentTabSummary && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '전체', value: currentTabSummary.total, color: 'text-gray-900' },
              { label: '대기', value: currentTabSummary.pending, color: 'text-yellow-600' },
              { label: '진행중', value: currentTabSummary.in_progress, color: 'text-blue-600' },
              { label: '완료', value: currentTabSummary.completed, color: 'text-green-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm p-3 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const detail = getItemDetail(item);
              const statusConfig = getStatusConfig(detail.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={detail.id || idx}
                  onClick={() => navigate(detail.detailPath)}
                  className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {detail.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{detail.moldInfo}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {detail.extra && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mb-1">
                      <ArrowRight className="w-3 h-3" />
                      <span>{detail.extra}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{detail.date}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            {activeTab === 'repair' && <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
            {activeTab === 'transfer' && <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
            {activeTab === 'scrap' && <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
            <p className="text-sm text-gray-400">
              {activeTab === 'repair' && '수리 요청이 없습니다'}
              {activeTab === 'transfer' && '이관 요청이 없습니다'}
              {activeTab === 'scrap' && '폐기 요청이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
