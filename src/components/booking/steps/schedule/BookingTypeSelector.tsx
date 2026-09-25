import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BookingTypeOption } from '../../types';

interface BookingTypeSelectorProps {
  readonly availableBookingTypes: BookingTypeOption[];
  readonly appointmentType: string;
  readonly onSelectType: (val: string) => void;
}

export default function BookingTypeSelector({
  availableBookingTypes,
  appointmentType,
  onSelectType,
}: BookingTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="mobile-h4 text-ink block">
        What are you coming in for? <span className="text-danger">*</span>
      </label>
      <div className="grid grid-cols-1 gap-2.5">
        {availableBookingTypes.map((t) => {
          const isSelected = appointmentType === t.value;
          return (
            <button
              type="button"
              key={t.value}
              onClick={() => onSelectType(t.value)}
              className={`min-h-[56px] flex items-center gap-3.5 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20'
                  : 'border-line bg-surface hover:border-taupe/40'
              }`}
            >
              <span className={`shrink-0 ${isSelected ? 'text-taupe' : 'text-ink-faint'}`}>
                {t.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? 'text-ink' : 'text-ink-body'}`}>
                  {t.label}
                </p>
                <p className="mobile-caption text-ink-faint mt-0.5 font-normal">{t.hint}</p>
              </div>
              <ChevronRight
                size={18}
                className={`shrink-0 ${isSelected ? 'text-taupe' : 'text-ink-faint'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
