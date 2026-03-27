/**
 * usePushNotification - 푸시 알림 구독/해제 관리 훅
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import {
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from '../utils/pwaUtils';

const LS_KEY_SUBSCRIBED = 'cams_push_subscribed';
const LS_KEY_DISMISSED = 'cams_push_banner_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check support and current state on mount
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    // Check cached subscription status first
    const cached = localStorage.getItem(LS_KEY_SUBSCRIBED);
    if (cached === 'true') {
      setIsSubscribed(true);
    }

    // Verify actual subscription with service worker
    checkSubscription();
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await getPushSubscription(registration);
      const subscribed = !!subscription;
      setIsSubscribed(subscribed);
      localStorage.setItem(LS_KEY_SUBSCRIBED, String(subscribed));
    } catch {
      // Fail silently
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get VAPID public key from server
      const { data } = await api.get('/push/vapid-public-key');
      const vapidPublicKey = data.publicKey || data.data?.publicKey;

      if (!vapidPublicKey) {
        throw new Error('VAPID 공개 키를 가져올 수 없습니다.');
      }

      // 2. Request notification permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        throw new Error('알림 권한이 거부되었습니다.');
      }

      // 3. Subscribe via service worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await subscribeToPush(registration, vapidPublicKey);

      if (!subscription) {
        throw new Error('푸시 구독에 실패했습니다.');
      }

      // 4. Send subscription to server
      await api.post('/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      localStorage.setItem(LS_KEY_SUBSCRIBED, 'true');
      // Clear dismiss timestamp on successful subscribe
      localStorage.removeItem(LS_KEY_DISMISSED);

      return true;
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await getPushSubscription(registration);

      if (subscription) {
        // Notify server first
        try {
          await api.post('/push/unsubscribe', {
            endpoint: subscription.endpoint,
          });
        } catch {
          // Server notification is best-effort
        }

        await unsubscribeFromPush(registration);
      }

      setIsSubscribed(false);
      localStorage.setItem(LS_KEY_SUBSCRIBED, 'false');

      return true;
    } catch (err) {
      console.error('[Push] Unsubscribe failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Banner dismiss logic
  const isBannerDismissed = useCallback(() => {
    const dismissed = localStorage.getItem(LS_KEY_DISMISSED);
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    if (isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  }, []);

  const dismissBanner = useCallback(() => {
    localStorage.setItem(LS_KEY_DISMISSED, String(Date.now()));
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    checkSubscription,
    isBannerDismissed,
    dismissBanner,
  };
}
