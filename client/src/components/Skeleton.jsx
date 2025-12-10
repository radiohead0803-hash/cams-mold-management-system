// 로딩 스켈레톤 컴포넌트
export function Skeleton({ className = '', variant = 'text' }) {
  const baseClass = 'animate-pulse bg-gray-200 rounded';
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24',
    card: 'h-32 w-full',
    image: 'h-48 w-full',
  };

  return (
    <div className={`${baseClass} ${variants[variant] || ''} ${className}`} />
  );
}

// 카드 스켈레톤
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

// 테이블 행 스켈레톤
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  );
}

// 테이블 스켈레톤
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 통계 카드 스켈레톤
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton variant="avatar" className="h-12 w-12" />
      </div>
    </div>
  );
}

// 대시보드 스켈레톤
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton variant="image" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Skeleton variant="title" className="mb-4" />
          <Skeleton variant="image" />
        </div>
      </div>
    </div>
  );
}

// 목록 스켈레톤
export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton variant="button" />
        </div>
      ))}
    </div>
  );
}

export default {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  StatCardSkeleton,
  DashboardSkeleton,
  ListSkeleton
};
