import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AppointmentPagerProps {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPage: (page: number) => void;
}

/** "Showing 11–20 of 37" with arrows and up to ten page numbers (< 1 2 3 … 10 >) that slide with the current page. */
export default function AppointmentPager({ total, page, pageSize, onPage }: AppointmentPagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const shown = Math.min(10, pages);
  const start = Math.max(1, Math.min(page - Math.floor(shown / 2), pages - shown + 1));
  const numbers = Array.from({ length: shown }, (_, i) => start + i);
  const btn = 'flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-2.5 text-sm font-semibold';

  return (
    <nav aria-label="Pages" className="flex flex-col items-center justify-between gap-3 sm:border-t border-line px-0 py-3.5 sm:px-5 sm:flex-row">
      <p className="text-sm text-ink-muted">Showing {from}–{to} of {total} <span className="text-ink-faint">· {pageSize} per page</span></p>
      {pages > 1 && <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={`${btn} border-line bg-white text-ink hover:bg-sunken disabled:cursor-default disabled:opacity-40`}><ChevronLeft size={16} /></button>
        {numbers.map((n) => (
          <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)} className={`${btn} ${n === page ? 'border-espresso bg-espresso text-white' : 'border-line bg-white text-ink hover:bg-sunken'}`}>{n}</button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page" className={`${btn} border-line bg-white text-ink hover:bg-sunken disabled:cursor-default disabled:opacity-40`}><ChevronRight size={16} /></button>
      </div>}
    </nav>
  );
}
