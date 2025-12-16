/**
 * 오프라인 동기화 훅
 * - 온라인 복귀 시 자동 큐 처리
 * - 동기화 상태 관리
 */
import { useState, useEffect, useCallback } from 'react';
import { offlineQueue, isOnline, onOnlineStatusChange } from '../utils/mobileStorage';
import api from '../lib/api';

export default function useOfflineSync() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // 대기 중인 항목 수 업데이트
  const updatePendingCount = useCallback(async () => {
    try {
      const items = await offlineQueue.getAll();
      setPendingCount(items.length);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // 큐 처리
  const processQueue = useCallback(async () => {
    if (syncing || !online) return;

    const items = await offlineQueue.getAll();
    if (items.length === 0) return;

    setSyncing(true);
    const results = { success: 0, failed: 0, errors: [] };

    for (const item of items) {
      try {
        const method = item.method.toLowerCase();
        
        if (method === 'get') {
          await api.get(item.endpoint, { params: item.data });
        } else if (method === 'post') {
          await api.post(item.endpoint, item.data);
        } else if (method === 'put') {
          await api.put(item.endpoint, item.data);
        } else if (method === 'patch') {
          await api.patch(item.endpoint, item.data);
        } else if (method === 'delete') {
          await api.delete(item.endpoint, { data: item.data });
        }

        await offlineQueue.remove(item.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          id: item.id,
          type: item.type,
          error: error.message
        });

        // 재시도 횟수 증가
        if (item.retryCount < 3) {
          // 재시도 가능 - 나중에 다시 시도
          console.log(`Retry later: ${item.type} (attempt ${item.retryCount + 1})`);
        } else {
          // 최대 재시도 초과 - 큐에서 제거
          await offlineQueue.remove(item.id);
          console.error(`Max retries exceeded for: ${item.type}`);
        }
      }
    }

    setSyncing(false);
    setLastSyncResult(results);
    await updatePendingCount();

    return results;
  }, [syncing, online, updatePendingCount]);

  // 오프라인 요청 추가
  const addToQueue = useCallback(async (type, endpoint, method, data) => {
    if (online) {
      // 온라인이면 바로 요청
      try {
        const m = method.toLowerCase();
        if (m === 'get') {
          return await api.get(endpoint, { params: data });
        } else if (m === 'post') {
          return await api.post(endpoint, data);
        } else if (m === 'put') {
          return await api.put(endpoint, data);
        } else if (m === 'patch') {
          return await api.patch(endpoint, data);
        } else if (m === 'delete') {
          return await api.delete(endpoint, { data });
        }
      } catch (error) {
        // 요청 실패 시 큐에 추가
        if (!error.response) {
          // 네트워크 오류인 경우만 큐에 추가
          await offlineQueue.add(type, endpoint, method, data);
          await updatePendingCount();
          throw new Error('오프라인 상태입니다. 요청이 저장되었습니다.');
        }
        throw error;
      }
    } else {
      // 오프라인이면 큐에 추가
      await offlineQueue.add(type, endpoint, method, data);
      await updatePendingCount();
      return { queued: true, message: '오프라인 상태입니다. 요청이 저장되었습니다.' };
    }
  }, [online, updatePendingCount]);

  // 온라인 상태 변경 감지
  useEffect(() => {
    const cleanup = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline);
      
      // 온라인 복귀 시 자동 동기화
      if (isOnline) {
        processQueue();
      }
    });

    // 초기 대기 항목 수 확인
    updatePendingCount();

    return cleanup;
  }, [processQueue, updatePendingCount]);

  // 주기적 동기화 (5분마다)
  useEffect(() => {
    if (!online) return;

    const interval = setInterval(() => {
      processQueue();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [online, processQueue]);

  return {
    online,
    syncing,
    pendingCount,
    lastSyncResult,
    processQueue,
    addToQueue,
    updatePendingCount
  };
}

// 동기화 상태 표시 컴포넌트
export function SyncStatus({ online, syncing, pendingCount, onSync }) {
  if (online && pendingCount === 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm flex items-center justify-between ${
      online ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {!online ? (
          <>
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>오프라인 모드</span>
          </>
        ) : syncing ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>동기화 중...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <span className="w-2 h-2 bg-white rounded-full" />
            <span>대기 중인 요청: {pendingCount}개</span>
          </>
        ) : null}
      </div>
      
      {online && pendingCount > 0 && !syncing && (
        <button
          onClick={onSync}
          className="px-3 py-1 bg-white/20 rounded text-xs"
        >
          지금 동기화
        </button>
      )}
    </div>
  );
}
