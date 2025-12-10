import { Bell, X, Check, MapPin, AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

/**
 * 알림 타입별 아이콘 및 색상
 */
const NOTIFICATION_CONFIG = {
  location_moved: {
    icon: MapPin,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: '위치 이탈'
  },
  location_back: {
    icon: MapPin,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: '위치 복귀'
  },
  ng_detected: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'NG 발생'
  },
  repair_status: {
    icon: Wrench,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: '수리 상태'
  },
  inspection_due: {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: '점검 예정'
  },
  // 새로운 알림 타입들
  inspection_due_shots: {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: '타수 점검'
  },
  inspection_due_date: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: '일자 점검'
  },
  pre_production_checklist_reminder: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: '제작전 체크리스트'
  },
  pre_production_checklist_submitted: {
    icon: Bell,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: '체크리스트 제출'
  },
  pre_production_checklist_approved: {
    icon: Bell,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: '체크리스트 승인'
  },
  pre_production_checklist_rejected: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: '체크리스트 반려'
  },
  scrapping_requested: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: '폐기 요청'
  },
  scrapping_approved: {
    icon: Bell,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: '폐기 승인'
  },
  maintenance_due: {
    icon: Wrench,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: '유지보전 예정'
  },
  transfer_4m_required: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: '4M 체크리스트'
  },
  liability_negotiation: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: '귀책 협의'
  }
};

/**
 * 시간 포맷팅 (상대 시간)
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/**
 * 알림 벨 아이콘 컴포넌트
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    items, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  /**
   * 알림 클릭 핸들러
   */
  const handleNotificationClick = async (notification) => {
    // 읽음 처리
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // 액션 URL로 이동
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  /**
   * 알림 삭제 핸들러
   */
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        
        {/* 읽지 않은 알림 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[11px] font-semibold text-white flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">알림</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {loading && (
                <span className="text-xs text-gray-400">불러오는 중...</span>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  모두 읽음
                </button>
              )}
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-[480px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">새로운 알림이 없습니다</p>
              </div>
            ) : (
              items.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.notification_type] || {
                  icon: Bell,
                  color: 'text-gray-600',
                  bgColor: 'bg-gray-50',
                  label: '알림'
                };
                const Icon = config.icon;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* 아이콘 */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          
                          {notification.is_read && (
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="삭제"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* 푸터 */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                navigate('/notifications');
                setOpen(false);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              모든 알림 보기
            </button>
            <button
              onClick={() => {
                navigate('/notification-settings');
                setOpen(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium py-1"
            >
              설정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
