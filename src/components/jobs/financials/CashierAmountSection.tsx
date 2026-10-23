import React from 'react';
import { ComputedFinancials } from './financialsTypes';

export const CASHIER_LABEL = 'mb-2 block text-sm font-medium text-ink';

interface Props {
  readonly financials: ComputedFinancials;
  readonly amount: string;
  readonly setAmount: (a: string) => void;
}

const AMOUNT_LABEL: Record<string, string> = {
  cash: 'Amount to pay',
  gcash: 'Amount sent via GCash',
  paymaya: 'Amount sent via Maya',
  other: 'Amount received',
};
const AMOUNT_HINT: Record<string, string> = {
  gcash: "Type the amount shown on the customer's GCash receipt.",
  paymaya: "Type the amount shown on the customer's Maya receipt.",
};

const same = (a: string, b: number) => Math.abs((Number.parseFloat(a) || 0) - b) < 0.005;

/** Preset settlement buttons. */
export function CashierPresetSection({ financials, amount, setAmount }: Props) {
  const { remainingBalance, totalAmount, amountPaid, isDownpaymentMet, requiredDeposit, depositLabel } = financials;
  const showDeposit = !isDownpaymentMet && requiredDeposit > 0 && requiredDeposit < totalAmount;
  const dpShortfall = Math.max(0, requiredDeposit - amountPaid);
  const presets = [
    { label: `Full Balance (₱${remainingBalance.toFixed(2)})`, value: remainingBalance },
    ...(showDeposit ? [{ label: `${depositLabel} (₱${requiredDeposit.toFixed(2)})`, value: dpShortfall }] : []),
  ];

  return (
    <div>
      <span className={CASHIER_LABEL}>Preset Settlement</span>
      <div className="grid grid-cols-2 gap-3">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { if (p.value > 0) setAmount(p.value.toFixed(2)); }}
            className={`min-h-12 cursor-pointer rounded-xl px-2 text-[13px] transition-colors ${
              same(amount, p.value) ? 'border-2 border-ink bg-sunken font-semibold text-ink' : 'border border-line bg-surface font-medium text-ink-body hover:bg-sunken'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The big amount field; its label follows the payment channel chosen above it. */
export function CashierAmountField({ financials, amount, setAmount, method }: Props & { readonly method: string }) {
  const { remainingBalance } = financials;
  const hint = AMOUNT_HINT[method];
  return (
    <div>
      <label htmlFor="payment-amount" className={CASHIER_LABEL}>
        {AMOUNT_LABEL[method] ?? AMOUNT_LABEL.other} <span className="text-danger">*</span>
      </label>
      {hint && <p className="-mt-1 mb-2 text-[13px] text-ink-muted">{hint}</p>}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-ink-muted">₱</span>
        <input
          id="payment-amount"
          type="number"
          step="0.01"
          min="0.01"
          max={remainingBalance}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="h-14 w-full rounded-xl border border-line-strong bg-white pl-10 pr-4 text-xl font-semibold text-ink placeholder:text-ink-faint focus:border-espresso/60 focus:outline-none focus:ring-2 focus:ring-espresso/15"
        />
      </div>
    </div>
  );
}
