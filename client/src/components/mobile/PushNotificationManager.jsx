/**
 * PushNotificationManager - 푸시 알림 설정 배너/카드
 *
 * States:
 *  - not-supported: 브라우저가 푸시를 지원하지 않음
 *  - permission-default: 아직 권한 요청 전 (opt-in 배너 표시)
 *  - permission-granted + subscribed: 활성화 상태
 *  - permission-denied: 브라우저 설정에서 차단됨 (안내 표시)
 */
import { useState } from 'react';
import { Bell, BellOff, BellRing, X, Info } from 'lucide-react';
import usePushNotification from '../../hooks/usePushNotification';

export default function PushNotificationManager({ onDismiss }) {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotification();

  const [error, setError] = useState(null);

  // Not supported - hide entirely
  if (!isSupported) return null;

  // Already subscribed - show compact "enabled" card
  if (isSubscribed && permission === 'granted') {
    return (
      <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BellRing size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">푸시 알림 활성화됨</p>
              <p className="text-xs text-blue-600">중요한 알림을 실시간으로 받습니다</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setError(null);
              try {
                await unsubscribe();
              } catch (err) {
                setError('해제 실패');
              }
            }}
            disabled={loading}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {loading ? '처리 중...' : '알림 해제'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // Permission denied - show instructions
  if (permission === 'denied') {
    return (
      <div className="mx-4 mt-3 bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BellOff size={20} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-900">알림이 차단되었습니다</p>
            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
              브라우저 설정에서 알림을 허용해 주세요.
              주소표시줄 왼쪽의 자물쇠 아이콘을 눌러 알림 권한을 변경할 수 있습니다.
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-full hover:bg-orange-100 flex-shrink-0"
            >
              <X size={16} className="text-orange-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default state - show opt-in banner
  return (
    <div className="mx-4 mt-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
          <Bell size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">푸시 알림 받기</p>
          <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
            점검 일정, 수리 요청, 승인 알림을 실시간으로 받으세요
          </p>

          {error && (
            <p className="text-xs text-red-200 mt-1.5 flex items-center gap-1">
              <Info size={12} /> {error}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={async () => {
                setError(null);
                try {
                  await subscribe();
                } catch (err) {
                  setError(err.message || '알림 설정에 실패했습니다');
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-white text-blue-600 text-sm font-semibold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? '설정 중...' : '알림 허용'}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-2 text-white/80 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                나중에
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
