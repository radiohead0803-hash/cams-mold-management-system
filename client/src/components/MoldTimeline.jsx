/**
 * 금형 Life-cycle 타임라인 컴포넌트
 */
import { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, Wrench, Truck, Trash2, 
  MapPin, FileText, AlertTriangle, Package,
  RefreshCw, Filter, ChevronDown
} from 'lucide-react';
import api from '../lib/api';

const EVENT_CONFIG = {
  created: { icon: Package, color: 'blue', label: '금형 등록' },
  status_changed: { icon: AlertTriangle, color: 'orange', label: '상태 변경' },
  inspection_daily: { icon: CheckCircle, color: 'green', label: '일상점검' },
  inspection_periodic: { icon: CheckCircle, color: 'teal', label: '정기점검' },
  inspection_cleaning: { icon: CheckCircle, color: 'cyan', label: '세척' },
  inspection_greasing: { icon: CheckCircle, color: 'emerald', label: '습합' },
  repair_requested: { icon: Wrench, color: 'orange', label: '수리 요청' },
  repair_started: { icon: Wrench, color: 'yellow', label: '수리 시작' },
  repair_completed: { icon: Wrench, color: 'green', label: '수리 완료' },
  transfer_requested: { icon: Truck, color: 'blue', label: '이관 요청' },
  transfer_approved: { icon: Truck, color: 'teal', label: '이관 승인' },
  transfer_completed: { icon: Truck, color: 'green', label: '이관 완료' },
  scrapping_requested: { icon: Trash2, color: 'red', label: '폐기 요청' },
  scrapping_approved: { icon: Trash2, color: 'orange', label: '폐기 승인' },
  scrapping_completed: { icon: Trash2, color: 'gray', label: '폐기 완료' },
  shot_count_updated: { icon: Clock, color: 'purple', label: '타수 업데이트' },
  location_changed: { icon: MapPin, color: 'indigo', label: '위치 변경' },
  specification_updated: { icon: FileText, color: 'blue', label: '사양 변경' },
  document_uploaded: { icon: FileText, color: 'gray', label: '문서 업로드' },
  approval_requested: { icon: CheckCircle, color: 'yellow', label: '승인 요청' },
  approval_completed: { icon: CheckCircle, color: 'green', label: '승인 완료' },
  note_added: { icon: FileText, color: 'gray', label: '메모 추가' }
};

export default function MoldTimeline({ moldId, moldCode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (moldId) {
      fetchEvents();
    }
  }, [moldId, filter]);

  const fetchEvents = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentPage = loadMore ? page + 1 : 1;
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', 20);
      if (filter) params.append('type', filter);

      const response = await api.get(`/mold-events/${moldId}?${params.toString()}`);
      if (response.data.success) {
        const newEvents = response.data.data.events;
        if (loadMore) {
          setEvents(prev => [...prev, ...newEvents]);
        } else {
          setEvents(newEvents);
        }
        setPage(currentPage);
        setHasMore(newEvents.length === 20);
      }
    } catch (error) {
      console.error('이벤트 조회 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return '';
  };

  return (
    <div className="bg-white rounded-xl border">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">금형 이력 타임라인</h3>
          {moldCode && <p className="text-sm text-gray-500">{moldCode}</p>}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 이벤트</option>
            <option value="inspection_daily">일상점검</option>
            <option value="inspection_periodic">정기점검</option>
            <option value="repair_requested">수리</option>
            <option value="transfer_requested">이관</option>
            <option value="status_changed">상태 변경</option>
          </select>
          <button
            onClick={() => fetchEvents()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="p-6">
        {loading && events.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">기록된 이벤트가 없습니다</p>
          </div>
        ) : (
          <div className="relative">
            {/* 타임라인 선 */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* 이벤트 목록 */}
            <div className="space-y-6">
              {events.map((event, index) => {
                const config = EVENT_CONFIG[event.event_type] || { icon: Clock, color: 'gray', label: event.event_type };
                const Icon = config.icon;
                
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* 아이콘 */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-${config.color}-100 flex items-center justify-center border-4 border-white shadow-sm`}>
                      <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded bg-${config.color}-100 text-${config.color}-700`}>
                              {config.label}
                            </span>
                            <span className="font-medium text-gray-900">{event.title}</span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          {(event.previous_value || event.new_value) && (
                            <div className="text-xs text-gray-500 mt-2">
                              {event.previous_value && <span className="line-through mr-2">{event.previous_value}</span>}
                              {event.new_value && <span className="text-green-600">→ {event.new_value}</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-400 flex-shrink-0 ml-4">
                          <div>{formatDate(event.created_at)}</div>
                          <div>{formatRelativeTime(event.created_at)}</div>
                        </div>
                      </div>
                      {event.actor_name && (
                        <div className="mt-2 text-xs text-gray-500">
                          수행: {event.actor_name} {event.actor_company && `(${event.actor_company})`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 더 보기 */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => fetchEvents(true)}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                >
                  {loading ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
