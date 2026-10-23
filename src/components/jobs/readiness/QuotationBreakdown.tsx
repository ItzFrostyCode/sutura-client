import React from 'react';
import { peso } from './readinessFormat';
import type { QuotationFormState } from './useQuotationForm';

function Line({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm text-ink-body">
      <span className="min-w-0 break-words">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

/** The live sum of the price fields, line by line. */
export default function QuotationBreakdown({ f, pieces }: { readonly f: QuotationFormState; readonly pieces: number }) {
  return (
    <div className="space-y-1.5 rounded-xl bg-sunken/70 p-4" aria-live="polite">
      <Line label={`${peso(f.unit)} × ${pieces} pcs`} value={peso(f.goods)} />
      {f.extras.filter((r) => Number(r.amount) !== 0).map((r, i) => <Line key={`e${i}`} label={`+ ${r.label || 'Extra charge'}`} value={peso(r.amount)} />)}
      {f.deductions.filter((r) => Number(r.amount) !== 0).map((r, i) => <Line key={`d${i}`} label={`− ${r.label || 'Customer\'s own item'}`} value={`− ${peso(r.amount)}`} />)}
      {f.discount > 0 && <Line label="− Bulk discount" value={`− ${peso(f.discount)}`} />}
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line pt-2 text-sm font-semibold text-ink">
        <span>Total</span>
        <span className="tabular-nums">{peso(f.total)}</span>
      </div>
    </div>
  );
}
