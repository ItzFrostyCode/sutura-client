import React, { useId } from 'react';
import { X } from 'lucide-react';
import { BTN_SM, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import PesoInput from './PesoInput';
import type { ChargeRow } from './readinessTypes';

interface ChargeRowsProps {
  readonly title: string;
  readonly hint: string;
  readonly rows: ChargeRow[];
  readonly onChange: (rows: ChargeRow[]) => void;
  readonly labelPlaceholder: string;
}

/** A small list of "what for / how much" lines (extra charges, or items the customer supplies). */
export default function ChargeRows({ title, hint, rows, onChange, labelPlaceholder }: ChargeRowsProps) {
  const titleId = useId();
  const set = (i: number, patch: Partial<ChargeRow>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div role="group" aria-labelledby={titleId}>
      <div className="flex items-center justify-between gap-3">
        <span id={titleId} className={`${PLAIN_LABEL} mb-0`}>{title}</span>
        <button type="button" onClick={() => onChange([...rows, { label: '', amount: 0 }])} className={BTN_SM}>+ Add</button>
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">{hint}</p>
      {rows.length > 0 && (
        <div className="mt-3 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input aria-label={`${title} description ${i + 1}`} value={row.label} onChange={(e) => set(i, { label: e.target.value })} placeholder={labelPlaceholder} maxLength={80} className={`${PLAIN_FIELD} min-w-[9rem] flex-1`} />
              <PesoInput ariaLabel={`${title} amount ${i + 1}`} value={row.amount} onChange={(amount) => set(i, { amount })} className="w-32" />
              <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove line" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-sunken hover:text-rose-600">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
