import React from 'react';
import { Tag, Loader2 } from 'lucide-react';
import { ComputedFinancials } from './financialsTypes';

interface FinancialDiscountFormProps {
  readonly financials: ComputedFinancials;
  readonly showDiscountForm: boolean;
  readonly setShowDiscountForm: (show: boolean) => void;
  readonly discountType: 'fixed' | 'percent';
  readonly setDiscountType: (type: 'fixed' | 'percent') => void;
  readonly discountInput: string;
  readonly setDiscountInput: (val: string) => void;
  readonly discountReason: string;
  readonly setDiscountReason: (val: string) => void;
  readonly applyingDiscount: boolean;
  readonly onApplyDiscountSubmit: () => Promise<void>;
}

const PRESET_CHIPS = [
  { label: 'Suki Patron', reason: 'Suki Customer (Loyal Patron)', type: 'fixed' as const, val: 100 },
  { label: 'Student (10%)', reason: 'Student ID Discount (10% Off)', type: 'percent' as const, val: 10 },
  { label: 'Senior / PWD (20%)', reason: 'Senior Citizen / PWD Courtesy (20% Off)', type: 'percent' as const, val: 20 },
  { label: 'Tawad / Negotiated', reason: 'Negotiated / Tawad with Customer', type: 'fixed' as const, val: 0 },
  { label: 'Promo / Seasonal', reason: 'Store Promotional Courtesy Discount', type: 'fixed' as const, val: 0 },
];

export function FinancialDiscountForm({
  financials,
  showDiscountForm,
  setShowDiscountForm,
  discountType,
  setDiscountType,
  discountInput,
  setDiscountInput,
  discountReason,
  setDiscountReason,
  applyingDiscount,
  onApplyDiscountSubmit,
}: FinancialDiscountFormProps) {
  const { remainingBalance, totalAmount, jobIsCompleted, jobIsCancelled } = financials;

  if (jobIsCompleted || jobIsCancelled || remainingBalance <= 0) {
    return null;
  }

  if (!showDiscountForm) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDiscountForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-rose-300 hover:border-rose-400 text-rose-700 hover:bg-rose-50/50 text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <Tag size={13} />
          <span>Apply Suki / Courtesy Discount</span>
        </button>
      </div>
    );
  }

  const rawVal = Number.parseFloat(discountInput) || 0;
  const computedAmt = discountType === 'percent'
    ? Math.min(remainingBalance, Math.round(((totalAmount * rawVal) / 100) * 100) / 100)
    : Math.min(remainingBalance, rawVal);
  const projectedBal = Math.max(0, remainingBalance - computedAmt);

  return (
    <div className="pt-1">
      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
            <Tag size={14} className="text-rose-600" />
            Apply Suki / Tawad / Courtesy Discount
          </div>
          <div className="flex items-center gap-1 bg-white border border-rose-200 rounded-lg p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                discountType === 'fixed'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              ₱ Fixed
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('percent')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                discountType === 'percent'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              % Percent
            </button>
          </div>
        </div>

        {/* Quick Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-rose-800/70 uppercase tracking-wider mr-0.5">Quick Presets:</span>
          {PRESET_CHIPS.map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setDiscountType(chip.type);
                setDiscountReason(chip.reason);
                if (chip.val > 0) {
                  setDiscountInput(String(chip.val));
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-rose-100/70 border border-rose-200 hover:border-rose-300 text-[11px] font-medium text-rose-800 rounded-lg transition-all shadow-2xs cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold text-xs">
              {discountType === 'fixed' ? '₱' : '%'}
            </span>
            <input
              type="number"
              step={discountType === 'fixed' ? '0.01' : '1'}
              min="0.01"
              max={discountType === 'fixed' ? remainingBalance : 100}
              value={discountInput}
              onChange={e => setDiscountInput(e.target.value)}
              placeholder={discountType === 'fixed' ? 'Discount in ₱ (e.g. 150)' : 'Discount in % (e.g. 10)'}
              className="w-full pl-7 pr-3 py-2 bg-surface border border-rose-200 rounded-lg text-ink focus:outline-none focus:border-rose-400 text-xs shadow-2xs font-semibold"
            />
          </div>
          <input
            type="text"
            value={discountReason}
            onChange={e => setDiscountReason(e.target.value)}
            placeholder="Reason (e.g. Suki loyal customer / Tawad)"
            className="w-full px-3 py-2 bg-surface border border-rose-200 rounded-lg text-xs text-ink focus:outline-none focus:border-rose-400 shadow-2xs"
          />
        </div>

        {/* Live Calculation Preview Card */}
        {rawVal > 0 && (
          <div className="bg-white border border-rose-200 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs shadow-2xs gap-2">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] text-ink-muted uppercase block">Remaining</span>
                <span className="font-bold text-ink font-mono">₱{remainingBalance.toFixed(2)}</span>
              </div>
              <span className="text-rose-500 font-bold">−</span>
              <div>
                <span className="text-[10px] text-rose-700 uppercase block">Discount</span>
                <span className="font-bold text-rose-700 font-mono">₱{computedAmt.toFixed(2)}</span>
              </div>
              <span className="text-ink-muted font-bold">=</span>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase block">New Balance</span>
                <span className="font-bold text-emerald-700 font-mono">₱{projectedBal.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-[11px] text-rose-800 font-medium italic">
              {discountReason ? `"${discountReason}"` : 'Courtesy discount'}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setShowDiscountForm(false); setDiscountInput(''); setDiscountReason(''); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={applyingDiscount || !discountInput || Number.parseFloat(discountInput) <= 0}
            onClick={onApplyDiscountSubmit}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            {applyingDiscount ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Applying…</span>
              </>
            ) : (
              <span>Apply Discount</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
