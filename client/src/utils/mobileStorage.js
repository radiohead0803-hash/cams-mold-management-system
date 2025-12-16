/**
 * 모바일 임시저장 유틸리티
 * - IndexedDB 기반 오프라인 저장
 * - 점검 임시저장
 * - 오프라인 큐잉
 */

const DB_NAME = 'cams_mobile_db';
const DB_VERSION = 1;

// IndexedDB 초기화
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 점검 임시저장
      if (!db.objectStoreNames.contains('inspection_drafts')) {
        const store = db.createObjectStore('inspection_drafts', { keyPath: 'id' });
        store.createIndex('moldId', 'moldId', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 오프라인 요청 큐
      if (!db.objectStoreNames.contains('offline_queue')) {
        const store = db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 최근 작업 기록
      if (!db.objectStoreNames.contains('recent_actions')) {
        const store = db.createObjectStore('recent_actions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('moldId', 'moldId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// 점검 임시저장
export const inspectionDraft = {
  async save(moldId, type, data) {
    const db = await openDB();
    const tx = db.transaction('inspection_drafts', 'readwrite');
    const store = tx.objectStore('inspection_drafts');

    const draft = {
      id: `${moldId}_${type}`,
      moldId,
      type,
      data,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve(draft);
      request.onerror = () => reject(request.error);
    });
  },

  async load(moldId, type) {
    const db = await openDB();
    const tx = db.transaction('inspection_drafts', 'readonly');
    const store = tx.objectStore('inspection_drafts');

    return new Promise((resolve, reject) => {
      const request = store.get(`${moldId}_${type}`);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(moldId, type) {
    const db = await openDB();
    const tx = db.transaction('inspection_drafts', 'readwrite');
    const store = tx.objectStore('inspection_drafts');

    return new Promise((resolve, reject) => {
      const request = store.delete(`${moldId}_${type}`);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll() {
    const db = await openDB();
    const tx = db.transaction('inspection_drafts', 'readonly');
    const store = tx.objectStore('inspection_drafts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
};

// 오프라인 큐
export const offlineQueue = {
  async add(type, endpoint, method, data) {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');

    const item = {
      type,
      endpoint,
      method,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve({ ...item, id: request.result });
      request.onerror = () => reject(request.error);
    });
  },

  async getAll() {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async remove(id) {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async processQueue(apiClient) {
    const items = await this.getAll();
    const results = [];

    for (const item of items) {
      try {
        await apiClient[item.method.toLowerCase()](item.endpoint, item.data);
        await this.remove(item.id);
        results.push({ id: item.id, success: true });
      } catch (error) {
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    return results;
  }
};

// 최근 작업 기록
export const recentActions = {
  async add(moldId, moldNumber, actionType, description) {
    const db = await openDB();
    const tx = db.transaction('recent_actions', 'readwrite');
    const store = tx.objectStore('recent_actions');

    const action = {
      moldId,
      moldNumber,
      actionType,
      description,
      timestamp: new Date().toISOString()
    };

    // 최대 20개 유지
    const all = await this.getAll();
    if (all.length >= 20) {
      const oldest = all[all.length - 1];
      await new Promise((resolve) => {
        const delReq = store.delete(oldest.id);
        delReq.onsuccess = () => resolve();
      });
    }

    return new Promise((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve({ ...action, id: request.result });
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(limit = 10) {
    const db = await openDB();
    const tx = db.transaction('recent_actions', 'readonly');
    const store = tx.objectStore('recent_actions');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    const db = await openDB();
    const tx = db.transaction('recent_actions', 'readwrite');
    const store = tx.objectStore('recent_actions');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
};

// 온라인 상태 확인
export function isOnline() {
  return navigator.onLine;
}

// 온라인 상태 변경 리스너
export function onOnlineStatusChange(callback) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));

  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
}

export default {
  inspectionDraft,
  offlineQueue,
  recentActions,
  isOnline,
  onOnlineStatusChange
};
