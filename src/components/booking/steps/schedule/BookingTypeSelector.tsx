import React from 'react';
import { Check } from 'lucide-react';
import { BookingTypeOption } from '../../types';

interface BookingTypeSelectorProps {
  readonly availableBookingTypes: BookingTypeOption[];
  readonly appointmentType: string;
  readonly onSelectType: (val: string) => void;
  /** The question above the choices; the booking asks it of the customer, the shop's follow-up of itself. */
  readonly title?: string;
}

export default function BookingTypeSelector({
  availableBookingTypes,
  appointmentType,
  onSelectType,
  title = 'What is the purpose of your visit?',
}: BookingTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="mobile-h4 font-semibold text-ink block">
        {title} <span className="text-danger">*</span>
      </label>
      <div className="grid grid-cols-1 gap-2.5">
        {availableBookingTypes.map((t) => {
          const isSelected = appointmentType === t.value;
          return (
            <button
              type="button"
              key={t.value}
              onClick={() => onSelectType(t.value)}
              className={`min-h-[64px] flex items-center justify-between gap-3.5 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-taupe bg-taupe/[0.08] ring-2 ring-taupe/20 shadow-xs'
                  : 'border-line bg-surface hover:border-taupe/40 hover:bg-canvas/50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'bg-taupe/15 text-taupe' : 'bg-sunken text-ink-faint'
                  }`}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-ink' : 'text-ink-body'}`}>
                    {t.label}
                  </p>
                  <p className={`mobile-caption mt-0.5 font-normal ${isSelected ? 'text-ink-muted' : 'text-ink-faint'}`}>
                    {t.hint}
                  </p>
                </div>
              </div>

              {/* Radio check indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'border-taupe bg-taupe text-white' : 'border-line-strong bg-white/70'
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

