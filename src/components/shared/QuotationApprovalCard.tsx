import React from 'react';
import { BadgeCheck, FileText, PackageOpen } from 'lucide-react';
import type { QuotationFlow } from '@/components/shared/OrderTrackingView';
import QuotationDecision from '@/components/shared/QuotationDecision';

interface QuotationApprovalCardProps {
  readonly orderId: number;
  readonly flow: QuotationFlow;
  readonly status: string;
  readonly dueDate: string | null;
  readonly onApproved: () => void;
}

const peso = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Before the shop starts: what the customer is being quoted, the date, the deposit and the
 * cancellation policy — and the one tap that approves all of it. Customer-safe data only.
 */
export default function QuotationApprovalCard({ orderId, flow, status, dueDate, onApproved }: QuotationApprovalCardProps) {
  const b = flow.breakdown;

  if (flow.waiting_for_materials) {
    return (
      <div className="mb-3 flex gap-3 rounded-2xl bg-amber-50 p-4 md:mx-auto md:max-w-3xl">
        <PackageOpen size={20} className="mt-0.5 shrink-0 text-amber-700" />
        <div>
          <p className="mobile-body-md font-semibold text-ink">Confirmed — waiting for materials</p>
          <p className="mobile-body-sm font-normal text-ink-body">Your order is confirmed. The shop is still getting some materials and will start as soon as they arrive.</p>
        </div>
      </div>
    );
  }

  if (status !== 'pending') return null;

  if (flow.approved_at) {
    return (
      <div className="mb-3 flex gap-3 rounded-2xl bg-emerald-50 p-4 md:mx-auto md:max-w-3xl">
        <BadgeCheck size={20} className="mt-0.5 shrink-0 text-emerald-700" />
        <div>
          <p className="mobile-body-md font-semibold text-ink">You approved the quotation</p>
          <p className="mobile-body-sm font-normal text-ink-body">{flow.required_deposit > 0 ? `The shop confirms your order once your deposit of ${peso(flow.required_deposit)} is verified. You can pay below.` : 'The shop will confirm your order soon.'}</p>
        </div>
      </div>
    );
  }

  if (flow.decision === 'changes_requested' && !flow.needs_approval) {
    return (
      <div className="card-soft mb-3 flex gap-3 p-4 md:mx-auto md:max-w-3xl">
        <FileText size={20} className="mt-0.5 shrink-0 text-ink-faint" />
        <div>
          <p className="mobile-body-md font-semibold text-ink">You asked for changes</p>
          <p className="mobile-body-sm font-normal text-ink-body">The shop will send you a new price.</p>
        </div>
      </div>
    );
  }

  if (!flow.needs_approval || !b) {
    return (
      <div className="card-soft mb-3 flex gap-3 p-4 md:mx-auto md:max-w-3xl">
        <FileText size={20} className="mt-0.5 shrink-0 text-ink-faint" />
        <div>
          <p className="mobile-body-md font-semibold text-ink">The shop is preparing your quotation</p>
          <p className="mobile-body-sm font-normal text-ink-body">
            {flow.quotation_status === 'estimate' && b ? `The current estimate is ${peso(b.total)}. It can still change, so you will be asked to approve the final quotation.` : 'You will be asked to approve the final price and date before anything starts.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Quotation to approve" className="card-soft mb-3 p-4 md:mx-auto md:max-w-3xl">
      <p className="mobile-overline text-taupe">Needs your answer</p>
      <h2 className="mobile-h4 mb-3 text-ink">Your price</h2>

      <dl className="mobile-body-sm space-y-1.5 font-normal">
        <div className="flex justify-between"><dt className="text-ink-muted">Service</dt><dd>{peso(b.base_price)}</dd></div>
        {b.quantity_adjustment !== 0 && <div className="flex justify-between"><dt className="text-ink-muted">Quantity pricing</dt><dd>{b.quantity_adjustment > 0 ? '+' : '−'}{peso(Math.abs(b.quantity_adjustment))}</dd></div>}
        {b.additional_charges.map((r, i) => <div key={`a${i}`} className="flex justify-between"><dt className="text-ink-muted">{r.label}</dt><dd>{peso(r.amount)}</dd></div>)}
        {b.customer_provided_deduction.map((r, i) => <div key={`d${i}`} className="flex justify-between"><dt className="text-ink-muted">Less: {r.label}</dt><dd>−{peso(r.amount)}</dd></div>)}
        <div className="flex justify-between pt-2 font-semibold text-ink"><dt>Total</dt><dd>{peso(b.total)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Deposit to start</dt><dd>{peso(flow.required_deposit)}</dd></div>
        {dueDate && <div className="flex justify-between"><dt className="text-ink-muted">Expected completion</dt><dd>{new Date(dueDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>}
      </dl>

      {flow.terms_text && <p className="mobile-body-sm mt-3 rounded-xl bg-sunken p-3 font-normal text-ink">{flow.terms_text}</p>}
      {flow.valid_until && <p className="mobile-caption mt-2 text-ink-muted">This price is valid until {new Date(flow.valid_until).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>}

      {flow.policy && (
        <div className="mt-3 rounded-xl bg-sunken p-3">
          <p className="mobile-caption mb-1 font-semibold text-ink-muted">Cancellation policy</p>
          <p className="mobile-body-sm font-normal text-ink-body">{flow.policy}</p>
        </div>
      )}

      <QuotationDecision orderId={orderId} expired={Boolean(flow.expired)} onDone={onApproved} />
    </section>
  );
}
