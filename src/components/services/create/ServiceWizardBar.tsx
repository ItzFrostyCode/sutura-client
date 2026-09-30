'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

interface ServiceWizardBarProps {
  readonly step: number;
  readonly total: number;
  readonly last: boolean;
  readonly saving: boolean;
  readonly optional?: boolean;
  readonly finishLabel?: string;
  readonly onBack: () => void;
  readonly onNext: () => void;
}

// Phones (320–599px): a white full-width bar fixed to the bottom of the screen, buttons inset inside it.
// Tablet and desktop (600px+): the same two buttons sit at the bottom of the form's white panel.
export default function ServiceWizardBar({ step, total, last, saving, optional, finishLabel = 'Create service', onBack, onNext }: Readonly<ServiceWizardBarProps>) {
  return (
    <div className="min-[600px]:mt-8 max-[599px]:fixed max-[599px]:inset-x-0 max-[599px]:bottom-0 max-[599px]:z-40 max-[599px]:mx-auto max-[599px]:bg-white max-[599px]:border-t max-[599px]:border-line max-[599px]:pb-[env(safe-area-inset-bottom)]">
      <div className="flex gap-3 max-[599px]:px-4 max-[599px]:min-[375px]:px-6 max-[599px]:pt-3 max-[599px]:pb-4">
        <button type="button" onClick={onBack} disabled={saving} className="h-[52px] px-5 border border-line-strong bg-white text-ink font-medium text-base flex items-center justify-center gap-2 cursor-pointer hover:bg-sunken disabled:opacity-50">
          <ArrowLeft size={18} /> <span className="max-[374px]:hidden">{step === 0 ? 'Cancel' : 'Back'}</span>
        </button>
        <button type="button" onClick={onNext} disabled={saving} className="flex-1 h-[52px] bg-taupe hover:bg-taupe-hover text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : last ? <Check size={18} /> : null}
          {last ? finishLabel : optional ? 'Next (optional)' : 'Next'}
          {!last && !saving && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
