import React from 'react';
import { Scissors, Store } from 'lucide-react';
import type { BookingKind } from '../../hooks/useBookingWizard';

interface Props {
  readonly kind: BookingKind;
  readonly onChange: (k: BookingKind) => void;
  /** Pre-picked because the customer came from a service or design. */
  readonly locked: boolean;
}

const OPTIONS: { value: BookingKind; label: string; hint: string; Icon: typeof Store }[] = [
  { value: 'service', label: 'Service', hint: 'A visit for one of the shop’s services or designs.', Icon: Scissors },
  { value: 'shop', label: 'Shop', hint: 'A general visit: talk to the shop, get measured, or something else.', Icon: Store },
];

export default function BookingKindSelector({ kind, onChange, locked }: Props) {
  const shown = locked ? OPTIONS.filter((o) => o.value === kind) : OPTIONS;
  return (
    <div className="space-y-2">
      <p className="mobile-h4 text-ink">What is the visit about?</p>
      <div className={`grid gap-2.5 ${locked ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {shown.map(({ value, label, hint, Icon }) => {
          const on = kind === value;
          return (
            <button
              type="button"
              key={value}
              disabled={locked}
              onClick={() => onChange(value)}
              className={`min-h-[56px] flex items-start gap-3 px-4 py-3 border text-left transition-colors ${
                on ? 'border-taupe bg-taupe/5' : 'border-line bg-surface hover:border-taupe/40 cursor-pointer'
              } ${locked ? 'cursor-default' : ''}`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${on ? 'text-taupe' : 'text-ink-faint'}`} />
              <span className="min-w-0">
                <span className="block text-base font-semibold text-ink">{label}</span>
                <span className="block mobile-caption text-ink-faint font-normal mt-0.5">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
