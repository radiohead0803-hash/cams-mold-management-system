import { Package, Search, FileText, Wrench, Truck, ClipboardList, AlertCircle } from 'lucide-react';

// 빈 상태 아이콘 매핑
const icons = {
  mold: Package,
  search: Search,
  document: FileText,
  repair: Wrench,
  transfer: Truck,
  checklist: ClipboardList,
  default: AlertCircle
};

// 빈 상태 컴포넌트
export default function EmptyState({ 
  icon = 'default',
  title = '데이터가 없습니다',
  description = '',
  action = null,
  actionLabel = '',
  onAction = null,
  className = ''
}) {
  const Icon = icons[icon] || icons.default;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-4">{description}</p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {actionLabel || action}
        </button>
      )}
    </div>
  );
}

// 검색 결과 없음
export function NoSearchResults({ searchTerm, onClear }) {
  return (
    <EmptyState
      icon="search"
      title="검색 결과가 없습니다"
      description={`"${searchTerm}"에 대한 결과를 찾을 수 없습니다. 다른 검색어를 시도해 보세요.`}
      action="검색어 지우기"
      onAction={onClear}
    />
  );
}

// 금형 없음
export function NoMolds({ onCreate }) {
  return (
    <EmptyState
      icon="mold"
      title="등록된 금형이 없습니다"
      description="새로운 금형을 등록하여 관리를 시작하세요."
      action="금형 등록"
      onAction={onCreate}
    />
  );
}

// 수리 요청 없음
export function NoRepairs() {
  return (
    <EmptyState
      icon="repair"
      title="수리 요청이 없습니다"
      description="현재 진행 중인 수리 요청이 없습니다."
    />
  );
}

// 이관 요청 없음
export function NoTransfers() {
  return (
    <EmptyState
      icon="transfer"
      title="이관 요청이 없습니다"
      description="현재 진행 중인 이관 요청이 없습니다."
    />
  );
}

// 체크리스트 없음
export function NoChecklists() {
  return (
    <EmptyState
      icon="checklist"
      title="체크리스트가 없습니다"
      description="작성된 체크리스트가 없습니다."
    />
  );
}

// 문서 없음
export function NoDocuments() {
  return (
    <EmptyState
      icon="document"
      title="문서가 없습니다"
      description="등록된 문서가 없습니다."
    />
  );
}
