/**
 * API 에러 핸들링 유틸리티
 */

// 에러 유형 정의
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP 상태 코드별 에러 유형 매핑
const statusToErrorType = {
  400: ErrorTypes.VALIDATION,
  401: ErrorTypes.AUTH,
  403: ErrorTypes.AUTH,
  404: ErrorTypes.NOT_FOUND,
  408: ErrorTypes.TIMEOUT,
  422: ErrorTypes.VALIDATION,
  500: ErrorTypes.SERVER,
  502: ErrorTypes.SERVER,
  503: ErrorTypes.SERVER,
  504: ErrorTypes.TIMEOUT
};

// 에러 유형별 사용자 메시지
const errorMessages = {
  [ErrorTypes.NETWORK]: '네트워크 연결을 확인해주세요.',
  [ErrorTypes.AUTH]: '로그인이 필요하거나 권한이 없습니다.',
  [ErrorTypes.VALIDATION]: '입력 정보를 확인해주세요.',
  [ErrorTypes.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [ErrorTypes.SERVER]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorTypes.TIMEOUT]: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  [ErrorTypes.UNKNOWN]: '알 수 없는 오류가 발생했습니다.'
};

/**
 * API 에러 파싱
 * @param {Error} error - Axios 에러 또는 일반 에러
 * @returns {Object} 파싱된 에러 정보
 */
export const parseApiError = (error) => {
  // 네트워크 에러 (서버 응답 없음)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        type: ErrorTypes.TIMEOUT,
        message: errorMessages[ErrorTypes.TIMEOUT],
        originalError: error
      };
    }
    return {
      type: ErrorTypes.NETWORK,
      message: errorMessages[ErrorTypes.NETWORK],
      originalError: error
    };
  }

  const { status, data } = error.response;
  const errorType = statusToErrorType[status] || ErrorTypes.UNKNOWN;

  // 서버에서 제공한 메시지 사용
  const serverMessage = data?.message || data?.error?.message || data?.error;
  
  return {
    type: errorType,
    status,
    message: serverMessage || errorMessages[errorType],
    details: data?.errors || data?.details,
    originalError: error
  };
};

/**
 * 에러 토스트 표시
 * @param {Object} parsedError - parseApiError로 파싱된 에러
 * @param {Function} showToast - 토스트 표시 함수
 */
export const showErrorToast = (parsedError, showToast) => {
  if (!showToast) {
    console.error('[Error]', parsedError.message);
    return;
  }

  const toastType = parsedError.type === ErrorTypes.AUTH ? 'warning' : 'error';
  showToast(parsedError.message, toastType);
};

/**
 * 인증 에러 처리
 * @param {Object} parsedError - parseApiError로 파싱된 에러
 * @param {Function} logout - 로그아웃 함수
 * @param {Function} navigate - 네비게이션 함수
 */
export const handleAuthError = (parsedError, logout, navigate) => {
  if (parsedError.type === ErrorTypes.AUTH && parsedError.status === 401) {
    // 토큰 만료 - 로그아웃 처리
    logout?.();
    navigate?.('/login', { 
      state: { message: '세션이 만료되었습니다. 다시 로그인해주세요.' }
    });
    return true;
  }
  return false;
};

/**
 * API 호출 래퍼 (에러 핸들링 포함)
 * @param {Function} apiCall - API 호출 함수
 * @param {Object} options - 옵션
 * @returns {Promise} API 응답 또는 에러
 */
export const withErrorHandling = async (apiCall, options = {}) => {
  const { 
    showToast, 
    logout, 
    navigate, 
    onError,
    rethrow = true 
  } = options;

  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    const parsedError = parseApiError(error);
    
    // 인증 에러 처리
    if (handleAuthError(parsedError, logout, navigate)) {
      return null;
    }

    // 토스트 표시
    showErrorToast(parsedError, showToast);

    // 커스텀 에러 핸들러 호출
    onError?.(parsedError);

    // 에러 재throw (필요시)
    if (rethrow) {
      throw parsedError;
    }

    return null;
  }
};

/**
 * 폼 유효성 검사 에러 포맷팅
 * @param {Object} errors - 서버에서 반환된 에러 객체
 * @returns {Object} 필드별 에러 메시지
 */
export const formatValidationErrors = (errors) => {
  if (!errors) return {};
  
  if (Array.isArray(errors)) {
    return errors.reduce((acc, err) => {
      if (err.field) {
        acc[err.field] = err.message;
      }
      return acc;
    }, {});
  }

  return errors;
};

/**
 * 재시도 로직이 포함된 API 호출
 * @param {Function} apiCall - API 호출 함수
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} delay - 재시도 간격 (ms)
 */
export const withRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const parsedError = parseApiError(error);
      
      // 재시도 불가능한 에러는 즉시 throw
      if ([ErrorTypes.AUTH, ErrorTypes.VALIDATION, ErrorTypes.NOT_FOUND].includes(parsedError.type)) {
        throw error;
      }
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (i < maxRetries - 1) {
        console.log(`[Retry] ${i + 1}/${maxRetries} 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

export default {
  ErrorTypes,
  parseApiError,
  showErrorToast,
  handleAuthError,
  withErrorHandling,
  formatValidationErrors,
  withRetry
};
