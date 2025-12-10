// 뱃지 색상 매핑
const colors = {
  gray: 'bg-gray-100 text-gray-800',
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800'
};

// 크기 매핑
const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

// 기본 뱃지 컴포넌트
export default function Badge({ 
  children, 
  color = 'gray', 
  size = 'md',
  dot = false,
  className = '' 
}) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${colors[color] || colors.gray} ${sizes[size] || sizes.md} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

// 상태 뱃지
export function StatusBadge({ status }) {
  const statusConfig = {
    planning: { label: '계획', color: 'gray' },
    design: { label: '설계', color: 'blue' },
    manufacturing: { label: '제작', color: 'orange' },
    trial: { label: '시운전', color: 'purple' },
    production: { label: '양산', color: 'green' },
    maintenance: { label: '정비', color: 'yellow' },
    retired: { label: '폐기', color: 'red' },
    active: { label: '활성', color: 'green' },
    inactive: { label: '비활성', color: 'gray' },
    pending: { label: '대기', color: 'yellow' },
    approved: { label: '승인', color: 'green' },
    rejected: { label: '반려', color: 'red' },
    completed: { label: '완료', color: 'blue' },
    in_progress: { label: '진행중', color: 'orange' },
    draft: { label: '초안', color: 'gray' }
  };

  const config = statusConfig[status] || { label: status, color: 'gray' };
  
  return <Badge color={config.color} dot>{config.label}</Badge>;
}

// 우선순위 뱃지
export function PriorityBadge({ priority }) {
  const priorityConfig = {
    high: { label: '높음', color: 'red' },
    medium: { label: '보통', color: 'yellow' },
    low: { label: '낮음', color: 'green' },
    urgent: { label: '긴급', color: 'red' },
    normal: { label: '일반', color: 'blue' }
  };

  const config = priorityConfig[priority] || { label: priority, color: 'gray' };
  
  return <Badge color={config.color}>{config.label}</Badge>;
}

// 숫자 뱃지 (카운트)
export function CountBadge({ count, max = 99, color = 'red' }) {
  const displayCount = count > max ? `${max}+` : count;
  
  if (count <= 0) return null;
  
  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white rounded-full ${
      color === 'red' ? 'bg-red-500' :
      color === 'blue' ? 'bg-blue-500' :
      color === 'green' ? 'bg-green-500' :
      'bg-gray-500'
    }`}>
      {displayCount}
    </span>
  );
}

// 태그 뱃지 (삭제 가능)
export function TagBadge({ children, onRemove, color = 'blue' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-md ${colors[color] || colors.blue}`}>
      {children}
      {onRemove && (
        <button 
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
