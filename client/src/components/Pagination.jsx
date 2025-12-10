import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// 페이지네이션 컴포넌트
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className = ''
}) {
  // 페이지 범위 계산
  const getPageNumbers = () => {
    const pages = [];
    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    // 첫 페이지
    if (leftSibling > 1) {
      pages.push(1);
      if (leftSibling > 2) pages.push('...');
    }

    // 중간 페이지
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    // 마지막 페이지
    if (rightSibling < totalPages) {
      if (rightSibling < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pages = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* 첫 페이지 */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="첫 페이지"
        >
          <ChevronsLeft size={18} className="text-gray-600" />
        </button>
      )}

      {/* 이전 페이지 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="이전 페이지"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>

      {/* 페이지 번호 */}
      {pages.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        )
      ))}

      {/* 다음 페이지 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="다음 페이지"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>

      {/* 마지막 페이지 */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="마지막 페이지"
        >
          <ChevronsRight size={18} className="text-gray-600" />
        </button>
      )}
    </div>
  );
}

// 페이지 정보 표시
export function PageInfo({ currentPage, totalPages, totalItems, itemsPerPage }) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="text-sm text-gray-600">
      전체 <span className="font-medium">{totalItems.toLocaleString()}</span>개 중{' '}
      <span className="font-medium">{startItem.toLocaleString()}</span>-
      <span className="font-medium">{endItem.toLocaleString()}</span>
    </div>
  );
}

// 페이지 크기 선택
export function PageSizeSelect({ value, onChange, options = [10, 20, 50, 100] }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">표시:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((size) => (
          <option key={size} value={size}>{size}개</option>
        ))}
      </select>
    </div>
  );
}

// 페이지네이션 바 (정보 + 크기 선택 + 페이지네이션)
export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  className = ''
}) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
      <PageInfo 
        currentPage={currentPage} 
        totalPages={totalPages} 
        totalItems={totalItems} 
        itemsPerPage={itemsPerPage} 
      />
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <PageSizeSelect value={itemsPerPage} onChange={onPageSizeChange} />
        )}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={onPageChange} 
        />
      </div>
    </div>
  );
}
