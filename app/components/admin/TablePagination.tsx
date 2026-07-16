'use client';

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const maxVisiblePages = 5;

  const pageItems = (() => {
    const pages: Array<number | 'ellipsis'> = [];
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    pages.push(1);

    const windowStart = Math.max(2, safePage - 1);
    const windowEnd = Math.min(totalPages - 1, safePage + 1);

    if (windowStart > 2) pages.push('ellipsis');
    for (let i = windowStart; i <= windowEnd; i += 1) pages.push(i);
    if (windowEnd < totalPages - 1) pages.push('ellipsis');

    pages.push(totalPages);
    return pages;
  })();

  return (
    <div className="px-3 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="text-gray-600">
        Menampilkan {start}-{end} dari {totalItems}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="rows-per-page" className="text-gray-600">
          Baris:
        </label>
        <select
          id="rows-per-page"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 px-2 border border-gray-300 rounded-md bg-white text-gray-700"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="h-8 px-3 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <div className="flex items-center gap-1">
          {pageItems.map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`dots-${idx}`} className="px-1 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-8 min-w-8 px-2 rounded-md border text-sm ${
                  item === safePage
                    ? 'border-[#002c5f] bg-[#002c5f] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="h-8 px-3 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
