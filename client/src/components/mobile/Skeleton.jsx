/**
 * 스켈레톤 로딩 UI 컴포넌트
 * 콘텐츠 로딩 중 표시되는 플레이스홀더
 */

// 기본 스켈레톤 블록
export function Skeleton({ className = '', animate = true }) {
  return (
    <div 
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
}

// 텍스트 스켈레톤
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

// 아바타 스켈레톤
export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <Skeleton className={`rounded-full ${sizeClasses[size]} ${className}`} />
  );
}

// 카드 스켈레톤
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <SkeletonAvatar />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

// 리스트 아이템 스켈레톤
export function SkeletonListItem({ hasAvatar = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 p-4 ${className}`}>
      {hasAvatar && <SkeletonAvatar size="md" />}
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// 금형 카드 스켈레톤
export function SkeletonMoldCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

// 점검 폼 스켈레톤
export function SkeletonInspectionForm({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* 점검 항목들 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
          <Skeleton className="h-5 w-1/4 mb-3" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 대시보드 스켈레톤
export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ))}
      </div>
      
      {/* 차트 영역 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <Skeleton className="h-5 w-1/4 mb-4" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      
      {/* 리스트 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-1/3" />
        </div>
        {[1, 2, 3].map((i) => (
          <SkeletonListItem key={i} className="border-b last:border-0" />
        ))}
      </div>
    </div>
  );
}

// 프로필 스켈레톤
export function SkeletonProfile({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <SkeletonAvatar size="xl" className="mx-auto mb-4" />
        <Skeleton className="h-6 w-1/3 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/4 mx-auto" />
      </div>
      
      {/* 메뉴 리스트 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 border-b last:border-0">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="w-5 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 전체 페이지 스켈레톤
export function SkeletonPage({ type = 'list', className = '' }) {
  const renderContent = () => {
    switch (type) {
      case 'dashboard':
        return <SkeletonDashboard />;
      case 'profile':
        return <SkeletonProfile />;
      case 'form':
        return <SkeletonInspectionForm />;
      case 'card':
        return (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonMoldCard key={i} />
            ))}
          </div>
        );
      case 'list':
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonListItem key={i} className="border-b last:border-0" />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`p-4 ${className}`}>
      {renderContent()}
    </div>
  );
}

export default {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonMoldCard,
  SkeletonInspectionForm,
  SkeletonDashboard,
  SkeletonProfile,
  SkeletonPage
};
