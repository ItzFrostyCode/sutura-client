import React from 'react';
import { Scissors, Store, Check } from 'lucide-react';
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
      <p className="mobile-h4 font-semibold text-ink">What is the visit about?</p>
      <div className={`grid gap-2.5 ${locked ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {shown.map(({ value, label, hint, Icon }) => {
          const on = kind === value;
          return (
            <button
              type="button"
              key={value}
              disabled={locked}
              onClick={() => onChange(value)}
              className={`min-h-[64px] flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                on
                  ? 'border-taupe bg-taupe/[0.08] ring-2 ring-taupe/20 shadow-xs'
                  : 'border-line bg-surface hover:border-taupe/40 hover:bg-canvas/50 cursor-pointer'
              } ${locked ? 'cursor-default' : ''}`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    on ? 'bg-taupe/15 text-taupe' : 'bg-sunken text-ink-faint'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`block text-sm sm:text-base font-semibold ${on ? 'text-ink' : 'text-ink-body'}`}>
                    {label}
                  </span>
                  <span className={`block mobile-caption font-normal mt-0.5 ${on ? 'text-ink-muted' : 'text-ink-faint'}`}>
                    {hint}
                  </span>
                </div>
              </div>

              {/* Radio check indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  on ? 'border-taupe bg-taupe text-white' : 'border-line-strong bg-white/70'
                }`}
              >
                {on && <Check size={12} strokeWidth={3} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

