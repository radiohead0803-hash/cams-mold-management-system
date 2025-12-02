import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';

/**
 * 알림 관리 훅
 * @returns {Object} 알림 데이터 및 함수들
 */
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // 초기 로드 및 주기적 갱신
  useEffect(() => {
    fetchNotifications();
    
    // 1분마다 자동 갱신
    const timer = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // 읽지 않은 알림 개수
  const unreadCount = items.filter(n => !n.is_read).length;

  // 타입별 알림 개수
  const countByType = items.reduce((acc, n) => {
    acc[n.notification_type] = (acc[n.notification_type] || 0) + 1;
    return acc;
  }, {});

  return {
    items,
    loading,
    error,
    unreadCount,
    countByType,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
