import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, Wrench, Trash2, AlertTriangle, 
  CheckCircle, Clock, TrendingUp, Calendar, Package,
  FileCheck, Cog, Bell, ArrowRight
} from 'lucide-react';
import api from '../lib/api';

/**
 * 제작전 체크리스트 위젯
 */
export function PreProductionChecklistWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState({ draft: 0, submitted: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/pre-production-checklist', { params: { limit: 100 } });
      const items = response.data.data.items || [];
      const counts = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      setData(counts);
    } catch (error) {
      console.error('Failed to load checklist data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileCheck size={20} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">제작전 체크리스트</h3>
        </div>
        <button
          onClick={() => navigate('/pre-production-checklist')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{data.draft || 0}</div>
          <div className="text-xs text-gray-500">작성중</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.submitted || 0}</div>
          <div className="text-xs text-blue-600">제출됨</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.approved || 0}</div>
          <div className="text-xs text-green-600">승인됨</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{data.rejected || 0}</div>
          <div className="text-xs text-red-600">반려됨</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 유지보전 위젯
 */
export function MaintenanceWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/maintenance/statistics');
      setData(response.data.data.by_type?.slice(0, 4) || []);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const TYPE_LABELS = {
    '정기점검': '정기점검',
    '세척': '세척',
    '윤활': '윤활',
    '습합': '습합',
    '수리': '수리',
    '부품교체': '부품교체'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Cog size={20} className="text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900">유지보전 현황</h3>
        </div>
        <button
          onClick={() => navigate('/maintenance')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">데이터 없음</div>
        ) : (
          data.map((item) => (
            <div key={item.maintenance_type} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">
                {TYPE_LABELS[item.maintenance_type] || item.maintenance_type}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{item.count}건</span>
                {item.total_cost > 0 && (
                  <span className="text-xs text-gray-500">
                    ({(item.total_cost / 10000).toFixed(0)}만원)
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 금형 폐기 위젯
 */
export function ScrappingWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/scrapping/statistics');
      setData(response.data.data.by_status || []);
    } catch (error) {
      console.error('Failed to load scrapping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_CONFIG = {
    requested: { label: '요청됨', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    first_approved: { label: '1차승인', color: 'text-blue-600', bg: 'bg-blue-50' },
    approved: { label: '승인완료', color: 'text-green-600', bg: 'bg-green-50' },
    scrapped: { label: '폐기완료', color: 'text-gray-600', bg: 'bg-gray-100' },
    rejected: { label: '반려', color: 'text-red-600', bg: 'bg-red-50' }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const pendingCount = data.filter(d => ['requested', 'first_approved'].includes(d.status))
    .reduce((sum, d) => sum + parseInt(d.count), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">금형 폐기</h3>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {pendingCount}건 대기
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/scrapping')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {data.map((item) => {
          const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.requested;
          return (
            <div key={item.status} className={`px-3 py-2 rounded-lg ${config.bg}`}>
              <div className={`text-lg font-bold ${config.color}`}>{item.count}</div>
              <div className="text-xs text-gray-500">{config.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 알림 요약 위젯
 */
export function AlertSummaryWidget() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/alerts', { params: { limit: 5, is_read: false } });
      setAlerts(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Bell size={20} className="text-yellow-600" />
          </div>
          <h3 className="font-semibold text-gray-900">최근 알림</h3>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/alerts')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">새 알림 없음</div>
        ) : (
          alerts.slice(0, 3).map((alert) => (
            <div 
              key={alert.id} 
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate('/alerts')}
            >
              <AlertTriangle size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{alert.title}</div>
                <div className="text-xs text-gray-500 truncate">{alert.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 점검 예정 위젯
 */
export function InspectionDueWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState({ shots: 0, date: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/alerts', { 
        params: { limit: 100, alert_type: 'inspection_due' } 
      });
      const items = response.data.data.items || [];
      setData({
        shots: items.filter(i => i.trigger_type === 'shots').length,
        date: items.filter(i => i.trigger_type === 'date').length,
        total: items.length
      });
    } catch (error) {
      console.error('Failed to load inspection data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Calendar size={20} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">점검 예정</h3>
        </div>
        <button
          onClick={() => navigate('/inspection/periodic')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.shots || 0}</div>
          <div className="text-xs text-blue-600">타수 기준</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.date || 0}</div>
          <div className="text-xs text-purple-600">일자 기준</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 수리 현황 위젯
 */
export function RepairWidget() {
  const navigate = useNavigate();
  const [data, setData] = useState({ requested: 0, in_progress: 0, completed: 0, liability: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/repair-requests', { params: { limit: 100 } });
      const items = response.data.data?.items || response.data.data || [];
      const counts = items.reduce((acc, item) => {
        if (item.status === 'requested') acc.requested++;
        else if (item.status === 'in_progress' || item.status === 'repairing') acc.in_progress++;
        else if (item.status === 'completed') acc.completed++;
        if (item.liability_status === 'pending') acc.liability++;
        return acc;
      }, { requested: 0, in_progress: 0, completed: 0, liability: 0 });
      setData(counts);
    } catch (error) {
      console.error('Failed to load repair data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Wrench size={20} className="text-amber-600" />
          </div>
          <h3 className="font-semibold text-gray-900">수리 현황</h3>
        </div>
        <button
          onClick={() => navigate('/repairs')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{data.requested}</div>
          <div className="text-xs text-yellow-600">요청</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.in_progress}</div>
          <div className="text-xs text-blue-600">진행중</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.completed}</div>
          <div className="text-xs text-green-600">완료</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.liability}</div>
          <div className="text-xs text-orange-600">귀책협의</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 대시보드 위젯 그리드
 */
export default function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PreProductionChecklistWidget />
      <MaintenanceWidget />
      <ScrappingWidget />
      <RepairWidget />
      <AlertSummaryWidget />
      <InspectionDueWidget />
    </div>
  );
}
