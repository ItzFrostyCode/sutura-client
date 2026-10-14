import React from 'react';
import { Plus, X } from 'lucide-react';
import type { ChargeRow } from './readinessTypes';

interface ChargeRowsProps {
  readonly title: string;
  readonly hint: string;
  readonly rows: ChargeRow[];
  readonly onChange: (rows: ChargeRow[]) => void;
  readonly labelPlaceholder: string;
}

const input = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';

/** A small list of "what for / how much" lines (extra charges, or items the customer supplies). */
export default function ChargeRows({ title, hint, rows, onChange, labelPlaceholder }: ChargeRowsProps) {
  const set = (i: number, patch: Partial<ChargeRow>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <fieldset className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <legend className="text-xs font-bold uppercase tracking-wide text-ink-muted">{title}</legend>
          <p className="text-[11px] text-ink-faint">{hint}</p>
        </div>
        <button type="button" onClick={() => onChange([...rows, { label: '', amount: 0 }])} className="flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink-body hover:bg-sunken">
          <Plus size={13} />Add
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input aria-label={`${title} description ${i + 1}`} value={row.label} onChange={(e) => set(i, { label: e.target.value })} placeholder={labelPlaceholder} maxLength={80} className={`${input} flex-1`} />
          <input aria-label={`${title} amount ${i + 1}`} type="number" inputMode="decimal" min={0} step="0.01" value={row.amount || ''} onChange={(e) => set(i, { amount: Number(e.target.value) })} placeholder="0.00" className={`${input} w-28`} />
          <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove line" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-rose-600">
            <X size={15} />
          </button>
        </div>
      ))}
    </fieldset>
  );
}
