/**
 * 관리자용 알림 센터 페이지
 * 전체 알림 이력 조회 및 관리
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Bell, CheckCircle, AlertTriangle, Info, XCircle,
  Filter, RefreshCw, Trash2, CheckSquare, Clock,
  ChevronDown, Search, Calendar
} from 'lucide-react';
import api from '../../lib/api';

const NOTIFICATION_TYPES = {
  inspection_due: { label: '점검 예정', icon: Clock, color: 'blue' },
  inspection_overdue: { label: '점검 지연', icon: AlertTriangle, color: 'red' },
  shot_warning: { label: '타수 경고', icon: AlertTriangle, color: 'orange' },
  shot_limit: { label: '타수 한계', icon: XCircle, color: 'red' },
  gps_deviation: { label: 'GPS 이탈', icon: AlertTriangle, color: 'purple' },
  approval_request: { label: '승인 요청', icon: CheckSquare, color: 'teal' },
  approval_complete: { label: '승인 완료', icon: CheckCircle, color: 'green' },
  repair_request: { label: '수리 요청', icon: AlertTriangle, color: 'orange' },
  transfer_request: { label: '이관 요청', icon: Info, color: 'blue' },
  system: { label: '시스템', icon: Info, color: 'gray' }
};

const PRIORITY_CONFIG = {
  critical: { label: '긴급', color: 'red' },
  high: { label: '높음', color: 'orange' },
  normal: { label: '보통', color: 'blue' },
  low: { label: '낮음', color: 'gray' }
};

export default function NotificationCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, byType: {} });
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const typeFilter = searchParams.get('type') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const readFilter = searchParams.get('read') || '';

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, priorityFilter, readFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      if (response.data.success) {
        const data = response.data.data;
        setNotifications(data.notifications || []);
        setStats({
          total: data.total || 0,
          unread: data.unreadCount || 0,
          byType: data.byType || {}
        });
      }
    } catch (error) {
      console.error('알림 조회 에러:', error);
      // 에러 시 빈 배열 유지
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('읽음 처리 에러:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('전체 읽음 처리 에러:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('삭제 에러:', error);
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/notifications/${id}/read`)));
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      console.error('일괄 읽음 처리 에러:', error);
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

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.mold_code?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-blue-600" />
            알림 센터
          </h1>
          <p className="text-gray-500 mt-1">시스템 알림을 관리하고 이력을 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            전체 읽음
          </button>
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">전체 알림</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-3xl font-bold text-red-600">{stats.unread}</div>
          <div className="text-sm text-gray-500">읽지 않음</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-3xl font-bold text-orange-600">
            {notifications.filter(n => n.priority === 'critical' || n.priority === 'high').length}
          </div>
          <div className="text-sm text-gray-500">긴급/높음</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-3xl font-bold text-green-600">
            {stats.total - stats.unread}
          </div>
          <div className="text-sm text-gray-500">읽음</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 검색 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="알림 검색..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 유형 필터 */}
          <select
            value={typeFilter}
            onChange={(e) => setFilter('type', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 유형</option>
            {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 우선순위 필터 */}
          <select
            value={priorityFilter}
            onChange={(e) => setFilter('priority', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 우선순위</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 읽음 상태 필터 */}
          <select
            value={readFilter}
            onChange={(e) => setFilter('read', e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="unread">읽지 않음</option>
            <option value="read">읽음</option>
          </select>
        </div>
      </div>

      {/* 일괄 작업 */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-700">{selectedIds.length}개 선택됨</span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkMarkAsRead}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              읽음 처리
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 알림 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* 헤더 */}
            <div className="px-4 py-3 bg-gray-50 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-xs font-medium text-gray-500 uppercase">알림 목록</span>
            </div>
            
            {/* 알림 항목 */}
            {filteredNotifications.map((notification) => {
              const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
              const priorityConfig = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.normal;
              const Icon = typeConfig.icon;
              const isSelected = selectedIds.includes(notification.id);
              
              return (
                <div
                  key={notification.id}
                  className={`px-4 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(notification.id)}
                    className="w-4 h-4 rounded border-gray-300 mt-1"
                  />
                  
                  <div className={`p-2 rounded-lg bg-${typeConfig.color}-100 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${typeConfig.color}-600`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title || '알림'}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs rounded bg-${priorityConfig.color}-100 text-${priorityConfig.color}-700`}>
                        {priorityConfig.label}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {notification.message || '내용 없음'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{typeConfig.label}</span>
                      {notification.mold_code && <span>금형: {notification.mold_code}</span>}
                      <span>{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="읽음 처리"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
