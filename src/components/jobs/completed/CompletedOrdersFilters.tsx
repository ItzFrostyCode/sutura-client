import React from 'react';
import { RotateCcw } from 'lucide-react';
import { EMPTY_FILTERS, type CompletedFilters } from './useCompletedOrders';

const FIELD = 'w-full h-10 px-3 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe';
const LABEL = 'block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5';

interface Props {
  readonly filters: CompletedFilters;
  readonly onChange: (next: CompletedFilters) => void;
}

/** The Filter button's panel. Applies as soon as a field changes. */
export default function CompletedOrdersFilters({ filters, onChange }: Props) {
  const set = <K extends keyof CompletedFilters>(key: K, value: CompletedFilters[K]) => onChange({ ...filters, [key]: value });
  const hasAny = Object.values(filters).some(Boolean);

  return (
    <div className="px-4 sm:px-5 py-4 border-b border-line bg-canvas/40">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="co-from" className={LABEL}>Completed from</label>
          <input id="co-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set('from', e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="co-to" className={LABEL}>Completed to</label>
          <input id="co-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set('to', e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="co-payment" className={LABEL}>Payment</label>
          <select id="co-payment" value={filters.payment_status} onChange={(e) => set('payment_status', e.target.value as CompletedFilters['payment_status'])} className={FIELD}>
            <option value="">Any payment</option>
            <option value="paid">Fully paid</option>
            <option value="partial">Partly paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div>
          <label htmlFor="co-channel" className={LABEL}>Order type</label>
          <select id="co-channel" value={filters.intake_channel} onChange={(e) => set('intake_channel', e.target.value as CompletedFilters['intake_channel'])} className={FIELD}>
            <option value="">Walk-in and online</option>
            <option value="walk_in">Walk-in</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>
      {hasAny && (
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline cursor-pointer">
          <RotateCcw size={12} /> Clear filters
        </button>
      )}
    </div>
  );
}
