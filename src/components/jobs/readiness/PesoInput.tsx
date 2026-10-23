import React, { useEffect, useState } from 'react';
import { PLAIN_FIELD } from '@/components/shared/plainForm';

interface PesoInputProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly placeholder?: string;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const show = (v: number) => (v ? String(v) : '');

/**
 * A field for peso amounts, with the "₱" sign inside the box. It keeps what is typed as text (so "0." and "499.5" can
 * be typed) and has no up/down steppers that nudge the price by a cent; the number goes to the parent as you type.
 */
export default function PesoInput({ value, onChange, placeholder = '0.00', ariaLabel, className = '' }: PesoInputProps) {
  const [text, setText] = useState(show(value));
  // The parent changed the number itself (a Reset): show it.
  useEffect(() => {
    if ((Number(text) || 0) !== (value || 0)) setText(show(value));
  }, [value, text]);

  return (
    <span className={`relative block ${className}`}>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-espresso/60">₱</span>
      <input
        aria-label={ariaLabel}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const next = e.target.value.replace(/,/g, '');
          if (!/^\d*\.?\d{0,2}$/.test(next)) return;
          setText(next);
          onChange(Number(next) || 0);
        }}
        placeholder={placeholder}
        className={`${PLAIN_FIELD} pl-7`}
      />
    </span>
  );
}
