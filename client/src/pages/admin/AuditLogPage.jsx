/**
 * 감사 로그 페이지
 * 시스템 변경 이력 조회 및 분석
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Activity, Filter, RefreshCw, Download, Calendar,
  User, FileText, CheckCircle, XCircle, Settings,
  TrendingUp, Clock, Search
} from 'lucide-react';
import api from '../../lib/api';

const ACTION_CONFIG = {
  master_update: { label: '마스터 수정', icon: Settings, color: 'blue' },
  approval: { label: '승인', icon: CheckCircle, color: 'green' },
  rejection: { label: '반려', icon: XCircle, color: 'red' },
  liability_change: { label: '귀책 변경', icon: FileText, color: 'orange' },
  status_change: { label: '상태 변경', icon: Activity, color: 'purple' },
  user_action: { label: '사용자 작업', icon: User, color: 'teal' },
  system_action: { label: '시스템 작업', icon: Settings, color: 'gray' }
};

const ENTITY_TYPES = {
  mold_specification: '금형 사양',
  repair_request: '수리 요청',
  transfer_request: '이관 요청',
  inspection: '점검',
  user: '사용자',
  company: '업체',
  checklist: '체크리스트'
};

export default function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ byAction: [], byUser: [], daily: [] });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0 });

  const actionFilter = searchParams.get('action') || '';
  const entityTypeFilter = searchParams.get('entityType') || '';
  const days = searchParams.get('days') || '30';

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [actionFilter, entityTypeFilter, days]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      params.append('limit', '50');
      
      const response = await api.get(`/audit-log?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.data || []);
        setPagination(response.data.pagination || { total: 0, limit: 50, offset: 0 });
      }
    } catch (error) {
      console.error('감사 로그 조회 에러:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/audit-log/stats?days=${days}`);
      if (response.data.success) {
        setStats(response.data.data || { byAction: [], byUser: [], daily: [] });
      }
    } catch (error) {
      console.error('통계 조회 에러:', error);
    }
  };

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatJson = (jsonString) => {
    if (!jsonString) return '-';
    try {
      const obj = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonString;
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', '시간', '액션', '엔티티', '사용자', '설명'].join(','),
      ...logs.map(log => [
        log.id,
        formatDate(log.created_at),
        ACTION_CONFIG[log.action]?.label || log.action,
        `${ENTITY_TYPES[log.entity_type] || log.entity_type} #${log.entity_id}`,
        log.user_name || '-',
        `"${(log.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-blue-600" />
            감사 로그
          </h1>
          <p className="text-gray-500 mt-1">시스템 변경 이력을 조회하고 분석합니다</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">전체 로그</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">승인 건수</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.byAction?.find(a => a.action === 'approval')?.count || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">반려 건수</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.byAction?.find(a => a.action === 'rejection')?.count || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">마스터 수정</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.byAction?.find(a => a.action === 'master_update')?.count || 0}
              </p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          
          <select
            value={actionFilter}
            onChange={(e) => setFilter('action', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 액션</option>
            {Object.entries(ACTION_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={entityTypeFilter}
            onChange={(e) => setFilter('entityType', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 엔티티</option>
            {Object.entries(ENTITY_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={days}
            onChange={(e) => setFilter('days', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
            <option value="365">최근 1년</option>
          </select>
        </div>
      </div>

      {/* 로그 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">감사 로그가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대상</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => {
                  const actionConfig = ACTION_CONFIG[log.action] || { label: log.action, icon: Activity, color: 'gray' };
                  const ActionIcon = actionConfig.icon;
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActionIcon className={`w-4 h-4 text-${actionConfig.color}-600`} />
                          <span className={`px-2 py-0.5 text-xs rounded bg-${actionConfig.color}-100 text-${actionConfig.color}-700`}>
                            {actionConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="text-gray-900">{ENTITY_TYPES[log.entity_type] || log.entity_type}</span>
                          <span className="text-gray-500 ml-1">#{log.entity_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-gray-900">{log.user_name || '-'}</div>
                          {log.company_name && (
                            <div className="text-xs text-gray-500">{log.company_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                          {log.description || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 사용자별 활동 통계 */}
      {stats.byUser && stats.byUser.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            사용자별 활동 (최근 {days}일)
          </h3>
          <div className="space-y-3">
            {stats.byUser.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-900 truncate">{user.user_name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${Math.min((user.count / stats.byUser[0].count) * 100, 100)}%` }}
                  />
                </div>
                <div className="w-16 text-sm text-gray-500 text-right">{user.count}건</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
