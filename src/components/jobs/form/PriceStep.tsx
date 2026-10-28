import { ShieldCheck } from 'lucide-react';
import { BTN_SM } from '@/components/shared/plainForm';
import { FIELD, LABEL } from './FormStep';
import DiscountField from './DiscountField';
import PriceSummary from './PriceSummary';
import { dateInDays, peso } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';

const H = 'text-sm font-semibold text-espresso';

/** Price and date, extra charges, what was paid now, and the statement. The price and date start as the service's own and can be typed over. */
export default function PriceStep({ form, canCollectMoney }: Readonly<{ form: JobCreateForm; canCollectMoney: boolean }>) {
  const { formData, set, pricing: p, service, isBulk, isRepair } = form;
  const trusted = form.customers.find((c) => c.id.toString() === formData.customer_id)?.is_trusted;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span className={LABEL}>Total pieces to make</span>
          <p className="flex h-11 items-center text-sm text-espresso">{p.quantity} {p.quantity === 1 ? 'piece' : 'pieces'} <span className="ml-2 text-espresso/60">{isBulk ? 'from the team list' : 'set under Order details'}</span></p>
        </div>
        <div>
          <label htmlFor="price" className={LABEL}>Price (₱)</label>
          <input id="price" type="number" inputMode="decimal" min="0" step="0.01" value={p.price} onChange={(e) => set({ price: e.target.value })} placeholder="0.00" className={FIELD} />
        </div>
        <div>
          <label htmlFor="due_date" className={LABEL}>Due date {!isRepair && <span className="text-danger">*</span>}</label>
          <input id="due_date" type="date" min={dateInDays(0)} value={p.dueDate} onChange={(e) => set({ due_date: e.target.value })} className={FIELD} />
        </div>
      </div>
      {service && p.needsQuote && <p className="text-sm text-espresso/60">No fixed price for this one. Leave the price empty to quote it later in Order Steps, or type what you agreed.</p>}
      {p.tooQuick && <p className="text-sm text-espresso">This usually takes {p.turnaround.days} days or more. This date is sooner. Mark it as a rush order if it really is.</p>}

      {canCollectMoney && (
        <>
          <div className="space-y-4 border-t border-espresso/15 pt-5">
            <h3 className={H}>Extra charges</h3>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-espresso">
              <input type="checkbox" checked={formData.is_rush} onChange={(e) => set({ is_rush: e.target.checked })} className="h-5 w-5 accent-espresso" />
              Rush order
            </label>
            {formData.is_rush && (
              <div className="sm:max-w-56">
                <label htmlFor="rush_fee" className={LABEL}>Rush fee (₱)</label>
                <input id="rush_fee" type="number" inputMode="decimal" min="0" step="0.01" value={formData.rush_fee} onChange={(e) => set({ rush_fee: e.target.value })} placeholder="0.00" className={FIELD} />
                <p className="mt-1 text-sm text-espresso/60">Added to the total. Leave empty to let the system suggest one.</p>
              </div>
            )}
            <DiscountField formData={formData} onChange={set} />
          </div>

          <div className="space-y-3 border-t border-espresso/15 pt-5">
            <h3 className={H}>Payment received now</h3>
            {trusted && <p className="flex items-center gap-2 text-sm text-espresso"><ShieldCheck size={15} className="shrink-0" />Trusted customer: no deposit, the full amount is paid at pick-up.</p>}
            <div className="sm:max-w-56">
              <label htmlFor="downpayment" className={LABEL}>Amount (₱)</label>
              <input id="downpayment" type="number" inputMode="decimal" min="0" step="0.01" value={formData.downpayment} onChange={(e) => set({ downpayment: e.target.value })} placeholder="0.00" className={FIELD} />
            </div>
            <p className="text-sm text-espresso/60">Only enter an amount if cash or GCash was already handed over. Leave it at 0.00 if they pay later.</p>
            {p.total > 0 && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => set({ downpayment: (p.total * 0.5).toFixed(2) })} className={BTN_SM}>50% deposit</button>
                <button type="button" onClick={() => set({ downpayment: p.total.toFixed(2) })} className={BTN_SM}>Full payment</button>
              </div>
            )}
            {p.overpaid > 0 && <p className="text-sm text-espresso">Change due {peso(p.overpaid)}. Only {peso(p.total)} is applied to this order.</p>}
          </div>
        </>
      )}

      {!canCollectMoney && trusted && <p className="flex items-center gap-2 text-sm text-espresso"><ShieldCheck size={15} className="shrink-0" />Trusted customer: pays at pick-up.</p>}
      <PriceSummary form={form} canCollectMoney={canCollectMoney} />
    </div>
  );
}
