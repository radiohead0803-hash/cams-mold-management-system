/**
 * NotificationBell - 헤더용 알림 벨 아이콘 + 미읽음 배지
 *
 * - GET /api/v1/notifications/unread-count 로 미읽음 수 폴링 (30초)
 * - 클릭 시 /mobile/notification-center 이동
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../lib/api';

const POLL_INTERVAL = 30_000; // 30 seconds

export default function NotificationBell({ className = '' }) {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  const fetchCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      const c = data?.count ?? data?.data?.count ?? 0;
      setCount(c);
    } catch {
      // Fail silently - don't disrupt the UI
    }
  };

  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []);

  const displayCount = count > 99 ? '99+' : count;

  return (
    <button
      onClick={() => navigate('/mobile/notification-center')}
      className={`relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors ${className}`}
      aria-label={`알림 ${count > 0 ? `${count}개 미읽음` : ''}`}
    >
      <Bell size={22} className="text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
          {displayCount}
        </span>
      )}
    </button>
  );
}
