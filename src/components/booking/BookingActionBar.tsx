'use client';

import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface BookingActionBarProps {
  readonly step: number;
  readonly onNextStep: () => void;
  readonly step2NextDisabled: boolean;
  readonly submitting: boolean;
  readonly uploadingReceipt: boolean;
  readonly returnToReview?: boolean;
}

export default function BookingActionBar({
  step,
  onNextStep,
  step2NextDisabled,
  submitting,
  uploadingReceipt,
  returnToReview,
}: BookingActionBarProps) {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 max-w-[599px] mx-auto z-40 bg-surface border-t border-x border-line px-4 py-3 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-xl mx-auto">
        {step === 1 && (
          <button
            type="button"
            onClick={onNextStep}
            className="w-full min-h-[48px] h-[52px] bg-taupe hover:bg-taupe-hover text-white text-base font-semibold rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <span>{returnToReview ? 'Return to Review' : 'Continue'}</span>
            <ArrowRight size={18} />
          </button>
        )}
        {step === 2 && (
          <button
            type="button"
            onClick={onNextStep}
            disabled={step2NextDisabled}
            className="w-full min-h-[48px] h-[52px] bg-taupe hover:bg-taupe-hover text-white text-base font-semibold rounded-none transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <span>{returnToReview ? 'Return to Review' : 'Review & Confirm'}</span>
            <ArrowRight size={18} />
          </button>
        )}
        {step === 3 && (
          <button
            type="submit"
            form="booking-form"
            disabled={submitting || uploadingReceipt}
            className="w-full min-h-[48px] h-[52px] bg-taupe hover:bg-taupe-hover text-white text-base font-semibold rounded-none transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            {(submitting || uploadingReceipt) && <Loader2 size={18} className="animate-spin" />}
            <span>
              {submitting
                ? 'Processing...'
                : uploadingReceipt
                ? 'Uploading receipt...'
                : 'Book Appointment'}
            </span>
          </button>
        )}
      </div>
    </footer>
  );
}
