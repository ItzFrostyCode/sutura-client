import React from 'react';
import { Tag, Loader2 } from 'lucide-react';
import { Job } from '../jobTypes';
import SectionHeader from '../ui/SectionHeader';
import { ComputedFinancials } from './financialsTypes';
import { BTN, BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';

interface FinancialDiscountFormProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
  readonly discountType: 'fixed' | 'percent';
  readonly setDiscountType: (type: 'fixed' | 'percent') => void;
  readonly discountInput: string;
  readonly setDiscountInput: (val: string) => void;
  readonly discountReason: string;
  readonly setDiscountReason: (val: string) => void;
  readonly applyingDiscount: boolean;
  readonly onApplyDiscountSubmit: () => Promise<void>;
  /** Left side of the footer row (the payment-rule link). */
  readonly footer?: React.ReactNode;
}

const PRESET_CHIPS = [
  { label: 'Suki Patron', reason: 'Suki Customer (Loyal Patron)', type: 'fixed' as const, val: 100 },
  { label: 'Student (10%)', reason: 'Student ID Discount (10% Off)', type: 'percent' as const, val: 10 },
  { label: 'Senior / PWD (20%)', reason: 'Senior Citizen / PWD Courtesy (20% Off)', type: 'percent' as const, val: 20 },
  { label: 'Tawad / Negotiated', reason: 'Negotiated / Tawad with Customer', type: 'fixed' as const, val: 0 },
  { label: 'Promo / Seasonal', reason: 'Store Promotional Courtesy Discount', type: 'fixed' as const, val: 0 },
];

const SEG = 'h-9 cursor-pointer rounded-lg px-3 text-[13px] transition-colors';

export function FinancialDiscountForm({
  job,
  financials,
  discountType,
  setDiscountType,
  discountInput,
  setDiscountInput,
  discountReason,
  setDiscountReason,
  applyingDiscount,
  onApplyDiscountSubmit,
  footer,
}: FinancialDiscountFormProps) {
  const { remainingBalance, totalAmount, jobIsCompleted, jobIsCancelled, discountApplied } = financials;
  const currentReason = typeof job.custom_order_data?.discount_reason === 'string' ? job.custom_order_data.discount_reason : '';
  if (jobIsCompleted || jobIsCancelled || remainingBalance <= 0) return null;

  const rawVal = Number.parseFloat(discountInput) || 0;
  const computedAmt = discountType === 'percent'
    ? Math.min(remainingBalance, Math.round(((totalAmount * rawVal) / 100) * 100) / 100)
    : Math.min(remainingBalance, rawVal);
  const projectedBal = Math.max(0, remainingBalance - computedAmt);
  const clear = () => { setDiscountInput(''); setDiscountReason(''); };

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6" aria-label="Apply discount">
      <SectionHeader
        icon={Tag}
        title="Apply Suki / Tawad / Courtesy Discount"
        actions={(
          <div className="flex rounded-xl bg-espresso/[0.05] p-1">
            {([['fixed', '₱ Fixed'], ['percent', '% Percent']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDiscountType(key)}
                className={`${SEG} ${discountType === key ? 'bg-white font-medium text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      />

      {discountApplied > 0 && (
        <p className="text-[13px] text-ink-body">
          Current discount: <span className="font-medium text-ink">₱{discountApplied.toFixed(2)}</span>{currentReason ? ` — ${currentReason}` : ''}. A new discount is added on top of it.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {PRESET_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              setDiscountType(chip.type);
              setDiscountReason(chip.reason);
              if (chip.val > 0) setDiscountInput(String(chip.val));
            }}
            className="h-9 cursor-pointer rounded-full border border-line bg-surface px-3.5 text-[13px] text-ink-body transition-colors hover:bg-sunken"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="discount-amount" className={PLAIN_LABEL}>{discountType === 'fixed' ? 'Discount in ₱ (e.g. 150)' : 'Discount in % (e.g. 10)'}</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">{discountType === 'fixed' ? '₱' : '%'}</span>
            <input
              id="discount-amount"
              type="number"
              step={discountType === 'fixed' ? '0.01' : '1'}
              min="0.01"
              max={discountType === 'fixed' ? remainingBalance : 100}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className={`${PLAIN_FIELD} pl-8`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="discount-reason" className={PLAIN_LABEL}>Reason (e.g. Suki loyal customer / Tawad)</label>
          <input id="discount-reason" type="text" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className={PLAIN_FIELD} />
        </div>
      </div>

      {rawVal > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunken/70 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-ink-muted">Remaining <span className="font-medium text-ink">₱{remainingBalance.toFixed(2)}</span></span>
            <span className="text-ink-faint">−</span>
            <span className="text-rose-700">Discount <span className="font-medium">₱{computedAmt.toFixed(2)}</span></span>
            <span className="text-ink-faint">=</span>
            <span className="text-emerald-700">New balance <span className="font-semibold">₱{projectedBal.toFixed(2)}</span></span>
          </div>
          <span className="text-xs italic text-ink-muted">{discountReason ? `"${discountReason}"` : 'Courtesy discount'}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div>{footer}</div>
        <div className="flex gap-2">
          <button type="button" onClick={clear} className={BTN}>Cancel</button>
          <button
            type="button"
            disabled={applyingDiscount || !discountInput || Number.parseFloat(discountInput) <= 0}
            onClick={onApplyDiscountSubmit}
            className={BTN_PRIMARY}
          >
            {applyingDiscount ? <><Loader2 size={14} className="animate-spin" /><span>Applying…</span></> : <span>Apply Discount</span>}
          </button>
        </div>
      </div>
    </section>
  );
}
