'use client';

import { Plus } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import { useMeasureColumns } from './useMeasureColumns';
import OrderMeasureTable from './OrderMeasureTable';
import OrderMeasureCards from './OrderMeasureCards';
import OrderColumnSettings from './OrderColumnSettings';

/**
 * A Group order's measurements when the shop has no size chart. Tablet and desktop: one table. Phone: the columns set
 * once above, then a card per person. Same data either way; a blank is fine (the shop measures it).
 */
export default function OrderMeasureSection({ o }: Readonly<{ o: ServiceOrderState }>) {
  const c = useMeasureColumns(o);
  const { f } = o;

  return (
    <div className="space-y-4">
      <p className="mobile-body-sm text-ink-muted">
        Type what you know. Each number is in inches; tap &ldquo;in&rdquo; beside it to switch that one to cm. A blank is fine: the shop measures it.
      </p>
      {c.removed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mobile-caption text-ink-muted">Not asked:</span>
          {c.removed.map((p) => (
            <button key={p.label} type="button" onClick={() => f.toggleCol(p.label)} className="flex h-9 items-center gap-1 rounded-full border border-line px-3 text-sm text-ink hover:border-ink">
              <Plus size={14} aria-hidden /> {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="hidden min-[600px]:block"><OrderMeasureTable o={o} c={c} /></div>
      <div className="space-y-3 min-[600px]:hidden">
        <OrderColumnSettings f={f} c={c} />
        <OrderMeasureCards o={o} c={c} />
      </div>
    </div>
  );
}
