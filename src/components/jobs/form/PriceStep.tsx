import { FIELD, LABEL, Chip } from './FormStep';
import DiscountField from './DiscountField';
import { dateInDays, peso } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';

/** Price, due date and the downpayment. The price and date start as the service's own and can be typed over. */
export default function PriceStep({ form, canCollectMoney }: Readonly<{ form: JobCreateForm; canCollectMoney: boolean }>) {
  const { formData, set, pricing: p, service, isBulk, isRepair } = form;
  const today = dateInDays(0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {!isBulk && (
          <div>
            <label htmlFor="quantity" className={LABEL}>Quantity</label>
            <input id="quantity" type="number" inputMode="numeric" min="1" step="1" value={formData.quantity} onChange={(e) => set({ quantity: e.target.value })} className={FIELD} />
          </div>
        )}
        <div>
          <label htmlFor="price" className={LABEL}>Price (₱)</label>
          <input id="price" type="number" inputMode="decimal" min="0" step="0.01" value={p.price} onChange={(e) => set({ price: e.target.value })} placeholder="0.00" className={FIELD} />
        </div>
        <div>
          <label htmlFor="due_date" className={LABEL}>Due date {!isRepair && <span className="text-danger">*</span>}</label>
          <input id="due_date" type="date" min={today} value={p.dueDate} onChange={(e) => set({ due_date: e.target.value })} className={FIELD} />
        </div>
      </div>
      {service && p.needsQuote && <p className="text-xs text-ink-muted">No fixed price for this one. Leave the price empty to quote it later in Order Steps, or type what you agreed.</p>}
      {p.tooQuick && <p className="text-xs text-amber-700">{service?.name} usually takes {service?.estimated_days} days — this date is sooner. Mark it as a rush order if it really is.</p>}

      {canCollectMoney && (
        <>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={formData.is_rush} onChange={(e) => set({ is_rush: e.target.checked })} className="h-5 w-5 accent-taupe" />
            Rush order
          </label>
          {formData.is_rush && (
            <div className="sm:max-w-48">
              <label htmlFor="rush_fee" className={LABEL}>Rush fee (₱)</label>
              <input id="rush_fee" type="number" inputMode="decimal" min="0" step="0.01" value={formData.rush_fee} onChange={(e) => set({ rush_fee: e.target.value })} placeholder="0.00" className={FIELD} />
              <p className="mt-1 text-xs text-ink-muted">Added to the total. Leave empty to let the system suggest one.</p>
            </div>
          )}
          <DiscountField formData={formData} onChange={set} />
          <div>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="downpayment" className={`${LABEL} mb-0`}>Downpayment received (₱)</label>
              {p.total > 0 && (
                <span className="flex gap-2">
                  {[0.5, 1].map((f) => <Chip key={f} active={false} onClick={() => set({ downpayment: (p.total * f).toFixed(2) })}>{f === 1 ? 'Full' : '50%'}</Chip>)}
                </span>
              )}
            </div>
            <input id="downpayment" type="number" inputMode="decimal" min="0" step="0.01" value={formData.downpayment} onChange={(e) => set({ downpayment: e.target.value })} placeholder="0.00" className={`${FIELD} sm:max-w-48`} />
            {p.overpaid > 0 && <p className="mt-1 text-xs text-sage">Change due {peso(p.overpaid)} — only {peso(p.total)} is applied to this order.</p>}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-4 text-sm">
        <div className="flex gap-3 text-ink-muted">
          {p.rushFee > 0 && <span>Rush +{peso(p.rushFee)}</span>}
          {p.discount > 0 && <span className="text-sage">Discount −{peso(p.discount)}</span>}
          {canCollectMoney && p.downpayment > 0 && <span>Paid {peso(p.downpayment)}</span>}
        </div>
        <div className="text-ink">Total <strong className="text-lg text-taupe">{peso(p.total)}</strong>{canCollectMoney && p.downpayment > 0 && <span className="ml-3 text-ink-muted">Balance <strong className="text-ink">{peso(p.balance)}</strong></span>}</div>
      </div>
    </div>
  );
}
