'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { OrderForm } from './useOrderForm';
import OrderInfoTip from './OrderInfoTip';
import OrderAddColumn from './OrderAddColumn';
import type { MeasuringPoint } from './orderPoints';
import type { MeasureColumns } from './useMeasureColumns';

function Group({ title, part, points, f, c }: Readonly<{ title: string; part: 'top' | 'bottom'; points: MeasuringPoint[]; f: OrderForm; c: MeasureColumns }>) {
  return (
    <div className="border-l-2 border-line-strong pl-3">
      <p className="mobile-overline text-ink">{title}</p>
      <ul className="mt-1 divide-y divide-line">
        {points.map((p) => (
          <li key={p.label} className="flex min-h-12 items-center gap-1">
            <span className="min-w-0 flex-1 truncate text-base text-ink">{p.label}</span>
            <OrderInfoTip label={p.label} text={p.tip} />
            <button type="button" onClick={() => c.removeCol(p.label)} aria-label={`Don't ask ${p.label}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-sunken hover:text-rose-700"><X size={16} /></button>
          </li>
        ))}
      </ul>
      <div className="mt-2"><OrderAddColumn part={part} taken={c.taken} onAdd={(l) => f.addCustomCol(part, l)} /></div>
    </div>
  );
}

/**
 * Phone: the measurements every card asks, set once — each with (i) and × to stop asking it;
 * "+ Add" for one that is missing. Folded by default to a one-line summary, so the names stay the focus.
 */
export default function OrderColumnSettings({ f, c }: Readonly<{ f: OrderForm; c: MeasureColumns }>) {
  const [open, setOpen] = useState(false);
  const summary = [c.showTop && `${c.top.length} top`, c.showBottom && `${c.bottom.length} bottom`].filter(Boolean).join(' · ');

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-ink">Measurements to take</span>
          <span className="mobile-caption block truncate text-ink-muted">{summary}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-ink">{open ? 'Done' : 'Edit'}</span>
        <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="space-y-5 border-t border-line px-4 py-4">
          {c.showTop && <Group title="Top" part="top" points={c.top} f={f} c={c} />}
          {c.showBottom && <Group title="Bottom" part="bottom" points={c.bottom} f={f} c={c} />}
        </div>
      )}
    </div>
  );
}
