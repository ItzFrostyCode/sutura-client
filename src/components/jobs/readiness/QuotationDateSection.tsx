import React from 'react';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import type { Capacity } from './readinessTypes';

interface QuotationDateSectionProps {
  readonly dueDate: string;
  readonly setDueDate: (v: string) => void;
  readonly cap?: Capacity;
  readonly inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Shown under the field in red when a send was tried without a date. */
  readonly error?: string | null;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Group 2: the ready date, with a plain-language look at how busy the branch is. */
export default function QuotationDateSection({ dueDate, setDueDate, cap, inputRef, error }: QuotationDateSectionProps) {
  const near = cap && cap.due_within_2_days !== null && dueDate ? cap.due_within_2_days : null;
  const conflicts = cap?.tailors.filter((t) => t.conflicts.length > 0) ?? [];
  return (
    <>
      <div>
        <label className={PLAIN_LABEL}>Ready by <span className="text-rose-600" aria-hidden>*</span>
          <input ref={inputRef} type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-invalid={Boolean(error)} className={`${PLAIN_FIELD} mt-1.5 font-normal ${error ? 'border-danger' : ''}`} />
        </label>
        {error ? <p role="alert" className="text-[13px] text-danger">{error}</p> : <p className="text-[13px] text-ink-muted">Needed before you can send the final price.</p>}
      </div>
      {cap && (
        <div className={`space-y-1 rounded-xl p-4 text-sm ${cap.has_conflict ? 'bg-amber-500/[0.08] text-amber-800' : 'bg-sunken/70 text-ink-muted'}`}>
          {near !== null ? (
            <p>{near} other {plural(near, 'order', 'orders')} at this branch {plural(near, 'is', 'are')} due within 2 days of {shortDate(dueDate)}.</p>
          ) : (
            <p>{cap.branch_open_orders} open {plural(cap.branch_open_orders, 'order', 'orders')} at this branch.</p>
          )}
          {conflicts.map((t) => <p key={t.user_id}>{t.name ?? 'A tailor'} also has {t.conflicts.map((c) => c.order_number).join(', ')} due around then.</p>)}
        </div>
      )}
    </>
  );
}
