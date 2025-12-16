/**
 * 모바일 공통 레이아웃
 * - Safe-area 대응 (iOS)
 * - 하단 고정 CTA
 * - 모바일 전용 Header
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home, QrCode, Bell, User, Menu } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

// 하단 고정 CTA 버튼
export function BottomCTA({ children, className = '' }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    // 키보드 오픈 감지 (viewport 높이 변화)
    const handleResize = () => {
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75;
      setKeyboardOpen(isKeyboard);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (keyboardOpen) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe ${className}`}>
      {children}
    </div>
  );
}

// 모바일 헤더
export function MobileHeader({ 
  title, 
  showBack = true, 
  showHome = false,
  rightAction = null,
  onBack = null,
  transparent = false
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`sticky top-0 z-50 ${transparent ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <div className="flex items-center justify-between h-14 px-4 pt-safe">
        <div className="flex items-center gap-2">
          {showBack && (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {showHome && (
            <button 
              onClick={() => navigate('/mobile/home')}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center">
          {title}
        </h1>
        
        <div className="flex items-center gap-1">
          {rightAction}
        </div>
      </div>
    </header>
  );
}

// 하단 네비게이션 바
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { icon: Home, label: '홈', path: '/mobile/home' },
    { icon: QrCode, label: 'QR스캔', path: '/qr/scan' },
    { icon: Bell, label: '알림', path: '/mobile/alerts' },
    { icon: User, label: '내정보', path: '/mobile/profile' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive(item.path) ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// 진행률 바
export function ProgressBar({ current, total, label = '' }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="bg-white px-4 py-3 border-b">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-blue-600">{current}/{total} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 퀵 액션 버튼
export function QuickActionButton({ icon: Icon, label, onClick, color = 'blue', badge = 0 }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 relative active:scale-95 transition-transform"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-medium text-gray-700 mt-2">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// 상태 요약 카드
export function StatusCard({ title, value, subtitle, icon: Icon, color = 'blue', onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border ${colorClasses[color]} text-left active:scale-98 transition-transform`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-50" />}
      </div>
    </button>
  );
}

// GPS 상태 표시
export function GPSStatus({ accuracy, isActive = true }) {
  const getStatus = () => {
    if (!isActive) return { label: '비활성', color: 'gray' };
    if (!accuracy) return { label: '측정중...', color: 'yellow' };
    if (accuracy <= 10) return { label: '정확', color: 'green' };
    if (accuracy <= 50) return { label: '보통', color: 'yellow' };
    return { label: '부정확', color: 'red' };
  };

  const status = getStatus();
  const colorClasses = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-500'
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colorClasses[status.color]}`}>
      <div className={`w-2 h-2 rounded-full ${status.color === 'green' ? 'bg-green-500' : status.color === 'yellow' ? 'bg-yellow-500' : status.color === 'red' ? 'bg-red-500' : 'bg-gray-400'}`} />
      <span>GPS {status.label}</span>
      {accuracy && <span>({Math.round(accuracy)}m)</span>}
    </div>
  );
}

// QR 세션 타이머
export function SessionTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('만료됨');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}시간 ${minutes}분`);
      } else {
        setTimeLeft(`${minutes}분`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpiringSoon = () => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    return diff > 0 && diff < 30 * 60 * 1000; // 30분 이내
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
      isExpiringSoon() ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
    }`}>
      <span>세션: {timeLeft}</span>
    </div>
  );
}

// 이탈 방지 훅
export function usePreventLeave(isDirty, message = '작성 중인 내용이 있습니다. 페이지를 떠나시겠습니까?') {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);
}

// 숫자 입력 포맷터
export function formatNumber(value) {
  if (!value) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parseNumber(value) {
  if (!value) return 0;
  return parseInt(value.toString().replace(/,/g, ''), 10) || 0;
}

export default {
  BottomCTA,
  MobileHeader,
  BottomNav,
  ProgressBar,
  QuickActionButton,
  StatusCard,
  GPSStatus,
  SessionTimer,
  usePreventLeave,
  formatNumber,
  parseNumber
};
