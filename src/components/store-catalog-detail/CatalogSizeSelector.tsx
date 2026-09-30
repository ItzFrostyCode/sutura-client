'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CatalogSizeSelectorProps {
  sizes: string[] | null | undefined;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  orderSuccess: { order_number: string; id: number } | null;
  onViewOrder: (id: number) => void;
  /** Owner view: the box header already says "Size". */
  hideLabel?: boolean;
}

export default function CatalogSizeSelector({
  sizes,
  selectedSize,
  onSelectSize,
  orderSuccess,
  onViewOrder,
  hideLabel,
}: CatalogSizeSelectorProps) {
  const hasSizes = sizes && sizes.length > 0;

  return (
    <div>
      {/* Size row — label on left, pills on right (matches mocked options-group-row) */}
      {hasSizes && (
        <div className="flex items-start gap-0 py-3.5 border-b border-line">
          {!hideLabel && <span className="w-[110px] shrink-0 text-sm text-ink-muted">Size</span>}
          <div className="flex-1 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(selectedSize === size ? '' : size)}
                className={`relative min-w-[48px] px-4 py-1.5 border text-sm font-medium transition-all overflow-hidden ${
                  selectedSize === size
                    ? 'border-taupe text-taupe'
                    : 'border-line-strong text-ink-body hover:border-taupe'
                }`}
              >
                {size}
                {/* Mocked corner triangle checkmark */}
                {selectedSize === size && (
                  <span
                    className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-taupe text-white text-[8px] flex items-center justify-center"
                    style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bespoke note */}
      <p className={`text-xs text-ink-muted ${hasSizes ? 'mt-2' : 'mt-3'}`}>
        Custom tailored to your bespoke measurements during fitting.
      </p>

      {orderSuccess && (
        <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 px-3 py-2 mt-3">
          <CheckCircle2 size={16} className="text-sage shrink-0" />
          <p className="text-sm text-ink-body flex-1">Order {orderSuccess.order_number} placed.</p>
          <button
            type="button"
            onClick={() => onViewOrder(orderSuccess.id)}
            className="text-xs font-semibold text-taupe shrink-0"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}
