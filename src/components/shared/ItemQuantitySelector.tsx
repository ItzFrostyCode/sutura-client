'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface ItemQuantitySelectorProps {
  quantity: number;
  minQuantity?: number;
  onChange: (quantity: number) => void;
  label?: string;
  hideLabel?: boolean;
}

export default function ItemQuantitySelector({
  quantity,
  minQuantity = 1,
  onChange,
  label = 'Quantity',
  hideLabel = false,
}: ItemQuantitySelectorProps) {
  const min = Math.max(1, minQuantity);

  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    onChange(quantity + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      onChange(min);
      return;
    }
    const parsed = parseInt(val, 10);
    onChange(isNaN(parsed) ? min : parsed);
  };

  const handleBlur = () => {
    if (quantity < min) {
      onChange(min);
    }
  };

  return (
    <div className="flex items-start gap-0 py-3.5 border-b border-line">
      {!hideLabel && (
        <div className="w-[110px] shrink-0 text-sm text-ink-muted">
          <span>{label}</span>
          {min > 1 && (
            <span className="block text-[11px] text-taupe font-medium">Min: {min}</span>
          )}
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= min}
            aria-label="Decrease quantity"
            className="w-11 h-11 border border-line bg-white hover:bg-canvas disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center text-ink transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Minus size={15} />
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-label="Quantity"
            className="w-16 h-11 border border-line bg-white text-center font-semibold text-ink text-sm focus:outline-none focus:border-taupe"
          />

          <button
            type="button"
            onClick={handleIncrement}
            aria-label="Increase quantity"
            className="w-11 h-11 border border-line bg-white hover:bg-canvas flex items-center justify-center text-ink transition-colors cursor-pointer"
          >
            <Plus size={15} />
          </button>
        </div>

        {min > 1 && (
          <p className="text-[11px] text-ink-muted">
            The shop requires a minimum order of {min} pieces for this offering.
          </p>
        )}
      </div>
    </div>
  );
}
