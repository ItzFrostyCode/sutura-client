'use client';

import { isBottomPoint } from '@/components/jobs/form/rosterHelpers';
import { BULK_SIZES, type ServiceOrderState } from './useServiceOrder';
import { SectionLabel } from './orderUi';

/** The shop's chart numbers for a size, for that part only (chest and shoulder for a top, waist and hips for a bottom). */
function numbers(o: ServiceOrderState, size: string, part: 'top' | 'bottom'): string {
  const cols = o.service?.size_chart_columns ?? [];
  const row = (o.service?.size_chart_rows ?? []).find((r) => r.size === size);
  return row ? row.values.map((v, i) => (v && isBottomPoint(cols[i] ?? '') === (part === 'bottom') ? `${cols[i]} ${v}` : '')).filter(Boolean).join(' · ') : '';
}

function Pick({ o, label, part, value, onPick }: Readonly<{ o: ServiceOrderState; label: string; part: 'top' | 'bottom'; value: string; onPick: (v: string) => void }>) {
  const list = o.sizes.length > 0 ? o.sizes : [...BULK_SIZES];
  return (
    <div className="space-y-2">
      <SectionLabel as="p">{label}</SectionLabel>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {list.map((s) => {
          const on = value === s;
          return (
            <button key={s} type="button" role="radio" aria-checked={on} onClick={() => onPick(on ? '' : s)}
              className={`min-w-12 h-11 px-3.5 border text-sm font-semibold transition-colors ${on ? 'border-taupe bg-taupe text-white' : 'border-line bg-surface text-ink-body hover:border-taupe/50'}`}>
              {s}
            </button>
          );
        })}
      </div>
      {value && numbers(o, value, part) && <p className="mobile-caption text-ink-muted">{numbers(o, value, part)}</p>}
    </div>
  );
}

/** "Standard size": one size for each part that was chosen first. */
export default function OrderStandardSize({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <div className="space-y-5">
      {o.area !== 'bottom' && <Pick o={o} label={o.area === 'both' ? 'Top size' : 'Size'} part="top" value={o.size} onPick={o.setSize} />}
      {o.area === 'bottom' && <Pick o={o} label="Size" part="bottom" value={o.size} onPick={o.setSize} />}
      {o.area === 'both' && <Pick o={o} label="Bottom size" part="bottom" value={o.sizeBottom} onPick={o.setSizeBottom} />}
    </div>
  );
}
