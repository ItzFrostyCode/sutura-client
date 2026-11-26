'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Sparkles, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { TrackedOrder } from '@/components/shared/OrderTrackingView';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
};

interface OrderReceiptBreakdownProps {
  readonly order: TrackedOrder;
}

/**
 * The order's payment summary: what was paid, what is left, and how the total is made (base price, rush fee,
 * discount), with the due dates. Not an official receipt: SUTURA records the payments made to the shop, it does not
 * issue BIR receipts. "Download" prints / saves this summary.
 */
export default function OrderReceiptBreakdown({ order }: OrderReceiptBreakdownProps) {
  const [showDetails, setShowDetails] = useState(true);

  const total = Number(order.total_amount || 0);
  const balance = Number(order.balance || 0);
  const rushFee = Number(order.rush_fee || 0);
  const discount = Number(order.discount_amount || 0);
  const totalPaid = Math.max(0, total - balance);
  const isPaid = balance <= 0 && total > 0;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const quotationBreakdown = order.quotation_flow?.breakdown;
  const basePrice = quotationBreakdown?.base_price ?? (total - rushFee + discount);

  return (
    <section aria-label="Payment summary" className="card-soft overflow-hidden border border-line bg-surface p-0 shadow-sm print:border-none print:shadow-none">
      {/* Receipt Header Ribbon */}
      <div className="border-b border-dashed border-line bg-sunken/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="mobile-h3 font-bold tracking-tight text-ink sm:text-xl">Payment summary</h2>
            <p className="mobile-caption mt-0.5 text-ink-muted">
              #{order.order_number} · <span className="font-semibold text-ink">{order.store?.name ?? 'SUTURA Partner Store'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-sunken active:opacity-75"
              aria-label="Print or save this payment summary"
            >
              <Download size={15} className="text-ink-muted" />
              <span>Download</span>
            </button>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              {isPaid ? 'FULLY PAID' : balance < total ? 'PARTIALLY PAID' : 'PENDING PAYMENT'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Financial Numbers: Paid vs Balance */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line bg-surface p-4 sm:p-5">
        <div className="pr-3">
          <p className="mobile-caption font-medium uppercase tracking-wider text-ink-muted">Total Paid So Far</p>
          <p className="mobile-h2 mt-1 font-mono font-bold text-emerald-700 sm:text-2xl">
            {peso(totalPaid)}
          </p>
          <p className="mobile-caption mt-0.5 text-ink-muted">
            {isPaid ? 'All dues settled' : `Out of ${peso(total)}`}
          </p>
        </div>
        <div className="pl-3 sm:pl-5">
          <p className="mobile-caption font-medium uppercase tracking-wider text-ink-muted">Remaining Balance</p>
          <p className={`mobile-h2 mt-1 font-mono font-bold sm:text-2xl ${balance > 0 ? 'text-amber-800' : 'text-ink-muted'}`}>
            {peso(balance)}
          </p>
          <p className="mobile-caption mt-0.5 text-ink-muted">
            {order.balance_due_by
              ? `Due by ${formatDate(order.balance_due_by)}`
              : order.due_date
                ? `Due on handover (${formatDate(order.due_date)})`
                : 'Due upon completion'}
          </p>
        </div>
      </div>

      {/* Itemized Calculation Breakdown (Toggleable) */}
      <div className="p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold text-ink"
        >
          <span className="flex items-center gap-1.5">
            <span>Itemized Calculation Breakdown</span>
            <span className="rounded-full bg-sunken px-2 py-0.5 text-[11px] font-normal text-ink-muted">
              {showDetails ? 'Hide' : 'Show details'}
            </span>
          </span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetails && (
          <div className="mt-4 space-y-2.5 rounded-xl border border-dashed border-line bg-sunken/40 p-4 font-mono text-sm">
            {/* Base Service */}
            <div className="flex justify-between text-ink">
              <span>
                {order.catalog_item_name ?? order.service_name ?? 'Tailoring Service'}
                {(order.quantity ?? 1) > 1 && <span className="text-ink-muted"> (×{order.quantity})</span>}
              </span>
              <span>{peso(basePrice)}</span>
            </div>

            {/* Additional Charges from quotation if available */}
            {quotationBreakdown?.additional_charges?.map((charge, idx) => (
              <div key={idx} className="flex justify-between text-xs text-ink-body">
                <span className="pl-2">+ {charge.label}</span>
                <span>{peso(charge.amount)}</span>
              </div>
            ))}

            {/* Rush Fee Line */}
            {order.is_rush && (
              <div className="flex justify-between font-semibold text-amber-900">
                <span className="flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Rush Priority Fee</span>
                </span>
                <span>+{peso(rushFee)}</span>
              </div>
            )}

            {/* Discount Line */}
            {discount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>− Promotional Discount</span>
                <span>−{peso(discount)}</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-dashed border-line pt-2" />

            {/* Net Total */}
            <div className="flex justify-between text-base font-bold text-ink">
              <span>Overall Total</span>
              <span>{peso(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700">
              <span>Total Paid &amp; Verified</span>
              <span>−{peso(totalPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-sm font-bold text-ink">
              <span>Net Balance Payable</span>
              <span className={balance > 0 ? 'text-amber-800' : 'text-emerald-700'}>{peso(balance)}</span>
            </div>
          </div>
        )}

        {/* Timelines: Due Date vs Estimated Completion */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3">
            <Clock size={16} className="mt-0.5 shrink-0 text-taupe" />
            <div className="min-w-0">
              <p className="mobile-caption font-semibold text-ink">Estimated Completion</p>
              <p className="mobile-body-sm font-medium text-ink-body">
                {formatDate(order.estimated_ready_at || order.due_date)}
              </p>
              {order.is_rush && (
                <p className="mobile-caption text-amber-700">⚡ Expedited turnaround requested</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-taupe" />
            <div className="min-w-0">
              <p className="mobile-caption font-semibold text-ink">Payment Due Date</p>
              <p className="mobile-body-sm font-medium text-ink-body">
                {formatDate(order.balance_due_by || order.due_date)}
              </p>
              <p className="mobile-caption text-ink-muted">
                {isPaid ? 'Balance fully cleared' : 'Pay via GCash before release'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
