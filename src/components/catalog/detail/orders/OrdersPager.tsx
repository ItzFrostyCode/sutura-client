import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 1 2 3 4 5 … 12 | 1 … 5 6 7 … 12 | 1 … 8 9 10 11 12
function pageItems(page: number, count: number): (number | 'gap')[] {
  if (count <= 6) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, 5, 'gap', count];
  if (page >= count - 2) return [1, 'gap', count - 4, count - 3, count - 2, count - 1, count];
  return [1, 'gap', page - 1, page, page + 1, 'gap', count];
}

const BTN = 'h-10 min-w-10 px-2 border text-sm font-medium flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

interface OrdersPagerProps {
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
  readonly pageSize: number;
  readonly onChange: (page: number) => void;
}

// Appears once there are more rows than fit one page. Phones get "‹ Page 2 of 5 ›"
// (a full number strip wouldn't fit 320px); sm and up get the numbered strip.
export default function OrdersPager({ page, pageCount, total, pageSize, onChange }: Readonly<OrdersPagerProps>) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Orders pages" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
      <p className="text-xs text-ink-muted">Showing {from}–{to} of {total}</p>

      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className={`${BTN} border-line bg-white hover:bg-sunken`}>
          <ChevronLeft size={16} />
        </button>

        <span className="sm:hidden px-3 text-sm text-ink-body">Page {page} of {pageCount}</span>

        <div className="hidden sm:flex items-center gap-1">
          {pageItems(page, pageCount).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className="w-8 text-center text-ink-muted" aria-hidden="true">…</span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
                className={`${BTN} ${item === page ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-line hover:bg-sunken'}`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => onChange(page + 1)} className={`${BTN} border-line bg-white hover:bg-sunken`}>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
