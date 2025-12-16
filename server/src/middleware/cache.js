/**
 * 간단한 인메모리 캐시 미들웨어
 * - API 응답 캐싱
 * - TTL 기반 자동 만료
 * - 수동 캐시 무효화
 */

const cache = new Map();

/**
 * 캐시 설정
 */
const CACHE_CONFIG = {
  // 캐시 TTL (밀리초)
  DEFAULT_TTL: 60 * 1000, // 1분
  DASHBOARD_TTL: 30 * 1000, // 30초
  STATISTICS_TTL: 5 * 60 * 1000, // 5분
  MOLD_LIST_TTL: 2 * 60 * 1000, // 2분
  
  // 최대 캐시 항목 수
  MAX_ENTRIES: 1000
};

/**
 * 캐시 키 생성
 */
const generateCacheKey = (req) => {
  const userId = req.user?.id || 'anonymous';
  return `${req.method}:${req.originalUrl}:${userId}`;
};

/**
 * 캐시 정리 (만료된 항목 제거)
 */
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt < now) {
      cache.delete(key);
    }
  }
  
  // 최대 항목 수 초과 시 오래된 항목 제거
  if (cache.size > CACHE_CONFIG.MAX_ENTRIES) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    const toDelete = entries.slice(0, cache.size - CACHE_CONFIG.MAX_ENTRIES);
    toDelete.forEach(([key]) => cache.delete(key));
  }
};

// 주기적 캐시 정리 (5분마다) - 테스트 환경에서는 비활성화
let cleanupInterval = null;
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(cleanupCache, 5 * 60 * 1000);
}

/**
 * 캐시 미들웨어
 * @param {number} ttl - 캐시 유효 시간 (밀리초)
 */
const cacheMiddleware = (ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  return (req, res, next) => {
    // GET 요청만 캐싱
    if (req.method !== 'GET') {
      return next();
    }

    const key = generateCacheKey(req);
    const cached = cache.get(key);

    // 캐시 히트
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // 캐시 미스 - 응답 가로채기
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // 성공 응답만 캐싱
      if (res.statusCode === 200 && data.success !== false) {
        cache.set(key, {
          data,
          createdAt: Date.now(),
          expiresAt: Date.now() + ttl
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

/**
 * 특정 패턴의 캐시 무효화
 * @param {string} pattern - URL 패턴 (정규식)
 */
const invalidateCache = (pattern) => {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

/**
 * 전체 캐시 클리어
 */
const clearCache = () => {
  cache.clear();
};

/**
 * 캐시 통계
 */
const getCacheStats = () => {
  const now = Date.now();
  let validCount = 0;
  let expiredCount = 0;

  for (const value of cache.values()) {
    if (value.expiresAt > now) {
      validCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    totalEntries: cache.size,
    validEntries: validCount,
    expiredEntries: expiredCount,
    maxEntries: CACHE_CONFIG.MAX_ENTRIES
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  getCacheStats,
  CACHE_CONFIG
};
