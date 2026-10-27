'use client';

import React from 'react';
import type { PublicService } from '@/components/store-storefront/types';

export function peso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

type Requirements = NonNullable<PublicService['order_requirements']>;

export function measurementCopy(r?: Requirements): string {
  switch (r?.measurement_requirement) {
    case 'none':
      return 'No measurements needed for this service.';
    case 'existing':
      return 'The shop works from measurements it already has on file for you.';
    default:
      return 'The shop takes your measurements in person before cutting.';
  }
}

export function paymentCopy(r?: Requirements): string {
  switch (r?.payment_policy) {
    case 'none':
      return 'Nothing to pay before production starts.';
    case 'full':
      return 'Full payment is needed before production starts.';
    default:
      return `A ${r?.payment_policy_percent ?? 50}% deposit is needed before production starts.`;
  }
}

// Each step's heading, named after the matching step of the walk-in wizard.
export function StepIntro({ title, text }: Readonly<{ title: string; text: string }>) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink text-balance">{title}</h2>
      <p className="text-sm text-ink-muted mt-0.5">{text}</p>
    </div>
  );
}

export function SectionLabel({
  children,
  htmlFor,
  as = 'label',
}: Readonly<{ children: React.ReactNode; htmlFor?: string; as?: 'label' | 'legend' | 'p' }>) {
  const cls = 'mobile-h4 text-ink block mb-0';
  if (as === 'legend') return <legend className={`${cls} mb-2.5`}>{children}</legend>;
  if (as === 'p' || !htmlFor) return <p className={cls}>{children}</p>;
  return <label htmlFor={htmlFor} className={cls}>{children}</label>;
}

// Same radio-card look as the booking wizard's material picker.
export function ChoiceCard({
  selected,
  onSelect,
  label,
  detail,
  trailing,
}: Readonly<{ selected: boolean; onSelect: () => void; label: string; detail?: string; trailing?: string }>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`min-h-[52px] w-full p-3.5 rounded-none border text-left transition-colors cursor-pointer flex items-center gap-3 ${
        selected ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20' : 'border-line bg-surface hover:border-taupe/40'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
          selected ? 'border-taupe bg-taupe' : 'border-line bg-surface'
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${selected ? 'text-ink' : 'text-ink-body'}`}>{label}</span>
        {detail && <span className="block mobile-caption text-ink-muted mt-0.5">{detail}</span>}
      </span>
      {trailing && <span className="text-sm font-semibold text-ink tabular-nums shrink-0">{trailing}</span>}
    </button>
  );
}
