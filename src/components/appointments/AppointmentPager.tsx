import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AppointmentPagerProps {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPage: (page: number) => void;
}

/** "Showing 11–20 of 37" with Previous / Next and a few page numbers. Hidden when everything fits on one page. */
export default function AppointmentPager({ total, page, pageSize, onPage }: AppointmentPagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  const btn = 'flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold';

  return (
    <nav aria-label="Pages" className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
      <p className="text-sm text-ink-muted">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={`${btn} border-line text-ink disabled:opacity-40`}><ChevronLeft size={16} /></button>
        {numbers.map((n) => (
          <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)} className={`${btn} ${n === page ? 'border-ink bg-ink text-white' : 'border-line text-ink'}`}>{n}</button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page" className={`${btn} border-line text-ink disabled:opacity-40`}><ChevronRight size={16} /></button>
      </div>
    </nav>
  );
}
