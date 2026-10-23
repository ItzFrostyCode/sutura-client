import React from 'react';
import { FileText, Printer, CheckCircle2, Tag } from 'lucide-react';
import { Job } from '../jobTypes';
import { ComputedFinancials } from './financialsTypes';
import { BTN_SM } from '@/components/shared/plainForm';
import { printInPlace } from '@/lib/printInPlace';
import { confirmDialog } from '@/store/useConfirmStore';
import SectionHeader from '../ui/SectionHeader';

interface FinancialStatementSummaryProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
  /** Takes the discount off the order again (owner or branch manager). */
  readonly onRemoveDiscount?: () => Promise<void>;
  readonly canRemoveDiscount?: boolean;
  /** Shown at the bottom of the card (the payment-rule link when there is no discount form). */
  readonly footer?: React.ReactNode;
}

const money = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinancialStatementSummary({ job, financials, footer, onRemoveDiscount, canRemoveDiscount }: FinancialStatementSummaryProps) {
  const { totalAmount, remainingBalance, discountApplied, amountPaid, percentCollected, isDownpaymentMet, requiredDeposit, depositLabel, statusBadge } = financials;
  const markerLeft = totalAmount > 0 ? Math.min(100, (requiredDeposit / totalAmount) * 100) : 0;
  const settled = remainingBalance === 0;
  const discountReason = typeof job.custom_order_data?.discount_reason === 'string' ? job.custom_order_data.discount_reason : '';
  const removeDiscount = async () => {
    if (!onRemoveDiscount) return;
    const ok = await confirmDialog({
      title: 'Remove this discount?',
      message: `The ${money(discountApplied)} discount is taken off and the balance goes back up by ${money(discountApplied)}. You can apply a new discount after.`,
      confirmLabel: 'Remove discount',
      danger: true,
    });
    if (ok) await onRemoveDiscount();
  };

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6" aria-label="Financial statement">
      <SectionHeader
        icon={FileText}
        title="Financial Statement"
        subtitle="Contract balance, collections, and discounts"
        badge={<span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusBadge.cls}`}>{statusBadge.label}</span>}
        actions={(
          <button type="button" onClick={() => printInPlace(`/print/jobs/${job.id}/receipt`)} title="Print full statement" className={BTN_SM}>
            <Printer size={14} />
            <span className="hidden sm:inline">Print Statement</span>
          </button>
        )}
      />

      {/* Collection progress */}
      <div className="space-y-2 rounded-xl bg-sunken/70 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{percentCollected}% Collected</span>
          <span className="text-[13px] text-ink-muted">{money(amountPaid + discountApplied)} of {money(totalAmount)}</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-espresso/[0.08]">
          <div className={`h-full rounded-full transition-all duration-500 ${settled ? 'bg-sage' : 'bg-espresso'}`} style={{ width: `${percentCollected}%` }} />
          {/* Required-payment marker, from this job's payment policy */}
          {requiredDeposit > 0 && markerLeft < 100 && (
            <div className="absolute bottom-0 top-0 z-10 w-0.5 bg-espresso/25" style={{ left: `${markerLeft}%` }} title={`${depositLabel} threshold`} />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-ink-muted">
          <span>Intake: ₱0.00</span>
          <span className={`font-medium ${isDownpaymentMet ? 'text-emerald-700' : 'text-amber-700'}`}>
            {requiredDeposit > 0 ? `${depositLabel}: ${money(requiredDeposit)} ${isDownpaymentMet ? '✓' : '(Required)'}` : 'No payment needed first'}
          </span>
          <span>Total: {money(totalAmount)}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Total Contract Price</span>
          <span className="font-medium text-ink">{money(totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /> Payments Collected</span>
          <span className="font-medium text-emerald-700">−{money(amountPaid)}</span>
        </div>
        {discountApplied > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-rose-700"><Tag size={14} /> Courtesy Discount</span>
              <span className="font-medium text-rose-700">−{money(discountApplied)}</span>
            </div>
            {discountReason && <p className="mt-0.5 text-[13px] text-ink-muted">{discountReason}</p>}
            {canRemoveDiscount && onRemoveDiscount && (
              <button type="button" onClick={removeDiscount} className="min-h-11 cursor-pointer text-[13px] font-medium text-ink-muted hover:text-danger">
                Remove
              </button>
            )}
          </div>
        )}
        <div className="flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Remaining Balance</span>
            <span className="text-[13px] text-ink-muted">{settled ? 'Fully settled order' : 'Payable upon fitting or claim'}</span>
          </div>
          <span className={`text-[32px] font-semibold leading-none tracking-tight sm:text-[36px] ${settled ? 'text-sage' : 'text-ink'}`}>{money(remainingBalance)}</span>
        </div>
      </div>
      {footer}
    </section>
  );
}
