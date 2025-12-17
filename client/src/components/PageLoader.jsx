/**
 * 페이지 로딩 컴포넌트
 * React.lazy와 Suspense에서 사용
 */
export default function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 text-sm">페이지 로딩 중...</p>
      </div>
    </div>
  );
}

export function MobilePageLoader() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-3">
          <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-3 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-500 text-xs">로딩 중...</p>
      </div>
    </div>
  );
}
