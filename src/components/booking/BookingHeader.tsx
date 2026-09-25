'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BookingHeaderProps {
  readonly onBack: () => void;
}

export default function BookingHeader({ onBack }: BookingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-line px-3.5 h-[52px] sm:h-[56px] flex items-center justify-between relative shadow-xs">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="w-11 h-11 -ml-1.5 rounded-full flex items-center justify-center text-ink hover:text-taupe hover:bg-sunken/40 transition-colors cursor-pointer active:scale-95"
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="mobile-h3 font-semibold text-ink text-center flex-1 pr-10">
        Book an Appointment
      </h1>
    </header>
  );
}
