import React from 'react';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';

interface CashierMethodSelectorProps {
  readonly method: string;
  readonly setMethod: (method: string) => void;
}

const CHANNELS = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'gcash', label: 'GCash', icon: Smartphone },
  { key: 'paymaya', label: 'PayMaya', icon: CreditCard },
];

export function CashierMethodSelector({ method, setMethod }: CashierMethodSelectorProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">Payment Channel</span>
      <div className="grid grid-cols-3 gap-2">
        {CHANNELS.map(m => {
          const isSelected = method === m.key;
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                isSelected
                  ? 'bg-taupe/10 border-taupe text-ink font-bold ring-1 ring-taupe/50'
                  : 'bg-canvas border-line text-ink-muted hover:text-ink hover:bg-surface'
              }`}
            >
              <Icon size={15} className={`mb-1 ${isSelected ? 'text-taupe' : 'text-ink-muted'}`} />
              <span className="text-[11px] leading-none">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
