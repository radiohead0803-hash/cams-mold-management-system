import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * 모바일 에러 바운더리
 * 하위 컴포넌트에서 발생하는 렌더링 에러를 캐치하여 사용자 친화적 UI를 표시합니다.
 */
export default class MobileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MobileErrorBoundary] 렌더링 오류 발생:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleFullReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              문제가 발생했습니다
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              일시적인 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도해 주세요.
            </p>

            {/* 오류 메시지 (개발 참고용) */}
            {this.state.error && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                <p className="text-xs text-gray-400 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium active:bg-blue-700 transition-colors"
              >
                <RefreshCw size={18} />
                다시 시도
              </button>

              <button
                onClick={this.handleFullReload}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
