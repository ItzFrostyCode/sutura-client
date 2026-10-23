import React from 'react';
import { CASHIER_LABEL } from './CashierAmountSection';

interface Props {
  readonly amount: string;
  readonly cashTendered: string;
  readonly setCashTendered: (v: string) => void;
  readonly change: number;
  readonly shortfall: boolean;
}

/** Round bills above the amount due, so the cashier can tap what the customer handed over. */
function billChips(amount: number): number[] {
  if (amount <= 0) return [];
  const candidates = [Math.ceil(amount / 100) * 100, Math.ceil(amount / 500) * 500, Math.ceil(amount / 1000) * 1000];
  return [...new Set(candidates)].filter((v) => v > amount).sort((a, b) => a - b).slice(0, 3);
}

/** Cash tendered field, quick-pick chips and the change due, as one tinted well. */
export function CashTenderedPanel({ amount, cashTendered, setCashTendered, change, shortfall }: Props) {
  const due = Number.parseFloat(amount) || 0;
  const tendered = Number.parseFloat(cashTendered);
  const chips = due > 0 ? [{ label: `Exact (₱${due.toFixed(2)})`, value: due }, ...billChips(due).map((v) => ({ label: `₱${v.toLocaleString('en-PH')}`, value: v }))] : [];

  return (
    <div className="space-y-3 rounded-xl bg-sunken/70 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="cash-tendered" className="text-sm font-medium text-ink">Cash Tendered <span className="text-danger">*</span></label>
        <span className="text-xs text-ink-muted">Select or type cash</span>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-ink-muted">₱</span>
        <input
          id="cash-tendered"
          type="number"
          step="0.01"
          min={amount || '0'}
          required
          value={cashTendered}
          onChange={(e) => setCashTendered(e.target.value)}
          placeholder="0.00"
          className={`h-14 w-full rounded-xl border bg-surface pl-10 pr-4 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-espresso/15 ${shortfall ? 'border-danger text-danger' : 'border-line-strong text-ink focus:border-espresso/60'}`}
        />
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setCashTendered(c.value.toFixed(2))}
              className={`h-10 cursor-pointer rounded-lg px-3 text-[13px] transition-colors ${
                tendered === c.value ? 'border-2 border-ink bg-surface font-semibold text-ink' : 'border border-line bg-surface text-ink-body hover:bg-sunken'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      {shortfall ? (
        <p className="text-[13px] font-medium text-danger">Cash tendered can&apos;t be less than the amount being paid.</p>
      ) : (
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-muted">Change Due</span>
          <span className="text-2xl font-semibold text-sage">₱{change.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
