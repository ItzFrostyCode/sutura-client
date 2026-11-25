'use client';

import { Zap } from 'lucide-react';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, SectionLabel, StepIntro, paymentCopy, peso } from './orderUi';
import OrderGcashPayment from './OrderGcashPayment';

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
  const fullOnly = o.policy === 'full';

  // The shop's own turnaround for this service ("It depends" = none set).
  const minDays = Number(o.service?.estimated_days) || 0;
  const usualDays = minDays >= 1 ? { min: minDays, max: o.service?.estimated_days_max ?? null } : null;

  return (
    <div className="space-y-7">
      <StepIntro title="Invoice & Payment" text="Quantity, rush and how you plan to pay." />

      {/* Fixed, not editable: an individual order is for one person (more
          pieces = a bulk order); a bulk order counts its people list. */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3">
          <span className="text-sm text-ink-muted">
            {o.orderMode === 'individual' ? 'Quantity (individual order)' : 'Quantity (from your size breakdown)'}
          </span>
          <span className="text-base font-semibold text-ink tabular-nums">{o.pieces} {o.pieces === 1 ? 'pc' : 'pcs'}</span>
        </div>
        {o.orderMode === 'individual' && o.minQty > 1 && (
          <p className="mobile-caption text-ink-muted">This shop takes orders of {o.minQty} pieces or more.</p>
        )}
      </div>

      {/* No "When do you need it?" date: Rush is the one way to ask for it
          sooner, and the shop sets the finish date when it accepts. */}
      <div className="space-y-2">
        {usualDays && (
          <p className="text-sm text-ink-body">
            This service usually takes <strong className="font-semibold text-ink">{formatServiceTurnaround(usualDays.min, usualDays.max)}</strong>. The shop confirms the finish date when it accepts your order.
          </p>
        )}
        <label className="flex items-start gap-3 bg-surface border border-line rounded-lg p-3.5 cursor-pointer has-[:checked]:border-taupe has-[:checked]:bg-taupe/10">
          <input type="checkbox" checked={o.rushRequested} onChange={(e) => o.setRushRequested(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#6B5346] shrink-0" />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Zap size={14} className="text-taupe" aria-hidden="true" /> Request rush production</span>
            <span className="block mobile-caption text-ink-muted mt-0.5">Need it sooner? If the shop can rush it, they&apos;ll add their rush fee before you pay.</span>
          </span>
        </label>
      </div>

      <fieldset className="space-y-2.5">
        <SectionLabel as="legend">Payment term</SectionLabel>
        <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Payment term">
          {!fullOnly && (
            <ChoiceCard
              selected={o.paymentTerm === 'downpayment'}
              onSelect={() => o.setPaymentTerm('downpayment')}
              label={o.policy === 'none' ? 'Pay at pickup' : `Downpayment (${o.depositPercent}%)`}
              detail={o.policy === 'none' ? 'Nothing to pay before production.' : 'Pay the rest when you pick it up.'}
            />
          )}
          <ChoiceCard selected={o.paymentTerm === 'full'} onSelect={() => o.setPaymentTerm('full')} label="Full payment" detail="Settle everything before production starts." />
        </div>
      </fieldset>

      <OrderGcashPayment o={o} />

      <section className="bg-surface border-2 border-ink rounded-lg px-4 py-3">
        <h2 className="mobile-h4 text-ink pb-1">Order financial summary</h2>
        <dl className="divide-y divide-line">
          <Line label="Item rate" value={o.unitPrice > 0 ? peso(o.unitPrice) : 'Quoted by shop'} />
          <Line label="Quantity" value={`× ${o.pieces}`} />
          {o.fabricDeduction > 0 && <Line label="Fabric / other materials deduction" value={`− ${peso(o.fabricDeduction)}`} />}
          {o.rushRequested && <Line label="Rush fee" value="Set by the shop" />}
          <Line label="Estimated total" value={o.estimatedTotal !== null ? peso(o.estimatedTotal) : 'Quoted by shop'} strong />
          {o.dueNow !== null && o.dueNow > 0 && (
            <Line
              label={o.paymentNeeded ? 'Paying now by GCash' : o.paymentTerm === 'full' ? 'To pay before production' : 'Downpayment before production'}
              value={peso(o.dueNow)}
            />
          )}
        </dl>
        <ol className="mt-2 text-sm text-ink-body space-y-1.5 list-decimal pl-5 marker:text-ink-faint">
          <li>The shop reviews your order and confirms the final price.</li>
          <li>
            {o.paymentNeeded
              ? 'The shop checks your GCash receipt, then your balance updates in My Orders.'
              : `${paymentCopy(o.requirements)} You pay from My Orders once it's accepted.`}
          </li>
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
