/**
 * 전역 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 에러를 캐치하고 폴백 UI 표시
 */
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // 에러 로깅
    console.error('[ErrorBoundary] 에러 발생:', error);
    console.error('[ErrorBoundary] 컴포넌트 스택:', errorInfo?.componentStack);
    
    // 에러 리포팅 서비스로 전송 (Sentry 등)
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      const errorReport = {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // 서버로 에러 리포트 전송
      await fetch('/api/v1/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(errorReport)
      }).catch(() => {});

      console.log('[ErrorBoundary] 에러 리포트 전송됨');
    } catch (e) {
      console.error('[ErrorBoundary] 에러 리포트 전송 실패:', e);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/mobile/home';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
            {/* 에러 아이콘 */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* 에러 메시지 */}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              문제가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-6">
              예기치 않은 오류가 발생했습니다. 
              페이지를 새로고침하거나 홈으로 이동해주세요.
            </p>

            {/* 에러 상세 (개발 모드에서만) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-gray-100 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                페이지 새로고침
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-5 h-5" />
                홈으로 이동
              </button>
              {this.props.onReset && (
                <button
                  onClick={() => {
                    this.handleReset();
                    this.props.onReset?.();
                  }}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Bug className="w-5 h-5" />
                  다시 시도
                </button>
              )}
            </div>

            {/* 지원 정보 */}
            <p className="mt-6 text-xs text-gray-400">
              문제가 지속되면 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * 모바일용 간소화된 에러 바운더리
 */
export class MobileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MobileErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700">오류가 발생했습니다</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-xs text-red-600 underline"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
