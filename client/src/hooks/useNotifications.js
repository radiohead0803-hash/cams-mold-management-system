import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../lib/api';

/**
 * 알림 관리 훅
 * - 주기적 폴링 (30초)
 * - 페이지 포커스 시 즉시 갱신
 * - 브라우저 알림 지원
 * @returns {Object} 알림 데이터 및 함수들
 */
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevUnreadCountRef = useRef(0);

  /**
   * 알림 목록 조회
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/notifications');
      
      if (response.data.success) {
        setItems(response.data.data.notifications || []);
      }
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
      setError(err.response?.data?.message || '알림을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 알림 읽음 처리
   * @param {number} id - 알림 ID
   */
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      
      // 로컬 상태 업데이트
      setItems(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date() } : n))
      );
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
    }
  }, []);

  /**
   * 모든 알림 읽음 처리
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      
      // 로컬 상태 업데이트
      setItems(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date() }))
      );
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
    }
  }, []);

  /**
   * 알림 삭제
   * @param {number} id - 알림 ID
   */
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      
      // 로컬 상태 업데이트
      setItems(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('[useNotifications] delete error:', err);
    }
  }, []);

  /**
   * 브라우저 알림 표시
   */
  const showBrowserNotification = useCallback((notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `notification-${notification.id}`,
        requireInteraction: notification.priority === 'critical'
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.action_url) {
          window.location.href = notification.action_url;
        }
        browserNotif.close();
      };

      // 5초 후 자동 닫기 (critical 제외)
      if (notification.priority !== 'critical') {
        setTimeout(() => browserNotif.close(), 5000);
      }
    }
  }, []);

  // 초기 로드 및 주기적 갱신
  useEffect(() => {
    fetchNotifications();
    
    // 30초마다 자동 갱신
    const timer = setInterval(fetchNotifications, 30000);
    
    // 페이지 포커스 시 즉시 갱신
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  // 새 알림 도착 시 브라우저 알림 표시
  useEffect(() => {
    const currentUnreadCount = items.filter(n => !n.is_read).length;
    
    // 새 알림이 도착한 경우
    if (currentUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
      const newNotifications = items.filter(n => !n.is_read).slice(0, currentUnreadCount - prevUnreadCountRef.current);
      newNotifications.forEach(showBrowserNotification);
    }
    
    prevUnreadCountRef.current = currentUnreadCount;
  }, [items, showBrowserNotification]);

  // 읽지 않은 알림 개수
  const unreadCount = items.filter(n => !n.is_read).length;

  // 타입별 알림 개수
  const countByType = items.reduce((acc, n) => {
    acc[n.notification_type] = (acc[n.notification_type] || 0) + 1;
    return acc;
  }, {});

  /**
   * 브라우저 알림 권한 요청
   */
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return {
    items,
    loading,
    error,
    unreadCount,
    countByType,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    showBrowserNotification
  };
}
