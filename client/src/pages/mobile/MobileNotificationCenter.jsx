/**
 * MobileNotificationCenter - 알림 센터 전체 목록 페이지
 *
 * - GET /api/v1/notifications?limit=50&offset=0
 * - 무한 스크롤
 * - 알림 유형별 아이콘
 * - 스와이프 삭제 / 모두 읽음
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCheck, Trash2, RefreshCw,
  MapPin, Bell, Wrench, RefreshCcw, CheckCircle,
  AlertTriangle, Megaphone,
} from 'lucide-react';
import api from '../../lib/api';
import { BottomNav } from '../../components/mobile/MobileLayout';

const NOTIFICATION_ICONS = {
  location_moved: { icon: MapPin, color: 'text-purple-600 bg-purple-50' },
  inspection_due: { icon: Bell, color: 'text-blue-600 bg-blue-50' },
  repair_request: { icon: Wrench, color: 'text-orange-600 bg-orange-50' },
  transfer_request: { icon: RefreshCcw, color: 'text-cyan-600 bg-cyan-50' },
  approval_needed: { icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  shot_warning: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  default: { icon: Megaphone, color: 'text-gray-600 bg-gray-100' },
};

const PAGE_SIZE = 50;

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function MobileNotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Touch swipe state
  const [swipingId, setSwipingId] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const swipeThreshold = 80;

  const fetchNotifications = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data } = await api.get('/notifications', {
        params: { limit: PAGE_SIZE, offset: currentOffset },
      });

      const items = data?.data?.items || data?.data || data?.items || [];
      const total = data?.data?.total ?? data?.total ?? 0;

      if (reset) {
        setNotifications(items);
        setOffset(items.length);
      } else {
        setNotifications((prev) => [...prev, ...items]);
        setOffset((prev) => prev + items.length);
      }

      setHasMore(currentOffset + items.length < total);
    } catch (err) {
      console.error('[NotificationCenter] Fetch failed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [offset]);

  // Initial load
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchNotifications(false);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, offset]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(true);
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('[NotificationCenter] Mark all read failed:', err);
    }
  };

  // Delete a single notification
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('[NotificationCenter] Delete failed:', err);
    }
    setSwipingId(null);
    setSwipeX(0);
  };

  // Mark single as read
  const handleRead = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      } catch {
        // Best effort
      }
    }

    // Navigate if there's a link
    if (notification.link || notification.url) {
      navigate(notification.link || notification.url);
    }
  };

  // Swipe handlers
  const handleTouchStart = (e, id) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwipingId(id);
  };

  const handleTouchMove = (e) => {
    if (!swipingId) return;
    const deltaX = touchStartRef.current.x - e.touches[0].clientX;
    const deltaY = Math.abs(touchStartRef.current.y - e.touches[0].clientY);

    // Only allow horizontal swipe
    if (deltaY > 30) {
      setSwipingId(null);
      setSwipeX(0);
      return;
    }

    if (deltaX > 0) {
      setSwipeX(Math.min(deltaX, 120));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX >= swipeThreshold && swipingId) {
      handleDelete(swipingId);
    } else {
      setSwipingId(null);
      setSwipeX(0);
    }
  };

  const getIconConfig = (type) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between h-14 px-4 pt-safe">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">알림 센터</h1>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-sm text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
          >
            <CheckCheck size={16} />
            <span>모두 읽음</span>
          </button>
        </div>
      </header>

      {/* Pull to refresh */}
      {refreshing && (
        <div className="flex items-center justify-center py-3 bg-blue-50">
          <RefreshCw size={16} className="text-blue-600 animate-spin mr-2" />
          <span className="text-sm text-blue-600">새로고침 중...</span>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="px-4 pt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">알림이 없습니다</p>
            <p className="text-xs mt-1">새로운 알림이 오면 여기에 표시됩니다</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-xl font-medium"
            >
              새로고침
            </button>
          </div>
        ) : (
          <div className="px-4 pt-3 space-y-2">
            {notifications.map((n) => {
              const { icon: Icon, color } = getIconConfig(n.type || n.notification_type);
              const isSwiping = swipingId === n.id;

              return (
                <div
                  key={n.id}
                  className="relative overflow-hidden rounded-2xl"
                >
                  {/* Delete backdrop */}
                  <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-2xl">
                    <Trash2 size={20} className="text-white" />
                  </div>

                  {/* Notification card */}
                  <div
                    className={`relative bg-white rounded-2xl p-4 border transition-transform ${
                      n.is_read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
                    }`}
                    style={{
                      transform: isSwiping ? `translateX(-${swipeX}px)` : 'translateX(0)',
                      transition: isSwiping ? 'none' : 'transform 0.3s ease',
                    }}
                    onTouchStart={(e) => handleTouchStart(e, n.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => handleRead(n)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${n.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message || n.body}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {getRelativeTime(n.created_at || n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                <span className="text-sm text-gray-400">불러오는 중...</span>
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <div className="text-center py-4 text-xs text-gray-400">
                모든 알림을 불러왔습니다
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
