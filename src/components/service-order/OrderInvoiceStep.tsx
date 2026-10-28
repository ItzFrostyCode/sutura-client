'use client';

import { Minus, Plus } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, SectionLabel, StepIntro, paymentCopy, peso } from './orderUi';

function Line({ label, value, strong }: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={strong ? 'text-base font-semibold text-ink' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={`tabular-nums text-right ${strong ? 'text-2xl font-bold text-ink' : 'text-sm font-medium text-ink'}`}>{value}</dd>
    </div>
  );
}

// Step 4 — Invoice & Payment, like the walk-in form's: quantity, rush,
// schedule and payment term, then the order's financial summary.
export default function OrderInvoiceStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const fullOnly = o.policy === 'full';

  return (
    <div className="space-y-7">
      <StepIntro title="Invoice & Payment" text="Quantity, schedule and how you plan to pay. You pay nothing now." />

      {o.orderMode === 'individual' ? (
        <div className="space-y-2.5">
          <SectionLabel htmlFor="order-qty">{o.soldAsSet ? 'Quantity (sets)' : 'Quantity'}</SectionLabel>
          <div className="flex items-stretch w-fit border border-line bg-surface">
            <button type="button" aria-label="Fewer" disabled={o.quantity <= o.minQty} onClick={() => o.setQuantity((q) => Math.max(o.minQty, q - 1))} className="w-12 h-12 flex items-center justify-center text-ink hover:bg-sunken/50 disabled:text-ink-faint disabled:hover:bg-transparent transition-colors">
              <Minus size={18} />
            </button>
            <input
              id="order-qty"
              type="number"
              inputMode="numeric"
              min={o.minQty}
              max={500}
              value={o.quantity}
              onChange={(e) => {
                const n = Math.floor(Number(e.target.value));
                o.setQuantity(Number.isFinite(n) ? Math.min(500, Math.max(1, n)) : o.minQty);
              }}
              onBlur={() => o.setQuantity((q) => Math.max(o.minQty, q))}
              className="w-16 h-12 text-center text-base font-semibold text-ink tabular-nums border-x border-line bg-surface focus:outline-none focus:bg-canvas [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button type="button" aria-label="More" disabled={o.quantity >= 500} onClick={() => o.setQuantity((q) => Math.min(500, q + 1))} className="w-12 h-12 flex items-center justify-center text-ink hover:bg-sunken/50 disabled:text-ink-faint transition-colors">
              <Plus size={18} />
            </button>
          </div>
          {o.minQty > 1 && <p className="mobile-caption text-ink-muted">This shop takes orders of {o.minQty} {o.soldAsSet ? 'sets' : 'pieces'} or more.</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-surface border border-line px-4 py-3">
          <span className="text-sm text-ink-muted">Quantity (from your size breakdown)</span>
          <span className="text-base font-semibold text-ink tabular-nums">{o.pieces} {o.soldAsSet ? (o.pieces === 1 ? 'set' : 'sets') : 'pcs'}</span>
        </div>
      )}

      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-needed-by">
          Needed by <span className="text-ink-faint font-normal">(Optional)</span>
        </SectionLabel>
        <p className="mobile-caption text-ink-muted -mt-1">The shop confirms the actual finish date when it accepts the order.</p>
        <input
          id="order-needed-by"
          type="date"
          min={tomorrow}
          value={o.neededBy}
          onChange={(e) => o.setNeededBy(e.target.value)}
          className="w-full sm:w-64 h-[48px] bg-canvas border border-line rounded-none px-4 text-base text-ink focus:outline-none focus:border-taupe"
        />
      </div>

      <label className="flex items-start gap-3 bg-surface border border-line p-3.5 cursor-pointer has-[:checked]:border-taupe has-[:checked]:bg-taupe/5">
        <input type="checkbox" checked={o.rushRequested} onChange={(e) => o.setRushRequested(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#6B5346] shrink-0" />
        <span>
          <span className="block text-sm font-semibold text-ink">Request rush production</span>
          <span className="block mobile-caption text-ink-muted mt-0.5">If the shop can rush it, they'll add their rush fee before you pay.</span>
        </span>
      </label>

      <fieldset className="space-y-2.5">
        <SectionLabel as="legend">How would you like to pay?</SectionLabel>
        <p className="mobile-caption text-ink-muted -mt-1">This is only your preference. The shop confirms the terms together with the final price.</p>
        <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Payment term">
          {!fullOnly && (
            <ChoiceCard
              selected={o.paymentTerm === 'downpayment'}
              onSelect={() => o.setPaymentTerm('downpayment')}
              label={o.policy === 'none' ? 'Pay at pickup' : `Downpayment (${o.depositPercent}%)`}
              detail={o.policy === 'none' ? 'Nothing to pay before production.' : 'Pay the rest when you pick it up.'}
            />
          )}
          <ChoiceCard selected={o.paymentTerm === 'full'} onSelect={() => o.setPaymentTerm('full')} label="Full payment" detail="Settle everything once you have accepted the price." />
        </div>
      </fieldset>

      <section className="bg-surface border-2 border-ink px-4 py-3">
        <h2 className="mobile-h4 text-ink pb-1">Order financial summary</h2>
        <dl className="divide-y divide-line">
          <Line label={o.soldAsSet ? 'Price per set' : 'Item rate'} value={o.unitPrice > 0 ? peso(o.unitPrice) : 'Quoted by shop'} />
          <Line label={o.soldAsSet ? 'Sets' : 'Quantity'} value={`× ${o.pieces}`} />
          {o.soldAsSet && <Line label="Garments" value={String(o.garments)} />}
          {o.rushRequested && <Line label="Rush fee" value="Set by the shop" />}
          <Line label="Estimated total" value={o.estimatedTotal !== null ? peso(o.estimatedTotal) : 'Quoted by shop'} strong />
          {o.dueNow !== null && o.dueNow > 0 && (
            <Line
              label={o.paymentTerm === 'full' ? 'To pay after you accept the price' : 'Downpayment after you accept the price'}
              value={peso(o.dueNow)}
            />
          )}
        </dl>
        <ol className="mt-2 text-sm text-ink-body space-y-1.5 list-decimal pl-5 marker:text-ink-faint">
          <li>The shop reviews your order and confirms the final price.</li>
          <li>You accept the price, then pay from My Orders. {paymentCopy(o.requirements)}</li>
          <li>Track every stage, from cutting to pickup, in My Orders.</li>
        </ol>
      </section>

      {o.error && (
        <p role="alert" className="text-sm text-danger">
          {o.error}
        </p>
      )}
    </div>
  );
}
