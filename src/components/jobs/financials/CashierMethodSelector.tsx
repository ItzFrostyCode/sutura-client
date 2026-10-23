import React from 'react';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';
import { CASHIER_LABEL } from './CashierAmountSection';

interface CashierMethodSelectorProps {
  readonly method: string;
  readonly setMethod: (method: string) => void;
}

const CHANNELS = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'gcash', label: 'GCash', icon: Smartphone },
  { key: 'paymaya', label: 'Maya', icon: CreditCard },
  { key: 'other', label: 'Other', icon: CreditCard },
];

export function CashierMethodSelector({ method, setMethod }: CashierMethodSelectorProps) {
  return (
    <div>
      <span className={CASHIER_LABEL}>Payment Channel</span>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {CHANNELS.map((m) => {
          const isSelected = method === m.key;
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setMethod(m.key)}
              className={`flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border text-[13px] transition-colors ${
                isSelected
                  ? 'border-2 border-ink bg-amber-500/[0.06] font-semibold text-ink'
                  : 'border-line bg-surface text-ink-body hover:bg-sunken'
              }`}
            >
              <Icon size={20} className={isSelected ? 'text-ink' : 'text-ink-muted'} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
