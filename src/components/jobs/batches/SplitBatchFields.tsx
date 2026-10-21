import React from 'react';
import type { SplitPlan } from './useSplitPlan';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
const INPUT = 'h-11 w-full rounded-lg border border-espresso/[0.12] bg-white px-3 text-base text-ink focus:border-taupe focus:outline-none sm:text-sm';

/** For each new batch: who pays, and its price and discount. They start as an equal share and can be typed over. */
export default function SplitBatchFields({ plan }: Readonly<{ plan: SplitPlan }>) {
  if (plan.batches.length === 0) return <p className="text-sm text-ink-muted">Choose who goes to another batch. Each batch becomes its own order with its own deposit, due date and tracking code.</p>;
  return (
    <div className="space-y-4">
      {plan.batches.map((b) => (
        <fieldset key={b} className="space-y-2 border-t border-espresso/[0.08] pt-3">
          <legend className="text-sm font-semibold text-ink">Batch {b} · {plan.members(b).length} {plan.members(b).length === 1 ? 'person' : 'people'}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-xs text-ink-muted sm:col-span-1">Who pays
              <input className={`${INPUT} mt-1`} value={plan.paidBy[b] ?? ''} onChange={(e) => plan.setPaidBy(b, e.target.value)} placeholder="Name" maxLength={120} />
            </label>
            <label className="block text-xs text-ink-muted">Price (₱)
              <input className={`${INPUT} mt-1`} type="number" inputMode="decimal" min={0} value={plan.priceOf(b)} onChange={(e) => plan.setPrice(b, e.target.value)} />
            </label>
            <label className="block text-xs text-ink-muted">Discount (₱)
              <input className={`${INPUT} mt-1`} type="number" inputMode="decimal" min={0} value={plan.discountOf(b)} onChange={(e) => plan.setDiscount(b, e.target.value)} />
            </label>
          </div>
        </fieldset>
      ))}
      <p className={`border-t border-espresso/[0.08] pt-3 text-sm ${plan.left.total < 0 || plan.left.discount < 0 ? 'text-danger' : 'text-ink-body'}`}>
        This order keeps <strong>{plan.stays.length}</strong> {plan.stays.length === 1 ? 'person' : 'people'} · {peso(plan.left.total)}{plan.left.discount > 0 ? ` (discount ${peso(plan.left.discount)})` : ''}
      </p>
    </div>
  );
}
