import React from 'react';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';

interface QuotationReasonProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
  /** True when this is a change to a price that was already sent; false for the first pay-at-pick-up. */
  readonly forChange: boolean;
  readonly error?: string | null;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
}

/** Shown only when this save changes the price, date or terms of a sent price (or sets pay-at-pick-up for the first time). */
export default function QuotationReason({ value, onChange, forChange, error, inputRef }: QuotationReasonProps) {
  return (
    <div className="border-t border-line pt-5">
      <label className={`${PLAIN_LABEL} block`}>{forChange ? 'You already sent a price. Why are you changing it?' : 'Why can this customer pay when picking up?'}
        <input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} maxLength={255} aria-invalid={Boolean(error)} className={`${PLAIN_FIELD} mt-1.5 font-normal ${error ? 'border-danger' : ''}`} />
      </label>
      {error ? <p role="alert" className="mt-1 text-[13px] text-danger">{error}</p> : <p className="mt-1 text-[13px] text-ink-muted">Saved in the order history.</p>}
    </div>
  );
}
