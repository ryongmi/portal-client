import { LimitType, PaginatedResultBase } from '@/types/api'
import Button from './Button'

interface PaginationProps {
  pageInfo: PaginatedResultBase
  onPageChange: (page: number) => void
  onLimitChange: (limit: LimitType) => void
}

export default function Pagination({ pageInfo, onPageChange, onLimitChange }: PaginationProps): JSX.Element {
  const { page, limit, totalItems, totalPages, hasPreviousPage, hasNextPage } = pageInfo

  const generatePageNumbers = (): number[] => {
    const pages: number[] = []
    const maxVisiblePages = 5
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const handlePreviousPage = (): void => {
    if (hasPreviousPage) {
      onPageChange(page - 1)
    }
  }

  const handleNextPage = (): void => {
    if (hasNextPage) {
      onPageChange(page + 1)
    }
  }

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onLimitChange(Number(event.target.value) as LimitType)
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
      {/* 페이지 정보 */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span>
          총 {totalItems.toLocaleString()}개 중 {((page - 1) * limit + 1).toLocaleString()}-{Math.min(page * limit, totalItems).toLocaleString()}개 표시
        </span>
        <div className="flex items-center space-x-2">
          <label htmlFor="limit-select" className="text-sm text-gray-600">
            페이지당:
          </label>
          <select
            id="limit-select"
            value={limit}
            onChange={handleLimitChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={LimitType.TEN}>10개</option>
            <option value={LimitType.TWENTY}>20개</option>
            <option value={LimitType.THIRTY}>30개</option>
            <option value={LimitType.FIFTY}>50개</option>
            <option value={LimitType.ONE_HUNDRED}>100개</option>
          </select>
        </div>
      </div>

      {/* 페이지 네비게이션 */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePreviousPage}
          disabled={!hasPreviousPage}
        >
          이전
        </Button>

        {generatePageNumbers().map((pageNumber) => (
          <Button
            key={pageNumber}
            size="sm"
            variant={pageNumber === page ? 'primary' : 'outline'}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}

        <Button
          size="sm"
          variant="outline"
          onClick={handleNextPage}
          disabled={!hasNextPage}
        >
          다음
        </Button>
      </div>
    </div>
  )
}